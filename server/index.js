import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'server', 'data');
const reportsDir = path.join(rootDir, 'server', 'reports');
const dbPath = path.join(dataDir, 'db.json');
const port = Number(process.env.API_PORT || 8787);
const mongoUri = process.env.MONGODB_URI || '';
const mongoDbName = process.env.MONGODB_DB_NAME || 'careerpilot';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const geminiModel = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const serverAi = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
let mongoClientPromise = null;
let mongoConnectionState = mongoUri ? 'pending' : 'disabled';
const PROFILE_DOCUMENT_ID = 'primary';

const COLLECTIONS = {
  storage: 'app_storage',
  users: 'users',
  sessions: 'sessions',
  applications: 'applications',
  notifications: 'notifications',
  jobs: 'jobs',
  companies: 'companies',
  students: 'students',
  announcements: 'announcements',
  studentProfiles: 'student_profiles',
  payments: 'payments',
  emails: 'emails',
  calendarEvents: 'calendar_events',
  reports: 'reports',
};

const COLLECTION_STORAGE_KEY_MAP = {
  careerpilot_applications: 'applications',
  careerpilot_notifications: 'notifications',
  careerpilot_jobs: 'jobs',
  careerpilot_companies: 'companies',
  careerpilot_students: 'students',
  careerpilot_announcements: 'announcements',
  careerpilot_student_profile: 'studentProfile',
};

const DERIVED_STORAGE_KEYS = new Set([
  'careerpilot_applications',
  'careerpilot_notifications',
  'careerpilot_jobs',
  'careerpilot_companies',
  'careerpilot_students',
  'careerpilot_announcements',
  'careerpilot_student_profile',
  'careerpilot_student_onboarding_complete',
]);

const BLOCKED_STORAGE_KEYS = new Set(['careerpilot_users']);

const DEFAULT_USERS = [];
const LEGACY_DEMO_EMAILS = new Set([]);

const DEFAULT_STORAGE = {};

const DEFAULT_APPLICATIONS = [];
const DEFAULT_NOTIFICATIONS = [];
const DEFAULT_JOBS = [];
const DEFAULT_COMPANIES = [];
const DEFAULT_STUDENTS = [];
const DEFAULT_ANNOUNCEMENTS = [];

const DEFAULT_STUDENT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  role: '',
  university: '',
  degree: '',
  branch: '',
  semester: '',
  location: '',
  summary: '',
  skills: [],
  gpa: '',
  coursework: '',
  graduation: '',
  projects: '',
  experience: '',
  achievements: '',
  certifications: '',
  responsibility: '',
  socials: {
    LinkedIn: { connected: false, handle: '' },
    GitHub: { connected: false, handle: '' },
    Portfolio: { connected: false, handle: '' },
  },
  codingProfiles: {
    LinkedIn: '',
    GitHub: '',
    Portfolio: '',
    LeetCode: '',
    CodeChef: '',
    HackerRank: '',
  },
  onboardingComplete: false,
};

