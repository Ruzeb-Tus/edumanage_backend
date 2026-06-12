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
    const greet = getGreeting();
    const date  = formatDate();

    // Read activeNav from router state at start
    const initialNav = router.current.activeNav || "dashboard";

    this.state = useState({
      sidebarCollapsed: false,
      activeNav: initialNav,
      showAlert: true,
      greetText:  greet,
      userName: "Admin",
      userInitials: "A",
      institutionName: "EduManage Institution",
      dailyQuote: QUOTES[new Date().getDay() % QUOTES.length],
      dayName:  date.dayName,
      dateStr:  date.dateStr,
      dateCaps: date.dateCaps,
    });

    this.navItems     = NAV_ITEMS;
    this.metrics      = METRICS;
    this.shortcuts    = SHORTCUTS;
    this.activityFeed = ACTIVITY.map((a) => ({
      ...a,
      meta: relativeTime(a.minutesAgo),
    }));

    this.toggleSidebar = this.toggleSidebar.bind(this);
    this.dismissAlert  = this.dismissAlert.bind(this);
    this.setNav        = this.setNav.bind(this);

    // Sync activeNav from router state on popstate/ROUTE_CHANGE
    const onRoute = () => {
      const activeNav = router.current.activeNav || "dashboard";
      if (this.state.activeNav !== activeNav) {
        this.state.activeNav = activeNav;
      }
    };
    routerBus.addEventListener("ROUTE_CHANGE", onRoute);
    onWillUnmount(() => {
      routerBus.removeEventListener("ROUTE_CHANGE", onRoute);
    });

    onMounted(() => this._loadUserInfo());
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
          ["name"], { limit: 1 }
        );
        if (institutions.length) this.state.institutionName = institutions[0].name;
      } catch (_) { /* module may not be ready */ }
    } catch (_) { /* silently handle */ }
  }

  toggleSidebar() { this.state.sidebarCollapsed = !this.state.sidebarCollapsed; }
  dismissAlert()  { this.state.showAlert = false; }
  setNav(id) {
    this.state.activeNav = id;
    router.pushState({ activeNav: id });
  }

  get activeTitle() {
    const nav = this.state.activeNav || "dashboard";
    return nav.charAt(0).toUpperCase() + nav.slice(1);
  }
}

registry.category("actions").add("edumanage_dashboard.main", EduManageDashboard);
