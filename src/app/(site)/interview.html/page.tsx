import type { Metadata } from "next";
import Link from "next/link";
import { getCalendlyUrl } from "@/lib/calendly";
import { siteHref } from "@/lib/site-links";
import { CalendlyEmbed } from "@/components/site/CalendlyEmbed";

export const metadata: Metadata = {
  title: "المقابلة العلميّة | الكلّية العليا للحديث النبوي وعلومه وعِلَلِه",
  description:
    "الخطوة الثالثة من خطوات القبول: لقاءٌ قصيرٌ مع أحد أعضاء الهيئة العلمية لتقدير الجاهزيّة والمسار الأنسب — احجز موعدك من التقويم.",
};

export default async function ArabicInterviewPage() {
  const calendlyUrl = await getCalendlyUrl();

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <img
          className="hero-bg"
          src="/assets/img/slide-1.jpg"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
        />
        <div className="container">
          <nav className="breadcrumbs" aria-label="مسار التنقل">
            <Link href={siteHref("ar", "index.html")}>الرئيسية</Link>
            <span className="sep">/</span>
            <Link href={siteHref("ar", "admissions.html")}>القبول والتسجيل</Link>
            <span className="sep">/</span>
            <strong>المقابلة العلميّة</strong>
          </nav>
          <div className="page-hero-copy reveal">
            <p className="page-kicker">الخطوةُ الثالثة من خطوات القبول</p>
            <h1 className="page-title thuluth gold-text">المقابلةُ العلميّة</h1>
            <p className="page-intro">
              لقاءٌ قصيرٌ مع أحد أعضاء الهيئة العلمية لتقدير الجاهزيّة والمسار الأنسب. تختار موعده
              بنفسك من التقويم أدناه، ويصلك رابط اللقاء على بريدك فور الحجز.
            </p>
            <div className="page-meta">
              <span>عن بُعد</span>
              <span>من عشرين إلى ثلاثين دقيقة</span>
              <span>باللغة العربيّة</span>
            </div>
            <div className="page-actions">
              <a className="btn btn-gold" href="#booking">
                <svg aria-hidden="true">
                  <use href="#i-admission" />
                </svg>
                اختر موعدك
              </a>
              <Link className="btn btn-outline" href={siteHref("ar", "admissions.html")}>
                <svg aria-hidden="true">
                  <use href="#i-info" />
                </svg>
                عُد إلى خطوات القبول
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section white orn-cream">
        <div className="container">
          <div className="content-split">
            <div className="split-copy reveal">
              <header className="section-cap">
                <p className="eyebrow">طبيعةُ اللقاء</p>
                <h2 className="thuluth">حديثٌ علميٌّ هادئ، لا اختبارَ فيه</h2>
                <p>
                  ليست المقابلة اختبارًا ثانيًا بعد اختبار تحديد المستوى؛ إنّما هي مجلسٌ قصيرٌ
                  يتعرّف فيه أحد أعضاء الهيئة العلمية على خلفيّتك وهدفك من الدراسة، ليُشير عليك
                  بالمسار الذي يناسب حالك ووقتك.
                </p>
              </header>
              <ul className="check-list">
                <li>ما سبق لك دراسته في المصطلح والرواية، ومَن قرأت عليه إن كان.</li>
                <li>هدفك من الالتحاق: التأسيس، أو التخريج ودراسة الأسانيد، أو التحقيق.</li>
                <li>الوقت الذي تستطيع بذله أسبوعيًّا، وما يترتّب عليه من ترتيب الخطة.</li>
                <li>ما يعرض لك من أسئلةٍ عن الخطة الدراسيّة والرسوم وطريقة الدراسة.</li>
              </ul>
            </div>

            <div className="callout reveal">
              <h3>قبل الموعد بقليل</h3>
              <ul className="check-list">
                <li>افتح الرابط الذي وصلك على البريد قبل الموعد بخمس دقائق.</li>
                <li>اجلس في مكانٍ هادئ، وتحقّق من الصوت والاتّصال.</li>
                <li>أحضِر ما يثبت مؤهّلك العلمي أو إجازاتك إن وُجدت.</li>
                <li>إن طرأ ما يمنعك، ألغِ الموعد من الرابط نفسه ليستفيد غيرك منه.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section cream orn-cream" id="booking">
        <div className="container">
          <header className="section-cap center reveal">
            <p className="eyebrow">حجزُ الموعد</p>
            <h2 className="thuluth">اختر ما يناسبك من الأوقات</h2>
            <p>
              الأوقات المعروضة بتوقيتك المحلّي. بعد التأكيد يصلك بريدٌ فيه رابط اللقاء وتذكيرٌ قبل
              موعده، ويُسجَّل الموعد في ملفّ طلب التحاقك تلقائيًّا.
            </p>
          </header>
          <CalendlyEmbed url={calendlyUrl} lang="ar" />
        </div>
      </section>
    </main>
  );
}
