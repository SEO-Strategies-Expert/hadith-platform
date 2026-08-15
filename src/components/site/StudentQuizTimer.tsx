"use client";

import { useEffect, useState } from "react";

/**
 * عدّاد تنازليّ للاختبار.
 *
 * **عرضٌ فقط، لا حكم.** الخادم وحده يقرّر انتهاء الوقت من `startedAt` — هذا
 * العدّاد راحةٌ للطالب لا آليّةُ إنفاذ، ولذلك لا يقفل النموذج ولا يمنع التسليم:
 * ساعة الجهاز قد تكون مغلوطة، ولو منعناه بها لظُلم من ساعتُه متقدّمة.
 */
export function StudentQuizTimer({
  deadlineIso,
  lang,
}: {
  deadlineIso: string;
  lang: "ar" | "en";
}) {
  const deadline = new Date(deadlineIso).getTime();
  const [left, setLeft] = useState<number>(() => deadline - Date.now());

  useEffect(() => {
    const id = setInterval(() => setLeft(deadline - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const over = left <= 0;
  const totalSec = Math.max(0, Math.floor(left / 1000));
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const urgent = !over && totalSec <= 120;

  return (
    <span
      role="timer"
      aria-live="off"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13.5,
        fontWeight: 800,
        fontVariantNumeric: "tabular-nums",
        background: over ? "rgba(190,30,30,.12)" : urgent ? "rgba(217,174,75,.22)" : "rgba(18,49,89,.08)",
        border: `1px solid ${over ? "rgba(190,30,30,.35)" : urgent ? "rgba(217,174,75,.55)" : "rgba(18,49,89,.18)"}`,
        color: over ? "#a11" : urgent ? "#8a6a1c" : "#123159",
      }}
    >
      {over
        ? lang === "ar"
          ? "انتهى الوقت"
          : "Time is up"
        : `${lang === "ar" ? "المتبقّي" : "Time left"} ${mm}:${ss}`}
    </span>
  );
}
