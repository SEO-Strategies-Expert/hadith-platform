// بيانات الترحيل المنظّمة (ثنائية اللغة) — تعكس محتوى الموقع الحالي.
// يمكن للمحرّر تعديلها لاحقًا من لوحة التحكم.

export const settings = [
  { key: "site.nameAr", group: "brand", value: "الكلّية العليا للحديث النبوي وعلومه وعِلَلِه" },
  { key: "site.nameEn", group: "brand", value: "The Higher College of Prophetic Hadith, Sciences, and Studies" },
  { key: "site.shortAr", group: "brand", value: "الكُلِّيَّةُ العُلْيَا لِلْحَدِيثِ النَّبَوِيِّ وَعُلُومِهِ وَعِلَلِهِ" },
  { key: "site.shortEn", group: "brand", value: "The Higher College of Prophetic Hadith" },
  { key: "site.taglineAr", group: "brand", value: "كلّيةٌ تدريسيّةٌ بحثيّةٌ متخصّصةٌ في علوم الحديث النبوي" },
  { key: "site.taglineEn", group: "brand", value: "A teaching and research college specialized in the Prophetic Hadith sciences" },
  { key: "university.nameAr", group: "brand", value: "جامعة أبو بكر إبراهيم الدولية" },
  { key: "university.nameEn", group: "brand", value: "Abu Bakr Ibrahim International University" },
  { key: "contact.email", group: "contact", value: "info@hadith-faculty.com" },
  { key: "contact.phone", group: "contact", value: "" },
  { key: "contact.addressAr", group: "contact", value: "" },
  { key: "contact.addressEn", group: "contact", value: "" },
];

export const socialLinks = [
  { key: "youtube", labelAr: "يوتيوب", labelEn: "YouTube", icon: "s-yt", order: 1 },
  { key: "facebook", labelAr: "فيسبوك", labelEn: "Facebook", icon: "s-fb", order: 2 },
  { key: "x", labelAr: "إكس", labelEn: "X", icon: "s-x", order: 3 },
  { key: "snapchat", labelAr: "سناب شات", labelEn: "Snapchat", icon: "s-sc", order: 4 },
  { key: "tiktok", labelAr: "تيك توك", labelEn: "TikTok", icon: "s-tk", order: 5 },
  { key: "instagram", labelAr: "إنستجرام", labelEn: "Instagram", icon: "s-ig", order: 6 },
  { key: "telegram", labelAr: "تليجرام", labelEn: "Telegram", icon: "s-tg", order: 7 },
  { key: "whatsapp", labelAr: "واتساب", labelEn: "WhatsApp", icon: "s-wa", order: 8 },
];

export const heroSlides = [
  { imageAr: "assets/img/hero-custom-1.png", imageEn: "assets/img/slide-1-en.jpg", altAr: "درسٌ علميٌّ مباشرٌ من قاعة الكلّية يتابعه الطلبة على الشاشة", altEn: "A live lecture hall where students follow a senior scholar on screen", order: 1 },
  { imageAr: "assets/img/hero-custom-2.png", imageEn: "assets/img/slide-2-en.jpg", altAr: "دواوين المذاكرات العلمية بين علماء الحديث النبوي وباحثيه وطلبته", altEn: "The college's scholarly discussion councils", order: 2 },
  { imageAr: "assets/img/hero-custom-3.png", imageEn: "assets/img/slide-3-en.jpg", altAr: "مناهج تعليمية متناسبة مع مراحل التخصّص في علوم الحديث النبوي", altEn: "A curriculum aligned with the stages of specialization", order: 3 },
  { imageAr: "assets/img/hero-custom-4.png", imageEn: "assets/img/slide-4-en.jpg", altAr: "إكمال برنامج الكلّية يعني بداية العالِميّة في علوم الحديث النبوي", altEn: "Completing the program marks the beginning of the ʿālamiyyah", order: 4 },
];

