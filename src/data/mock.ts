export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female";
  phone: string;
  lastVisit: string;
  status: "Active" | "Pending" | "Discharged";
};

export const patients: Patient[] = [
  { id: "P-1001", name: "Sara Ahmed", age: 29, gender: "Female", phone: "+20 100 234 5678", lastVisit: "2025-04-12", status: "Active" },
  { id: "P-1002", name: "Omar Khaled", age: 41, gender: "Male", phone: "+20 101 555 9087", lastVisit: "2025-03-30", status: "Pending" },
  { id: "P-1003", name: "Mariam Hossam", age: 34, gender: "Female", phone: "+20 102 110 4422", lastVisit: "2025-04-18", status: "Active" },
  { id: "P-1004", name: "Yousef Adel", age: 52, gender: "Male", phone: "+20 100 998 1230", lastVisit: "2025-02-14", status: "Discharged" },
  { id: "P-1005", name: "Layla Mahmoud", age: 22, gender: "Female", phone: "+20 106 222 8810", lastVisit: "2025-04-21", status: "Active" },
];

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Doctor" | "Secretary";
  status: "Active" | "Suspended";
  createdAt: string;
};

export const users: AppUser[] = [
  { id: "U-01", name: "Dr. Hany Saleh", email: "hany@dentalcare.io", role: "Doctor", status: "Active", createdAt: "2024-09-12" },
  { id: "U-02", name: "Nour Ibrahim", email: "nour@dentalcare.io", role: "Secretary", status: "Active", createdAt: "2024-11-02" },
  { id: "U-03", name: "Ahmed Fathy", email: "ahmed@dentalcare.io", role: "Admin", status: "Active", createdAt: "2024-08-20" },
  { id: "U-04", name: "Dr. Reem Adel", email: "reem@dentalcare.io", role: "Doctor", status: "Suspended", createdAt: "2025-01-15" },
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
  { id: "D-01", name: "Dr. Hany Saleh", specialty: "Orthodontics", schedule: "Sun–Thu · 9:00–15:00", patients: 124, rating: 4.9 },
  { id: "D-02", name: "Dr. Reem Adel", specialty: "Endodontics", schedule: "Mon, Wed · 10:00–18:00", patients: 87, rating: 4.7 },
  { id: "D-03", name: "Dr. Karim Nabil", specialty: "Pediatric Dentistry", schedule: "Sat–Wed · 11:00–17:00", patients: 96, rating: 4.8 },
  { id: "D-04", name: "Dr. Mona Ezz", specialty: "Oral Surgery", schedule: "Tue, Thu · 9:00–14:00", patients: 64, rating: 4.6 },
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
    { id: "MR-1", date: "2025-04-12", diagnosis: "Cavity – tooth #14", treatment: "Composite filling", doctor: "Dr. Hany Saleh" },
    { id: "MR-2", date: "2025-01-08", diagnosis: "Routine check-up", treatment: "Scaling & polishing", doctor: "Dr. Reem Adel" },
  ],
  "P-1002": [
    { id: "MR-3", date: "2025-03-30", diagnosis: "Wisdom tooth impaction", treatment: "Surgical extraction scheduled", doctor: "Dr. Mona Ezz" },
  ],
  "P-1003": [
    { id: "MR-4", date: "2025-04-18", diagnosis: "Gingivitis", treatment: "Deep cleaning + chlorhexidine rinse", doctor: "Dr. Karim Nabil" },
  ],
  "P-1004": [],
  "P-1005": [
    { id: "MR-5", date: "2025-04-21", diagnosis: "Orthodontic consultation", treatment: "Aligners plan – Phase 1", doctor: "Dr. Hany Saleh" },
  ],
};
