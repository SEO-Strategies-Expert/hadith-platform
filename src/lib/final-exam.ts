import { prisma } from "@/lib/prisma";

/**
 * عدد دروس المقرّر الظاهرة التي لم يُكملها الطالب بعد — باستثناء دروس
 * الاختبارات النهائية نفسها. الاختبار النهائي يُفتح حين يصبح العدد صفرًا.
 */
export async function pendingLessonsBeforeFinal(userId: string, courseId: string): Promise<number> {
  const finals = await prisma.quiz.findMany({ where: { courseId, isFinal: true }, select: { id: true } });
  const finalIds = finals.map((q) => q.id);
  return prisma.lesson.count({
    where: {
      visible: true,
      module: { courseId, visible: true },
      ...(finalIds.length ? { OR: [{ quizId: null }, { quizId: { notIn: finalIds } }] } : {}),
      NOT: { progress: { some: { userId, completed: true } } },
    },
  });
}
