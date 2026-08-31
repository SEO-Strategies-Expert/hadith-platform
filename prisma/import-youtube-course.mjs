import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const playlistUrl =
  "https://www.youtube.com/playlist?list=PLU337kS0Vsa3H223BMmbRPuqqRfIQWeM_";
const courseTitle = "دورة مصطلح الحديث التطبيقي";
const instructorName = "أ.د. عبد الجبار المراني";
const courseBookUrl = "/assets/materials/mustalah-al-hadith-al-marani.pdf";

const lectures = [
  ["bPxrWHBr-Dk", 1, 2821],
  ["xAlpOBlSOws", 2, 2774],
  ["tYx8d3EAai4", 3, 4065],
  ["Imh17YrW_14", 4, 3003],
  ["x145bJTcZA8", 5, 3587],
  ["KMAupQI38Uw", 6, 3658],
  ["c08IesDr-4o", 7, 3048],
  ["Kt1CoqNpC_M", 8, 2701],
  ["iKi2C1S23rA", 9, 2759],
].map(([videoId, number, lengthSeconds]) => {
  const title = `مصطلح الحديث التطبيقي | ${number} | ${instructorName}`;
  const description = `${title}\n\n#مصطلح_الحديث_التطبيقي\n#عبدالجبار_المراني\n#أكاديمية_علوم_الدولية`;

  return {
    videoId,
    title,
    description,
    durationMin: Math.ceil(lengthSeconds / 60),
    order: number - 1,
  };
});

