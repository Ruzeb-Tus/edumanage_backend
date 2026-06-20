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

function emptyCollectForm() {
  return {
    amount_collected: "",
    payment_method: "upi",
    collection_date: todayISO(),
    remarks: "",
  };
}

function emptyFeeStructureForm() {
  return {
    class_id: "",
    amount: "",
    academic_year: "",
    status: "draft",
  };
}

function emptyDocumentForm() {
  return {
    name: "",
    doc_type: "other",
    file: null,
    filename: "",
  };
}

function profileFormFromStudent(student) {
  if (!student) {
    return {
      name: "",
      photoPreview: null,
      photoB64: null,
      gender: "male",
      date_of_birth: "",
      class_id: "",
      section_id: "",
      admission_date: "",
      roll_no: "",
      father_name: "",
      mother_name: "",
      parent_phone: "",
      parent_email: "",
      address: "",
      city: "",
      state_id: "",
      country_id: "",
      status: "active",
    };
  }
  let photoPreview = null;
  if (student.photo) {
    photoPreview = typeof student.photo === "string" && student.photo.startsWith("data:")
      ? student.photo
      : `data:image/png;base64,${student.photo}`;
  }
  return {
    name: student.name || "",
    photoPreview,
    photoB64: null,
    gender: student.gender || "male",
    date_of_birth: student.dob || "",
    class_id: student.class_id ? String(student.class_id[0]) : "",
    section_id: student.section_id ? String(student.section_id[0]) : "",
    admission_date: student.admission_date || "",
    roll_no: student.rollNo || "",
    father_name: student.father_name || "",
    mother_name: student.mother_name || "",
    parent_phone: student.parent_phone || "",
    parent_email: student.parent_email || "",
    address: student.address || "",
    city: student.city || "",
    state_id: student.state_id ? String(student.state_id[0]) : "",
    country_id: student.country_id ? String(student.country_id[0]) : "",
    status: student.status || "active",
  };
}

function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString("en-IN");
}