function createDefaultDb() {
  return {
    users: DEFAULT_USERS.map(normalizeStoredUser),
    storage: DEFAULT_STORAGE,
    sessions: [],
    applications: DEFAULT_APPLICATIONS,
    notifications: DEFAULT_NOTIFICATIONS,
    jobs: DEFAULT_JOBS,
    companies: DEFAULT_COMPANIES,
    students: DEFAULT_STUDENTS,
    announcements: DEFAULT_ANNOUNCEMENTS,
    studentProfile: DEFAULT_STUDENT_PROFILE,
    payments: [],
    emails: [],
    calendarEvents: [],
    reports: [],
    oauth: {
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  };
}

const SEEDED_APPLICATION_KEYS = new Set([
  'google::software engineer intern::1',
  'amazon::aws cloud support::2',
  'meta::frontend developer::3',
]);

const SEEDED_NOTIFICATION_KEYS = new Set([
  'interview tomorrow::google interview scheduled at 10 am',
  'application update::amazon status updated to reviewing',
  'profile views::3 recruiters viewed your profile today',
]);

const SEEDED_JOB_IDS = new Set(['seed-google-sde', 'seed-stripe-frontend', 'seed-amazon-intern']);
const SEEDED_COMPANY_IDS = new Set(['company-google', 'company-microsoft', 'company-amazon', 'company-stripe']);
const SEEDED_STUDENT_IDS = new Set(['student-alex', 'student-sonia', 'student-rahul', 'student-mira']);
const SEEDED_ANNOUNCEMENT_IDS = new Set(['announcement-1', 'announcement-2']);

function sanitizeSeededApplications(applications = []) {
  return (Array.isArray(applications) ? applications : []).filter((entry = {}) => {
    const key = `${String(entry.company || '').toLowerCase()}::${String(entry.role || '').toLowerCase()}::${String(entry.id || '')}`;
    return !SEEDED_APPLICATION_KEYS.has(key);
  });
}

function sanitizeSeededNotifications(notifications = []) {
  return (Array.isArray(notifications) ? notifications : []).filter((entry = {}) => {
    const key = `${String(entry.title || '').toLowerCase()}::${String(entry.desc || '').toLowerCase()}`;
    return !SEEDED_NOTIFICATION_KEYS.has(key);
  });
}

function sanitizeSeededJobs(jobs = []) {
  return (Array.isArray(jobs) ? jobs : []).filter((entry = {}) => !SEEDED_JOB_IDS.has(String(entry.id || '')));
}

function sanitizeSeededCompanies(companies = []) {
  return (Array.isArray(companies) ? companies : []).filter((entry = {}) => !SEEDED_COMPANY_IDS.has(String(entry.id || '')));
}

function sanitizeSeededStudents(students = []) {
  return (Array.isArray(students) ? students : []).filter((entry = {}) => !SEEDED_STUDENT_IDS.has(String(entry.id || '')));
}

function sanitizeSeededAnnouncements(announcements = []) {
  return (Array.isArray(announcements) ? announcements : []).filter((entry = {}) => !SEEDED_ANNOUNCEMENT_IDS.has(String(entry.id || '')));
}

function isSeededStudentProfile(profile = {}) {
  return (
    String(profile?.email || '').toLowerCase() === 'student@university.edu' &&
    String(profile?.name || '') === 'Alex Rivera'
  );
}

function sanitizeStudentProfile(profile = {}) {
  if (!profile || typeof profile !== 'object' || isSeededStudentProfile(profile)) {
    return { ...DEFAULT_STUDENT_PROFILE };
  }
  return profile;
}

function sanitizeDemoContent(db = {}) {
  return {
    ...db,
    applications: sanitizeSeededApplications(db.applications),
    notifications: sanitizeSeededNotifications(db.notifications),
    jobs: sanitizeSeededJobs(db.jobs),
    companies: sanitizeSeededCompanies(db.companies),
    students: sanitizeSeededStudents(db.students),
    announcements: sanitizeSeededAnnouncements(db.announcements),
    studentProfile: sanitizeStudentProfile(db.studentProfile),
  };
}

function getStorageProvider() {
  return mongoConnectionState === 'connected' ? 'mongodb' : 'json-file';
}

async function getMongoCollection() {
  if (!mongoUri) return null;

  if (!mongoClientPromise) {
    mongoClientPromise = MongoClient.connect(mongoUri, {
      maxPoolSize: 10,
    }).catch((error) => {
      mongoConnectionState = 'disabled';
      mongoClientPromise = null;
      console.error('MongoDB connection failed, using JSON fallback:', error.message);
      return null;
    });
  }

  const client = await mongoClientPromise;
  if (!client) return null;
  mongoConnectionState = 'connected';
  return client.db(mongoDbName);
}

function stripMongoMeta(document = {}) {
  const { _id, createdAt, updatedAt, ...rest } = document || {};
  return rest;
}

async function ensureMongoIndexes(db) {
  await Promise.all([
    db.collection(COLLECTIONS.storage).createIndex({ key: 1 }, { unique: true }),
    db.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true }),
    db.collection(COLLECTIONS.sessions).createIndex({ token: 1 }, { unique: true }),
    db.collection(COLLECTIONS.sessions).createIndex({ userId: 1 }),
  ]);
}

async function readFileSeedDb() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    const raw = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return createDefaultDb();
  }
}

function getPersistedStorageEntries(storage = {}) {
  return Object.entries(storage)
    .filter(([key]) => !DERIVED_STORAGE_KEYS.has(key) && !BLOCKED_STORAGE_KEYS.has(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }));
}

async function replaceMongoCollection(db, name, docs = []) {
  const collection = db.collection(COLLECTIONS[name]);
  await collection.deleteMany({});
  if (docs.length > 0) {
    await collection.insertMany(docs);
  }
}

async function replaceMongoSingleton(db, name, document = {}) {
  await db.collection(COLLECTIONS[name]).replaceOne(
    { _id: PROFILE_DOCUMENT_ID },
    { _id: PROFILE_DOCUMENT_ID, ...document },
    { upsert: true }
  );
}

async function replaceMongoStorage(db, storage = {}) {
  const collection = db.collection(COLLECTIONS.storage);
  await collection.deleteMany({});
  const entries = getPersistedStorageEntries(storage);
  if (entries.length > 0) {
    await collection.insertMany(entries);
  }
}

async function persistUser(user = {}) {
  if (!mongoUri) return;
  const mongoDb = await getMongoCollection();
  if (!mongoDb) return;
  await mongoDb.collection(COLLECTIONS.users).replaceOne(
    { id: user.id },
    normalizeStoredUser(user),
    { upsert: true }
  );
}

async function seedMongoDatabase(db, seedState = createDefaultDb()) {
  const normalized = sanitizeDemoContent({
    ...createDefaultDb(),
    ...seedState,
    users: Array.isArray(seedState.users)
      ? seedState.users.map(normalizeStoredUser)
      : parseUsersFromStorage(seedState.storage || DEFAULT_STORAGE),
  });

  await replaceMongoCollection(db, 'users', normalized.users);
  await replaceMongoCollection(db, 'sessions', normalized.sessions || []);
  await replaceMongoCollection(db, 'applications', normalized.applications || []);
  await replaceMongoCollection(db, 'notifications', normalized.notifications || []);
  await replaceMongoCollection(db, 'jobs', normalized.jobs || []);
  await replaceMongoCollection(db, 'companies', normalized.companies || []);
  await replaceMongoCollection(db, 'students', normalized.students || []);
  await replaceMongoCollection(db, 'announcements', normalized.announcements || []);
  await replaceMongoCollection(db, 'payments', normalized.payments || []);
  await replaceMongoCollection(db, 'emails', normalized.emails || []);
  await replaceMongoCollection(db, 'calendarEvents', normalized.calendarEvents || []);
  await replaceMongoCollection(db, 'reports', normalized.reports || []);
  await replaceMongoSingleton(db, 'studentProfiles', normalized.studentProfile || DEFAULT_STUDENT_PROFILE);
  await replaceMongoStorage(db, normalized.storage || {});
}

