export type Role = "admin" | "teacher" | "student";
export type Section = "overview" | "students" | "teachers" | "groups" | "attendance" | "rewards" | "activity" | "settings";

export interface Student {
  id: string;
  name: string;
  email: string;
  groupId: string;
  coins: number;
  points: number;
  joinedAt: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subject: string;
  groupIds: string[];
}

export interface StudyGroup {
  id: string;
  name: string;
  course: string;
  teacherId: string;
  schedule: string;
  studentIds: string[];
}

export interface Attendance {
  id: string;
  studentId: string;
  groupId: string;
  date: string;
  status: "Bor" | "Yo‘q" | "Kechikdi";
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
}

export interface GiftDelivery {
  id: string;
  giftId: string;
  fromStudentId: string;
  toStudentId: string;
  redeemed: boolean;
  createdAt: string;
}

export interface CoinTransfer {
  id: string;
  fromStudentId: string;
  toStudentId: string;
  amount: number;
  note: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Database {
  version: 1;
  students: Student[];
  teachers: Teacher[];
  groups: StudyGroup[];
  attendance: Attendance[];
  gifts: Gift[];
  giftDeliveries: GiftDelivery[];
  transfers: CoinTransfer[];
  notifications: Notification[];
}

export interface DemoUser {
  role: Role;
  id: string;
  name: string;
  description: string;
}
