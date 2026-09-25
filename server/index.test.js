import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import request from 'supertest';

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'careerpilot-tests-'));
process.env.CAREERPILOT_DATA_DIR = path.join(testRoot, 'data');
process.env.CAREERPILOT_REPORTS_DIR = path.join(testRoot, 'reports');
process.env.MONGODB_URI = '';
process.env.NODE_ENV = 'test';

const { app } = await import('./index.js');

async function registerAndLogin(role, email) {
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: `${role} user`,
      email,
      password: 'password123',
      role,
    });

  assert.equal(registerResponse.status, 201);
  assert.ok(registerResponse.body.sessionToken);
  return registerResponse.body.sessionToken;
}

async function registerAccount(role, email, name = `${role} user`) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123', role });
  assert.equal(response.status, 201);
  return response.body;
}

test('protected route rejects unauthenticated access', async () => {
  const response = await request(app).get('/api/applications');
  assert.equal(response.status, 401);
});

test('register and session restore work for student', async () => {
  const sessionToken = await registerAndLogin('student', 'student1@example.com');

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${sessionToken}`);

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.user.email, 'student1@example.com');
  assert.equal(meResponse.body.user.role, 'student');
});

test('student cannot update recruiter job inventory', async () => {
  const sessionToken = await registerAndLogin('student', 'student2@example.com');

  const response = await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${sessionToken}`)
    .send({ jobs: [] });

  assert.equal(response.status, 403);
});

test('recruiter can update jobs with valid payload', async () => {
  const sessionToken = await registerAndLogin('recruiter', 'recruiter1@example.com');

  const response = await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${sessionToken}`)
    .send({
      jobs: [
        {
          id: 'job-1',
          company: 'Example Co',
          title: 'Backend Engineer',
        },
      ],
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

test('validation rejects malformed applications payload', async () => {
  const sessionToken = await registerAndLogin('student', 'student3@example.com');

  const response = await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${sessionToken}`)
    .send({ applications: { not: 'an-array' } });

  assert.equal(response.status, 400);
});

test('bootstrap never exposes or accepts account-scoped storage', async () => {
  const sessionToken = await registerAndLogin('student', 'storage-scope@example.com');
  await request(app)
    .post('/api/storage/bulk')
    .set('Authorization', `Bearer ${sessionToken}`)
    .send({ entries: {
      'careerpilot_resume_versions:another-user': '[{"secret":"private resume"}]',
      'careerpilot_settings:another-user': '{"secret":"private setting"}',
      careerpilot_theme: 'dark',
    } })
    .expect(200);

  const bootstrap = await request(app).get('/api/bootstrap').expect(200);
  assert.deepEqual(bootstrap.body.storage, { careerpilot_theme: 'dark' });
});

test('recreated recruiter account can see applications owned by the same email', async () => {
  const studentToken = await registerAndLogin('student', 'ownership-student@example.com');
  const recruiterToken = await registerAndLogin('recruiter', 'ownership-recruiter@example.com');

  const saveResponse = await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${studentToken}`)
    .send({
      applications: [
        {
          id: 'ownership-application-1',
          jobId: 'ownership-job-1',
          recruiterId: 'stale-recruiter-id',
          recruiterEmail: 'ownership-recruiter@example.com',
          company: 'Ownership Co',
          role: 'Backend Engineer',
          status: 'Applied',
        },
      ],
    });

  assert.equal(saveResponse.status, 200);

  const recruiterApplications = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${recruiterToken}`);

  assert.equal(recruiterApplications.status, 200);
  assert.equal(recruiterApplications.body.length, 1);
  assert.equal(recruiterApplications.body[0].id, 'ownership-application-1');
  assert.equal(recruiterApplications.body[0].studentEmail, 'ownership-student@example.com');
});

