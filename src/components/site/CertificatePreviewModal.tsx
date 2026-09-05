"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

type CertificatePreviewData = {
  title: string;
  holder: string;
  related: string;
  serial: string;
  issuedAt: string;
  kind: string;
  style: string;
  pdfUrl: string | null;
  labels: { preview: string; close: string; download: string; print: string; holder: string; related: string; serial: string; issuedAt: string };
};

export function CertificatePreviewModal({ data }: { data: CertificatePreviewData }) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const downloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (data.pdfUrl) {
        try {
          const response = await fetch(data.pdfUrl);
          if (!response.ok) throw new Error("PDF download failed");
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url; link.download = `${data.serial || "certificate"}.pdf`;
          document.body.appendChild(link); link.click(); link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return;
        } catch {
          // A remote storage URL may reject browser downloads; generate locally instead.
        }
      }
      if (!certificateRef.current) return;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#fffdf8",
        ignoreElements: (element) => element.classList.contains("certificate-modal-actions") || element.classList.contains("certificate-modal-close"),
      });
      const landscape = canvas.width >= canvas.height;
      const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "px", format: [canvas.width, canvas.height], hotfixes: ["px_scaling"] });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${data.serial || "certificate"}.pdf`);
    } finally { setDownloading(false); }
  };
  return (
    <>
      <button type="button" className="btn btn-gold" onClick={() => setOpen(true)}>
        {data.labels.preview}
      </button>
      {open && typeof document !== "undefined" && createPortal((
        <div className="certificate-modal-backdrop" role="dialog" aria-modal="true" aria-label={data.labels.preview} onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div ref={certificateRef} className={`certificate-modal certificate-preview certificate-style-${data.style || "classic"}`}>
            <button type="button" className="certificate-modal-close" onClick={() => setOpen(false)} aria-label={data.labels.close}>×</button>
            <span className="certificate-decor certificate-decor-one" /><span className="certificate-decor certificate-decor-two" /><span className="certificate-wave certificate-wave-one" /><span className="certificate-wave certificate-wave-two" />
            <div className="certificate-modal-content">
              <img src="/assets/img/logo-official.png" alt="" className="certificate-modal-logo" />
              <div className="certificate-modal-kicker">The Higher College of Prophetic Hadith</div>
              <div className="certificate-modal-kind">{data.kind}</div>
              <h2>{data.title}</h2>
              <p>{data.labels.holder}</p><strong>{data.holder}</strong>
              {data.related && <p className="certificate-modal-related">{data.related}</p>}
              <div className="certificate-modal-meta"><span><b>{data.labels.serial}</b>{data.serial}</span><span><b>{data.labels.issuedAt}</b>{data.issuedAt}</span></div>
            </div>
            <div className="certificate-modal-actions">
              <button className="btn btn-gold" type="button" onClick={downloadPdf} disabled={downloading}>{downloading ? "…" : data.labels.download}</button>
              <button className="btn btn-outline-ink" type="button" onClick={() => setOpen(false)}>{data.labels.close}</button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