// روابط الهيدر (مع القوائم المنسدلة) — parentIndex يشير إلى العنصر الأب داخل هذه المصفوفة
export const headerNav = [
  { labelAr: "الرئيسية", labelEn: "Home", href: "index.html", icon: "i-home" },
  { labelAr: "عن الكلّية", labelEn: "About", href: "about.html", icon: "i-college", children: [
    { labelAr: "التعريف بالكلّية", labelEn: "About the College", href: "about.html" },
    { labelAr: "الرؤية والرسالة والأهداف", labelEn: "Vision, Mission & Goals", href: "about.html#vision" },
  ]},
  { labelAr: "الهيئة العلمية", labelEn: "Faculty", href: "faculty.html", icon: "i-scholar", children: [
    { labelAr: "المجلس العلمي", labelEn: "Scientific Council", href: "faculty.html#scientific-council" },
    { labelAr: "أعضاء هيئة التدريس", labelEn: "Faculty Members", href: "faculty.html" },
  ]},
  { labelAr: "البرامج", labelEn: "Programs", href: "programs.html", icon: "i-programs", children: [
    { labelAr: "مرحلة التأسيس", labelEn: "Foundation Stage", href: "program-foundation.html" },
    { labelAr: "مرحلة التعمُّق", labelEn: "Advanced Stage", href: "program-higher.html" },
    { labelAr: "مرحلة البحث العلمي", labelEn: "Research Stage", href: "program-higher.html#research" },
    { labelAr: "الدورات العلمية", labelEn: "Academic Courses", href: "courses.html" },
  ]},
  { labelAr: "القبول", labelEn: "Admissions", href: "admissions.html", icon: "i-admission" },
  { labelAr: "ديوان العلماء", labelEn: "Scholars' Forum", href: "diwan.html", icon: "i-diwan" },
  { labelAr: "المكتبة الرقمية", labelEn: "Digital Library", href: "library.html", icon: "i-diglib" },
  { labelAr: "الأخبار", labelEn: "News", href: "news.html", icon: "i-news" },
  { labelAr: "التواصل", labelEn: "Contact", href: "contact.html", icon: "i-contact" },
];

export const footerNav = [
  { group: "col1", labelAr: "الكلّية", labelEn: "The College", href: "" , heading: true },
  { group: "col1", labelAr: "التعريف بالكلّية", labelEn: "About the College", href: "about.html" },
  { group: "col1", labelAr: "الرؤية والرسالة", labelEn: "Vision & Mission", href: "about.html#vision" },
  { group: "col1", labelAr: "المجلس العلمي", labelEn: "Scientific Council", href: "faculty.html#scientific-council" },
  { group: "col1", labelAr: "الأخبار والفعاليات", labelEn: "News & events", href: "news.html" },
  { group: "col1", labelAr: "تواصل معنا", labelEn: "Contact us", href: "contact.html" },
  { group: "col2", labelAr: "الدراسة", labelEn: "Study", href: "", heading: true },
  { group: "col2", labelAr: "مرحلة التأسيس", labelEn: "Foundation Stage", href: "program-foundation.html" },
  { group: "col2", labelAr: "مرحلة التعمُّق", labelEn: "Advanced Stage", href: "program-higher.html" },
  { group: "col2", labelAr: "مرحلة البحث العلمي", labelEn: "Research Stage", href: "program-higher.html#research" },
  { group: "col2", labelAr: "الإجازات العلمية", labelEn: "Scholarly ijazahs", href: "ijazat.html" },
  { group: "col2", labelAr: "القبول والتسجيل", labelEn: "Admissions & registration", href: "admissions.html" },
  { group: "col3", labelAr: "المعرفة الرقمية", labelEn: "Digital knowledge", href: "", heading: true },
  { group: "col3", labelAr: "ديوان العلماء والباحثين", labelEn: "Scholars' Forum", href: "diwan.html" },
  { group: "col3", labelAr: "منتدى الطلاب", labelEn: "Student Forum", href: "student-login.html" },
  { group: "col3", labelAr: "المكتبة الرقمية", labelEn: "Digital Library", href: "library.html" },
  { group: "col3", labelAr: "المجلة العلمية", labelEn: "Academic Journal", href: "publications.html" },
  { group: "col3", labelAr: "الدورات العلمية", labelEn: "Academic courses", href: "courses.html" },
];

