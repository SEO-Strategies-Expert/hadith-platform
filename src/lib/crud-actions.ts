"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { getResource, type FieldDef } from "@/lib/resources";

/* eslint-disable @typescript-eslint/no-explicit-any */

function coerce(fields: FieldDef[], formData: FormData) {
  const data: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = formData.get(f.name);
    if (f.type === "bool") {
      data[f.name] = raw === "on";
    } else if (f.type === "number") {
      // الفراغ يصير صفرًا افتراضًا لأنّ حقول مثل `order` غير قابلة للإفراغ في
      // المخطّط (Int @default(0))؛ أمّا الحقول الاختياريّة (مثل عدد الساعات)
      // فتُعلَّم `nullable` ليعني فراغها «غير محدَّد» لا «صفر ساعة».
      data[f.name] =
        raw != null && raw !== "" ? Number(raw) : f.nullable ? null : 0;
    } else if (f.type === "date" || f.type === "datetime") {
      // `undefined` يجعل Prisma يتجاهل الحقل — وهو الصحيح عند الإنشاء، لكنّه
      // كان يمنع **مسح** تاريخ بعد ضبطه. الحقل القابل للإفراغ يُرسل null صراحةً.
      data[f.name] = raw ? new Date(String(raw)) : f.nullable ? null : undefined;
    } else if (f.type === "json") {
      const value = String(raw ?? "").trim();
      if (!value) data[f.name] = null;
      else {
        try {
          data[f.name] = JSON.parse(value);
        } catch {
          data[f.name] = Symbol.for("invalid-json");
        }
      }
    } else {
      const v = raw == null ? "" : String(raw).trim();
      data[f.name] = v === "" ? null : v;
    }
  }
  return data;
}

function validate(fields: FieldDef[], data: Record<string, unknown>): string | null {
  for (const f of fields) {
    if (data[f.name] === Symbol.for("invalid-json")) return `صيغة JSON غير صحيحة في «${f.label}».`;
    if (f.required && (data[f.name] == null || data[f.name] === "")) {
      return `الحقل «${f.label}» مطلوب.`;
    }
  }
  return null;
}

function friendly(e: unknown): string {
  const msg = String((e as Error)?.message || e);
  if (msg.includes("Unique constraint")) return "قيمة مكرّرة — المفتاح مستخدم بالفعل.";
  return "تعذّر الحفظ. تحقّق من الحقول وحاول مجددًا.";
}

export async function createRecord(
  resourceKey: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const actor = await requireUser();
  const cfg = getResource(resourceKey);
  if (!cfg) return "مورد غير معروف.";
  const data = coerce(cfg.fields, formData);
  const err = validate(cfg.fields, data);
  if (err) return err;
  let created: { id: string };
  try {
    created = await (prisma as any)[cfg.model].create({ data });
    await prisma.auditLog.create({ data: { actorId: actor.id, action: "create", entity: cfg.model, entityId: created.id } });
  } catch (e) {
    return friendly(e);
  }
  if (resourceKey === "courses") {
    revalidatePath("/admin/courses");
    redirect(`/admin/courses/${created.id}/content?created=1`);
  }
  revalidatePath(`/admin/${resourceKey}`);
  redirect(`/admin/${resourceKey}`);
}

export async function updateRecord(
  resourceKey: string,
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const actor = await requireUser();
  const cfg = getResource(resourceKey);
  if (!cfg) return "مورد غير معروف.";
  const data = coerce(cfg.fields, formData);
  const err = validate(cfg.fields, data);
  if (err) return err;
  try {
    await (prisma as any)[cfg.model].update({ where: { id }, data });
    await prisma.auditLog.create({ data: { actorId: actor.id, action: "update", entity: cfg.model, entityId: id } });
  } catch (e) {
    return friendly(e);
  }
  revalidatePath(`/admin/${resourceKey}`);
  redirect(`/admin/${resourceKey}`);
}

export async function deleteRecord(resourceKey: string, id: string) {
  const actor = await requireUser();
  const cfg = getResource(resourceKey);
  if (!cfg) return;
  await (prisma as any)[cfg.model].delete({ where: { id } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: "delete", entity: cfg.model, entityId: id } });
  revalidatePath(`/admin/${resourceKey}`);
}
