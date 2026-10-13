const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const me={id:'teacher',scholarId:'own-scholar'};
class Redirect extends Error {}
function load(file,mocks){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{exports,require(name){if(name in mocks)return mocks[name];return require(name);},Date,String,Number,Math});return exports;}
const shared={'@/lib/instructor':{requireInstructor:async()=>me,ownedCourseFilter:id=>({instructorId:id})},'next/cache':{revalidatePath:()=>{}},'next/navigation':{redirect:()=>{throw new Redirect();}}};
(async()=>{
  const writes=[];
  const profile=load('src/app/(instructor)/instructor/profile/actions.ts',{...shared,'bcryptjs':{hash:async()=> 'hash'},'@/lib/prisma':{prisma:{user:{findFirst:async()=>null,update:async args=>writes.push(['user',args])},scholar:{update:async args=>writes.push(['scholar',args])},setting:{upsert:async args=>writes.push(['cv',args])},$transaction:async tasks=>Promise.all(tasks)}}});
  const form=new Map(Object.entries({name:'Teacher',nameEn:'Teacher',email:'teacher@example.com',password:'',rankAr:'Professor',specAr:'Hadith',countryAr:'',bioAr:'Biography '.repeat(100),photoUrl:'/assets/img/teacher.jpg',scholarId:'another-scholar'}));
  await assert.rejects(()=>profile.saveInstructorProfile(undefined,form),Redirect);
  assert.equal(writes.find(w=>w[0]==='scholar')[1].where.id,'own-scholar');
  assert.equal(writes.find(w=>w[0]==='user')[1].where.id,'teacher');
  assert.equal(writes.find(w=>w[0]==='cv')[1].where.key,'instructor.bio.own-scholar');
  assert.equal(writes.find(w=>w[0]==='cv')[1].update.value,form.get('bioAr'));
  let row=null,query,gradeWrites=[];
  const grades=load('src/app/(instructor)/instructor/grades/actions.ts',{...shared,'@/lib/prisma':{prisma:{assignmentSubmission:{findFirst:async args=>{query=args.where;return row;},update:async args=>gradeWrites.push(args)},notification:{create:async args=>gradeWrites.push(args)},$transaction:async tasks=>Promise.all(tasks)}}});
  const gradeForm=new Map([['id','foreign-work'],['score','10'],['feedback','Reviewed']]);
  await assert.rejects(()=>grades.saveGrade(gradeForm),/INVALID_GRADE/);
  assert.equal(query.assignment.course.instructorId,'own-scholar');
  assert.equal(gradeWrites.length,0);
  row={id:'work',userId:'student',assignmentId:'assessment',assignment:{maxScore:100,titleAr:'Assessment',visible:false}};
  gradeForm.set('score','101');await assert.rejects(()=>grades.saveGrade(gradeForm),/INVALID_GRADE/);assert.equal(gradeWrites.length,0);
  gradeForm.set('score','0');await assert.rejects(()=>grades.saveGrade(gradeForm),Redirect);
  assert.equal(gradeWrites[0].data.score,0);assert.equal(gradeWrites[0].data.gradedById,'teacher');assert.equal(gradeWrites[1].data.href,'/student/grades');
  console.log('Teaching checks passed: own-account profile editing, full CV preservation, course-scoped grading, grade limits, and zero scores.');
})().catch(e=>{console.error(e);process.exitCode=1;});
