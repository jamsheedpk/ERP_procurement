/* HRM mock data — Meridian Logistics DMCC, a Dubai mid-size logistics firm */
/* exported to window for all components */

window.HRM_DATA = (function() {

  const today = new Date(2026, 4, 21); // 21 May 2026 to match design system date
  const fmtDate = (d) => {
    const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear();
  };
  const daysFromNow = (d) => Math.round((d - today) / 86400000);

  const company = {
    name: "Meridian Logistics DMCC",
    short: "Meridian",
    handle: "meridian-dmcc",
    headcount: 247,
    activeToday: 218,
    onLeave: 14,
    pendingLeaves: 7,
    expiringDocs: 19,
    openRoles: 6,
    payrollDue: "28 May 2026",
    nextPayroll: "AED 1,842,300",
  };

  const departments = [
    { id: "ops", name: "Operations", lead: "Mohammed Al-Rashid", count: 84, color: "#6F1947" },
    { id: "war", name: "Warehouse", lead: "Suresh Iyer", count: 62, color: "#B61B54" },
    { id: "fle", name: "Fleet", lead: "Omar Hashim", count: 31, color: "#D78A14" },
    { id: "fin", name: "Finance", lead: "Priya Menon", count: 18, color: "#1F8A52" },
    { id: "hr",  name: "People & Culture", lead: "Fatima Al-Mansoori", count: 9, color: "#2563B0" },
    { id: "sal", name: "Sales", lead: "Layla Haddad", count: 22, color: "#534AB7" },
    { id: "tec", name: "Technology", lead: "Daniyal Khan", count: 14, color: "#0F6E56" },
    { id: "leg", name: "Legal & PRO", lead: "Hassan Al-Khoury", count: 7, color: "#854F0B" },
  ];

  const employees = [
    { id: "EMP-2451", name: "Aarav Sharma",        title: "Senior Logistics Coordinator", dept: "Operations", deptId: "ops", grade: "L4", manager: "Mohammed Al-Rashid", email: "aarav.s@meridian.ae", phone: "+971 50 412 8821", location: "Jebel Ali HQ",  joined: "12 Mar 2021", visaExpires: "08 Jun 2026", eidExpires: "14 Feb 2027", contract: "Permanent",   nationality: "India",        salary: 18500, leave: { annual: 12, used: 9 }, status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
    { id: "EMP-2390", name: "Layla Haddad",        title: "Sales Director",               dept: "Sales",      deptId: "sal", grade: "M5", manager: "CEO",                  email: "layla.h@meridian.ae",  phone: "+971 56 778 2210", location: "DIFC Office", joined: "01 Sep 2018", visaExpires: "22 Nov 2026", eidExpires: "22 Nov 2026", contract: "Permanent",   nationality: "Lebanon",      salary: 42000, leave: { annual: 25, used: 11 }, status: "active",   av: { bg: "#F5989D", fg: "#42102B" } },
    { id: "EMP-2510", name: "Mohammed Al-Rashid",  title: "Head of Operations",           dept: "Operations", deptId: "ops", grade: "M5", manager: "CEO",                  email: "m.alrashid@meridian.ae", phone: "+971 52 113 9087", location: "Jebel Ali HQ",  joined: "04 Jan 2017", visaExpires: "—",            eidExpires: "30 Sep 2028", contract: "Permanent",   nationality: "UAE",          salary: 58000, leave: { annual: 30, used: 14 }, status: "active",   av: { bg: "#FBE2EC", fg: "#6F1947" } },
    { id: "EMP-2602", name: "Priya Menon",         title: "Finance Manager",              dept: "Finance",    deptId: "fin", grade: "M4", manager: "CFO",                  email: "priya.m@meridian.ae",  phone: "+971 50 442 9920", location: "DIFC Office", joined: "18 May 2019", visaExpires: "18 May 2027", eidExpires: "18 May 2027", contract: "Permanent",   nationality: "India",        salary: 32000, leave: { annual: 22, used: 7 }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
    { id: "EMP-2731", name: "Suresh Iyer",         title: "Warehouse Operations Lead",    dept: "Warehouse",  deptId: "war", grade: "L5", manager: "Mohammed Al-Rashid", email: "suresh.i@meridian.ae", phone: "+971 55 226 7714", location: "Al Quoz DC",   joined: "22 Jul 2016", visaExpires: "30 May 2026", eidExpires: "30 May 2026", contract: "Permanent",   nationality: "India",        salary: 22000, leave: { annual: 22, used: 5 },  status: "active",   av: { bg: "#FCF2E1", fg: "#8B560A" } },
    { id: "EMP-2840", name: "Fatima Al-Mansoori",  title: "Head of People & Culture",     dept: "People & Culture", deptId: "hr",  grade: "M5", manager: "CEO",         email: "fatima.am@meridian.ae", phone: "+971 50 119 4477", location: "DIFC Office", joined: "11 Oct 2020", visaExpires: "—",            eidExpires: "12 Apr 2029", contract: "Permanent",   nationality: "UAE",          salary: 48000, leave: { annual: 30, used: 8 },  status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
    { id: "EMP-2912", name: "Omar Hashim",         title: "Fleet Manager",                dept: "Fleet",      deptId: "fle", grade: "M4", manager: "Mohammed Al-Rashid", email: "omar.h@meridian.ae",   phone: "+971 56 884 1133", location: "Jebel Ali HQ",  joined: "03 Feb 2019", visaExpires: "14 Jul 2026", eidExpires: "14 Jul 2026", contract: "Permanent",   nationality: "Jordan",       salary: 28500, leave: { annual: 22, used: 6 }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
    { id: "EMP-3001", name: "Chen Wei",            title: "Software Engineer II",         dept: "Technology", deptId: "tec", grade: "L3", manager: "Daniyal Khan",         email: "chen.w@meridian.ae",   phone: "+971 52 991 6648", location: "Remote — Sharjah", joined: "16 Sep 2022", visaExpires: "16 Sep 2027", eidExpires: "16 Sep 2027", contract: "Permanent",   nationality: "Singapore",    salary: 24000, leave: { annual: 22, used: 4 }, status: "on-leave", av: { bg: "#E8F5EE", fg: "#136138" } },
    { id: "EMP-3122", name: "Daniyal Khan",        title: "Engineering Manager",          dept: "Technology", deptId: "tec", grade: "M4", manager: "CTO",                  email: "daniyal.k@meridian.ae", phone: "+971 50 333 7782", location: "DIFC Office", joined: "08 Aug 2017", visaExpires: "08 Aug 2026", eidExpires: "08 Aug 2026", contract: "Permanent",   nationality: "Pakistan",     salary: 36000, leave: { annual: 22, used: 12 }, status: "active",   av: { bg: "#FBE2EC", fg: "#6F1947" } },
    { id: "EMP-3204", name: "Aisha Khoury",        title: "PRO Officer",                  dept: "Legal & PRO", deptId: "leg", grade: "L3", manager: "Hassan Al-Khoury",   email: "aisha.k@meridian.ae",  phone: "+971 55 661 2398", location: "Tasheel Centre", joined: "14 Jan 2023", visaExpires: "14 Jan 2026", eidExpires: "14 Jan 2026", contract: "Permanent",   nationality: "Syria",        salary: 14000, leave: { annual: 22, used: 13 }, status: "active",   av: { bg: "#FCF2E1", fg: "#8B560A" } },
    { id: "EMP-3318", name: "Hassan Al-Khoury",    title: "Head of Legal & PRO",          dept: "Legal & PRO", deptId: "leg", grade: "M5", manager: "CEO",                email: "hassan.k@meridian.ae", phone: "+971 50 776 5421", location: "DIFC Office",    joined: "01 Feb 2018", visaExpires: "—",            eidExpires: "01 Feb 2028", contract: "Permanent",   nationality: "UAE",          salary: 52000, leave: { annual: 30, used: 9 }, status: "active",   av: { bg: "#F4DDE8", fg: "#6F1947" } },
    { id: "EMP-3401", name: "Reema Kapoor",        title: "Junior Accountant",            dept: "Finance",    deptId: "fin", grade: "L2", manager: "Priya Menon",          email: "reema.k@meridian.ae",  phone: "+971 56 442 1187", location: "DIFC Office", joined: "20 Nov 2024", visaExpires: "20 Nov 2026", eidExpires: "20 Nov 2026", contract: "Permanent",   nationality: "India",        salary: 11500, leave: { annual: 22, used: 2 }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
    { id: "EMP-3508", name: "Yusuf Bello",         title: "Warehouse Associate",          dept: "Warehouse",  deptId: "war", grade: "L1", manager: "Suresh Iyer",          email: "yusuf.b@meridian.ae",  phone: "+971 56 119 4490", location: "Al Quoz DC",   joined: "05 Jun 2025", visaExpires: "05 Jun 2027", eidExpires: "05 Jun 2027", contract: "Probation",   nationality: "Nigeria",      salary: 4800,  leave: { annual: 22, used: 1 }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
    { id: "EMP-3611", name: "Anna Petrović",       title: "Marketing Coordinator",        dept: "Sales",      deptId: "sal", grade: "L3", manager: "Layla Haddad",         email: "anna.p@meridian.ae",   phone: "+971 50 888 3320", location: "DIFC Office", joined: "10 Mar 2024", visaExpires: "10 Mar 2026", eidExpires: "10 Mar 2026", contract: "Permanent",   nationality: "Serbia",       salary: 16500, leave: { annual: 22, used: 10 }, status: "on-leave", av: { bg: "#FBE2EC", fg: "#6F1947" } },
    { id: "EMP-3722", name: "Karim El-Sayed",      title: "Truck Driver — Heavy",         dept: "Fleet",      deptId: "fle", grade: "L2", manager: "Omar Hashim",          email: "karim.e@meridian.ae",  phone: "+971 50 226 7794", location: "Jebel Ali HQ",  joined: "14 Sep 2023", visaExpires: "14 Sep 2025", eidExpires: "14 Sep 2025", contract: "Permanent",   nationality: "Egypt",        salary: 5400,  leave: { annual: 22, used: 18 }, status: "active",   av: { bg: "#FBEAEC", fg: "#841422" } },
    { id: "EMP-3801", name: "Mei Ling Tan",        title: "Product Designer",             dept: "Technology", deptId: "tec", grade: "L4", manager: "Daniyal Khan",         email: "mei.t@meridian.ae",    phone: "+971 56 119 4421", location: "Remote — Dubai", joined: "01 Jul 2023", visaExpires: "01 Jul 2026", eidExpires: "01 Jul 2026", contract: "Permanent",   nationality: "Malaysia",     salary: 22500, leave: { annual: 22, used: 6 }, status: "active",   av: { bg: "#E8F5EE", fg: "#136138" } },
    { id: "EMP-3905", name: "Tariq Bashir",        title: "Logistics Analyst",            dept: "Operations", deptId: "ops", grade: "L3", manager: "Mohammed Al-Rashid", email: "tariq.b@meridian.ae",   phone: "+971 55 884 2018", location: "Jebel Ali HQ",  joined: "22 Apr 2022", visaExpires: "22 Apr 2026", eidExpires: "22 Apr 2026", contract: "Permanent",   nationality: "Pakistan",     salary: 17500, leave: { annual: 22, used: 7 }, status: "active",   av: { bg: "#E8EFF8", fg: "#163E73" } },
  ];

  // Leave requests — pending and recent
  const leaveTypes = [
    { id: "annual",   name: "Annual leave",     color: "#1F8A52", icon: "palmtree" },
    { id: "sick",     name: "Sick leave",       color: "#C0263A", icon: "thermometer" },
    { id: "hajj",     name: "Hajj leave",       color: "#854F0B", icon: "moon-star" },
    { id: "maternity",name: "Maternity",        color: "#B61B54", icon: "baby" },
    { id: "paternity",name: "Paternity",        color: "#534AB7", icon: "baby" },
    { id: "bereavement",name: "Bereavement",    color: "#5C5156", icon: "heart-handshake" },
    { id: "wfh",      name: "Work from home",   color: "#2563B0", icon: "house" },
    { id: "unpaid",   name: "Unpaid",           color: "#807379", icon: "circle-off" },
  ];

  const leaveRequests = [
    { id: "LR-9281", empId: "EMP-2451", emp: "Aarav Sharma",      dept: "Operations", type: "annual",   typeLbl: "Annual leave",   from: "25 May 2026", to: "29 May 2026", days: 5, reason: "Family wedding in Pune. Cover arranged with Tariq.", status: "pending",  submitted: "18 May 2026", approver: "Mohammed Al-Rashid" },
    { id: "LR-9275", empId: "EMP-3611", emp: "Anna Petrović",     dept: "Sales",      type: "sick",     typeLbl: "Sick leave",     from: "21 May 2026", to: "22 May 2026", days: 2, reason: "Medical certificate attached.",                       status: "pending",  submitted: "21 May 2026", approver: "Layla Haddad" },
    { id: "LR-9270", empId: "EMP-3001", emp: "Chen Wei",          dept: "Technology", type: "wfh",      typeLbl: "Work from home", from: "19 May 2026", to: "23 May 2026", days: 5, reason: "Sprint planning week, focus time.",                   status: "approved", submitted: "12 May 2026", approver: "Daniyal Khan" },
    { id: "LR-9268", empId: "EMP-3204", emp: "Aisha Khoury",      dept: "Legal & PRO",type: "hajj",     typeLbl: "Hajj leave",     from: "01 Jun 2026", to: "21 Jun 2026", days: 21,reason: "Annual Hajj pilgrimage, first time.",                  status: "pending",  submitted: "08 May 2026", approver: "Hassan Al-Khoury" },
    { id: "LR-9261", empId: "EMP-3722", emp: "Karim El-Sayed",    dept: "Fleet",      type: "annual",   typeLbl: "Annual leave",   from: "10 Jun 2026", to: "24 Jun 2026", days: 15,reason: "Return home for two weeks.",                          status: "pending",  submitted: "02 May 2026", approver: "Omar Hashim" },
    { id: "LR-9255", empId: "EMP-3905", emp: "Tariq Bashir",      dept: "Operations", type: "annual",   typeLbl: "Annual leave",   from: "06 May 2026", to: "10 May 2026", days: 5, reason: "Eid travel.",                                          status: "approved", submitted: "20 Apr 2026", approver: "Mohammed Al-Rashid" },
    { id: "LR-9249", empId: "EMP-3401", emp: "Reema Kapoor",      dept: "Finance",    type: "sick",     typeLbl: "Sick leave",     from: "14 May 2026", to: "14 May 2026", days: 1, reason: "—",                                                    status: "approved", submitted: "14 May 2026", approver: "Priya Menon" },
    { id: "LR-9240", empId: "EMP-3508", emp: "Yusuf Bello",       dept: "Warehouse",  type: "annual",   typeLbl: "Annual leave",   from: "01 May 2026", to: "03 May 2026", days: 3, reason: "Personal travel.",                                     status: "declined", submitted: "20 Apr 2026", approver: "Suresh Iyer" },
  ];

  // Recruitment pipeline
  const openings = [
    { id: "JOB-114", role: "Senior Warehouse Manager",  dept: "Warehouse", type: "Full-time",  location: "Al Quoz DC",  posted: "12 May 2026", applicants: 38, stage: { applied: 12, screen: 8, interview: 5, offer: 1, hired: 0 } },
    { id: "JOB-118", role: "Customs Clearance Officer", dept: "Operations", type: "Full-time", location: "Jebel Ali HQ",posted: "03 May 2026", applicants: 27, stage: { applied: 9,  screen: 6, interview: 3, offer: 2, hired: 0 } },
    { id: "JOB-121", role: "Frontend Engineer",         dept: "Technology", type: "Full-time", location: "Remote — UAE",posted: "08 May 2026", applicants: 54, stage: { applied: 18, screen: 11,interview: 6, offer: 1, hired: 1 } },
    { id: "JOB-126", role: "Accounts Receivable",       dept: "Finance",    type: "Full-time", location: "DIFC Office", posted: "15 May 2026", applicants: 19, stage: { applied: 8,  screen: 5, interview: 2, offer: 0, hired: 0 } },
    { id: "JOB-129", role: "Last-mile Delivery Drivers (x4)", dept: "Fleet", type: "Full-time", location: "Jebel Ali HQ", posted: "18 May 2026", applicants: 92, stage: { applied: 41, screen: 22, interview: 11, offer: 4, hired: 2 } },
    { id: "JOB-132", role: "PRO Officer",               dept: "Legal & PRO",type: "Full-time", location: "Tasheel Centre",posted: "19 May 2026", applicants: 8,  stage: { applied: 4, screen: 2, interview: 1, offer: 0, hired: 0 } },
  ];

  const candidates = [
    // For JOB-121 Frontend Engineer — fleshed out for kanban view
    { id: "C-7821", jobId: "JOB-121", role: "Frontend Engineer", name: "Sara Nasser",     stage: "applied",   email: "sara.n@gmail.com",       location: "Dubai",       exp: 4, source: "LinkedIn",   applied: "14 May 2026", rating: 0, av: { bg: "#FBE2EC", fg: "#6F1947" }, tags: ["React","TypeScript"] },
    { id: "C-7825", jobId: "JOB-121", role: "Frontend Engineer", name: "Devansh Rao",     stage: "applied",   email: "devansh@proton.me",      location: "Bangalore",   exp: 6, source: "Referral",   applied: "16 May 2026", rating: 0, av: { bg: "#E8F5EE", fg: "#136138" }, tags: ["React","Next.js"] },
    { id: "C-7828", jobId: "JOB-121", role: "Frontend Engineer", name: "Hala Mansour",    stage: "applied",   email: "hala.m@gmail.com",       location: "Cairo",       exp: 3, source: "Career site",applied: "17 May 2026", rating: 0, av: { bg: "#E8EFF8", fg: "#163E73" }, tags: ["Vue","TS"] },
    { id: "C-7830", jobId: "JOB-121", role: "Frontend Engineer", name: "Marcus Lee",      stage: "screen",    email: "marcus.l@outlook.com",   location: "Singapore",   exp: 7, source: "LinkedIn",   applied: "12 May 2026", rating: 4, av: { bg: "#F5989D", fg: "#42102B" }, tags: ["React","GraphQL"] },
    { id: "C-7832", jobId: "JOB-121", role: "Frontend Engineer", name: "Zainab Al-Bahri", stage: "screen",    email: "zainab.b@gmail.com",     location: "Abu Dhabi",   exp: 5, source: "Career site",applied: "13 May 2026", rating: 5, av: { bg: "#FCF2E1", fg: "#8B560A" }, tags: ["React","Design systems"] },
    { id: "C-7841", jobId: "JOB-121", role: "Frontend Engineer", name: "Olusegun Adeyemi",stage: "interview", email: "ola.a@gmail.com",        location: "Lagos",       exp: 8, source: "LinkedIn",   applied: "08 May 2026", rating: 4, av: { bg: "#E8F5EE", fg: "#136138" }, tags: ["Senior","TS"] },
    { id: "C-7844", jobId: "JOB-121", role: "Frontend Engineer", name: "Rina Ahmed",      stage: "interview", email: "rina.a@hotmail.com",     location: "Dubai",       exp: 6, source: "Referral",   applied: "06 May 2026", rating: 5, av: { bg: "#FBE2EC", fg: "#6F1947" }, tags: ["React","A11y"] },
    { id: "C-7850", jobId: "JOB-121", role: "Frontend Engineer", name: "Pavel Novak",     stage: "offer",     email: "pavel.n@gmail.com",      location: "Prague",      exp: 9, source: "LinkedIn",   applied: "01 May 2026", rating: 5, av: { bg: "#E8EFF8", fg: "#163E73" }, tags: ["Architect"] },
    { id: "C-7855", jobId: "JOB-121", role: "Frontend Engineer", name: "Aisha Banerjee",  stage: "hired",     email: "aisha.b@gmail.com",      location: "Mumbai",      exp: 5, source: "Career site",applied: "20 Apr 2026", rating: 5, av: { bg: "#F4DDE8", fg: "#6F1947" }, tags: ["Joining 02 Jun"] },
  ];

  // Payroll — current run
  const payrollRun = {
    id: "PAY-2026-05",
    period: "May 2026",
    runDate: "28 May 2026",
    headcount: 247,
    gross: 1842300,
    netPay: 1721940,
    deductions: 120360,
    bonuses: 38500,
    status: "draft", // draft | review | approved | paid
    stages: [
      { id: "import",  label: "Inputs imported", done: true,  at: "17 May 2026 09:12" },
      { id: "review",  label: "Variance review", done: true,  at: "19 May 2026 14:30" },
      { id: "approve", label: "CFO approval",     done: false, at: null, due: "26 May 2026" },
      { id: "bank",    label: "WPS bank file",   done: false, at: null, due: "27 May 2026" },
      { id: "payout",  label: "Salaries paid",   done: false, at: null, due: "28 May 2026" },
    ],
    flags: [
      { kind: "warning", dept: "Operations", text: "3 employees have unapproved overtime > 12 hrs",     count: 3 },
      { kind: "danger",  dept: "Legal & PRO", text: "Aisha Khoury — Emirates ID expires before payday", count: 1 },
      { kind: "info",    dept: "Sales",      text: "Layla Haddad — Q1 commission included (AED 18,500)", count: 1 },
    ],
    lines: [
      { empId: "EMP-2510", emp: "Mohammed Al-Rashid", dept: "Operations", base: 58000, allowances: 8000, overtime: 0,    bonus: 0,     deductions: 4200, net: 61800, status: "review" },
      { empId: "EMP-2390", emp: "Layla Haddad",       dept: "Sales",      base: 42000, allowances: 5500, overtime: 0,    bonus: 18500, deductions: 3100, net: 62900, status: "review" },
      { empId: "EMP-2840", emp: "Fatima Al-Mansoori", dept: "People & Culture", base: 48000, allowances: 7000, overtime: 0, bonus: 0, deductions: 3400, net: 51600, status: "ready"  },
      { empId: "EMP-3318", emp: "Hassan Al-Khoury",   dept: "Legal & PRO",type:"",base: 52000, allowances: 7500, overtime: 0, bonus: 0, deductions: 3700, net: 55800, status: "ready"  },
      { empId: "EMP-3122", emp: "Daniyal Khan",       dept: "Technology", base: 36000, allowances: 4500, overtime: 0, bonus: 0, deductions: 2700, net: 37800, status: "ready"  },
      { empId: "EMP-2602", emp: "Priya Menon",        dept: "Finance",    base: 32000, allowances: 4000, overtime: 0, bonus: 2500, deductions: 2500, net: 36000, status: "ready"  },
      { empId: "EMP-2912", emp: "Omar Hashim",        dept: "Fleet",      base: 28500, allowances: 3500, overtime: 0, bonus: 0, deductions: 2100, net: 29900, status: "ready"  },
      { empId: "EMP-2731", emp: "Suresh Iyer",        dept: "Warehouse",  base: 22000, allowances: 2800, overtime: 850, bonus: 0, deductions: 1700, net: 23950, status: "review" },
      { empId: "EMP-3801", emp: "Mei Ling Tan",       dept: "Technology", base: 22500, allowances: 2500, overtime: 0, bonus: 0, deductions: 1750, net: 23250, status: "ready"  },
      { empId: "EMP-3001", emp: "Chen Wei",           dept: "Technology", base: 24000, allowances: 3000, overtime: 0, bonus: 0, deductions: 1850, net: 25150, status: "ready"  },
      { empId: "EMP-2451", emp: "Aarav Sharma",       dept: "Operations", base: 18500, allowances: 2200, overtime: 620, bonus: 0, deductions: 1450, net: 19870, status: "review" },
      { empId: "EMP-3905", emp: "Tariq Bashir",       dept: "Operations", base: 17500, allowances: 2000, overtime: 0, bonus: 0, deductions: 1350, net: 18150, status: "ready"  },
      { empId: "EMP-3611", emp: "Anna Petrović",      dept: "Sales",      base: 16500, allowances: 1800, overtime: 0, bonus: 0, deductions: 1250, net: 17050, status: "ready"  },
      { empId: "EMP-3204", emp: "Aisha Khoury",       dept: "Legal & PRO",base: 14000, allowances: 1600, overtime: 0, bonus: 0, deductions: 1100, net: 14500, status: "blocked" },
      { empId: "EMP-3401", emp: "Reema Kapoor",       dept: "Finance",    base: 11500, allowances: 1400, overtime: 0, bonus: 0, deductions: 920,  net: 11980, status: "ready"  },
      { empId: "EMP-3722", emp: "Karim El-Sayed",     dept: "Fleet",      base: 5400,  allowances: 1200, overtime: 480, bonus: 0, deductions: 450, net: 6630,  status: "ready"  },
      { empId: "EMP-3508", emp: "Yusuf Bello",        dept: "Warehouse",  base: 4800,  allowances: 1100, overtime: 320, bonus: 0, deductions: 380, net: 5840,  status: "ready"  },
    ],
  };

  // Renewals & alerts
  const renewals = [
    { kind: "Emirates ID",  emp: "Aisha Khoury",       empId: "EMP-3204", expires: "14 Jan 2026", days: -127, severity: "danger" },
    { kind: "Visa",         emp: "Karim El-Sayed",     empId: "EMP-3722", expires: "14 Sep 2025", days: -249, severity: "danger" },
    { kind: "Visa",         emp: "Anna Petrović",      empId: "EMP-3611", expires: "10 Mar 2026", days: -72,  severity: "danger" },
    { kind: "Visa",         emp: "Tariq Bashir",       empId: "EMP-3905", expires: "22 Apr 2026", days: -29,  severity: "danger" },
    { kind: "Visa",         emp: "Suresh Iyer",        empId: "EMP-2731", expires: "30 May 2026", days: 9,    severity: "warning" },
    { kind: "Visa",         emp: "Aarav Sharma",       empId: "EMP-2451", expires: "08 Jun 2026", days: 18,   severity: "warning" },
    { kind: "Mei Ling Tan", emp: "Mei Ling Tan",       empId: "EMP-3801", expires: "01 Jul 2026", days: 41,   severity: "warning" },
    { kind: "Visa",         emp: "Omar Hashim",        empId: "EMP-2912", expires: "14 Jul 2026", days: 54,   severity: "info" },
    { kind: "Visa",         emp: "Daniyal Khan",       empId: "EMP-3122", expires: "08 Aug 2026", days: 79,   severity: "info" },
  ];

  // Activity feed
  const activity = [
    { when: "Today, 10:42", who: "Layla Haddad",         what: "Approved leave request for Tariq Bashir (Eid travel)", icon: "check", kind: "succ" },
    { when: "Today, 09:18", who: "Aisha Khoury",         what: "Submitted Hajj leave request — 21 days starting 01 Jun", icon: "calendar-plus", kind: "info" },
    { when: "Today, 08:55", who: "System",               what: "Visa renewal reminder sent to Karim El-Sayed via WhatsApp", icon: "message-circle", kind: "warn" },
    { when: "Yesterday",    who: "Priya Menon",          what: "Closed May payroll inputs — 247 employees, AED 1.84M gross", icon: "wallet", kind: "brand" },
    { when: "Yesterday",    who: "Daniyal Khan",         what: "Moved Pavel Novak to Offer stage for Frontend Engineer", icon: "user-check", kind: "succ" },
    { when: "19 May",       who: "Fatima Al-Mansoori",   what: "Onboarding kickoff for Yusuf Bello — checklist 60% complete", icon: "door-open", kind: "info" },
    { when: "18 May",       who: "Mohammed Al-Rashid",   what: "Approved performance review cycle for Operations (Q2)",     icon: "chart-bar", kind: "brand" },
  ];

  // Onboarding checklists for new hire
  const onboarding = [
    { phase: "Pre-arrival", items: [
      { t: "Offer signed",                done: true },
      { t: "Visa & work permit applied",  done: true },
      { t: "Emirates ID appointment",     done: true },
      { t: "Welcome email sent",          done: true },
    ]},
    { phase: "Day 1",       items: [
      { t: "Workspace assigned",          done: true },
      { t: "Laptop + access cards",       done: true },
      { t: "HR orientation completed",    done: false, blocked: true },
      { t: "Team intro lunch",            done: false },
    ]},
    { phase: "First 30 days", items: [
      { t: "Mandatory training (Safety, Compliance)", done: false },
      { t: "Manager 1:1 cadence set",                  done: false },
      { t: "Probation goals agreed",                   done: false },
      { t: "Benefits enrolment",                       done: false },
    ]},
  ];

  // Holidays + leave-on-day for May
  const monthEvents = {
    // day-of-month: array of { kind, label }
    1:  [{ kind: "holiday", label: "Labour Day" }],
    6:  [{ kind: "leave",   label: "Tariq B." }, { kind: "leave", label: "+1" }],
    7:  [{ kind: "leave",   label: "Tariq B." }],
    8:  [{ kind: "leave",   label: "Tariq B." }],
    9:  [{ kind: "leave",   label: "Tariq B." }],
    10: [{ kind: "leave",   label: "Tariq B." }],
    14: [{ kind: "leave",   label: "Reema K." }],
    19: [{ kind: "wfh",     label: "Chen W." }],
    20: [{ kind: "wfh",     label: "Chen W." }],
    21: [{ kind: "wfh",     label: "Chen W." }, { kind: "event", label: "Town hall" }],
    22: [{ kind: "wfh",     label: "Chen W." }],
    23: [{ kind: "wfh",     label: "Chen W." }],
    25: [{ kind: "leave",   label: "Aarav S." }],
    26: [{ kind: "leave",   label: "Aarav S." }],
    27: [{ kind: "leave",   label: "Aarav S." }, { kind: "event", label: "Payday eve" }],
    28: [{ kind: "leave",   label: "Aarav S." }, { kind: "event", label: "Payroll run" }],
    29: [{ kind: "leave",   label: "Aarav S." }],
  };

  // Headcount over time (12 months)
  const headcountTrend = [
    { m: "Jun '25", v: 198 }, { m: "Jul", v: 204 }, { m: "Aug", v: 209 }, { m: "Sep", v: 215 },
    { m: "Oct", v: 220 }, { m: "Nov", v: 224 }, { m: "Dec", v: 226 }, { m: "Jan '26", v: 230 },
    { m: "Feb", v: 234 }, { m: "Mar", v: 239 }, { m: "Apr", v: 243 }, { m: "May", v: 247 },
  ];

  // Attendance breakdown today
  const attendanceToday = [
    { lbl: "Checked in", v: 198, c: "#1F8A52" },
    { lbl: "Late",       v:  14, c: "#D78A14" },
    { lbl: "WFH",        v:   6, c: "#2563B0" },
    { lbl: "On leave",   v:  14, c: "#B61B54" },
    { lbl: "No-show",    v:   3, c: "#C0263A" },
  ];

  return {
    today, fmtDate, daysFromNow,
    company, departments, employees, leaveTypes, leaveRequests,
    openings, candidates, payrollRun, renewals, activity, onboarding,
    monthEvents, headcountTrend, attendanceToday,
  };
})();
