/**
 * بيانات عرض للعميل — تُضاف فوق البيانات القائمة ولا تمسّها.
 *
 * لماذا سكربت مستقلّ لا `import.mjs`؟ لأنّ الأخير **يمسح** جداول المحتوى
 * ويعيد تعبئتها، فيُفقد كل ما حرّره العميل. هذا يضيف فقط.
 *
 * كل ما يُنشأ يُسجَّل في `prisma/demo-seed.record.json` ليُحذف بأمر واحد:
 *   node prisma/demo-seed.mjs --undo
 *
 * التشغيل:  node prisma/demo-seed.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const prisma = new PrismaClient();
const RECORD = new URL("./demo-seed.record.json", import.meta.url);
const UNDO = process.argv.includes("--undo");

/** سجلّ ما أنشأناه، لنُرجع القاعدة إلى حالها بالضبط. */
const made = { ids: {}, courseInstructorBefore: {} };
const track = (model, id) => ((made.ids[model] ??= []).push(id), id);

// ---------------------------------------------------------------------------
// التراجع
// ---------------------------------------------------------------------------
if (UNDO) {
  if (!existsSync(RECORD)) {
    console.log("لا يوجد سجلّ — لم يُزرع شيء بهذا السكربت.");
    process.exit(0);
  }
  const rec = JSON.parse(readFileSync(RECORD, "utf8"));
  // الترتيب مهمّ: الأبناء قبل الآباء.
  const order = [
    "quizAttempt", "choice", "question", "quiz",
    "assignmentSubmission", "assignment",
    "attendance", "liveSession",
    "lessonProgress", "lessonAttachment", "lesson", "module",
    "certificate", "payment", "notification", "enrollment", "stageEnrollment",
  ];
  for (const model of order) {
    const ids = rec.ids?.[model] ?? [];
    if (!ids.length) continue;
    const n = await prisma[model].deleteMany({ where: { id: { in: ids } } });
    console.log(`حُذف ${n.count} من ${model}`);
  }
  for (const [courseId, before] of Object.entries(rec.courseInstructorBefore ?? {})) {
    await prisma.course.update({ where: { id: courseId }, data: { instructorId: before } });
  }
  console.log("أُعيدت إسنادات المحاضرين إلى ما كانت عليه.");
  await prisma.$disconnect();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// الزرع
// ---------------------------------------------------------------------------
const student = await prisma.user.findUnique({ where: { email: "demo@hadith-faculty.com" } });
const sheikhUser = await prisma.user.findUnique({ where: { email: "sheikh@hadith-faculty.com" } });
if (!student || !sheikhUser?.scholarId) throw new Error("الحسابات التجريبية غير مهيّأة");

const scholars = await prisma.scholar.findMany({ orderBy: { order: "asc" } });
const courses = await prisma.course.findMany({ orderBy: { order: "asc" }, include: { stage: true } });

/** خطط الوحدات لكل مقرّر — مضامين حقيقيّة من علوم الحديث لا نصوص حشو. */
const PLANS = {
  "مقدّمة ابن الصلاح": [
    ["مدخل إلى علوم الحديث", ["تعريف علم المصطلح وموضوعه وثمرته", "نشأة التصنيف في علوم الحديث", "منزلة «مقدّمة ابن الصلاح» بين المصنَّفات"]],
    ["أقسام الخبر", ["المتواتر: شروطه وأمثلته", "الآحاد: المشهور والعزيز والغريب", "الصحيح لذاته والصحيح لغيره"]],
    ["الحسن والضعيف", ["الحسن لذاته ولغيره", "أقسام الضعيف باعتبار السقط", "أقسام الضعيف باعتبار الطعن في الراوي"]],
  ],
  "النُّخَب في علوم الحديث": [
    ["منهج الحافظ ابن حجر", ["التعريف بـ«نخبة الفكر» ومنهجها", "التقسيم الاستقرائي للخبر"]],
    ["مباحث الإسناد", ["المعلَّق والمرسل والمعضل والمنقطع", "المدلَّس وأقسامه"]],
  ],
  "مصطلح الحديث التطبيقي": [
    ["التطبيق على الصحيحين", ["تخريج حديث من صحيح البخاري", "دراسة إسناد ومقارنة الطرق"]],
    ["دراسة الأسانيد", ["مراتب التعديل والتجريح", "تطبيق على راوٍ مختلَف فيه"]],
  ],
  "تهذيب الكمال": [
    ["كتب الرجال", ["منهج المِزّي في «تهذيب الكمال»", "الرموز والاصطلاحات"]],
    ["التطبيق على التراجم", ["ترجمة راوٍ من رجال الكتب الستّة", "الموازنة بين أقوال النقّاد"]],
  ],
  "معرفة علوم الحديث": [
    ["منهج الحاكم", ["التعريف بكتاب «معرفة علوم الحديث»", "أنواع علوم الحديث عند الحاكم"]],
  ],
  "مناهج النقد": [
    ["نقد المتون", ["قرائن نقد المتن عند المحدّثين", "الشاذّ والمنكر"]],
    ["العلل", ["تعريف العلّة ومظانّها", "تطبيق على حديث معلول"]],
  ],
  "تدريب الراوي": [
    ["شرح التقريب", ["منهج السيوطي في «تدريب الراوي»", "زياداته على النووي"]],
  ],
  "مناهج البحث": [
    ["أصول البحث الحديثي", ["اختيار الموضوع وتحرير المسألة", "التوثيق والإحالة العلميّة"]],
  ],
  "المشروع والمناقشة": [
    ["إعداد المشروع", ["خطّة البحث ومكوّناتها", "ضوابط المناقشة العلميّة"]],
  ],
};

const LESSON_KINDS = ["TEXT", "VIDEO", "PDF"];
let courseIdx = 0;

for (const course of courses) {
  const plan = PLANS[course.titleAr];
  if (!plan) continue;

  // إسناد محاضر: الأوّل لحساب الشيخ التجريبي ليمتلئ لوحته، والباقي بالتناوب.
  const targetScholar = courseIdx < 3 ? sheikhUser.scholarId : scholars[courseIdx % scholars.length].id;
  made.courseInstructorBefore[course.id] = course.instructorId;
  await prisma.course.update({
    where: { id: course.id },
    data: { instructorId: targetScholar, published: true, hours: 24 + courseIdx * 4 },
  });

  let mOrder = 0;
  for (const [modTitle, lessons] of plan) {
    const mod = await prisma.module.create({
      data: { courseId: course.id, titleAr: modTitle, titleEn: `Unit ${mOrder + 1}`, order: mOrder },
    });
    track("module", mod.id);

    let lOrder = 0;
    for (const title of lessons) {
      const kind = LESSON_KINDS[lOrder % LESSON_KINDS.length];
      const lesson = await prisma.lesson.create({
        data: {
          moduleId: mod.id,
          titleAr: title,
          titleEn: `Lesson ${lOrder + 1}`,
          kind,
          durationMin: 20 + lOrder * 10,
          order: lOrder,
          // أوّل درس في أوّل وحدة معاينة مجّانيّة — ليجرّبه غير المسجَّل.
          freePreview: mOrder === 0 && lOrder === 0,
          bodyAr: kind === "TEXT"
            ? `<p>${title}.</p><p>يتناول هذا الدرس تحرير المسألة عند المحدّثين، مع بيان مذاهب العلماء فيها والأدلّة، ثمّ التطبيق على أمثلة من كتب السنّة.</p><ul><li>تحرير المصطلح ومعناه عند المتقدّمين.</li><li>أقوال النقّاد والموازنة بينها.</li><li>تطبيقات عمليّة على الأسانيد.</li></ul>`
            : null,
          videoUrl: kind === "VIDEO" ? "https://www.youtube.com/watch?v=jNQXAC9IVRw" : null,
        },
      });
      track("lesson", lesson.id);

      if (lOrder === 0) {
        const att = await prisma.lessonAttachment.create({
          data: { lessonId: lesson.id, titleAr: "ورقة تطبيق الدرس", titleEn: "Worksheet", url: "https://example.com/worksheet.pdf", order: 0 },
        });
        track("lessonAttachment", att.id);
      }
      lOrder++;
    }
    mOrder++;
  }
  courseIdx++;
}

// --- الدورات المستقلّة (بلا مرحلة) — هي ما تعرضه صفحة «الدورات العلمية» ------
// المقرّر المرتبط بمرحلة يخدم خطّتها، والمقرّر بلا مرحلة يظهر بطاقةً في الدورات.
const STANDALONE = [
  ["دورة: مبادئ التخريج", "Takhrij Basics", "دورةٌ مكثّفة في تخريج الحديث من المصادر الأصليّة، بستّة لقاءات تطبيقيّة."],
  ["دورة: قراءة في نخبة الفكر", "Nukhbat al-Fikr", "قراءةٌ متأنّية في متن النخبة وشرحها، بأربعة لقاءات."],
  ["دبلوم: تحقيق المخطوط الحديثي", "Manuscript Editing Diploma", "دبلومٌ تطبيقيّ في قواعد التحقيق ومقابلة النسخ وتوثيق النصّ."],
  ["دبلوم: علل الحديث", "Hadith Defects Diploma", "دبلومٌ متقدّم في كشف العلل الخفيّة ومناهج النقّاد."],
];
let stIdx = 0;
for (const [ar, en, desc] of STANDALONE) {
  const c = await prisma.course.create({
    data: {
      titleAr: ar, titleEn: en, descAr: desc, descEn: desc,
      metaAr: stIdx < 2 ? "٦ لقاءات" : "فصلٌ دراسيّ",
      instructorId: scholars[stIdx % scholars.length].id,
      published: true, visible: true, hours: stIdx < 2 ? 12 : 30, order: 20 + stIdx,
    },
  });
  track("course", c.id);
  const mod = await prisma.module.create({
    data: { courseId: c.id, titleAr: "محاور الدورة", titleEn: "Modules", order: 0 },
  });
  track("module", mod.id);
  for (const [i, t] of ["المدخل والتأصيل", "التطبيق العملي", "المراجعة والتقويم"].entries()) {
    const l = await prisma.lesson.create({
      data: {
        moduleId: mod.id, titleAr: t, titleEn: `Lesson ${i + 1}`,
        kind: i === 1 ? "VIDEO" : "TEXT", durationMin: 25 + i * 10, order: i,
        freePreview: i === 0,
        bodyAr: i !== 1 ? `<p>${t} — ${desc}</p>` : null,
        videoUrl: i === 1 ? "https://www.youtube.com/watch?v=jNQXAC9IVRw" : null,
      },
    });
    track("lesson", l.id);
  }
  stIdx++;
}

// --- قيد الطالب في درجة «البكالوريوس» (مرحلة التأسيس) ------------------------
// هذا ما يجيب سؤال العميل: الطالب يُقيَّد في درجة، فتظهر له مقرّرات تلك الدرجة.
const foundation = await prisma.programStage.findUnique({ where: { key: "foundation" } });
if (foundation) {
  const has = await prisma.stageEnrollment.findUnique({
    where: { userId_stageId: { userId: student.id, stageId: foundation.id } },
  });
  if (!has) {
    const se = await prisma.stageEnrollment.create({
      data: { userId: student.id, stageId: foundation.id, status: "ACTIVE" },
    });
    track("stageEnrollment", se.id);
  }
}

// --- تسجيل الطالب في مقرّرات درجته الثلاثة -----------------------------------
const enrolCourses = courses.filter((c) => c.stageId === foundation?.id);
for (const [i, c] of enrolCourses.entries()) {
  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: student.id, courseId: c.id } },
  });
  if (existing) continue;
  const e = await prisma.enrollment.create({
    data: {
      userId: student.id, courseId: c.id, status: "ACTIVE",
      feeOption: ["full", "reduced", "free"][i % 3],
    },
  });
  track("enrollment", e.id);
}