const quizzes = [
  {
    title: "اختبار المصطلحات التعريفية",
    description: "تقويم حقيقي مستمد من الوحدة الأولى في كتاب الوجيز في مصطلح الحديث التطبيقي.",
    questions: [
      ["TRUEFALSE", "السنة القولية والفعلية والتقريرية كلها داخلة في استعمال المحدّثين للسنة.", "يقرر الكتاب أن السنة تشمل قول النبي ﷺ وفعله وتقريره.", [["صواب", true], ["خطأ", false]]],
      ["SINGLE", "أي تعريف يوافق استعمال المحدّثين للحديث كما عرضه الكتاب؟", "الحديث يشمل النصوص المتعلقة برسول الله ﷺ من غير القرآن، ومن أبرزها القول والفعل والتقرير.", [["كل نص متعلق برسول الله ﷺ من غير القرآن", true], ["قول الصحابي فقط", false], ["الأحكام الفقهية دون غيرها", false], ["القرآن والسنة معًا", false]]],
      ["SINGLE", "ما العلاقة الغالبة بين الخبر والحديث عند أكثر المحدّثين؟", "نص الكتاب على أن الخبر مرادف للحديث في استعمال أكثر المتقدمين والمتأخرين.", [["مترادفان في الاستعمال الغالب", true], ["الخبر خاص بالتاريخ", false], ["الحديث أوسع من الخبر دائمًا", false], ["لا علاقة بينهما", false]]],
      ["MULTI", "ما الأنواع الثلاثة الأكثر استعمالًا في تعريف الحديث؟", "ذكر الكتاب أن القول والفعل والتقرير هي الأنواع الأكثر ورودًا.", [["القول", true], ["الفعل", true], ["التقرير", true], ["القياس", false]]],
      ["SINGLE", "ما المقصود أحيانًا بلفظ «الحديث» عند النقاد بحسب السياق؟", "ينبه الكتاب إلى استعمال الحديث بمعنى الإسناد أو الطريق، واستعماله شاملًا للإسناد والمتن.", [["قد يراد به الإسناد أو الطريق", true], ["يراد به المتن فقط دائمًا", false], ["يراد به رأي الراوي", false], ["يراد به الكتاب المصنف فقط", false]]],
      ["TRUEFALSE", "ينبغي فهم مصطلح «الحديث» في كتب النقد بمعزل عن سياق كلام الناقد.", "أكد المؤلف ضرورة التنبه لسياق الكلام عند إطلاق المصطلح.", [["صواب", false], ["خطأ", true]]],
    ],
  },
  {
    title: "اختبار القبول والنقد التطبيقي",
    description: "تقويم في الصحيح والحسن والشاذ والمنكر، مبني على تعريفات الكتاب وتفريقاته التطبيقية.",
    questions: [
      ["MULTI", "ما العناصر التي يدور عليها الحديث الصحيح وفق تعريف الكتاب؟", "جمع التعريف بين اتصال السند، وثقة الرواة وإتقانهم، وانتفاء المخالفة والعلة المؤثرتين.", [["اتصال السند", true], ["إتقان الرجال", true], ["عدم العلل المؤثرة", true], ["كثرة ألفاظ المتن", false]]],
      ["SINGLE", "كيف عرّف ابن حجر مدار الحديث الصحيح في النص الذي نقله المؤلف؟", "نقل المؤلف: مدار الحديث الصحيح على الاتصال وإتقان الرجال وعدم العلل.", [["الاتصال وإتقان الرجال وعدم العلل", true], ["شهرة الحديث فقط", false], ["تعدد الطرق فقط", false], ["قصر المتن وسهولته", false]]],
      ["SINGLE", "ما الحسن لذاته عند المتأخرين كما عرضه الكتاب؟", "هو ما جمع شروط الصحيح غير أن راويًا أو أكثر خف ضبطه دون أن يبلغ الضعف.", [["ما خف ضبط بعض رواته مع بقاء أصل القبول", true], ["الموضوع إذا تعددت طرقه", false], ["ما رواه الكذاب منفردًا", false], ["كل حديث بلا إسناد", false]]],
      ["SINGLE", "ما الحسن لغيره؟", "هو الضعيف يسير الضعف إذا تعددت طرقه وتقوّى بها.", [["الضعيف يسير الضعف إذا تعددت طرقه", true], ["الصحيح الذي له طريق واحد", false], ["رواية الثقة المخالفة للأوثق", false], ["الحديث الموقوف دائمًا", false]]],
      ["SINGLE", "بحسب التفريق الاصطلاحي المشهور عند ابن حجر، ما الشاذ؟", "الشاذ هو رواية المقبول المخالفة لمن هو أولى منه ضبطًا أو عددًا.", [["رواية المقبول المخالفة لمن هو أولى منه", true], ["رواية الضعيف الموافقة للثقة", false], ["كل حديث غريب", false], ["الحديث الذي لا علة فيه", false]]],
      ["SINGLE", "ما الفرق الأساس بين الشاذ والمنكر في التفريق المشهور؟", "يجتمعان في المخالفة؛ الشاذ من رواية ثقة أو صدوق، والمنكر من رواية ضعيف.", [["الشاذ من رواية مقبول والمنكر من رواية ضعيف", true], ["المنكر صحيح والشاذ حسن", false], ["الشاذ بلا إسناد والمنكر بإسناد", false], ["لا فرق بينهما مطلقًا", false]]],
    ],
  },
];

