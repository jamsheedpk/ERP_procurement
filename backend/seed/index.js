require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose           = require("mongoose");
const connectDB          = require("../config/db");
const Department         = require("../models/Department");
const Employee           = require("../models/Employee");
const LeaveRequest       = require("../models/LeaveRequest");
const Opening            = require("../models/Opening");
const Candidate          = require("../models/Candidate");
const PayrollRun         = require("../models/PayrollRun");
const Renewal            = require("../models/Renewal");
const Activity           = require("../models/Activity");
const LeaveType          = require("../models/LeaveType");
const AttendanceDay      = require("../models/AttendanceDay");
const HeadcountSnapshot  = require("../models/HeadcountSnapshot");
const CalendarEvent      = require("../models/CalendarEvent");
const User               = require("../models/User");
const Onboarding         = require("../models/Onboarding");
const AttendanceRecord   = require("../models/AttendanceRecord");
const Benefit            = require("../models/Benefit");
const Shift              = require("../models/Shift");
const Course             = require("../models/Course");
const Document           = require("../models/Document");
const Expense            = require("../models/Expense");
const ReviewCycle        = require("../models/ReviewCycle");
const Appraisal          = require("../models/Appraisal");
const OrgGoal            = require("../models/OrgGoal");

const defaultUsers = [
  // ── Admin accounts ─────────────────────────────────────────────────────────
  { name: "Fatima Al-Mansoori", email: "admin@meridian.ae",   password: "admin123", userRole: "admin",    role: "Head of People",   avatar: { bg: "#F4DDE8", fg: "#6F1947" } },
  { name: "Daniyal Khan",       email: "daniyal@meridian.ae", password: "admin123", userRole: "admin",    role: "IT Administrator", avatar: { bg: "#E8EFF8", fg: "#163E73" } },
  // ── Employee accounts (password: emp123) ───────────────────────────────────
  { name: "Aarav Sharma",       email: "aarav.s@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-2451", role: "Senior Logistics Coordinator", avatar: { bg: "#F4DDE8", fg: "#6F1947" } },
  { name: "Layla Haddad",       email: "layla.h@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-2390", role: "Sales Director",               avatar: { bg: "#F5989D", fg: "#42102B" } },
  { name: "Mohammed Al-Rashid", email: "m.alrashid@meridian.ae", password: "emp123", userRole: "employee", empId: "EMP-2510", role: "Head of Operations",           avatar: { bg: "#FBE2EC", fg: "#6F1947" } },
  { name: "Priya Menon",        email: "priya.m@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-2602", role: "Finance Manager",              avatar: { bg: "#E8F5EE", fg: "#136138" } },
  { name: "Suresh Iyer",        email: "suresh.i@meridian.ae",   password: "emp123", userRole: "employee", empId: "EMP-2731", role: "Warehouse Operations Lead",    avatar: { bg: "#FCF2E1", fg: "#8B560A" } },
  { name: "Fatima Al-Mansoori", email: "fatima.am@meridian.ae",  password: "emp123", userRole: "employee", empId: "EMP-2840", role: "Head of People & Culture",     avatar: { bg: "#F4DDE8", fg: "#6F1947" } },
  { name: "Omar Hashim",        email: "omar.h@meridian.ae",     password: "emp123", userRole: "employee", empId: "EMP-2912", role: "Fleet Manager",                avatar: { bg: "#E8EFF8", fg: "#163E73" } },
  { name: "Chen Wei",           email: "chen.w@meridian.ae",     password: "emp123", userRole: "employee", empId: "EMP-3001", role: "Software Engineer II",         avatar: { bg: "#E8F5EE", fg: "#136138" } },
  { name: "Daniyal Khan",       email: "daniyal.k@meridian.ae",  password: "emp123", userRole: "employee", empId: "EMP-3122", role: "Engineering Manager",          avatar: { bg: "#FBE2EC", fg: "#6F1947" } },
  { name: "Aisha Khoury",       email: "aisha.k@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-3204", role: "PRO Officer",                  avatar: { bg: "#FCF2E1", fg: "#8B560A" } },
  { name: "Hassan Al-Khoury",   email: "hassan.k@meridian.ae",   password: "emp123", userRole: "employee", empId: "EMP-3318", role: "Head of Legal & PRO",          avatar: { bg: "#F4DDE8", fg: "#6F1947" } },
  { name: "Reema Kapoor",       email: "reema.k@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-3401", role: "Junior Accountant",            avatar: { bg: "#E8F5EE", fg: "#136138" } },
  { name: "Yusuf Bello",        email: "yusuf.b@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-3508", role: "Warehouse Associate",          avatar: { bg: "#E8EFF8", fg: "#163E73" } },
  { name: "Anna Petrović",      email: "anna.p@meridian.ae",     password: "emp123", userRole: "employee", empId: "EMP-3611", role: "Marketing Coordinator",        avatar: { bg: "#FBE2EC", fg: "#6F1947" } },
  { name: "Karim El-Sayed",     email: "karim.e@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-3722", role: "Truck Driver — Heavy",         avatar: { bg: "#FBEAEC", fg: "#841422" } },
  { name: "Mei Ling Tan",       email: "mei.t@meridian.ae",      password: "emp123", userRole: "employee", empId: "EMP-3801", role: "Product Designer",             avatar: { bg: "#E8F5EE", fg: "#136138" } },
  { name: "Tariq Bashir",       email: "tariq.b@meridian.ae",    password: "emp123", userRole: "employee", empId: "EMP-3905", role: "Logistics Analyst",            avatar: { bg: "#E8EFF8", fg: "#163E73" } },
];

const departments = [
  { deptId: "ops", name: "Operations",       lead: "Mohammed Al-Rashid",  count: 84, color: "#6F1947" },
  { deptId: "war", name: "Warehouse",         lead: "Suresh Iyer",         count: 62, color: "#B61B54" },
  { deptId: "fle", name: "Fleet",             lead: "Omar Hashim",         count: 31, color: "#D78A14" },
  { deptId: "fin", name: "Finance",           lead: "Priya Menon",         count: 18, color: "#1F8A52" },
  { deptId: "hr",  name: "People & Culture",  lead: "Fatima Al-Mansoori",  count: 9,  color: "#2563B0" },
  { deptId: "sal", name: "Sales",             lead: "Layla Haddad",        count: 22, color: "#534AB7" },
  { deptId: "tec", name: "Technology",        lead: "Daniyal Khan",        count: 14, color: "#0F6E56" },
  { deptId: "leg", name: "Legal & PRO",       lead: "Hassan Al-Khoury",    count: 7,  color: "#854F0B" },
];

