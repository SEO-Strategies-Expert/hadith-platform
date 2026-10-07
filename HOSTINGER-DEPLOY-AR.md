# نشر المنصة على Hostinger

## شرط قاعدة البيانات

المشروع يستخدم PostgreSQL وPrisma. خطط Hostinger Web/Cloud العادية توفر MariaDB، ولا تستضيف PostgreSQL؛ PostgreSQL تحتاج VPS. لذلك هذا الإعداد موجّه إلى **Hostinger VPS** مع Node.js وPostgreSQL على الخادم نفسه. لا تستخدم `localhost` على خطة Web/Cloud أو خدمة Node.js المُدارة، لأنه سيشير إلى خادم التطبيق لا جهازك.

## تجهيز VPS

1. اربط الدومين بعنوان VPS، وثبّت Node.js 22 وPostgreSQL على VPS، وأمّن PostgreSQL بكلمة مرور قوية، مع إبقاء منفذ قاعدة البيانات غير مكشوف للإنترنت.
2. أنشئ مستخدمًا وقاعدة PostgreSQL للمشروع. استخدم اتصالًا محليًا مثل `127.0.0.1:5432`.
3. انسخ `.env.example` إلى `.env` على الخادم، واملأ `DATABASE_URL` و`AUTH_SECRET` و`SITE_URL`. لا ترفع ملف `.env` إلى GitHub ولا تضعه ضمن ملفات النشر. أنشئ السر بواسطة `openssl rand -base64 32`.
4. أضف متغيرات التكاملات الاختيارية (البريد، التخزين، Zoom، ومفاتيح أخرى) في بيئة الخدمة عند الحاجة.

## تنزيل وبناء التطبيق

من مجلد التطبيق على VPS:

```bash
git clone https://github.com/IbrahimAlasaad/hadith-platform-hostinger.git
cd hadith-platform
npm ci
npx prisma db push
npm run build
npm run start
```

اضبط مدير العمليات (مثل Passenger/cPanel Node.js Selector أو systemd) لتشغيل `npm run start` من مجلد المشروع، واجعل `NODE_ENV=production` و`PORT` متاحين. اربط الدومين عبر reverse proxy إلى التطبيق، وفعّل HTTPS. لا تشغّل Next.js بوضع static export؛ صفحات الإدارة وواجهات API والإجراءات تحتاج Node.js.

عند تحديث الكود، خذ نسخة احتياطية من قاعدة البيانات أولًا، ثم اسحب التغييرات وأعد البناء وأعد تشغيل التطبيق. بعد أول نشر، أنشئ حساب المدير والبذور وفق إجراء التهيئة المعتمد للمشروع.

## المتغيرات

- مطلوب: `DATABASE_URL`, `AUTH_SECRET`, `SITE_URL`.
- اختياري بحسب الخدمات المستخدمة: `RESEND_API_KEY`, `MAIL_FROM`, `BLOB_READ_WRITE_TOKEN`, ومفاتيح Zoom وCron.
- لا تستخدم متغيرات `POSTGRES_PRISMA_URL` أو `POSTGRES_URL_NON_POOLING`؛ التطبيق يعتمد `DATABASE_URL` فقط.

## ملاحظات

- Hostinger Node.js Web Apps متاحة على خطط Business/Cloud، لكن PostgreSQL على Hostinger متاحة على VPS؛ لذا يتطلب الجمع بين التطبيق وقاعدة PostgreSQL على Hostinger خطة VPS.
- احتفظ بنسخة احتياطية خارج VPS. `prisma db push` يزامن بنية قاعدة البيانات ولا ينقل بيانات التطوير تلقائيًا.
- ملفات `.env` و`.env.local` مستثناة من Git. تحقق من متغيرات البيئة في لوحة الاستضافة قبل البناء والتشغيل.
