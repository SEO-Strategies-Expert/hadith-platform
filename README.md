# منصّة الكلّية العليا للحديث النبوي

تطبيق Next.js كامل (App Router) مع Prisma وPostgreSQL.

## التطوير المحلي

1. ثبّت Node.js 22 وPostgreSQL.
2. انسخ `.env.example` إلى `.env.local` واضبط بيانات قاعدة PostgreSQL وسرّ `AUTH_SECRET`.
3. شغّل:

```bash
npm install
npx prisma db push
npm run dev
```

ثم افتح [http://localhost:3000](http://localhost:3000).

## النشر

التطبيق يحتاج Node.js server؛ التصدير الثابت غير مدعوم لأن صفحات الإدارة وواجهات API ديناميكية.
راجع [دليل النشر على Hostinger VPS](HOSTINGER-DEPLOY-AR.md). إصدار Node.js الموصى به هو 22.
