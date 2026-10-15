"use client";

import { useRef, useState } from "react";
import { Download, ImageDown, LoaderCircle } from "lucide-react";
import styles from "./StudentIdCard.module.css";

type Props = {
  name: string;
  number: string;
  program: string;
  country: string;
  photo: string | null;
  status: string;
  labels: { image: string; pdf: string; loading: string; error: string };
};

export function StudentIdCardDownloads({ name, number, program, country, photo, status, labels }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"image" | "pdf" | null>(null);
  const [error, setError] = useState("");

  async function download(format: "image" | "pdf") {
    if (!cardRef.current || busy) return;
    setBusy(format);
    setError("");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const fileName = `student-id-${number}`;
      if (format === "image") {
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("image")), "image/png"));
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.png`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height], hotfixes: ["px_scaling"] });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save(`${fileName}.pdf`);
      }
    } catch {
      setError(labels.error);
    } finally {
      setBusy(null);
    }
  }

  return <div className={styles.wrap}>
    <div ref={cardRef} className={styles.card} dir="rtl">
      <div className={styles.pattern} />
      <header className={styles.header}>
        <img src="/assets/img/logo-official.png" alt="" />
        <div><strong>الكلية العليا للحديث النبوي وعلومه وعلله</strong><span>بطاقة جامعية · STUDENT ID</span></div>
        <b className={styles.status}>{status}</b>
      </header>
      <div className={styles.content}>
        <div className={styles.photo}>{photo ? <img src={photo} alt="" crossOrigin="anonymous" /> : <span>{name.trim().charAt(0) || "ط"}</span>}</div>
        <div className={styles.fields}>
          <small>اسم الطالب</small><h1>{name}</h1>
          <small>الرقم الجامعي</small><b className={styles.number} dir="ltr">{number}</b>
          <div className={styles.meta}><span><small>البرنامج</small><b>{program || "—"}</b></span><span><small>الدولة</small><b>{country || "—"}</b></span></div>
        </div>
      </div>
      <footer className={styles.footer}>هذه البطاقة خاصة بصاحبها وتُستخدم للتعريف بهوية الطالب</footer>
    </div>
    <div className={styles.actions}>
      <button type="button" disabled={!!busy} onClick={() => download("pdf")}>{busy === "pdf" ? <LoaderCircle className={styles.spin} size={17} /> : <Download size={17} />}{busy === "pdf" ? labels.loading : labels.pdf}</button>
      <button type="button" disabled={!!busy} onClick={() => download("image")}>{busy === "image" ? <LoaderCircle className={styles.spin} size={17} /> : <ImageDown size={17} />}{busy === "image" ? labels.loading : labels.image}</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
