import type { Database, GiftDelivery } from "./types";

const STORAGE_KEY = "edunova-crm-data-v1";
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

export function createDemoData(): Database {
  const teachers = [
    { id: "t1", name: "Madina Karimova", email: "madina@edunova.uz", subject: "Ingliz tili", groupIds: ["g1", "g2"] },
    { id: "t2", name: "Azizbek Rahimov", email: "aziz@edunova.uz", subject: "Matematika", groupIds: ["g3"] },
    { id: "t3", name: "Sevara Islomova", email: "sevara@edunova.uz", subject: "IT va dasturlash", groupIds: ["g4"] },
  ];
  const groups = [
    { id: "g1", name: "Beginner A1", course: "Ingliz tili", teacherId: "t1", schedule: "Du / Chor / Jum · 10:00", studentIds: ["s1", "s2", "s3"] },
    { id: "g2", name: "Pre-Intermediate", course: "Ingliz tili", teacherId: "t1", schedule: "Se / Pay / Shan · 14:00", studentIds: ["s4", "s5"] },
    { id: "g3", name: "Matematika 8-sinf", course: "Matematika", teacherId: "t2", schedule: "Du / Chor / Jum · 16:00", studentIds: ["s6", "s7"] },
    { id: "g4", name: "Frontend asoslari", course: "IT va dasturlash", teacherId: "t3", schedule: "Se / Pay / Shan · 11:00", studentIds: ["s8", "s9"] },
  ];
  return {
    version: 1,
    teachers,
    groups,
    students: [
      { id: "s1", name: "Sardor Qodirov", email: "sardor@mail.uz", groupId: "g1", coins: 245, points: 92, joinedAt: "2025-09-01" },
      { id: "s2", name: "Malika Ergasheva", email: "malika@mail.uz", groupId: "g1", coins: 180, points: 87, joinedAt: "2025-09-04" },
      { id: "s3", name: "Jasur Tursunov", email: "jasur@mail.uz", groupId: "g1", coins: 320, points: 96, joinedAt: "2025-09-07" },
      { id: "s4", name: "Dilnoza Usmonova", email: "dilnoza@mail.uz", groupId: "g2", coins: 150, points: 81, joinedAt: "2025-10-02" },
      { id: "s5", name: "Bekzod Aliyev", email: "bekzod@mail.uz", groupId: "g2", coins: 95, points: 74, joinedAt: "2025-10-12" },
      { id: "s6", name: "Aziza Soliyeva", email: "aziza@mail.uz", groupId: "g3", coins: 210, points: 89, joinedAt: "2025-08-21" },
      { id: "s7", name: "Temur Raxmatov", email: "temur@mail.uz", groupId: "g3", coins: 75, points: 68, joinedAt: "2025-11-01" },
      { id: "s8", name: "Shahnoza Nabiyeva", email: "shahnoza@mail.uz", groupId: "g4", coins: 280, points: 94, joinedAt: "2025-10-10" },
      { id: "s9", name: "Otabek Karimov", email: "otabek@mail.uz", groupId: "g4", coins: 130, points: 79, joinedAt: "2025-11-15" },
    ],
    attendance: [
      ...["s1", "s2", "s3", "s4", "s6", "s8"].map((studentId, i) => ({ id: `a${i + 1}`, studentId, groupId: i < 3 ? "g1" : i < 4 ? "g2" : i < 5 ? "g3" : "g4", date: new Date().toISOString().slice(0, 10), status: "Bor" as const })),
      { id: "a7", studentId: "s5", groupId: "g2", date: new Date().toISOString().slice(0, 10), status: "Kechikdi" as const },
    ],
    gifts: [
      { id: "gift1", name: "Bepul dars", emoji: "🎓", price: 100, description: "Bir martalik qo‘shimcha dars" },
      { id: "gift2", name: "Kofe tanaffusi", emoji: "☕", price: 50, description: "Markaz kafesida ichimlik" },
      { id: "gift3", name: "EduNova daftar", emoji: "📓", price: 80, description: "Brendli daftar va ruchka" },
      { id: "gift4", name: "Kino chiptasi", emoji: "🎬", price: 150, description: "Dam olish uchun kichik sovg‘a" },
    ],
    giftDeliveries: [],
    transfers: [],
    notifications: [
      { id: "n1", message: "EduNova demo tizimiga xush kelibsiz!", createdAt: now(), read: false },
      { id: "n2", message: "Bugungi darslar davomati yangilandi.", createdAt: now(), read: false },
    ],
  };
}

export function readDatabase(): Database {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) {
    const initial = createDemoData();
    writeDatabase(initial);
    return initial;
  }
  const parsed: unknown = JSON.parse(value);
  if (!isDatabase(parsed)) throw new Error("Saqlangan ma’lumotlar formati noto‘g‘ri. JSON importidan foydalaning yoki demo ma’lumotlarni tiklang.");
  return parsed;
}

export function writeDatabase(database: Database) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

