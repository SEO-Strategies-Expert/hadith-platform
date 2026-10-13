const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/app/attendance-actions.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
class PrismaError extends Error { constructor(code) { super(code); this.code=code; } }
let user, session, record, writes, notifications, query, duplicate;
const db = {
  user: { findUnique: async()=>user, findMany: async()=>[{id:'admin'}] },
  liveSession: { findFirst: async args=>{query=args.where;return session;} },
  attendance: { findUnique: async()=>record, create: async args=>{if(duplicate)throw new PrismaError('P2002');writes.push(args.data);}, updateMany: async args=>{writes.push(args);return {count:1};} },
  notification: { createMany: async args=>{notifications.push(...args.data);} },
  $transaction: async callback=>callback(db),
};
const actionExports = exports;
vm.runInNewContext(code,{ exports: actionExports, require(name) {
  if(name==='@/lib/prisma')return {prisma:db};
  if(name==='@/lib/guard')return {currentUser:async()=>user&&{id:user.id}};
  if(name==='@/lib/session-access')return {teacherSessionWhere:id=>({instructorId:id}),studentSessionWhere:id=>({eligibleStudent:id})};
  if(name==='next/cache')return {revalidatePath:()=>{}};
  if(name==='@prisma/client')return {Prisma:{PrismaClientKnownRequestError:PrismaError}};
  throw new Error(name);
}, Date, String, Number, Math });
function reset(){user={id:'teacher',name:'Teacher',role:'INSTRUCTOR',status:'ACTIVE',scholarId:'own-scholar'};session={id:'session',titleAr:'Lecture',titleEn:'Lecture',startsAt:new Date(Date.now()-30*60000),endsAt:new Date(Date.now()+30*60000),durationMin:60};record=null;writes=[];notifications=[];query=null;duplicate=false;}
function form(mode){return new Map([['sessionId','session'],['mode',mode]]);}
(async()=>{
  reset();user=null;await exports.recordAttendance(undefined,form('in'));assert.equal(writes.length,0);
  reset();user.role='EDITOR';await exports.recordAttendance(undefined,form('in'));assert.equal(writes.length,0);
  reset();session=null;await exports.recordAttendance(undefined,form('in'));assert.equal(query.instructorId,'own-scholar');assert.equal(writes.length,0);
  reset();session.startsAt=new Date(Date.now()+3600000);await exports.recordAttendance(undefined,form('in'));assert.equal(writes.length,0);
  reset();await exports.recordAttendance(undefined,form('in'));assert.equal(writes.length,1);assert.equal(notifications.length,1);assert.equal(notifications[0].kind,'instructor-attendance');
  reset();duplicate=true;await exports.recordAttendance(undefined,form('in'));assert.equal(notifications.length,0);
  reset();user.role='STUDENT';user.scholarId=null;await exports.recordAttendance(undefined,form('absent'));assert.equal(query.eligibleStudent,'teacher');assert.equal(writes[0].present,false);assert.equal(notifications.length,0);
  reset();session.endsAt=new Date(Date.now()-10*60000);record={id:'attendance',present:true,joinedAt:new Date(Date.now()-45*60000),leftAt:null};await exports.recordAttendance(undefined,form('out'));assert.equal(writes[0].data.minutes,20);assert.equal(writes[0].data.leftAt.getTime(),session.endsAt.getTime());
  reset();record={id:'attendance',present:true,leftAt:new Date()};await exports.recordAttendance(undefined,form('out'));assert.equal(writes.length,0);
  console.log('Attendance checks passed: role and session authorization, time window, duplicate prevention, admin notification, absence, and bounded duration.');
})().catch(e=>{console.error(e);process.exitCode=1;});