function emptyDashboardSummary() {
  return {
    kpis: {
      total_students: 0,
      total_classes: 0,
      total_sections: 0,
      attendance_pct: 0,
      attendance_present: 0,
      attendance_total: 0,
      new_admissions_month: 0,
      new_admissions_week: 0,
      fees_collected_today: 0,
      fees_pending_amount: 0,
      fees_pending_count: 0,
      fees_overdue_count: 0,
      fees_overdue_amount: 0,
    },
    attendance_trend: [],
    fee_trend: [],
    overdue_fees: [],
    pending_admissions: [],
    birthdays: [],
    alerts: [],
    activity: [],
    class_summary: [],
    missing_docs_count: 0,
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
      profileTab: "overview",
      profileDocuments: [],
      profileFeeHistory: [],
      profileReceipts: [],
      profileReceipt: null,
      profileDocForm: emptyDocumentForm(),
      profileDocUploading: false,
      profileDocErrors: {},
      profileTabLoading: false,
      profileForm: profileFormFromStudent(null),
      profileErrors: {},
      profileSaving: false,
      profileDeleting: false,
      settingsMenu: null,
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
      // Fees state
      activeFeesSubTab: "pending",
      feesView: "list",
      feeStructures: [],
      studentFees: [],
      classes: [],
      feeFilter: "all",
      feeStructureForm: emptyFeeStructureForm(),
      feeStructureSaving: false,
      feeStructureErrors: {},
      // Fee collection state
      collectFeeId: null,
      collectFeeData: null,
      collectForm: emptyCollectForm(),
      collectErrors: {},
      collectSaving: false,
      currentReceipt: null,
      feeCollectSearch: "",
      dashboard: emptyDashboardSummary(),
      dashboardLoading: false,
      dashboardLoaded: false,
    });

    this.navItems = NAV_ITEMS;

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
    this.setProfileTab      = this.setProfileTab.bind(this);
    this.onProfileDocSelect = this.onProfileDocSelect.bind(this);
    this.uploadProfileDocument = this.uploadProfileDocument.bind(this);
    this.viewProfileDocument   = this.viewProfileDocument.bind(this);
    this.downloadProfileDocument = this.downloadProfileDocument.bind(this);
    this.deleteProfileDocument   = this.deleteProfileDocument.bind(this);
    this.viewProfileReceipt      = this.viewProfileReceipt.bind(this);
    this.printProfileReceiptById = this.printProfileReceiptById.bind(this);
    this.backFromProfileReceipt  = this.backFromProfileReceipt.bind(this);
    this.printProfileReceipt     = this.printProfileReceipt.bind(this);
    this.saveProfile              = this.saveProfile.bind(this);
    this.deleteStudent            = this.deleteStudent.bind(this);
    this.onProfileClassChange     = this.onProfileClassChange.bind(this);
    this.onProfileCountryChange   = this.onProfileCountryChange.bind(this);
    this.onProfilePhotoSelect     = this.onProfilePhotoSelect.bind(this);
    this.removeProfilePhoto       = this.removeProfilePhoto.bind(this);
    this.toggleSettingsMenu       = this.toggleSettingsMenu.bind(this);
    this.closeSettingsMenu        = this.closeSettingsMenu.bind(this);
    this.settingsMenuKey          = this.settingsMenuKey.bind(this);
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
    // Fees bindings
    this.openCreateFeeStructure   = this.openCreateFeeStructure.bind(this);
    this.cancelFeeStructureForm   = this.cancelFeeStructureForm.bind(this);
    this.saveFeeStructureForm     = this.saveFeeStructureForm.bind(this);
    this.confirmFeeStructure      = this.confirmFeeStructure.bind(this);
    this.toggleFeeStructureStatus = this.toggleFeeStructureStatus.bind(this);
    this.setFeesSubTab            = this.setFeesSubTab.bind(this);
    this.setFeeFilter             = this.setFeeFilter.bind(this);
    this.revokeFeeStructure       = this.revokeFeeStructure.bind(this);
    this.formatCurrency           = formatCurrency;
    // Collection workflow bindings
    this.openCollectPick          = this.openCollectPick.bind(this);
    this.cancelCollectPick        = this.cancelCollectPick.bind(this);
    this.openCollectFee           = this.openCollectFee.bind(this);
    this.cancelCollect            = this.cancelCollect.bind(this);
    this.submitCollectFee         = this.submitCollectFee.bind(this);
    this.backFromReceipt          = this.backFromReceipt.bind(this);
    this.printReceipt             = this.printReceipt.bind(this);
    this.dashboardQuickAction     = this.dashboardQuickAction.bind(this);
    this.onDashboardAlert         = this.onDashboardAlert.bind(this);
    this.onKpiClick               = this.onKpiClick.bind(this);
    this.onClassSummaryClick      = this.onClassSummaryClick.bind(this);
    this.feeBarHeight             = this.feeBarHeight.bind(this);

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
      await this._loadDashboard();
      await this._loadStudents();
      await this._loadFeesData();
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
        this._populateProfileForm(this.state.selectedStudent);
      }
    } catch (_) {
      this.state.selectedStudent = this.state.students.find(s => s.id === studentId) || null;
      if (this.state.selectedStudent) {
        this._populateProfileForm(this.state.selectedStudent);
      }
    }
  }

  _populateProfileForm(student) {
    this.state.profileForm = profileFormFromStudent(student);
    this.state.profileErrors = {};
    this.state.profileSaving = false;
    this.state.profileDeleting = false;
    this.state.settingsMenu = null;
  }

  settingsMenuKey(prefix, id) {
    return `${prefix}-${id}`;
  }

  toggleSettingsMenu(menuKey) {
    this.state.settingsMenu = this.state.settingsMenu === menuKey ? null : menuKey;
  }

  closeSettingsMenu() {
    this.state.settingsMenu = null;
  }

  async _loadProfileTabData(tab) {
    const studentId = this.state.selectedStudentId;
    if (!studentId) return;
    this.state.profileTabLoading = true;
    try {
      if (tab === "documents") {
        this.state.profileDocuments = await this.orm.call(
          "edumanage.student.document", "get_student_documents", [studentId]
        ) || [];
      } else if (tab === "fee_history") {
        this.state.profileFeeHistory = await this.orm.call(
          "edumanage.student", "get_student_fee_history", [studentId]
        ) || [];
      } else if (tab === "receipts") {
        this.state.profileReceipts = await this.orm.call(
          "edumanage.student", "get_student_receipts", [studentId]
        ) || [];
      }
    } catch (err) {
      console.error("_loadProfileTabData error", err);
    }
    this.state.profileTabLoading = false;
  }

  async setProfileTab(tab) {
    this.state.profileTab = tab;
    this.state.profileReceipt = null;
    if (tab !== "overview") {
      await this._loadProfileTabData(tab);
    }
  }
  async _loadUserInfo() {
    try {
      let instName = "EduManage Institution";
      let instId = null;
      try {
        const institutions = await this.orm.searchRead(
          "edumanage.institution", [["setup_complete", "=", true]],
          ["name", "id"], { limit: 1 }
        );
        if (institutions.length) {
          instName = institutions[0].name;
          instId = institutions[0].id;
        } else {
          const anyInst = await this.orm.searchRead(
            "edumanage.institution", [], ["name", "id"], { limit: 1 }
          );
          if (anyInst.length) {
            instId = anyInst[0].id;
            instName = anyInst[0].name;
          }
        }
      } catch (_) { /* module may not be ready */ }

      this.state.institutionName = instName;
      this.state.institutionId = instId;

      const [user] = await this.orm.read("res.users", [this.env.uid || 1], ["name", "login"]);
      if (user) {
        let isOdooBot = user.name === "OdooBot" || user.login === "odoobot" || user.login === "__system__";
        if (isOdooBot || !user.name) {
          this.state.userName = instName;
          this.state.userInitials = instName.slice(0, 2).toUpperCase();
        } else {
          this.state.userName = user.name.split(" ")[0];
          this.state.userInitials = user.name.slice(0, 2).toUpperCase();
        }

        const storageKey = 'edumanage_login_' + user.id;
        const isFirstLogin = !window.localStorage.getItem(storageKey);
        if (isFirstLogin) {
          this.state.greetText = "Welcome to EduManage";
          window.localStorage.setItem(storageKey, 'true');
        } else {
          this.state.greetText = getGreeting();
        }
      }
    } catch (_) { /* silently handle */ }
  }

  async _loadDashboard() {
    this.state.dashboardLoading = true;
    try {
      const data = await this.orm.call("edumanage.dashboard", "get_summary", []);
      if (data) {
        this.state.dashboard = {
          ...emptyDashboardSummary(),
          ...data,
          activity: (data.activity || []).map((a) => ({
            ...a,
            meta: relativeTime(a.minutes_ago || 999),
          })),
        };
        this.state.dashboardLoaded = true;
      }
    } catch (err) {
      console.error("_loadDashboard error", err);
    }
    this.state.dashboardLoading = false;
  }

  get dashboardKpis() {
    return this.state.dashboard?.kpis || emptyDashboardSummary().kpis;
  }

  get maxFeeTrend() {
    const vals = (this.state.dashboard?.fee_trend || []).map((d) => d.collected);
    return Math.max(...vals, 1);
  }

  get dashboardActivity() {
    return this.state.dashboard?.activity || [];
  }

  dashboardQuickAction(action) {
    if (action === "add_student") {
      this.setNav("students");
      this.openNewAdmission();
    } else if (action === "collect_fee") {
      this.setNav("fees");
      this.openCollectPick();
    } else if (action === "mark_attendance") {
      this.setNav("attendance");
    } else if (action === "upload_document") {
      this.setNav("documents");
    } else if (action === "approve_admission") {
      this.setNav("students");
      this.setStudentsSubTab("roster");
    } else if (action === "view_reports") {
      this.setNav("reports");
    }
  }

  onDashboardAlert(alert) {
    if (!alert?.action) return;
    this.setNav(alert.action);
    if (alert.id === "overdue_fees") {
      this.state.activeFeesSubTab = "pending";
      this.state.feeFilter = "overdue";
    } else if (alert.id === "pending_admissions") {
      this.setStudentsSubTab("roster");
    } else if (alert.id === "missing_docs") {
      this.setNav("documents");
    }
  }

  onKpiClick(kpiId) {
    const map = {
      students: "students",
      classes: "students",
      attendance: "attendance",
      fees_collected: "fees",
      fees_pending: "fees",
      admissions: "students",
    };
    const nav = map[kpiId];
    if (!nav) return;
    this.setNav(nav);
    if (kpiId === "classes") {
      this.setStudentsSubTab("classes");
    } else if (kpiId === "fees_pending") {
      this.state.activeFeesSubTab = "pending";
      this.state.feeFilter = "all";
    } else if (kpiId === "admissions") {
      this.openNewAdmission();
    }
  }

  onClassSummaryClick(classId) {
    this.setNav("students");
    this.setStudentsSubTab("classes");
    this.state.filterClassId = classId;
    router.pushState({
      activeNav: "students",
      studentsSubTab: "classes",
      filterClassId: classId,
    });
  }

  feeBarHeight(amount) {
    const max = this.maxFeeTrend;
    return max ? Math.round((amount / max) * 100) : 0;
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
    this.closeSettingsMenu();
    if (id === "dashboard") {
      this._loadDashboard();
    }
    if (id === "fees") {
      this._loadFeesData();
    }
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

  get profileSections() {
    const classId = parseInt(this.state.profileForm.class_id, 10);
    if (!classId) return [];
    const cls = this.state.classesOptions.find(c => c.id === classId);
    return cls?.sections || [];
  }

  onProfileClassChange() {
    this.state.profileForm.section_id = "";
  }

  async onProfileCountryChange() {
    this.state.profileForm.state_id = "";
    await this._loadStates(this.state.profileForm.country_id);
  }

  onProfilePhotoSelect(ev) {
    const file = ev.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.profileForm.photoPreview = e.target.result;
      this.state.profileForm.photoB64 = e.target.result.split(",")[1];
    };
    reader.readAsDataURL(file);
  }

  removeProfilePhoto() {
    this.state.profileForm.photoPreview = null;
    this.state.profileForm.photoB64 = null;
  }

  _validateProfile() {
    const form = this.state.profileForm;
    const errors = {};
    if (!form.name?.trim()) errors.name = "Student name is required";
    if (!form.class_id) errors.class_id = "Class is required";
    if (!form.section_id) errors.section_id = "Section is required";
    if (!form.admission_date) errors.admission_date = "Admission date is required";
    this.state.profileErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async saveProfile() {
    if (!this._validateProfile() || this.state.profileSaving || !this.state.selectedStudentId) return;
    this.state.profileSaving = true;
    this.closeSettingsMenu();
    const form = this.state.profileForm;
    const vals = {
      name: form.name.trim(),
      gender: form.gender,
      class_id: parseInt(form.class_id, 10),
      section_id: parseInt(form.section_id, 10),
      admission_date: form.admission_date,
      status: form.status,
      roll_no: form.roll_no || "",
      father_name: form.father_name || "",
      mother_name: form.mother_name || "",
      parent_phone: form.parent_phone || "",
      parent_email: form.parent_email || "",
      address: form.address || "",
      city: form.city || "",
      date_of_birth: form.date_of_birth || "",
      state_id: form.state_id || "",
      country_id: form.country_id || "",
    };
    if (form.photoB64) vals.photo = form.photoB64;
    try {
      const updated = await this.orm.call(
        "edumanage.student", "save_student_profile",
        [this.state.selectedStudentId, vals]
      );
      if (updated) {
        this.state.selectedStudent = mapStudentInitials(updated);
        this._populateProfileForm(this.state.selectedStudent);
        await this._loadStudents();
        await this._loadDashboard();
      }
      this.state.profileSaving = false;
    } catch (err) {
      this.state.profileSaving = false;
      this.state.profileErrors = {
        _form: err.message || err.data?.message || "Could not save changes. Please try again.",
      };
    }
  }

  async deleteStudent() {
    if (this.state.profileDeleting || !this.state.selectedStudentId) return;
    const name = this.state.selectedStudent?.name || "this student";
    if (!window.confirm(`Delete ${name}? This will permanently remove the student and all related fee records.`)) {
      return;
    }
    this.closeSettingsMenu();
    this.state.profileDeleting = true;
    try {
      const result = await this.orm.call(
        "edumanage.student", "delete_student_record", [this.state.selectedStudentId]
      );
      if (result?.success === false) {
        throw new Error(result.message || "Delete failed.");
      }
      await this._loadStudents();
      await this._loadDashboard();
      this.backToRoster();
    } catch (err) {
      this.state.profileErrors = {
        _form: err.message || err.data?.message || "Could not delete student. Please try again.",
      };
    }
    this.state.profileDeleting = false;
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
    this.state.settingsMenu = null;
    router.pushState({
      activeNav: "students",
      studentsView: "roster",
      ...(this.state.filterClassId ? { filterClassId: this.state.filterClassId } : {}),
      ...(this.state.filterSectionId ? { filterSectionId: this.state.filterSectionId } : {}),
    });
  }

  async openStudentProfile(studentId) {
    this.state.activeNav = "students";
    this.state.studentsView = "profile";
    this.state.selectedStudentId = studentId;
    this.state.profileTab = "overview";
    this.state.profileDocuments = [];
    this.state.profileFeeHistory = [];
    this.state.profileReceipts = [];
    this.state.profileReceipt = null;
    this.state.profileDocForm = emptyDocumentForm();
    this.state.profileDocErrors = {};
    this.state.settingsMenu = null;
    await this._loadAdmissionOptions();
    await this._loadStudentProfile(studentId);
    if (this.state.profileForm.country_id) {
      await this._loadStates(this.state.profileForm.country_id);
    }
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
    this.closeSettingsMenu();
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
    this.closeSettingsMenu();
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
    this.closeSettingsMenu();
    const sec = this.state.classForm.sections.find(s => s._key === key);
    if (!sec) return;
    if (sec._new) {
      this.state.classForm.sections = this.state.classForm.sections.filter(s => s._key !== key);
    } else {
      sec._deleted = true;
    }
  }

  archiveSectionItem(key) {
    this.closeSettingsMenu();
    const sec = this.state.classForm.sections.find(s => s._key === key);
    if (sec) { sec._archived = true; sec.status = 'archived'; }
  }

  restoreSection(key) {
    this.closeSettingsMenu();
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
    this.closeSettingsMenu();
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
      await this._loadDashboard();
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

  // ── Student Profile tabs ─────────────────────────────────────────────────

  onProfileDocSelect(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.profileDocForm.file = e.target.result.split(",")[1];
      this.state.profileDocForm.filename = file.name;
      if (!this.state.profileDocForm.name) {
        this.state.profileDocForm.name = file.name.replace(/\.[^.]+$/, "");
      }
    };
    reader.readAsDataURL(file);
  }

  async uploadProfileDocument() {
    this.closeSettingsMenu();
    const form = this.state.profileDocForm;
    const errors = {};
    if (!form.name?.trim()) errors.name = "Document name is required.";
    if (!form.file) errors.file = "Please select a file.";
    this.state.profileDocErrors = errors;
    if (Object.keys(errors).length > 0) return;

    this.state.profileDocUploading = true;
    try {
      await this.orm.call("edumanage.student.document", "upload_student_document", [
        this.state.selectedStudentId,
        {
          name: form.name.trim(),
          doc_type: form.doc_type,
          file: form.file,
          filename: form.filename,
        },
      ]);
      this.state.profileDocForm = emptyDocumentForm();
      this.state.profileDocErrors = {};
      await this._loadProfileTabData("documents");
      this.state.profileDocUploading = false;
    } catch (err) {
      this.state.profileDocUploading = false;
      this.state.profileDocErrors = { _form: err.message || "Upload failed." };
    }
  }

  _guessMime(filename) {
    const ext = (filename || "").split(".").pop()?.toLowerCase();
    const map = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    return map[ext] || "application/octet-stream";
  }

  async _getDocumentBlob(docId) {
    const data = await this.orm.call("edumanage.student.document", "get_document_file", [docId]);
    if (!data?.file) return null;
    const mime = this._guessMime(data.filename);
    const binary = atob(data.file);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), filename: data.filename, mime };
  }

  async viewProfileDocument(docId) {
    try {
      const result = await this._getDocumentBlob(docId);
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("viewProfileDocument error", err);
    }
  }

  async downloadProfileDocument(docId) {
    try {
      const result = await this._getDocumentBlob(docId);
      if (!result) return;
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("downloadProfileDocument error", err);
    }
  }

  async deleteProfileDocument(docId) {
    this.closeSettingsMenu();
    try {
      await this.orm.call("edumanage.student.document", "delete_student_document", [docId]);
      await this._loadProfileTabData("documents");
    } catch (err) {
      console.error("deleteProfileDocument error", err);
    }
  }

  async viewProfileReceipt(paymentId) {
    try {
      const receipt = await this.orm.call("edumanage.fee.payment", "get_payment_receipt", [paymentId]);
      if (receipt) {
        this.state.profileReceipt = receipt;
      }
    } catch (err) {
      console.error("viewProfileReceipt error", err);
    }
  }

  async printProfileReceiptById(paymentId) {
    await this.viewProfileReceipt(paymentId);
    setTimeout(() => window.print(), 400);
  }

  backFromProfileReceipt() {
    this.state.profileReceipt = null;
  }

  printProfileReceipt() {
    window.print();
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
    this.closeSettingsMenu();
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

  // ── Fees getters ─────────────────────────────────────────────────────────

  get filteredStudentFees() {
    const fees = this.state.studentFees || [];
    const f = this.state.feeFilter;
    if (f === "all") return fees;
    return fees.filter(fee => fee.status === f);
  }

  get feeStats() {
    const fees = this.state.studentFees || [];
    const totalDue = fees.reduce((s, f) => s + (f.remaining_due || 0), 0);
    const overdue  = fees.filter(f => f.status === "overdue").length;
    const paid     = fees.filter(f => f.status === "paid").length;
    const pending  = fees.filter(f => f.status === "pending" || f.status === "partial").length;
    return { totalDue, overdue, paid, pending };
  }

  // ── Fees data ─────────────────────────────────────────────────────────────

  async _loadFeesData() {
    try {
      const [structures, studentFees, classes] = await Promise.all([
        this.orm.searchRead(
          "edumanage.fee.structure", [],
          ["name", "class_id", "amount", "academic_year", "status"],
          { order: "id desc" }
        ),
        this.orm.searchRead(
          "edumanage.student.fee", [],
          ["name", "student_id", "class_id", "section_id", "total_amount", "amount_paid",
           "remaining_due", "status", "due_date", "academic_year", "fee_month"],
          { order: "id desc" }
        ),
        this.orm.searchRead("edumanage.class", [], ["name"], { order: "name asc" }),
      ]);
      this.state.feeStructures = structures || [];
      this.state.studentFees   = studentFees || [];
      this.state.classes       = classes || [];
    } catch (err) {
      console.error("Error loading fees data:", err);
    }
  }

  // ── Fees actions ──────────────────────────────────────────────────────────

  setFeesSubTab(tab) {
    this.state.activeFeesSubTab = tab;
    this.state.feesView = "list";
    this.state.feeFilter = "all";
  }

  setFeeFilter(f) { this.state.feeFilter = f; }

  openCreateFeeStructure() {
    this.state.feeStructureForm = emptyFeeStructureForm();
    this.state.feeStructureErrors = {};
    this.state.feesView = "form";
  }

  cancelFeeStructureForm() {
    this.state.feesView = "list";
    this.state.feeStructureErrors = {};
  }

  async saveFeeStructureForm() {
    const form = this.state.feeStructureForm;
    const errors = {};
    if (!form.class_id)    errors.class_id = "Class is required";
    if (!form.amount || parseFloat(form.amount) <= 0) errors.amount = "Fee amount must be positive";
    if (!form.academic_year?.trim()) errors.academic_year = "Academic year is required";

    this.state.feeStructureErrors = errors;
    if (Object.keys(errors).length > 0) return;

    this.closeSettingsMenu();
    this.state.feeStructureSaving = true;
    try {
      const vals = {
        class_id: parseInt(form.class_id, 10),
        amount: parseFloat(form.amount),
        academic_year: form.academic_year.trim(),
        status: "draft",
      };
      await this.orm.create("edumanage.fee.structure", [vals]);
      await this._loadFeesData();
      this.state.feesView = "list";
      this.state.activeFeesSubTab = "structures";
      this.state.feeStructureSaving = false;
    } catch (err) {
      this.state.feeStructureSaving = false;
      this.state.feeStructureErrors = { _form: err.message || "Failed to save Fee Structure." };
    }
  }

  async confirmFeeStructure(id) {
    this.closeSettingsMenu();
    try {
      await this.orm.call("edumanage.fee.structure", "action_confirm", [id]);
      await this._loadFeesData();
    } catch (err) {
      console.error("Failed to confirm fee structure:", err);
    }
  }

  async revokeFeeStructure(id) {
    this.closeSettingsMenu();
    try {
      await this.orm.call("edumanage.fee.structure", "action_revoke", [id]);
      await this._loadFeesData();
    } catch (err) {
      console.error("Failed to revoke fee structure:", err);
    }
  }

  async toggleFeeStructureStatus(id, newStatus) {
    this.closeSettingsMenu();
    try {
      await this.orm.write("edumanage.fee.structure", [id], { status: newStatus });
      await this._loadFeesData();
    } catch (err) {
      console.error("Failed to update fee structure status:", err);
    }
  }

  // ── Fee Collection Workflow ───────────────────────────────────────────────

  get filteredCollectFees() {
    const fees = (this.state.studentFees || []).filter(f => f.status !== "paid" && f.remaining_due > 0);
    const q = (this.state.feeCollectSearch || "").trim().toLowerCase();
    if (!q) return fees;
    return fees.filter(f => {
      const name = (f.student_id ? (Array.isArray(f.student_id) ? f.student_id[1] : String(f.student_id)) : "").toLowerCase();
      return name.includes(q);
    });
  }

  openCollectPick() {
    this.state.feeCollectSearch = "";
    this.state.feesView = "collect_pick";
    // Reload to make sure we have latest data
    this._loadFeesData();
  }

  cancelCollectPick() {
    this.state.feesView = "list";
    this.state.feeCollectSearch = "";
  }

  async openCollectFee(feeId) {
    // Remember where we came from so Cancel returns there
    this.state._collectOrigin  = this.state.feesView === "collect_pick" ? "collect_pick" : "list";
    this.state.collectFeeId    = feeId;
    this.state.collectFeeData  = null;
    this.state.collectForm     = emptyCollectForm();
    this.state.collectErrors   = {};
    this.state.collectSaving   = false;
    this.state.feesView        = "collect";
    try {
      const data = await this.orm.call("edumanage.student.fee", "get_student_fee_detail", [feeId]);
      if (data) {
        this.state.collectFeeData = data;
        // Pre-fill max collectible amount
        this.state.collectForm.amount_collected = String(data.remaining_due);
      }
    } catch (err) {
      console.error("openCollectFee error", err);
    }
  }

  cancelCollect() {
    this.state.feesView       = this.state._collectOrigin || "list";
    this.state._collectOrigin = null;
    this.state.collectFeeData = null;
    this.state.collectErrors  = {};
  }

  _validateCollect() {
    const f      = this.state.collectForm;
    const data   = this.state.collectFeeData;
    const errors = {};
    const amount = parseFloat(f.amount_collected);
    if (!f.amount_collected || isNaN(amount) || amount <= 0) {
      errors.amount_collected = "Enter a valid positive amount.";
    } else if (data && amount > data.remaining_due + 0.001) {
      errors.amount_collected = `Amount cannot exceed remaining due ₹${formatCurrency(data.remaining_due)}.`;
    }
    if (!f.collection_date) errors.collection_date = "Payment date is required.";
    if (!f.payment_method)  errors.payment_method  = "Select a payment method.";
    this.state.collectErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async submitCollectFee() {
    if (!this._validateCollect() || this.state.collectSaving) return;
    this.closeSettingsMenu();
    this.state.collectSaving = true;
    const f = this.state.collectForm;
    const vals = {
      amount_collected: parseFloat(f.amount_collected),
      payment_method:   f.payment_method,
      collection_date:  f.collection_date,
      remarks:          f.remarks || "",
    };
    try {
      const receipt = await this.orm.call(
        "edumanage.student.fee", "collect_and_receipt", [this.state.collectFeeId, vals]
      );
      this.state.currentReceipt = receipt;
      this.state.feesView       = "receipt";
      this.state.collectSaving  = false;
      await this._loadFeesData();
      await this._loadDashboard();
    } catch (err) {
      this.state.collectSaving = false;
      this.state.collectErrors = { _form: err.message || err.data?.message || "Payment failed. Please try again." };
    }
  }

  backFromReceipt() {
    this.state.feesView      = "list";
    this.state.currentReceipt = null;
    this.state.activeFeesSubTab = "pending";
  }

  printReceipt() {
    window.print();
  }
}

registry.category("actions").add("edumanage_dashboard.main", EduManageDashboard);