async function readMongoCollectionDocs(db, name) {
  return db.collection(COLLECTIONS[name]).find({}).toArray();
}

async function readMongoStorage(db) {
  const entries = await db.collection(COLLECTIONS.storage).find({}).toArray();
  return entries.reduce((acc, entry) => {
    if (entry?.key && !BLOCKED_STORAGE_KEYS.has(entry.key)) {
      acc[entry.key] = typeof entry.value === 'string' ? entry.value : JSON.stringify(entry.value);
    }
    return acc;
  }, {});
}

let ensureDbPromise = null;
function ensureDb() {
  if (!ensureDbPromise) {
    ensureDbPromise = doEnsureDb().catch((err) => {
      ensureDbPromise = null;
      throw err;
    });
  }
  return ensureDbPromise;
}

async function doEnsureDb() {
  await fs.mkdir(reportsDir, { recursive: true });
  if (mongoUri) {
    const mongoDb = await getMongoCollection();
    if (mongoDb) {
      await ensureMongoIndexes(mongoDb);
      const isSeeded = await mongoDb.collection(COLLECTIONS.jobs).countDocuments({}, { limit: 1 });
      if (!isSeeded) {
        const seedDb = await readFileSeedDb();
        await seedMongoDatabase(mongoDb, seedDb);
      }
      return;
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(createDefaultDb(), null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  let parsed;
  if (mongoUri) {
    const mongoDb = await getMongoCollection();
    if (mongoDb) {
      const [
        storage,
        users,
        sessions,
        applications,
        notifications,
        jobs,
        companies,
        students,
        announcements,
        payments,
        emails,
        calendarEvents,
        reports,
        studentProfiles,
      ] = await Promise.all([
        readMongoStorage(mongoDb),
        readMongoCollectionDocs(mongoDb, 'users'),
        readMongoCollectionDocs(mongoDb, 'sessions'),
        readMongoCollectionDocs(mongoDb, 'applications'),
        readMongoCollectionDocs(mongoDb, 'notifications'),
        readMongoCollectionDocs(mongoDb, 'jobs'),
        readMongoCollectionDocs(mongoDb, 'companies'),
        readMongoCollectionDocs(mongoDb, 'students'),
        readMongoCollectionDocs(mongoDb, 'announcements'),
        readMongoCollectionDocs(mongoDb, 'payments'),
        readMongoCollectionDocs(mongoDb, 'emails'),
        readMongoCollectionDocs(mongoDb, 'calendarEvents'),
        readMongoCollectionDocs(mongoDb, 'reports'),
        readMongoCollectionDocs(mongoDb, 'studentProfiles'),
      ]);

      parsed = {
        storage,
        users: users.map(stripMongoMeta).map(normalizeStoredUser),
        sessions: sessions.map(stripMongoMeta),
        applications: applications.map(stripMongoMeta),
        notifications: notifications.map(stripMongoMeta),
        jobs: jobs.map(stripMongoMeta),
        companies: companies.map(stripMongoMeta),
        students: students.map(stripMongoMeta),
        announcements: announcements.map(stripMongoMeta),
        payments: payments.map(stripMongoMeta),
        emails: emails.map(stripMongoMeta),
        calendarEvents: calendarEvents.map(stripMongoMeta),
        reports: reports.map(stripMongoMeta),
        studentProfile: stripMongoMeta(studentProfiles[0] || DEFAULT_STUDENT_PROFILE),
      };
    }
  }

  if (!parsed) {
    const raw = await fs.readFile(dbPath, 'utf8');
    parsed = JSON.parse(raw);
  }
  const db = sanitizeDemoContent({
    ...createDefaultDb(),
    ...parsed,
    storage: { ...DEFAULT_STORAGE, ...(parsed.storage || {}) },
    users: Array.isArray(parsed.users) ? parsed.users.map(normalizeStoredUser) : parseUsersFromStorage(parsed.storage || DEFAULT_STORAGE),
    applications: Array.isArray(parsed.applications) ? parsed.applications : DEFAULT_APPLICATIONS,
    notifications: Array.isArray(parsed.notifications) ? parsed.notifications : DEFAULT_NOTIFICATIONS,
    jobs: Array.isArray(parsed.jobs) ? parsed.jobs : DEFAULT_JOBS,
    companies: Array.isArray(parsed.companies) ? parsed.companies : DEFAULT_COMPANIES,
    students: Array.isArray(parsed.students) ? parsed.students : DEFAULT_STUDENTS,
    announcements: Array.isArray(parsed.announcements) ? parsed.announcements : DEFAULT_ANNOUNCEMENTS,
    studentProfile: parsed.studentProfile || DEFAULT_STUDENT_PROFILE,
  });
  syncUsersToStorage(db, db.users);
  syncCollectionStorage(db);
  sanitizeAuthStorage(db);
  return db;
}

let writeDbPromise = Promise.resolve();

// Database lock to prevent concurrent write operations
let dbLock = Promise.resolve();

async function withDbLock(operation) {
  // Wait for any previous operation to complete
  let releaseLock = () => {};
  const locked = new Promise((resolve) => {
    releaseLock = resolve;
  });

  // Chain the lock
  const release = () => {
    releaseLock();
  };

  // Wait for previous lock to release, then execute operation
  await dbLock;
  dbLock = new Promise((resolve) => {
    releaseLock = resolve;
  });

  try {
    return await operation();
  } finally {
    // Release the lock
    dbLock = Promise.resolve();
    releaseLock();
  }
}

async function writeDb(db) {
  const writeOperation = async () => {
    await ensureDb();
    const sanitizedDb = sanitizeDemoContent(db);
    if (mongoUri) {
      const mongoDb = await getMongoCollection();
      if (mongoDb) {
        await replaceMongoCollection(mongoDb, 'sessions', sanitizedDb.sessions || []);
        await replaceMongoCollection(mongoDb, 'applications', sanitizedDb.applications || []);
        await replaceMongoCollection(mongoDb, 'notifications', sanitizedDb.notifications || []);
        await replaceMongoCollection(mongoDb, 'jobs', sanitizedDb.jobs || []);
        await replaceMongoCollection(mongoDb, 'companies', sanitizedDb.companies || []);
        await replaceMongoCollection(mongoDb, 'students', sanitizedDb.students || []);
        await replaceMongoCollection(mongoDb, 'announcements', sanitizedDb.announcements || []);
        await replaceMongoCollection(mongoDb, 'payments', sanitizedDb.payments || []);
        await replaceMongoCollection(mongoDb, 'emails', sanitizedDb.emails || []);
        await replaceMongoCollection(mongoDb, 'calendarEvents', sanitizedDb.calendarEvents || []);
        await replaceMongoCollection(mongoDb, 'reports', sanitizedDb.reports || []);
        await replaceMongoSingleton(mongoDb, 'studentProfiles', sanitizedDb.studentProfile || DEFAULT_STUDENT_PROFILE);
        await replaceMongoStorage(mongoDb, sanitizedDb.storage || {});
        return sanitizedDb;
      }
    }

    await fs.writeFile(dbPath, JSON.stringify(sanitizedDb, null, 2), 'utf8');
    return sanitizedDb;
  };

  writeDbPromise = writeDbPromise.then(writeOperation).catch(writeOperation);
  return writeDbPromise;
}

const JWT_SECRET = process.env.JWT_SECRET || 'careerpilot-secret-key-12345';

function createSession(user) {
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  return {
    id: crypto.randomUUID(),
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
}

function isPasswordHashed(password = '') {
  return typeof password === 'string' && (password.startsWith('$2a$') || password.startsWith('$2b$'));
}

function hashPassword(password = '') {
  return bcrypt.hashSync(String(password), 10);
}

function verifyPassword(password = '', storedPassword = '') {
  if (!isPasswordHashed(storedPassword)) {
    if (typeof storedPassword === 'string' && storedPassword.startsWith('scrypt$')) {
      const [, salt, expectedKey] = storedPassword.split('$');
      if (!salt || !expectedKey) return false;
      const derivedKey = crypto.scryptSync(String(password), salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(expectedKey, 'hex'), Buffer.from(derivedKey, 'hex'));
    }
    return String(password) === String(storedPassword);
  }
  try {
    return bcrypt.compareSync(String(password), storedPassword);
  } catch (err) {
    return false;
  }
}

function normalizeStoredUser(user = {}) {
  return {
    ...user,
    password: isPasswordHashed(user.password) || String(user.password).startsWith('scrypt$')
      ? user.password
      : hashPassword(user.password || ''),
  };
}

function sanitizeUser(user = {}) {
  const { password, ...safeUser } = user || {};
  return safeUser;
}

function parseUsersFromStorage(storage = {}) {
  // Ignore legacy careerpilot_users in storage since we are using MongoDB and don't want to restore legacy demo users.
  return [];
}

function syncUsersToStorage(db, users) {
  db.users = users.map(normalizeStoredUser);
}

function updateUserInStorage(db, previousEmail, nextUser) {
  const users = Array.isArray(db.users) ? db.users : parseUsersFromStorage(db.storage);
  const updatedUsers = users.map((entry) => (
    entry.email.toLowerCase() === String(previousEmail || nextUser.email).toLowerCase()
      ? { ...entry, ...nextUser }
      : entry
  ));
  syncUsersToStorage(db, updatedUsers);
  return updatedUsers;
}

function parseStoredJsonValue(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function applyStorageValue(db, key, incomingValue) {
  if (BLOCKED_STORAGE_KEYS.has(key)) {
    delete db.storage[key];
    return;
  }

  const value = typeof incomingValue === 'string' ? incomingValue : JSON.stringify(incomingValue);
  db.storage[key] = value;

  switch (COLLECTION_STORAGE_KEY_MAP[key]) {
    case 'applications':
    case 'notifications':
    case 'jobs':
    case 'companies':
    case 'students':
    case 'announcements':
      db[COLLECTION_STORAGE_KEY_MAP[key]] = Array.isArray(parseStoredJsonValue(value, []))
        ? parseStoredJsonValue(value, [])
        : [];
      break;
    case 'studentProfile':
      db.studentProfile = parseStoredJsonValue(value, DEFAULT_STUDENT_PROFILE) || DEFAULT_STUDENT_PROFILE;
      break;
    default:
      break;
  }

  if (key === 'careerpilot_student_onboarding_complete') {
    db.studentProfile = {
      ...(db.studentProfile || DEFAULT_STUDENT_PROFILE),
      onboardingComplete: Boolean(parseStoredJsonValue(value, false)),
    };
  }
}

function removeStorageValue(db, key) {
  delete db.storage[key];

  switch (COLLECTION_STORAGE_KEY_MAP[key]) {
    case 'applications':
    case 'notifications':
    case 'jobs':
    case 'companies':
    case 'students':
    case 'announcements':
      db[COLLECTION_STORAGE_KEY_MAP[key]] = [];
      break;
    case 'studentProfile':
      db.studentProfile = DEFAULT_STUDENT_PROFILE;
      break;
    default:
      break;
  }
}

function sanitizeAuthStorage(db) {
  if (!db.storage.careerpilot_current_user) return;

  try {
    const parsed = JSON.parse(db.storage.careerpilot_current_user);
    db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(parsed));
  } catch {
    delete db.storage.careerpilot_current_user;
  }
}

function syncCollectionStorage(db) {
  db.storage.careerpilot_applications = JSON.stringify(db.applications || []);
  db.storage.careerpilot_notifications = JSON.stringify(db.notifications || []);
  db.storage.careerpilot_jobs = JSON.stringify(db.jobs || []);
  db.storage.careerpilot_companies = JSON.stringify(db.companies || []);
  db.storage.careerpilot_students = JSON.stringify(db.students || []);
  db.storage.careerpilot_announcements = JSON.stringify(db.announcements || []);
  db.storage.careerpilot_student_profile = JSON.stringify(db.studentProfile || DEFAULT_STUDENT_PROFILE);
  db.storage.careerpilot_student_onboarding_complete = JSON.stringify(Boolean(db.studentProfile?.onboardingComplete));
}

function buildProviderStatus(db) {
  return {
    storage: {
      provider: getStorageProvider(),
      database: mongoUri ? mongoDbName : path.basename(dbPath),
      collection: mongoUri ? 'multiple-collections' : null,
    },
    auth: {
      local: true,
      googleOAuthConfigured: db.oauth.googleConfigured,
    },
    payment: {
      provider: process.env.RAZORPAY_KEY_ID ? 'razorpay-configured' : 'dev-order-provider',
    },
    email: {
      provider: process.env.SMTP_HOST ? 'smtp-configured' : 'server-outbox',
    },
    calendar: {
      provider: process.env.GOOGLE_CLIENT_ID ? 'google-calendar-ready' : 'server-calendar-store',
    },
    reports: {
      provider: 'server-pdf-generator',
    },
    ai: {
      provider: serverAi ? 'gemini-server' : 'not-configured',
    },
  };
}

function cleanJsonString(str = '') {
  return String(str).replace(/```json/i, '').replace(/```/g, '').trim();
}

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function sentenceList(values = []) {
  return values.map((item) => `- ${item}`).join('\n');
}

function buildJobContext(target = {}) {
  const job = target.job || {};
  const candidate = target.candidate || null;
  const parts = [
    `Company: ${job.company || 'Not shared'}`,
    `Role: ${job.title || 'Not shared'}`,
    `Location: ${job.location || 'Not shared'}`,
    `Role type: ${job.type || 'Not shared'}`,
    `Experience level: ${job.experience || 'Not shared'}`,
    `Short description: ${job.shortDescription || 'Not shared'}`,
    `Requirements:\n${sentenceList(job.requirements || []) || '- Not shared'}`,
    `Responsibilities:\n${sentenceList(job.description || []) || '- Not shared'}`,
    `Tags:\n${sentenceList(job.tags || []) || '- Not shared'}`,
  ];

  if (candidate) {
    parts.push(
      `Candidate summary: ${candidate.summary || 'Not shared'}`,
      `Candidate skills:\n${sentenceList(candidate.skills || []) || '- Not shared'}`,
      `Candidate projects:\n${sentenceList(candidate.projects || []) || '- Not shared'}`,
      `Candidate experience:\n${sentenceList(candidate.experience || []) || '- Not shared'}`,
      `Potential skill gaps:\n${sentenceList(candidate.missingSkills || []) || '- None identified'}`
    );
  }

  return parts.join('\n\n');
}

function getFallbackOpeningQuestion(target = {}) {
  const job = target.job || {};
  const requirement = job.requirements?.[0] || job.tags?.[0] || 'the core responsibilities of this role';
  return `Thanks for joining. To start, tell me why you are interested in the ${job.title || 'role'} role at ${job.company || 'this company'}, and how your background prepares you for ${requirement}.`;
}

function getFallbackFollowUpQuestion(target = {}, history = []) {
  const job = target.job || {};
  const asked = history.map((entry) => String(entry.question || '').toLowerCase());
  const pool = [
    `Tell me about a project where you used ${job.requirements?.[0] || job.tags?.[0] || 'the key skills required for this role'} in a practical way.`,
    `Which requirement in this job description feels strongest for you today, and what proof would you share with the hiring team?`,
    `What part of this role at ${job.company || 'this company'} would stretch you the most, and how would you close that gap quickly?`,
    `Imagine you join this team next month. What would your first 30 days look like?`,
    `How would you explain one technical decision from a recent project to a non-technical stakeholder?`,
  ];
  return pool.find((question) => !asked.includes(question.toLowerCase())) || pool[pool.length - 1];
}

function buildFallbackFeedback(target = {}, qaHistory = []) {
  const answers = qaHistory.map((entry) => entry.answer || '');
  const wordCounts = answers.map((answer) => normalizeText(answer).split(/\s+/).filter(Boolean).length);
  const averageWords = wordCounts.length
    ? Math.round(wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length)
    : 0;
  const coverage = Math.min(15, answers.filter(Boolean).length * 3);
  const score = Math.max(58, Math.min(96, 62 + coverage + Math.round(averageWords / 8)));

  return {
    score,
    summary: `You completed a live job-based mock interview for ${target?.job?.title || 'this role'} at ${target?.job?.company || 'the company'}. Your next gains will come from sharper examples, stronger metrics, and tighter alignment to the job description.`,
    strengths: [
      averageWords >= 45 ? 'You gave detailed answers with enough context to sound interview-ready.' : 'You stayed concise and easy to follow.',
      'You completed a realistic spoken interview flow with role-specific prompts.',
      target?.candidate?.matchScore ? `Your answers can build on an existing ${target.candidate.matchScore}% resume match.` : 'You have a strong base to tailor answers more tightly to the role.',
    ].filter(Boolean).slice(0, 3),
    weakAreas: [
      averageWords < 30 ? 'Add more depth, examples, and outcomes to each answer.' : 'Add clearer metrics, business impact, and trade-offs to each answer.',
      target?.job?.missingSkills?.[0] ? `Prepare a stronger story for ${target.job.missingSkills[0]} or explain your learning plan.` : 'Tie each answer back to the company and role more explicitly.',
      'Use a consistent answer structure like situation, action, result, and reflection.',
    ].slice(0, 3),
  };
}

function escapePdfText(value = '') {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines = []) {
  const safeLines = lines.length > 0 ? lines : ['CareerPilot Report'];
  const content = ['BT', '/F1 12 Tf', '50 780 Td'];
  safeLines.forEach((line, index) => {
    if (index > 0) {
      content.push('0 -18 Td');
    }
    content.push(`(${escapePdfText(line)}) Tj`);
  });
  content.push('ET');
  const stream = content.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use('/reports', express.static(reportsDir));

app.get('/api/health', async (_req, res) => {
  const db = await readDb();
  res.json({ ok: true, storageKeys: Object.keys(db.storage).length, providers: buildProviderStatus(db) });
});

app.get('/api/bootstrap', async (_req, res) => {
  const db = await readDb();
  res.json({ storage: db.storage, providers: buildProviderStatus(db) });
});

app.put('/api/storage/:key', async (req, res) => {
  const db = await readDb();
  applyStorageValue(db, req.params.key, req.body.value);
  syncUsersToStorage(db, db.users || parseUsersFromStorage(db.storage));
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/storage/bulk', async (req, res) => {
  const db = await readDb();
  const entries = req.body.entries || {};
  Object.entries(entries).forEach(([key, value]) => {
    applyStorageValue(db, key, value);
  });
  syncUsersToStorage(db, db.users || parseUsersFromStorage(db.storage));
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, updated: Object.keys(entries).length });
});

app.delete('/api/storage/:key', async (req, res) => {
  const db = await readDb();
  removeStorageValue(db, req.params.key);
  syncUsersToStorage(db, db.users || parseUsersFromStorage(db.storage));
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true });
});

app.get('/api/applications', async (_req, res) => {
  const db = await readDb();
  res.json(db.applications);
});

app.put('/api/applications', async (req, res) => {
  const db = await readDb();
  db.applications = Array.isArray(req.body) ? req.body : Array.isArray(req.body.applications) ? req.body.applications : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.applications.length });
});

