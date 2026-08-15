import type { Metadata } from "next";
import Link from "next/link";
import { getCalendlyUrl } from "@/lib/calendly";
import { siteHref } from "@/lib/site-links";
import { CalendlyEmbed } from "@/components/site/CalendlyEmbed";

export const metadata: Metadata = {
  title: "The Academic Interview | The Higher College of Prophetic Hadith, Sciences, and Studies",
  description:
    "The third admission step: a short meeting with a member of the academic board to assess your readiness and the most suitable track — book your slot from the calendar.",
};

export default async function EnglishInterviewPage() {
  const calendlyUrl = await getCalendlyUrl();

  return (
    <main id="main">
      <section className="page-hero orn-navy">
        <img
          className="hero-bg"
          src="/assets/img/slide-1-en.jpg"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
        />
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href={siteHref("en", "index.html")}>Home</Link>
            <span className="sep">/</span>
            <Link href={siteHref("en", "admissions.html")}>Admissions &amp; Registration</Link>
            <span className="sep">/</span>
            <strong>The Academic Interview</strong>
          </nav>
          <div className="page-hero-copy reveal">
            <p className="page-kicker">The third admission step</p>
            <h1 className="page-title gold-text">The Academic Interview</h1>
            <p className="page-intro">
              A short meeting with a member of the academic board to assess your readiness and the
              most suitable track. You choose the time yourself from the calendar below, and the
              meeting link reaches your inbox as soon as you book.
            </p>
            <div className="page-meta">
              <span>Held online</span>
              <span>Twenty to thirty minutes</span>
              <span>Conducted in Arabic</span>
            </div>
            <div className="page-actions">
              <a className="btn btn-gold" href="#booking">
                <svg aria-hidden="true">
                  <use href="#i-admission" />
                </svg>
                Choose your time
              </a>
              <Link className="btn btn-outline" href={siteHref("en", "admissions.html")}>
                <svg aria-hidden="true">
                  <use href="#i-info" />
                </svg>
                Back to the admission steps
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
                <p className="eyebrow">What the meeting is</p>
                <h2>An unhurried academic conversation, not an examination</h2>
                <p>
                  The interview is not a second test after the placement examination. It is a short
                  sitting in which a member of the academic board learns about your background and
                  your purpose in studying, so as to advise you on the track that suits your level
                  and your time.
                </p>
              </header>
              <ul className="check-list">
                <li>What you have already studied in hadith terminology and transmission, and with whom.</li>
                <li>Your aim in enrolling: foundation, chain analysis and documentation, or critical editing.</li>
                <li>The time you can devote each week, and how the study plan is arranged around it.</li>
                <li>Any questions you have about the curriculum, the fees, or how study is conducted.</li>
              </ul>
            </div>

            <div className="callout reveal">
              <h3>Shortly before your slot</h3>
              <ul className="check-list">
                <li>Open the link sent to your email five minutes before the meeting.</li>
                <li>Sit somewhere quiet and check your audio and connection.</li>
                <li>Have your academic qualification or any teaching licences at hand.</li>
                <li>If something prevents you, cancel from the same link so another student may take the slot.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="inner-section cream orn-cream" id="booking">
        <div className="container">
          <header className="section-cap center reveal">
            <p className="eyebrow">Booking</p>
            <h2>Pick the time that suits you</h2>
            <p>
              Times are shown in your local time zone. After you confirm, you receive an email with
              the meeting link and a reminder before it, and the appointment is recorded on your
              application file automatically.
            </p>
          </header>
          <CalendlyEmbed url={calendlyUrl} lang="en" />
        </div>
      </section>
    </main>
  );
}