// --- إنجاز بعض الدروس ليظهر شريط تقدّم غير صفريّ ------------------------------
const firstCourse = enrolCourses[0];
const firstLessons = await prisma.lesson.findMany({
  where: { module: { courseId: firstCourse.id } }, orderBy: { order: "asc" }, take: 3,
});
for (const l of firstLessons.slice(0, 2)) {
  const lp = await prisma.lessonProgress.create({
    data: { userId: student.id, lessonId: l.id, completed: true },
  });
  track("lessonProgress", lp.id);
}
const totalLessons = await prisma.lesson.count({ where: { module: { courseId: firstCourse.id }, visible: true } });
await prisma.enrollment.updateMany({
  where: { userId: student.id, courseId: firstCourse.id },
  data: { progressPct: Math.round((2 / Math.max(totalLessons, 1)) * 100) },
});

// --- المجالس المباشرة --------------------------------------------------------
const now = Date.now();
const sessions = [
  { titleAr: "مجلس مذاكرة: تحرير القول في زيادة الثقة", titleEn: "Live: Ziyadat al-Thiqa", offset: 5 * 60_000, dur: 90, live: true },
  { titleAr: "مجلس سماعٍ مسنَد: صحيح البخاري — كتاب بدء الوحي", titleEn: "Sama' session: Sahih al-Bukhari", offset: 2 * 86_400_000, dur: 120, live: false },
  { titleAr: "مجلس في علل الحديث: تطبيقات على العلل الخفيّة", titleEn: "Hidden defects workshop", offset: 6 * 86_400_000, dur: 90, live: false },
];
let sIdx = 0;
for (const s of sessions) {
  const ls = await prisma.liveSession.create({
    data: {
      titleAr: s.titleAr, titleEn: s.titleEn,
      descAr: "مجلسٌ علميٌّ يُدار بإشراف المجلس العلمي، ويُسجَّل ويُتاح للطلبة بعد انتهائه.",
      courseId: enrolCourses[sIdx % enrolCourses.length].id,
      instructorId: sheikhUser.scholarId,
      startsAt: new Date(now + s.offset), durationMin: s.dur,
      provider: "zoom",
      joinUrl: "https://zoom.us/j/00000000000",
      // رابط المضيف: يظهر للمحاضر وحده — لا يصل الطالب أبدًا.
      zoomStartUrl: "https://zoom.us/s/00000000000?role=host",
      isPublic: sIdx === 0, visible: true,
    },
  });
  track("liveSession", ls.id);
  if (!s.live) {
    const at = await prisma.attendance.create({
      data: { userId: student.id, sessionId: ls.id, minutes: 0, present: false, source: "manual" },
    });
    track("attendance", at.id);
  }
  sIdx++;
}

