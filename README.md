# EduNova CRM — lokal demo

O‘quv markazlari uchun brauzerda ishlaydigan EduNova CRM demo loyihasi. Next.js App Router, TypeScript, Tailwind CSS, Framer Motion va Lucide React ishlatilgan.

## O‘rnatish va ishga tushirish

Talab: Node.js 20.9 yoki undan yangi versiya.

```bash
npm install
npm run dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) manzilini oching. Ishga tushirish uchun `.env` fayli, maxfiy kalit yoki tashqi servis kerak emas.

Production build va lokal ishga tushirish:

```bash
npm run build
npm run start
```

## Demo imkoniyatlari

- Administrator, o‘qituvchi va o‘quvchi demo hisoblari.
- Alohida ro‘yxatdan o‘tish bo‘limida ism-familiya va demo rol tanlab, lokal profil yaratish; oldindan berilgan demo hisoblar alohida bo‘limda qoladi.
- O‘quvchilar, o‘qituvchilar va guruhlar uchun CRUD amallari.
- Kunlik davomatni belgilash, ballar va coin balanslarini ko‘rish.
- Coin yuborish, sovg‘a sotib olish/yuborish va kelgan sovg‘ani bir marta coinga almashtirish.
- Coin transferlari, sovg‘alar va bildirishnomalar tarixi.
- JSON eksport/import, demo ma’lumotlarini qayta tiklash va Light/Dark rejim.
- Motion animatsiyalari, interaktiv dashboard kartalari va foydalanuvchi qurilmasining reduced-motion sozlamasiga mos animatsiya.
- Ma’lumotlar brauzerning `localStorage` xotirasida saqlanadi va sahifa yangilanganda qoladi.

## Demo xavfsizligi haqida

Rollar namoyish uchun mo‘ljallangan. Login server tomonidan tekshirilmaydi; lokal rol tanlovi haqiqiy autentifikatsiya yoki administrator huquqini xavfsiz boshqarish vositasi emas. Bu versiyada server, tashqi ma’lumotlar bazasi, autentifikatsiya xizmati yoki ko‘p foydalanuvchili xavfsiz saqlash mavjud emas. Brauzer ma’lumotlarini tozalash saqlangan CRM ma’lumotlarini o‘chirishi mumkin.
