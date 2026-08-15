/** مفاتيح حالة التسجيل ونظام الرسوم بمسمّياتها العربيّة — مصدر واحد للشاشات. */

export const ENROLLMENT_STATUSES = [
  { value: "PENDING", label: "بانتظار الاعتماد" },
  { value: "ACTIVE", label: "مُفعَّل" },
  { value: "COMPLETED", label: "مُنجَز" },
  { value: "CANCELLED", label: "ملغى" },
] as const;

export const FEE_OPTIONS = [
  { value: "free", label: "مجّاني" },
  { value: "reduced", label: "مخفَّض" },
  { value: "full", label: "كامل" },
] as const;

export function statusLabel(v: string): string {
  return ENROLLMENT_STATUSES.find((s) => s.value === v)?.label ?? v;
}

export function feeLabel(v: string | null): string {
  return FEE_OPTIONS.find((f) => f.value === (v ?? "free"))?.label ?? (v ?? "—");
}

export function statusTone(v: string): "gray" | "green" | "blue" | "red" {
  if (v === "ACTIVE") return "green";
  if (v === "COMPLETED") return "blue";
  if (v === "CANCELLED") return "red";
  return "gray";
}
