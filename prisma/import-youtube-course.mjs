import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const playlistUrl =
  "https://www.youtube.com/playlist?list=PLU337kS0Vsa3H223BMmbRPuqqRfIQWeM_";
const courseTitle = "دورة مصطلح الحديث التطبيقي";
const instructorName = "أ.د. عبد الجبار المراني";

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
      order: lecture.order,
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

  console.log(`✓ أضيف المقرر: ${course.titleAr} (${lectures.length} محاضرات)`);
  console.log(`  /course/${course.id}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