export const scholars = [
  { nameAr: "أ.د. عبد الجبّار بن هادي النَّقيب المرّاني", nameEn: "Prof. Dr. Abd al-Jabbar ibn Hadi al-Naqib al-Marrani", rankAr: "رئيس المجلس العلمي", rankEn: "Head of the Scientific Council", specAr: "علل الحديث ونقد المتون", specEn: "Hadith defects & text criticism", photoUrl: "assets/img/scholar-1.jpg", isCouncilHead: true, isCouncil: true, order: 1 },
  { nameAr: "د. محمد بن صالح العُمري", nameEn: "Dr. Muhammad ibn Salih al-Umari", rankAr: "أستاذ الأسانيد", rankEn: "Professor of chains", specAr: "دراسة الأسانيد والتخريج", specEn: "Chain analysis & hadith documentation", photoUrl: "assets/img/scholar-2.jpg", isCouncil: true, order: 2 },
  { nameAr: "د. أحمد بن عبد الله الشِّهري", nameEn: "Dr. Ahmad ibn Abdullah al-Shihri", rankAr: "أستاذ مشارك", rankEn: "Associate professor", specAr: "مصطلح الحديث التطبيقي", specEn: "Applied hadith terminology", photoUrl: "assets/img/scholar-3.jpg", order: 3 },
  { nameAr: "د. الحسين ولد بابا الشِّنقيطي", nameEn: "Dr. al-Husayn Wuld Baba al-Shinqiti", rankAr: "أستاذ علوم المخطوطات", rankEn: "Professor of manuscript studies", specAr: "تحقيق المخطوط ومقابلة النسخ", specEn: "Manuscript editing & collation", photoUrl: "assets/img/scholar-4.jpg", order: 4 },
  { nameAr: "د. بشير بن إبراهيم النِّيجيري", nameEn: "Dr. Bashir ibn Ibrahim al-Nijiri", rankAr: "عضو هيئة التدريس", rankEn: "Faculty member", specAr: "فقه الحديث ودلالات الألفاظ", specEn: "Hadith comprehension & meanings of wording", photoUrl: "assets/img/scholar-5.jpg", order: 5 },
  { nameAr: "د. عمر بن يحيى الحُميدي", nameEn: "Dr. Umar ibn Yahya al-Humaydi", rankAr: "عضو هيئة التدريس", rankEn: "Faculty member", specAr: "التراجم وطبقات الرواة", specEn: "Narrator biographies & generations", photoUrl: "assets/img/scholar-6.jpg", order: 6 },
];

