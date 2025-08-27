
// Laad .env variabelen zo vroeg mogelijk
try { require('dotenv').config(); } catch(e) { console.warn('dotenv niet geladen:', e.message); }
const express = require('express');
const mysql = require('mysql2');
const compression = require('compression');
let helmet; try { helmet = require('helmet'); } catch { console.warn('helmet niet geïnstalleerd (npm i helmet)'); }
let rateLimit; try { rateLimit = require('express-rate-limit'); } catch { console.warn('express-rate-limit niet geïnstalleerd (npm i express-rate-limit)'); }
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
let sharp; try { sharp = require('sharp'); } catch { console.warn('sharp niet geïnstalleerd'); }
let redisLib; let redisClient; const enableRedis = process.env.ENABLE_REDIS === '1' || !!process.env.REDIS_URL;
if (enableRedis) {
  (async()=>{ try { redisLib = require('redis');
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    let redisErrorCount = 0;
    redisClient = redisLib.createClient({
      url,
      socket: {
        reconnectStrategy: (retries)=> {
          if (retries > 5) { console.warn('[redis] stop na 5 pogingen'); return new Error('retries_exhausted'); }
          return Math.min(200 * retries, 1500); // backoff
        }
      }
    });
    redisClient.on('error', e=> {
      redisErrorCount++; if (redisErrorCount <= 3 || redisErrorCount % 10 === 0) console.warn('[redis] error', e.message);
    });
    redisClient.on('end', ()=> console.log('[redis] verbinding gesloten'));
    await redisClient.connect();
    console.log('[redis] verbonden op', url);
  } catch(e){ console.warn('[redis] uitgeschakeld / niet beschikbaar:', e.message); } })();
} else {
  console.log('[redis] overgeslagen (stel ENABLE_REDIS=1 of REDIS_URL in om te activeren)');
}
let jwt; try { jwt = require('jsonwebtoken'); } catch { console.warn('jsonwebtoken niet geïnstalleerd. Installeer met: npm i jsonwebtoken'); }
const app = express();
app.use(compression());
if (helmet) {
  // Basis helmet
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // we voegen hieronder conditionele CSP toe
  }));
  // Eenvoudige CSP (kan via ENV uit / op strikter niveau gezet worden)
  if (process.env.ENABLE_CSP === '1' && helmet.contentSecurityPolicy) {
    app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'","'unsafe-inline'"], // inline toegestaan voor MUI injecties; later afbouwen
        imgSrc: ["'self'","data:"],
        fontSrc: ["'self'","data:"],
        connectSrc: ["'self'","http://localhost:4000"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: []
      }
    }));
    console.log('[security] CSP actief (basis)');
  } else {
    console.log('[security] CSP uit (zet ENABLE_CSP=1 om aan te zetten)');
  }
  console.log('[security] helmet ingeschakeld');
}

// Rate limiters (alleen actief als express-rate-limit aanwezig is)
const LOGIN_WINDOW_MS = parseInt(process.env.LOGIN_WINDOW_MS||'900000',10); // 15m
const LOGIN_MAX = parseInt(process.env.LOGIN_MAX||'10',10); // 10 pogingen per 15m per IP
const RESET_WINDOW_MS = parseInt(process.env.RESET_WINDOW_MS||'3600000',10); // 60m
const RESET_MAX = parseInt(process.env.RESET_MAX||'30',10); // 30 reset requests per uur
// Product listing limiter (A/B/C improvements)
const PRODUCTS_WINDOW_MS = parseInt(process.env.PRODUCTS_WINDOW_MS||'300000',10); // 5m
const PRODUCTS_MAX = parseInt(process.env.PRODUCTS_MAX||'300',10); // 300 list calls per window (anon/IP)

const loginLimiter = rateLimit ? rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  max: LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error:'too_many_logins' }
}) : (req,res,next)=>next();

const resetLimiter = rateLimit ? rateLimit({
  windowMs: RESET_WINDOW_MS,
  max: RESET_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error:'too_many_requests' }
}) : (req,res,next)=>next();
// Rate limiter voor product listing (skip voor admins)
const productListLimiter = rateLimit ? rateLimit({
  windowMs: PRODUCTS_WINDOW_MS,
  max: PRODUCTS_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> req.user? `u:${req.user.sub}` : (req.ip||'anon'),
  skip: (req)=> req.user && req.user.role==='admin',
  message: { error:'too_many_product_requests' }
}) : (req,res,next)=>next();

if (rateLimit) console.log('[security] rate limiting actief (login '+LOGIN_MAX+'/'+(LOGIN_WINDOW_MS/60000)+'m, reset '+RESET_MAX+'/'+(RESET_WINDOW_MS/60000)+'m)');

app.use(express.json());
// Lightweight logger
const LOG_LEVEL = (process.env.LOG_LEVEL||'info').toLowerCase();
const LEVELS = { error:0, warn:1, info:2, debug:3 };
function log(level, msg, data){
  if ((LEVELS[level] ?? 2) <= (LEVELS[LOG_LEVEL] ?? 2)) {
    if (data !== undefined) console.log(`[${level}] ${msg}`, data); else console.log(`[${level}] ${msg}`);
  }
}
// CORS eerst zodat ook fouten bij auth zichtbaar zijn in frontend
app.use((req,res,next)=> {
  const origin = req.headers.origin;
  if (origin && /^http:\/\/localhost:(3000|3001|3002|3003|3004|3005|3006|3007|3008|3009|3010|4000|4001|4002|4003|4004|4005|4006|4007|4008|4009|4010)$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  }
  res.setHeader('Vary','Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir, { setHeaders:(res)=> { res.setHeader('Cache-Control','public, max-age=31536000, immutable'); } }));

// Multer config
const storage = multer.diskStorage({
  destination:(req,file,cb)=> cb(null, uploadsDir),
  filename:(req,file,cb)=> { const ext=(file.originalname||'').split('.').pop()?.toLowerCase(); const safe=/^(png|jpg|jpeg|webp|gif)$/i.test(ext||'')?ext:'bin'; cb(null, crypto.randomUUID()+'.'+safe); }
});
const upload = multer({ storage, limits:{ fileSize:5*1024*1024 }, fileFilter:(req,file,cb)=> { if(!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) return cb(new Error('unsupported_type')); cb(null,true);} });

// Rate limit configuratie (fallback naar memory als Redis ontbreekt)
const memoryUploadRate = new Map(); // key: userId, value: { count, windowStart }
async function rateLimitUpload(req,res,next){
  if(!req.user) return res.status(401).json({ error:'auth_required' });
  const uid = req.user.sub;
  const limit = parseInt(process.env.UPLOAD_LIMIT||'20',10);
  const windowSec = parseInt(process.env.UPLOAD_WINDOW_SEC||'600',10); // 10m
  // Eerst proberen via Redis
  if (redisClient && redisClient.isOpen){
    try {
      const key = `upl:${uid}`;
      const count = await redisClient.incr(key);
      if (count === 1) await redisClient.expire(key, windowSec);
      if (count > limit){
        const ttl = await redisClient.ttl(key);
        return res.status(429).json({ error:'rate_limited', retryAfterSeconds: ttl>0? ttl : windowSec });
      }
      return next();
    } catch(e){ console.warn('[rateLimitUpload][redis] fout:', e.message); }
  }
  // Fallback memory
  try {
    const now = Date.now();
    const WINDOW = windowSec*1000;
    let entry = memoryUploadRate.get(uid);
    if(!entry || now - entry.windowStart > WINDOW){ entry = { count:0, windowStart: now }; }
    entry.count += 1;
    if(entry.count > limit){ return res.status(429).json({ error:'rate_limited', retryAfterSeconds: Math.ceil((entry.windowStart + WINDOW - now)/1000) }); }
    memoryUploadRate.set(uid, entry);
  } catch {}
  next();
}

// Basic crash logging so server fouten zichtbaar worden i.p.v. stil uitvallen
process.on('uncaughtException', err => { console.error('UncaughtException:', err); });
process.on('unhandledRejection', err => { console.error('UnhandledRejection:', err); });


function adminRequired(req,res,next) {
  if (!req.user) { console.warn('[adminRequired] geen req.user aanwezig (authRequired zou vooraf moeten draaien)'); return res.status(403).json({ error:'admin_required' }); }
  if (req.user.role !== 'admin') { console.warn('[adminRequired] role mismatch', req.user); return res.status(403).json({ error:'admin_required' }); }
  next();
}
const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'partijtrade',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT||'10',10),
  queueLimit: 0
});

