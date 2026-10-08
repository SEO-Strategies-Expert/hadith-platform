import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

/** Import the Course ↔ Scholar implicit many-to-many links exported from PostgreSQL. */
export async function POST(req: Request) {
  await requireAdmin();
  let target: string;
  try {
    const form = await req.formData();
    const file = form.get("relations");
    if (!(file instanceof File)) throw new Error("NO_FILE");

    const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) throw new Error("EMPTY_FILE");
    const first = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase().replace(/^"|"$/g, ""));
    const startAt = first[0] === "courseid" && first[1] === "instructorid" ? 1 : 0;
    const byCourse = new Map<string, Set<string>>();

    for (const line of lines.slice(startAt)) {
      const [courseId, instructorId, ...extra] = parseCsvLine(line).map((cell) => cell.replace(/^"|"$/g, ""));
      if (!courseId || !instructorId || extra.length > 0 || courseId.length > 191 || instructorId.length > 191) {
        throw new Error("INVALID_CSV_ROW");
      }
      const ids = byCourse.get(courseId) ?? new Set<string>();
      ids.add(instructorId);
      byCourse.set(courseId, ids);
    }

    let imported = 0;
    for (const [courseId, instructorIds] of byCourse) {
      await prisma.course.update({
        where: { id: courseId },
        data: { instructors: { connect: [...instructorIds].map((id) => ({ id })) } },
      });
      imported += instructorIds.size;
    }
    target = `/admin/system?instructorLinksImported=${imported}`;
  } catch (e) {
    const message = e instanceof Error ? e.message : "FAILED";
    target = `/admin/system?instructorLinksError=${encodeURIComponent(message)}`;
  }
  redirect(target);
}