export const stages = [
  { key: "foundation", numAr: "المرحلة الأولى", numEn: "Stage one", titleAr: "مرحلة التأسيس", titleEn: "Foundation Stage", metaAr: "سنةٌ دراسيّة · ٨ مقرّرات", metaEn: "One academic year · 8 courses", descAr: "ضبطُ المصطلح ومبادئ الرواية، وقراءةُ مقدّمة ابن الصلاح ومصطلح الحديث التطبيقي، مع تدريبٍ أسبوعيٍّ على القراءة الإسنادية.", descEn: "Mastering terminology and the principles of narration, reading Ibn al-Ṣalāḥ's Muqaddimah and applied hadith terminology, with weekly training in reading chains.", items: { ar: ["مقدّمة ابن الصلاح", "النُّخَب في علوم الحديث", "مصطلح الحديث التطبيقي"], en: ["Muqaddimat Ibn al-Ṣalāḥ", "Nukhbat al-Fikar", "Applied hadith terminology"] }, icon: "i-stage", moreHref: "program-foundation.html", order: 1 },
  { key: "advanced", numAr: "المرحلة الثانية", numEn: "Stage two", titleAr: "مرحلة التعمُّق", titleEn: "Advanced Stage", metaAr: "سنةٌ دراسيّة · ١٠ مقرّرات", metaEn: "One academic year · 10 courses", descAr: "تهذيبُ الكمال ومقارنةُ المرويّات ودراسةُ الأسانيد والعلل، مع تطبيقاتٍ على الصحيحين وكتب العلل والتراجم بإشراف مباشر.", descEn: "Tahdhīb al-Kamāl, comparing narrations and studying chains and defects, with applications on the two Ṣaḥīḥs and the books of defects and biographies under direct supervision.", items: { ar: ["تهذيب الكمال", "معرفة علوم الحديث", "مناهج النقد"], en: ["Tahdhīb al-Kamāl", "Maʿrifat ʿUlūm al-Ḥadīth", "Methods of criticism"] }, icon: "i-diglib", moreHref: "program-higher.html", order: 2 },
  { key: "research", numAr: "المرحلة الثالثة", numEn: "Stage three", titleAr: "مرحلة البحث العلمي", titleEn: "Research Stage", metaAr: "سنةٌ دراسيّة · مشروع + مناقشة", metaEn: "One academic year · project + defense", descAr: "مشروعٌ علميٌّ أصيلٌ بإشراف عضوٍ من الهيئة العلمية، ينتهي بمناقشةٍ علنيّةٍ وإجازةٍ مسنَدةٍ تُفتتح بها العالِميّة.", descEn: "An original scholarly project supervised by a faculty member, concluding with a public defense and a certified ijāzah that opens the ʿālamiyyah.", items: { ar: ["تدريب الراوي", "مناهج البحث", "المشروع والمناقشة"], en: ["Tadrīb al-Rāwī", "Research methods", "The project & defense"] }, icon: "i-manuscript", moreHref: "program-higher.html#research", order: 3 },
];

export const newsItems = [
  { titleAr: "افتتاحُ المجلس العلمي لدورته الثانية بحضور سبعةَ عشرَ عضوًا من تسع دول", titleEn: "The Scientific Council opens its second session with seventeen members from nine countries", excerptAr: "عقدَ المجلس العلمي للكلّية جلستَه الافتتاحيّة لاعتماد الخطّة الدراسيّة المحدَّثة، وإقرار شروط النقاش والبحث في ديوان العلماء، واعتماد ثلاثة مشاريع علميّة للمناقشة هذا الفصل.", excerptEn: "The college's Scientific Council held its opening session to approve the updated study plan, ratify the rules of discussion and research in the Scholars' Forum, and approve three scholarly projects for defense this term.", imageUrl: "assets/img/news-lead.jpg", tagAr: "خبر رئيس", tagEn: "Featured", date: "2026-07-28", featured: true, order: 1 },
  { titleAr: "اعتماد أربعةٍ وعشرين مقرَّرًا في الخطّة المحدَّثة لمراحل التخصّص الثلاث", titleEn: "Twenty-four courses approved in the updated plan for the three specialization stages", imageUrl: "assets/img/news-1.jpg", tagAr: "الخطّة الدراسيّة", tagEn: "Study plan", date: "2026-07-21", order: 2 },
  { titleAr: "إضافة اثنين وثلاثين مصدرًا مفهرسًا إلى المكتبة الرقميّة للكلّية", titleEn: "Thirty-two indexed sources added to the college's Digital Library", imageUrl: "assets/img/news-2.jpg", tagAr: "المكتبة الرقميّة", tagEn: "Digital Library", date: "2026-07-14", order: 3 },
  { titleAr: "مجلسُ سماعٍ مسنَدٍ لصحيح البخاري يبدأ مطلع الشهر القادم", titleEn: "A chained samāʿ session of Ṣaḥīḥ al-Bukhārī begins early next month", imageUrl: "assets/img/news-3.jpg", tagAr: "الإجازات", tagEn: "Ijazahs", date: "2026-07-05", order: 4 },
  { titleAr: "صدور العدد الأول من مجلّة الكلّية العلميّة المحكّمة", titleEn: "The first issue of the college's peer-reviewed academic journal is released", imageUrl: "assets/img/news-4.jpg", tagAr: "المجلة العلميّة", tagEn: "Academic journal", date: "2026-06-30", order: 5 },
];