export function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<Database>;
  const arrays = ["students", "teachers", "groups", "attendance", "gifts", "giftDeliveries", "transfers", "notifications"] as const;
  if (data.version !== 1 || !arrays.every((key) => Array.isArray(data[key]))) return false;
  const record = (item: unknown): item is Record<string, unknown> => Boolean(item && typeof item === "object");
  const text = (item: unknown) => typeof item === "string";
  const ids = (item: unknown) => Array.isArray(item) && item.every(text);
  const nonNegativeInteger = (item: unknown) => Number.isInteger(item) && Number(item) >= 0;
  return data.students!.every((item) => record(item) && text(item.id) && text(item.name) && text(item.email) && text(item.groupId) && nonNegativeInteger(item.coins) && nonNegativeInteger(item.points) && text(item.joinedAt))
    && data.teachers!.every((item) => record(item) && text(item.id) && text(item.name) && text(item.email) && text(item.subject) && ids(item.groupIds))
    && data.groups!.every((item) => record(item) && text(item.id) && text(item.name) && text(item.course) && text(item.teacherId) && text(item.schedule) && ids(item.studentIds))
    && data.attendance!.every((item) => record(item) && text(item.id) && text(item.studentId) && text(item.groupId) && text(item.date) && ["Bor", "Yo‘q", "Kechikdi"].includes(String(item.status)))
    && data.gifts!.every((item) => record(item) && text(item.id) && text(item.name) && text(item.emoji) && Number.isInteger(item.price) && Number(item.price) > 0 && text(item.description))
    && data.giftDeliveries!.every((item) => record(item) && text(item.id) && text(item.giftId) && text(item.fromStudentId) && text(item.toStudentId) && typeof item.redeemed === "boolean" && text(item.createdAt))
    && data.transfers!.every((item) => record(item) && text(item.id) && text(item.fromStudentId) && text(item.toStudentId) && Number.isInteger(item.amount) && Number(item.amount) > 0 && text(item.note) && text(item.createdAt))
    && data.notifications!.every((item) => record(item) && text(item.id) && text(item.message) && text(item.createdAt) && typeof item.read === "boolean");
}

function notify(database: Database, message: string): Database {
  return { ...database, notifications: [{ id: makeId(), message, createdAt: now(), read: false }, ...database.notifications] };
}

export const coinService = {
  transfer(database: Database, fromId: string, toId: string, amount: number, note = ""): Database {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error("Coin miqdori musbat butun son bo‘lishi kerak.");
    if (fromId === toId) throw new Error("O‘zingizga coin yubora olmaysiz.");
    const from = database.students.find((student) => student.id === fromId);
    const to = database.students.find((student) => student.id === toId);
    if (!from || !to) throw new Error("O‘quvchi topilmadi.");
    if (from.coins < amount) throw new Error("Coin balansingiz yetarli emas.");
    const next = {
      ...database,
      students: database.students.map((student) => student.id === fromId ? { ...student, coins: student.coins - amount } : student.id === toId ? { ...student, coins: student.coins + amount } : student),
      transfers: [{ id: makeId(), fromStudentId: fromId, toStudentId: toId, amount, note, createdAt: now() }, ...database.transfers],
    };
    return notify(next, `${from.name} ${to.name}ga ${amount} coin yubordi.`);
  },
  buyGift(database: Database, studentId: string, giftId: string, recipientId = studentId): Database {
    const student = database.students.find((item) => item.id === studentId);
    const recipient = database.students.find((item) => item.id === recipientId);
    const gift = database.gifts.find((item) => item.id === giftId);
    if (!student || !recipient || !gift) throw new Error("O‘quvchi yoki sovg‘a topilmadi.");
    if (!Number.isInteger(gift.price) || gift.price <= 0 || student.coins < gift.price) throw new Error("Coin balansingiz sovg‘a uchun yetarli emas.");
    const delivery: GiftDelivery = { id: makeId(), giftId, fromStudentId: studentId, toStudentId: recipientId, redeemed: false, createdAt: now() };
    const next = {
      ...database,
      students: database.students.map((item) => item.id === studentId ? { ...item, coins: item.coins - gift.price } : item),
      giftDeliveries: [delivery, ...database.giftDeliveries],
    };
    return notify(next, `${student.name} ${recipientId === studentId ? "o‘zi uchun" : `${recipient.name}ga`} ${gift.name} sovg‘asini oldi.`);
  },
  redeemGift(database: Database, deliveryId: string): Database {
    const delivery = database.giftDeliveries.find((item) => item.id === deliveryId);
    if (!delivery) throw new Error("Sovg‘a topilmadi.");
    if (delivery.redeemed) throw new Error("Bu sovg‘a avval coinga almashtirilgan.");
    const gift = database.gifts.find((item) => item.id === delivery.giftId);
    const recipient = database.students.find((item) => item.id === delivery.toStudentId);
    if (!gift || !recipient) throw new Error("Sovg‘a yoki qabul qiluvchi topilmadi.");
    return notify({
      ...database,
      students: database.students.map((item) => item.id === recipient.id ? { ...item, coins: item.coins + gift.price } : item),
      giftDeliveries: database.giftDeliveries.map((item) => item.id === deliveryId ? { ...item, redeemed: true } : item),
    }, `${recipient.name} ${gift.name} sovg‘asini ${gift.price} coinga almashtirdi.`);
  },
};

export function newId() { return makeId(); }
