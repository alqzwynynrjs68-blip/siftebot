import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
const file=process.env.DB_PATH||'./data/bot.sqlite'; fs.mkdirSync(path.dirname(file),{recursive:true});
export const db=new Database(file); db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT,username TEXT);
CREATE TABLE IF NOT EXISTS groups(id INTEGER PRIMARY KEY,title TEXT,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS members(chat INTEGER,user INTEGER,messages INTEGER DEFAULT 0,points INTEGER DEFAULT 0,warnings INTEGER DEFAULT 0,PRIMARY KEY(chat,user));
CREATE TABLE IF NOT EXISTS settings(chat INTEGER PRIMARY KEY,locks TEXT DEFAULT '{}',maxwarn INTEGER DEFAULT 3,punishment TEXT DEFAULT 'mute',duration INTEGER DEFAULT 30,channel TEXT);
CREATE TABLE IF NOT EXISTS games(chat INTEGER PRIMARY KEY,active INTEGER DEFAULT 0,answer TEXT,emoji TEXT);
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY,chat INTEGER,reporter INTEGER,target INTEGER,message INTEGER,status TEXT DEFAULT 'new');
CREATE TABLE IF NOT EXISTS autoreplies(id INTEGER PRIMARY KEY,chat INTEGER,trigger TEXT,responses TEXT);
CREATE TABLE IF NOT EXISTS mandatory_channels(id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id TEXT NOT NULL,invite TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bot_meta(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE IF NOT EXISTS group_config(chat INTEGER PRIMARY KEY,welcome INTEGER DEFAULT 1,welcome_text TEXT DEFAULT '',service_messages INTEGER DEFAULT 1,auto_replies INTEGER DEFAULT 1,anti_flood INTEGER DEFAULT 0,links_allow TEXT DEFAULT '',anti_bot INTEGER DEFAULT 0,word_filter INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS admin_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER,actor INTEGER,action TEXT,target INTEGER,details TEXT,created_at INTEGER);
CREATE TABLE IF NOT EXISTS group_bans(chat INTEGER,target INTEGER,reason TEXT,created_at INTEGER,PRIMARY KEY(chat,target));
CREATE TABLE IF NOT EXISTS blocked_words(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER,word TEXT NOT NULL,UNIQUE(chat,word));`);
const cfgCols=db.prepare('PRAGMA table_info(group_config)').all().map(x=>x.name);
for(const [n,d] of [['anti_bot','INTEGER DEFAULT 0'],['word_filter','INTEGER DEFAULT 0']]) if(!cfgCols.includes(n)) db.exec(`ALTER TABLE group_config ADD COLUMN ${n} ${d}`);
// الردود التلقائية الأساسية مفعلة افتراضياً لكل المجموعات الموجودة.
try{db.exec("UPDATE group_config SET auto_replies=1 WHERE auto_replies IS NULL")}catch{}
const gameCols=db.prepare('PRAGMA table_info(games)').all().map(x=>x.name);
if(!gameCols.includes('game_type')) db.exec("ALTER TABLE games ADD COLUMN game_type TEXT DEFAULT 'mean'");
if(!gameCols.includes('prompt')) db.exec("ALTER TABLE games ADD COLUMN prompt TEXT");
const run=(q,...a)=>db.prepare(q).run(...a), get=(q,...a)=>db.prepare(q).get(...a), all=(q,...a)=>db.prepare(q).all(...a);
export const user=u=>run('INSERT INTO users VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username=excluded.username',u.id,u.first_name||'',u.username||'');
export const group=c=>{run('INSERT INTO groups(id,title) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,active=1',c.id,c.title||'');run('INSERT OR IGNORE INTO settings(chat) VALUES(?)',c.id)};
export const message=(c,u)=>run('INSERT INTO members(chat,user,messages) VALUES(?,?,1) ON CONFLICT(chat,user) DO UPDATE SET messages=messages+1',c,u);
export const points=(c,u,n=2)=>run('INSERT INTO members(chat,user,points) VALUES(?,?,?) ON CONFLICT(chat,user) DO UPDATE SET points=points+excluded.points',c,u,n);
export const member=(c,u)=>get('SELECT * FROM members WHERE chat=? AND user=?',c,u)||{messages:0,points:0,warnings:0};
export const top=c=>all('SELECT m.*,u.name FROM members m LEFT JOIN users u ON u.id=m.user WHERE chat=? ORDER BY points DESC,messages DESC LIMIT 10',c);
export const settings=c=>{let x=get('SELECT * FROM settings WHERE chat=?',c)||{};let locks={};try{locks=JSON.parse(x.locks||'{}')}catch{};locks=locks&&typeof locks==='object'&&!Array.isArray(locks)?locks:{};const defaults={links:false,photos:false,videos:false,media:false,audio:false,stickers:false,forward:false,repeat:false};return {...x,locks:{...defaults,...locks}}};
export const lock=(c,k,v)=>{let s=settings(c);s.locks[k]=v;run('UPDATE settings SET locks=? WHERE chat=?',JSON.stringify(s.locks),c)};
export const set=(c,k,v)=>{if(!['maxwarn','punishment','duration','channel'].includes(k))throw Error('bad setting');run(`UPDATE settings SET ${k}=? WHERE chat=?`,v,c)};
export const warn=(c,u)=>{run('INSERT INTO members(chat,user,warnings) VALUES(?,?,1) ON CONFLICT(chat,user) DO UPDATE SET warnings=warnings+1',c,u);return member(c,u).warnings};
export const game=(c,active,answer=null,prompt=null,type='mean')=>run('INSERT INTO games(chat,active,answer,emoji,game_type,prompt) VALUES(?,?,?,?,?,?) ON CONFLICT(chat) DO UPDATE SET active=excluded.active,answer=excluded.answer,emoji=excluded.emoji,game_type=excluded.game_type,prompt=excluded.prompt',c,+active,answer,prompt,type);
export const currentGame=c=>get('SELECT * FROM games WHERE chat=?',c);
export const report=(c,r,t,m)=>run("INSERT INTO reports(chat,reporter,target,message,status) VALUES(?,?,?,?, 'new')",c,r,t,m);
export const stats=()=>({users:get('SELECT count(*) n FROM users').n,groups:get('SELECT count(*) n FROM groups WHERE active=1').n,reports:get("SELECT count(*) n FROM reports WHERE status='new'").n});
export const users=()=>all('SELECT * FROM users ORDER BY rowid DESC LIMIT 30');
export const groups=()=>all('SELECT * FROM groups WHERE active=1 ORDER BY rowid DESC LIMIT 30');
export const destinations=()=>[...all('SELECT id FROM users').map(x=>x.id),...all('SELECT id FROM groups WHERE active=1').map(x=>x.id)];

// وظائف إضافية لإدارة الردود والبلاغات من لوحة المالك.
export const addReply=(chat,trigger,responses)=>run('INSERT INTO autoreplies(chat,trigger,responses) VALUES(?,?,?)',chat,trigger,JSON.stringify(responses));
export const listReplies=chat=>all('SELECT * FROM autoreplies WHERE chat=? ORDER BY id DESC',chat);
export const removeReply=(chat,id)=>run('DELETE FROM autoreplies WHERE chat=? AND id=?',chat,id);
export const pendingReports=()=>all("SELECT * FROM reports WHERE status='new' ORDER BY id DESC LIMIT 50");
export const resolveReport=id=>run("UPDATE reports SET status='done' WHERE id=?",id);

export const addMandatoryChannel=(id,invite)=>run('INSERT INTO mandatory_channels(chat_id,invite) VALUES(?,?)',id,invite);
export const mandatoryChannels=()=>all('SELECT * FROM mandatory_channels ORDER BY id DESC');
export const removeMandatoryChannel=id=>run('DELETE FROM mandatory_channels WHERE id=?',id);
export const markGroupLeft=id=>run('UPDATE groups SET active=0 WHERE id=?',id);
export const groupMembers=chat=>all('SELECT m.*,u.name,u.username FROM members m LEFT JOIN users u ON u.id=m.user WHERE m.chat=? ORDER BY m.messages DESC LIMIT 30',chat);
export const resetWarnings=(chat,u)=>run('UPDATE members SET warnings=0 WHERE chat=? AND user=?',chat,u);

export const userGroups=u=>all('SELECT g.id,g.title FROM groups g JOIN members m ON m.chat=g.id WHERE m.user=? AND g.active=1 ORDER BY g.title',u);

export const groupConfig=c=>{let x=get('SELECT * FROM group_config WHERE chat=?',c);if(!x){run('INSERT OR IGNORE INTO group_config(chat) VALUES(?)',c);x=get('SELECT * FROM group_config WHERE chat=?',c)}return x||{welcome:1,welcome_text:'',service_messages:1,auto_replies:1,anti_flood:0,links_allow:'',anti_bot:0,word_filter:0}};
export const setGroupConfig=(c,k,v)=>{if(!['welcome','welcome_text','service_messages','auto_replies','anti_flood','links_allow','anti_bot','word_filter'].includes(k))throw Error('bad group config');run('INSERT OR IGNORE INTO group_config(chat) VALUES(?)',c);run(`UPDATE group_config SET ${k}=? WHERE chat=?`,v,c)};
export const logAdmin=(chat,actor,action,target=null,details='')=>run('INSERT INTO admin_logs(chat,actor,action,target,details,created_at) VALUES(?,?,?,?,?,?)',chat,actor,action,target,details,Date.now());
export const adminLogs=chat=>all('SELECT * FROM admin_logs WHERE chat=? ORDER BY id DESC LIMIT 50',chat);
export const groupBan=(chat,target,reason='')=>run('INSERT INTO group_bans(chat,target,reason,created_at) VALUES(?,?,?,?) ON CONFLICT(chat,target) DO UPDATE SET reason=excluded.reason,created_at=excluded.created_at',chat,target,reason,Date.now());
export const groupUnban=(chat,target)=>run('DELETE FROM group_bans WHERE chat=? AND target=?',chat,target);

export const addBlockedWord=(chat,word)=>run('INSERT OR IGNORE INTO blocked_words(chat,word) VALUES(?,?)',chat,word);
export const removeBlockedWord=(chat,word)=>run('DELETE FROM blocked_words WHERE chat=? AND word=?',chat,word);
export const blockedWords=chat=>all('SELECT * FROM blocked_words WHERE chat=? ORDER BY id DESC',chat);