const employees = [
  { empId: "EMP-2451", name: "Aarav Sharma",       title: "Senior Logistics Coordinator", dept: "Operations",       deptId: "ops", grade: "L4", manager: "Mohammed Al-Rashid",  email: "aarav.s@meridian.ae",    phone: "+971 50 412 8821", location: "Jebel Ali HQ",     joined: "12 Mar 2021", visaExpires: "08 Jun 2026", eidExpires: "14 Feb 2027", contract: "Permanent", nationality: "India",     salary: 18500, leave: { annual: 12, used: 9  }, status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
  { empId: "EMP-2390", name: "Layla Haddad",        title: "Sales Director",               dept: "Sales",            deptId: "sal", grade: "M5", manager: "CEO",                  email: "layla.h@meridian.ae",    phone: "+971 56 778 2210", location: "DIFC Office",      joined: "01 Sep 2018", visaExpires: "22 Nov 2026", eidExpires: "22 Nov 2026", contract: "Permanent", nationality: "Lebanon",   salary: 42000, leave: { annual: 25, used: 11 }, status: "active",   av: { bg: "#F5989D", fg: "#42102B" } },
  { empId: "EMP-2510", name: "Mohammed Al-Rashid",  title: "Head of Operations",           dept: "Operations",       deptId: "ops", grade: "M5", manager: "CEO",                  email: "m.alrashid@meridian.ae", phone: "+971 52 113 9087", location: "Jebel Ali HQ",     joined: "04 Jan 2017", visaExpires: "—",           eidExpires: "30 Sep 2028", contract: "Permanent", nationality: "UAE",       salary: 58000, leave: { annual: 30, used: 14 }, status: "active",   av: { bg: "#FBE2EC", fg: "#6F1947" } },
  { empId: "EMP-2602", name: "Priya Menon",          title: "Finance Manager",              dept: "Finance",          deptId: "fin", grade: "M4", manager: "CFO",                  email: "priya.m@meridian.ae",    phone: "+971 50 442 9920", location: "DIFC Office",      joined: "18 May 2019", visaExpires: "18 May 2027", eidExpires: "18 May 2027", contract: "Permanent", nationality: "India",     salary: 32000, leave: { annual: 22, used: 7  }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
  { empId: "EMP-2731", name: "Suresh Iyer",          title: "Warehouse Operations Lead",    dept: "Warehouse",        deptId: "war", grade: "L5", manager: "Mohammed Al-Rashid",  email: "suresh.i@meridian.ae",   phone: "+971 55 226 7714", location: "Al Quoz DC",       joined: "22 Jul 2016", visaExpires: "30 May 2026", eidExpires: "30 May 2026", contract: "Permanent", nationality: "India",     salary: 22000, leave: { annual: 22, used: 5  }, status: "active",   av: { bg: "#FCF2E1", fg: "#8B560A" } },
  { empId: "EMP-2840", name: "Fatima Al-Mansoori",   title: "Head of People & Culture",     dept: "People & Culture", deptId: "hr",  grade: "M5", manager: "CEO",                  email: "fatima.am@meridian.ae",  phone: "+971 50 119 4477", location: "DIFC Office",      joined: "11 Oct 2020", visaExpires: "—",           eidExpires: "12 Apr 2029", contract: "Permanent", nationality: "UAE",       salary: 48000, leave: { annual: 30, used: 8  }, status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
  { empId: "EMP-2912", name: "Omar Hashim",           title: "Fleet Manager",                dept: "Fleet",            deptId: "fle", grade: "M4", manager: "Mohammed Al-Rashid",  email: "omar.h@meridian.ae",     phone: "+971 56 884 1133", location: "Jebel Ali HQ",     joined: "03 Feb 2019", visaExpires: "14 Jul 2026", eidExpires: "14 Jul 2026", contract: "Permanent", nationality: "Jordan",    salary: 28500, leave: { annual: 22, used: 6  }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
  { empId: "EMP-3001", name: "Chen Wei",               title: "Software Engineer II",         dept: "Technology",       deptId: "tec", grade: "L3", manager: "Daniyal Khan",         email: "chen.w@meridian.ae",     phone: "+971 52 991 6648", location: "Remote — Sharjah", joined: "16 Sep 2022", visaExpires: "16 Sep 2027", eidExpires: "16 Sep 2027", contract: "Permanent", nationality: "Singapore", salary: 24000, leave: { annual: 22, used: 4  }, status: "on-leave", av: { bg: "#E8F5EE", fg: "#136138" } },
  { empId: "EMP-3122", name: "Daniyal Khan",           title: "Engineering Manager",          dept: "Technology",       deptId: "tec", grade: "M4", manager: "CTO",                  email: "daniyal.k@meridian.ae",  phone: "+971 50 333 7782", location: "DIFC Office",      joined: "08 Aug 2017", visaExpires: "08 Aug 2026", eidExpires: "08 Aug 2026", contract: "Permanent", nationality: "Pakistan",  salary: 36000, leave: { annual: 22, used: 12 }, status: "active",   av: { bg: "#FBE2EC", fg: "#6F1947" } },
  { empId: "EMP-3204", name: "Aisha Khoury",           title: "PRO Officer",                  dept: "Legal & PRO",      deptId: "leg", grade: "L3", manager: "Hassan Al-Khoury",    email: "aisha.k@meridian.ae",    phone: "+971 55 661 2398", location: "Tasheel Centre",   joined: "14 Jan 2023", visaExpires: "14 Jan 2026", eidExpires: "14 Jan 2026", contract: "Permanent", nationality: "Syria",     salary: 14000, leave: { annual: 22, used: 13 }, status: "active",   av: { bg: "#FCF2E1", fg: "#8B560A" } },
  { empId: "EMP-3318", name: "Hassan Al-Khoury",       title: "Head of Legal & PRO",          dept: "Legal & PRO",      deptId: "leg", grade: "M5", manager: "CEO",                  email: "hassan.k@meridian.ae",   phone: "+971 50 776 5421", location: "DIFC Office",      joined: "01 Feb 2018", visaExpires: "—",           eidExpires: "01 Feb 2028", contract: "Permanent", nationality: "UAE",       salary: 52000, leave: { annual: 30, used: 9  }, status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
  { empId: "EMP-3401", name: "Reema Kapoor",           title: "Junior Accountant",            dept: "Finance",          deptId: "fin", grade: "L2", manager: "Priya Menon",          email: "reema.k@meridian.ae",    phone: "+971 56 442 1187", location: "DIFC Office",      joined: "20 Nov 2024", visaExpires: "20 Nov 2026", eidExpires: "20 Nov 2026", contract: "Permanent", nationality: "India",     salary: 11500, leave: { annual: 22, used: 2  }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
  { empId: "EMP-3508", name: "Yusuf Bello",            title: "Warehouse Associate",          dept: "Warehouse",        deptId: "war", grade: "L1", manager: "Suresh Iyer",          email: "yusuf.b@meridian.ae",    phone: "+971 56 119 4490", location: "Al Quoz DC",       joined: "05 Jun 2025", visaExpires: "05 Jun 2027", eidExpires: "05 Jun 2027", contract: "Probation", nationality: "Nigeria",   salary: 4800,  leave: { annual: 22, used: 1  }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
  { empId: "EMP-3611", name: "Anna Petrović",          title: "Marketing Coordinator",        dept: "Sales",            deptId: "sal", grade: "L3", manager: "Layla Haddad",         email: "anna.p@meridian.ae",     phone: "+971 50 888 3320", location: "DIFC Office",      joined: "10 Mar 2024", visaExpires: "10 Mar 2026", eidExpires: "10 Mar 2026", contract: "Permanent", nationality: "Serbia",    salary: 16500, leave: { annual: 22, used: 10 }, status: "on-leave", av: { bg: "#FBE2EC", fg: "#6F1947" } },
  { empId: "EMP-3722", name: "Karim El-Sayed",         title: "Truck Driver — Heavy",         dept: "Fleet",            deptId: "fle", grade: "L2", manager: "Omar Hashim",          email: "karim.e@meridian.ae",    phone: "+971 50 226 7794", location: "Jebel Ali HQ",     joined: "14 Sep 2023", visaExpires: "14 Sep 2025", eidExpires: "14 Sep 2025", contract: "Permanent", nationality: "Egypt",     salary: 5400,  leave: { annual: 22, used: 18 }, status: "active",   av: { bg: "#FBEAEC", fg: "#841422" } },
  { empId: "EMP-3801", name: "Mei Ling Tan",           title: "Product Designer",             dept: "Technology",       deptId: "tec", grade: "L4", manager: "Daniyal Khan",         email: "mei.t@meridian.ae",      phone: "+971 56 119 4421", location: "Remote — Dubai",   joined: "01 Jul 2023", visaExpires: "01 Jul 2026", eidExpires: "01 Jul 2026", contract: "Permanent", nationality: "Malaysia",  salary: 22500, leave: { annual: 22, used: 6  }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
  { empId: "EMP-3905", name: "Tariq Bashir",           title: "Logistics Analyst",            dept: "Operations",       deptId: "ops", grade: "L3", manager: "Mohammed Al-Rashid",  email: "tariq.b@meridian.ae",    phone: "+971 55 884 2018", location: "Jebel Ali HQ",     joined: "22 Apr 2022", visaExpires: "22 Apr 2026", eidExpires: "22 Apr 2026", contract: "Permanent", nationality: "Pakistan",  salary: 17500, leave: { annual: 22, used: 7  }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
];

const leaveRequests = [
  { leaveId: "LR-9281", empId: "EMP-2451", emp: "Aarav Sharma",    dept: "Operations",  type: "annual",    typeLbl: "Annual leave",   from: "25 May 2026", to: "29 May 2026", days: 5,  reason: "Family wedding in Pune. Cover arranged with Tariq.", status: "pending",  submitted: "18 May 2026", approver: "Mohammed Al-Rashid" },
  { leaveId: "LR-9275", empId: "EMP-3611", emp: "Anna Petrović",   dept: "Sales",       type: "sick",      typeLbl: "Sick leave",     from: "21 May 2026", to: "22 May 2026", days: 2,  reason: "Medical certificate attached.",                       status: "pending",  submitted: "21 May 2026", approver: "Layla Haddad" },
  { leaveId: "LR-9270", empId: "EMP-3001", emp: "Chen Wei",        dept: "Technology",  type: "wfh",       typeLbl: "Work from home", from: "19 May 2026", to: "23 May 2026", days: 5,  reason: "Sprint planning week, focus time.",                   status: "approved", submitted: "12 May 2026", approver: "Daniyal Khan" },
  { leaveId: "LR-9268", empId: "EMP-3204", emp: "Aisha Khoury",   dept: "Legal & PRO", type: "hajj",      typeLbl: "Hajj leave",     from: "01 Jun 2026", to: "21 Jun 2026", days: 21, reason: "Annual Hajj pilgrimage, first time.",                  status: "pending",  submitted: "08 May 2026", approver: "Hassan Al-Khoury" },
  { leaveId: "LR-9261", empId: "EMP-3722", emp: "Karim El-Sayed", dept: "Fleet",       type: "annual",    typeLbl: "Annual leave",   from: "10 Jun 2026", to: "24 Jun 2026", days: 15, reason: "Return home for two weeks.",                          status: "pending",  submitted: "02 May 2026", approver: "Omar Hashim" },
  { leaveId: "LR-9255", empId: "EMP-3905", emp: "Tariq Bashir",   dept: "Operations",  type: "annual",    typeLbl: "Annual leave",   from: "06 May 2026", to: "10 May 2026", days: 5,  reason: "Eid travel.",                                          status: "approved", submitted: "20 Apr 2026", approver: "Mohammed Al-Rashid" },
  { leaveId: "LR-9249", empId: "EMP-3401", emp: "Reema Kapoor",   dept: "Finance",     type: "sick",      typeLbl: "Sick leave",     from: "14 May 2026", to: "14 May 2026", days: 1,  reason: "—",                                                    status: "approved", submitted: "14 May 2026", approver: "Priya Menon" },
  { leaveId: "LR-9240", empId: "EMP-3508", emp: "Yusuf Bello",    dept: "Warehouse",   type: "annual",    typeLbl: "Annual leave",   from: "01 May 2026", to: "03 May 2026", days: 3,  reason: "Personal travel.",                                     status: "declined", submitted: "20 Apr 2026", approver: "Suresh Iyer" },
];

const openings = [
  { jobId: "JOB-114", role: "Senior Warehouse Manager",       dept: "Warehouse",   type: "Full-time", location: "Al Quoz DC",    posted: "12 May 2026", applicants: 38, stage: { applied: 12, screen: 8,  interview: 5,  offer: 1, hired: 0 } },
  { jobId: "JOB-118", role: "Customs Clearance Officer",      dept: "Operations",  type: "Full-time", location: "Jebel Ali HQ",  posted: "03 May 2026", applicants: 27, stage: { applied: 9,  screen: 6,  interview: 3,  offer: 2, hired: 0 } },
  { jobId: "JOB-121", role: "Frontend Engineer",              dept: "Technology",  type: "Full-time", location: "Remote — UAE",  posted: "08 May 2026", applicants: 54, stage: { applied: 18, screen: 11, interview: 6,  offer: 1, hired: 1 } },
  { jobId: "JOB-126", role: "Accounts Receivable",            dept: "Finance",     type: "Full-time", location: "DIFC Office",   posted: "15 May 2026", applicants: 19, stage: { applied: 8,  screen: 5,  interview: 2,  offer: 0, hired: 0 } },
  { jobId: "JOB-129", role: "Last-mile Delivery Drivers (x4)",dept: "Fleet",       type: "Full-time", location: "Jebel Ali HQ",  posted: "18 May 2026", applicants: 92, stage: { applied: 41, screen: 22, interview: 11, offer: 4, hired: 2 } },
  { jobId: "JOB-132", role: "PRO Officer",                    dept: "Legal & PRO", type: "Full-time", location: "Tasheel Centre", posted: "19 May 2026", applicants: 8,  stage: { applied: 4,  screen: 2,  interview: 1,  offer: 0, hired: 0 } },
];

const candidates = [
  { candidateId: "C-7821", jobId: "JOB-121", role: "Frontend Engineer", name: "Sara Nasser",      stage: "applied",   email: "sara.n@gmail.com",       location: "Dubai",     exp: 4, source: "LinkedIn",    applied: "14 May 2026", rating: 0, av: { bg: "#FBE2EC", fg: "#6F1947" }, tags: ["React","TypeScript"] },
  { candidateId: "C-7825", jobId: "JOB-121", role: "Frontend Engineer", name: "Devansh Rao",      stage: "applied",   email: "devansh@proton.me",      location: "Bangalore", exp: 6, source: "Referral",    applied: "16 May 2026", rating: 0, av: { bg: "#E8F5EE", fg: "#136138" }, tags: ["React","Next.js"] },
  { candidateId: "C-7828", jobId: "JOB-121", role: "Frontend Engineer", name: "Hala Mansour",     stage: "applied",   email: "hala.m@gmail.com",       location: "Cairo",     exp: 3, source: "Career site", applied: "17 May 2026", rating: 0, av: { bg: "#E8EFF8", fg: "#163E73" }, tags: ["Vue","TS"] },
  { candidateId: "C-7830", jobId: "JOB-121", role: "Frontend Engineer", name: "Marcus Lee",       stage: "screen",    email: "marcus.l@outlook.com",   location: "Singapore", exp: 7, source: "LinkedIn",    applied: "12 May 2026", rating: 4, av: { bg: "#F5989D", fg: "#42102B" }, tags: ["React","GraphQL"] },
  { candidateId: "C-7832", jobId: "JOB-121", role: "Frontend Engineer", name: "Zainab Al-Bahri",  stage: "screen",    email: "zainab.b@gmail.com",     location: "Abu Dhabi", exp: 5, source: "Career site", applied: "13 May 2026", rating: 5, av: { bg: "#FCF2E1", fg: "#8B560A" }, tags: ["React","Design systems"] },
  { candidateId: "C-7841", jobId: "JOB-121", role: "Frontend Engineer", name: "Olusegun Adeyemi", stage: "interview", email: "ola.a@gmail.com",        location: "Lagos",     exp: 8, source: "LinkedIn",    applied: "08 May 2026", rating: 4, av: { bg: "#E8F5EE", fg: "#136138" }, tags: ["Senior","TS"] },
  { candidateId: "C-7844", jobId: "JOB-121", role: "Frontend Engineer", name: "Rina Ahmed",       stage: "interview", email: "rina.a@hotmail.com",     location: "Dubai",     exp: 6, source: "Referral",    applied: "06 May 2026", rating: 5, av: { bg: "#FBE2EC", fg: "#6F1947" }, tags: ["React","A11y"] },
  { candidateId: "C-7850", jobId: "JOB-121", role: "Frontend Engineer", name: "Pavel Novak",      stage: "offer",     email: "pavel.n@gmail.com",      location: "Prague",    exp: 9, source: "LinkedIn",    applied: "01 May 2026", rating: 5, av: { bg: "#E8EFF8", fg: "#163E73" }, tags: ["Architect"] },
  { candidateId: "C-7855", jobId: "JOB-121", role: "Frontend Engineer", name: "Aisha Banerjee",   stage: "hired",     email: "aisha.b@gmail.com",      location: "Mumbai",    exp: 5, source: "Career site", applied: "20 Apr 2026", rating: 5, av: { bg: "#F4DDE8", fg: "#6F1947" }, tags: ["Joining 02 Jun"] },
];

const payrollRun = {
  runId: "PAY-2026-05",
  period: "May 2026",
  runDate: "28 May 2026",
  headcount: 247,
  gross: 1842300,
  netPay: 1721940,
  deductions: 120360,
  bonuses: 38500,
  status: "draft",
  stages: [
    { id: "import",  label: "Inputs imported", done: true,  at: "17 May 2026 09:12", due: null },
    { id: "review",  label: "Variance review", done: true,  at: "19 May 2026 14:30", due: null },
    { id: "approve", label: "CFO approval",    done: false, at: null, due: "26 May 2026" },
    { id: "bank",    label: "WPS bank file",   done: false, at: null, due: "27 May 2026" },
    { id: "payout",  label: "Salaries paid",   done: false, at: null, due: "28 May 2026" },
  ],
  flags: [
    { kind: "warning", dept: "Operations",  text: "3 employees have unapproved overtime > 12 hrs",     count: 3 },
    { kind: "danger",  dept: "Legal & PRO", text: "Aisha Khoury — Emirates ID expires before payday",   count: 1 },
    { kind: "info",    dept: "Sales",       text: "Layla Haddad — Q1 commission included (AED 18,500)", count: 1 },
  ],
  lines: [
    { empId: "EMP-2510", emp: "Mohammed Al-Rashid", dept: "Operations",       base: 58000, allowances: 8000, overtime: 0,   bonus: 0,     deductions: 4200, net: 61800, status: "review" },
    { empId: "EMP-2390", emp: "Layla Haddad",        dept: "Sales",            base: 42000, allowances: 5500, overtime: 0,   bonus: 18500, deductions: 3100, net: 62900, status: "review" },
    { empId: "EMP-2840", emp: "Fatima Al-Mansoori",  dept: "People & Culture", base: 48000, allowances: 7000, overtime: 0,   bonus: 0,     deductions: 3400, net: 51600, status: "ready"  },
    { empId: "EMP-3318", emp: "Hassan Al-Khoury",    dept: "Legal & PRO",      base: 52000, allowances: 7500, overtime: 0,   bonus: 0,     deductions: 3700, net: 55800, status: "ready"  },
    { empId: "EMP-3122", emp: "Daniyal Khan",         dept: "Technology",       base: 36000, allowances: 4500, overtime: 0,   bonus: 0,     deductions: 2700, net: 37800, status: "ready"  },
    { empId: "EMP-2602", emp: "Priya Menon",          dept: "Finance",          base: 32000, allowances: 4000, overtime: 0,   bonus: 2500,  deductions: 2500, net: 36000, status: "ready"  },
    { empId: "EMP-2912", emp: "Omar Hashim",          dept: "Fleet",            base: 28500, allowances: 3500, overtime: 0,   bonus: 0,     deductions: 2100, net: 29900, status: "ready"  },
    { empId: "EMP-2731", emp: "Suresh Iyer",          dept: "Warehouse",        base: 22000, allowances: 2800, overtime: 850, bonus: 0,     deductions: 1700, net: 23950, status: "review" },
    { empId: "EMP-3801", emp: "Mei Ling Tan",         dept: "Technology",       base: 22500, allowances: 2500, overtime: 0,   bonus: 0,     deductions: 1750, net: 23250, status: "ready"  },
    { empId: "EMP-3001", emp: "Chen Wei",             dept: "Technology",       base: 24000, allowances: 3000, overtime: 0,   bonus: 0,     deductions: 1850, net: 25150, status: "ready"  },
    { empId: "EMP-2451", emp: "Aarav Sharma",         dept: "Operations",       base: 18500, allowances: 2200, overtime: 620, bonus: 0,     deductions: 1450, net: 19870, status: "review" },
    { empId: "EMP-3905", emp: "Tariq Bashir",         dept: "Operations",       base: 17500, allowances: 2000, overtime: 0,   bonus: 0,     deductions: 1350, net: 18150, status: "ready"  },
    { empId: "EMP-3611", emp: "Anna Petrović",        dept: "Sales",            base: 16500, allowances: 1800, overtime: 0,   bonus: 0,     deductions: 1250, net: 17050, status: "ready"  },
    { empId: "EMP-3204", emp: "Aisha Khoury",         dept: "Legal & PRO",      base: 14000, allowances: 1600, overtime: 0,   bonus: 0,     deductions: 1100, net: 14500, status: "blocked"},
    { empId: "EMP-3401", emp: "Reema Kapoor",         dept: "Finance",          base: 11500, allowances: 1400, overtime: 0,   bonus: 0,     deductions: 920,  net: 11980, status: "ready"  },
    { empId: "EMP-3722", emp: "Karim El-Sayed",       dept: "Fleet",            base: 5400,  allowances: 1200, overtime: 480, bonus: 0,     deductions: 450,  net: 6630,  status: "ready"  },
    { empId: "EMP-3508", emp: "Yusuf Bello",          dept: "Warehouse",        base: 4800,  allowances: 1100, overtime: 320, bonus: 0,     deductions: 380,  net: 5840,  status: "ready"  },
  ],
};

const renewals = [
  { kind: "Emirates ID", emp: "Aisha Khoury",    empId: "EMP-3204", expires: "14 Jan 2026", days: -127, severity: "danger"  },
  { kind: "Visa",        emp: "Karim El-Sayed",  empId: "EMP-3722", expires: "14 Sep 2025", days: -249, severity: "danger"  },
  { kind: "Visa",        emp: "Anna Petrović",   empId: "EMP-3611", expires: "10 Mar 2026", days: -72,  severity: "danger"  },
  { kind: "Visa",        emp: "Tariq Bashir",    empId: "EMP-3905", expires: "22 Apr 2026", days: -29,  severity: "danger"  },
  { kind: "Visa",        emp: "Suresh Iyer",     empId: "EMP-2731", expires: "30 May 2026", days: 9,    severity: "warning" },
  { kind: "Visa",        emp: "Aarav Sharma",    empId: "EMP-2451", expires: "08 Jun 2026", days: 18,   severity: "warning" },
  { kind: "Visa",        emp: "Mei Ling Tan",    empId: "EMP-3801", expires: "01 Jul 2026", days: 41,   severity: "warning" },
  { kind: "Visa",        emp: "Omar Hashim",     empId: "EMP-2912", expires: "14 Jul 2026", days: 54,   severity: "info"    },
  { kind: "Visa",        emp: "Daniyal Khan",    empId: "EMP-3122", expires: "08 Aug 2026", days: 79,   severity: "info"    },
];

const activity = [
  { when: "Today, 10:42", who: "Layla Haddad",       what: "Approved leave request for Tariq Bashir (Eid travel)",            icon: "check",            kind: "succ"  },
  { when: "Today, 09:18", who: "Aisha Khoury",        what: "Submitted Hajj leave request — 21 days starting 01 Jun",         icon: "calendar-plus",    kind: "info"  },
  { when: "Today, 08:55", who: "System",              what: "Visa renewal reminder sent to Karim El-Sayed via WhatsApp",      icon: "message-circle",   kind: "warn"  },
  { when: "Yesterday",    who: "Priya Menon",          what: "Closed May payroll inputs — 247 employees, AED 1.84M gross",     icon: "wallet",           kind: "brand" },
  { when: "Yesterday",    who: "Daniyal Khan",         what: "Moved Pavel Novak to Offer stage for Frontend Engineer",         icon: "user-check",       kind: "succ"  },
  { when: "19 May",       who: "Fatima Al-Mansoori",  what: "Onboarding kickoff for Yusuf Bello — checklist 60% complete",    icon: "door-open",        kind: "info"  },
  { when: "18 May",       who: "Mohammed Al-Rashid",  what: "Approved performance review cycle for Operations (Q2)",          icon: "chart-bar",        kind: "brand" },
];

const leaveTypes = [
  { typeId: "annual",      name: "Annual leave",   color: "#1F8A52", icon: "palmtree" },
  { typeId: "sick",        name: "Sick leave",      color: "#C0263A", icon: "thermometer" },
  { typeId: "hajj",        name: "Hajj leave",      color: "#854F0B", icon: "moon-star" },
  { typeId: "maternity",   name: "Maternity",       color: "#B61B54", icon: "baby" },
  { typeId: "paternity",   name: "Paternity",       color: "#534AB7", icon: "baby" },
  { typeId: "bereavement", name: "Bereavement",     color: "#5C5156", icon: "heart-handshake" },
  { typeId: "wfh",         name: "Work from home",  color: "#2563B0", icon: "house" },
  { typeId: "unpaid",      name: "Unpaid",          color: "#807379", icon: "circle-off" },
];

const attendanceDay = {
  date: "2026-05-21",
  donut: [
    { lbl: "Checked in", v: 198, c: "#1F8A52" },
    { lbl: "Late",        v: 14,  c: "#D78A14" },
    { lbl: "WFH",         v: 6,   c: "#2563B0" },
    { lbl: "On leave",    v: 14,  c: "#B61B54" },
    { lbl: "No-show",     v: 3,   c: "#C0263A" },
  ],
  week: [
    { label: "Mon", segments: [{ key: "Present", value: 204, color: "#1F8A52" }, { key: "WFH", value: 8, color: "#2563B0" }, { key: "Leave", value: 12, color: "#B61B54" }] },
    { label: "Tue", segments: [{ key: "Present", value: 208, color: "#1F8A52" }, { key: "WFH", value: 6, color: "#2563B0" }, { key: "Leave", value: 14, color: "#B61B54" }] },
    { label: "Wed", segments: [{ key: "Present", value: 211, color: "#1F8A52" }, { key: "WFH", value: 5, color: "#2563B0" }, { key: "Leave", value: 13, color: "#B61B54" }] },
    { label: "Thu", segments: [{ key: "Present", value: 198, color: "#1F8A52" }, { key: "WFH", value: 6, color: "#2563B0" }, { key: "Leave", value: 14, color: "#B61B54" }, { key: "No-show", value: 3, color: "#C0263A" }] },
    { label: "Fri", segments: [{ key: "Present", value: 175, color: "#1F8A52" }, { key: "WFH", value: 12, color: "#2563B0" }, { key: "Leave", value: 18, color: "#B61B54" }] },
    { label: "Sat", segments: [{ key: "Present", value: 0,   color: "#1F8A52" }] },
    { label: "Sun", segments: [{ key: "Present", value: 0,   color: "#1F8A52" }] },
  ],
};

const headcountSnapshots = [
  { m: "Jun '25", v: 198, order: 1  },
  { m: "Jul",     v: 204, order: 2  },
  { m: "Aug",     v: 209, order: 3  },
  { m: "Sep",     v: 215, order: 4  },
  { m: "Oct",     v: 220, order: 5  },
  { m: "Nov",     v: 224, order: 6  },
  { m: "Dec",     v: 226, order: 7  },
  { m: "Jan '26", v: 230, order: 8  },
  { m: "Feb",     v: 234, order: 9  },
  { m: "Mar",     v: 239, order: 10 },
  { m: "Apr",     v: 243, order: 11 },
  { m: "May",     v: 247, order: 12 },
];

const calendarEvents = [
  { month: "2026-05", day: 1,  kind: "holiday", label: "Labour Day" },
  { month: "2026-05", day: 6,  kind: "leave",   label: "Tariq B." },
  { month: "2026-05", day: 6,  kind: "leave",   label: "+1" },
  { month: "2026-05", day: 7,  kind: "leave",   label: "Tariq B." },
  { month: "2026-05", day: 8,  kind: "leave",   label: "Tariq B." },
  { month: "2026-05", day: 9,  kind: "leave",   label: "Tariq B." },
  { month: "2026-05", day: 10, kind: "leave",   label: "Tariq B." },
  { month: "2026-05", day: 14, kind: "leave",   label: "Reema K." },
  { month: "2026-05", day: 19, kind: "wfh",     label: "Chen W." },
  { month: "2026-05", day: 20, kind: "wfh",     label: "Chen W." },
  { month: "2026-05", day: 21, kind: "wfh",     label: "Chen W." },
  { month: "2026-05", day: 21, kind: "event",   label: "Town hall" },
  { month: "2026-05", day: 22, kind: "wfh",     label: "Chen W." },
  { month: "2026-05", day: 23, kind: "wfh",     label: "Chen W." },
  { month: "2026-05", day: 25, kind: "leave",   label: "Aarav S." },
  { month: "2026-05", day: 26, kind: "leave",   label: "Aarav S." },
  { month: "2026-05", day: 27, kind: "leave",   label: "Aarav S." },
  { month: "2026-05", day: 27, kind: "event",   label: "Payday eve" },
  { month: "2026-05", day: 28, kind: "leave",   label: "Aarav S." },
  { month: "2026-05", day: 28, kind: "event",   label: "Payroll run" },
  { month: "2026-05", day: 29, kind: "leave",   label: "Aarav S." },
];

function seedShiftType(empId, dayOfWeek, empStatus) {
  if (empStatus === "on-leave") return "leave";
  const h = [...empId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const patterns = [
    ["day",    "day",    "day",    "day",    "day",    "off",    "off"   ],
    ["morning","morning","morning","morning","morning","off",    "off"   ],
    ["day",    "day",    "day",    "off",    "off",    "day",    "day"  ],
    ["evening","evening","evening","evening","off",    "off",    "evening"],
    ["day",    "morning","day",    "day",    "evening","off",    "off"  ],
    ["morning","morning","off",    "day",    "day",    "morning","off"  ],
  ];
  return patterns[(h + empId.charCodeAt(0)) % patterns.length][dayOfWeek % 7];
}

function buildShiftRecords(emps) {
  const shifts = [];
  const anchorMonday = new Date("2026-05-19T00:00:00Z");
  for (let wk = -1; wk <= 1; wk++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(anchorMonday);
      d.setUTCDate(anchorMonday.getUTCDate() + wk * 7 + day);
      const dateStr = d.toISOString().slice(0, 10);
      emps.forEach(emp => {
        shifts.push({
          shiftId: `SHF-${emp.empId}-${dateStr}`,
          empId:   emp.empId,
          date:    dateStr,
          type:    seedShiftType(emp.empId, day, emp.status),
          empName: emp.name,
          dept:    emp.dept || "",
          role:    emp.title || "",
          avatar:  emp.av || { bg: "#F4DDE8", fg: "#6F1947" },
        });
      });
    }
  }
  return shifts;
}

const benefits = [
  {
    benefitId: "BEN-001", name: "Health Insurance", icon: "heart-pulse", color: "#B61B54",
    provider: "Daman Health", coverage: "Employee + Family", costPerEmp: 850,
    desc: "Comprehensive inpatient & outpatient cover across UAE network", active: true,
    tiers: [{ label: "Basic", count: 9, cost: 650 }, { label: "Enhanced", count: 5, cost: 950 }, { label: "Premium", count: 3, cost: 1200 }],
    enrolledEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3508","EMP-3611","EMP-3722","EMP-3801","EMP-3905"],
  },
  {
    benefitId: "BEN-002", name: "Life Insurance", icon: "shield-check", color: "#2563B0",
    provider: "AXA Gulf", coverage: "3× Annual Salary", costPerEmp: 120,
    desc: "Group life and accidental death & disability insurance", active: true,
    tiers: [{ label: "Standard", count: 16, cost: 120 }],
    enrolledEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3611","EMP-3722","EMP-3801","EMP-3905"],
  },
  {
    benefitId: "BEN-003", name: "End of Service Gratuity", icon: "wallet", color: "#1F8A52",
    provider: "UAE Labour Law", coverage: "21–30 days/year", costPerEmp: 0,
    desc: "Statutory gratuity calculated per UAE Labour Law Article 132", active: true,
    tiers: [{ label: "Mandatory", count: 17, cost: 0 }],
    enrolledEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3508","EMP-3611","EMP-3722","EMP-3801","EMP-3905"],
  },
  {
    benefitId: "BEN-004", name: "Annual Air Tickets", icon: "plane", color: "#534AB7",
    provider: "Company Policy", coverage: "Economy class to home country", costPerEmp: 700,
    desc: "Annual return air tickets to country of origin for employee + dependants", active: true,
    tiers: [{ label: "Employee only", count: 9, cost: 500 }, { label: "Employee + Family", count: 5, cost: 1200 }],
    enrolledEmpIds: ["EMP-2451","EMP-2390","EMP-2602","EMP-2731","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3401","EMP-3508","EMP-3611","EMP-3722","EMP-3801","EMP-3905"],
  },
  {
    benefitId: "BEN-005", name: "Wellness Allowance", icon: "dumbbell", color: "#D78A14",
    provider: "Company Policy", coverage: "AED 2,000/year", costPerEmp: 167,
    desc: "Annual wellness budget for gym, mental health, and preventive care", active: true,
    tiers: [{ label: "Standard", count: 17, cost: 167 }],
    enrolledEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3508","EMP-3611","EMP-3722","EMP-3801","EMP-3905"],
  },
  {
    benefitId: "BEN-006", name: "Housing Allowance", icon: "home", color: "#C0263A",
    provider: "Company Policy", coverage: "Grade-based allowance", costPerEmp: 3500,
    desc: "Monthly housing allowance for senior and mid-level grades", active: true,
    tiers: [{ label: "L5", count: 1, cost: 3500 }, { label: "M4", count: 3, cost: 4500 }, { label: "M5", count: 4, cost: 6000 }],
    enrolledEmpIds: ["EMP-2731","EMP-2602","EMP-2912","EMP-3122","EMP-2390","EMP-2510","EMP-2840","EMP-3318"],
  },
];

// ── Onboarding & Offboarding ──────────────────────────────────────────────────
const OB_TASK_DEFS = [
  { label: "Send offer letter",          stage: "prestart" },
  { label: "Background check",           stage: "prestart" },
  { label: "ID document collection",     stage: "prestart" },
  { label: "System access request",      stage: "prestart" },
  { label: "Desk & equipment setup",     stage: "prestart" },
  { label: "Orientation session",        stage: "week1" },
  { label: "Meet HR team",               stage: "week1" },
  { label: "Review company handbook",    stage: "week1" },
  { label: "IT setup complete",          stage: "week1" },
  { label: "Badge issued",               stage: "week1" },
  { label: "Meet department team",       stage: "week2" },
  { label: "Role briefing complete",     stage: "week2" },
  { label: "Assign buddy / mentor",      stage: "week2" },
  { label: "First project assigned",     stage: "week2" },
  { label: "Week 2 review & feedback",   stage: "week2" },
  { label: "30-day check-in done",       stage: "settled" },
  { label: "Goals set in system",        stage: "settled" },
  { label: "Benefits enrolled",          stage: "settled" },
  { label: "Training plan agreed",       stage: "settled" },
];

const OFB_TASK_DEFS = [
  { label: "Resignation acknowledged",   stage: "notice" },
  { label: "Exit date confirmed",        stage: "notice" },
  { label: "Notice period tracking",     stage: "notice" },
  { label: "KT document created",        stage: "handover" },
  { label: "Handover meeting done",      stage: "handover" },
  { label: "Knowledge transfer complete",stage: "handover" },
  { label: "Replacement identified",     stage: "handover" },
  { label: "IT assets returned",         stage: "clearance" },
  { label: "System access revoked",      stage: "clearance" },
  { label: "Finance clearance issued",   stage: "clearance" },
  { label: "HR clearance issued",        stage: "clearance" },
  { label: "Exit interview done",        stage: "exit" },
  { label: "Final pay processed",        stage: "exit" },
  { label: "Experience letter issued",   stage: "exit" },
];

function makeTasks(defs, currentStage, stageOrder) {
  const stageIdx = stageOrder.indexOf(currentStage);
  return defs.map(d => {
    const dIdx = stageOrder.indexOf(d.stage);
    return { ...d, done: dIdx < stageIdx };
  });
}

const OB_STAGES  = ["prestart","week1","week2","settled"];
const OFB_STAGES = ["notice","handover","clearance","exit"];

const onboardingRecords = [
  {
    boardingId: "OB-001", type: "onboard",
    empId: "EMP-3905", name: "Tariq Bashir",    dept: "Operations",     role: "Logistics Analyst",
    stage: "week1",    startDate: "2026-05-19",  endDate: "",
    avatar: { bg: "#E8EFF8", fg: "#163E73" },
    tasks: makeTasks(OB_TASK_DEFS, "week1", OB_STAGES),
    notes: "Relocated from Riyadh. DIFC office card pending.",
  },
  {
    boardingId: "OB-002", type: "onboard",
    empId: "EMP-3801", name: "Mei Ling Tan",     dept: "Technology",     role: "Product Designer",
    stage: "prestart", startDate: "2026-06-02",  endDate: "",
    avatar: { bg: "#E8F5EE", fg: "#136138" },
    tasks: makeTasks(OB_TASK_DEFS, "prestart", OB_STAGES),
    notes: "Offer accepted. Awaiting visa stamping.",
  },
  {
    boardingId: "OB-003", type: "onboard",
    empId: "EMP-3611", name: "Anna Petrović",    dept: "Sales",          role: "Marketing Coordinator",
    stage: "week2",    startDate: "2026-05-12",  endDate: "",
    avatar: { bg: "#FBE2EC", fg: "#6F1947" },
    tasks: makeTasks(OB_TASK_DEFS, "week2", OB_STAGES),
    notes: "Buddy: Layla Haddad. First campaign kickoff 26 May.",
  },
  {
    boardingId: "OB-004", type: "onboard",
    empId: "EMP-3508", name: "Yusuf Bello",      dept: "Warehouse",      role: "Warehouse Associate",
    stage: "settled",  startDate: "2026-04-28",  endDate: "",
    avatar: { bg: "#E8EFF8", fg: "#163E73" },
    tasks: makeTasks(OB_TASK_DEFS, "settled", OB_STAGES),
    notes: "Passed 30-day check-in. Enrolled in safety training.",
  },
  {
    boardingId: "OB-005", type: "onboard",
    empId: "EMP-3401", name: "Reema Kapoor",     dept: "Finance",        role: "Junior Accountant",
    stage: "prestart", startDate: "2026-06-09",  endDate: "",
    avatar: { bg: "#E8F5EE", fg: "#136138" },
    tasks: makeTasks(OB_TASK_DEFS, "prestart", OB_STAGES),
    notes: "Replacement for vacated Junior Accountant role.",
  },
  {
    boardingId: "OFB-001", type: "offboard",
    empId: "EMP-2912", name: "Omar Hashim",      dept: "Fleet",          role: "Fleet Manager",
    stage: "handover", startDate: "",            endDate: "2026-06-15",
    avatar: { bg: "#E8EFF8", fg: "#163E73" },
    tasks: makeTasks(OFB_TASK_DEFS, "handover", OFB_STAGES),
    notes: "Relocating to Riyadh. Handover to Suresh Iyer (interim).",
  },
  {
    boardingId: "OFB-002", type: "offboard",
    empId: "EMP-3204", name: "Aisha Khoury",     dept: "Legal & PRO",    role: "PRO Officer",
    stage: "clearance",startDate: "",            endDate: "2026-05-31",
    avatar: { bg: "#FCF2E1", fg: "#8B560A" },
    tasks: makeTasks(OFB_TASK_DEFS, "clearance", OFB_STAGES),
    notes: "Last day 31 May. Experience letter requested.",
  },
  {
    boardingId: "OFB-003", type: "offboard",
    empId: "EMP-3122", name: "Daniyal Khan",     dept: "Technology",     role: "Engineering Manager",
    stage: "notice",   startDate: "",            endDate: "2026-06-30",
    avatar: { bg: "#FBE2EC", fg: "#6F1947" },
    tasks: makeTasks(OFB_TASK_DEFS, "notice", OFB_STAGES),
    notes: "Garden leave approved from 15 Jun.",
  },
];

// ── Expenses ──────────────────────────────────────────────────────────────────
const expenses = [
  // May 2026
  { expenseId:"EXP-001", empId:"EMP-2390", empName:"Layla Haddad",       dept:"Sales",            avatar:{bg:"#F5989D",fg:"#42102B"}, cat:"travel",   amount:2800, currency:"AED", date:"2026-05-20", desc:"Client visit — Abu Dhabi (Etihad flight + taxi)", status:"pending",    receipts:2, notes:"Pre-approved by CEO. Return trip included." },
  { expenseId:"EXP-002", empId:"EMP-2510", empName:"Mohammed Al-Rashid", dept:"Operations",       avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"travel",   amount:4200, currency:"AED", date:"2026-05-19", desc:"Flight to Riyadh — ops review with Saudi partner",  status:"approved",   receipts:3, notes:"Ops review at Saudi Logistics Co HQ." },
  { expenseId:"EXP-003", empId:"EMP-2840", empName:"Fatima Al-Mansoori", dept:"People & Culture", avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"training", amount:3500, currency:"AED", date:"2026-05-18", desc:"HR Innovation Summit — DIFC conference registration", status:"approved",   receipts:1, notes:"Full-day summit. Budget code: L&D-2026." },
  { expenseId:"EXP-004", empId:"EMP-3001", empName:"Chen Wei",           dept:"Technology",       avatar:{bg:"#E8F5EE",fg:"#136138"}, cat:"office",   amount:750,  currency:"AED", date:"2026-05-17", desc:"WFH setup — ergonomic keyboard & monitor riser",    status:"reimbursed", receipts:2, notes:"WFH allowance category. Pre-approved." },
  { expenseId:"EXP-005", empId:"EMP-2602", empName:"Priya Menon",        dept:"Finance",          avatar:{bg:"#E8F5EE",fg:"#136138"}, cat:"meals",    amount:480,  currency:"AED", date:"2026-05-16", desc:"Q2 Finance team lunch — all 4 team members",        status:"reimbursed", receipts:1, notes:"Quarterly team lunch. Restaurant: Zuma DIFC." },
  { expenseId:"EXP-006", empId:"EMP-2451", empName:"Aarav Sharma",       dept:"Operations",       avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"transport", amount:620, currency:"AED", date:"2026-05-15", desc:"Jebel Ali port taxis — 4 trips carrier inspection",   status:"pending",    receipts:4, notes:"All receipts attached. Uber receipts." },
  { expenseId:"EXP-007", empId:"EMP-3122", empName:"Daniyal Khan",       dept:"Technology",       avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"client",   amount:4100, currency:"AED", date:"2026-05-14", desc:"Client dinner — Series B VC partner visit, Nobu",    status:"pending",    receipts:1, notes:"Attended by CTO + 2 investors. CEO pre-approval pending." },
  { expenseId:"EXP-008", empId:"EMP-3611", empName:"Anna Petrović",      dept:"Sales",            avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"client",   amount:1200, currency:"AED", date:"2026-05-13", desc:"Brand shoot photography — product launch content",   status:"approved",   receipts:2, notes:"Agency: PixelStudio. Invoice attached." },
  { expenseId:"EXP-009", empId:"EMP-3204", empName:"Aisha Khoury",       dept:"Legal & PRO",      avatar:{bg:"#FCF2E1",fg:"#8B560A"}, cat:"transport", amount:185, currency:"AED", date:"2026-05-12", desc:"Tasheel office taxis — visa renewal rounds",          status:"reimbursed", receipts:3, notes:"3 Uber trips to GDRFA and Tasheel." },
  { expenseId:"EXP-010", empId:"EMP-2912", empName:"Omar Hashim",        dept:"Fleet",            avatar:{bg:"#E8EFF8",fg:"#163E73"}, cat:"travel",   amount:1950, currency:"AED", date:"2026-05-11", desc:"Abu Dhabi fleet inspection — day trip",              status:"approved",   receipts:2, notes:"Inspected 6 vehicles at AD depot." },
  { expenseId:"EXP-011", empId:"EMP-3318", empName:"Hassan Al-Khoury",   dept:"Legal & PRO",      avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"travel",   amount:5800, currency:"AED", date:"2026-05-10", desc:"Singapore legal conference — flight + 2 nights",     status:"pending",    receipts:4, notes:"ICC Arbitration Conference. Business class per grade." },
  { expenseId:"EXP-012", empId:"EMP-3801", empName:"Mei Ling Tan",       dept:"Technology",       avatar:{bg:"#E8F5EE",fg:"#136138"}, cat:"office",   amount:890,  currency:"AED", date:"2026-05-09", desc:"Figma annual licence + Apple Pencil Pro",            status:"reimbursed", receipts:2, notes:"Tools pre-approved in Q1 budget." },
  { expenseId:"EXP-013", empId:"EMP-2731", empName:"Suresh Iyer",        dept:"Warehouse",        avatar:{bg:"#FCF2E1",fg:"#8B560A"}, cat:"office",   amount:320,  currency:"AED", date:"2026-05-08", desc:"Warehouse safety signage — Al Quoz DC",              status:"reimbursed", receipts:1, notes:"Ops consumables budget." },
  { expenseId:"EXP-014", empId:"EMP-3905", empName:"Tariq Bashir",       dept:"Operations",       avatar:{bg:"#E8EFF8",fg:"#163E73"}, cat:"meals",    amount:210,  currency:"AED", date:"2026-05-07", desc:"Working late dinner — ops incident response",        status:"rejected",   receipts:1, notes:"Rejected: individual meal expenses require prior manager approval. Resubmit with pre-auth." },
  { expenseId:"EXP-015", empId:"EMP-2390", empName:"Layla Haddad",       dept:"Sales",            avatar:{bg:"#F5989D",fg:"#42102B"}, cat:"accomm",   amount:2200, currency:"AED", date:"2026-05-06", desc:"2-night hotel, Riyadh — client QBR stay",           status:"approved",   receipts:2, notes:"Marriott Riyadh. Approved as part of Q2 client plan." },
  { expenseId:"EXP-016", empId:"EMP-3122", empName:"Daniyal Khan",       dept:"Technology",       avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"training", amount:2400, currency:"AED", date:"2026-05-05", desc:"AWS re:Invent On-Demand annual pass",               status:"reimbursed", receipts:1, notes:"Engineering learning budget Q2." },
  { expenseId:"EXP-017", empId:"EMP-2510", empName:"Mohammed Al-Rashid", dept:"Operations",       avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"meals",    amount:850,  currency:"AED", date:"2026-05-04", desc:"Ops leadership lunch — strategy offsite planning",   status:"approved",   receipts:1, notes:"8 senior ops leads attended." },
  { expenseId:"EXP-018", empId:"EMP-3611", empName:"Anna Petrović",      dept:"Sales",            avatar:{bg:"#FBE2EC",fg:"#6F1947"}, cat:"training", amount:1800, currency:"AED", date:"2026-05-03", desc:"Meta Ads advanced certification course — online",    status:"pending",    receipts:1, notes:"Submitted with manager pre-approval email." },
  // April 2026 (a few older ones for trend data)
  { expenseId:"EXP-019", empId:"EMP-2840", empName:"Fatima Al-Mansoori", dept:"People & Culture", avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"travel",   amount:3200, currency:"AED", date:"2026-04-22", desc:"Abu Dhabi ENPS benchmarking workshop",              status:"reimbursed", receipts:2, notes:"" },
  { expenseId:"EXP-020", empId:"EMP-3318", empName:"Hassan Al-Khoury",   dept:"Legal & PRO",      avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"other",    amount:1600, currency:"AED", date:"2026-04-15", desc:"Notarisation & attestation fees — Q1 batch",        status:"reimbursed", receipts:5, notes:"PRO operational cost." },
  { expenseId:"EXP-021", empId:"EMP-2451", empName:"Aarav Sharma",       dept:"Operations",       avatar:{bg:"#F4DDE8",fg:"#6F1947"}, cat:"transport", amount:440, currency:"AED", date:"2026-04-10", desc:"Port transport — April customs inspection",          status:"reimbursed", receipts:3, notes:"" },
  { expenseId:"EXP-022", empId:"EMP-3801", empName:"Mei Ling Tan",       dept:"Technology",       avatar:{bg:"#E8F5EE",fg:"#136138"}, cat:"client",   amount:960,  currency:"AED", date:"2026-04-08", desc:"UX research participant incentives (4 × AED 240)",   status:"reimbursed", receipts:1, notes:"Research ops budget." },
];

// ── Documents & Contracts ─────────────────────────────────────────────────────
const documents = [
  // Employment Contracts
  { docId:"DOC-C001", title:"Employment Contract — Aarav Sharma",       category:"contract", empId:"EMP-2451", empName:"Aarav Sharma",       issuedDate:"12 Mar 2021", expiryDate:"", status:"active", fileSizeMB:0.8, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Grade L4. Last amended Mar 2023 for salary revision." },
  { docId:"DOC-C002", title:"Employment Contract — Layla Haddad",        category:"contract", empId:"EMP-2390", empName:"Layla Haddad",        issuedDate:"01 Sep 2018", expiryDate:"", status:"active", fileSizeMB:0.9, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Sales Director. Commission structure appended." },
  { docId:"DOC-C003", title:"Employment Contract — Mohammed Al-Rashid",  category:"contract", empId:"EMP-2510", empName:"Mohammed Al-Rashid",  issuedDate:"04 Jan 2017", expiryDate:"", status:"active", fileSizeMB:1.1, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. UAE national. Executive package." },
  { docId:"DOC-C004", title:"Employment Contract — Priya Menon",          category:"contract", empId:"EMP-2602", empName:"Priya Menon",          issuedDate:"18 May 2019", expiryDate:"", status:"active", fileSizeMB:0.8, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Finance Manager. Housing allowance included." },
  { docId:"DOC-C005", title:"Employment Contract — Suresh Iyer",          category:"contract", empId:"EMP-2731", empName:"Suresh Iyer",          issuedDate:"22 Jul 2016", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Salary amendment letter issued Jan 2024." },
  { docId:"DOC-C006", title:"Employment Contract — Fatima Al-Mansoori",   category:"contract", empId:"EMP-2840", empName:"Fatima Al-Mansoori",   issuedDate:"11 Oct 2020", expiryDate:"", status:"active", fileSizeMB:1.0, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. UAE national. Head of People & Culture." },
  { docId:"DOC-C007", title:"Employment Contract — Omar Hashim",           category:"contract", empId:"EMP-2912", empName:"Omar Hashim",           issuedDate:"03 Feb 2019", expiryDate:"", status:"active", fileSizeMB:0.8, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Fleet Manager. Company vehicle clause included." },
  { docId:"DOC-C008", title:"Employment Contract — Chen Wei",               category:"contract", empId:"EMP-3001", empName:"Chen Wei",               issuedDate:"16 Sep 2022", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Remote work addendum attached." },
  { docId:"DOC-C009", title:"Employment Contract — Daniyal Khan",           category:"contract", empId:"EMP-3122", empName:"Daniyal Khan",           issuedDate:"08 Aug 2017", expiryDate:"", status:"active", fileSizeMB:0.9, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Resignation notice received — see offboarding." },
  { docId:"DOC-C010", title:"Employment Contract — Aisha Khoury",           category:"contract", empId:"EMP-3204", empName:"Aisha Khoury",           issuedDate:"14 Jan 2023", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Offboarding initiated — last day 31 May 2026." },
  { docId:"DOC-C011", title:"Employment Contract — Hassan Al-Khoury",       category:"contract", empId:"EMP-3318", empName:"Hassan Al-Khoury",       issuedDate:"01 Feb 2018", expiryDate:"", status:"active", fileSizeMB:1.2, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. UAE national. Head of Legal & PRO." },
  { docId:"DOC-C012", title:"Employment Contract — Reema Kapoor",           category:"contract", empId:"EMP-3401", empName:"Reema Kapoor",           issuedDate:"20 Nov 2024", expiryDate:"", status:"active", fileSizeMB:0.6, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Junior Accountant. Probation period ended 20 May 2025." },
  { docId:"DOC-C013", title:"Employment Contract — Yusuf Bello",            category:"contract", empId:"EMP-3508", empName:"Yusuf Bello",            issuedDate:"05 Jun 2025", expiryDate:"05 Dec 2025", status:"active", fileSizeMB:0.6, signedByEmp:true,  signedByHR:true,  notes:"Probation contract. 6-month term. Probation confirmation letter pending." },
  { docId:"DOC-C014", title:"Employment Contract — Anna Petrović",          category:"contract", empId:"EMP-3611", empName:"Anna Petrović",          issuedDate:"10 Mar 2024", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. NDA attached for marketing confidentiality." },
  { docId:"DOC-C015", title:"Employment Contract — Karim El-Sayed",         category:"contract", empId:"EMP-3722", empName:"Karim El-Sayed",         issuedDate:"14 Sep 2023", expiryDate:"", status:"active", fileSizeMB:0.6, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Visa renewal overdue — flag with PRO." },
  { docId:"DOC-C016", title:"Employment Contract — Mei Ling Tan",           category:"contract", empId:"EMP-3801", empName:"Mei Ling Tan",           issuedDate:"01 Jul 2023", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Remote Dubai. IP assignment clause included." },
  { docId:"DOC-C017", title:"Employment Contract — Tariq Bashir",           category:"contract", empId:"EMP-3905", empName:"Tariq Bashir",           issuedDate:"22 Apr 2022", expiryDate:"", status:"active", fileSizeMB:0.7, signedByEmp:true,  signedByHR:true,  notes:"Permanent contract. Logistics Analyst." },

  // Company Policies
  { docId:"DOC-P001", title:"Employee Handbook 2026",                    category:"policy", empId:"", empName:"Company-wide", issuedDate:"01 Jan 2026", expiryDate:"31 Dec 2026", status:"active", fileSizeMB:2.4, signedByEmp:false, signedByHR:true,  notes:"Annual review completed Jan 2026. Next review Jan 2027." },
  { docId:"DOC-P002", title:"Leave & Absence Policy",                    category:"policy", empId:"", empName:"Company-wide", issuedDate:"01 Jan 2026", expiryDate:"",           status:"active", fileSizeMB:0.5, signedByEmp:false, signedByHR:true,  notes:"Covers all leave types per UAE Labour Law 2024 amendments." },
  { docId:"DOC-P003", title:"Health & Safety Policy",                    category:"policy", empId:"", empName:"Company-wide", issuedDate:"15 Mar 2025", expiryDate:"",           status:"active", fileSizeMB:0.8, signedByEmp:false, signedByHR:true,  notes:"Compliant with UAE HSE standards. Reviewed after Jebel Ali warehouse audit." },
  { docId:"DOC-P004", title:"IT Acceptable Use Policy",                  category:"policy", empId:"", empName:"Company-wide", issuedDate:"01 Jan 2026", expiryDate:"",           status:"active", fileSizeMB:0.4, signedByEmp:false, signedByHR:true,  notes:"All employees must acknowledge on onboarding. Updated for cloud tools." },
  { docId:"DOC-P005", title:"Anti-Bribery & Corruption Policy",          category:"policy", empId:"", empName:"Company-wide", issuedDate:"01 Feb 2025", expiryDate:"",           status:"active", fileSizeMB:0.6, signedByEmp:false, signedByHR:true,  notes:"Mandatory reading for Sales, Fleet, and Procurement functions." },
  { docId:"DOC-P006", title:"Code of Conduct 2026",                      category:"policy", empId:"", empName:"Company-wide", issuedDate:"01 Jan 2026", expiryDate:"31 Dec 2026", status:"active", fileSizeMB:1.1, signedByEmp:false, signedByHR:true,  notes:"Signed acknowledgment collected at onboarding." },
  { docId:"DOC-P007", title:"Data Privacy Policy (UAE PDPL)",            category:"policy", empId:"", empName:"Company-wide", issuedDate:"",           expiryDate:"",           status:"draft",  fileSizeMB:0.7, signedByEmp:false, signedByHR:false, notes:"Draft pending legal review by Hassan Al-Khoury. Target: 01 Jul 2026." },

  // Templates
  { docId:"DOC-T001", title:"Offer Letter Template",                     category:"template", empId:"", empName:"HR Template", issuedDate:"01 Jan 2026", expiryDate:"", status:"active", fileSizeMB:0.2, signedByEmp:false, signedByHR:false, notes:"Standard offer letter. Edit salary, grade, start date before sending." },
  { docId:"DOC-T002", title:"NDA Template (General)",                    category:"template", empId:"", empName:"HR Template", issuedDate:"01 Jan 2026", expiryDate:"", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:false, notes:"Two-way NDA. Reviewed by Legal Jan 2026." },
  { docId:"DOC-T003", title:"Employment Contract Template",              category:"template", empId:"", empName:"HR Template", issuedDate:"01 Jan 2026", expiryDate:"", status:"active", fileSizeMB:0.4, signedByEmp:false, signedByHR:false, notes:"Base template for UAE-based permanent hires. Fill placeholders before issuing." },
  { docId:"DOC-T004", title:"Performance Improvement Plan (PIP)",        category:"template", empId:"", empName:"HR Template", issuedDate:"01 Mar 2025", expiryDate:"", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:false, notes:"90-day PIP framework. To be used in conjunction with HR Business Partner." },
  { docId:"DOC-T005", title:"Experience Letter Template",                category:"template", empId:"", empName:"HR Template", issuedDate:"01 Jan 2026", expiryDate:"", status:"active", fileSizeMB:0.2, signedByEmp:false, signedByHR:false, notes:"Standard experience letter for exiting employees." },

  // Certificates
  { docId:"DOC-X001", title:"ISO 9001:2015 Completion — Aarav Sharma",   category:"certificate", empId:"EMP-2451", empName:"Aarav Sharma",      issuedDate:"15 May 2026", expiryDate:"15 May 2029", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:true, notes:"Completed CRS-001 ISO 9001:2015 Quality Management." },
  { docId:"DOC-X002", title:"ISO 9001:2015 Completion — Layla Haddad",    category:"certificate", empId:"EMP-2390", empName:"Layla Haddad",       issuedDate:"15 May 2026", expiryDate:"15 May 2029", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:true, notes:"Completed CRS-001 ISO 9001:2015 Quality Management." },
  { docId:"DOC-X003", title:"ISO 9001:2015 Completion — Mohammed Al-Rashid", category:"certificate", empId:"EMP-2510", empName:"Mohammed Al-Rashid", issuedDate:"15 May 2026", expiryDate:"15 May 2029", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:true, notes:"Completed CRS-001 ISO 9001:2015 Quality Management." },
  { docId:"DOC-X004", title:"Workplace Safety Certificate — Suresh Iyer", category:"certificate", empId:"EMP-2731", empName:"Suresh Iyer",        issuedDate:"10 Apr 2026", expiryDate:"10 Apr 2028", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:true, notes:"Completed CRS-004 Workplace Safety & Emergency Response." },
  { docId:"DOC-X005", title:"Workplace Safety Certificate — Karim El-Sayed", category:"certificate", empId:"EMP-3722", empName:"Karim El-Sayed",   issuedDate:"10 Apr 2026", expiryDate:"10 Apr 2028", status:"active", fileSizeMB:0.3, signedByEmp:false, signedByHR:true, notes:"Completed CRS-004 Workplace Safety & Emergency Response. Fleet driver mandatory." },

  // NDAs
  { docId:"DOC-N001", title:"Confidentiality & NDA — Anna Petrović",     category:"nda", empId:"EMP-3611", empName:"Anna Petrović",  issuedDate:"10 Mar 2024", expiryDate:"", status:"active", fileSizeMB:0.3, signedByEmp:true, signedByHR:true, notes:"Marketing NDA covering campaign data, client lists, and brand strategy." },
  { docId:"DOC-N002", title:"IP & NDA Agreement — Mei Ling Tan",         category:"nda", empId:"EMP-3801", empName:"Mei Ling Tan",   issuedDate:"01 Jul 2023", expiryDate:"", status:"active", fileSizeMB:0.3, signedByEmp:true, signedByHR:true, notes:"IP assignment + NDA for product design and trade secrets." },

  // Letters
  { docId:"DOC-L001", title:"Probation Confirmation — Yusuf Bello",     category:"letter", empId:"EMP-3508", empName:"Yusuf Bello",   issuedDate:"05 May 2026", expiryDate:"", status:"pending_signature", fileSizeMB:0.2, signedByEmp:false, signedByHR:true, notes:"30-day probation review passed. Awaiting employee signature to confirm continued employment." },
  { docId:"DOC-L002", title:"Experience Letter — Aisha Khoury",         category:"letter", empId:"EMP-3204", empName:"Aisha Khoury",  issuedDate:"20 May 2026", expiryDate:"", status:"pending_signature", fileSizeMB:0.2, signedByEmp:false, signedByHR:true, notes:"Requested by employee for offboarding. Awaiting final sign-off by Hassan Al-Khoury." },
  { docId:"DOC-L003", title:"Salary Amendment Letter — Suresh Iyer",   category:"letter", empId:"EMP-2731", empName:"Suresh Iyer",   issuedDate:"15 Jan 2024", expiryDate:"", status:"active",           fileSizeMB:0.2, signedByEmp:true, signedByHR:true, notes:"Annual increment 8%. Effective 01 Feb 2024." },
];

// ── Training & Learning ───────────────────────────────────────────────────────
const ALL_EMPS = ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3508","EMP-3611","EMP-3722","EMP-3801","EMP-3905"];

const courses = [
  {
    courseId: "CRS-001", title: "ISO 9001:2015 Quality Management", cat: "compliance", status: "mandatory",
    duration: "8h", provider: "Internal", dueDate: "31 May 2026",
    desc: "Covers the requirements of ISO 9001:2015 including quality management principles, process approach, and audit readiness.",
    enrolledEmpIds: ALL_EMPS,
    completedEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3122","EMP-3318","EMP-3401","EMP-3905"],
  },
  {
    courseId: "CRS-002", title: "AWS Solutions Architect Associate", cat: "technical", status: "active",
    duration: "40h", provider: "AWS", dueDate: "",
    desc: "Prepares engineers for the AWS SAA-C03 certification. Covers EC2, S3, RDS, Lambda, VPC, and cloud architecture best practices.",
    enrolledEmpIds: ["EMP-3001","EMP-3122","EMP-3801","EMP-2451"],
    completedEmpIds: ["EMP-3001"],
  },
  {
    courseId: "CRS-003", title: "Leadership Essentials for Managers", cat: "leadership", status: "active",
    duration: "12h", provider: "LinkedIn Learning", dueDate: "",
    desc: "Core leadership skills including giving feedback, managing performance, running effective meetings, and building psychological safety.",
    enrolledEmpIds: ["EMP-2510","EMP-2390","EMP-2840","EMP-2912","EMP-2602","EMP-3122","EMP-3318"],
    completedEmpIds: ["EMP-2390","EMP-2840","EMP-3318"],
  },
  {
    courseId: "CRS-004", title: "Workplace Safety & Emergency Response", cat: "safety", status: "mandatory",
    duration: "4h", provider: "HSE Partner", dueDate: "15 Jun 2026",
    desc: "Covers UAE HSE regulations, fire evacuation procedures, first aid basics, and incident reporting requirements.",
    enrolledEmpIds: ALL_EMPS,
    completedEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3001","EMP-3122","EMP-3318","EMP-3401","EMP-3611","EMP-3722","EMP-3905"],
  },
  {
    courseId: "CRS-005", title: "Excel for Finance Professionals", cat: "technical", status: "active",
    duration: "6h", provider: "Udemy", dueDate: "",
    desc: "Advanced Excel techniques for financial modelling, pivot tables, VLOOKUP/XLOOKUP, Power Query, and dashboard creation.",
    enrolledEmpIds: ["EMP-2602","EMP-3401","EMP-2451","EMP-3905","EMP-2731"],
    completedEmpIds: ["EMP-2602","EMP-3401","EMP-2451","EMP-3905"],
  },
  {
    courseId: "CRS-006", title: "Unconscious Bias & Inclusion", cat: "soft", status: "active",
    duration: "3h", provider: "Internal", dueDate: "",
    desc: "Raises awareness of unconscious bias, builds inclusive communication habits, and aligns teams with Meridian's DEI commitments.",
    enrolledEmpIds: ["EMP-2840","EMP-2390","EMP-3611","EMP-3801","EMP-3122","EMP-2602"],
    completedEmpIds: ["EMP-2840","EMP-2390","EMP-3801","EMP-3122"],
  },
  {
    courseId: "CRS-007", title: "UAE Labour Law 2024 Update", cat: "compliance", status: "mandatory",
    duration: "2h", provider: "Internal", dueDate: "20 Jun 2026",
    desc: "Key changes in Federal Decree-Law No. 33 of 2021 and 2024 amendments covering employment contracts, leave, gratuity, and termination.",
    enrolledEmpIds: ALL_EMPS,
    completedEmpIds: ["EMP-2451","EMP-2390","EMP-2510","EMP-2602","EMP-2731","EMP-2840","EMP-2912","EMP-3122","EMP-3204","EMP-3318","EMP-3401","EMP-3905"],
  },
  {
    courseId: "CRS-008", title: "Product Roadmap & OKR Planning", cat: "product", status: "upcoming",
    duration: "5h", provider: "Internal", dueDate: "01 Jul 2026",
    desc: "Introduces the OKR framework, roadmap prioritisation techniques, and cross-functional alignment practices for product and business leaders.",
    enrolledEmpIds: [],
    completedEmpIds: [],
  },
  {
    courseId: "CRS-009", title: "Public Speaking & Presentation", cat: "soft", status: "active",
    duration: "8h", provider: "Toastmasters", dueDate: "",
    desc: "Practical public speaking workshops covering structure, delivery, slide design, Q&A handling, and executive presence.",
    enrolledEmpIds: ["EMP-2390","EMP-2840","EMP-3611","EMP-3122","EMP-3801"],
    completedEmpIds: ["EMP-2390"],
  },
  {
    courseId: "CRS-010", title: "Advanced SQL for Analytics", cat: "technical", status: "completed",
    duration: "10h", provider: "Coursera", dueDate: "",
    desc: "Deep dive into window functions, CTEs, query optimisation, and analytical SQL patterns for data-driven decision making.",
    enrolledEmpIds: ["EMP-3001","EMP-3122","EMP-3801","EMP-3905"],
    completedEmpIds: ["EMP-3001","EMP-3122","EMP-3801","EMP-3905"],
  },
];

// ── Performance & Appraisal ───────────────────────────────────────────────────
const reviewCycles = [
  {
    cycleId:  "CYC-H1-2026",
    name:     "H1 2026 Performance Review",
    period:   "Jan – Jun 2026",
    deadline: "30 Jun 2026",
    status:   "active",
  },
];

const appraisals = [
  { appraisalId:"APR-2451", cycleId:"CYC-H1-2026", empId:"EMP-2451", empName:"Aarav Sharma",       dept:"Operations",       role:"Senior Logistics Coordinator",  avatar:{bg:"#F4DDE8",fg:"#6F1947"}, rating:4, reviewStatus:"completed", managerComment:"Strong delivery on the Jebel Ali KPIs. Focus on delegation in H2.", selfComment:"Proud of the team efficiency gains. Want to develop leadership skills.", goals:[{label:"Reduce dispatch errors to <2%",progress:100,due:"30 Jun 2026"},{label:"Complete Logistics L5 certification",progress:80,due:"30 Jun 2026"},{label:"Mentor 2 junior coordinators",progress:60,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2390", cycleId:"CYC-H1-2026", empId:"EMP-2390", empName:"Layla Haddad",        dept:"Sales",            role:"Sales Director",                avatar:{bg:"#F5989D",fg:"#42102B"}, rating:5, reviewStatus:"completed", managerComment:"Exceptional quarter — 122% of target. A genuine driver of revenue growth.", selfComment:"Q1 commission campaign exceeded expectations. Targeting 130% in H2.", goals:[{label:"Achieve AED 28M revenue target",progress:100,due:"30 Jun 2026"},{label:"Expand GCC client base by 8 accounts",progress:100,due:"30 Jun 2026"},{label:"Build Sales playbook documentation",progress:90,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2510", cycleId:"CYC-H1-2026", empId:"EMP-2510", empName:"Mohammed Al-Rashid",  dept:"Operations",       role:"Head of Operations",            avatar:{bg:"#FBE2EC",fg:"#6F1947"}, rating:5, reviewStatus:"completed", managerComment:"Transformed the ops model with the hub-and-spoke pilot. Outstanding leadership.", selfComment:"The Jebel Ali consolidation delivered real cost savings. Next focus: Al Quoz.", goals:[{label:"Launch hub-and-spoke pilot",progress:100,due:"30 Jun 2026"},{label:"Reduce operational cost by 8%",progress:100,due:"30 Jun 2026"},{label:"Cross-train 5 team leads",progress:85,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2602", cycleId:"CYC-H1-2026", empId:"EMP-2602", empName:"Priya Menon",          dept:"Finance",          role:"Finance Manager",              avatar:{bg:"#E8F5EE",fg:"#136138"}, rating:4, reviewStatus:"completed", managerComment:"Reliable and thorough. Payroll compliance spotless. Treasury exposure reduced.", selfComment:"Happy with the WPS process improvements. Looking to implement BI dashboards.", goals:[{label:"Zero payroll compliance failures",progress:100,due:"30 Jun 2026"},{label:"Reduce FX exposure by 15%",progress:75,due:"30 Jun 2026"},{label:"Implement finance BI dashboard",progress:40,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2731", cycleId:"CYC-H1-2026", empId:"EMP-2731", empName:"Suresh Iyer",          dept:"Warehouse",        role:"Warehouse Operations Lead",    avatar:{bg:"#FCF2E1",fg:"#8B560A"}, rating:3, reviewStatus:"completed", managerComment:"Meets expectations. Pick accuracy improved but overtime spend remains above budget.", selfComment:"The Q1 peak was challenging. I need better forecasting support from ops.", goals:[{label:"Maintain >99.5% pick accuracy",progress:100,due:"30 Jun 2026"},{label:"Reduce overtime by 20%",progress:45,due:"30 Jun 2026"},{label:"Complete WMS upgrade training",progress:65,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2840", cycleId:"CYC-H1-2026", empId:"EMP-2840", empName:"Fatima Al-Mansoori",   dept:"People & Culture", role:"Head of People & Culture",     avatar:{bg:"#F4DDE8",fg:"#6F1947"}, rating:5, reviewStatus:"completed", managerComment:"The onboarding revamp and engagement score improvements speak for themselves.", selfComment:"Very proud of the ENPS improvement. The benefits redesign took 6 months but delivered.", goals:[{label:"Improve ENPS by +12 points",progress:100,due:"30 Jun 2026"},{label:"Reduce time-to-hire to 28 days",progress:100,due:"30 Jun 2026"},{label:"Launch learning platform (SkillApex)",progress:80,due:"30 Jun 2026"}] },
  { appraisalId:"APR-2912", cycleId:"CYC-H1-2026", empId:"EMP-2912", empName:"Omar Hashim",           dept:"Fleet",            role:"Fleet Manager",                avatar:{bg:"#E8EFF8",fg:"#163E73"}, rating:4, reviewStatus:"completed", managerComment:"Fleet utilization at all-time high. Fuel cost per km down 6%. Strong year.", selfComment:"Proud of the EV pilot results. Looking to expand to 20 vehicles in H2.", goals:[{label:"Achieve 92% fleet utilization",progress:100,due:"30 Jun 2026"},{label:"Reduce fuel cost per km by 8%",progress:75,due:"30 Jun 2026"},{label:"Complete EV pilot (10 vehicles)",progress:100,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3122", cycleId:"CYC-H1-2026", empId:"EMP-3122", empName:"Daniyal Khan",           dept:"Technology",       role:"Engineering Manager",          avatar:{bg:"#FBE2EC",fg:"#6F1947"}, rating:4, reviewStatus:"completed", managerComment:"Delivered the HRM platform on time. Engineering quality improved significantly.", selfComment:"The team grew and delivered. Sad to be leaving — I'm proud of what we built.", goals:[{label:"Ship HRM platform v1.0",progress:100,due:"30 Jun 2026"},{label:"Improve code coverage to 75%",progress:80,due:"30 Jun 2026"},{label:"Grow team by 2 engineers",progress:50,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3318", cycleId:"CYC-H1-2026", empId:"EMP-3318", empName:"Hassan Al-Khoury",       dept:"Legal & PRO",      role:"Head of Legal & PRO",          avatar:{bg:"#F4DDE8",fg:"#6F1947"}, rating:5, reviewStatus:"completed", managerComment:"Zero compliance breaches. Negotiated 3 major contracts saving AED 1.4M.", selfComment:"The visa automation project cut PRO turnaround by 40%. Target: 50% in H2.", goals:[{label:"Zero regulatory compliance issues",progress:100,due:"30 Jun 2026"},{label:"Automate PRO process end-to-end",progress:80,due:"30 Jun 2026"},{label:"Renew all expiring visas before Q2",progress:60,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3801", cycleId:"CYC-H1-2026", empId:"EMP-3801", empName:"Mei Ling Tan",           dept:"Technology",       role:"Product Designer",             avatar:{bg:"#E8F5EE",fg:"#136138"}, rating:4, reviewStatus:"completed", managerComment:"Design quality is exceptional. HRM UI is the best internal tool we've shipped.", selfComment:"Really enjoyed the design system work. Want to expand into UX research.", goals:[{label:"Ship Meridian design system v1",progress:100,due:"30 Jun 2026"},{label:"Run 4 user research sessions",progress:75,due:"30 Jun 2026"},{label:"Improve SUS score to 82+",progress:90,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3905", cycleId:"CYC-H1-2026", empId:"EMP-3905", empName:"Tariq Bashir",           dept:"Operations",       role:"Logistics Analyst",            avatar:{bg:"#E8EFF8",fg:"#163E73"}, rating:3, reviewStatus:"completed", managerComment:"Solid analytical work. Reporting is timely and accurate. Needs to take more initiative.", selfComment:"Settled in well. Want to lead the route optimisation project next quarter.", goals:[{label:"Deliver weekly ops reports on time",progress:100,due:"30 Jun 2026"},{label:"Build route-optimisation model",progress:50,due:"30 Jun 2026"},{label:"Shadow Senior Coordinator for 30 days",progress:100,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3001", cycleId:"CYC-H1-2026", empId:"EMP-3001", empName:"Chen Wei",               dept:"Technology",       role:"Software Engineer II",         avatar:{bg:"#E8F5EE",fg:"#136138"}, rating:3, reviewStatus:"in_progress", managerComment:"", selfComment:"On leave for part of H1 but shipped the shifts module. Back and motivated.", goals:[{label:"Deliver shifts & schedule module",progress:100,due:"30 Jun 2026"},{label:"Achieve 80% test coverage",progress:60,due:"30 Jun 2026"},{label:"Complete AWS Solutions Architect cert",progress:30,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3204", cycleId:"CYC-H1-2026", empId:"EMP-3204", empName:"Aisha Khoury",           dept:"Legal & PRO",      role:"PRO Officer",                  avatar:{bg:"#FCF2E1",fg:"#8B560A"}, rating:3, reviewStatus:"in_progress", managerComment:"", selfComment:"", goals:[{label:"Clear visa backlog by end June",progress:55,due:"30 Jun 2026"},{label:"Complete PRO certification Level 2",progress:40,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3401", cycleId:"CYC-H1-2026", empId:"EMP-3401", empName:"Reema Kapoor",           dept:"Finance",          role:"Junior Accountant",            avatar:{bg:"#E8F5EE",fg:"#136138"}, rating:3, reviewStatus:"in_progress", managerComment:"", selfComment:"First full cycle — excited to show what I can do.", goals:[{label:"Complete month-end close independently",progress:70,due:"30 Jun 2026"},{label:"Zero accounts reconciliation errors",progress:80,due:"30 Jun 2026"},{label:"Obtain CIPA Level 1",progress:25,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3611", cycleId:"CYC-H1-2026", empId:"EMP-3611", empName:"Anna Petrović",          dept:"Sales",            role:"Marketing Coordinator",        avatar:{bg:"#FBE2EC",fg:"#6F1947"}, rating:4, reviewStatus:"in_progress", managerComment:"", selfComment:"On leave but goals are clear. Will submit self-review on return.", goals:[{label:"Launch 2 digital campaigns",progress:50,due:"30 Jun 2026"},{label:"Grow LinkedIn followers by 30%",progress:65,due:"30 Jun 2026"}] },
  { appraisalId:"APR-3508", cycleId:"CYC-H1-2026", empId:"EMP-3508", empName:"Yusuf Bello",            dept:"Warehouse",        role:"Warehouse Associate",          avatar:{bg:"#E8EFF8",fg:"#163E73"}, rating:null, reviewStatus:"not_started", managerComment:"", selfComment:"", goals:[] },
  { appraisalId:"APR-3722", cycleId:"CYC-H1-2026", empId:"EMP-3722", empName:"Karim El-Sayed",         dept:"Fleet",            role:"Truck Driver — Heavy",         avatar:{bg:"#FBEAEC",fg:"#841422"}, rating:null, reviewStatus:"not_started", managerComment:"", selfComment:"", goals:[] },
];

const orgGoals = [
  { goalId:"OG-001", cycleId:"CYC-H1-2026", label:"Achieve AED 55M revenue (H1)",       progress:82, due:"30 Jun 2026", owner:"Layla Haddad",       status:"on_track"  },
  { goalId:"OG-002", cycleId:"CYC-H1-2026", label:"Reduce operational cost by 8%",       progress:67, due:"30 Jun 2026", owner:"Mohammed Al-Rashid", status:"on_track"  },
  { goalId:"OG-003", cycleId:"CYC-H1-2026", label:"Ship Meridian HRM platform v1.0",     progress:95, due:"30 Jun 2026", owner:"Daniyal Khan",        status:"on_track"  },
  { goalId:"OG-004", cycleId:"CYC-H1-2026", label:"Hire 40+ employees across all depts", progress:55, due:"30 Jun 2026", owner:"Fatima Al-Mansoori",  status:"at_risk"   },
  { goalId:"OG-005", cycleId:"CYC-H1-2026", label:"Zero visa/EID compliance failures",   progress:40, due:"30 Jun 2026", owner:"Hassan Al-Khoury",    status:"at_risk"   },
];

// ── Attendance Records (per-employee, per-day) ────────────────────────────────
function makeAttStatus(empId, empStatus) {
  if (empStatus === "on-leave") return "leave";
  if (empStatus === "inactive") return "absent";
  const h = empId.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const n = h % 18;
  if (n <= 1)  return "late";
  if (n === 2) return "wfh";
  if (n === 17) return "absent";
  return "present";
}

function makeClockIn(empId, status) {
  if (["leave", "absent", "wfh"].includes(status)) return "";
  const h = empId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (status === "late") {
    const lateMin = 35 + (h % 55);
    const hh = 9 + Math.floor(lateMin / 60);
    const mm = String(lateMin % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  const totalMin = 450 + (h % 75);
  return `${Math.floor(totalMin / 60)}:${String(totalMin % 60).padStart(2, "0")}`;
}

function makeClockOut(empId, status) {
  if (["leave", "absent"].includes(status)) return "";
  if (status === "wfh") return "18:00";
  const h = empId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const extra = h % 90;
  const total = 1020 + extra; // 17:00 base in minutes
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function makeHours(empId, status) {
  if (["leave", "absent"].includes(status)) return "";
  if (status === "wfh") return "8:00";
  const h = empId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  if (status === "late") {
    const lateMin = 35 + (h % 55);
    const worked = 540 - lateMin;
    return `${Math.floor(worked / 60)}:${String(worked % 60).padStart(2, "0")}`;
  }
  const extra = h % 90;
  const total = 480 + extra;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

// Generate records for the past 7 days + today
function buildAttendanceRecords(emps) {
  const records = [];
  const today = new Date("2026-05-21");
  for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    // Skip weekends for most employees
    emps.forEach(emp => {
      // Use slightly different hash per day so statuses vary
      const dayHash = emp.empId + dateStr;
      const h = dayHash.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
      let status = makeAttStatus(emp.empId, emp.status);
      // On weekends, most are off (not absent)
      if (dow === 0 || dow === 6) {
        const weekend = h % 10;
        status = weekend < 2 ? "present" : weekend === 2 ? "leave" : "absent";
      } else {
        // Vary day-to-day using date in hash
        const dayN = h % 20;
        if (emp.status === "on-leave") status = "leave";
        else if (emp.status === "inactive") status = "absent";
        else if (dayN <= 1)  status = "late";
        else if (dayN === 2) status = "wfh";
        else if (dayN === 18 || dayN === 19) status = "absent";
        else status = "present";
      }
      records.push({
        recordId:    `ATT-${emp.empId}-${dateStr}`,
        date:        dateStr,
        empId:       emp.empId,
        name:        emp.name,
        dept:        emp.dept || "",
        role:        emp.title || emp.role || "",
        status,
        clockIn:     makeClockIn(emp.empId, status),
        clockOut:    makeClockOut(emp.empId, status),
        hoursWorked: makeHours(emp.empId, status),
        location:    emp.location || "",
        notes:       "",
        avatar:      emp.av || { bg: "#F4DDE8", fg: "#6F1947" },
      });
    });
  }
  return records;
}

async function seed() {
  await connectDB();

  console.log("🗑️  Clearing existing data...");
  await Promise.all([
    Department.deleteMany({}),
    Employee.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Opening.deleteMany({}),
    Candidate.deleteMany({}),
    PayrollRun.deleteMany({}),
    Renewal.deleteMany({}),
    Activity.deleteMany({}),
    LeaveType.deleteMany({}),
    AttendanceDay.deleteMany({}),
    HeadcountSnapshot.deleteMany({}),
    CalendarEvent.deleteMany({}),
    User.deleteMany({}),
    Onboarding.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Benefit.deleteMany({}),
    Shift.deleteMany({}),
    Expense.deleteMany({}),
    Document.deleteMany({}),
    Course.deleteMany({}),
    ReviewCycle.deleteMany({}),
    Appraisal.deleteMany({}),
    OrgGoal.deleteMany({}),
  ]);

  console.log("🌱 Seeding...");
  await Department.insertMany(departments);
  console.log(`   ✓ ${departments.length} departments`);

  await Employee.insertMany(employees);
  console.log(`   ✓ ${employees.length} employees`);

  await LeaveRequest.insertMany(leaveRequests);
  console.log(`   ✓ ${leaveRequests.length} leave requests`);

  await Opening.insertMany(openings);
  console.log(`   ✓ ${openings.length} job openings`);

  await Candidate.insertMany(candidates);
  console.log(`   ✓ ${candidates.length} candidates`);

  await PayrollRun.create(payrollRun);
  console.log(`   ✓ 1 payroll run (May 2026)`);

  await Renewal.insertMany(renewals);
  console.log(`   ✓ ${renewals.length} renewals`);

  await Activity.insertMany(activity);
  console.log(`   ✓ ${activity.length} activity entries`);

  await LeaveType.insertMany(leaveTypes);
  console.log(`   ✓ ${leaveTypes.length} leave types`);

  await AttendanceDay.create(attendanceDay);
  console.log(`   ✓ 1 attendance day (2026-05-21)`);

  await HeadcountSnapshot.insertMany(headcountSnapshots);
  console.log(`   ✓ ${headcountSnapshots.length} headcount snapshots`);

  await CalendarEvent.insertMany(calendarEvents);
  console.log(`   ✓ ${calendarEvents.length} calendar events`);

  for (const u of defaultUsers) await User.create(u);
  console.log(`   ✓ ${defaultUsers.length} users`);

  await Onboarding.insertMany(onboardingRecords);
  console.log(`   ✓ ${onboardingRecords.length} onboarding/offboarding records`);

  const attRecords = buildAttendanceRecords(employees);
  await AttendanceRecord.insertMany(attRecords);
  console.log(`   ✓ ${attRecords.length} attendance records (7 days × ${employees.length} employees)`);

  await Benefit.insertMany(benefits);
  console.log(`   ✓ ${benefits.length} benefit packages`);

  const shiftRecords = buildShiftRecords(employees);
  await Shift.insertMany(shiftRecords);
  console.log(`   ✓ ${shiftRecords.length} shift records (3 weeks × 7 days × ${employees.length} employees)`);

  await Expense.insertMany(expenses);
  console.log(`   ✓ ${expenses.length} expense claims`);

  await Document.insertMany(documents);
  console.log(`   ✓ ${documents.length} documents & contracts`);

  await Course.insertMany(courses);
  console.log(`   ✓ ${courses.length} training courses`);

  await ReviewCycle.insertMany(reviewCycles);
  console.log(`   ✓ ${reviewCycles.length} review cycle`);

  await Appraisal.insertMany(appraisals);
  console.log(`   ✓ ${appraisals.length} appraisals`);

  await OrgGoal.insertMany(orgGoals);
  console.log(`   ✓ ${orgGoals.length} org goals`);

  console.log("\n✅ Seed complete!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