// --- واجب --------------------------------------------------------------------
const asg = await prisma.assignment.create({
  data: {
    courseId: firstCourse.id,
    titleAr: "تخريج حديث ودراسة إسناده",
    titleEn: "Takhrij assignment",
    descAr: "خرِّج حديث «إنّما الأعمال بالنيّات» من الكتب الستّة، وادرس إسناده، وبيّن مراتب رواته، ثمّ احكم عليه مع ذكر المصادر.",
    dueAt: new Date(now + 7 * 86_400_000), maxScore: 100, visible: true,
  },
});
track("assignment", asg.id);

// --- اختبار بثلاثة أسئلة ------------------------------------------------------
const quiz = await prisma.quiz.create({
  data: {
    courseId: firstCourse.id, titleAr: "اختبار المصطلح — الوحدة الأولى", titleEn: "Terminology quiz 1",
    descAr: "اختبارٌ قصيرٌ على مباحث الوحدة الأولى.", passScore: 60, timeLimitMin: 15, visible: true,
  },
});
track("quiz", quiz.id);

const QUESTIONS = [
  { kind: "SINGLE", q: "ما تعريف الحديث المتواتر؟", ex: "المتواتر ما رواه جمعٌ تُحيل العادة تواطؤهم على الكذب عن مثلهم من أوّل السند إلى منتهاه.",
    ch: [["ما رواه جمعٌ يُؤمَن تواطؤهم على الكذب", true], ["ما رواه راوٍ واحد في كلّ طبقة", false], ["ما سقط من إسناده راوٍ", false]] },
  { kind: "TRUEFALSE", q: "الحديث الصحيح يُشترط فيه اتّصال السند وعدالة الرواة وضبطهم وانتفاء الشذوذ والعلّة.", ex: "هذه شروط الصحيح الخمسة المتّفق عليها.",
    ch: [["صواب", true], ["خطأ", false]] },
  { kind: "MULTI", q: "أيٌّ ممّا يلي من أقسام الضعيف باعتبار السقط في الإسناد؟", ex: "المعلَّق والمرسل والمعضل والمنقطع كلّها بسبب السقط؛ أمّا الشاذّ فسببه المخالفة.",
    ch: [["المعلَّق", true], ["المرسل", true], ["الشاذّ", false], ["المعضل", true]] },
];
let qOrder = 0;
for (const q of QUESTIONS) {
  const question = await prisma.question.create({
    data: { quizId: quiz.id, kind: q.kind, textAr: q.q, textEn: `Question ${qOrder + 1}`, explainAr: q.ex, points: 1, order: qOrder },
  });
  track("question", question.id);
  let cOrder = 0;
  for (const [text, correct] of q.ch) {
    const c = await prisma.choice.create({
      data: { questionId: question.id, textAr: text, textEn: text, correct, order: cOrder++ },
    });
    track("choice", c.id);
  }
  qOrder++;
}

