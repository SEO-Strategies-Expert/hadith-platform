"use client";

import { useState } from "react";

export function CourseCompletionCelebration({ title, certificateUrl, pdfUrl, labels }: {
  title: string;
  certificateUrl: string;
  pdfUrl: string | null;
  labels: { heading: string; body: string; view: string; download: string; print: string; close: string };
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return <div className="course-completion-backdrop" role="dialog" aria-modal="true" aria-label={labels.heading}>
    <div className="course-completion-modal">
      <span className="completion-particle particle-one" /><span className="completion-particle particle-two" /><span className="completion-particle particle-three" /><span className="completion-particle particle-four" />
      <div className="course-completion-medal">🏆</div>
      <div className="course-completion-kicker">100%</div>
      <h2>{labels.heading}</h2>
      <p>{labels.body}</p>
      <strong>{title}</strong>
      <div className="course-completion-actions">
        <a className="btn btn-gold" href={certificateUrl}>{labels.view}</a>
        {pdfUrl ? <a className="btn btn-outline-ink" href={pdfUrl} download target="_blank" rel="noopener noreferrer">{labels.download}</a> : <button className="btn btn-outline-ink" type="button" onClick={() => window.print()}>{labels.print}</button>}
        <button className="btn btn-quiet" type="button" onClick={() => setOpen(false)}>{labels.close}</button>
      </div>
    </div>
  </div>;
}
