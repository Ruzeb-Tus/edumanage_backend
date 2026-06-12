/** @odoo-module **/
import { Component, useState, useRef, onMounted, onWillUnmount } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";

// ─────────────────────────────────────────────────────────────────────────────
// EduManage Institution Setup – Main Component
// ─────────────────────────────────────────────────────────────────────────────

const BOARD_OPTIONS = [
  { value: "cbse",  label: "CBSE",  sub: "Central Board" },
  { value: "icse",  label: "ICSE",  sub: "Council" },
  { value: "state", label: "State", sub: "Board" },
  { value: "ib",    label: "IB",    sub: "International" },
  { value: "igcse", label: "IGCSE", sub: "Cambridge" },
  { value: "other", label: "Other", sub: "Board" },
];

const STRENGTH_OPTIONS = [
  { value: "lt100",    label: "< 100" },
  { value: "100_500",  label: "100 – 500" },
  { value: "500_1000", label: "500 – 1,000" },
  { value: "1000_3000",label: "1,000 – 3,000" },
  { value: "gt3000",   label: "3,000+" },
];

const STEP_META = [
  { step: 1, label: "Identity" },
  { step: 2, label: "Contact"  },
  { step: 3, label: "Academics"},
];

export class EduManageSetup extends Component {
  static template = "edumanage_setup.SetupClient";

  setup() {
    this.orm        = useService("orm");
    this.action     = useService("action");
    this.notification = useService("notification");
    this.dialog     = useService("dialog");
    this.fileInput  = useRef("fileInput");

    // Bind all event handlers for OWL template usage
    this.selectType    = this.selectType.bind(this);
    this.selectBoard   = this.selectBoard.bind(this);
    this.selectStrength = this.selectStrength.bind(this);
    this.nextStep      = this.nextStep.bind(this);
    this.prevStep      = this.prevStep.bind(this);
    this.triggerFileInput = this.triggerFileInput.bind(this);
    this.onFileChange  = this.onFileChange.bind(this);
    this.removeLogo    = this.removeLogo.bind(this);
    this.onDragOver    = this.onDragOver.bind(this);
    this.onDragLeave   = this.onDragLeave.bind(this);
    this.onDrop        = this.onDrop.bind(this);
    this.finishSetup   = this.finishSetup.bind(this);

    this.state = useState({
      step: 1,
      saving: false,
      logoPreview: null,
      logoFile: null,
      errors: {},

      // Step 1
      institutionType: "",
      institutionName: "",

      // Step 2
      email:   "",
      phone:   "",
      website: "",
      city:    "",
      state:   "",
      zip:     "",
      address: "",

      // Step 3
      board:        "",
      affNumber:    "",
      estYear:      "",
      strength:     "",
    });
  }

  // ── Validation ──────────────────────────────────────────────
  validateStep(step) {
    const errors = {};
    if (step === 1) {
      if (!this.state.institutionType) errors.institutionType = "Please select institution type";
      if (!this.state.institutionName.trim()) errors.institutionName = "Institution name is required";
    }
    if (step === 2) {
      if (!this.state.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.state.email)) {
        errors.email = "Please enter a valid email";
      }
      if (!this.state.phone.trim()) errors.phone = "Phone number is required";
      if (!this.state.city.trim()) errors.city = "City is required";
    }
    this.state.errors = errors;
    return Object.keys(errors).length === 0;
  }

  // ── Navigation ──────────────────────────────────────────────
  nextStep() {
    if (!this.validateStep(this.state.step)) return;
    if (this.state.step < 3) this.state.step++;
  }

  prevStep() {
    if (this.state.step > 1) this.state.step--;
  }

  // ── Logo Upload ─────────────────────────────────────────────
  triggerFileInput() {
    this.fileInput.el.click();
  }

  onFileChange(ev) {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.state.logoPreview = e.target.result;
      this.state.logoFile = file;
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.state.logoPreview = null;
    this.state.logoFile = null;
    if (this.fileInput.el) this.fileInput.el.value = "";
  }

  // ── Drag & Drop ─────────────────────────────────────────────
  onDragOver(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add("em-drag-over");
  }

  onDragLeave(ev) {
    ev.currentTarget.classList.remove("em-drag-over");
  }

  onDrop(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.remove("em-drag-over");
    const file = ev.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.state.logoPreview = e.target.result;
        this.state.logoFile = file;
      };
      reader.readAsDataURL(file);
    }
  }

  // ── Type Selection ──────────────────────────────────────────
  selectType(type) {
    this.state.institutionType = type;
    delete this.state.errors.institutionType;
  }

  // ── Board Selection ─────────────────────────────────────────
  selectBoard(value) {
    this.state.board = this.state.board === value ? "" : value;
  }

  // ── Strength Selection ──────────────────────────────────────
  selectStrength(value) {
    this.state.strength = this.state.strength === value ? "" : value;
  }

  // ── Submit ──────────────────────────────────────────────────
  async finishSetup() {
    if (!this.validateStep(1) || !this.validateStep(2)) {
      this.notification.add("Please complete all required fields.", { type: "warning" });
      this.state.step = 1;
      return;
    }

    this.state.saving = true;
    try {
      // Convert logo to base64 if present
      let logoB64 = false;
      if (this.state.logoFile) {
        logoB64 = await new Promise((res) => {
          const r = new FileReader();
          r.onload = (e) => res(e.target.result.split(",")[1]);
          r.readAsDataURL(this.state.logoFile);
        });
      }

      const vals = {
        name: this.state.institutionName,
        institution_type: this.state.institutionType,
        email: this.state.email,
        phone: this.state.phone,
        website: this.state.website,
        city: this.state.city,
        zip: this.state.zip,
        street: this.state.address,
        board_affiliation: this.state.board,
        affiliation_number: this.state.affNumber,
        established_year: this.state.estYear ? parseInt(this.state.estYear) : false,
        total_students: this.state.strength,
        setup_complete: true,
      };
      if (logoB64) vals.logo = logoB64;

      const id = await this.orm.create("edumanage.institution", [vals]);

      this.notification.add(
        `${this.state.institutionName} has been set up successfully. Welcome to EduManage!`,
        { type: "success", title: "Institution Created" }
      );

      await this.action.doAction({
        type: "ir.actions.act_window",
        name: "Institution",
        res_model: "edumanage.institution",
        res_id: id,
        views: [[false, "form"]],
        target: "current",
      });
    } catch (err) {
      console.error(err);
      this.notification.add("Something went wrong. Please try again.", { type: "danger" });
    } finally {
      this.state.saving = false;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────
  getBoardOptions() { return BOARD_OPTIONS; }
  getStrengthOptions() { return STRENGTH_OPTIONS; }
  getStepMeta() { return STEP_META; }

  stepClass(s) {
    if (s.step < this.state.step) return "done";
    if (s.step === this.state.step) return "active";
    return "";
  }

  connectorClass(index) {
    return index < this.state.step - 1 ? "done" : "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Action Registration
// ─────────────────────────────────────────────────────────────────────────────
registry.category("actions").add("edumanage_setup.setup_action", EduManageSetup);