export const events = [
  { titleAr: "مجلسُ مذاكرةٍ مفتوح", titleEn: "Open discussion council", descAr: "تحرير القول في زيادة الثقة — أ.د. عبد الجبّار المرّاني", descEn: "Refining the ruling on the addition of a reliable narrator — Prof. Dr. Abd al-Jabbar al-Marrani", whenAr: "بعد المغرب · بثٌّ مباشر", whenEn: "After Maghrib · live stream", date: "2026-08-12", order: 1 },
  { titleAr: "مجلسُ سماعٍ مسنَد", titleEn: "Chained samāʿ session", descAr: "صحيح البخاري — كتاب بدء الوحي", descEn: "Ṣaḥīḥ al-Bukhārī — the Book of the Beginning of Revelation", whenAr: "بعد العشاء · حضورٌ وبثّ", whenEn: "After Isha · in person & stream", date: "2026-08-19", order: 2 },
  { titleAr: "إغلاقُ باب القبول", titleEn: "Admissions close", descAr: "الدفعة الأولى لمرحلة التأسيس", descEn: "The first cohort of the Foundation Stage", whenAr: "آخر موعدٍ للتقديم", whenEn: "Application deadline", date: "2026-09-01", order: 3 },
  { titleAr: "بدايةُ الفصل الأول", titleEn: "First term begins", descAr: "انطلاق المقرّرات لجميع المراحل", descEn: "Courses start for all stages", whenAr: "التقويم الأكاديمي", whenEn: "Academic calendar", date: "2026-09-15", order: 4 },
];

export const diwanCategories = [
  { key: "asanid", labelAr: "الأسانيد والرواة", labelEn: "Chains & narrators", order: 1 },
  { key: "ilal", labelAr: "العلل والتعليل", labelEn: "Defects & analysis", order: 2 },
  { key: "mustalah", labelAr: "المصطلح والتطبيق", labelEn: "Terminology & application", order: 3 },
  { key: "makhtut", labelAr: "المخطوط والتحقيق", labelEn: "Manuscripts & editing", order: 4 },
  { key: "fiqh", labelAr: "فقه الحديث", labelEn: "Hadith comprehension", order: 5 },
];