app.get('/api/notifications', async (_req, res) => {
  const db = await readDb();
  res.json(db.notifications);
});

app.put('/api/notifications', async (req, res) => {
  const db = await readDb();
  db.notifications = Array.isArray(req.body) ? req.body : Array.isArray(req.body.notifications) ? req.body.notifications : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.notifications.length });
});

app.get('/api/jobs', async (_req, res) => {
  const db = await readDb();
  res.json(db.jobs);
});

app.put('/api/jobs', async (req, res) => {
  const db = await readDb();
  db.jobs = Array.isArray(req.body) ? req.body : Array.isArray(req.body.jobs) ? req.body.jobs : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.jobs.length });
});

app.get('/api/companies', async (_req, res) => {
  const db = await readDb();
  res.json(db.companies);
});

app.put('/api/companies', async (req, res) => {
  const db = await readDb();
  db.companies = Array.isArray(req.body) ? req.body : Array.isArray(req.body.companies) ? req.body.companies : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.companies.length });
});

app.get('/api/students', async (_req, res) => {
  const db = await readDb();
  res.json(db.students);
});

app.put('/api/students', async (req, res) => {
  const db = await readDb();
  db.students = Array.isArray(req.body) ? req.body : Array.isArray(req.body.students) ? req.body.students : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.students.length });
});

