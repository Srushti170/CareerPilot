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
