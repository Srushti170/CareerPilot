import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const testDbName = process.env.CAREERPILOT_MONGO_TEST_DB;
if (!process.env.MONGODB_URI || !testDbName?.startsWith('careerpilot_test_')) {
  throw new Error('Set MONGODB_URI and a CAREERPILOT_MONGO_TEST_DB beginning with careerpilot_test_.');
}

process.env.NODE_ENV = 'test';
process.env.MONGODB_DB_NAME = testDbName;

const setupClient = await MongoClient.connect(process.env.MONGODB_URI);
const setupDb = setupClient.db(testDbName);
await setupDb.collection('student_profiles').createIndex({ userId: 1 });
await setupDb.collection('student_profiles').insertMany([
  { userId: 'legacy-duplicate', email: 'legacy-one@example.com' },
  { userId: 'legacy-duplicate', email: 'legacy-two@example.com' },
  { _id: 'primary', userId: 'legacy-owner', email: 'legacy-owner@example.com', university: 'Legacy University' },
]);
await setupClient.close();

const { app, closeDatabaseConnection } = await import('./index.js');

async function register(role, email, name) {
  const response = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123', role });
  assert.equal(response.status, 201);
  return response.body;
}

after(async () => {
  await closeDatabaseConnection();
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  await client.db(testDbName).dropDatabase();
  await client.close();
});

test('MongoDB persists isolated profiles, jobs, applications, notifications, and sessions', async () => {
  const recruiterA = await register('recruiter', 'mongo-recruiter-a@example.com', 'Mongo Recruiter A');
  const recruiterB = await register('recruiter', 'mongo-recruiter-b@example.com', 'Mongo Recruiter B');
  const studentA = await register('student', 'mongo-student-a@example.com', 'Mongo Student A');
  const studentB = await register('student', 'mongo-student-b@example.com', 'Mongo Student B');

  await request(app)
    .put('/api/student-profile')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .send({ profile: { university: 'Mongo University A', skills: ['Node.js'] } })
    .expect(200);

  await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .send({ jobs: [{ id: 'mongo-job-a', company: 'Mongo Company A', title: 'API Engineer', status: 'Active' }] })
    .expect(200);
  await request(app)
    .put('/api/jobs')
    .set('Authorization', `Bearer ${recruiterB.sessionToken}`)
    .send({ jobs: [{ id: 'mongo-job-b', company: 'Mongo Company B', title: 'Data Engineer', status: 'Active' }] })
    .expect(200);

  const createdAt = new Date().toISOString();
  await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .send({ applications: [{
      id: 'mongo-application-a',
      jobId: 'mongo-job-a',
      company: 'Mongo Company A',
      role: 'API Engineer',
      status: 'Applied',
      createdAt,
      recruiterId: recruiterB.user.id,
      recruiterEmail: recruiterB.user.email,
    }] })
    .expect(200);

  await request(app)
    .put('/api/applications')
    .set('Authorization', `Bearer ${studentB.sessionToken}`)
    .send({ applications: [{
      id: 'mongo-application-b',
      jobId: 'mongo-job-b',
      company: 'Mongo Company B',
      role: 'Data Engineer',
      status: 'Applied',
    }] })
    .expect(200);

  const recruiterAApps = await request(app)
    .get('/api/applications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .expect(200);
  assert.deepEqual(recruiterAApps.body.map((entry) => entry.id), ['mongo-application-a']);
  assert.equal(recruiterAApps.body[0].recruiterId, recruiterA.user.id);
  assert.equal(recruiterAApps.body[0].createdAt, createdAt);

  await request(app)
    .put('/api/notifications')
    .set('Authorization', `Bearer ${recruiterA.sessionToken}`)
    .send({ notifications: [{
      id: 'mongo-notification-a',
      sourceId: 'mongo-application-a',
      title: 'Interview update',
      recipientId: studentA.user.id,
      recipientEmail: studentA.user.email,
      recipientRole: 'student',
      read: false,
      createdAt,
    }] })
    .expect(200);

  const studentANotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .expect(200);
  const studentBNotifications = await request(app)
    .get('/api/notifications')
    .set('Authorization', `Bearer ${studentB.sessionToken}`)
    .expect(200);
  assert.equal(studentANotifications.body[0].id, 'mongo-notification-a');
  assert.equal(studentANotifications.body[0].createdAt, createdAt);
  assert.equal(studentBNotifications.body.length, 0);

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(testDbName);
  assert.equal(await db.collection('applications').countDocuments(), 2);
  assert.equal(await db.collection('jobs').countDocuments(), 2);
  assert.equal(await db.collection('student_profiles').countDocuments({ userId: studentA.user.id }), 1);
  assert.equal(await db.collection('student_profiles').countDocuments({ userId: studentB.user.id }), 1);
  assert.equal(await db.collection('student_profiles').countDocuments({ userId: 'legacy-duplicate' }), 2);
  assert.equal(await db.collection('student_profiles').countDocuments({ _id: 'primary' }), 1);
  const migratedProfile = await db.collection('student_profiles').findOne({ userId: 'legacy-owner' });
  assert.equal(migratedProfile.university, 'Legacy University');
  const profileIndex = (await db.collection('student_profiles').indexes()).find((index) => index.name === 'userId_1');
  assert.equal(Boolean(profileIndex.unique), false);
  await client.close();

  await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .send({ token: studentA.sessionToken })
    .expect(200);
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${studentA.sessionToken}`)
    .expect(401);
});
