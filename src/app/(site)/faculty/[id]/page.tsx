import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/site-format";
export default async function FacultyMember({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.scholar.findFirst({ where: { id, visible: true } });
  if (!s) notFound();
  const cv=await prisma.setting.findUnique({ where: { key: `instructor.bio.${s.id}` } });
  return <main className="inner-section cream orn-cream"><div className="container"><Link href="/faculty.html#faculty-members">← أعضاء هيئة التدريس</Link><div className="profile-card" style={{ marginTop: 24 }}>
    {s.photoUrl && <img src={mediaUrl(s.photoUrl)} alt={s.nameAr} style={{ width: "100%", maxHeight: 320, objectFit: "contain" }} />}
    <div className="body"><h1 className="thuluth">{s.nameAr}</h1><p>{s.rankAr} — {s.specAr}</p><p>{s.countryAr}</p><p style={{ whiteSpace: "pre-wrap" }}>{typeof cv?.value === "string" ? cv.value : s.bioAr || "لم تُضف السيرة الذاتية بعد."}</p><Link className="btn btn-gold" href="/instructor/profile">دخول المعلم وتعديل ملفه</Link><Link className="btn btn-outline-ink" href="/instructor/sessions">جدول المحاضرات</Link></div>
  </div></div></main>;
}