async function run() {
  let instructor = await prisma.scholar.findFirst({
    where: {
      OR: [
        { nameAr: instructorName },
        { nameAr: { contains: "عبد الجبار المراني" } },
      ],
    },
  });

  if (!instructor) {
    instructor = await prisma.scholar.create({
      data: {
        nameAr: instructorName,
        nameEn: "Prof. Abdul Jabbar Al-Marani",
        rankAr: "أستاذ دكتور",
        rankEn: "Professor",
        specAr: "علوم الحديث",
        specEn: "Hadith Studies",
      },
    });
  }

  let course = await prisma.course.findFirst({ where: { titleAr: courseTitle } });
  const courseData = {
    titleAr: courseTitle,
    titleEn: courseTitle,
    descAr:
      "دورة عربية في مصطلح الحديث التطبيقي يقدمها أ.د. عبد الجبار المراني عبر أكاديمية علوم الدولية.",
    descEn: null,
    summaryAr:
      "دورة كاملة من تسع محاضرات في التطبيق العملي لمصطلح الحديث، مع عناوين المحاضرات وأوصافها الأصلية من يوتيوب.",
    summaryEn: null,
    category: "hadith-terminology",
    metaAr: "٩ محاضرات • نحو ٨ ساعات",
    metaEn: "9 lectures • about 8 hours",
    imageUrl: "https://i.ytimg.com/vi/bPxrWHBr-Dk/hqdefault.jpg",
    href: null,
    hours: 8,
    published: true,
    visible: true,
    instructorId: instructor.id,
  };

  course = course
    ? await prisma.course.update({ where: { id: course.id }, data: courseData })
    : await prisma.course.create({ data: courseData });

  let module = await prisma.module.findFirst({
    where: { courseId: course.id, titleAr: "محاضرات الدورة" },
  });
  const moduleData = {
    titleAr: "محاضرات الدورة",
    titleEn: "محاضرات الدورة",
    descAr: `المحاضرات الكاملة بحسب ترتيب قائمة التشغيل: ${playlistUrl}`,
    descEn: null,
    order: 0,
    visible: true,
  };

  module = module
    ? await prisma.module.update({ where: { id: module.id }, data: moduleData })
    : await prisma.module.create({ data: { ...moduleData, courseId: course.id } });

  for (const lecture of lectures) {
    const videoUrl = `https://www.youtube.com/watch?v=${lecture.videoId}`;
    const lessonData = {
      titleAr: lecture.title,
      titleEn: lecture.title,
      kind: "VIDEO",
      videoUrl,
      bodyAr: lecture.description,
      bodyEn: null,
      durationMin: lecture.durationMin,
      // المادة المقروءة تأتي بعد المحاضرة الأولى مباشرة.
      order: lecture.order === 0 ? 0 : lecture.order + 1,
      visible: true,
      freePreview: lecture.order === 0,
    };
    const existing = await prisma.lesson.findFirst({
      where: { moduleId: module.id, videoUrl },
    });

    if (existing) {
      await prisma.lesson.update({ where: { id: existing.id }, data: lessonData });
    } else {
      await prisma.lesson.create({ data: { ...lessonData, moduleId: module.id } });
    }
  }

  const materialData = {
    titleAr: "المادة العلمية: الوجيز في مصطلح الحديث التطبيقي",
    titleEn: "المادة العلمية: الوجيز في مصطلح الحديث التطبيقي",
    kind: "PDF",
    videoUrl: courseBookUrl,
    bodyAr: "الكتاب الكامل للدورة من تأليف أ.د. عبد الجبار بن هادي المراني.",
    bodyEn: null,
    durationMin: null,
    order: 1,
    visible: true,
    freePreview: false,
  };
  const existingMaterial = await prisma.lesson.findFirst({
    where: { moduleId: module.id, videoUrl: courseBookUrl },
  });
  if (existingMaterial) {
    await prisma.lesson.update({ where: { id: existingMaterial.id }, data: materialData });
  } else {
    await prisma.lesson.create({ data: { ...materialData, moduleId: module.id } });
  }

  for (const quizSpec of quizzes) {
    let quiz = await prisma.quiz.findFirst({
      where: { courseId: course.id, titleAr: quizSpec.title },
      include: { _count: { select: { questions: true } } },
    });
    const quizData = {
      courseId: course.id,
      titleAr: quizSpec.title,
      titleEn: quizSpec.title,
      descAr: quizSpec.description,
      descEn: null,
      timeLimitMin: 12,
      passScore: 70,
      attemptsAllowed: 0,
      shuffle: true,
      visible: true,
    };
    quiz = quiz
      ? await prisma.quiz.update({ where: { id: quiz.id }, data: quizData, include: { _count: { select: { questions: true } } } })
      : await prisma.quiz.create({ data: quizData, include: { _count: { select: { questions: true } } } });

    if (quiz._count.questions === 0) {
      for (const [order, question] of quizSpec.questions.entries()) {
        const [kind, textAr, explainAr, choices] = question;
        await prisma.question.create({
          data: {
            quizId: quiz.id,
            kind,
            textAr,
            textEn: textAr,
            explainAr,
            explainEn: explainAr,
            points: 1,
            order,
            choices: {
              create: choices.map(([textAr, correct], choiceOrder) => ({
                textAr,
                textEn: textAr,
                correct,
                order: choiceOrder,
              })),
            },
          },
        });
      }
    }
  }

  console.log(`✓ أضيف المقرر: ${course.titleAr} (${lectures.length} محاضرات، مادة علمية، واختباران)`);
  console.log(`  /course/${course.id}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