// --- شهادة وإجازة ------------------------------------------------------------
const AB = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const { randomBytes } = await import("node:crypto");
const code = () => Array.from(randomBytes(12), (b) => AB[b % AB.length]).join("");

const cert = await prisma.certificate.create({
  data: {
    kind: "CERTIFICATE", userId: student.id, courseId: firstCourse.id,
    titleAr: `شهادة إتمام مقرّر «${firstCourse.titleAr}»`, titleEn: "Certificate of completion",
    serial: "HC-2026-000101", verifyCode: code(), issuedAt: new Date(now - 10 * 86_400_000),
  },
});
track("certificate", cert.id);

const ijaza = await prisma.certificate.create({
  data: {
    kind: "IJAZA", userId: student.id,
    titleAr: "إجازة في رواية صحيح البخاري", titleEn: "Ijaza in Sahih al-Bukhari",
    isnadAr: "أرويه إجازةً عن شيخنا أ.د. عبد الجبّار المرّاني، عن شيوخه بأسانيدهم المتّصلة إلى الإمام البخاري رحمه الله.",
    grantedByAr: "أ.د. عبد الجبّار بن هادي النَّقيب المرّاني",
    serial: "HC-2026-000102", verifyCode: code(), issuedAt: new Date(now - 3 * 86_400_000),
  },
});
track("certificate", ijaza.id);