connection.getConnection((err, conn) => {
  if (err) { console.error('Fout bij verbinden:', err); return; }
  if (conn) conn.release();
  console.log('MySQL pool gereed.');
  ensureUsersTable();
  ensureUsersSchemaUpgrade();
  ensureProductsTable();
  ensureProductsIndexes();
  ensureUserAuditTable();
  seedDefaultAdmin();
  if (process.env.MIGRATE_BASE64_ON_START && process.env.MIGRATE_BASE64_ON_START !== '0') {
    setTimeout(()=> migrateLegacyBase64Images().catch(e=> console.warn('[migrate][startup] fout', e.message)), 1500);
  } else {
    console.log('[migrate] base64 migratie overgeslagen (MIGRATE_BASE64_ON_START=0)');
  }
  console.log('[init] Ready: schema gecontroleerd, admin aanwezig, server start volgt.');
});

function ensureUsersTable() {
  const ddl = `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(190) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    can_upload TINYINT(1) NOT NULL DEFAULT 1,
    reset_token_hash CHAR(64) DEFAULT NULL,
    reset_token_expires_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  pwd_must_change TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_users_email (email),
    KEY idx_users_resettoken (reset_token_hash)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  connection.query(ddl, (e)=> {
    if (e) return console.error('Users DDL error:', e.message);
    console.log('Users tabel gegarandeerd.');
  });
}

function ensureUsersSchemaUpgrade(){
  connection.query('DESCRIBE users', (err, rows)=>{
    if (err) { console.warn('Kan users schema niet lezen voor upgrade:', err.message); return; }
    const have = new Set(rows.map(r=>r.Field));
    const alters = [];
    if (!have.has('role')) alters.push("ADD COLUMN role ENUM('admin','user') NOT NULL DEFAULT 'user' AFTER password");
    if (!have.has('can_upload')) alters.push("ADD COLUMN can_upload TINYINT(1) NOT NULL DEFAULT 1 AFTER role");
    if (!have.has('reset_token_hash')) alters.push("ADD COLUMN reset_token_hash CHAR(64) DEFAULT NULL AFTER can_upload");
    if (!have.has('reset_token_expires_at')) alters.push("ADD COLUMN reset_token_expires_at DATETIME DEFAULT NULL AFTER reset_token_hash");
  if (!have.has('created_at')) alters.push("ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  if (!have.has('disabled')) alters.push("ADD COLUMN disabled TINYINT(1) NOT NULL DEFAULT 0 AFTER can_upload");
  if (!have.has('disabled_reason')) alters.push("ADD COLUMN disabled_reason TEXT NULL AFTER disabled");
  if (!have.has('disabled_at')) alters.push("ADD COLUMN disabled_at DATETIME NULL AFTER disabled_reason");
  if (!have.has('pwd_must_change')) alters.push("ADD COLUMN pwd_must_change TINYINT(1) NOT NULL DEFAULT 0 AFTER created_at");
    if (alters.length){
      const sql = 'ALTER TABLE users ' + alters.join(', ');
      connection.query(sql, e=>{
        if (e) console.error('Users schema upgrade fout:', e.message); else console.log('Users schema geüpgraded:', alters.join('; '));
      });
    }
  });
}

function seedDefaultAdmin(){
  // Controleer of admin bestaat (val ook terug op alleen username check wanneer kolom role ontbreekt)
  connection.query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "users" AND COLUMN_NAME = "role"', (ce, cols)=>{
    const hasRole = !ce && cols && cols.length>0;
    const checkSql = hasRole ? 'SELECT id, role FROM users WHERE username="admin" LIMIT 1' : 'SELECT id FROM users WHERE username="admin" LIMIT 1';
    connection.query(checkSql, (err, rows)=>{
      if (err) { console.error('Check admin fout:', err.message); return; }
      if (rows && rows.length) {
        if (hasRole && rows[0].role !== 'admin') {
          connection.query('UPDATE users SET role="admin" WHERE id=?',[rows[0].id], e=>{
            if (e) console.error('Promotie admin fout:', e.message); else console.log('Bestaande user "admin" gepromoveerd naar role=admin');
          });
        } else {
          console.log('Admin gebruiker aanwezig (id='+rows[0].id+').');
        }
        return;
      }
      bcrypt.hash('admin123', 10, (e, hash)=>{
        if (e) { console.error('Hash fout voor default admin:', e.message); return; }
        const insertSql = hasRole ? 'INSERT INTO users (username,email,password,role) VALUES (?,?,?,?)' : 'INSERT INTO users (username,email,password) VALUES (?,?,?)';
        const params = hasRole ? ['admin','admin@example.com',hash,'admin'] : ['admin','admin@example.com',hash];
        connection.query(insertSql, params, (ie)=>{
          if (ie) console.error('Insert default admin fout:', ie.message); else console.log('Default admin aangemaakt: gebruikersnaam=admin wachtwoord=admin123');
        });
      });
    });
  });
}

function ensureProductsTable() {
  const ddl = `CREATE TABLE IF NOT EXISTS products (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    external_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(120) DEFAULT NULL,
    price DECIMAL(12,2) DEFAULT NULL,
    qty INT DEFAULT NULL,
    \`condition\` VARCHAR(40) DEFAULT NULL,
    description TEXT,
    images_json JSON DEFAULT NULL,
    owner_id BIGINT UNSIGNED DEFAULT NULL,
    owner_name VARCHAR(120) DEFAULT NULL,
    tags_json JSON DEFAULT NULL,
    location VARCHAR(160) DEFAULT NULL,
    min_order INT DEFAULT NULL,
    negotiable TINYINT(1) DEFAULT 0,
    vat_included TINYINT(1) DEFAULT 0,
    shipping_methods_json JSON DEFAULT NULL,
    expires_at DATETIME DEFAULT NULL,
    brand VARCHAR(120) DEFAULT NULL,
    external_link VARCHAR(500) DEFAULT NULL,
    is_draft TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_products_external (external_id),
    KEY idx_products_expires (expires_at),
    KEY idx_products_draft (is_draft),
    KEY idx_products_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  connection.query(ddl, (e) => {
    if (e) return console.error('Products DDL error:', e.message);
    console.log('Products tabel gegarandeerd.');
  });
}

function ensureProductsIndexes(){
  connection.query("SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name='products' AND index_name='idx_products_filter' LIMIT 1", (e, rows)=>{
    if (e) { console.warn('Index check fout:', e.message); return; }
    if (rows && rows.length) { return; }
    connection.query('CREATE INDEX idx_products_filter ON products (is_draft, expires_at, created_at)', (ce)=>{
      if (ce) console.warn('Index aanmaak fout:', ce.message); else console.log('Index idx_products_filter aangemaakt');
    });
  });
  // Extra index voor category/brand filters
  connection.query("SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name='products' AND index_name='idx_products_cat_brand' LIMIT 1", (e, rows)=>{
    if (e) { console.warn('[idx cat_brand] check fout:', e.message); return; }
    if (rows && rows.length) return;
    connection.query('CREATE INDEX idx_products_cat_brand ON products (category, brand)', ce=>{
      if (ce) console.warn('[idx cat_brand] aanmaak fout', ce.message); else console.log('[idx cat_brand] aangemaakt');
    });
  });
    // FULLTEXT index (optioneel) voor betere zoek
    if (process.env.FULLTEXT_DISABLE !== '1') {
      connection.query("SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name='products' AND index_name='ft_products_title_desc' LIMIT 1", (e, rows)=>{
        if (e) { console.warn('[fulltext] check fout:', e.message); return; }
        if (rows && rows.length) return;
        connection.query('ALTER TABLE products ADD FULLTEXT INDEX ft_products_title_desc (title, description)', ce=>{
          if (ce) console.warn('[fulltext] aanmaak fout:', ce.message); else console.log('[fulltext] FULLTEXT index aangemaakt');
        });
      });
    }
}

app.get('/users', (req, res) => {
  connection.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

// Lightweight health endpoint voor uptime checks / load balancers
app.get('/healthz', (req,res)=> {
  res.json({ ok:true, uptime: process.uptime(), ts: Date.now(), dbPoolActive: connection._allConnections.length || 0 });
});

// Voorbeeld POST-endpoint om een gebruiker toe te voegen
app.post('/users', async (req, res) => {
  const { username, email, password, role, canUpload } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: 'missing_fields' });
  const finalRole = (role === 'admin' || role === 'user') ? role : 'user';
  const finalCanUpload = (canUpload === 0 || canUpload === false) ? 0 : 1;
  try {
    const hash = await bcrypt.hash(password, 10);
    connection.query('INSERT INTO users (username,email,password,role,can_upload) VALUES (?,?,?,?,?)', [username, email, hash, finalRole, finalCanUpload], (err, result) => {
      if (err) return res.status(500).json({ error:'db', detail: err.code });
      res.json({ id: result.insertId, username, email, role: finalRole, canUpload: !!finalCanUpload });
    });
  } catch(e) { res.status(500).json({ error:'hash_failed' }); }
});

// --- Auth (eenvoudig JWT) --------------------------------------------------
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
function signToken(payload) {
  if (!jwt) throw new Error('jsonwebtoken module ontbreekt');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}
function verifyToken(token) {
  if (!jwt) throw new Error('jsonwebtoken module ontbreekt');
  return jwt.verify(token, JWT_SECRET);
}

// Login: accepteert { username, password } of { usernameOrEmail, password }
app.post('/auth/login', loginLimiter, (req,res) => {
  const { username, usernameOrEmail, password } = req.body || {};
  const identifier = username || usernameOrEmail;
  if (!identifier || !password) return res.status(400).json({ error:'missing_credentials' });
  connection.query('SELECT id, username, email, password, role, can_upload, disabled, pwd_must_change FROM users WHERE username=? OR email=? LIMIT 1',[identifier, identifier], async (err, rows)=> {
    if (err) return res.status(500).json({ error:'db', detail: err.message });
    if (!rows.length) return res.status(401).json({ error:'invalid_login' });
    const user = rows[0];
    let match = false;
    if (user.password.startsWith('$2')) { // bcrypt hash
      match = await bcrypt.compare(password, user.password);
    } else {
      // legacy plaintext fallback
      match = (user.password === password);
      if (match) {
        try {
          const newHash = await bcrypt.hash(password, 10);
          connection.query('UPDATE users SET password=? WHERE id=?',[newHash, user.id], ()=>{});
        } catch {}
      }
    }
    if (!match) return res.status(401).json({ error:'invalid_login' });
    if (user.disabled) {
      console.warn('[auth/login] poging tot login voor disabled user', user.username);
      return res.status(403).json({ error:'disabled' });
    }
    // Automatische promotie: zorg dat gebruiker 'admin' altijd role=admin krijgt
    if (user.username === 'admin' && user.role !== 'admin') {
      connection.query('UPDATE users SET role="admin" WHERE id=?',[user.id], (e)=>{
        if (e) console.warn('Kon admin niet promoten tijdens login:', e.message); else console.log('Admin automatisch gepromoveerd bij login');
      });
      user.role = 'admin';
    }
    try {
      const token = signToken({ sub: user.id, username: user.username, role: user.role });
      const payload = { token, user: { id: user.id, username: user.username, email: user.email, role: user.role, canUpload: !!user.can_upload, disabled: !!user.disabled, mustChange: !!user.pwd_must_change } };
      console.log('[auth/login] success user=', user.username, 'id=', user.id);
      res.json(payload);
    } catch(e){ res.status(500).json({ error:'jwt', detail:e.message }); }
  });
});

// Token refresh: vereist geldig (niet verlopen) token; geeft nieuw token met verse expiratie
app.post('/auth/refresh', authRequired, async (req,res) => {
  try {
    const [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, pwd_must_change FROM users WHERE id=? LIMIT 1',[req.user.sub]);
    if (!rows.length) return res.status(404).json({ error:'user_not_found' });
    const u = rows[0];
    if (u.disabled) return res.status(403).json({ error:'disabled' });
    try {
      const token = signToken({ sub: u.id, username: u.username, role: u.role });
      return res.json({ token, user: { id:u.id, username:u.username, email:u.email, role:u.role, canUpload: !!u.can_upload, disabled: !!u.disabled, mustChange: !!u.pwd_must_change } });
    } catch(e){ return res.status(500).json({ error:'jwt', detail:e.message }); }
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Huidige user ophalen via token
app.get('/auth/me', authRequired, async (req,res) => {
  try {
    const [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, pwd_must_change FROM users WHERE id=? LIMIT 1',[req.user.sub]);
    if (!rows.length) return res.status(404).json({ error:'user_not_found' });
    const u = rows[0];
    res.json({ user: { id:u.id, username:u.username, email:u.email, role:u.role, canUpload: !!u.can_upload, disabled: !!u.disabled, mustChange: !!u.pwd_must_change } });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Wachtwoord wijzigen (met oud wachtwoord) - auth required
app.post('/auth/change-password', authRequired, async (req,res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error:'missing_fields' });
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return res.status(400).json({ error:'weak_password' });
  try {
    const [rows] = await connection.promise().query('SELECT id,password FROM users WHERE id=? LIMIT 1',[req.user.sub]);
    if (!rows.length) return res.status(404).json({ error:'user_not_found' });
    const row = rows[0];
    let ok = false;
    if (row.password.startsWith('$2')) ok = await bcrypt.compare(oldPassword, row.password);
    else ok = (row.password === oldPassword);
    if (!ok) return res.status(401).json({ error:'invalid_old_password' });
    const hash = await bcrypt.hash(newPassword, 10);
    await connection.promise().query('UPDATE users SET password=? WHERE id=?',[hash, req.user.sub]);
    res.json({ changed:true });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Password reset token aanvragen (altijd success om enumeration te voorkomen)
function sha256(input) { return crypto.createHash('sha256').update(input).digest('hex'); }
app.post('/auth/request-reset', resetLimiter, async (req,res) => {
  const { usernameOrEmail } = req.body || {};
  if (!usernameOrEmail) return res.status(400).json({ error:'missing_usernameOrEmail' });
  try {
    const [rows] = await connection.promise().query('SELECT id FROM users WHERE username=? OR email=? LIMIT 1',[usernameOrEmail, usernameOrEmail]);
    if (rows.length) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = sha256(token);
      const expires = new Date(Date.now()+30*60*1000); // 30 minuten
      await connection.promise().query('UPDATE users SET reset_token_hash=?, reset_token_expires_at=? WHERE id=?',[hash, expires, rows[0].id]);
      console.log('[RESET] token voor user', usernameOrEmail, ':', token); // In productie: e-mail versturen
    }
  } catch(e){ /* stil */ }
  res.json({ ok:true });
});

// Password resetten met token
app.post('/auth/reset-password', resetLimiter, async (req,res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ error:'missing_fields' });
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return res.status(400).json({ error:'weak_password' });
  try {
    const hash = sha256(token);
    const [rows] = await connection.promise().query('SELECT id FROM users WHERE reset_token_hash=? AND reset_token_expires_at > NOW() LIMIT 1',[hash]);
    if (!rows.length) return res.status(400).json({ error:'invalid_or_expired' });
    const pwHash = await bcrypt.hash(newPassword, 10);
    await connection.promise().query('UPDATE users SET password=?, reset_token_hash=NULL, reset_token_expires_at=NULL WHERE id=?',[pwHash, rows[0].id]);
    res.json({ reset:true });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Middleware
function authOptional(req,res,next) {
  const hdr = req.headers.authorization || '';
  if (hdr.startsWith('Bearer ')) {
    const token = hdr.slice(7);
    try { req.user = verifyToken(token); } catch { /* ignore */ }
  }
  next();
}
function authRequired(req,res,next) {
  const hdr = req.headers.authorization || '';
  if (!hdr.startsWith('Bearer ')) return res.status(401).json({ error:'auth_required' });
  try { req.user = verifyToken(hdr.slice(7)); return next(); }
  catch { return res.status(401).json({ error:'invalid_token' }); }
}

// Pas muterende routes achteraf aan met authRequired

// --- Dynamische sitemap (nu via MySQL products tabel) -----------------------
// Verwacht tabel 'products' (zie schema in db/schema.sql) met kolommen:
// external_id (UNIQUE), updated_at, created_at, is_draft (TINYINT), expires_at (NULLABLE)
// We filteren: !is_draft AND (expires_at IS NULL OR expires_at > NOW())
// Fallback: alleen statische pagina's wanneer query faalt / geen tabel.

app.get('/sitemap.xml', async (req, res) => {
  const base = process.env.SITE_BASE_URL || 'https://www.impexdeals.example';
  const pages = [
    { loc: `${base}/`, changefreq: 'daily', priority: 0.9 },
    { loc: `${base}/partijen`, changefreq: 'hourly', priority: 0.8 },
    { loc: `${base}/privacy`, changefreq: 'yearly', priority: 0.3 },
    { loc: `${base}/voorwaarden`, changefreq: 'yearly', priority: 0.3 },
    { loc: `${base}/over`, changefreq: 'yearly', priority: 0.4 },
    { loc: `${base}/contact`, changefreq: 'yearly', priority: 0.4 }
  ];
  // Paginated listing URLs (SEO discoverability). We estimate total products to decide pages (cap at 20 pages for sitemap to avoid bloat)
  try {
    const [crows] = await connection.promise().query(`SELECT COUNT(*) AS cnt FROM products WHERE is_draft=0 AND (expires_at IS NULL OR expires_at > NOW())`);
    const total = crows?.[0]?.cnt || 0;
    const perPage = 20; // must align with frontend fetchProductsPage default
    const totalPages = Math.ceil(total / perPage);
    const maxPages = Math.min(totalPages, 20);
    for (let p=2; p<=maxPages; p++) {
      pages.push({ loc: `${base}/partijen?page=${p}`, changefreq: 'hourly', priority: 0.75 });
    }
  } catch(e) { /* ignore count error */ }
  let productUrls = [];
  try {
    const [rows] = await connection.promise().query(`
      SELECT external_id, GREATEST(UNIX_TIMESTAMP(COALESCE(updated_at, created_at)), UNIX_TIMESTAMP(created_at)) * 1000 AS last_ts
      FROM products
      WHERE is_draft = 0
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 2000
    `);
    productUrls = (rows || []).map(r => ({
      loc: `${base}/product/${r.external_id}`,
      lastmod: new Date(r.last_ts).toISOString(),
      changefreq: 'weekly',
      priority: 0.7
    }));
  } catch (e) {
    console.error('[sitemap] query error:', e.message);
  }
  const all = [...pages, ...productUrls];
  // Caching headers (ETag / Last-Modified)
  try {
    const lm = productUrls[0]?.lastmod || new Date().toISOString();
    const etag = `W/"smap_${productUrls.length}_${Date.parse(lm)||0}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.setHeader('ETag', etag);
    res.setHeader('Last-Modified', lm);
    res.setHeader('Cache-Control','public, max-age=300');
  } catch {}
  const xmlItems = all.map(item => `  <url>\n    <loc>${item.loc}</loc>`
    + (item.lastmod ? `\n    <lastmod>${item.lastmod}</lastmod>` : '')
    + (item.changefreq ? `\n    <changefreq>${item.changefreq}</changefreq>` : '')
    + (item.priority !== undefined ? `\n    <priority>${item.priority}</priority>` : '')
    + `\n  </url>`).join('\n');
  const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${xmlItems}\n</urlset>`;
  res.type('application/xml').send(xml);
});

// -------------------- Product API ------------------------------
// Alle muterende endpoints vereisen nu JWT via Authorization: Bearer <token>

function mapRow(row) {
  return {
    id: row.external_id,
    title: row.title,
    category: row.category,
    price: row.price !== null ? Number(row.price) : undefined,
    qty: row.qty,
    condition: row.condition,
    description: row.description,
    images: row.images_json ? JSON.parse(row.images_json) : [],
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    tags: row.tags_json ? JSON.parse(row.tags_json) : undefined,
    location: row.location,
    minOrder: row.min_order,
    negotiable: !!row.negotiable,
    vatIncluded: !!row.vat_included,
    shippingMethods: row.shipping_methods_json ? JSON.parse(row.shipping_methods_json) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
    brand: row.brand,
    externalLink: row.external_link,
    isDraft: !!row.is_draft,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : undefined,
  };
}

// Eenvoudige memory cache fallback (zonder Redis) voor product listings
const productCacheMemory = new Map(); // key -> { exp:number, etag:string, payload:any }
const PRODUCT_CACHE_TTL_MS = parseInt(process.env.PRODUCT_CACHE_TTL_MS||'30000',10); // 30s TTL
function cacheKey(q){ return 'plist:'+crypto.createHash('sha1').update(JSON.stringify(q)).digest('hex'); }
function invalidateProductCache(){ if (productCacheMemory.size) productCacheMemory.clear(); }

// GET list (paginated + filters + ETag + optionele FULLTEXT + caching + rate limit)
app.get('/api/products', authOptional, productListLimiter, async (req, res) => {
  const { category, q, minPrice, maxPrice, sort, brand, negotiable, tags, facets } = req.query;
  let where = 'is_draft = 0 AND (expires_at IS NULL OR expires_at > NOW())';
  const params = [];
  if (category) { where += ' AND category = ?'; params.push(category); }
  if (brand) { where += ' AND brand = ?'; params.push(brand); }
  if (negotiable === '1') { where += ' AND negotiable = 1'; }
  if (minPrice) { where += ' AND price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { where += ' AND price <= ?'; params.push(Number(maxPrice)); }
  let fulltext = false; let relevanceSel='';
  if (q) {
    const term = String(q).trim();
    if (term.length>2 && process.env.FULLTEXT_DISABLE !== '1') {
      fulltext = true;
      const booleanQuery = term.split(/\s+/).slice(0,6).map(t=> (t.length>1? t+'*': t)).join(' ');
      where += ' AND MATCH(title,description) AGAINST (? IN BOOLEAN MODE)';
      params.push(booleanQuery);
      relevanceSel = ', MATCH(title,description) AGAINST (? IN BOOLEAN MODE) AS _rel';
      params.push(booleanQuery);
    } else {
      where += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${term}%`,`%${term}%`);
    }
  }
  // Tags (comma gescheiden) -> eenvoudige LIKE zoek (alle opgegeven tags moeten matchen)
  if (tags) {
    const tagList = String(tags).split(',').map(t=>t.trim()).filter(Boolean).slice(0,10);
    for (const t of tagList) { where += ' AND tags_json LIKE ?'; params.push('%"'+t.replace(/[%_]/g,'')+'"%'); }
  }
  // Sorting
  let order = fulltext && !sort? '_rel DESC, created_at DESC' : 'created_at DESC';
  if (sort === 'priceAsc') order = 'price ASC, created_at DESC';
  else if (sort === 'priceDesc') order = 'price DESC, created_at DESC';
  else if (sort === 'qtyDesc') order = 'qty DESC, created_at DESC';
  // Pagination
  const page = Math.max(1, parseInt(req.query.page,10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit,10) || 20);
  const offset = (page-1)*limit;
  try {
    const ck = cacheKey({ category,q,minPrice,maxPrice,sort,brand,negotiable,tags,facets,page,limit });
    if (redisClient && redisClient.isOpen) {
      try {
        const cached = await redisClient.get(ck);
        if (cached) {
          const { etag, payload } = JSON.parse(cached);
            if (req.headers['if-none-match'] === etag) return res.status(304).end();
            res.setHeader('ETag', etag);
            res.setHeader('Cache-Control','public, max-age=30');
            return res.json(payload);
        }
      } catch{}
    } else {
      const mem = productCacheMemory.get(ck);
      if (mem && mem.exp > Date.now()) {
        if (req.headers['if-none-match'] === mem.etag) return res.status(304).end();
        res.setHeader('ETag', mem.etag);
        res.setHeader('Cache-Control','public, max-age=30');
        return res.json(mem.payload);
      }
    }
    const [[countRow]] = await connection.promise().query(`SELECT COUNT(*) AS cnt, MAX(updated_at) as max_upd FROM products WHERE ${where}`, params);
    const total = countRow.cnt || 0;
    const totalPages = Math.max(1, Math.ceil(total/limit));
    const [rows] = await connection.promise().query(
      `SELECT external_id,title,category,price,qty,images_json,owner_id,owner_name,negotiable,vat_included,brand,expires_at,created_at,updated_at,is_draft${relevanceSel} FROM products WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const items = rows.map(r=>({ id:r.external_id, title:r.title, category:r.category, price:r.price!==null?Number(r.price):undefined, qty:r.qty, images: r.images_json? JSON.parse(r.images_json):[], ownerId:r.owner_id, ownerName:r.owner_name, negotiable: !!r.negotiable, vatIncluded: !!r.vat_included, brand: r.brand, expiresAt: r.expires_at? new Date(r.expires_at).getTime():undefined, createdAt: r.created_at? new Date(r.created_at).getTime():undefined, updatedAt: r.updated_at? new Date(r.updated_at).getTime():undefined }));
    // Facets optioneel
    let facetData = undefined;
    if (facets === '1') {
      const [catRows] = await connection.promise().query(`SELECT category AS value, COUNT(*) AS count FROM products WHERE ${where} GROUP BY category ORDER BY count DESC LIMIT 20`, params);
      const [brandRows] = await connection.promise().query(`SELECT brand AS value, COUNT(*) AS count FROM products WHERE ${where} GROUP BY brand ORDER BY count DESC LIMIT 20`, params);
      facetData = { categories: catRows.filter(r=>r.value!==null), brands: brandRows.filter(r=>r.value!==null) };
    }
    // ETag based on max updated + count + page slice
    const sliceStamp = countRow.max_upd ? new Date(countRow.max_upd).getTime() : 0;
    const etag = `W/"prod_${sliceStamp}_${total}_${page}_${limit}_${!!brand}_${!!negotiable}_${tags?String(tags).length:0}_${fulltext?'ft':'lk'}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control','public, max-age=30');
    const payload = { items, page, totalPages, total, limit, facets: facetData };
    if (redisClient && redisClient.isOpen) {
      try { await redisClient.setEx(ck, Math.ceil(PRODUCT_CACHE_TTL_MS/1000), JSON.stringify({ etag, payload })); } catch{}
    } else {
      productCacheMemory.set(ck, { exp: Date.now()+PRODUCT_CACHE_TTL_MS, etag, payload });
    }
    res.json(payload);
  } catch (e) { res.status(500).json({ error: 'DB', detail: e.message }); }
});