app.get('/api/announcements', async (_req, res) => {
  const db = await readDb();
  res.json(db.announcements);
});

app.put('/api/announcements', async (req, res) => {
  const db = await readDb();
  db.announcements = Array.isArray(req.body) ? req.body : Array.isArray(req.body.announcements) ? req.body.announcements : [];
  syncCollectionStorage(db);
  await writeDb(db);
  res.json({ ok: true, count: db.announcements.length });
});

app.get('/api/student-profile', async (_req, res) => {
  const db = await readDb();
  res.json(db.studentProfile);
});

app.put('/api/student-profile', async (req, res) => {
  await withDbLock(async () => {
    const db = await readDb();
    db.studentProfile = req.body?.profile || req.body || DEFAULT_STUDENT_PROFILE;
    syncCollectionStorage(db);
    await writeDb(db);
  });
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  let result, status = 200;
  await withDbLock(async () => {
    const db = await readDb();
    const users = db.users || parseUsersFromStorage(db.storage);
    const { email, password, role } = req.body;
    const user = users.find(
      (entry) =>
        entry.email.toLowerCase() === String(email || '').toLowerCase() &&
        verifyPassword(password, entry.password) &&
        entry.role === role
    );

    if (!user) {
      status = 401;
      result = { error: 'Invalid email, password, or role.' };
      return;
    }

    const session = createSession(user);
    db.sessions = [...db.sessions.filter((entry) => entry.userId !== user.id), session];
    db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(user));
    db.storage.careerpilot_session_token = session.token;
    await writeDb(db);
    result = { user: sanitizeUser(user), sessionToken: session.token };
  });
  return res.status(status).json(result);
});

