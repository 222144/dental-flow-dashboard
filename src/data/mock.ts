export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "ذكر" | "أنثى";
  phone: string;
  lastVisit: string;
  status: "نشط" | "قيد المتابعة" | "مغلق";
};

export const patients: Patient[] = [
  { id: "P-1001", name: "سارة أحمد", age: 29, gender: "أنثى", phone: "+20 100 234 5678", lastVisit: "2025-04-12", status: "نشط" },
  { id: "P-1002", name: "عمر خالد", age: 41, gender: "ذكر", phone: "+20 101 555 9087", lastVisit: "2025-03-30", status: "قيد المتابعة" },
  { id: "P-1003", name: "مريم حسام", age: 34, gender: "أنثى", phone: "+20 102 110 4422", lastVisit: "2025-04-18", status: "نشط" },
  { id: "P-1004", name: "يوسف عادل", age: 52, gender: "ذكر", phone: "+20 100 998 1230", lastVisit: "2025-02-14", status: "مغلق" },
  { id: "P-1005", name: "ليلى محمود", age: 22, gender: "أنثى", phone: "+20 106 222 8810", lastVisit: "2025-04-21", status: "نشط" },
];

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "مسؤول" | "طبيب" | "سكرتيرة" | "محاسب";
  status: "نشط" | "موقوف";
  createdAt: string;
};

export const users: AppUser[] = [
  { id: "U-01", name: "د. هاني صالح", email: "hany@dentalcare.io", role: "طبيب", status: "نشط", createdAt: "2024-09-12" },
  { id: "U-02", name: "نور إبراهيم", email: "nour@dentalcare.io", role: "سكرتيرة", status: "نشط", createdAt: "2024-11-02" },
  { id: "U-03", name: "أحمد فتحي", email: "ahmed@dentalcare.io", role: "مسؤول", status: "نشط", createdAt: "2024-08-20" },
  { id: "U-04", name: "د. ريم عادل", email: "reem@dentalcare.io", role: "طبيب", status: "موقوف", createdAt: "2025-01-15" },
  { id: "U-05", name: "محمد سمير", email: "msamir@dentalcare.io", role: "محاسب", status: "نشط", createdAt: "2024-10-05" },
];

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  schedule: string;
  patients: number;
  rating: number;
};

export const doctors: Doctor[] = [
  { id: "D-01", name: "د. هاني صالح", specialty: "تقويم الأسنان", schedule: "الأحد–الخميس · 9:00–15:00", patients: 124, rating: 4.9 },
  { id: "D-02", name: "د. ريم عادل", specialty: "علاج الجذور", schedule: "الإثنين، الأربعاء · 10:00–18:00", patients: 87, rating: 4.7 },
  { id: "D-03", name: "د. كريم نبيل", specialty: "طب أسنان الأطفال", schedule: "السبت–الأربعاء · 11:00–17:00", patients: 96, rating: 4.8 },
  { id: "D-04", name: "د. منى عز", specialty: "جراحة الفم", schedule: "الثلاثاء، الخميس · 9:00–14:00", patients: 64, rating: 4.6 },
];

export type MedicalRecord = {
  id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
};

export const medicalRecords: Record<string, MedicalRecord[]> = {
  "P-1001": [
    { id: "MR-1", date: "2025-04-12", diagnosis: "تسوس في السن رقم 14", treatment: "حشوة كومبوزيت", doctor: "د. هاني صالح" },
    { id: "MR-2", date: "2025-01-08", diagnosis: "فحص دوري", treatment: "تنظيف وتلميع", doctor: "د. ريم عادل" },
  ],
  "P-1002": [
    { id: "MR-3", date: "2025-03-30", diagnosis: "ضرس عقل منطمر", treatment: "خلع جراحي مجدول", doctor: "د. منى عز" },
  ],
  "P-1003": [
    { id: "MR-4", date: "2025-04-18", diagnosis: "التهاب اللثة", treatment: "تنظيف عميق + غسول كلورهيكسيدين", doctor: "د. كريم نبيل" },
  ],
  "P-1004": [],
  "P-1005": [
    { id: "MR-5", date: "2025-04-21", diagnosis: "استشارة تقويم", treatment: "خطة تقويم شفاف – المرحلة 1", doctor: "د. هاني صالح" },
  ],
};