export const diwanThreads = [
  { titleAr: "تحرير القول في زيادة الثقة إذا خالف من هو أوثق منه", titleEn: "Refining the ruling on the addition of a reliable narrator when contradicting one more reliable", authorAr: "أ.د. عبد الجبّار المرّاني", authorEn: "Prof. Dr. Abd al-Jabbar al-Marrani", rankAr: "عضو المجلس العلمي", rankEn: "Scientific Council member", categoryKey: "ilal", count: 47, pinned: true, timeAr: "قبل ساعتين", timeEn: "2 hours ago", order: 1 },
  { titleAr: "مدارُ حديث «إنما الأعمال بالنيّات» ودعوى تفرّد يحيى بن سعيد", titleEn: "The pivot of \"Actions are but by intentions\" and the claim of Yahya ibn Saʿid's sole narration", authorAr: "د. محمد بن صالح العُمري", authorEn: "Dr. Muhammad ibn Salih al-Umari", rankAr: "أستاذ الأسانيد", rankEn: "Professor of chains", categoryKey: "asanid", count: 38, pinned: true, timeAr: "قبل خمس ساعات", timeEn: "5 hours ago", order: 2 },
  { titleAr: "ضوابط الحكم بالاضطراب عند المتقدّمين والمتأخّرين", titleEn: "Criteria for ruling a hadith as disturbed among early and later scholars", authorAr: "د. أحمد بن عبد الله الشِّهري", authorEn: "Dr. Ahmad ibn Abdullah al-Shihri", rankAr: "باحث دكتوراه", rankEn: "Doctoral researcher", categoryKey: "ilal", count: 31, timeAr: "أمس", timeEn: "Yesterday", order: 3 },
  { titleAr: "نسخة مخطوطة من «التمهيد» في خزانة القرويّين — وصفٌ ومقابلة", titleEn: "A manuscript of \"al-Tamhid\" in the Qarawiyyin library — description and collation", authorAr: "د. الحسين ولد بابا", authorEn: "Dr. al-Husayn Wuld Baba", rankAr: "أستاذ علوم المخطوطات", rankEn: "Professor of manuscript studies", categoryKey: "makhtut", count: 26, timeAr: "أمس", timeEn: "Yesterday", order: 4 },
  { titleAr: "هل يُقبل تفرّد الصدوق في الأصول؟ عرضٌ لأقوال أهل الصنعة", titleEn: "Is the sole narration of a truthful narrator accepted in foundational matters?", authorAr: "د. عمر بن يحيى الحُميدي", authorEn: "Dr. Umar ibn Yahya al-Humaydi", rankAr: "عضو هيئة التدريس", rankEn: "Faculty member", categoryKey: "asanid", count: 24, timeAr: "منذ يومين", timeEn: "2 days ago", order: 5 },
  { titleAr: "المرسَل الخفيّ: تحرير الحدّ والفرق بينه وبين التدليس", titleEn: "The hidden mursal: defining its limit and its difference from tadlis", authorAr: "د. عبد الرحمن الكِناني", authorEn: "Dr. Abd al-Rahman al-Kinani", rankAr: "باحث", rankEn: "Researcher", categoryKey: "mustalah", count: 22, timeAr: "منذ يومين", timeEn: "2 days ago", order: 6 },
  { titleAr: "أثر اختلاف النسخ في ضبط ألفاظ صحيح البخاري", titleEn: "The effect of manuscript variants on the wording of Ṣaḥīḥ al-Bukhārī", authorAr: "د. سيف الدين الأنصاري", authorEn: "Dr. Sayf al-Din al-Ansari", rankAr: "محقّق مخطوطات", rankEn: "Manuscript editor", categoryKey: "makhtut", count: 19, timeAr: "منذ ثلاثة أيام", timeEn: "3 days ago", order: 7 },
  { titleAr: "مذاكرة طلابية: جمع طرق حديث «لا ضرر ولا ضرار» ودراستها", titleEn: "Student discussion: gathering and studying the chains of \"no harm and no harming\"", authorAr: "طلبة مرحلة التعمُّق", authorEn: "Advanced Stage students", rankAr: "مذاكرة طلابية", rankEn: "Student discussion", categoryKey: "mustalah", count: 17, timeAr: "منذ ثلاثة أيام", timeEn: "3 days ago", order: 8 },
  { titleAr: "قاعدة «من حفظ حجّةٌ على من لم يحفظ» — تحريرٌ وتقييد", titleEn: "The rule \"who preserves is proof over who does not\" — refinement and restriction", authorAr: "د. بشير بن إبراهيم النِّيجيري", authorEn: "Dr. Bashir ibn Ibrahim al-Nijiri", rankAr: "عضو هيئة التدريس", rankEn: "Faculty member", categoryKey: "ilal", count: 15, timeAr: "منذ أربعة أيام", timeEn: "4 days ago", order: 9 },
  { titleAr: "رواةٌ أخرج لهم البخاري وتُكلِّم فيهم — منهج الشيخين", titleEn: "Narrators al-Bukhari included despite criticism — the method of the two Shaykhs", authorAr: "د. خالد بن سعيد القحطاني", authorEn: "Dr. Khalid ibn Saʿid al-Qahtani", rankAr: "باحث", rankEn: "Researcher", categoryKey: "asanid", count: 14, timeAr: "منذ خمسة أيام", timeEn: "5 days ago", order: 10 },
  { titleAr: "فقه الحديث: دلالة الأمر المجرَّد في أحاديث الصلاة", titleEn: "Hadith comprehension: the import of the bare imperative in the hadiths of prayer", authorAr: "د. طارق بن منصور", authorEn: "Dr. Tariq ibn Mansur", rankAr: "أستاذ مشارك", rankEn: "Associate professor", categoryKey: "fiqh", count: 12, timeAr: "منذ أسبوع", timeEn: "a week ago", order: 11 },
  { titleAr: "الاعتبار والمتابعات والشواهد — تحرير المصطلح بالأمثلة", titleEn: "Iʿtibar, corroborations and witnesses — refining the terms with examples", authorAr: "د. أنس بن يوسف الحلبي", authorEn: "Dr. Anas ibn Yusuf al-Halabi", rankAr: "باحث دكتوراه", rankEn: "Doctoral researcher", categoryKey: "asanid", count: 11, timeAr: "منذ أسبوع", timeEn: "a week ago", order: 12 },
];