test('student profiles remain isolated between accounts', async () => {
  const studentA = await registerAccount('student', 'profile-a@example.com', 'Profile A');
  const studentB = await registerAccount('student', 'profile-b@example.com', 'Profile B');

  const saveA = await request(app)
    .put('/api/student-profile')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .send({ profile: { university: 'University A', degree: 'Computer Science', skills: ['React'] } });
  assert.equal(saveA.status, 200);

  const profileA = await request(app)
    .get('/api/student-profile')
    .set('Authorization', `Bearer ${studentA.sessionToken}`);
  const profileB = await request(app)
    .get('/api/student-profile')
    .set('Authorization', `Bearer ${studentB.sessionToken}`);

  assert.equal(profileA.body.university, 'University A');
  assert.deepEqual(profileA.body.skills, ['React']);
  assert.equal(profileB.body.university, '');
  assert.deepEqual(profileB.body.skills, []);
});

test('jobs, applications, status updates, and notifications stay owner-scoped', async () => {
  const recruiterA = await registerAccount('recruiter', 'flow-recruiter-a@example.com', 'Recruiter A');
  const recruiterB = await registerAccount('recruiter', 'flow-recruiter-b@example.com', 'Recruiter B');
  const studentA = await registerAccount('student', 'flow-student-a@example.com', 'Student A');
  const studentB = await registerAccount('student', 'flow-student-b@example.com', 'Student B');

  const saveJobA = await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .send({ jobs: [{ id: 'flow-job-a', company: 'Company A', title: 'Backend Engineer', status: 'Active' }] });
  assert.equal(saveJobA.status, 200);

  const saveJobB = await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${recruiterB.sessionToken}`)
    .send({ jobs: [{ id: 'flow-job-b', company: 'Company B', title: 'Data Analyst', status: 'Active' }] });
  assert.equal(saveJobB.status, 200);

  const submitApplication = await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .send({
      applications: [{
        id: 'flow-application-a',
        jobId: 'flow-job-a',
        recruiterId: 'forged-id',
        recruiterEmail: 'flow-recruiter-b@example.com',
        company: 'Company A',
        role: 'Backend Engineer',
        status: 'Applied',
      }],
    });
  assert.equal(submitApplication.status, 200);

  const recruiterAApplications = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`);
  const recruiterBApplications = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${recruiterB.sessionToken}`);
  const studentBApplications = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${studentB.sessionToken}`);

  assert.equal(recruiterAApplications.body.length, 1);
  assert.equal(recruiterAApplications.body[0].recruiterId, recruiterA.user.id);
  assert.equal(recruiterAApplications.body[0].studentId, studentA.user.id);
  assert.equal(recruiterBApplications.body.length, 0);
  assert.equal(studentBApplications.body.length, 0);

  const unauthorizedClaim = await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${recruiterB.sessionToken}`)
    .send({ applications: [{ ...recruiterAApplications.body[0], status: 'Rejected' }] });
  assert.equal(unauthorizedClaim.status, 200);
  assert.equal(unauthorizedClaim.body.count, 0);

  const updateStatus = await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .send({ applications: [{ ...recruiterAApplications.body[0], status: 'Interview' }] });
  assert.equal(updateStatus.status, 200);

  const studentAApplications = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${studentA.sessionToken}`);
  assert.equal(studentAApplications.body[0].status, 'Interview');

  const saveNotification = await request(app)
    .put('/api/notifications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .send({
      notifications: [{
        id: 'flow-notification-a',
        title: 'Application status updated',
        desc: 'Your application moved to Interview.',
        type: 'application_status',
        sourceId: 'flow-application-a',
        recipientId: studentA.user.id,
        recipientEmail: studentA.user.email,
        recipientRole: 'student',
        read: false,
      }],
    });
  assert.equal(saveNotification.status, 200);

  const studentANotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${studentA.sessionToken}`);
  const studentBNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${studentB.sessionToken}`);
  const recruiterNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`);

  assert.equal(studentANotifications.body.some((entry) => entry.id === 'flow-notification-a'), true);
  assert.equal(studentBNotifications.body.some((entry) => entry.id === 'flow-notification-a'), false);
  assert.equal(recruiterNotifications.body.some((entry) => entry.id === 'flow-notification-a'), false);
});

test('logout invalidates the Mongo-backed session token', async () => {
  const account = await registerAccount('student', 'logout-session@example.com');
  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${account.sessionToken}`)
    .send({ token: account.sessionToken });
  assert.equal(logout.status, 200);

  const me = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${account.sessionToken}`);
  assert.equal(me.status, 401);
});
