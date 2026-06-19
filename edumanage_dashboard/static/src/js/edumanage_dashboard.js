/** @odoo-module **/
import { Component, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { router, routerBus } from "@web/core/browser/router";

// ─── Static Data ──────────────────────────────────────────────────────────────

const QUOTES = [
  "Education is not preparation for life; education is life itself.",
  "The roots of education are bitter, but the fruit is sweet.",
  "An investment in knowledge pays the best interest.",
  "Teaching is the greatest act of optimism.",
  "Every student can learn, just not on the same day, or in the same way.",
  "A good teacher can inspire hope, ignite the imagination, and instil love of learning.",
  "The beautiful thing about learning is that no one can take it away from you.",
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", iconPath: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>` },
  { id: "institution", label: "Institution", iconPath: `<path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>` },
  { id: "students",  label: "Students",  iconPath: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
  { id: "attendance",label: "Attendance",iconPath: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
  { id: "fees",      label: "Fees",      iconPath: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` },
  { id: "documents", label: "Documents", iconPath: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>` },
  { id: "reports",   label: "Reports",   iconPath: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>` },
  { id: "timetable", label: "Timetable", iconPath: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` },
  { id: "settings",  label: "Settings",  iconPath: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>` },
];

const METRICS = [
  { id: "students",   label: "Total Students",         value: "1,284", prefix: "",    trend: "+12 this month",        accent: "positive", critical: false, iconPath: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
  { id: "classes",    label: "Classes / Batches",      value: "34",    prefix: "",    trend: null,                    accent: "neutral",  critical: false, iconPath: `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>` },
  { id: "attendance", label: "Today's Attendance",     value: "91%",   prefix: "",    trend: "3 classes pending",     accent: "neutral",  critical: false, trendWarn: true, iconPath: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
  { id: "fees_due",   label: "Pending Fees",           value: "2,84,500", prefix: "₹", trend: "47 students",        accent: "warn",     critical: true,  trendWarn: true, iconPath: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` },
  { id: "collected",  label: "Today's Collections",    value: "18,200", prefix: "₹", trend: "+₹3,200 vs. yesterday", accent: "positive", critical: true,  iconPath: `<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>` },
  { id: "admissions", label: "New Admissions / Month", value: "12",    prefix: "",    trend: "+3 this week",          accent: "positive", critical: false, iconPath: `<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>` },
];

const SHORTCUTS = [
  { id: "students",   label: "Students",   desc: "Manage enrolments",  iconPath: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>` },
  { id: "attendance", label: "Attendance", desc: "Daily class records", iconPath: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
  { id: "fees",       label: "Fees",       desc: "Collect & track",    iconPath: `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>` },
  { id: "documents",  label: "Documents",  desc: "Files & certificates",iconPath: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>` },
  { id: "reports",    label: "Reports",    desc: "Analytics & exports", iconPath: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>` },
  { id: "timetable",  label: "Timetable",  desc: "Class schedules",    iconPath: `<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>` },
  { id: "comms",      label: "Communication", desc: "Notices & messages", iconPath: `<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>` },
  { id: "settings",   label: "Settings",   desc: "System preferences", iconPath: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>` },
];

const ACTIVITY = [
  { id: 1, title: "Arjun Kumar admitted — Class 10A",         color: "green", minutesAgo: 2 },
  { id: 2, title: "Fee collected — Priya Mehta · ₹8,500",    color: "",      minutesAgo: 14 },
  { id: 3, title: "Attendance marked — Class 9B · 94%",        color: "green", minutesAgo: 22 },
  { id: 4, title: "Attendance marked — Class 8A · 88%",        color: "green", minutesAgo: 35 },
  { id: 5, title: "Fee collected — Rahul Verma · ₹5,200",     color: "",      minutesAgo: 58 },
  { id: 6, title: "Document uploaded — Transfer Certificate", color: "slate", minutesAgo: 72 },
  { id: 7, title: "New admission — Sneha Rao · Class 6",       color: "green", minutesAgo: 95 },
  { id: 8, title: "Fee overdue notice sent — 8 students",      color: "amber", minutesAgo: 120 },
];

const STUDENTS_DATA = [
  { id: 1,  name: "Arjun Kumar",    studentId: "EDU-2026-0042", className: "Class 10A", rollNo: "12",  gender: "male",   guardian: "Raj Kumar",      feeStatus: "Paid",    attendancePct: 94, status: "active", statusLabel: "Active" },
  { id: 2,  name: "Priya Mehta",    studentId: "EDU-2026-0105", className: "Class 9B",  rollNo: "08",  gender: "female", guardian: "Sanjay Mehta",    feeStatus: "Due",     attendancePct: 91, status: "active", statusLabel: "Active" },
  { id: 3,  name: "Rahul Verma",    studentId: "EDU-2026-0089", className: "Class 10A", rollNo: "18",  gender: "male",   guardian: "Vikram Verma",    feeStatus: "Paid",    attendancePct: 88, status: "active", statusLabel: "Active" },
  { id: 4,  name: "Sneha Rao",      studentId: "EDU-2026-0156", className: "Class 6A",  rollNo: "05",  gender: "female", guardian: "Anand Rao",       feeStatus: "Paid",    attendancePct: 97, status: "active", statusLabel: "Active" },
  { id: 5,  name: "Aditya Singh",   studentId: "EDU-2026-0078", className: "Class 10A", rollNo: "22",  gender: "male",   guardian: "Mohit Singh",     feeStatus: "Overdue", attendancePct: 82, status: "active", statusLabel: "Active" },
  { id: 6,  name: "Meenal Joshi",   studentId: "EDU-2026-0201", className: "Class 8A",  rollNo: "15",  gender: "female", guardian: "Deepak Joshi",    feeStatus: "Paid",    attendancePct: 96, status: "active", statusLabel: "Active" },
  { id: 7,  name: "Karan Patel",    studentId: "EDU-2026-0134", className: "Class 9B",  rollNo: "27",  gender: "male",   guardian: "Nilesh Patel",    feeStatus: "Due",     attendancePct: 79, status: "inactive", statusLabel: "Inactive" },
  { id: 8,  name: "Ananya Sharma",  studentId: "EDU-2026-0167", className: "Class 7B",  rollNo: "03",  gender: "female", guardian: "Vivek Sharma",    feeStatus: "Paid",    attendancePct: 93, status: "active", statusLabel: "Active" },
  { id: 9,  name: "Rohan Gupta",    studentId: "EDU-2026-0223", className: "Class 8A",  rollNo: "09",  gender: "male",   guardian: "Suresh Gupta",    feeStatus: "Paid",    attendancePct: 90, status: "active", statusLabel: "Active" },
  { id: 10, name: "Ishita Desai",   studentId: "EDU-2026-0188", className: "Class 6A",  rollNo: "11",  gender: "female", guardian: "Mahesh Desai",    feeStatus: "Overdue", attendancePct: 85, status: "active", statusLabel: "Active" },
  { id: 11, name: "Varun Nair",     studentId: "EDU-2026-0245", className: "Class 7B",  rollNo: "20",  gender: "male",   guardian: "Ramesh Nair",     feeStatus: "Paid",    attendancePct: 92, status: "active", statusLabel: "Active" },
  { id: 12, name: "Kavya Reddy",    studentId: "EDU-2026-0099", className: "Class 10A", rollNo: "14",  gender: "female", guardian: "Krishna Reddy",   feeStatus: "Paid",    attendancePct: 95, status: "active", statusLabel: "Active" },
];

const CLASSES_DATA = [
  { id: 1, name: "Class 10A",  section: "Science",    teacher: "Mrs. Sharma",     students: 32, attendance: 94, subjects: 8 },
  { id: 2, name: "Class 9B",   section: "Commerce",   teacher: "Mr. Patel",       students: 28, attendance: 91, subjects: 7 },
  { id: 3, name: "Class 8A",   section: "General",    teacher: "Ms. Gupta",       students: 35, attendance: 88, subjects: 9 },
  { id: 4, name: "Class 7B",   section: "General",    teacher: "Mr. Reddy",       students: 30, attendance: 93, subjects: 8 },
  { id: 5, name: "Class 6A",   section: "Foundation", teacher: "Mrs. Desai",      students: 26, attendance: 96, subjects: 7 },
  { id: 6, name: "Class 5C",   section: "Foundation", teacher: "Ms. Verma",       students: 24, attendance: 97, subjects: 6 },
];

function mapStudentInitials(student) {
  return {
    ...student,
    initials: student.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2),
  };
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

let _sectionKeyCounter = 0;
function makeSectionKey() { return `sec_${++_sectionKeyCounter}`; }

function emptyClassForm() {
  return {
    id: null,
    name: '',
    code: '',
    academic_year: '',
    class_teacher: '',
    status: 'active',
    sections: [],
    stats: { total_students: 0, active_students: 0, total_sections: 0 },
  };
}

function emptyAdmissionForm() {
  return {
    name: "",
    photoPreview: null,
    photoB64: null,
    gender: "male",
    date_of_birth: "",
    class_id: "",
    section_id: "",
    admission_date: todayISO(),
    roll_no: "",
    father_name: "",
    mother_name: "",
    parent_phone: "",
    parent_email: "",
    address: "",
    city: "",
    state_id: "",
    country_id: "",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate() {
  const d = new Date();
  return {
    dayName: d.toLocaleDateString("en-IN", { weekday: "long" }),
    dateStr: d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    dateCaps: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase(),
  };
}

function relativeTime(minutesAgo) {
  if (minutesAgo < 1) return "just now";
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} day ago`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class EduManageDashboard extends Component {
  static template = "edumanage_dashboard.Main";

  setup() {
    this.orm = useService("orm");
    this.action = useService("action");
    const greet = getGreeting();
    const date  = formatDate();

    // Read activeNav from router state at start
    const initialNav = router.current.activeNav || "dashboard";
    const initialStudentsView = router.current.studentsView || "roster";
    const initialStudentId = router.current.studentId ? parseInt(router.current.studentId, 10) : null;
    const initialStudentsSubTab = router.current.studentsSubTab || "roster";
    const initialFilterClassId = router.current.filterClassId ? parseInt(router.current.filterClassId, 10) : null;
    const initialFilterSectionId = router.current.filterSectionId ? parseInt(router.current.filterSectionId, 10) : null;

    this.state = useState({
      sidebarCollapsed: false,
      activeNav: initialNav,
      showAlert: true,
      greetText:  greet,
      userName: "Admin",
      userInitials: "A",
      institutionName: "EduManage Institution",
      institutionId: null,
      dailyQuote: QUOTES[new Date().getDay() % QUOTES.length],
      dayName:  date.dayName,
      dateStr:  date.dateStr,
      dateCaps: date.dateCaps,
      // Students tab state
      studentsSubTab: initialStudentsSubTab,
      studentsView: initialStudentsView,
      selectedStudentId: initialStudentId,
      selectedStudent: null,
      studentFilter: "all",
      studentSearch: "",
      students: STUDENTS_DATA.map(mapStudentInitials),
      studentsLoaded: false,
      classesOptions: [],
      countries: [],
      states: [],
      admissionForm: emptyAdmissionForm(),
      admissionErrors: {},
      admissionSaving: false,
      filterClassId: initialFilterClassId,
      filterSectionId: initialFilterSectionId,
      // Class form state
      classForm: emptyClassForm(),
      classFormErrors: {},
      classFormSaving: false,
      newSectionName: '',
    });

    this.navItems     = NAV_ITEMS;
    this.metrics      = METRICS;
    this.shortcuts    = SHORTCUTS;
    this.activityFeed = ACTIVITY.map((a) => ({
      ...a,
      meta: relativeTime(a.minutesAgo),
    }));

    // Students & Classes data
    this.classesData = CLASSES_DATA;

    this.toggleSidebar      = this.toggleSidebar.bind(this);
    this.dismissAlert       = this.dismissAlert.bind(this);
    this.setNav             = this.setNav.bind(this);
    this.onStudentSearch    = this.onStudentSearch.bind(this);
    this.setStudentsSubTab  = this.setStudentsSubTab.bind(this);
    this.setStudentFilter   = this.setStudentFilter.bind(this);
    this.openNewAdmission   = this.openNewAdmission.bind(this);
    this.cancelAdmission    = this.cancelAdmission.bind(this);
    this.saveAdmission      = this.saveAdmission.bind(this);
    this.openStudentProfile = this.openStudentProfile.bind(this);
    this.backToRoster       = this.backToRoster.bind(this);
    this.onAdmissionClassChange = this.onAdmissionClassChange.bind(this);
    this.onAdmissionCountryChange = this.onAdmissionCountryChange.bind(this);
    this.onPhotoSelect      = this.onPhotoSelect.bind(this);
    this.removePhoto        = this.removePhoto.bind(this);

    // Class form bindings
    this.onPageBarAdd       = this.onPageBarAdd.bind(this);
    this.openAddClass       = this.openAddClass.bind(this);
    this.openClassCard      = this.openClassCard.bind(this);
    this.cancelClassForm    = this.cancelClassForm.bind(this);
    this.saveClassForm      = this.saveClassForm.bind(this);
    this.archiveClass       = this.archiveClass.bind(this);
    this.addSection         = this.addSection.bind(this);
    this.onSectionKeydown   = this.onSectionKeydown.bind(this);
    this.viewStudentsForSection = this.viewStudentsForSection.bind(this);

    // Sync activeNav from router state on popstate/ROUTE_CHANGE
    const onRoute = () => {
      const activeNav = router.current.activeNav || "dashboard";
      if (this.state.activeNav !== activeNav) {
        this.state.activeNav = activeNav;
      }
      const studentsView = router.current.studentsView || "roster";
      if (this.state.studentsView !== studentsView) {
        this.state.studentsView = studentsView;
      }
      const studentId = router.current.studentId ? parseInt(router.current.studentId, 10) : null;
      if (this.state.selectedStudentId !== studentId) {
        this.state.selectedStudentId = studentId;
        if (studentId && this.state.studentsView === "profile") {
          this._loadStudentProfile(studentId);
        }
      }
      const filterClassId = router.current.filterClassId ? parseInt(router.current.filterClassId, 10) : null;
      const filterSectionId = router.current.filterSectionId ? parseInt(router.current.filterSectionId, 10) : null;
      this.state.filterClassId = filterClassId;
      this.state.filterSectionId = filterSectionId;

      const studentsSubTab = router.current.studentsSubTab || "roster";
      if (this.state.studentsSubTab !== studentsSubTab) {
        this.state.studentsSubTab = studentsSubTab;
      }
    };
    routerBus.addEventListener("ROUTE_CHANGE", onRoute);
    onWillUnmount(() => {
      routerBus.removeEventListener("ROUTE_CHANGE", onRoute);
    });

    onMounted(async () => {
      await this._loadUserInfo();
      await this._loadStudents();
      if (this.state.studentsView === "profile" && this.state.selectedStudentId) {
        await this._loadStudentProfile(this.state.selectedStudentId);
      }
    });
  }

  async _loadStudents() {
    try {
      const students = await this.orm.call(
        "edumanage.student", "check_and_populate_demo_data", []
      );
      this.state.students = (students || []).map(mapStudentInitials);
      this.state.studentsLoaded = true;
    } catch (_) {
      this.state.studentsLoaded = true;
    }
  }

  async _loadAdmissionOptions() {
    try {
      const [options, countries] = await Promise.all([
        this.orm.call("edumanage.student", "get_admission_form_options", []),
        this.orm.searchRead("res.country", [], ["name"], { order: "name asc" }),
      ]);
      this.state.classesOptions = options?.classes || [];
      this.state.countries = countries || [];
      if (options?.default_country_id && !this.state.admissionForm.country_id) {
        this.state.admissionForm.country_id = String(options.default_country_id);
        await this._loadStates(options.default_country_id);
      }
    } catch (_) {
      this.state.classesOptions = [];
    }
  }

  async _loadStates(countryId) {
    if (!countryId) {
      this.state.states = [];
      return;
    }
    try {
      this.state.states = await this.orm.searchRead(
        "res.country.state",
        [["country_id", "=", parseInt(countryId, 10)]],
        ["name"],
        { order: "name asc" }
      );
    } catch (_) {
      this.state.states = [];
    }
  }

  async _loadStudentProfile(studentId) {
    try {
      const profile = await this.orm.call(
        "edumanage.student", "get_student_profile", [studentId]
      );
      if (profile) {
        this.state.selectedStudent = mapStudentInitials(profile);
      }
    } catch (_) {
      this.state.selectedStudent = this.state.students.find(s => s.id === studentId) || null;
    }
  }
  async _loadUserInfo() {
    try {
      const [user] = await this.orm.read("res.users", [this.env.uid || 1], ["name"]);
      if (user) {
        this.state.userName     = user.name.split(" ")[0];
        this.state.userInitials = user.name.slice(0, 2).toUpperCase();
      }
      try {
        const institutions = await this.orm.searchRead(
          "edumanage.institution", [["setup_complete", "=", true]],
          ["name", "id"], { limit: 1 }
        );
        if (institutions.length) {
          this.state.institutionName = institutions[0].name;
          this.state.institutionId = institutions[0].id;
        } else {
          const anyInst = await this.orm.searchRead(
            "edumanage.institution", [], ["id"], { limit: 1 }
          );
          if (anyInst.length) {
            this.state.institutionId = anyInst[0].id;
          }
        }
      } catch (_) { /* module may not be ready */ }
    } catch (_) { /* silently handle */ }
  }

  toggleSidebar() { this.state.sidebarCollapsed = !this.state.sidebarCollapsed; }
  dismissAlert()  { this.state.showAlert = false; }
  setNav(id) {
    if (id === "institution") {
      if (this.state.institutionId) {
        this.action.doAction({
          type: "ir.actions.act_window",
          res_model: "edumanage.institution",
          res_id: this.state.institutionId,
          views: [[false, "form"]],
          target: "current",
        });
      } else {
        this.action.doAction("edumanage_setup.action_edumanage_institution");
      }
      return;
    }
    this.state.activeNav = id;
    if (id !== "students") {
      this.state.studentsView = "roster";
      this.state.selectedStudentId = null;
      this.state.selectedStudent = null;
    }
    this.state.filterClassId = null;
    this.state.filterSectionId = null;
    router.pushState({
      activeNav: id,
      studentsView: id === "students" ? this.state.studentsView : "roster",
      filterClassId: undefined,
      filterSectionId: undefined,
    });
  }

  get activeTitle() {
    if (this.state.activeNav === "students") {
      if (this.state.studentsView === "admission") return "New Admission";
      if (this.state.studentsView === "profile") return "Student Profile";
    }
    const nav = this.state.activeNav || "dashboard";
    return nav.charAt(0).toUpperCase() + nav.slice(1);
  }

  // ── Students helpers ─────────────────────────────────────────
  get filteredStudents() {
    let list = this.state.students;
    const filter = this.state.studentFilter;
    if (filter === "active")   list = list.filter(s => s.status === "active");
    if (filter === "inactive") list = list.filter(s => s.status === "inactive");
    if (filter === "feeDue")   list = list.filter(s => s.feeStatus === "Due" || s.feeStatus === "Overdue");
    if (this.state.filterClassId) {
      list = list.filter(s => s.class_id && s.class_id[0] === this.state.filterClassId);
    }
    if (this.state.filterSectionId) {
      list = list.filter(s => s.section_id && s.section_id[0] === this.state.filterSectionId);
    }
    const q = (this.state.studentSearch || "").toLowerCase().trim();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.guardian.toLowerCase().includes(q)
      );
    }
    return list;
  }

  get admissionSections() {
    const classId = parseInt(this.state.admissionForm.class_id, 10);
    if (!classId) return [];
    const cls = this.state.classesOptions.find(c => c.id === classId);
    return cls?.sections || [];
  }

  getStudentFilters() {
    let list = this.state.students;
    if (this.state.filterClassId) {
      list = list.filter(s => s.class_id && s.class_id[0] === this.state.filterClassId);
    }
    if (this.state.filterSectionId) {
      list = list.filter(s => s.section_id && s.section_id[0] === this.state.filterSectionId);
    }
    return [
      { id: "all", label: "All Students", count: list.length },
      { id: "active", label: "Active", count: list.filter(s => s.status === "active").length },
      { id: "inactive", label: "Inactive", count: list.filter(s => s.status === "inactive").length },
      {
        id: "feeDue",
        label: "Fee Due",
        count: list.filter(s => s.feeStatus === "Due" || s.feeStatus === "Overdue").length,
      },
    ];
  }

  _pushStudentsRoute(extra = {}) {
    router.pushState({
      activeNav: "students",
      studentsView: this.state.studentsView,
      ...(this.state.selectedStudentId ? { studentId: this.state.selectedStudentId } : {}),
      ...(this.state.filterClassId ? { filterClassId: this.state.filterClassId } : {}),
      ...(this.state.filterSectionId ? { filterSectionId: this.state.filterSectionId } : {}),
      ...extra,
    });
  }

  async openNewAdmission() {
    if (this.state.studentsSubTab !== "roster") return;
    this.state.admissionForm = emptyAdmissionForm();
    this.state.admissionErrors = {};
    this.state.admissionSaving = false;
    this.state.studentsView = "admission";
    this.state.selectedStudentId = null;
    this.state.selectedStudent = null;
    await this._loadAdmissionOptions();
    this._pushStudentsRoute({ studentsView: "admission", studentId: undefined });
  }

  cancelAdmission() {
    this.backToRoster();
  }

  backToRoster() {
    this.state.studentsView = "roster";
    this.state.selectedStudentId = null;
    this.state.selectedStudent = null;
    this.state.admissionErrors = {};
    router.pushState({
      activeNav: "students",
      studentsView: "roster",
      ...(this.state.filterClassId ? { filterClassId: this.state.filterClassId } : {}),
      ...(this.state.filterSectionId ? { filterSectionId: this.state.filterSectionId } : {}),
    });
  }

  async openStudentProfile(studentId) {
    this.state.studentsView = "profile";
    this.state.selectedStudentId = studentId;
    await this._loadStudentProfile(studentId);
    this._pushStudentsRoute({ studentsView: "profile", studentId });
  }

  onAdmissionClassChange() {
    this.state.admissionForm.section_id = "";
  }

  async onAdmissionCountryChange() {
    this.state.admissionForm.state_id = "";
    await this._loadStates(this.state.admissionForm.country_id);
  }

  onPhotoSelect(ev) {
    const file = ev.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.admissionForm.photoPreview = e.target.result;
      this.state.admissionForm.photoB64 = e.target.result.split(",")[1];
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.state.admissionForm.photoPreview = null;
    this.state.admissionForm.photoB64 = null;
  }

  // ── Class Form ────────────────────────────────────────────────────────────

  get visibleFormSections() {
    return (this.state.classForm.sections || []).filter(s => !s._deleted);
  }

  onPageBarAdd() {
    if (this.state.studentsSubTab === 'classes') {
      this.openAddClass();
    } else {
      this.openNewAdmission();
    }
  }

  openAddClass() {
    this.state.classForm = emptyClassForm();
    this.state.classFormErrors = {};
    this.state.classFormSaving = false;
    this.state.newSectionName = '';
    this.state.studentsView = 'class_form';
  }

  async openClassCard(classId) {
    this.state.classFormErrors = {};
    this.state.classFormSaving = false;
    this.state.newSectionName = '';
    this.state.studentsView = 'class_form';
    try {
      const data = await this.orm.call('edumanage.class', 'get_class_form_data', [classId]);
      if (data) {
        data.sections = (data.sections || []).map(s => ({
          ...s,
          _key: makeSectionKey(),
          _archived: !s.active,
          _new: false,
          _deleted: false,
        }));
        this.state.classForm = data;
      }
    } catch (e) {
      console.error('openClassCard error', e);
    }
  }

  cancelClassForm() {
    this.state.studentsView = 'roster';
    this.state.classForm = emptyClassForm();
    this.state.classFormErrors = {};
    this.state.filterClassId = null;
    this.state.filterSectionId = null;
  }

  _validateClassForm() {
    const errors = {};
    if (!this.state.classForm.name?.trim()) errors.name = 'Class name is required';
    this.state.classFormErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async saveClassForm() {
    if (!this._validateClassForm() || this.state.classFormSaving) return;
    this.state.classFormSaving = true;
    const f = this.state.classForm;
    const vals = {
      name: f.name.trim(),
      code: f.code?.trim() || '',
      academic_year: f.academic_year?.trim() || '',
      class_teacher: f.class_teacher?.trim() || '',
      status: f.status,
    };
    const sections = (f.sections || []).map(s => ({
      id: s.id || null,
      name: s.name,
      status: s.status,
      _new: s._new || false,
      _deleted: s._deleted || false,
      _archived: s._archived || false,
    }));
    try {
      const newId = await this.orm.call('edumanage.class', 'save_class_form', [f.id, vals, sections]);
      this.state.classFormSaving = false;
      // Reload the form with fresh data
      await this.openClassCard(newId);
      // Refresh kanban data in background
      this._loadClassesData();
    } catch (e) {
      console.error('saveClassForm error', e);
      this.state.classFormSaving = false;
      this.state.classFormErrors._form = 'Save failed. Please try again.';
    }
  }

  async archiveClass() {
    if (!this.state.classForm.id) return;
    try {
      await this.orm.call('edumanage.class', 'archive_class_record', [this.state.classForm.id]);
      this.cancelClassForm();
      this._loadClassesData();
    } catch (e) {
      console.error('archiveClass error', e);
    }
  }

  async _loadClassesData() {
    try {
      const data = await this.orm.call('edumanage.class', 'get_classes_data', []);
      this.classesData = data;
    } catch (e) {
      console.error('_loadClassesData error', e);
    }
  }

  addSection() {
    const name = (this.state.newSectionName || '').trim();
    if (!name) return;
    this.state.classForm.sections = [
      ...(this.state.classForm.sections || []),
      { id: null, name, status: 'active', active: true, _new: true, _deleted: false, _archived: false, _key: makeSectionKey() },
    ];
    this.state.newSectionName = '';
  }

  onSectionKeydown(ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); this.addSection(); }
  }

  removeSectionItem(key) {
    const sec = this.state.classForm.sections.find(s => s._key === key);
    if (!sec) return;
    if (sec._new) {
      this.state.classForm.sections = this.state.classForm.sections.filter(s => s._key !== key);
    } else {
      sec._deleted = true;
    }
  }

  archiveSectionItem(key) {
    const sec = this.state.classForm.sections.find(s => s._key === key);
    if (sec) { sec._archived = true; sec.status = 'archived'; }
  }

  restoreSection(key) {
    const sec = this.state.classForm.sections.find(s => s._key === key);
    if (sec) { sec._archived = false; sec.status = 'active'; }
  }

  _validateAdmission() {
    const form = this.state.admissionForm;
    const errors = {};
    if (!form.name?.trim()) errors.name = "Student name is required";
    if (!form.class_id) errors.class_id = "Class is required";
    if (!form.section_id) errors.section_id = "Section is required";
    if (!form.admission_date) errors.admission_date = "Admission date is required";
    this.state.admissionErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async saveAdmission() {
    if (!this._validateAdmission() || this.state.admissionSaving) return;
    this.state.admissionSaving = true;
    const form = this.state.admissionForm;
    const vals = {
      name: form.name.trim(),
      gender: form.gender,
      class_id: parseInt(form.class_id, 10),
      section_id: parseInt(form.section_id, 10),
      admission_date: form.admission_date,
    };
    if (form.date_of_birth) vals.date_of_birth = form.date_of_birth;
    if (form.roll_no?.trim()) vals.roll_no = form.roll_no.trim();
    if (form.father_name?.trim()) vals.father_name = form.father_name.trim();
    if (form.mother_name?.trim()) vals.mother_name = form.mother_name.trim();
    if (form.parent_phone?.trim()) vals.parent_phone = form.parent_phone.trim();
    if (form.parent_email?.trim()) vals.parent_email = form.parent_email.trim();
    if (form.address?.trim()) vals.address = form.address.trim();
    if (form.city?.trim()) vals.city = form.city.trim();
    if (form.state_id) vals.state_id = parseInt(form.state_id, 10);
    if (form.country_id) vals.country_id = parseInt(form.country_id, 10);
    if (form.photoB64) vals.photo = form.photoB64;

    try {
      const studentId = await this.orm.create("edumanage.student", [vals]);
      await this._loadStudents();
      this.state.admissionSaving = false;
      await this.openStudentProfile(studentId);
    } catch (err) {
      this.state.admissionSaving = false;
      this.state.admissionErrors = { _form: err.message || "Could not save admission. Please try again." };
    }
  }

  photoSrc(student) {
    if (!student?.photo) return null;
    if (typeof student.photo === "string" && student.photo.startsWith("data:")) {
      return student.photo;
    }
    return `data:image/png;base64,${student.photo}`;
  }

  formatMany2one(field) {
    return field && field[1] ? field[1] : "—";
  }

  formatGender(gender) {
    if (!gender) return "—";
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  }

  setStudentsSubTab(tab) {
    this.state.studentsSubTab = tab;
    if (tab === "classes") {
      this.state.filterClassId = null;
      this.state.filterSectionId = null;
    }
    router.pushState({
      activeNav: "students",
      studentsView: this.state.studentsView,
      studentsSubTab: tab,
      ...(tab === "classes" ? { filterClassId: undefined, filterSectionId: undefined } : {
        filterClassId: this.state.filterClassId || undefined,
        filterSectionId: this.state.filterSectionId || undefined,
      })
    });
  }

  viewStudentsForSection(sec) {
    if (!sec.id) return;
    this.state.activeNav = "students";
    this.state.studentsSubTab = "roster";
    this.state.studentsView = "roster";
    this.state.filterClassId = this.state.classForm.id;
    this.state.filterSectionId = sec.id;
    router.pushState({
      activeNav: "students",
      studentsView: "roster",
      studentsSubTab: "roster",
      filterClassId: this.state.classForm.id,
      filterSectionId: sec.id,
    });
  }
  setStudentFilter(filterId) { this.state.studentFilter = filterId; }
  onStudentSearch() { /* reactive via t-model */ }
}

registry.category("actions").add("edumanage_dashboard.main", EduManageDashboard);