// GET detail
app.get('/api/products/:id', authOptional, async (req, res) => {
  try {
    const [rows] = await connection.promise().query('SELECT * FROM products WHERE external_id = ? LIMIT 1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(mapRow(rows[0]));
  } catch (e) { res.status(500).json({ error: 'DB', detail: e.message }); }
});

// CREATE
app.post('/api/products', authRequired, async (req, res) => {
  const p = req.body || {};
  const externalId = p.id || crypto.randomUUID();
  if (!p.title) return res.status(400).json({ error: 'title_required' });
  const createdTs = p.createdAt ? new Date(p.createdAt) : new Date();
  const expiresDt = p.expiresAt ? new Date(p.expiresAt) : null;
  try {
    await connection.promise().query(`
      INSERT INTO products (external_id,title,category,price,qty,\`condition\`,description,images_json,owner_id,owner_name,tags_json,location,min_order,negotiable,vat_included,shipping_methods_json,expires_at,brand,external_link,is_draft,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,[
  externalId, p.title, p.category||null, p.price||null, p.qty||null, p.condition||null, p.description||null, JSON.stringify(p.images||[]), p.ownerId||null, p.ownerName||null, JSON.stringify(p.tags||[]), p.location||null, p.minOrder||null, p.negotiable?1:0, p.vatIncluded?1:0, JSON.stringify(p.shippingMethods||[]), expiresDt, p.brand||null, p.externalLink||null, p.isDraft?1:0, createdTs
    ]);
  const [rows] = await connection.promise().query('SELECT * FROM products WHERE external_id=?',[externalId]);
  invalidateProductCache();
  res.status(201).json(mapRow(rows[0]));
  } catch(e) { res.status(500).json({ error:'DB', detail: e.message }); }
});

// Simple health endpoint
app.get('/healthz', (req,res) => res.json({ ok:true }));

// UPDATE
app.put('/api/products/:id', authRequired, async (req,res) => {
  const p = req.body || {};
  const fields = [];
  const params = [];
  const map = {
    title:'title', category:'category', price:'price', qty:'qty', condition:'condition', description:'description', ownerId:'owner_id', ownerName:'owner_name', location:'location', minOrder:'min_order', negotiable:'negotiable', vatIncluded:'vat_included', expiresAt:'expires_at', brand:'brand', externalLink:'external_link', isDraft:'is_draft'
  };
  Object.entries(map).forEach(([k,col])=>{
    if (p[k] !== undefined) {
      if (k === 'expiresAt') { fields.push(`${col}=?`); params.push(p.expiresAt? new Date(p.expiresAt): null); }
      else if (k==='negotiable' || k==='vatIncluded' || k==='isDraft') { fields.push(`${col}=?`); params.push(p[k]?1:0); }
      else { fields.push(`${col}=?`); params.push(p[k]); }
    }
  });
  if (p.images) { fields.push('images_json=?'); params.push(JSON.stringify(p.images)); }
  if (p.tags) { fields.push('tags_json=?'); params.push(JSON.stringify(p.tags)); }
  if (p.shippingMethods) { fields.push('shipping_methods_json=?'); params.push(JSON.stringify(p.shippingMethods)); }
  if (!fields.length) return res.json({ updated:0 });
  try {
    await connection.promise().query(`UPDATE products SET ${fields.join(', ')} WHERE external_id=?`, [...params, req.params.id]);
    const [rows] = await connection.promise().query('SELECT * FROM products WHERE external_id=?',[req.params.id]);
    if (!rows.length) return res.status(404).json({ error:'not_found' });
  invalidateProductCache();
  res.json(mapRow(rows[0]));
  } catch(e){ res.status(500).json({ error:'DB', detail:e.message }); }

// Klein seed endpoint om demo producten toe te voegen (alleen admin, niet in production)
app.post('/admin/seed-products', authRequired, adminRequired, async (req,res)=> {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error:'disabled_in_production' });
  try {
    const [exist] = await connection.promise().query('SELECT id FROM products WHERE category = ? LIMIT 1',[ 'DemoCat' ]);
    if (exist.length) return res.json({ seeded:false, reason:'already_present' });
    const demo = [
      { title:'Demo Partij Smartphones', category:'DemoCat', brand:'DemoBrandA', price:199.99, qty:50, negotiable:1, tags:['electronics','phone'] },
      { title:'Demo Partij Headsets', category:'DemoCat', brand:'DemoBrandB', price:29.95, qty:200, negotiable:0, tags:['audio','headset'] },
      { title:'Demo Partij Laptops', category:'DemoCat', brand:'DemoBrandA', price:499.00, qty:20, negotiable:1, tags:['computer','laptop'] },
      { title:'Demo Partij Muizen', category:'DemoCat', brand:'DemoBrandC', price:9.50, qty:500, negotiable:0, tags:['accessory','mouse'] },
      { title:'Demo Partij Monitoren', category:'DemoCat', brand:'DemoBrandD', price:119.00, qty:80, negotiable:1, tags:['display','monitor'] }
    ];
    for (const d of demo) {
      const extId = crypto.randomUUID();
      await connection.promise().query(
        `INSERT INTO products (external_id,title,category,price,qty,\`condition\`,description,images_json,owner_id,owner_name,tags_json,location,min_order,negotiable,vat_included,shipping_methods_json,expires_at,brand,external_link,is_draft,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
        [extId, d.title, d.category, d.price, d.qty, 'N/A', 'Demo seed product', '[]', null, null, JSON.stringify(d.tags), null, null, d.negotiable, 1, '[]', null, d.brand, null, 0]
      );
    }
    res.json({ seeded:true, count: demo.length });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Cleanup endpoint voor demo seed producten
app.post('/admin/cleanup-demo-products', authRequired, adminRequired, async (req,res)=>{
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error:'disabled_in_production' });
  try {
    const [result] = await connection.promise().query("DELETE FROM products WHERE category='DemoCat' OR brand LIKE 'DemoBrand%' ");
    res.json({ deleted: result.affectedRows || 0 });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});
});

// DELETE
app.delete('/api/products/:id', authRequired, async (req,res) => {
  try {
    const [r] = await connection.promise().query('DELETE FROM products WHERE external_id=?',[req.params.id]);
  if (r.affectedRows) invalidateProductCache();
  res.json({ deleted: r.affectedRows });
  } catch(e){ res.status(500).json({ error:'DB', detail:e.message }); }
});

// Publish
app.post('/api/products/:id/publish', authRequired, async (req,res) => {
  try {
    await connection.promise().query('UPDATE products SET is_draft=0 WHERE external_id=?',[req.params.id]);
  invalidateProductCache();
  res.json({ published:true });
  } catch(e){ res.status(500).json({ error:'DB', detail:e.message }); }
});

// Upload endpoint (basic validation + TODO: optional resize/compress)
app.post('/upload/image', authRequired, rateLimitUpload, upload.single('file'), async (req,res)=> {
  if (!req.file) return res.status(400).json({ error:'missing_file' });
  const allowed = ['image/jpeg','image/png','image/webp'];
  if (!allowed.includes(req.file.mimetype)) {
    fs.unlink(req.file.path, ()=>{});
    return res.status(415).json({ error:'unsupported_type' });
  }
  if (req.file.size > 5*1024*1024) { // 5MB cap
    fs.unlink(req.file.path, ()=>{});
    return res.status(413).json({ error:'file_too_large' });
  }
  // sharp optimalisatie: resize max 1600x1600 & convert naar webp (kwaliteit 80)
  if (sharp) {
    try {
      const base = path.parse(req.file.filename).name;
      const outName = base + '.webp';
      const outPath = path.join(uploadsDir, outName);
      await sharp(req.file.path)
        .rotate() // auto-orientation
        .resize({ width:1600, height:1600, fit:'inside', withoutEnlargement:true })
        .webp({ quality:80 })
        .toFile(outPath);
      fs.unlink(req.file.path, ()=>{}); // verwijder origineel
      return res.json({ url:'/uploads/'+outName, format:'webp', optimized:true });
    } catch(e){ console.warn('[upload][sharp] kon niet optimaliseren:', e.message); }
  }
  // Fallback: originele file teruggeven
  res.json({ url:'/uploads/'+req.file.filename, optimized:false });
});

// Admin users API
app.get('/admin/users', authRequired, adminRequired, async (req,res)=> {
  try {
    let rows;
    try {
  [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, disabled_reason, disabled_at, created_at, pwd_must_change FROM users ORDER BY id ASC LIMIT 1000');
    } catch(e) {
      if (/Unknown column 'created_at'/.test(e.message)) {
        console.warn('[admin/users] ontbrekende created_at kolom -> upgrade uitvoeren');
        ensureUsersSchemaUpgrade();
        [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled FROM users ORDER BY id ASC LIMIT 1000');
        return res.json(rows.map(r=> ({ id:r.id, username:r.username, email:r.email, role:r.role, canUpload:!!r.can_upload, disabled: !!r.disabled }))); 
      }
      throw e;
    }
  res.json(rows.map(r=> ({ id:r.id, username:r.username, email:r.email, role:r.role, canUpload:!!r.can_upload, disabled: !!r.disabled, disabledReason: r.disabled_reason, disabledAt: r.disabled_at, createdAt: r.created_at, mustChange: !!r.pwd_must_change }))); 
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});
// Aanmaken nieuwe user (admin)
app.post('/admin/users', authRequired, adminRequired, async (req,res)=> {
  const { username, email, password, role, canUpload, disabled, mustChangePassword } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error:'missing_fields' });
  if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error:'invalid_username' });
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return res.status(400).json({ error:'invalid_email' });
  if (password.length < 8) return res.status(400).json({ error:'weak_password' });
  const finalRole = (role==='admin'||role==='user')? role : 'user';
  const finalCanUpload = canUpload?1:0;
  const finalDisabled = disabled?1:0;
  try {
    const hash = await bcrypt.hash(password, 10);
  await connection.promise().query('INSERT INTO users (username,email,password,role,can_upload,disabled,pwd_must_change) VALUES (?,?,?,?,?,?,?)',[username,email,hash,finalRole,finalCanUpload,finalDisabled, mustChangePassword?1:0]);
  const [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, disabled_reason, disabled_at, created_at, pwd_must_change FROM users WHERE username=? LIMIT 1',[username]);
    const u = rows[0];
  res.status(201).json({ id:u.id, username:u.username, email:u.email, role:u.role, canUpload:!!u.can_upload, disabled: !!u.disabled, disabledReason: u.disabled_reason, disabledAt: u.disabled_at, createdAt:u.created_at, mustChange: !!u.pwd_must_change });
  } catch(e){
    if (e && e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error:'duplicate' });
    res.status(500).json({ error:'db', detail:e.message });
  }
});
app.put('/admin/users/:id', authRequired, adminRequired, async (req,res)=> {
  const id = parseInt(req.params.id,10); const { role, canUpload, disabled, mustChange, username, email, disabledReason } = req.body||{};
  log('debug','admin PUT user',{ id, username, email, role, canUpload, disabled, mustChange, disabledReason });
  if (req.user.sub === id && role && role!=='admin') return res.status(400).json({ error:'cannot_demote_self' });
  // Audit snapshot voor wijziging
  let beforeRow=null; try { const [br] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, disabled_reason, disabled_at, pwd_must_change FROM users WHERE id=? LIMIT 1',[id]); if (br.length) beforeRow=br[0]; } catch(e){}
  const fields=[]; const params=[];
  if (username !== undefined) {
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) return res.status(400).json({ error:'invalid_username' });
    if (username !== 'admin') { fields.push('username=?'); params.push(username); }
  }
  if (email !== undefined) {
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) return res.status(400).json({ error:'invalid_email' });
    fields.push('email=?'); params.push(email);
  }
  if (role && (role==='admin'||role==='user')) { fields.push('role=?'); params.push(role); }
  if (canUpload!==undefined) { fields.push('can_upload=?'); params.push(canUpload?1:0); }
  if (disabled!==undefined) {
    fields.push('disabled=?'); params.push(disabled?1:0);
    if (disabled) {
      fields.push('disabled_at=?'); params.push(new Date());
      if (disabledReason !== undefined) { fields.push('disabled_reason=?'); params.push(disabledReason||null); }
    } else {
      fields.push('disabled_reason=NULL');
      fields.push('disabled_at=NULL');
    }
  } else if (disabledReason !== undefined) {
    if (!beforeRow || !beforeRow.disabled) return res.status(400).json({ error:'reason_only_when_disabled' });
    fields.push('disabled_reason=?'); params.push(disabledReason||null);
  }
  if (mustChange!==undefined) { fields.push('pwd_must_change=?'); params.push(mustChange?1:0); }
  if (!fields.length) return res.json({ updated:0 });
  try {
    const [result] = await connection.promise().query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, [...params, id]);
    log('info','users update executed',{ id, affected: result.affectedRows, fields });
    const [rows] = await connection.promise().query('SELECT id, username, email, role, can_upload, disabled, disabled_reason, disabled_at, pwd_must_change FROM users WHERE id=?',[id]);
    if (!rows.length) return res.status(404).json({ error:'not_found' });
    const u = rows[0];
    log('info','users update row after', u);
    try { await connection.promise().query('INSERT INTO user_audit (actor_id, target_user_id, action, before_json, after_json) VALUES (?,?,?,?,?)',[req.user.sub, id, 'update_user', beforeRow?JSON.stringify(beforeRow):null, JSON.stringify(u)]); } catch(ae){ console.warn('[audit] insert fout', ae.message); }
    res.json({ id:u.id, username:u.username, email:u.email, role:u.role, canUpload:!!u.can_upload, disabled: !!u.disabled, disabledReason: u.disabled_reason, disabledAt: u.disabled_at, mustChange: !!u.pwd_must_change });
  } catch(e){ log('error','users update error', e.message); res.status(500).json({ error:'db', detail:e.message }); }
});
// Forceer password reset: genereer tijdelijk wachtwoord en zet must_change flag
app.post('/admin/users/:id/force-reset', authRequired, adminRequired, async (req,res)=> {
  const id = parseInt(req.params.id,10);
  try {
    const [rows] = await connection.promise().query('SELECT id, username FROM users WHERE id=? LIMIT 1',[id]);
    if (!rows.length) return res.status(404).json({ error:'not_found' });
    // Genereer temp wachtwoord (12 chars)
    const temp = crypto.randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g,'').slice(0,12);
    const hash = await bcrypt.hash(temp, 10);
    await connection.promise().query('UPDATE users SET password=?, pwd_must_change=1 WHERE id=?',[hash, id]);
    res.json({ tempPassword: temp });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});
// Verwijderen user (hard delete) met safeguards
app.delete('/admin/users/:id', authRequired, adminRequired, async (req,res)=> {
  const id = parseInt(req.params.id,10);
  if (req.user.sub === id) return res.status(400).json({ error:'cannot_delete_self' });
  try {
    // Controleer of target bestaat
    const [rows] = await connection.promise().query('SELECT id, role FROM users WHERE id=? LIMIT 1',[id]);
    if (!rows.length) return res.status(404).json({ error:'not_found' });
    if (rows[0].role === 'admin') {
      const [admins] = await connection.promise().query('SELECT COUNT(*) AS c FROM users WHERE role="admin"');
      if (admins[0].c <= 1) return res.status(400).json({ error:'cannot_delete_last_admin' });
    }
    await connection.promise().query('DELETE FROM users WHERE id=?',[id]);
    res.json({ deleted:true });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});

// Migration (temporary)
app.post('/api/products/migrate', authRequired, async (req,res) => {
  const items = req.body?.items || [];
  let inserted=0, skipped=0, errors=[];
  for (const p of items) {
    try {
      const [exists] = await connection.promise().query('SELECT id FROM products WHERE external_id=? LIMIT 1',[p.id]);
      if (exists.length) { skipped++; continue; }
      await connection.promise().query(`INSERT INTO products (external_id,title,category,price,qty,\`condition\`,description,images_json,owner_id,owner_name,tags_json,location,min_order,negotiable,vat_included,shipping_methods_json,expires_at,brand,external_link,is_draft,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[
        p.id, p.title||'', p.category||null, p.price||null, p.qty||null, p.condition||null, p.description||null, JSON.stringify(p.images||[]), p.ownerId||null, p.ownerName||null, JSON.stringify(p.tags||[]), p.location||null, p.minOrder||null, p.negotiable?1:0, p.vatIncluded?1:0, JSON.stringify(p.shippingMethods||[]), p.expiresAt? new Date(p.expiresAt): null, p.brand||null, p.externalLink||null, p.isDraft?1:0, p.createdAt? new Date(p.createdAt): new Date() ]);
      inserted++;
    } catch(e){ errors.push(e.message); }
  }
  res.json({ inserted, skipped, errors });
});

// Lightweight ping zonder DB
app.get('/ping', (req,res) => res.type('text/plain').send('pong'));

// --------- React build (SPA) static hosting & client-route fallback ----------
// Dit voorkomt "Cannot GET /partijen" wanneer je rechtstreeks een diepere URL opent.
// Eerst controleren of de build map bestaat (na `npm run build`).
const clientBuildDir = path.join(__dirname, 'build');
if (fs.existsSync(clientBuildDir)) {
  // Statische assets (JS/CSS) met lange cache, index.html korter.
  app.use(express.static(clientBuildDir, {
    setHeaders: (res, filePath) => {
      if (/\\.(js|css|woff2?|png|jpe?g|webp|gif|svg)$/i.test(filePath)) {
        res.setHeader('Cache-Control','public, max-age=31536000, immutable');
      } else if (/index\.html$/i.test(filePath)) {
        res.setHeader('Cache-Control','public, max-age=60');
      }
    }
  }));
  // Fallback voor client routes (alles wat geen API / upload / admin / sitemap is)
  // 'admin' verwijderd uit de exclude lijst zodat /admin route door de SPA wordt afgehandeld
  app.get(/^(?!\/(api|auth|upload|sitemap\.xml|healthz|ping|uploads)\b).*/, (req,res,next)=> {
    // Alleen GET voor HTML fallback
    if (req.method !== 'GET') return next();
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });
} else {
  console.log('[spa] build map niet gevonden, run eerst: npm run build');
}

// Error logging middleware (na routes)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  if (res.headersSent) return; 
  res.status(500).json({ error: 'internal_error' });
});
// (Dubbele CORS middleware verwijderd – bovenaan staat al volledige CORS afhandeling)

const PORT = process.env.PORT || 4000;
try {
  const server = app.listen(PORT, () => {
    console.log(`Server draait op http://localhost:${PORT}`);
  const used = process.memoryUsage();
  console.log(`[ready] PID=${process.pid} rss=${Math.round(used.rss/1024/1024)}MB heapUsed=${Math.round(used.heapUsed/1024/1024)}MB tijd=${new Date().toISOString()}`);
  });
  server.on('error', (e) => { console.error('Listen error:', e); });
  server.on('close', ()=> console.log('Server sluit.'));
} catch (e) {
  console.error('Kon server niet starten:', e);
}

// ---------------- Legacy base64 -> file migratie ---------------------------
let migratingImages = false;
async function migrateLegacyBase64Images(limit = 250) {
  if (migratingImages) { console.log('[migrate] reeds bezig'); return { running:true }; }
  if (!sharp) { console.log('[migrate] sharp ontbreekt – migratie slaat optimalisatie stap over'); }
  migratingImages = true;
  const started = Date.now();
  let scanned = 0, converted = 0, skipped = 0, errors = 0;
  try {
    const [rows] = await connection.promise().query('SELECT id, external_id, images_json FROM products WHERE images_json IS NOT NULL ORDER BY id DESC LIMIT 1000');
    for (const row of rows) {
      if (converted >= limit) break;
      let images; try { images = JSON.parse(row.images_json)||[]; } catch { images = []; }
      if (!Array.isArray(images) || !images.length) { continue; }
      let changed = false;
      for (const img of images) {
        if (converted >= limit) break;
        if (img && !img.url && img.dataUrl && typeof img.dataUrl === 'string' && img.dataUrl.startsWith('data:image/')) {
          scanned++;
          try {
            const m = /^data:(image\/(png|jpe?g|webp|gif));base64,(.+)$/i.exec(img.dataUrl);
            if (!m) { skipped++; continue; }
            const b64 = m[3];
            if (b64.length > 10*1024*1024) { skipped++; continue; } // skip > ~10MB base64
            const buf = Buffer.from(b64, 'base64');
            const filenameBase = crypto.randomUUID();
            let outName = filenameBase;
            try {
              if (sharp) {
                outName = filenameBase + '.webp';
                await sharp(buf)
                  .rotate()
                  .resize({ width:1600, height:1600, fit:'inside', withoutEnlargement:true })
                  .webp({ quality:80 })
                  .toFile(path.join(uploadsDir, outName));
              } else {
                // bewaar origineel als png
                outName = filenameBase + '.png';
                fs.writeFileSync(path.join(uploadsDir, outName), buf);
              }
              img.url = '/uploads/' + outName;
              delete img.dataUrl;
              converted++;
              changed = true;
            } catch (e) {
              errors++; console.warn('[migrate][img] fout', e.message); continue;
            }
          } catch (e) { errors++; }
        }
      }
      if (changed) {
        try { await connection.promise().query('UPDATE products SET images_json=? WHERE id=?', [JSON.stringify(images), row.id]); } catch (e) { console.warn('[migrate] update fout', e.message); }
      }
    }
  } catch (e) { console.warn('[migrate] query fout', e.message); }
  migratingImages = false;
  const ms = Date.now()-started;
  console.log(`[migrate] klaar scanned=${scanned} converted=${converted} skipped=${skipped} errors=${errors} in ${ms}ms`);
  return { scanned, converted, skipped, errors, ms };
}

// Handmatige trigger (alleen admin)
app.post('/admin/migrate-images', authRequired, adminRequired, async (req,res)=> {
  try {
    const result = await migrateLegacyBase64Images(typeof req.body?.limit==='number'? req.body.limit : 250);
    res.json({ ok:true, ...result });
  } catch (e) { res.status(500).json({ error:'migrate_failed', detail:e.message }); }
});


// Eerste keer wachtwoord instellen (geen oud wachtwoord nodig maar vlag moet aan staan)
app.post('/auth/first-password', authRequired, async (req,res)=> {
  const { newPassword } = req.body || {};
  if (!newPassword) return res.status(400).json({ error:'missing_new_password' });
  if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return res.status(400).json({ error:'weak_password' });
  try {
    const [rows] = await connection.promise().query('SELECT id, pwd_must_change FROM users WHERE id=? LIMIT 1',[req.user.sub]);
    if (!rows.length) return res.status(404).json({ error:'user_not_found' });
    if (!rows[0].pwd_must_change) return res.status(400).json({ error:'flag_not_set' });
    const hash = await bcrypt.hash(newPassword, 10);
    await connection.promise().query('UPDATE users SET password=?, pwd_must_change=0 WHERE id=?',[hash, req.user.sub]);
    res.json({ changed:true });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});
// Development-only endpoints
if (process.env.NODE_ENV !== 'production') {
  app.get('/auth/_debug_users', (req,res)=> {
    connection.query('SELECT id, username, email, role, can_upload FROM users ORDER BY id ASC LIMIT 50', (err, rows)=>{
      if (err) return res.status(500).json({ error:'db', detail: err.message });
      res.json({ users: rows });
    });
  });
  app.post('/auth/create-default-admin', (req,res)=> {
    connection.query('SELECT id FROM users WHERE username="admin" OR role="admin" LIMIT 1', (err, rows)=>{
      if (err) return res.status(500).json({ error:'db', detail: err.message });
      if (rows && rows.length) return res.json({ ok:true, already:true });
      bcrypt.hash('admin123',10,(e,hash)=>{
        if (e) return res.status(500).json({ error:'hash' });
        connection.query('SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = "users" AND COLUMN_NAME = "role"', (ce, cols)=>{
          const hasRole = !ce && cols && cols.length>0;
          const sql = hasRole? 'INSERT INTO users (username,email,password,role) VALUES (?,?,?,?)' : 'INSERT INTO users (username,email,password) VALUES (?,?,?)';
          const params = hasRole? ['admin','admin@example.com',hash,'admin'] : ['admin','admin@example.com',hash];
          connection.query(sql, params, (ie)=>{
            if (ie) return res.status(500).json({ error:'insert', detail: ie.message });
            res.json({ ok:true, created:true });
          });
        });
      });
    });
  });
}

// Audit tabel aanmaken (logging van user wijzigingen)
function ensureUserAuditTable(){
  const ddl = `CREATE TABLE IF NOT EXISTS user_audit (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_id BIGINT UNSIGNED NULL,
    target_user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(60) NOT NULL,
    before_json JSON NULL,
    after_json JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_audit_target (target_user_id),
    KEY idx_user_audit_actor (actor_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  connection.query(ddl, e=>{ if (e) console.warn('[audit] DDL fout', e.message); else console.log('[audit] user_audit gegarandeerd'); });
}

// Audit log ophalen (admin)
app.get('/admin/audit', authRequired, adminRequired, async (req,res)=> {
  const { target, actor, action, page, limit } = req.query || {};
  let where = '1=1';
  const params = [];
  if (target) { where += ' AND a.target_user_id=?'; params.push(parseInt(target,10)||0); }
  if (actor) { where += ' AND a.actor_id=?'; params.push(parseInt(actor,10)||0); }
  if (action) { where += ' AND a.action=?'; params.push(String(action).slice(0,60)); }
  const pg = Math.max(1, parseInt(page,10) || 1);
  const lim = Math.min(100, Math.max(1, parseInt(limit,10) || 25));
  const off = (pg-1)*lim;
  try {
    const [[countRow]] = await connection.promise().query(`SELECT COUNT(*) AS cnt FROM user_audit a WHERE ${where}`, params);
    const total = countRow?.cnt || 0;
    const totalPages = Math.max(1, Math.ceil(total/lim));
    const [rows] = await connection.promise().query(`
      SELECT a.id,a.actor_id,a.target_user_id,a.action,a.before_json,a.after_json,a.created_at,
             au.username AS actor_username, tu.username AS target_username
      FROM user_audit a
      LEFT JOIN users au ON au.id=a.actor_id
      LEFT JOIN users tu ON tu.id=a.target_user_id
      WHERE ${where}
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `, [...params, lim, off]);
    const items = rows.map(r=>{
      let changes=[];
      try {
        const before = r.before_json? JSON.parse(r.before_json): null;
        const after = r.after_json? JSON.parse(r.after_json): null;
        if (before && after && typeof before==='object' && typeof after==='object') {
          const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).slice(0,100);
            changes = keys.filter(k=> k!== 'password' && JSON.stringify(before[k]) !== JSON.stringify(after[k]))
              .map(k=> ({ field:k, before: before[k] ?? null, after: after[k] ?? null }));
        }
      } catch {}
      return {
        id: r.id,
        action: r.action,
        createdAt: r.created_at,
        actor: r.actor_id? { id: r.actor_id, username: r.actor_username || null } : null,
        target: { id: r.target_user_id, username: r.target_username || null },
        changes
      };
    });
    res.json({ items, page: pg, totalPages, total, limit: lim });
  } catch(e){ res.status(500).json({ error:'db', detail:e.message }); }
});