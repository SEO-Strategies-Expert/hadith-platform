import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stageData = {
  key: "secondary",
  numAr: "المرحلة الثانوية",
  numEn: "Secondary stage",
  titleAr: "المرحلة الثانوية",
  titleEn: "Secondary Stage",
  metaAr: "مسارٌ دراسيّ · ١٠ مقرّرات",
  metaEn: "Academic track · 10 courses",
  descAr: "مرحلةٌ دراسيةٌ تأسيسية تجمع العلوم واللغات والمواد الإنسانية والتربية الدينية في مسارٍ متوازنٍ للطلاب.",
  descEn: "A foundational academic stage combining sciences, languages, humanities, and religious education in a balanced track for students.",
  items: { ar: ["الرياضيات", "الفيزياء", "الكيمياء", "التربية الدينية", "اللغة العربية", "اللغة الإنجليزية", "الأحياء", "التاريخ", "الجغرافيا", "الحاسوب وتقنية المعلومات"], en: ["Mathematics", "Physics", "Chemistry", "Religious Education", "Arabic Language", "English Language", "Biology", "History", "Geography", "Computer & IT"] },
  icon: "i-stage",
  moreHref: "courses.html",
  order: 4,
  visible: true,
};

const courses = [
  {
    titleAr: "الرياضيات للمرحلة الثانوية",
    titleEn: "Secondary Mathematics",
    descAr: "مبادئ الجبر والهندسة والدوال والتفكير الرياضي وفق تسلسل مناسب لطلاب المرحلة الثانوية.",
    descEn: "Algebra, geometry, functions, and mathematical reasoning in a sequence suited to secondary students.",
    hours: 48,
  },
  {
    titleAr: "الفيزياء للمرحلة الثانوية",
    titleEn: "Secondary Physics",
    descAr: "مدخل تطبيقي إلى الحركة والقوى والطاقة والكهرباء مع مسائل وتجارب مبسطة.",
    descEn: "An applied introduction to motion, forces, energy, and electricity with accessible problems and experiments.",
    hours: 42,
  },
  {
    titleAr: "الكيمياء للمرحلة الثانوية",
    titleEn: "Secondary Chemistry",
    descAr: "أساسيات المادة والذرة والروابط والتفاعلات الكيميائية والسلامة في المختبر.",
    descEn: "Foundations of matter, atoms, bonding, chemical reactions, and laboratory safety.",
    hours: 42,
  },
  {
    titleAr: "التربية الدينية للمرحلة الثانوية",
    titleEn: "Secondary Religious Education",
    descAr: "مبادئ العقيدة والعبادة والأخلاق والسيرة وفق منهج تربوي مناسب لطلاب المرحلة الثانوية.",
    descEn: "Foundations of faith, worship, ethics, and Prophetic biography in a curriculum suited to secondary students.",
    hours: 36,
  },
  {
    titleAr: "اللغة العربية للمرحلة الثانوية",
    titleEn: "Secondary Arabic Language",
    descAr: "النحو والصرف والبلاغة والأدب ومهارات القراءة والكتابة والتعبير.",
    descEn: "Grammar, morphology, rhetoric, literature, reading, writing, and expression skills.",
    hours: 42,
  },
  {
    titleAr: "اللغة الإنجليزية للمرحلة الثانوية",
    titleEn: "Secondary English Language",
    descAr: "تنمية مهارات الاستماع والمحادثة والقراءة والكتابة مع أساسيات القواعد والمفردات.",
    descEn: "Listening, speaking, reading, and writing skills with core grammar and vocabulary.",
    hours: 42,
  },
  {
    titleAr: "الأحياء للمرحلة الثانوية",
    titleEn: "Secondary Biology",
    descAr: "دراسة الخلية والوراثة والتنوع الحيوي وأجهزة جسم الإنسان والبيئة.",
    descEn: "Cells, genetics, biodiversity, human body systems, and ecosystems.",
    hours: 40,
  },
  {
    titleAr: "التاريخ للمرحلة الثانوية",
    titleEn: "Secondary History",
    descAr: "قراءة تحليلية للحضارات والأحداث التاريخية وتطور المجتمعات ومصادر المعرفة التاريخية.",
    descEn: "An analytical study of civilizations, historical events, social development, and historical sources.",
    hours: 36,
  },
  {
    titleAr: "الجغرافيا للمرحلة الثانوية",
    titleEn: "Secondary Geography",
    descAr: "الجغرافيا الطبيعية والبشرية والخرائط والموارد والبيئة والتنمية المستدامة.",
    descEn: "Physical and human geography, maps, resources, environment, and sustainable development.",
    hours: 36,
  },
  {
    titleAr: "الحاسوب وتقنية المعلومات للمرحلة الثانوية",
    titleEn: "Secondary Computer & Information Technology",
    descAr: "المهارات الرقمية والخوارزميات والبرمجة الأساسية وأمن المعلومات والتعلم الإلكتروني.",
    descEn: "Digital skills, algorithms, introductory programming, information security, and e-learning.",
    hours: 36,
  },
];

async function run() {
  const stage = await prisma.programStage.upsert({
    where: { key: stageData.key },
    update: stageData,
    create: stageData,
  });

  for (const [order, courseData] of courses.entries()) {
    const existing = await prisma.course.findFirst({ where: { titleAr: courseData.titleAr } });
    if (existing) {
      await prisma.course.update({
        where: { id: existing.id },
        data: { ...courseData, stageId: stage.id, published: true, visible: true, order },
      });
    } else {
      await prisma.course.create({
        data: { ...courseData, stageId: stage.id, published: true, visible: true, order },
      });
    }
  }

  console.log(`✓ أضيفت ${courses.length} مقررات إلى ${stage.titleAr}`);
  await prisma.$disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
