"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Award, Bell, BookOpen, Check,
  Coins, Download, Gift, GraduationCap, LayoutDashboard, LogOut,
  Menu, Moon, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Sun, Trash2,
  Users, X, Upload, UserRound, CalendarCheck, Pencil, Send, ShoppingBag, RotateCcw,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { coinService, createDemoData, isDatabase, newId, readDatabase, writeDatabase } from "@/lib/service";
import type { Database, DemoUser, Gift as RewardGift, Role, Section, Student, Teacher, StudyGroup } from "@/lib/types";

const roleUsers: DemoUser[] = [
  { role: "admin", id: "admin", name: "Admin Demo", description: "Administrator" },
  { role: "teacher", id: "t1", name: "Madina Karimova", description: "O‘qituvchi" },
  { role: "student", id: "s1", name: "Sardor Qodirov", description: "O‘quvchi" },
];
const ACCOUNTS_KEY = "edunova-demo-accounts-v1";

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { id: "overview", label: "Bosh sahifa", icon: LayoutDashboard, roles: ["admin", "teacher", "student"] },
  { id: "students", label: "O‘quvchilar", icon: Users, roles: ["admin", "teacher"] },
  { id: "teachers", label: "O‘qituvchilar", icon: GraduationCap, roles: ["admin"] },
  { id: "groups", label: "Guruhlar", icon: BookOpen, roles: ["admin", "teacher"] },
  { id: "attendance", label: "Davomat", icon: CalendarCheck, roles: ["admin", "teacher"] },
  { id: "rewards", label: "Coin va sovg‘alar", icon: Gift, roles: ["admin", "teacher", "student"] },
  { id: "activity", label: "Faoliyat tarixi", icon: Activity, roles: ["admin", "teacher", "student"] },
  { id: "settings", label: "Sozlamalar", icon: Settings, roles: ["admin"] },
];

type Entity = "student" | "teacher" | "group" | "gift";
type ModalState = { entity: Entity; item?: Student | Teacher | StudyGroup | RewardGift } | null;
type Toast = { message: string; type: "success" | "error" } | null;

const cardClass = "surface shadow-breathe rounded-2xl";
const inputClass = "w-full rounded-xl border border-[var(--line)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-violet-200/40";
const buttonClass = "glow-shadow glow-shadow-pulse interactive inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const secondaryClass = "interactive inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-medium hover:bg-[var(--background)]";

function initials(name: string) { return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase(); }
function prettyDate(date: string) { return new Date(date).toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }); }
function localToday() { return new Date().toISOString().slice(0, 10); }

