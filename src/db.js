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
CREATE TABLE IF NOT EXISTS bot_meta(key TEXT PRIMARY KEY,value TEXT);`);
const run=(q,...a)=>db.prepare(q).run(...a), get=(q,...a)=>db.prepare(q).get(...a), all=(q,...a)=>db.prepare(q).all(...a);
export const user=u=>run('INSERT INTO users VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username=excluded.username',u.id,u.first_name||'',u.username||'');
export const group=c=>{run('INSERT INTO groups(id,title) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,active=1',c.id,c.title||'');run('INSERT OR IGNORE INTO settings(chat) VALUES(?)',c.id)};
export const message=(c,u)=>run('INSERT INTO members(chat,user,messages) VALUES(?,?,1) ON CONFLICT(chat,user) DO UPDATE SET messages=messages+1',c,u);
export const points=(c,u,n=2)=>run('INSERT INTO members(chat,user,points) VALUES(?,?,?) ON CONFLICT(chat,user) DO UPDATE SET points=points+excluded.points',c,u,n);
export const member=(c,u)=>get('SELECT * FROM members WHERE chat=? AND user=?',c,u)||{messages:0,points:0,warnings:0};
export const top=c=>all('SELECT m.*,u.name FROM members m LEFT JOIN users u ON u.id=m.user WHERE chat=? ORDER BY points DESC,messages DESC LIMIT 10',c);
export const settings=c=>{let x=get('SELECT * FROM settings WHERE chat=?',c)||{};return {...x,locks:JSON.parse(x.locks||'{}')}};
export const lock=(c,k,v)=>{let s=settings(c);s.locks[k]=v;run('UPDATE settings SET locks=? WHERE chat=?',JSON.stringify(s.locks),c)};
export const set=(c,k,v)=>{if(!['maxwarn','punishment','duration','channel'].includes(k))throw Error('bad setting');run(`UPDATE settings SET ${k}=? WHERE chat=?`,v,c)};
export const warn=(c,u)=>{run('INSERT INTO members(chat,user,warnings) VALUES(?,?,1) ON CONFLICT(chat,user) DO UPDATE SET warnings=warnings+1',c,u);return member(c,u).warnings};
export const game=(c,active,answer=null,emoji=null)=>run('INSERT INTO games(chat,active,answer,emoji) VALUES(?,?,?,?) ON CONFLICT(chat) DO UPDATE SET active=excluded.active,answer=excluded.answer,emoji=excluded.emoji',c,+active,answer,emoji);
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
