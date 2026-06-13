import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'server', 'data');
const reportsDir = path.join(rootDir, 'server', 'reports');
const dbPath = path.join(dataDir, 'db.json');
const port = Number(process.env.API_PORT || 8787);

const DEFAULT_USERS = [
  { id: 'user-student-1', name: 'Alex Rivera', email: 'student@university.edu', password: 'password', role: 'student' },
  { id: 'user-recruiter-1', name: 'Sarah Jenkins', email: 'hr@company.com', password: 'password', role: 'recruiter' },
  { id: 'user-admin-1', name: 'Dr. Elena Rodriguez', email: 'admin@university.edu', password: 'password', role: 'admin' },
];

const DEFAULT_STORAGE = {
  careerpilot_users: JSON.stringify(DEFAULT_USERS),
};

function createDefaultDb() {
  return {
    storage: DEFAULT_STORAGE,
    sessions: [],
    payments: [],
    emails: [],
    calendarEvents: [],
    reports: [],
    oauth: {
      googleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  };
}

async function ensureDb() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });
  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(dbPath, JSON.stringify(createDefaultDb(), null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(raw);
}

async function writeDb(db) {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');
  return db;
}

function createSession(user) {
  return {
    id: crypto.randomUUID(),
    token: crypto.randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
  };
}

function parseUsersFromStorage(storage = {}) {
  const raw = storage.careerpilot_users;
  if (!raw) return DEFAULT_USERS;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

function syncUsersToStorage(db, users) {
  db.storage.careerpilot_users = JSON.stringify(users);
}

function buildProviderStatus(db) {
  return {
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
app.use(express.json({ limit: '2mb' }));
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
  db.storage[req.params.key] = typeof req.body.value === 'string' ? req.body.value : JSON.stringify(req.body.value);
  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/storage/bulk', async (req, res) => {
  const db = await readDb();
  const entries = req.body.entries || {};
  Object.entries(entries).forEach(([key, value]) => {
    db.storage[key] = typeof value === 'string' ? value : JSON.stringify(value);
  });
  await writeDb(db);
  res.json({ ok: true, updated: Object.keys(entries).length });
});

app.delete('/api/storage/:key', async (req, res) => {
  const db = await readDb();
  delete db.storage[req.params.key];
  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/auth/login', async (req, res) => {
  const db = await readDb();
  const users = parseUsersFromStorage(db.storage);
  const { email, password, role } = req.body;
  const user = users.find(
    (entry) => entry.email.toLowerCase() === String(email || '').toLowerCase() && entry.password === password && entry.role === role
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email, password, or role.' });
  }

  const session = createSession(user);
  db.sessions = [...db.sessions.filter((entry) => entry.userId !== user.id), session];
  db.storage.careerpilot_current_user = JSON.stringify(user);
  db.storage.careerpilot_session_token = session.token;
  await writeDb(db);
  return res.json({ user, sessionToken: session.token });
});

app.post('/api/auth/register', async (req, res) => {
  const db = await readDb();
  const users = parseUsersFromStorage(db.storage);
  const { name, email, password, role } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (users.some((entry) => entry.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const user = {
    id: crypto.randomUUID(),
    name: String(name || '').trim(),
    email: normalizedEmail,
    password,
    role,
  };
  const updatedUsers = [...users, user];
  syncUsersToStorage(db, updatedUsers);
  db.storage.careerpilot_current_user = JSON.stringify(user);
  const session = createSession(user);
  db.sessions.push(session);
  db.storage.careerpilot_session_token = session.token;
  await writeDb(db);
  return res.status(201).json({ user, sessionToken: session.token });
});

app.get('/api/auth/me', async (req, res) => {
  const db = await readDb();
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token || db.storage.careerpilot_session_token;
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) {
    return res.status(401).json({ error: 'No active session.' });
  }
  const user = parseUsersFromStorage(db.storage).find((entry) => entry.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.json({ user });
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

app.listen(port, () => {
  console.log(`CareerPilot API listening on http://localhost:${port}`);
});