export default function EduNovaApp() {
  const [database, setDatabase] = useState<Database | null>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<DemoUser[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("edunova-theme");
      setDark(savedTheme === "dark");
      setDatabase(readDatabase());
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Ma’lumotlarni yuklab bo‘lmadi." });
      setDatabase(createDemoData());
    }
    try {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed) || !parsed.every(isDemoUser)) {
          throw new Error("Ro‘yxatdan o‘tgan demo hisoblar ma’lumoti yaroqsiz.");
        }
        setRegisteredUsers(parsed);
      }
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Demo hisoblarni o‘qib bo‘lmadi." });
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateData(next: Database) {
    try {
      writeDatabase(next);
      setDatabase(next);
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Ma’lumotlarni saqlab bo‘lmadi." });
      throw error;
    }
  }

  function registerDemoUser(name: string, role: Role) {
    if (!database) return;
    const id = newId();
    const account: DemoUser = { id, role, name: name.trim(), description: `${roleName(role)} · lokal demo hisobi` };
    const accounts = [...registeredUsers, account];
    const next = role === "student"
      ? { ...database, students: [...database.students, { id, name: account.name, email: "", groupId: "", coins: 100, points: 0, joinedAt: localToday() }] }
      : role === "teacher"
        ? { ...database, teachers: [...database.teachers, { id, name: account.name, email: "", subject: "Umumiy", groupIds: [] }] }
        : database;
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      updateData(next);
      setRegisteredUsers(accounts);
      setUser(account);
      setToast({ type: "success", message: "Demo hisob yaratildi. Bu haqiqiy server ro‘yxatdan o‘tishi emas." });
    } catch (error) {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(registeredUsers));
      setToast({ type: "error", message: error instanceof Error ? error.message : "Demo hisob yaratilmadi." });
    }
  }

  function runService(action: () => Database, success = "Amal muvaffaqiyatli bajarildi.") {
    try { updateData(action()); setToast({ type: "success", message: success }); }
    catch (error) { setToast({ type: "error", message: error instanceof Error ? error.message : "Amal bajarilmadi." }); }
  }

  function persistEntity(entity: Entity, values: Record<string, string>, existing?: Student | Teacher | StudyGroup | RewardGift) {
    if (!database) return;
    const id = existing?.id ?? newId();
    let next: Database;
    if (entity === "student") {
      const groupId = values.groupId || "";
      const points = values.points === undefined ? (existing && "points" in existing ? existing.points : 0) : Number(values.points);
      if (!Number.isInteger(points) || points < 0) {
        setToast({ type: "error", message: "Ball musbat yoki nolga teng butun son bo‘lishi kerak." });
        return;
      }
      const item: Student = { id, name: values.name.trim(), email: values.email.trim(), groupId, coins: existing && "coins" in existing ? existing.coins : 100, points, joinedAt: existing && "joinedAt" in existing ? existing.joinedAt : localToday() };
      const oldGroup = database.groups.find((group) => group.studentIds.includes(id));
      next = {
        ...database,
        students: existing ? database.students.map((student) => student.id === id ? item : student) : [...database.students, item],
        groups: database.groups.map((group) => ({ ...group, studentIds: [...group.studentIds.filter((studentId) => studentId !== id), ...(group.id === groupId ? [id] : [])] })),
        attendance: database.attendance.filter((record) => !oldGroup || record.studentId !== id || record.groupId === groupId),
      };
    } else if (entity === "teacher") {
      const item: Teacher = { id, name: values.name.trim(), email: values.email.trim(), subject: values.subject.trim(), groupIds: existing && "groupIds" in existing ? existing.groupIds : [] };
      next = { ...database, teachers: existing ? database.teachers.map((teacher) => teacher.id === id ? item : teacher) : [...database.teachers, item] };
    } else if (entity === "group") {
      const item: StudyGroup = { id, name: values.name.trim(), course: values.course.trim(), teacherId: values.teacherId, schedule: values.schedule.trim(), studentIds: existing && "studentIds" in existing ? existing.studentIds : [] };
      next = {
        ...database,
        groups: existing ? database.groups.map((group) => group.id === id ? item : group) : [...database.groups, item],
        teachers: database.teachers.map((teacher) => ({
          ...teacher,
          groupIds: [...teacher.groupIds.filter((groupId) => groupId !== id), ...(teacher.id === item.teacherId ? [id] : [])],
        })),
      };
    } else {
      const price = Number(values.price);
      if (!Number.isInteger(price) || price <= 0) {
        setToast({ type: "error", message: "Sovg‘a narxi musbat butun son bo‘lishi kerak." });
        return;
      }
      const item: RewardGift = { id, name: values.name.trim(), emoji: values.emoji.trim() || "🎁", price, description: values.description.trim() };
      next = { ...database, gifts: existing ? database.gifts.map((gift) => gift.id === id ? item : gift) : [...database.gifts, item] };
    }
    updateData(next);
    setModal(null);
    setToast({ type: "success", message: existing ? "Ma’lumotlar yangilandi." : "Yangi ma’lumot qo‘shildi." });
  }

  function deleteEntity(entity: Entity, id: string) {
    if (!database || !window.confirm("Bu ma’lumotni o‘chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo‘lmaydi.")) return;
    let next = database;
    if (entity === "student") {
      next = { ...database, students: database.students.filter((item) => item.id !== id), groups: database.groups.map((group) => ({ ...group, studentIds: group.studentIds.filter((studentId) => studentId !== id) })), attendance: database.attendance.filter((item) => item.studentId !== id), transfers: database.transfers.filter((item) => item.fromStudentId !== id && item.toStudentId !== id), giftDeliveries: database.giftDeliveries.filter((item) => item.fromStudentId !== id && item.toStudentId !== id) };
    } else if (entity === "teacher") {
      const affected = database.groups.filter((group) => group.teacherId === id);
      if (affected.length && !window.confirm("Bu o‘qituvchiga biriktirilgan guruhlar hamda ularning davomat yozuvlari o‘chiriladi. Davom etasizmi?")) return;
      const groupIds = new Set(affected.map((group) => group.id));
      next = { ...database, teachers: database.teachers.filter((item) => item.id !== id), groups: database.groups.filter((item) => item.teacherId !== id), attendance: database.attendance.filter((item) => !groupIds.has(item.groupId)) };
    } else if (entity === "group") {
      next = { ...database, groups: database.groups.filter((item) => item.id !== id), attendance: database.attendance.filter((item) => item.groupId !== id), students: database.students.map((student) => student.groupId === id ? { ...student, groupId: "" } : student), teachers: database.teachers.map((teacher) => ({ ...teacher, groupIds: teacher.groupIds.filter((groupId) => groupId !== id) })) };
    } else {
      if (database.giftDeliveries.some((item) => item.giftId === id)) {
        setToast({ type: "error", message: "Tarixda ishlatilgan sovg‘ani o‘chirib bo‘lmaydi. Uni tahrirlashingiz mumkin." });
        return;
      }
      next = { ...database, gifts: database.gifts.filter((item) => item.id !== id) };
    }
    updateData(next);
    setToast({ type: "success", message: "Ma’lumot o‘chirildi." });
  }

  function saveAttendance(studentId: string, groupId: string, status: "Bor" | "Yo‘q" | "Kechikdi") {
    if (!database) return;
    const existing = database.attendance.find((item) => item.studentId === studentId && item.groupId === groupId && item.date === localToday());
    const record = { id: existing?.id ?? newId(), studentId, groupId, date: localToday(), status };
    updateData({ ...database, attendance: existing ? database.attendance.map((item) => item.id === record.id ? record : item) : [record, ...database.attendance] });
    setToast({ type: "success", message: "Davomat saqlandi." });
  }

  function exportData() {
    if (!database) return;
    const blob = new Blob([JSON.stringify(database, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `edunova-demo-${localToday()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setToast({ type: "success", message: "JSON fayl yuklab olindi." });
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isDatabase(parsed)) throw new Error("JSON fayli EduNova ma’lumotlar formatiga mos emas.");
      if (!window.confirm("Import qilish joriy brauzerdagi barcha ma’lumotlarni almashtiradi. Davom etasizmi?")) return;
      updateData(parsed);
      setToast({ type: "success", message: "Ma’lumotlar import qilindi." });
    } catch (error) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Faylni import qilib bo‘lmadi." });
    } finally { event.target.value = ""; }
  }

  function resetData() {
    if (!window.confirm("Barcha ma’lumotlar demo holatiga qaytariladi. Bu amalni tasdiqlaysizmi?")) return;
    updateData(createDemoData());
    setToast({ type: "success", message: "Demo ma’lumotlari qayta yaratildi." });
  }

  function switchSection(next: Section) { setSection(next); setSearch(""); setSidebarOpen(false); }

  if (isLoading || !database) return <div className="grid min-h-screen place-items-center"><div className="text-center"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /><p className="muted text-sm">EduNova yuklanmoqda...</p></div></div>;

  if (!user) return <LoginScreen onLogin={setUser} onRegister={registerDemoUser} registeredUsers={registeredUsers} />;
  const currentStudent = user.role === "student" ? database.students.find((item) => item.id === user.id) : null;
  const myStudents = user.role === "teacher" ? database.students.filter((student) => database.groups.some((group) => user.id === group.teacherId && group.id === student.groupId)) : database.students;
  const shownStudents = user.role === "student" ? (currentStudent ? [currentStudent] : []) : myStudents;
  const unread = database.notifications.filter((notification) => !notification.read).length;

  return (
    <div className={dark ? "dark min-h-screen" : "min-h-screen"}>
      <div className="app-background min-h-screen text-[var(--foreground)]">
        <aside className={`fixed inset-y-0 left-0 z-40 flex w-[254px] flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 py-5 shadow-[10px_0_40px_rgba(18,18,28,0.04)] transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-8 flex items-center gap-3 px-2">
            <motion.div whileHover={{ rotate: -7, scale: 1.08 }} transition={{ type: "spring", stiffness: 380, damping: 16 }} className="glow-shadow grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-700 text-white"><GraduationCap size={23} /></motion.div>
            <div><div className="text-[17px] font-extrabold tracking-tight">Edu<span className="text-violet-500">Nova</span></div><div className="muted text-[10px] font-semibold uppercase tracking-[.17em]">Ta’lim platformasi</div></div>
            <button className="ml-auto rounded-lg p-1 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Menyuni yopish"><X size={18} /></button>
          </div>
          <div className="soft-bg mb-6 rounded-xl px-3 py-3">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300"><ShieldCheck size={13} /> Demo rejim</div>
            <p className="muted text-[11px] leading-relaxed">Lokal demo — bu server himoyasidagi tizim emas.</p>
          </div>
          <div className="muted px-3 pb-2 text-[10px] font-bold uppercase tracking-[.15em]">Asosiy menyu</div>
          <nav className="space-y-1">
            {navItems.filter((item) => item.roles.includes(user.role)).map(({ id, label, icon: Icon }) => (
              <motion.button key={id} whileHover={{ x: 3 }} whileTap={{ scale: .985 }} onClick={() => switchSection(id)} className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${section === id ? "bg-violet-50 text-violet-700 shadow-[inset_0_0_0_1px_rgba(93,80,231,0.1)] dark:bg-violet-950/60 dark:text-violet-200" : "muted hover:bg-[var(--background)] hover:text-[var(--foreground)]"}`}>
                <Icon size={18} strokeWidth={section === id ? 2.3 : 1.8} />{label}{id === "activity" && unread > 0 && <span className="ml-auto rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>}
              </motion.button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-4 text-white">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles size={16} /> Yutuqlaringizni kuzating</div>
            <p className="mb-3 text-[11px] leading-relaxed text-white/75">Har bir dars — yangi imkoniyat. Davom eting!</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-white" /></div>
            <div className="mt-1.5 text-right text-[10px] text-white/70">Hafta maqsadi · 75%</div>
          </div>
        </aside>
        {sidebarOpen && <button aria-label="Menyuni yopish" className="fixed inset-0 z-30 bg-black/35 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <main className="min-h-screen lg:ml-[254px]">
          <header className="surface-glass sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-[var(--line)] px-4 shadow-[0_5px_25px_rgba(20,20,32,0.035)] sm:px-7">
            <button className="rounded-xl p-2 hover:bg-[var(--background)] lg:hidden" aria-label="Menyuni ochish" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold">{sectionTitle(section)}</div>
              <div className="muted hidden text-[11px] sm:block">Xush kelibsiz, {user.name.split(" ")[0]}! Bugun yangi yutuqlar kuni ✨</div>
            </div>
            {["students", "teachers", "groups", "activity"].includes(section) && <label className="relative hidden w-52 md:block"><Search className="muted absolute left-3 top-2.5" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} py-2 pl-9`} placeholder="Qidirish..." /></label>}
            <button onClick={() => { setDark((value) => { localStorage.setItem("edunova-theme", value ? "light" : "dark"); return !value; }); }} className="rounded-xl border border-[var(--line)] p-2.5 transition hover:bg-[var(--background)]" aria-label={dark ? "Yorug‘ rejim" : "Qorong‘i rejim"}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
            <button onClick={() => { setSection("activity"); updateData({ ...database, notifications: database.notifications.map((item) => ({ ...item, read: true })) }); }} className="relative rounded-xl border border-[var(--line)] p-2.5 transition hover:bg-[var(--background)]" aria-label="Bildirishnomalar"><Bell size={17} />{unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[var(--surface)]" />}</button>
            <div className="hidden h-8 w-px bg-[var(--line)] sm:block" />
            <button onClick={() => { setUser(null); setSection("overview"); }} title="Demo hisobdan chiqish" className="flex items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-[var(--background)]">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-200">{initials(user.name)}</div>
              <div className="hidden min-w-[90px] sm:block"><div className="text-xs font-semibold">{user.name}</div><div className="muted text-[10px]">{roleName(user.role)} · demo</div></div>
              <LogOut className="muted hidden sm:block" size={15} />
            </button>
          </header>

          <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8">
            <AnimatePresence mode="wait">
              <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }} className="page-enter">
                {section === "overview" && <Overview database={database} user={user} students={shownStudents} setSection={switchSection} />}
                {section === "students" && <StudentsPage database={database} students={myStudents} search={search} onAdd={() => setModal({ entity: "student" })} onEdit={(item) => setModal({ entity: "student", item })} onDelete={(id) => deleteEntity("student", id)} />}
                {section === "teachers" && <TeachersPage database={database} search={search} onAdd={() => setModal({ entity: "teacher" })} onEdit={(item) => setModal({ entity: "teacher", item })} onDelete={(id) => deleteEntity("teacher", id)} />}
                {section === "groups" && <GroupsPage database={database} user={user} search={search} onAdd={() => setModal({ entity: "group" })} onEdit={(item) => setModal({ entity: "group", item })} onDelete={(id) => deleteEntity("group", id)} />}
                {section === "attendance" && <AttendancePage database={database} user={user} onSave={saveAttendance} onDelete={(id) => { if (window.confirm("Ushbu davomat yozuvini o‘chirishni tasdiqlaysizmi?")) { updateData({ ...database, attendance: database.attendance.filter((item) => item.id !== id) }); setToast({ type: "success", message: "Davomat yozuvi o‘chirildi." }); } }} />}
                {section === "rewards" && <RewardsPage database={database} user={user} runService={runService} onAddGift={() => setModal({ entity: "gift" })} onEditGift={(item) => setModal({ entity: "gift", item })} onDeleteGift={(id) => deleteEntity("gift", id)} />}
                {section === "activity" && <ActivityPage database={database} search={search} />}
                {section === "settings" && <SettingsPage onExport={exportData} onImport={() => importRef.current?.click()} onReset={resetData} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {modal && <EntityModal key={`${modal.entity}-${modal.item?.id ?? "new"}`} state={modal} database={database} onClose={() => setModal(null)} onSave={persistEntity} />}
        <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={importData} />
        <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${toast.type === "error" ? "bg-rose-600" : "bg-slate-900 dark:bg-slate-700"}`}><span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">{toast.type === "error" ? <X size={13} /> : <Check size={13} />}</span>{toast.message}</motion.div>}</AnimatePresence>
      </div>
    </div>
  );
}

function sectionTitle(section: Section) { return navItems.find((item) => item.id === section)?.label ?? "EduNova"; }
function roleName(role: Role) { return role === "admin" ? "Administrator" : role === "teacher" ? "O‘qituvchi" : "O‘quvchi"; }
function isDemoUser(value: unknown): value is DemoUser {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<DemoUser>;
  return (account.role === "admin" || account.role === "teacher" || account.role === "student")
    && typeof account.id === "string"
    && typeof account.name === "string"
    && typeof account.description === "string";
}

function LoginScreen({ onLogin, onRegister, registeredUsers }: { onLogin: (user: DemoUser) => void; onRegister: (name: string, role: Role) => void; registeredUsers: DemoUser[] }) {
  const [selected, setSelected] = useState(roleUsers[0].id);
  const [tab, setTab] = useState<"demo" | "register">("demo");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState("");
  const accounts = [...roleUsers, ...registeredUsers];
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--background)] px-4 py-10 text-[var(--foreground)]">
      <div className="ambient-orb absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet-300/30 blur-3xl" /><div className="ambient-orb-slow absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} relative w-full max-w-[450px] p-6 sm:p-8`}>
        <div className="mb-6 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white"><GraduationCap size={25} /></div><div><div className="text-xl font-extrabold">Edu<span className="text-violet-500">Nova</span></div><div className="muted text-xs">Ta’lim sari birga</div></div></div>
        <div className="mb-5"><h1 className="text-2xl font-bold">Xush kelibsiz! 👋</h1><p className="muted mt-1.5 text-sm">Demo hisobdan kiring yoki lokal profil yarating.</p></div>
        <div className="soft-bg mb-5 flex gap-2.5 rounded-xl p-3 text-xs leading-relaxed text-violet-800 dark:text-violet-200"><ShieldCheck className="mt-0.5 shrink-0" size={16} /><span><b>Demo rejim:</b> hisoblar faqat ushbu brauzerda saqlanadi. Rol tanlovi haqiqiy autentifikatsiya yoki serverdagi administrator huquqini bermaydi.</span></div>
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-[var(--background)] p-1"><button onClick={() => setTab("demo")} className={`rounded-lg py-2.5 text-xs font-semibold transition ${tab === "demo" ? "bg-[var(--surface)] shadow-sm" : "muted"}`}>Demo hisoblar</button><button onClick={() => setTab("register")} className={`rounded-lg py-2.5 text-xs font-semibold transition ${tab === "register" ? "bg-[var(--surface)] shadow-sm" : "muted"}`}>Ro‘yxatdan o‘tish</button></div>
        {tab === "demo" ? <>
          <label className="mb-2 block text-xs font-semibold">Demo hisobni tanlang</label>
          <div className="mb-5 max-h-64 space-y-2 overflow-y-auto">
            {accounts.map((account) => <button key={account.id} onClick={() => setSelected(account.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected === account.id ? "border-violet-400 bg-violet-50/70 dark:bg-violet-950/30" : "border-[var(--line)] hover:bg-[var(--background)]"}`}><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] text-violet-600"><UserRound size={19} /></div><span className="flex-1"><span className="block text-sm font-semibold">{account.name}</span><span className="muted text-xs">{account.description}</span></span>{selected === account.id && <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-600 text-white"><Check size={12} /></span>}</button>)}
          </div>
          <button className={`${buttonClass} w-full py-3`} onClick={() => onLogin(accounts.find((item) => item.id === selected) ?? roleUsers[0])}>Demo sifatida davom etish <ArrowUpRight size={16} /></button>
        </> : <form className="space-y-3.5" onSubmit={(event) => { event.preventDefault(); const fullName = name.trim().replace(/\s+/g, " "); if (fullName.split(" ").length < 2) { setError("Ism va familiyangizni kiriting."); return; } setError(""); onRegister(fullName, role); }}>
          <label className="block text-xs font-semibold">Ism va familiya<input className={`${inputClass} mt-1.5`} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan, Ali Valiyev" required /></label>
          <label className="block text-xs font-semibold">Rolni tanlang<select className={`${inputClass} mt-1.5`} value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="student">O‘quvchi</option><option value="teacher">O‘qituvchi</option><option value="admin">Administrator (demo)</option></select></label>
          {error && <p role="alert" className="text-xs font-medium text-rose-600">{error}</p>}
          <button className={`${buttonClass} w-full py-3`}>Demo sifatida ro‘yxatdan o‘tish <ArrowUpRight size={16} /></button>
          <p className="muted text-center text-[11px]">Bu lokal demo profil. Haqiqiy server hisobi yoki administrator vakolati yaratilmaydi.</p>
        </form>}
        <p className="muted mt-4 text-center text-[11px]">Ma’lumotlar faqat ushbu brauzerda saqlanadi.</p>
      </motion.div>
      <div className="muted absolute bottom-4 text-center text-[10px]">© 2026 EduNova · Lokal demo versiya</div>
    </div>
  );
}

function Overview({ database, user, students, setSection }: { database: Database; user: DemoUser; students: Student[]; setSection: (section: Section) => void }) {
  const student = user.role === "student" ? database.students.find((item) => item.id === user.id) : null;
  const attendCount = database.attendance.filter((item) => item.date === localToday() && (user.role !== "teacher" || database.groups.some((group) => group.id === item.groupId && group.teacherId === user.id))).length;
  const cardStats = user.role === "student"
    ? [{ label: "Coin balansim", value: student?.coins ?? 0, icon: Coins, color: "text-amber-500", change: "Sovg‘alarga almashtiring" }, { label: "Jami ballarim", value: student?.points ?? 0, icon: Award, color: "text-violet-500", change: "O‘quv faolligingiz" }, { label: "Guruhim", value: database.groups.find((group) => group.id === student?.groupId)?.name ?? "—", icon: BookOpen, color: "text-blue-500", change: "Biriktirilgan guruh" }, { label: "Sovg‘alarim", value: database.giftDeliveries.filter((item) => item.toStudentId === user.id && !item.redeemed).length, icon: Gift, color: "text-pink-500", change: "Almashtirish mumkin" }]
    : [{ label: "Jami o‘quvchilar", value: user.role === "teacher" ? students.length : database.students.length, icon: Users, color: "text-violet-500", change: user.role === "teacher" ? "Sizning guruhlaringiz" : "+12% o‘tgan oyga nisbatan" }, { label: "Faol guruhlar", value: user.role === "teacher" ? database.groups.filter((group) => group.teacherId === user.id).length : database.groups.length, icon: BookOpen, color: "text-blue-500", change: "Darslar davom etmoqda" }, { label: "Bugungi davomat", value: attendCount, icon: CalendarCheck, color: "text-emerald-500", change: "Bugungi qaydlar" }, { label: "O‘qituvchilar", value: user.role === "teacher" ? 1 : database.teachers.length, icon: GraduationCap, color: "text-amber-500", change: "Tajribali mutaxassislar" }];
  const topStudents = [...students].sort((a, b) => b.points - a.points).slice(0, 5);
  const activity = [...database.transfers.map((item) => ({ id: item.id, message: `${database.students.find((student) => student.id === item.fromStudentId)?.name ?? "O‘quvchi"} → ${database.students.find((student) => student.id === item.toStudentId)?.name ?? "O‘quvchi"}`, detail: `${item.amount} coin yuborildi`, date: item.createdAt, icon: ArrowLeftRight, color: "bg-blue-50 text-blue-600" })), ...database.giftDeliveries.map((item) => ({ id: item.id, message: `${database.students.find((student) => student.id === item.fromStudentId)?.name ?? "O‘quvchi"} sovg‘a oldi`, detail: database.gifts.find((gift) => gift.id === item.giftId)?.name ?? "Sovg‘a", date: item.createdAt, icon: Gift, color: "bg-pink-50 text-pink-600" }))].slice(0, 5);
  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-1 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-300"><Sparkles size={14} /> {user.role === "student" ? "O‘QUVCHI KABINETI" : "BUGUNGI KO‘RINISH"}</div><h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Salom, {user.name.split(" ")[0]}! 👋</h1><p className="muted mt-1 text-sm">{new Date().toLocaleDateString("uz-UZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div><button onClick={() => setSection(user.role === "student" ? "rewards" : "attendance")} className={buttonClass}>{user.role === "student" ? <><Gift size={16} /> Sovg‘alarni ko‘rish</> : <><CalendarCheck size={16} /> Davomatni belgilash</>}</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cardStats.map(({ label, value, icon: Icon, color, change }, index) => <motion.div key={label} initial={{ opacity: 0, y: 16, scale: .975 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -5, scale: 1.015 }} transition={{ delay: index * .075, duration: .32, type: "spring", stiffness: 250, damping: 22 }} className={`${cardClass} group relative overflow-hidden p-5`}><div className="pointer-events-none absolute -right-8 -top-9 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl transition group-hover:bg-violet-400/25" /><div className="relative mb-5 flex items-start justify-between"><div className="muted text-[13px] font-medium">{label}</div><div className={`grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] ${color}`}><Icon size={19} /></div></div><div className="relative text-[27px] font-extrabold tracking-tight">{value}</div><div className="muted relative mt-1.5 text-[11px]">{change}</div></motion.div>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className={`${cardClass} p-5 sm:p-6`}><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Eng faol o‘quvchilar</h2><p className="muted mt-1 text-xs">Ballar bo‘yicha reyting</p></div><button onClick={() => setSection("students")} className="text-xs font-semibold text-violet-600">Barchasi <ArrowUpRight className="ml-1 inline" size={14} /></button></div>
        <div className="space-y-4">{topStudents.map((item, index) => <div key={item.id} className="flex items-center gap-3"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold ${index === 0 ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"}`}>{index === 0 ? "🏆" : initials(item.name)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.name}</div><div className="muted text-[11px]">{database.groups.find((group) => group.id === item.groupId)?.name ?? "Guruhsiz"}</div></div><div className="text-right"><div className="text-sm font-bold">{item.points} ball</div><div className="muted flex items-center justify-end gap-1 text-[10px]"><Coins size={11} className="text-amber-500" />{item.coins}</div></div></div>)}</div>
      </section>
      <section className={`${cardClass} p-5 sm:p-6`}><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">So‘nggi faollik</h2><p className="muted mt-1 text-xs">Coin va sovg‘a amallari</p></div><button onClick={() => setSection("activity")} className="rounded-lg p-1.5 hover:bg-[var(--background)]"><MoreHorizontal size={19} /></button></div>
        {activity.length ? <div className="space-y-4">{activity.map((item) => <div key={item.id} className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${item.color}`}><item.icon size={16} /></div><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{item.message}</div><div className="muted mt-0.5 text-[10px]">{item.detail}</div></div><div className="muted text-[10px]">{prettyDate(item.date)}</div></div>)}</div> : <EmptyState text="Hozircha yangi faollik yo‘q" icon={Activity} />}</section>
    </div>
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 p-5 text-white sm:p-6"><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-1 flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> Haftaning ilhomi</div><p className="max-w-xl text-sm text-white/80">“Buyuk natijalar — har kuni qilinadigan kichik qadamlar yig‘indisi.” Bugun o‘rganing, ertaga porlang!</p></div><div className="text-4xl">🚀</div></div></section>
  </div>;
}

function StudentsPage({ database, students, search, onAdd, onEdit, onDelete }: { database: Database; students: Student[]; search: string; onAdd: () => void; onEdit: (item: Student) => void; onDelete: (id: string) => void }) {
  const rows = students.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><PageHeading eyebrow="TA’LIM JARAYONI" title="O‘quvchilar" subtitle={`${students.length} nafar o‘quvchi ro‘yxatda`} action={<button onClick={onAdd} className={buttonClass}><Plus size={17} /> O‘quvchi qo‘shish</button>} />
    <div className={`${cardClass} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-[var(--line)] bg-[var(--background)]/60 text-[10px] font-bold uppercase tracking-wider muted"><th className="px-5 py-3.5">O‘quvchi</th><th className="px-4 py-3.5">Guruh</th><th className="px-4 py-3.5">Ball</th><th className="px-4 py-3.5">Coin balansi</th><th className="px-4 py-3.5">Qo‘shilgan sana</th><th className="px-4 py-3.5">Amallar</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--background)]/50"><td className="px-5 py-3.5"><PersonCell name={item.name} detail={item.email} /></td><td className="px-4 py-3.5 text-xs">{database.groups.find((group) => group.id === item.groupId)?.name ?? <span className="muted">Guruhsiz</span>}</td><td className="px-4 py-3.5"><span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200">{item.points} ball</span></td><td className="px-4 py-3.5"><span className="flex items-center gap-1.5 text-xs font-semibold"><Coins size={14} className="text-amber-500" />{item.coins}</span></td><td className="muted px-4 py-3.5 text-xs">{prettyDate(item.joinedAt)}</td><td className="px-4 py-3.5"><RowActions onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} /></td></tr>)}</tbody></table>{rows.length === 0 && <EmptyState text="O‘quvchilar topilmadi" icon={Users} />}</div></div></div>;
}

function TeachersPage({ database, search, onAdd, onEdit, onDelete }: { database: Database; search: string; onAdd: () => void; onEdit: (item: Teacher) => void; onDelete: (id: string) => void }) {
  const rows = database.teachers.filter((item) => `${item.name} ${item.email} ${item.subject}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><PageHeading eyebrow="JAMOA BOSHQARUVI" title="O‘qituvchilar" subtitle={`${database.teachers.length} nafar o‘qituvchi`} action={<button onClick={onAdd} className={buttonClass}><Plus size={17} /> O‘qituvchi qo‘shish</button>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((teacher, index) => <motion.div key={teacher.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className={`${cardClass} p-5`}><div className="mb-4 flex items-start justify-between"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 text-sm font-bold text-violet-700 dark:from-violet-950 dark:to-blue-950 dark:text-violet-200">{initials(teacher.name)}</div><RowActions onEdit={() => onEdit(teacher)} onDelete={() => onDelete(teacher.id)} /></div><h3 className="font-bold">{teacher.name}</h3><div className="muted mt-1 text-xs">{teacher.email}</div><div className="my-4 h-px bg-[var(--line)]" /><div className="flex items-center justify-between"><span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">{teacher.subject}</span><span className="muted flex items-center gap-1.5 text-xs"><BookOpen size={14} />{database.groups.filter((group) => group.teacherId === teacher.id).length} guruh</span></div></motion.div>)}</div>{rows.length === 0 && <div className={cardClass}><EmptyState text="O‘qituvchilar topilmadi" icon={GraduationCap} /></div>}</div>;
}

function GroupsPage({ database, user, search, onAdd, onEdit, onDelete }: { database: Database; user: DemoUser; search: string; onAdd: () => void; onEdit: (item: StudyGroup) => void; onDelete: (id: string) => void }) {
  const rows = database.groups.filter((item) => (user.role !== "teacher" || item.teacherId === user.id) && `${item.name} ${item.course}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5"><PageHeading eyebrow="GURUH VA KURSLAR" title="O‘quv guruhlari" subtitle={`${rows.length} ta faol guruh`} action={user.role === "admin" ? <button onClick={onAdd} className={buttonClass}><Plus size={17} /> Guruh yaratish</button> : undefined} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{rows.map((group, index) => { const teacher = database.teachers.find((item) => item.id === group.teacherId); return <motion.div key={group.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className={`${cardClass} p-5`}><div className="mb-4 flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-200"><BookOpen size={19} /></div>{user.role === "admin" && <RowActions onEdit={() => onEdit(group)} onDelete={() => onDelete(group.id)} />}</div><h3 className="font-bold">{group.name}</h3><div className="muted mt-1 text-xs">{group.course}</div><div className="my-4 space-y-2.5 border-y border-[var(--line)] py-3 text-xs"><div className="flex items-center justify-between"><span className="muted">O‘qituvchi</span><span className="font-medium">{teacher?.name ?? "Biriktirilmagan"}</span></div><div className="flex items-center justify-between"><span className="muted">Dars jadvali</span><span className="font-medium">{group.schedule || "—"}</span></div></div><div className="flex items-center gap-2 text-xs"><Users size={15} className="text-violet-500" /><b>{group.studentIds.length} o‘quvchi</b><span className="muted">guruhda</span></div></motion.div>; })}</div>{rows.length === 0 && <div className={cardClass}><EmptyState text="Guruhlar topilmadi" icon={BookOpen} /></div>}</div>;
}

function AttendancePage({ database, user, onSave, onDelete }: { database: Database; user: DemoUser; onSave: (studentId: string, groupId: string, status: "Bor" | "Yo‘q" | "Kechikdi") => void; onDelete: (id: string) => void }) {
  const groups = database.groups.filter((group) => user.role !== "teacher" || group.teacherId === user.id);
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const selectedGroup = groups.find((group) => group.id === groupId) ?? groups[0];
  const students = selectedGroup ? database.students.filter((student) => student.groupId === selectedGroup.id) : [];
  return <div className="space-y-5"><PageHeading eyebrow="DARS NAZORATI" title="Davomat" subtitle="Bugungi dars uchun o‘quvchilar holatini belgilang." action={<div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3.5 py-2.5 text-xs font-semibold">{new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" })}</div>} />
    <div className={`${cardClass} p-4 sm:p-5`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><label className="text-xs font-semibold">Guruhni tanlang<select className={`${inputClass} mt-1.5 min-w-56`} value={selectedGroup?.id ?? ""} onChange={(event) => setGroupId(event.target.value)}>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>{selectedGroup && <span className="soft-bg rounded-lg px-3 py-2 text-xs font-medium text-violet-700 dark:text-violet-200">{students.length} nafar o‘quvchi</span>}</div>
      {students.length ? <div className="space-y-2">{students.map((student) => { const record = database.attendance.find((item) => item.studentId === student.id && item.groupId === selectedGroup.id && item.date === localToday()); return <div key={student.id} className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--line)] p-3 sm:flex-row sm:items-center"><PersonCell name={student.name} detail={student.email} /><div className="flex gap-1.5">{(["Bor", "Kechikdi", "Yo‘q"] as const).map((status) => <button key={status} onClick={() => onSave(student.id, selectedGroup.id, status)} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${record?.status === status ? status === "Bor" ? "bg-emerald-500 text-white" : status === "Yo‘q" ? "bg-rose-500 text-white" : "bg-amber-500 text-white" : "bg-[var(--background)] muted hover:text-[var(--foreground)]"}`}>{status}</button>)}{record && <button onClick={() => onDelete(record.id)} title="Davomatni o‘chirish" className="rounded-lg bg-rose-50 px-2.5 text-rose-600 dark:bg-rose-950"><X size={14} /></button>}</div></div>; })}</div> : <EmptyState text="Bu guruhda o‘quvchilar yo‘q" icon={CalendarCheck} />}</div>
    {selectedGroup && <div className={`${cardClass} flex flex-wrap gap-x-6 gap-y-2 p-4 text-xs`}><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Bor: {database.attendance.filter((item) => item.groupId === selectedGroup.id && item.date === localToday() && item.status === "Bor").length}</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />Kechikdi: {database.attendance.filter((item) => item.groupId === selectedGroup.id && item.date === localToday() && item.status === "Kechikdi").length}</span><span className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />Yo‘q: {database.attendance.filter((item) => item.groupId === selectedGroup.id && item.date === localToday() && item.status === "Yo‘q").length}</span></div>}</div>;
}

function RewardsPage({ database, user, runService, onAddGift, onEditGift, onDeleteGift }: { database: Database; user: DemoUser; runService: (action: () => Database, success?: string) => void; onAddGift: () => void; onEditGift: (gift: RewardGift) => void; onDeleteGift: (id: string) => void }) {
  const current = user.role === "student" ? database.students.find((item) => item.id === user.id) : null;
  const [recipient, setRecipient] = useState("");
  const [giftRecipient, setGiftRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const incoming = database.giftDeliveries.filter((item) => item.toStudentId === current?.id && !item.redeemed);
  return <div className="space-y-5"><PageHeading eyebrow="MUKOFOTLAR MARKAZI" title="Coin va sovg‘alar" subtitle="Faollikni rag‘batlantiring va yaqinlaringizga quvonch ulashing." action={current ? <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-200"><Coins size={17} />{current.coins} coin</div> : undefined} />
    {current && <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><section className={`${cardClass} p-5`}><div className="mb-4 flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-200"><Send size={16} /></div><div><h2 className="text-sm font-bold">Do‘stga coin yuborish</h2><p className="muted text-[11px]">Balansingizdan coin o‘tkazing</p></div></div><form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); if (!recipient || !amount) return; runService(() => coinService.transfer(database, current.id, recipient, Number(amount), note), "Coin muvaffaqiyatli yuborildi."); setAmount(""); setNote(""); }}><label className="text-xs font-medium">Qabul qiluvchi<select className={`${inputClass} mt-1.5`} value={recipient} onChange={(event) => setRecipient(event.target.value)} required><option value="">O‘quvchini tanlang</option>{database.students.filter((item) => item.id !== current.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-medium">Coin miqdori<input className={`${inputClass} mt-1.5`} type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Masalan, 25" required /></label><label className="text-xs font-medium sm:col-span-2">Izoh (ixtiyoriy)<input className={`${inputClass} mt-1.5`} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Yaxshi tilak yozing..." /></label><button className={`${buttonClass} sm:col-span-2`}><Send size={15} /> Coin yuborish</button></form></section>
      <section className={`${cardClass} p-5`}><div className="mb-3 flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-pink-50 text-pink-600 dark:bg-pink-950 dark:text-pink-200"><Gift size={17} /></div><div><h2 className="text-sm font-bold">Kelgan sovg‘alar</h2><p className="muted text-[11px]">{incoming.length} ta almashtirish mumkin</p></div></div>{incoming.length ? <div className="space-y-2">{incoming.map((delivery) => { const gift = database.gifts.find((item) => item.id === delivery.giftId); const from = database.students.find((item) => item.id === delivery.fromStudentId); return <div key={delivery.id} className="flex items-center gap-2 rounded-xl bg-[var(--background)] p-3"><span className="text-xl">{gift?.emoji}</span><div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{gift?.name} <span className="muted font-normal">· {from?.name}</span></div><div className="muted text-[10px]">{gift?.price} coin qiymatida</div></div><button onClick={() => runService(() => coinService.redeemGift(database, delivery.id), "Sovg‘a coinlarga almashtirildi.")} className="rounded-lg bg-emerald-500 px-2.5 py-2 text-[10px] font-semibold text-white">Coin qilish</button></div>; })}</div> : <div className="muted py-6 text-center text-xs">Hozircha sovg‘a yo‘q ✨</div>}</section></div>}
    <div><div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Sovg‘alar do‘koni</h2><p className="muted mt-1 text-xs">Coinlaringizni unutilmas sovg‘alarga almashtiring.</p></div>{user.role === "admin" && <button onClick={onAddGift} className={buttonClass}><Plus size={16} /> Sovg‘a qo‘shish</button>}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{database.gifts.map((gift) => <motion.div key={gift.id} whileHover={{ y: -3 }} className={`${cardClass} p-5`}><div className="mb-4 flex items-start justify-between"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 text-3xl dark:from-violet-950 dark:to-pink-950">{gift.emoji}</div>{user.role === "admin" && <RowActions onEdit={() => onEditGift(gift)} onDelete={() => onDeleteGift(gift.id)} />}</div><h3 className="font-bold">{gift.name}</h3><p className="muted mt-1 min-h-8 text-xs">{gift.description}</p><div className="mt-4 flex items-center justify-between"><span className="flex items-center gap-1.5 text-sm font-bold"><Coins size={16} className="text-amber-500" />{gift.price}</span>{current && <button disabled={current.coins < gift.price} onClick={() => { const toId = giftRecipient || current.id; runService(() => coinService.buyGift(database, current.id, gift.id, toId), "Sovg‘a muvaffaqiyatli xarid qilindi."); setGiftRecipient(""); }} className={`${buttonClass} px-3 py-2 text-xs disabled:cursor-not-allowed`}>{giftRecipient ? <><Send size={13} /> Yuborish</> : <><ShoppingBag size={13} /> Xarid</>}</button>}</div>{current && <label className="mt-3 block text-[10px] font-medium muted">Do‘stga sovg‘a yuborish<select className={`${inputClass} mt-1 py-2 text-xs`} value={giftRecipient} onChange={(event) => setGiftRecipient(event.target.value)}><option value="">O‘zim uchun</option>{database.students.filter((item) => item.id !== current.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}</motion.div>)}</div></div>
    <div className={`${cardClass} overflow-hidden`}><div className="border-b border-[var(--line)] p-4"><h2 className="text-sm font-bold">Coin operatsiyalari tarixi</h2><p className="muted mt-1 text-[11px]">Coin yuborish va sovg‘a xaridlari</p></div><div className="divide-y divide-[var(--line)]">{database.transfers.filter((item) => !current || item.fromStudentId === current.id || item.toStudentId === current.id).slice(0, 8).map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3"><div className={`grid h-8 w-8 place-items-center rounded-lg ${item.fromStudentId === current?.id ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>{item.fromStudentId === current?.id ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}</div><div className="flex-1 text-xs"><b>{database.students.find((student) => student.id === (item.fromStudentId === current?.id ? item.toStudentId : item.fromStudentId))?.name ?? "O‘quvchi"}</b><div className="muted mt-0.5">{item.note || "Coin transferi"}</div></div><span className={`text-xs font-bold ${item.fromStudentId === current?.id ? "text-rose-500" : "text-emerald-600"}`}>{item.fromStudentId === current?.id ? "−" : "+"}{item.amount} coin</span></div>)}
      {database.giftDeliveries.filter((item) => !current || item.fromStudentId === current.id || item.toStudentId === current.id).slice(0, 8).map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-pink-50 text-pink-600"><Gift size={15} /></div><div className="flex-1 text-xs"><b>{database.gifts.find((gift) => gift.id === item.giftId)?.name}</b><div className="muted mt-0.5">{item.fromStudentId === item.toStudentId ? "Sovg‘a xaridi" : `${database.students.find((student) => student.id === item.toStudentId)?.name} uchun sovg‘a`}</div></div><span className="muted text-[10px]">{prettyDate(item.createdAt)}</span></div>)}
      {!database.transfers.length && !database.giftDeliveries.length && <div className="muted p-5 text-center text-xs">Hozircha operatsiyalar yo‘q</div>}</div></div>
  </div>;
}

function ActivityPage({ database, search }: { database: Database; search: string }) {
  const query = search.toLowerCase();
  const entries = [
    ...database.notifications.map((item) => ({ id: item.id, type: "Bildirishnoma", message: item.message, detail: "Tizim xabari", date: item.createdAt, color: "bg-violet-50 text-violet-600", icon: Bell })),
    ...database.transfers.map((item) => ({ id: item.id, type: "Coin transferi", message: `${database.students.find((student) => student.id === item.fromStudentId)?.name} → ${database.students.find((student) => student.id === item.toStudentId)?.name}`, detail: `${item.amount} coin · ${item.note || "Coin yuborildi"}`, date: item.createdAt, color: "bg-blue-50 text-blue-600", icon: ArrowLeftRight })),
    ...database.giftDeliveries.map((item) => ({ id: item.id, type: "Sovg‘a", message: `${database.students.find((student) => student.id === item.fromStudentId)?.name} sovg‘a yubordi`, detail: `${database.gifts.find((gift) => gift.id === item.giftId)?.name} → ${database.students.find((student) => student.id === item.toStudentId)?.name}${item.redeemed ? " · coinga almashtirildi" : ""}`, date: item.createdAt, color: "bg-pink-50 text-pink-600", icon: Gift })),
  ].filter((item) => `${item.type} ${item.message} ${item.detail}`.toLowerCase().includes(query)).sort((a, b) => b.date.localeCompare(a.date));
  return <div className="space-y-5"><PageHeading eyebrow="TIZIM XABARLARI" title="Faoliyat tarixi" subtitle="Coin, sovg‘a va bildirishnoma amallari." /><div className={`${cardClass} divide-y divide-[var(--line)]`}>{entries.map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-4 sm:px-5"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.color}`}><item.icon size={17} /></div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.message}</div><div className="muted mt-1 truncate text-xs">{item.detail}</div></div><div className="hidden text-right sm:block"><div className="text-[10px] font-medium">{item.type}</div><div className="muted mt-1 text-[10px]">{prettyDate(item.date)}</div></div><div className="muted text-[10px] sm:hidden">{prettyDate(item.date)}</div></div>)}{entries.length === 0 && <EmptyState text="Faollik tarixi bo‘sh" icon={Activity} />}</div></div>;
}

function SettingsPage({ onExport, onImport, onReset }: { onExport: () => void; onImport: () => void; onReset: () => void }) {
  return <div className="space-y-5"><PageHeading eyebrow="LOKAL DEMO BOSHQARUVI" title="Sozlamalar" subtitle="Ma’lumotlar va demo rejimini boshqaring." />
    <section className={`${cardClass} p-5 sm:p-6`}><div className="mb-4 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-200"><ShieldCheck size={19} /></div><div><h2 className="font-bold">Saqlash va maxfiylik</h2><p className="muted mt-1 text-xs">Tizim tashqi serverga ulanmaydi.</p></div></div><div className="rounded-xl bg-[var(--background)] p-4 text-xs leading-relaxed"><b>Ushbu demo versiyada:</b> o‘quvchilar, guruhlar, davomat, ballar, coinlar, sovg‘alar, coin transferlari va bildirishnomalar shu brauzerning localStorage xotirasida saqlanadi. Brauzer ma’lumotlarini tozalashda ushbu ma’lumotlar ham o‘chishi mumkin. Bu server autentifikatsiyasi yoki xavfsiz ko‘p foydalanuvchili tizim emas.</div></section>
    <section className={`${cardClass} p-5 sm:p-6`}><div className="mb-4"><h2 className="font-bold">JSON ma’lumotlari</h2><p className="muted mt-1 text-xs">Zaxira nusxa yarating yoki avval saqlangan ma’lumotlarni tiklang.</p></div><div className="flex flex-wrap gap-2"><button onClick={onExport} className={buttonClass}><Download size={16} /> JSON eksport qilish</button><button onClick={onImport} className={secondaryClass}><Upload size={16} /> JSON import qilish</button></div><p className="muted mt-3 text-[11px]">Import joriy brauzer ma’lumotlarini almashtiradi va avval tasdiqlashni so‘raydi.</p></section>
    <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 dark:border-rose-900 dark:bg-rose-950/20 sm:p-6"><div className="mb-4 flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60"><RotateCcw size={18} /></div><div><h2 className="font-bold">Demo ma’lumotlarni qayta tiklash</h2><p className="muted mt-1 text-xs">O‘zgartirilgan ma’lumotlar o‘chib, dastlabki demo qayta yaratiladi.</p></div></div><button onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-[var(--surface)] px-3.5 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 dark:border-rose-900 dark:hover:bg-rose-950"><Trash2 size={15} /> Demo ma’lumotlarni tiklash</button></section>
  </div>;
}

function EntityModal({ state, database, onClose, onSave }: { state: Exclude<ModalState, null>; database: Database; onClose: () => void; onSave: (entity: Entity, values: Record<string, string>, existing?: Student | Teacher | StudyGroup | RewardGift) => void }) {
  const { entity, item } = state;
  const isEdit = Boolean(item);
  const value = (key: string) => item && key in item ? String(item[key as keyof typeof item] ?? "") : "";
  const [fields, setFields] = useState<Record<string, string>>(
    entity === "student" ? { name: value("name"), email: value("email"), groupId: value("groupId"), points: value("points") } :
    entity === "teacher" ? { name: value("name"), email: value("email"), subject: value("subject") } :
    entity === "group" ? { name: value("name"), course: value("course"), teacherId: value("teacherId") || database.teachers[0]?.id || "", schedule: value("schedule") } :
    { name: value("name"), emoji: value("emoji"), price: value("price"), description: value("description") },
  );
  const title = entity === "student" ? "o‘quvchi" : entity === "teacher" ? "o‘qituvchi" : entity === "group" ? "guruh" : "sovg‘a";
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSave(entity, fields, item); }
  function field(key: string, label: string, placeholder: string, required = true) { return <label className="block text-xs font-semibold">{label}<input required={required} className={`${inputClass} mt-1.5`} value={fields[key] ?? ""} onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} /></label>; }
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><motion.form initial={{ opacity: 0, scale: .97, y: 7 }} animate={{ opacity: 1, scale: 1, y: 0 }} onSubmit={submit} className={`${cardClass} my-auto w-full max-w-[470px] p-5 sm:p-6`}><div className="mb-5 flex items-start justify-between"><div><div className="text-lg font-bold">{isEdit ? "Ma’lumotni tahrirlash" : `Yangi ${title} qo‘shish`}</div><div className="muted mt-1 text-xs">Kerakli maydonlarni to‘ldiring.</div></div><button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--background)]" aria-label="Yopish"><X size={18} /></button></div>
    <div className="space-y-3.5">{field("name", entity === "gift" ? "Sovg‘a nomi" : "Ism va familiya", entity === "gift" ? "Masalan, Bepul dars" : "Masalan, Ali Valiyev")}{entity !== "group" && entity !== "gift" && field("email", "Elektron pochta", "ali@example.uz")}{entity === "student" && <><label className="block text-xs font-semibold">Guruh<select className={`${inputClass} mt-1.5`} value={fields.groupId} onChange={(event) => setFields({ ...fields, groupId: event.target.value })}><option value="">Guruhsiz</option>{database.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label>{isEdit && <label className="block text-xs font-semibold">O‘quv ballari<input type="number" min="0" step="1" className={`${inputClass} mt-1.5`} value={fields.points} onChange={(event) => setFields({ ...fields, points: event.target.value })} /></label>}</>}{entity === "teacher" && field("subject", "Mutaxassislik", "Masalan, Ingliz tili")}{entity === "group" && <>{field("course", "Kurs yo‘nalishi", "Masalan, Ingliz tili")}<label className="block text-xs font-semibold">O‘qituvchi<select required className={`${inputClass} mt-1.5`} value={fields.teacherId} onChange={(event) => setFields({ ...fields, teacherId: event.target.value })}><option value="">Tanlang</option>{database.teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select></label>{field("schedule", "Dars jadvali", "Du / Chor / Jum · 10:00", false)}</>}{entity === "gift" && <><div className="grid grid-cols-[100px_1fr] gap-3"><label className="block text-xs font-semibold">Emoji<input className={`${inputClass} mt-1.5`} value={fields.emoji} onChange={(event) => setFields({ ...fields, emoji: event.target.value })} placeholder="🎁" /></label><label className="block text-xs font-semibold">Coin narxi<input required min="1" step="1" type="number" className={`${inputClass} mt-1.5`} value={fields.price} onChange={(event) => setFields({ ...fields, price: event.target.value })} placeholder="100" /></label></div><label className="block text-xs font-semibold">Tavsif<textarea className={`${inputClass} mt-1.5`} rows={2} value={fields.description} onChange={(event) => setFields({ ...fields, description: event.target.value })} placeholder="Sovg‘a haqida qisqacha" /></label></>}</div>
    <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryClass}>Bekor qilish</button><button className={buttonClass}><Check size={15} />{isEdit ? "Saqlash" : "Qo‘shish"}</button></div>
  </motion.form></div>;
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-1 text-[10px] font-bold tracking-[.16em] text-violet-600 dark:text-violet-300">{eyebrow}</div><h1 className="text-2xl font-extrabold tracking-tight sm:text-[27px]">{title}</h1><p className="muted mt-1 text-sm">{subtitle}</p></div>{action}</div>;
}

function PersonCell({ name, detail }: { name: string; detail: string }) {
  return <div className="flex items-center gap-2.5"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-[10px] font-bold text-violet-700 dark:from-violet-950 dark:to-indigo-950 dark:text-violet-200">{initials(name)}</div><div className="min-w-0"><div className="truncate text-xs font-semibold">{name}</div><div className="muted truncate text-[10px]">{detail}</div></div></div>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex gap-1"><button onClick={onEdit} title="Tahrirlash" className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:hover:bg-blue-950"><Pencil size={14} /></button><button onClick={onDelete} title="O‘chirish" className="rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 size={14} /></button></div>;
}

function EmptyState({ text, icon: Icon }: { text: string; icon: typeof Users }) {
  return <div className="grid min-h-36 place-items-center p-6 text-center"><div><div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-[var(--background)] muted"><Icon size={19} /></div><p className="muted text-xs">{text}</p></div></div>;
}
