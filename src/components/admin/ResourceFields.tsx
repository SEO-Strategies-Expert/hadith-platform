import type { FieldDef } from "@/lib/resources";
import { Field, TextArea, Select, Checkbox } from "@/components/admin/ui";
import { ImagePickerField } from "@/components/admin/ImagePickerField";

/* eslint-disable @typescript-eslint/no-explicit-any */

function toDateInput(v: unknown): string | undefined {
  if (!v) return undefined;
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function renderField(f: FieldDef, record?: any) {
  const val = record ? record[f.name] : undefined;
  const defaultTrue = ["visible", "active"].includes(f.name);

  switch (f.type) {
    case "bool":
      return (
        <Checkbox
          label={f.label}
          name={f.name}
          defaultChecked={record ? !!val : defaultTrue}
        />
      );
    case "select":
      return <Select label={f.label} name={f.name} options={f.options ?? []} defaultValue={val ?? undefined} />;
    case "textarea":
      return <TextArea label={f.label} name={f.name} defaultValue={val ?? undefined} dir="rtl" hint={f.hint} />;
    case "textarea-ltr":
      return <TextArea label={f.label} name={f.name} defaultValue={val ?? undefined} dir="ltr" hint={f.hint} />;
    case "image":
      return <ImagePickerField label={f.label} name={f.name} defaultValue={val ?? undefined} required={f.required} hint={f.hint} />;
    case "ltr":
      return <Field label={f.label} name={f.name} defaultValue={val ?? undefined} dir="ltr" required={f.required} hint={f.hint} />;
    case "number":
      return <Field label={f.label} name={f.name} type="number" defaultValue={val ?? 0} required={f.required} hint={f.hint} />;
    case "date":
      return <Field label={f.label} name={f.name} type="date" defaultValue={toDateInput(val)} required={f.required} hint={f.hint} dir="ltr" />;
    default:
      return <Field label={f.label} name={f.name} defaultValue={val ?? undefined} dir="rtl" required={f.required} hint={f.hint} />;
  }
}

export function ResourceFields({ fields, record }: { fields: FieldDef[]; record?: any }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
          {renderField(f, record)}
        </div>
      ))}
    </div>
  );
}