export const journalIssues = [
  { nameAr: "مَجَلَّةُ الكُلِّيَّة", nameEn: "College Journal", subAr: "للحديث النبوي وعلومه وعِلَلِه", subEn: "Prophetic Hadith, its sciences & defects", noAr: "العدد الأوّل", noEn: "Issue One", dateAr: "رجب ١٤٤٨هـ", dateEn: "Rajab 1448 AH", tagAr: "صدرَ حديثًا", tagEn: "Newly released", isNew: true, order: 1 },
  { nameAr: "مَجَلَّةُ الكُلِّيَّة", nameEn: "College Journal", subAr: "عددٌ خاصٌّ بعلل الحديث", subEn: "A special issue on hadith defects", noAr: "العدد الثاني", noEn: "Issue Two", dateAr: "تحت التحكيم", dateEn: "Under review", tagAr: "قريبًا", tagEn: "Coming soon", order: 2 },
];

export const papers = [
  { no: "٠١", titleAr: "زيادةُ الثقة إذا خالف من هو أوثقُ منه — دراسةٌ تطبيقيّةٌ على أحاديث الصحيحين", titleEn: "The addition of a reliable narrator when contradicting one more reliable — an applied study on the hadiths of the two Ṣaḥīḥs", metaAr: "أ.د. عبد الجبّار المرّاني · محكَّم · ٤٢ صفحة", metaEn: "Prof. Dr. Abd al-Jabbar al-Marrani · peer-reviewed · 42 pages", order: 1 },
  { no: "٠٢", titleAr: "المرسَلُ الخفيّ عند المتقدّمين: تحريرُ الحدّ والفرقُ بينه وبين التدليس", titleEn: "The hidden mursal among the early scholars: defining its limit and its difference from tadlīs", metaAr: "د. عبد الرحمن الكِناني · محكَّم · ٣٦ صفحة", metaEn: "Dr. Abd al-Rahman al-Kinani · peer-reviewed · 36 pages", order: 2 },
  { no: "٠٣", titleAr: "نسخةٌ مخطوطةٌ من «التمهيد» في خزانة القرويّين — وصفٌ ومقابلةٌ وإثباتُ فروق", titleEn: "A manuscript of \"al-Tamhīd\" in the Qarawiyyin library — description, collation and recording of variants", metaAr: "د. الحسين ولد بابا · محكَّم · ٥٨ صفحة", metaEn: "Dr. al-Husayn Wuld Baba · peer-reviewed · 58 pages", order: 3 },
  { no: "٠٤", titleAr: "أثرُ اختلاف النسخ في ضبط ألفاظ صحيح البخاري — قراءةٌ في ثلاث نسخٍ خطّيّة", titleEn: "The effect of manuscript variants on the wording of Ṣaḥīḥ al-Bukhārī — a reading across three handwritten copies", metaAr: "د. سيف الدين الأنصاري · محكَّم · ٤٧ صفحة", metaEn: "Dr. Sayf al-Din al-Ansari · peer-reviewed · 47 pages", order: 4 },
  { no: "٠٥", titleAr: "قاعدةُ «من حفظ حجّةٌ على من لم يحفظ» — تحريرٌ وتقييدٌ بأمثلةٍ من كتب العلل", titleEn: "The rule \"the one who preserves is proof over the one who does not\" — refinement and restriction with examples from the books of defects", metaAr: "د. بشير بن إبراهيم النِّيجيري · محكَّم · ٣١ صفحة", metaEn: "Dr. Bashir ibn Ibrahim al-Nijiri · peer-reviewed · 31 pages", order: 5 },
];

