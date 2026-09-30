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
};

const HAMD =
  "الْحَمْدُ لِلَّهِ عَزَّ وَجَلَّ، هَدَى وَأَضَلَّ، وَأَصَحَّ وَأَعَلَّ، وَبِالْكَمَالِ وَحْدَهُ اسْتَقَلَّ. وَالصَّلَاةُ وَالسَّلَامُ عَلَى نَبِيِّنَا مُحَمَّدٍ.";
const COLLEGE =
  "فَإِنَّ الْكُلِّيَّةَ الْعُلْيَا لِلْحَدِيثِ النَّبَوِيِّ وَعُلُومِهِ وَعِلَلِهِ (جَامِعَةَ أَبِي بَكْرِ بْنِ إِبْرَاهِيمَ الدَّوْلِيَّةَ)";
const CHARGE =
  "وَإِنَّا إِذْ نَمْنَحُهُ / نَمْنَحُهَا هَذِهِ الشَّهَادَةَ، نُوصِيهِ / نُوصِيهَا بِتَقْوَى اللَّهِ تَعَالَى فِي السِّرِّ وَالْعَلَنِ، وَالْعَمَلِ بِمَا عَلِمَ / عَلِمَتْ، وَنَشْرِ سُنَّةِ النَّبِيِّ ﷺ وَالذَّبِّ عَنْهَا بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ.";

function subjectOf(fill: CertificateFill, fallback: string) {
  return fill.subject.trim() || fallback;
}

export function formulaParagraphs(id: CertificateFormulaId, fill: CertificateFill): string[] {
  const name = fill.name.trim() || "..................";
  const dateLine = `تَحْرِيرًا فِي: ${fill.hijri || ".... / .... / .... هـ"} — الْمُوَافِقِ ${fill.date || ".... / .... / .... م"}.`;
  const issuedLine = `صَدَرَتْ فِي: ${fill.hijri || ".... / .... / .... هـ"} — الْمُوَافِقِ ${fill.date || ".... / .... / .... م"}.`;
  const grade = fill.extra.trim();

  if (id === "ijaza") {
    const book = subjectOf(fill, "الكتاب المسموع");
    const granter = fill.granter.trim() || "الشيخ المجيز";
    return [
      HAMD,
      "أَمَّا بَعْدُ:",
      `${COLLEGE} قَدْ عَقَدَتْ مَجْلِسَ سَمَاعٍ فِي كِتَابِ «${book}»، بِإِسْمَاعِ الشَّيْخِ الْمُجِيزِ: ${granter}.`,
      `وَيَقُولُ الْمُجِيزُ: قَدْ سَمِعَ عَلَيْنَا الطَّالِبُ / الطَّالِبَةُ ${name} هَذَا الْكِتَابَ سَمَاعًا تَامًّا.${grade ? ` ${grade}` : ""}`,
      "وَعَلَيْهِ؛ فَقَدْ أَجَزْنَاهُ / أَجَزْنَاهَا بِرِوَايَةِ هَذَا الْكِتَابِ عَنِّي، بِسَنَدِي الْمُتَّصِلِ إِلَى مُؤَلِّفِهِ، إِجَازَةً خَاصَّةً مِنْ مُعَيَّنٍ فِي مُعَيَّنٍ، بِالشَّرْطِ الْمُعْتَبَرِ عِنْدَ أَهْلِ الْحَدِيثِ وَالْأَثَرِ.",
      "وَإِنَّا إِذْ نَمْنَحُهُ / نَمْنَحُهَا هَذِهِ الْإِجَازَةَ الْعِلْمِيَّةَ، نُوصِيهِ / نُوصِيهَا بِتَقْوَى اللَّهِ تَعَالَى فِي السِّرِّ وَالْعَلَنِ، وَالْعَمَلِ بِمَا عَلِمَ / عَلِمَتْ، وَنَشْرِ سُنَّةِ النَّبِيِّ ﷺ وَالذَّبِّ عَنْهَا بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ.",
      issuedLine,
    ];
  }

  if (id === "course") {
    const course = subjectOf(fill, "الدورة العلمية");
    return [
      HAMD,
      "أَمَّا بَعْدُ:",
      `${COLLEGE} تَشْهَدُ بِأَنَّ الطَّالِبَ / الطَّالِبَةَ: ${name}`,
      `قَدْ شَارَكَ / شَارَكَتْ وَاجْتَازَ / اجْتَازَتِ الدَّوْرَةَ الْعِلْمِيَّةَ التَّخَصُّصِيَّةَ الْمَوْسُومَةَ بِـ: «${course}».`,
      CHARGE,
      issuedLine,
    ];
  }

  const degree =
    id === "bachelor" ? "الْبَكَالُورِيُوسِ" : id === "diploma" ? "الدِّبْلُومِ الْأَكَادِيمِيِّ الْمُعْتَمَدِ" : "الْمَاجِسْتِيرِ";
  const research =
    id === "master" && fill.subject.trim()
      ? `، وَإِجَازَةِ بَحْثِهِ / بَحْثِهَا الْمَوْسُومِ بِـ: «${fill.subject.trim()}»`
      : "";
  return [
    HAMD,
    "أَمَّا بَعْدُ:",
    `${COLLEGE} تَمْنَحُ الطَّالِبَ / الطَّالِبَةَ: ${name}`,
    `شَهَادَةَ ${degree} فِي الْحَدِيثِ النَّبَوِيِّ وَعُلُومِهِ وَعِلَلِهِ.`,
    `وَذَلِكَ بَعْدَ اسْتِيفَائِهِ / اسْتِيفَائِهَا السَّاعَاتِ الدِّرَاسِيَّةِ الْمُقَرَّرَةِ، وَاجْتِيَازِهِ / اجْتِيَازِهَا الِاخْتِبَارَاتِ النَّظَرِيَّةِ وَالتَّطْبِيقِيَّةِ فِي الْمَنَاهِجِ وَالْمُقَرَّرَاتِ${research}.`,
    grade ? `وَحَصَلَ / حَصَلَتْ عَلَى تَقْدِيرِ: ${grade}.` : "وَحَصَلَ / حَصَلَتْ عَلَى التَّقْدِيرِ الْمُعْتَمَدِ فِي سِجِلِّ الْكُلِّيَّةِ.",
    CHARGE,
    dateLine,
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
