import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
const file=process.env.DB_PATH||'./data/bot.sqlite'; fs.mkdirSync(path.dirname(file),{recursive:true});
// استعادة مؤجلة وآمنة: تُطبّق النسخة بعد إعادة التشغيل وقبل فتح قاعدة البيانات الرئيسية.
const pendingRestore=`${file}.restore-pending`;
if(fs.existsSync(pendingRestore)){
  let valid=false;
  try{
    const candidate=new Database(pendingRestore,{readonly:true,fileMustExist:true});
    const integrity=candidate.pragma('integrity_check',{simple:true});
    const required=candidate.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','groups','members','settings')").all().map(x=>x.name);
    valid=integrity==='ok'&&required.length===4;
    candidate.close();
  }catch(err){console.error('Pending database restore validation failed:',err?.message||err)}
  if(valid){
    try{
      if(fs.existsSync(file)){
        const current=new Database(file);
        const backupDir=path.resolve('./backups');fs.mkdirSync(backupDir,{recursive:true});
        const safeName=`pre-restore-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`;
        try{await current.backup(path.join(backupDir,safeName))}finally{current.close()}
      }
      for(const suffix of ['-wal','-shm'])try{fs.unlinkSync(`${file}${suffix}`)}catch{}
      const applying=`${file}.restore-applying`;fs.copyFileSync(pendingRestore,applying);fs.renameSync(applying,file);
      fs.unlinkSync(pendingRestore);
      console.log('A validated database backup was restored at startup.');
    }catch(err){console.error('Applying pending database restore failed:',err?.message||err)}
  }else console.error('A pending restore file was rejected; the active database was left unchanged.');
}
export const db=new Database(file); db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT,username TEXT);
CREATE TABLE IF NOT EXISTS groups(id INTEGER PRIMARY KEY,title TEXT,active INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS members(chat INTEGER,user INTEGER,messages INTEGER DEFAULT 0,points INTEGER DEFAULT 0,warnings INTEGER DEFAULT 0,last_seen INTEGER DEFAULT 0,PRIMARY KEY(chat,user));
CREATE TABLE IF NOT EXISTS activity_daily(chat INTEGER NOT NULL,user INTEGER NOT NULL,day TEXT NOT NULL,messages INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(chat,user,day));
CREATE INDEX IF NOT EXISTS idx_activity_daily_chat_day ON activity_daily(chat,day);
CREATE TABLE IF NOT EXISTS settings(chat INTEGER PRIMARY KEY,locks TEXT DEFAULT '{}',maxwarn INTEGER DEFAULT 5,punishment TEXT DEFAULT 'mute',duration INTEGER DEFAULT 30,channel TEXT);
CREATE TABLE IF NOT EXISTS games(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER NOT NULL,active INTEGER DEFAULT 1,answer TEXT,emoji TEXT,game_type TEXT DEFAULT 'mean',prompt TEXT,created_at INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS reports(id INTEGER PRIMARY KEY,chat INTEGER,reporter INTEGER,target INTEGER,message INTEGER,status TEXT DEFAULT 'new');
CREATE TABLE IF NOT EXISTS autoreplies(id INTEGER PRIMARY KEY,chat INTEGER,trigger TEXT,responses TEXT);
CREATE TABLE IF NOT EXISTS mandatory_channels(id INTEGER PRIMARY KEY AUTOINCREMENT,chat_id TEXT NOT NULL,invite TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bot_meta(key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE IF NOT EXISTS group_config(chat INTEGER PRIMARY KEY,welcome INTEGER DEFAULT 1,welcome_text TEXT DEFAULT '',service_messages INTEGER DEFAULT 1,auto_replies INTEGER DEFAULT 1,anti_flood INTEGER DEFAULT 0,links_allow TEXT DEFAULT '',anti_bot INTEGER DEFAULT 0,word_filter INTEGER DEFAULT 0,activated INTEGER DEFAULT 0,reports_enabled INTEGER DEFAULT 0,report_frequency TEXT DEFAULT 'weekly',report_hour INTEGER DEFAULT 20,report_last_sent TEXT DEFAULT '',cleanup_enabled INTEGER DEFAULT 0,retention_days INTEGER DEFAULT 180);
CREATE TABLE IF NOT EXISTS admin_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER,actor INTEGER,action TEXT,target INTEGER,details TEXT,created_at INTEGER);
CREATE TABLE IF NOT EXISTS group_bans(chat INTEGER,target INTEGER,reason TEXT,created_at INTEGER,PRIMARY KEY(chat,target));
CREATE TABLE IF NOT EXISTS blocked_words(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER,word TEXT NOT NULL,UNIQUE(chat,word));
CREATE TABLE IF NOT EXISTS points_history(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER NOT NULL,user INTEGER NOT NULL,amount INTEGER NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_points_history_chat_time ON points_history(chat,created_at);
CREATE TABLE IF NOT EXISTS bot_bans(user INTEGER PRIMARY KEY,reason TEXT DEFAULT '',created_at INTEGER NOT NULL,actor INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS achievements(chat INTEGER NOT NULL,user INTEGER NOT NULL,code TEXT NOT NULL,earned_at INTEGER NOT NULL,reward INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(chat,user,code));
CREATE TABLE IF NOT EXISTS moderation_history(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER NOT NULL,target INTEGER NOT NULL,actor INTEGER NOT NULL,action TEXT NOT NULL,reason TEXT DEFAULT '',duration_minutes INTEGER DEFAULT 0,created_at INTEGER NOT NULL,expires_at INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS admin_permissions(chat INTEGER NOT NULL,user INTEGER NOT NULL,permissions TEXT NOT NULL DEFAULT '{}',updated_at INTEGER NOT NULL,PRIMARY KEY(chat,user));
CREATE INDEX IF NOT EXISTS idx_moderation_history_chat_target ON moderation_history(chat,target,created_at);`);
const cfgCols=db.prepare('PRAGMA table_info(group_config)').all().map(x=>x.name);
for(const [n,d] of [['anti_bot','INTEGER DEFAULT 0'],['word_filter','INTEGER DEFAULT 0'],['activated','INTEGER DEFAULT 0'],['reports_enabled','INTEGER DEFAULT 0'],['report_frequency',"TEXT DEFAULT 'weekly'"],['report_hour','INTEGER DEFAULT 20'],['report_last_sent',"TEXT DEFAULT ''"],['cleanup_enabled','INTEGER DEFAULT 0'],['retention_days','INTEGER DEFAULT 180']]) if(!cfgCols.includes(n)) db.exec(`ALTER TABLE group_config ADD COLUMN ${n} ${d}`);
const memberCols=db.prepare('PRAGMA table_info(members)').all().map(x=>x.name);
if(!memberCols.includes('last_seen'))db.exec('ALTER TABLE members ADD COLUMN last_seen INTEGER DEFAULT 0');
// الردود التلقائية الأساسية مفعلة افتراضياً لكل المجموعات الموجودة.
try{db.exec("UPDATE group_config SET auto_replies=1 WHERE auto_replies IS NULL")}catch{}
try{db.exec("UPDATE settings SET maxwarn=5 WHERE maxwarn=3")}catch{}
let gameCols=db.prepare('PRAGMA table_info(games)').all();
if(gameCols.length && gameCols.some(x=>x.name==='chat' && x.pk===1) && !gameCols.some(x=>x.name==='id' && x.pk===1)){
  db.exec('ALTER TABLE games RENAME TO games_legacy');
  db.exec("CREATE TABLE games(id INTEGER PRIMARY KEY AUTOINCREMENT,chat INTEGER NOT NULL,active INTEGER DEFAULT 1,answer TEXT,emoji TEXT,game_type TEXT DEFAULT 'mean',prompt TEXT,created_at INTEGER DEFAULT 0)");
  try{db.exec("INSERT INTO games(chat,active,answer,emoji,game_type,prompt,created_at) SELECT chat,active,answer,emoji,COALESCE(game_type,'mean'),prompt,strftime('%s','now')*1000 FROM games_legacy WHERE active=1")}catch{}
  db.exec('DROP TABLE games_legacy');
}
gameCols=db.prepare('PRAGMA table_info(games)').all().map(x=>x.name);
if(!gameCols.includes('game_type')) db.exec("ALTER TABLE games ADD COLUMN game_type TEXT DEFAULT 'mean'");
if(!gameCols.includes('prompt')) db.exec("ALTER TABLE games ADD COLUMN prompt TEXT");
if(!gameCols.includes('created_at')) db.exec("ALTER TABLE games ADD COLUMN created_at INTEGER DEFAULT 0");
const run=(q,...a)=>db.prepare(q).run(...a), get=(q,...a)=>db.prepare(q).get(...a), all=(q,...a)=>db.prepare(q).all(...a);
export const user=u=>run('INSERT INTO users VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,username=excluded.username',u.id,u.first_name||'',u.username||'');
export const group=c=>{run('INSERT INTO groups(id,title) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,active=1',c.id,c.title||'');run('INSERT OR IGNORE INTO settings(chat) VALUES(?)',c.id)};
export const message=(c,u)=>{
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  run('INSERT INTO members(chat,user,messages,last_seen) VALUES(?,?,1,?) ON CONFLICT(chat,user) DO UPDATE SET messages=messages+1,last_seen=excluded.last_seen',c,u,now);
  run('INSERT INTO activity_daily(chat,user,day,messages) VALUES(?,?,?,1) ON CONFLICT(chat,user,day) DO UPDATE SET messages=messages+1',c,u,day);
};
export const points=(c,u,n=2)=>{const amount=Number(n)||0;if(amount<=0)return;run('INSERT INTO members(chat,user,points) VALUES(?,?,?) ON CONFLICT(chat,user) DO UPDATE SET points=points+excluded.points',c,u,amount);run('INSERT INTO points_history(chat,user,amount,created_at) VALUES(?,?,?,?)',c,u,amount,Date.now())};
export const member=(c,u)=>get('SELECT * FROM members WHERE chat=? AND user=?',c,u)||{messages:0,points:0,warnings:0};
export const top=c=>all('SELECT m.*,u.name FROM members m LEFT JOIN users u ON u.id=m.user WHERE chat=? ORDER BY points DESC,messages DESC LIMIT 10',c);
export const topPeriod=(c,since)=>all("SELECT h.user,COALESCE(u.name,'عضو') name,SUM(h.amount) points FROM points_history h LEFT JOIN users u ON u.id=h.user WHERE h.chat=? AND h.created_at>=? GROUP BY h.user ORDER BY points DESC LIMIT 10",c,since);
export const groupStats=c=>get('SELECT COUNT(*) members,COALESCE(SUM(messages),0) messages,COALESCE(SUM(points),0) points,COALESCE(SUM(warnings),0) warnings,COUNT(CASE WHEN last_seen>=? THEN 1 END) active_7d FROM members WHERE chat=?',Date.now()-7*86400000,c)||{members:0,messages:0,points:0,warnings:0,active_7d:0};
export const groupActivitySummary=(chat,days=7)=>{const since=new Date(Date.now()-(Math.max(1,days)-1)*86400000).toISOString().slice(0,10);return get('SELECT COALESCE(SUM(messages),0) messages,COUNT(DISTINCT user) active FROM activity_daily WHERE chat=? AND day>=?',chat,since)||{messages:0,active:0}};
export const groupActivityChart=chat=>all("SELECT day,COALESCE(SUM(messages),0) messages FROM activity_daily WHERE chat=? AND day>=? GROUP BY day ORDER BY day",chat,new Date(Date.now()-6*86400000).toISOString().slice(0,10));
export const inactiveMembers=(chat,days=30,limit=15)=>all('SELECT m.user,m.messages,m.points,m.warnings,m.last_seen,u.name,u.username FROM members m LEFT JOIN users u ON u.id=m.user WHERE m.chat=? AND m.last_seen>0 AND m.last_seen<? ORDER BY m.last_seen ASC LIMIT ?',chat,Date.now()-days*86400000,limit);
export const groupsWithReports=()=>all("SELECT g.id,g.title,c.report_frequency,c.report_hour,c.report_last_sent FROM groups g JOIN group_config c ON c.chat=g.id WHERE g.active=1 AND c.reports_enabled=1");
export const markGroupReportSent=(chat,key)=>run('UPDATE group_config SET report_last_sent=? WHERE chat=?',key,chat);
export const groupsWithCleanup=()=>all('SELECT chat,retention_days FROM group_config WHERE cleanup_enabled=1');
export const cleanupGroupLogs=(chat,days=180)=>{const cutoff=Date.now()-Math.max(30,Math.min(3650,Number(days)||180))*86400000;const day=new Date(cutoff).toISOString().slice(0,10);const a=run('DELETE FROM moderation_history WHERE chat=? AND created_at<?',chat,cutoff).changes;const b=run('DELETE FROM admin_logs WHERE chat=? AND created_at<?',chat,cutoff).changes;const c=run('DELETE FROM points_history WHERE chat=? AND created_at<?',chat,cutoff).changes;const d=run('DELETE FROM activity_daily WHERE chat=? AND day<?',chat,day).changes;return {moderation:a,admin:b,points:c,activity:d}};
export const awardAchievement=(chat,user,code,reward=0)=>{const info=run('INSERT OR IGNORE INTO achievements(chat,user,code,earned_at,reward) VALUES(?,?,?,?,?)',chat,user,code,Date.now(),reward);if(info.changes&&reward>0){run('INSERT INTO members(chat,user,points) VALUES(?,?,?) ON CONFLICT(chat,user) DO UPDATE SET points=points+excluded.points',chat,user,reward);run('INSERT INTO points_history(chat,user,amount,created_at) VALUES(?,?,?,?)',chat,user,reward,Date.now())}return info.changes>0};
export const userAchievements=(chat,user)=>all('SELECT code,earned_at,reward FROM achievements WHERE chat=? AND user=? ORDER BY earned_at',chat,user);
export const settings=c=>{let x=get('SELECT * FROM settings WHERE chat=?',c)||{};let locks={};try{locks=JSON.parse(x.locks||'{}')}catch{};locks=locks&&typeof locks==='object'&&!Array.isArray(locks)?locks:{};const defaults={links:false,photos:false,videos:false,media:false,audio:false,stickers:false,forward:false,repeat:false};return {...x,locks:{...defaults,...locks}}};
export const lock=(c,k,v)=>{let s=settings(c);s.locks[k]=v;run('UPDATE settings SET locks=? WHERE chat=?',JSON.stringify(s.locks),c)};
export const set=(c,k,v)=>{if(!['maxwarn','punishment','duration','channel'].includes(k))throw Error('bad setting');run(`UPDATE settings SET ${k}=? WHERE chat=?`,v,c)};
export const warn=(c,u)=>{run('INSERT INTO members(chat,user,warnings) VALUES(?,?,1) ON CONFLICT(chat,user) DO UPDATE SET warnings=warnings+1',c,u);return member(c,u).warnings};
export const game=(c,active,answer=null,prompt=null,type='mean')=>{
  if(active)return run('INSERT INTO games(chat,active,answer,emoji,game_type,prompt,created_at) VALUES(?,?,?,?,?,?,?)',c,1,answer,null,type,prompt,Date.now());
  return run('UPDATE games SET active=0 WHERE chat=? AND active=1',c);
};
export const currentGame=c=>get('SELECT * FROM games WHERE chat=? AND active=1 ORDER BY id DESC LIMIT 1',c);
export const activeGames=c=>all('SELECT * FROM games WHERE chat=? AND active=1 ORDER BY id ASC',c);
export const gameById=id=>get('SELECT * FROM games WHERE id=?',id);
export const finishGame=id=>run('UPDATE games SET active=0 WHERE id=?',id);
export const report=(c,r,t,m)=>run("INSERT INTO reports(chat,reporter,target,message,status) VALUES(?,?,?,?, 'new')",c,r,t,m);
export const stats=()=>({users:get('SELECT count(*) n FROM users').n,groups:get('SELECT count(*) n FROM groups WHERE active=1').n,reports:get("SELECT count(*) n FROM reports WHERE status='new'").n,points:get('SELECT COALESCE(SUM(points),0) n FROM members').n,blocked:get('SELECT count(*) n FROM bot_bans').n});
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

export const groupConfig=c=>{let x=get('SELECT * FROM group_config WHERE chat=?',c);if(!x){run('INSERT OR IGNORE INTO group_config(chat) VALUES(?)',c);x=get('SELECT * FROM group_config WHERE chat=?',c)}return x||{welcome:1,welcome_text:'',service_messages:1,auto_replies:1,anti_flood:0,links_allow:'',anti_bot:0,word_filter:0,activated:0,reports_enabled:0,report_frequency:'weekly',report_hour:20,report_last_sent:'',cleanup_enabled:0,retention_days:180}};
export const setGroupConfig=(c,k,v)=>{if(!['welcome','welcome_text','service_messages','auto_replies','anti_flood','links_allow','anti_bot','word_filter','activated','reports_enabled','report_frequency','report_hour','report_last_sent','cleanup_enabled','retention_days'].includes(k))throw Error('bad group config');run('INSERT OR IGNORE INTO group_config(chat) VALUES(?)',c);run(`UPDATE group_config SET ${k}=? WHERE chat=?`,v,c)};
export const logAdmin=(chat,actor,action,target=null,details='')=>run('INSERT INTO admin_logs(chat,actor,action,target,details,created_at) VALUES(?,?,?,?,?,?)',chat,actor,action,target,details,Date.now());
export const adminLogs=chat=>all('SELECT * FROM admin_logs WHERE chat=? ORDER BY id DESC LIMIT 50',chat);
export const groupBan=(chat,target,reason='')=>run('INSERT INTO group_bans(chat,target,reason,created_at) VALUES(?,?,?,?) ON CONFLICT(chat,target) DO UPDATE SET reason=excluded.reason,created_at=excluded.created_at',chat,target,reason,Date.now());
export const groupUnban=(chat,target)=>run('DELETE FROM group_bans WHERE chat=? AND target=?',chat,target);

export const addBlockedWord=(chat,word)=>run('INSERT OR IGNORE INTO blocked_words(chat,word) VALUES(?,?)',chat,word);
export const removeBlockedWord=(chat,word)=>run('DELETE FROM blocked_words WHERE chat=? AND word=?',chat,word);
export const blockedWords=chat=>all('SELECT * FROM blocked_words WHERE chat=? ORDER BY id DESC',chat);

// إنشاء نسخة SQLite متسقة باستخدام آلية النسخ المدمجة في better-sqlite3.
export const backupDatabase=destination=>db.backup(destination);
// تُرفع النسخة إلى مسار مرحلي؛ لا تُستبدل القاعدة الحية إلا عند إعادة تشغيل البوت.
export const stageDatabaseRestore=source=>{
  const candidate=new Database(source,{readonly:true,fileMustExist:true});
  try{
    const integrity=candidate.pragma('integrity_check',{simple:true});
    const required=candidate.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('users','groups','members','settings')").all().map(x=>x.name);
    if(integrity!=='ok'||required.length!==4)throw new Error('ملف النسخة غير سليم أو لا يحتوي قاعدة نغنوغ.');
  }finally{candidate.close()}
  const staged=`${file}.restore-pending`;fs.copyFileSync(source,staged);return staged;
};

// إدارة حظر المستخدمين من استعمال خدمات نغنوغ.
export const botBan=(id,reason='',actor=0)=>run('INSERT INTO bot_bans(user,reason,created_at,actor) VALUES(?,?,?,?) ON CONFLICT(user) DO UPDATE SET reason=excluded.reason,created_at=excluded.created_at,actor=excluded.actor',id,reason,Date.now(),actor);
export const botUnban=id=>run('DELETE FROM bot_bans WHERE user=?',id);
export const isBotBanned=id=>!!get('SELECT 1 FROM bot_bans WHERE user=?',id);
export const botBans=()=>all('SELECT * FROM bot_bans ORDER BY created_at DESC LIMIT 50');

// سجل المخالفات والعقوبات مع الاحتفاظ بالتاريخ لكل عضو.
export const addModerationEvent=(chat,target,actor,action,reason='',durationMinutes=0,expiresAt=0)=>run('INSERT INTO moderation_history(chat,target,actor,action,reason,duration_minutes,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)',chat,target,actor,action,reason,durationMinutes,Date.now(),expiresAt);
export const moderationHistory=(chat,target,limit=20)=>all('SELECT * FROM moderation_history WHERE chat=? AND target=? ORDER BY id DESC LIMIT ?',chat,target,limit);
export const moderationCount=(chat,target)=>get("SELECT COUNT(*) total, SUM(CASE WHEN action='إنذار' THEN 1 ELSE 0 END) warnings FROM moderation_history WHERE chat=? AND target=?",chat,target)||{total:0,warnings:0};


const ADMIN_PERMISSION_DEFAULTS={security:true,warnings:true,members:true,welcome:true,replies:true,logs:true,games:true,advanced:true};
export const adminPermissions=(chat,user)=>{const row=get('SELECT permissions FROM admin_permissions WHERE chat=? AND user=?',chat,user);let saved={};try{saved=JSON.parse(row?.permissions||'{}')}catch{};return {...ADMIN_PERMISSION_DEFAULTS,...(saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{})}};
export const hasAdminPermission=(chat,user,key)=>!!adminPermissions(chat,user)[key];
export const toggleAdminPermission=(chat,user,key)=>{if(!Object.hasOwn(ADMIN_PERMISSION_DEFAULTS,key))throw Error('bad admin permission');const p=adminPermissions(chat,user);p[key]=!p[key];run('INSERT INTO admin_permissions(chat,user,permissions,updated_at) VALUES(?,?,?,?) ON CONFLICT(chat,user) DO UPDATE SET permissions=excluded.permissions,updated_at=excluded.updated_at',chat,user,JSON.stringify(p),Date.now());return p[key]};
export const resetAdminPermissions=(chat,user)=>run('DELETE FROM admin_permissions WHERE chat=? AND user=?',chat,user);