export const libraryResources = [
  { nameAr: "الباحث الحديثي", nameEn: "Al-Bahith al-Hadithi", url: "https://sunnah.one/", category: "بحث حديثي", descAr: "محرك بحث حديثي سريع للوصول إلى نصوص الأحاديث ومصادرها ونتائجها البحثية.", descEn: "A fast hadith search engine for accessing hadith texts, sources and research results.", icon: "بح", featured: true, order: 1 },
  { nameAr: "الموسوعة الحديثية — الدرر السنية", nameEn: "Al-Durar al-Saniyyah Encyclopedia", url: "https://dorar.net/hadith", category: "موسوعات", descAr: "بحث متقدم في الأحاديث وأحكام المحدثين والشروح والموضوعات والتراجم.", descEn: "Advanced search in hadiths, scholars' rulings, commentaries and biographies.", icon: "در", featured: true, order: 2 },
  { nameAr: "المكتبة الشاملة", nameEn: "Al-Maktaba al-Shamela", url: "https://shamela.ws/", category: "مكتبات", descAr: "مكتبة نصية واسعة تضم كتب الحديث وشروحه والرجال والعلل والمصطلح.", descEn: "A large text library including hadith books, commentaries, narrators, defects and terminology.", icon: "شم", featured: true, order: 3 },
  { nameAr: "جامع السنة وشروحها", nameEn: "Jami al-Sunnah", url: "https://hadithportal.com/", category: "موسوعات", descAr: "بوابة بحثية تجمع نصوص السنة وشروحها وخدمات الفهرسة والبحث الموضوعي.", descEn: "A research portal gathering the texts of the Sunnah, their commentaries and indexing.", icon: "جس", featured: true, order: 4 },
  { nameAr: "موسوعة الأحاديث النبوية", nameEn: "Hadith Encyclopedia", url: "https://hadeethenc.com/ar/home", category: "متعدد اللغات", descAr: "أحاديث مختارة موثقة مع ترجمات وشروح بعدة لغات.", descEn: "Selected documented hadiths with translations and commentaries in several languages.", icon: "حن", order: 5 },
  { nameAr: "المكتبة الوقفية", nameEn: "Al-Waqfeya Library", url: "https://waqfeya.net/", category: "مكتبات", descAr: "كتب مصورة وفهارس منظمة تضم أقسامًا واسعة لكتب الحديث والمصطلح.", descEn: "Scanned books and organized indexes with large sections for hadith and terminology.", icon: "وق", order: 6 },
  { nameAr: "Sunnah.com", nameEn: "Sunnah.com", url: "https://sunnah.com/", category: "متعدد اللغات", descAr: "واجهة إنجليزية مشهورة للبحث والتصفح في دواوين السنة مع النص العربي والترجمة.", descEn: "A popular English interface for searching and browsing the Sunnah collections.", icon: "EN", order: 7 },
];
