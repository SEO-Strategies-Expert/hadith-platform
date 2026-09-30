/** صيغ الشهادة الخمس كما وردت في وثائق الكلية، مع مواضع تُملأ من بيانات الوثيقة. */

export const CERTIFICATE_FORMULAS = [
  {
    id: "ijaza",
    kind: "IJAZA",
    label: "إجازة علمية",
    titleAr: "إجازة علمية",
    titleEn: "Scholarly ijaza",
    signers: [
      { role: "إدارة الكلية" },
      { role: "المجيز", nameFrom: "granter" },
    ],
  },
  {
    id: "course",
    kind: "CERTIFICATE",
    label: "إتمام دورة علمية",
    titleAr: "شهادة إتمام دورة علمية",
    titleEn: "Certificate of scholarly course completion",
    signers: [
      { role: "إدارة الكلية" },
      { role: "المحاضر", nameFrom: "granter" },
    ],
  },
  {
    id: "bachelor",
    kind: "CERTIFICATE",
    label: "البكالوريوس",
    titleAr: "شهادة البكالوريوس",
    titleEn: "Bachelor's certificate",
    signers: [
      { role: "عميد الكلية" },
      { role: "إدارة الكلية" },
      { role: "رئيس الجامعة" },
    ],
  },
  {
    id: "diploma",
    kind: "CERTIFICATE",
    label: "الدبلوم الأكاديمي المعتمد",
    titleAr: "شهادة دبلوم أكاديمي معتمد",
    titleEn: "Accredited academic diploma",
    signers: [
      { role: "عميد الكلية" },
      { role: "إدارة الكلية" },
      { role: "رئيس الجامعة" },
    ],
  },
  {
    id: "master",
    kind: "CERTIFICATE",
    label: "الماجستير",
    titleAr: "شهادة الماجستير",
    titleEn: "Master's certificate",
    signers: [
      { role: "عميد الكلية" },
      { role: "إدارة الكلية" },
      { role: "رئيس الجامعة" },
    ],
  },
] as const;

export type CertificateFormulaId = (typeof CERTIFICATE_FORMULAS)[number]["id"];

const IDS = new Set<string>(CERTIFICATE_FORMULAS.map((item) => item.id));

export function isCertificateFormula(value: string | null | undefined): value is CertificateFormulaId {
  return !!value && IDS.has(value);
}

export function formulaById(id: string | null | undefined) {
  return CERTIFICATE_FORMULAS.find((item) => item.id === id) ?? null;
}

export function formulaForCertificate(style: string | null | undefined, kind?: string | null) {
  return formulaById(style) ?? (kind === "IJAZA" ? formulaById("ijaza")! : formulaById("course")!);
}

export type CertificateFill = {
  name: string;
  subject: string;
  extra: string;
  granter: string;
  date: string;
  hijri: string;
  data?: CertificateFormulaData;
};

export type CertificateFormulaData = {
  gender?: "male" | "female";
  subjectAr?: string;
  authorAr?: string;
  attendance?: "complete" | "minor-loss" | "major-loss";
  periodStart?: string;
  periodEnd?: string;
  gradeAr?: string;
  researchAr?: string;
  performance?: boolean;
};

export function normalizeCertificateFormulaData(value: unknown): CertificateFormulaData {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const data = value as Record<string, unknown>;
  return {
    gender: data.gender === "female" ? "female" : "male",
    subjectAr: typeof data.subjectAr === "string" ? data.subjectAr : "",
    authorAr: typeof data.authorAr === "string" ? data.authorAr : "",
    attendance: data.attendance === "minor-loss" || data.attendance === "major-loss" ? data.attendance : "complete",
    periodStart: typeof data.periodStart === "string" ? data.periodStart : "",
    periodEnd: typeof data.periodEnd === "string" ? data.periodEnd : "",
    gradeAr: typeof data.gradeAr === "string" ? data.gradeAr : "",
    researchAr: typeof data.researchAr === "string" ? data.researchAr : "",
    performance: data.performance === true,
  };
}