app.post('/api/auth/register', async (req, res) => {
  let result, status = 201;
  await withDbLock(async () => {
    const db = await readDb();
    const users = db.users || parseUsersFromStorage(db.storage);
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
      status = 409;
      result = { error: 'An account with this email already exists.' };
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name: String(name || '').trim(),
      email: normalizedEmail,
      password: hashPassword(password),
      role,
    };
    const updatedUsers = [...users, user];
    syncUsersToStorage(db, updatedUsers);
    db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(user));
    const session = createSession(user);
    db.sessions.push(session);
    db.storage.careerpilot_session_token = session.token;
    await persistUser(user);
    await writeDb(db);
    result = { user: sanitizeUser(user), sessionToken: session.token };
  });
  return res.status(status).json(result);
});

app.get('/api/auth/me', async (req, res) => {
  const db = await readDb();
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token || db.storage.careerpilot_session_token;
  if (!token) {
    return res.status(401).json({ error: 'No active session.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = (db.users || parseUsersFromStorage(db.storage)).find(
      (entry) => entry.id === decoded.id || entry.email.toLowerCase() === decoded.email.toLowerCase()
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (jwtError) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  const db = await readDb();
  const { currentEmail, name, email } = req.body;
  const users = db.users || parseUsersFromStorage(db.storage);
  const existingUser = users.find((entry) => entry.email.toLowerCase() === String(currentEmail || '').toLowerCase());

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const normalizedEmail = String(email || existingUser.email).trim().toLowerCase();
  const emailTaken = users.some(
    (entry) =>
      entry.email.toLowerCase() === normalizedEmail &&
      entry.email.toLowerCase() !== existingUser.email.toLowerCase()
  );

  if (emailTaken) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const updatedUser = {
    ...existingUser,
    name: String(name || existingUser.name).trim(),
    email: normalizedEmail,
  };

  updateUserInStorage(db, existingUser.email, updatedUser);
  db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(updatedUser));
  if (db.studentProfile?.email?.toLowerCase() === existingUser.email.toLowerCase()) {
    db.studentProfile = {
      ...db.studentProfile,
      name: updatedUser.name,
      email: updatedUser.email,
    };
  }
  syncCollectionStorage(db);
  await persistUser(updatedUser);
  await writeDb(db);
  return res.json({ user: sanitizeUser(updatedUser) });
});

app.put('/api/auth/password', async (req, res) => {
  const db = await readDb();
  const { email, currentPassword, newPassword } = req.body;
  const users = db.users || parseUsersFromStorage(db.storage);
  const existingUser = users.find((entry) => entry.email.toLowerCase() === String(email || '').toLowerCase());

  if (!existingUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (!verifyPassword(currentPassword, existingUser.password)) {
    return res.status(400).json({ error: 'Incorrect current password.' });
  }

  const updatedUser = {
    ...existingUser,
    password: hashPassword(String(newPassword || '')),
  };

  updateUserInStorage(db, existingUser.email, updatedUser);
  if (db.storage.careerpilot_current_user) {
    try {
      const currentUser = JSON.parse(db.storage.careerpilot_current_user);
      if (currentUser.email?.toLowerCase() === existingUser.email.toLowerCase()) {
        db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(currentUser));
      }
    } catch {
      db.storage.careerpilot_current_user = JSON.stringify(sanitizeUser(updatedUser));
    }
  }
  await persistUser(updatedUser);
  await writeDb(db);
  return res.json({ ok: true });
});

app.post('/api/auth/logout', async (req, res) => {
  const db = await readDb();
  const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token || db.storage.careerpilot_session_token;
  db.sessions = db.sessions.filter((entry) => entry.token !== token);
  delete db.storage.careerpilot_current_user;
  delete db.storage.careerpilot_session_token;
  await writeDb(db);
  return res.json({ ok: true });
});

app.post('/api/integrations/payment/order', async (req, res) => {
  const db = await readDb();
  const order = {
    id: `order_${Date.now()}`,
    provider: process.env.RAZORPAY_KEY_ID ? 'razorpay-configured' : 'dev-order-provider',
    amount: req.body.amount || 0,
    currency: req.body.currency || 'INR',
    description: req.body.description || 'CareerPilot recruiter plan',
    status: 'created',
    createdAt: new Date().toISOString(),
  };
  db.payments.unshift(order);
  await writeDb(db);
  res.status(201).json(order);
});

app.post('/api/integrations/email/send', async (req, res) => {
  const db = await readDb();
  const email = {
    id: `email_${Date.now()}`,
    to: req.body.to,
    subject: req.body.subject,
    body: req.body.body,
    status: process.env.SMTP_HOST ? 'ready-to-send' : 'queued-in-outbox',
    createdAt: new Date().toISOString(),
  };
  db.emails.unshift(email);
  await writeDb(db);
  res.status(201).json(email);
});

app.post('/api/integrations/calendar/event', async (req, res) => {
  const db = await readDb();
  const event = {
    id: `event_${Date.now()}`,
    title: req.body.title,
    date: req.body.date,
    time: req.body.time,
    attendees: req.body.attendees || [],
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  db.calendarEvents.unshift(event);
  await writeDb(db);
  res.status(201).json(event);
});

app.post('/api/ai/interview/opening', async (req, res) => {
  const { target } = req.body || {};

  if (!serverAi) {
    return res.status(503).json({ error: 'AI interviewer is not configured on the server.' });
  }

  try {
    const response = await serverAi.models.generateContent({
      model: geminiModel,
      contents: `You are conducting a live mock interview.

Use the full role context below to ask exactly one opening interview question.
- The question must sound like a real interviewer speaking live.
- It must be specific to the company, role, and job description.
- It should invite the candidate to answer verbally in 60-120 seconds.
- Do not ask multiple questions at once.
- Return ONLY the question as plain text.

${buildJobContext(target)}`,
    });

    return res.json({ question: normalizeText(response.text) || getFallbackOpeningQuestion(target) });
  } catch (error) {
    console.error('AI opening question error:', error);
    return res.json({ question: getFallbackOpeningQuestion(target), fallback: true });
  }
});

app.post('/api/ai/interview/followup', async (req, res) => {
  const { target, qaHistory = [] } = req.body || {};

  if (!serverAi) {
    return res.status(503).json({ error: 'AI interviewer is not configured on the server.' });
  }

  const recentHistory = qaHistory.slice(-3).map((entry, index) => (
    `Round ${index + 1}\nQuestion: ${entry.question}\nAnswer: ${entry.answer || ''}`
  )).join('\n\n');

  try {
    const response = await serverAi.models.generateContent({
      model: geminiModel,
      contents: `You are conducting a live mock interview and need the next follow-up question.

Rules:
- Ask exactly one question.
- The question must adapt to the candidate's last answer.
- Keep it relevant to the job description and the candidate's background.
- Vary across motivation, technical depth, project evidence, communication, trade-offs, and behavioral judgment.
- Avoid repeating earlier questions.
- Return ONLY the next question as plain text.

Role context:
${buildJobContext(target)}

Conversation so far:
${recentHistory}`,
    });

    return res.json({ question: normalizeText(response.text) || getFallbackFollowUpQuestion(target, qaHistory) });
  } catch (error) {
    console.error('AI follow-up question error:', error);
    return res.json({ question: getFallbackFollowUpQuestion(target, qaHistory), fallback: true });
  }
});

app.post('/api/ai/interview/evaluate', async (req, res) => {
  const { target, qaHistory = [] } = req.body || {};

  if (!serverAi) {
    return res.status(503).json({ error: 'AI interviewer is not configured on the server.' });
  }

  try {
    const response = await serverAi.models.generateContent({
      model: geminiModel,
      contents: `You are evaluating a completed mock interview.

Assess the candidate on:
- communication and clarity
- job-specific relevance
- technical or functional depth
- confidence and structure
- awareness of trade-offs and impact

Role context:
${buildJobContext(target)}

Interview transcript:
${qaHistory.map((entry, index) => `Question ${index + 1}: ${entry.question}\nAnswer ${index + 1}: ${entry.answer || ''}`).join('\n\n')}

Return ONLY JSON:
{
  "score": 84,
  "summary": "2-3 sentence summary",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weakAreas": ["weak area 1", "weak area 2", "weak area 3"]
}`,
    });

    const parsed = JSON.parse(cleanJsonString(response.text || '{}'));
    if (typeof parsed.score === 'number' && parsed.summary) {
      return res.json({
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        summary: normalizeText(parsed.summary),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(normalizeText).filter(Boolean).slice(0, 3) : [],
        weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas.map(normalizeText).filter(Boolean).slice(0, 3) : [],
      });
    }
  } catch (error) {
    console.error('AI interview evaluation error:', error);
  }

  return res.json({ ...buildFallbackFeedback(target, qaHistory), fallback: true });
});

app.post('/api/ai/interview/transcribe', async (req, res) => {
  const { mimeType = 'audio/webm', data } = req.body || {};

  if (!serverAi) {
    return res.status(503).json({ error: 'AI interviewer is not configured on the server.' });
  }

  if (!data) {
    return res.status(400).json({ error: 'Audio data is required for transcription.' });
  }

  try {
    const response = await serverAi.models.generateContent({
      model: geminiModel,
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Transcribe this interview answer accurately. Return only the plain spoken transcript with no commentary.' },
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
      ],
    });

    return res.json({ transcript: normalizeText(response.text || '') });
  } catch (error) {
    console.error('AI transcription error:', error);
    return res.status(500).json({ error: 'Transcription failed for this recording.' });
  }
});

app.post('/api/reports/generate', async (req, res) => {
  const db = await readDb();
  const title = req.body.title || 'CareerPilot Placement Report';
  const lines = [
    title,
    `Generated: ${new Date().toLocaleString('en-US')}`,
    '',
    ...(req.body.lines || []),
  ];
  const pdf = buildSimplePdf(lines);
  const fileName = `report-${Date.now()}.pdf`;
  const filePath = path.join(reportsDir, fileName);
  await fs.writeFile(filePath, pdf, 'binary');

  const report = {
    id: `report_${Date.now()}`,
    title,
    fileName,
    filePath,
    createdAt: new Date().toISOString(),
  };
  db.reports.unshift(report);
  await writeDb(db);
  res.status(201).json(report);
});

app.get('/api/integrations/status', async (_req, res) => {
  const db = await readDb();
  res.json(buildProviderStatus(db));
});

async function startServer() {
  try {
    await ensureDb();

    if (getStorageProvider() === 'mongodb') {
      console.log(`MongoDB connected successfully to database "${mongoDbName}"`);
    } else if (mongoUri) {
      console.warn(`MongoDB connection unavailable. Falling back to local JSON storage at ${dbPath}`);
    } else {
      console.log(`MongoDB not configured. Using local JSON storage at ${dbPath}`);
    }

    app.listen(port, () => {
      console.log(`CareerPilot API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start CareerPilot API:', error);
    process.exit(1);
  }
}

startServer();
