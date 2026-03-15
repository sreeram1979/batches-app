import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = process.env.DATA_DIR || '/var/www/batches-app-data';
const DB_FILE   = join(DATA_DIR, 'lms.json');
const PORT      = process.env.PORT || 3001;

// ─────────────────────────────────────────────────────────────
// Tiny JSON database
// ─────────────────────────────────────────────────────────────
function loadDB() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_FILE)) return seed();
  try { return JSON.parse(readFileSync(DB_FILE, 'utf8')); }
  catch { return seed(); }
}

function saveDB(db) {
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function nextId(db, table) {
  db._seq = db._seq || {};
  db._seq[table] = (db._seq[table] || 0) + 1;
  return db._seq[table];
}

const GRADE_COLORS = [
  '#1a73e8','#34a853','#ea4335','#fbbc04',
  '#9c27b0','#00acc1','#ff7043','#43a047','#5c6bc0','#ef5350'
];

function seed() {
  const grades = [
    '1st Grade – Olympiads','2nd Grade – Olympiads','3rd Grade – Olympiads',
    '4th Grade – Olympiads','5th Grade – Olympiads','6th Grade – Olympiads',
    '7th Grade – Olympiads','8th Grade – Olympiads','9th Grade – Olympiads',
    '10th Grade – Olympiads'
  ];
  const db = { batches:[], folders:[], folder_items:[], quizzes:[], _seq:{} };
  grades.forEach((name, i) => {
    const id = nextId(db, 'batches');
    db.batches.push({
      id, name, description: 'Olympiad preparation batch',
      color: GRADE_COLORS[i], student_count: Math.floor(Math.random()*400)+50,
      is_active: true, created_at: new Date().toISOString()
    });
  });
  saveDB(db);
  console.log('✅ Database seeded with 10 default batches');
  return db;
}

let db = loadDB();

// ─────────────────────────────────────────────────────────────
// Express app
// ─────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ── Batches ───────────────────────────────────────────────────
app.get('/api/batches', (_req, res) => {
  res.json(db.batches.filter(b => !b._deleted).sort((a,b) => a.id - b.id));
});

app.post('/api/batches', (req, res) => {
  const { name, description = '', color = '#1a73e8' } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name required' });
  const batch = { id: nextId(db,'batches'), name: name.trim(), description, color,
    student_count: 0, is_active: true, created_at: new Date().toISOString() };
  db.batches.push(batch); saveDB(db);
  res.json(batch);
});

app.put('/api/batches/:id', (req, res) => {
  const id = +req.params.id;
  const idx = db.batches.findIndex(b => b.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.batches[idx] = { ...db.batches[idx], ...req.body, id };
  saveDB(db); res.json(db.batches[idx]);
});

app.delete('/api/batches/:id', (req, res) => {
  const id = +req.params.id;
  db.batches  = db.batches.filter(b => b.id !== id);
  db.folders  = db.folders.filter(f => f.batch_id !== id);
  const fids  = db.folder_items.filter(i => {
    const f = db.folders.find(f => f.id === i.folder_id);
    return f && f.batch_id === id;
  }).map(i => i.id);
  db.folder_items = db.folder_items.filter(i => !fids.includes(i.id));
  saveDB(db); res.json({ success: true });
});

// ── Folders ───────────────────────────────────────────────────
app.get('/api/folders', (req, res) => {
  const batch_id = +req.query.batch_id;
  res.json(db.folders.filter(f => f.batch_id === batch_id && !f._deleted)
    .sort((a,b) => (a.sort_order||0)-(b.sort_order||0) || a.name.localeCompare(b.name)));
});

app.post('/api/folders', (req, res) => {
  const { name, batch_id, parent_id = null, icon = 'folder' } = req.body;
  if (!name?.trim() || !batch_id) return res.status(400).json({ error: 'name + batch_id required' });
  const folder = { id: nextId(db,'folders'), name: name.trim(), batch_id: +batch_id,
    parent_id: parent_id ? +parent_id : null, icon, sort_order: 0,
    created_at: new Date().toISOString() };
  db.folders.push(folder); saveDB(db);
  res.json(folder);
});

app.put('/api/folders/:id', (req, res) => {
  const id = +req.params.id;
  const idx = db.folders.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.folders[idx] = { ...db.folders[idx], ...req.body, id };
  saveDB(db); res.json(db.folders[idx]);
});

app.delete('/api/folders/:id', (req, res) => {
  const id = +req.params.id;
  // Recursively collect all descendant folder IDs
  function collectIds(fid) {
    const children = db.folders.filter(f => f.parent_id === fid);
    return [fid, ...children.flatMap(c => collectIds(c.id))];
  }
  const toDelete = collectIds(id);
  db.folder_items = db.folder_items.filter(i => !toDelete.includes(i.folder_id));
  db.folders = db.folders.filter(f => !toDelete.includes(f.id));
  saveDB(db); res.json({ success: true, deleted: toDelete.length });
});

// Move folder (update parent_id)
app.post('/api/folders/:id/move', (req, res) => {
  const id = +req.params.id;
  const { parent_id } = req.body;
  const idx = db.folders.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  db.folders[idx].parent_id = parent_id ? +parent_id : null;
  saveDB(db); res.json(db.folders[idx]);
});

// ── Folder Items (Content) ────────────────────────────────────
app.get('/api/folder-items', (req, res) => {
  const folder_id = +req.query.folder_id;
  res.json(db.folder_items.filter(i => i.folder_id === folder_id)
    .sort((a,b) => (a.sort_order||0)-(b.sort_order||0) || a.title.localeCompare(b.title)));
});

app.post('/api/folder-items', (req, res) => {
  const { folder_id, title, type, url = '', description = '', metadata = {} } = req.body;
  const TYPES = ['video','pdf','quiz','assignment','image','link'];
  if (!folder_id || !title?.trim() || !TYPES.includes(type))
    return res.status(400).json({ error: 'folder_id, title, valid type required' });
  const item = { id: nextId(db,'folder_items'), folder_id: +folder_id,
    title: title.trim(), type, url, description,
    metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
    sort_order: 0, created_at: new Date().toISOString() };
  db.folder_items.push(item); saveDB(db);
  res.json(item);
});

app.put('/api/folder-items/:id', (req, res) => {
  const id = +req.params.id;
  const idx = db.folder_items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const upd = { ...req.body };
  if (upd.metadata && typeof upd.metadata !== 'string')
    upd.metadata = JSON.stringify(upd.metadata);
  db.folder_items[idx] = { ...db.folder_items[idx], ...upd, id };
  saveDB(db); res.json(db.folder_items[idx]);
});

app.delete('/api/folder-items/:id', (req, res) => {
  const id = +req.params.id;
  db.folder_items = db.folder_items.filter(i => i.id !== id);
  saveDB(db); res.json({ success: true });
});

// ── Quizzes ───────────────────────────────────────────────────
app.get('/api/quizzes/:folder_item_id', (req, res) => {
  const fid = +req.params.folder_item_id;
  const quiz = db.quizzes.find(q => q.folder_item_id === fid);
  res.json(quiz || null);
});

app.post('/api/quizzes', (req, res) => {
  const { folder_item_id, questions = [], time_limit = 0 } = req.body;
  const existing = db.quizzes.findIndex(q => q.folder_item_id === +folder_item_id);
  const quiz = { id: existing >= 0 ? db.quizzes[existing].id : nextId(db,'quizzes'),
    folder_item_id: +folder_item_id,
    questions: typeof questions === 'string' ? questions : JSON.stringify(questions),
    time_limit: +time_limit, created_at: new Date().toISOString() };
  if (existing >= 0) db.quizzes[existing] = quiz;
  else db.quizzes.push(quiz);
  saveDB(db); res.json(quiz);
});

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', batches: db.batches.length, folders: db.folders.length,
    items: db.folder_items.length, time: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚀 LMS API listening on port ${PORT}`));