const HAMD = "الْحَمْدُ لِلَّهِ وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ وَعَلَى آلِهِ وَصَحْبِهِ وَمَنْ وَالَاهُ، وَبَعْدُ:";
const COLLEGE = "الْكُلِّيَّةُ الْعُلْيَا لِلْحَدِيثِ النَّبَوِيِّ وَعُلُومِهِ وَعِلَلِهِ (جَامِعَةُ أَبِي بَكْرِ بْنِ إِبْرَاهِيمَ الدَّوْلِيَّةُ)";
const CHARGE = "وَإِنَّنَا إِذْ نَمْنَحُهُ هَذِهِ الشَّهَادَةَ، نُوصِيهِ بِتَقْوَى اللَّهِ تَعَالَى فِي السِّرِّ وَالْعَلَنِ، وَالْعَمَلِ بِمَا عَلِمَ، وَنَشْرِ سُنَّةِ النَّبِيِّ ﷺ وَالذَّبِّ عَنْهَا بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ.";

function formatTemplateDate(value?: string) {
  if (!value) return ".... / .... / ....";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ar-QA-u-nu-arab", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function subjectOf(fill: CertificateFill, fallback: string) {
  return fill.subject.trim() || fallback;
}

export function formulaParagraphs(id: CertificateFormulaId, fill: CertificateFill): string[] {
  const name = fill.name.trim() || "..................";
  const d = normalizeCertificateFormulaData(fill.data);
  const female = d.gender === "female";
  const student = female ? "الطَّالِبَةَ" : "الطَّالِبَ";
  const heard = female ? "سَمِعَتْ" : "سَمِعَ";
  const issuedLine = `صَدَرَتْ فِي: ${fill.hijri || ".... / .... / .... هـ"} — الْمُوَافِقِ ${fill.date || ".... / .... / .... م"}.`;
  const periodStart = formatTemplateDate(d.periodStart);
  const periodEnd = formatTemplateDate(d.periodEnd);
  const grade = d.gradeAr?.trim() || fill.extra.trim();

  if (id === "ijaza") {
    const book = d.subjectAr?.trim() || subjectOf(fill, "اسْمُ الْكِتَابِ الْمَسْمُوعِ");
    const author = d.authorAr?.trim() ? `${d.authorAr.trim()} رَحِمَهُ اللَّهُ` : "اسْمُ الْمُؤَلِّفِ رَحِمَهُ اللَّهُ";
    const granter = fill.granter.trim() || "الشيخ المجيز";
    const attendance = d.attendance === "minor-loss" ? "سَمَاعًا بِفَوْتٍ يَسِيرٍ" : d.attendance === "major-loss" ? "سَمَاعًا بِفَوْتٍ كَبِيرٍ" : "سَمَاعًا كَامِلًا";
    return [
      HAMD,
      "أَمَّا بَعْدُ:",
      `${COLLEGE} قَدْ عَقَدَتْ مَجَالِسَ سَمَاعٍ فِي كِتَابِ «${book}» لِلْإِمَامِ «${author}»، بِإِسْمَاعِ الشَّيْخِ الْمُجِيزِ: ${granter}.`,
      `وَيَقُولُ الْمُجِيزُ: قَدْ ${heard} عَلَيْنَا ${student} ${name} كِتَابَ «${book}» لِلْإِمَامِ «${author}» ${attendance}.`,
      `وَعَلَيْهِ؛ فَقَدْ أَجَزْنَاهُ بِرِوَايَةِ هَذَا الْكِتَابِ عَنِّي، بِسَنَدِي الْمُتَّصِلِ إِلَى مُؤَلِّفِهِ، إِجَازَةً خَاصَّةً مِنْ مُعَيَّنٍ فِي مُعَيَّنٍ، بِالشَّرْطِ الْمُعْتَبَرِ عِنْدَ أَهْلِ الْحَدِيثِ وَالْأَثَرِ.${grade ? ` ${grade}` : ""}`,
      female ? "وَإِنَّنَا إِذْ نَمْنَحُهَا هَذِهِ الْإِجَازَةَ الْعِلْمِيَّةَ، نُوصِيهَا بِتَقْوَى اللَّهِ تَعَالَى فِي السِّرِّ وَالْعَلَنِ، وَالْعَمَلِ بِمَا عَلِمَتْ، وَنَشْرِ سُنَّةِ النَّبِيِّ ﷺ وَالذَّبِّ عَنْهَا بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ." : "وَإِنَّنَا إِذْ نَمْنَحُهُ هَذِهِ الْإِجَازَةَ الْعِلْمِيَّةَ، نُوصِيهِ بِتَقْوَى اللَّهِ تَعَالَى فِي السِّرِّ وَالْعَلَنِ، وَالْعَمَلِ بِمَا عَلِمَ، وَنَشْرِ سُنَّةِ النَّبِيِّ ﷺ وَالذَّبِّ عَنْهَا بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ.",
      issuedLine,
    ];
  }

  if (id === "course") {
    const course = d.subjectAr?.trim() || subjectOf(fill, "اسْمُ الدَّوْرَةِ الْعِلْمِيَّةِ");
    const excellence = d.performance ? "بِتَفَوُّقٍ " : "";
    return [
      HAMD,
      "أَمَّا بَعْدُ:",
      `${COLLEGE} تَشْهَدُ بِأَنَّ ${student}: ${name}`,
      `قَدْ ${female ? "شَارَكَتْ" : "شَارَكَ"} وَ${female ? "اجْتَازَتْ" : "اجْتَازَ"} ${excellence}الدَّوْرَةَ الْعِلْمِيَّةَ التَّخَصُّصِيَّةَ الْمَوْسُومَةَ بِـ: «${course}».`,
      `وَالْمُقَامَةِ فِي الْفَتْرَةِ مِنْ: ${periodStart} إِلَى ${periodEnd}.`,
      female ? CHARGE.replaceAll("نَمْنَحُهُ", "نَمْنَحُهَا").replaceAll("نُوصِيهِ", "نُوصِيهَا").replaceAll("عَلِمَ،", "عَلِمَتْ،") : CHARGE,
      issuedLine,
    ];
  }

  const degree =
    id === "bachelor" ? "الْبَكَالُورِيُوسِ" : id === "diploma" ? "الدِّبْلُومِ الْأَكَادِيمِيِّ الْمُعْتَمَدِ" : "الْمَاجِسْتِيرِ";
  const research =
    id === "master" && (d.researchAr || fill.subject).trim()
      ? `، وَإِجَازَةِ بَحْثِهِ الْمَوْسُومِ بِـ: «${(d.researchAr || fill.subject).trim()}»`
      : "";
  return [
    HAMD,
    "أَمَّا بَعْدُ:",
    `${COLLEGE} تَمْنَحُ ${student}: ${name}`,
    `شَهَادَةَ ${degree} فِي الْحَدِيثِ النَّبَوِيِّ وَعُلُومِهِ وَعِلَلِهِ.`,
    `وَذَلِكَ بَعْدَ اسْتِيفَائِ${female ? "هَا" : "هِ"} السَّاعَاتِ الدِّرَاسِيَّةِ الْمُقَرَّرَةِ، وَاجْتِيَازِ${female ? "هَا" : "هِ"} الِاخْتِبَارَاتِ النَّظَرِيَّةِ وَالتَّطْبِيقِيَّةِ فِي الْمَنَاهِجِ وَالْمُقَرَّرَاتِ${research}.`,
    grade ? `وَ${female ? "حَصَلَتْ" : "حَصَلَ"} عَلَى تَقْدِيرِ: ${grade}.` : `وَ${female ? "حَصَلَتْ" : "حَصَلَ"} عَلَى التَّقْدِيرِ الْمُعْتَمَدِ فِي سِجِلِّ الْكُلِّيَّةِ.`,
    female ? CHARGE.replaceAll("نَمْنَحُهُ", "نَمْنَحُهَا").replaceAll("نُوصِيهِ", "نُوصِيهَا").replaceAll("عَلِمَ،", "عَلِمَتْ،") : CHARGE,
    `تَحْرِيرًا فِي: ${fill.hijri || ".... / .... / .... هـ"} — الْمُوَافِقِ ${fill.date || ".... / .... / .... م"}.`,
  ];
}

export function formatCertificateDates(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return { date: "", hijri: "" };
  const dateText = new Intl.DateTimeFormat("ar-QA-u-nu-arab", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  let hijri = "";
  try {
    hijri = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-arab", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    hijri = "";
  }
  return { date: dateText, hijri };
}