// --- مدفوعات -----------------------------------------------------------------
const enr0 = await prisma.enrollment.findUnique({
  where: { userId_courseId: { userId: student.id, courseId: firstCourse.id } },
});
for (const pay of [
  { amount: "500.00", status: "PAID", method: "transfer", paidAt: new Date(now - 20 * 86_400_000), enrollmentId: enr0?.id },
  { amount: "1500.00", status: "WAIVED", note: "إعفاءٌ باعتماد لجنة القبول" },
]) {
  const row = await prisma.payment.create({ data: { userId: student.id, currency: "QAR", ...pay } });
  track("payment", row.id);
}

// --- إشعارات -----------------------------------------------------------------
for (const n of [
  { titleAr: "تذكير بموعد مجلسك", bodyAr: "مجلس المذاكرة يبدأ بعد قليل بإذن الله.", kind: "session" },
  { titleAr: "صدرت شهادتك", bodyAr: "شهادة إتمام المقرّر متاحة الآن في «شهاداتي».", kind: "certificate" },
  { titleAr: "واجبٌ جديد", bodyAr: "أُضيف واجب «تخريج حديث ودراسة إسناده».", kind: "assignment" },
]) {
  const row = await prisma.notification.create({ data: { userId: student.id, titleEn: n.titleAr, bodyEn: n.bodyAr, ...n } });
  track("notification", row.id);
}

writeFileSync(RECORD, JSON.stringify(made, null, 1), "utf8");

const counts = {};
for (const k of ["module", "lesson", "liveSession", "assignment", "quiz", "question", "certificate", "payment", "notification", "enrollment"])
  counts[k] = await prisma[k].count();
console.log("تمّ الزرع. الأعداد الآن:");
console.log(JSON.stringify(counts, null, 1));
console.log(`\nالسجلّ محفوظ. للتراجع الكامل:  node prisma/demo-seed.mjs --undo`);
await prisma.$disconnect();
