import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import {
  Settings, School, Calendar, Save, CheckCircle, Building2, Phone,
  Mail, MapPin, Globe, Palette, DollarSign, Bell, Shield, Clock,
  CreditCard, FileText, Info, Upload, AlertTriangle,
} from "lucide-react";

interface SchoolSettings {
  schoolName?: string; schoolMotto?: string; schoolTagline?: string;
  schoolPhone?: string; schoolEmail?: string; schoolAddress?: string;
  schoolWebsite?: string; schoolLogo?: string; schoolType?: string;
  registrationNumber?: string; academicYear?: string; currentTerm?: string;
  termStartDate?: string; termEndDate?: string; terms?: string[];
  schoolStartTime?: string; schoolEndTime?: string; timezone?: string;
  academicWeeksPerTerm?: number; maxStudentsPerClass?: number;
  primaryColor?: string; accentColor?: string; currency?: string;
  currencySymbol?: string; paymentMethods?: string[]; invoicePrefix?: string;
  lateFeePercentage?: number; gracePeriodDays?: number; bankName?: string;
  bankAccount?: string; bankSortCode?: string; paystackEnabled?: boolean;
  emailNotifications?: boolean; smsNotifications?: boolean;
  announcementNotifications?: boolean; attendanceNotifications?: boolean;
  gradeNotifications?: boolean; paymentNotifications?: boolean;
  parentCommunicationEnabled?: boolean; requirePasswordChange?: boolean;
  sessionTimeout?: number; twoFactorEnabled?: boolean; language?: string;
  dateFormat?: string; subdomain?: string; plan?: string; createdAt?: string;
}

const TABS = [
  { id: "profile", label: "School Profile", icon: School },
  { id: "academic", label: "Academic", icon: Calendar },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "system", label: "System", icon: Settings },
];

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 mb-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
        <Icon className="w-5 h-5 text-primary" />{title}
      </h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, icon: Icon, children, hint, span }: { label: string; icon?: any; children: React.ReactNode; hint?: string; span?: number }) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-text-primary mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-text-muted" />}{label}
      </label>
      {children}
      {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-sm bg-white transition-all" />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none text-sm bg-white transition-all">
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <button type="button" onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-gray-200"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings").then((r) => r.data),
    retry: 1,
  });

  const settings: SchoolSettings = settingsData?.data || settingsData || {};
  const [form, setForm] = useState<SchoolSettings>({});

  useEffect(() => {
    if (settings) {
      setForm({
        schoolName: settings.schoolName || "", schoolMotto: settings.schoolMotto || "",
        schoolTagline: settings.schoolTagline || "", schoolPhone: settings.schoolPhone || "",
        schoolEmail: settings.schoolEmail || "", schoolAddress: settings.schoolAddress || "",
        schoolWebsite: settings.schoolWebsite || "", schoolLogo: settings.schoolLogo || "",
        schoolType: settings.schoolType || "montessori", registrationNumber: settings.registrationNumber || "",
        academicYear: settings.academicYear || "", currentTerm: settings.currentTerm || "",
        termStartDate: settings.termStartDate || "", termEndDate: settings.termEndDate || "",
        terms: settings.terms || ["Term 1", "Term 2", "Term 3"],
        schoolStartTime: settings.schoolStartTime || "08:00", schoolEndTime: settings.schoolEndTime || "15:00",
        timezone: settings.timezone || "Africa/Lagos", academicWeeksPerTerm: settings.academicWeeksPerTerm || 12,
        maxStudentsPerClass: settings.maxStudentsPerClass || 30, primaryColor: settings.primaryColor || "#1A56DB",
        accentColor: settings.accentColor || "#F59E0B", currency: settings.currency || "NGN",
        currencySymbol: settings.currencySymbol || "\u20A6", paymentMethods: settings.paymentMethods || ["cash", "bank_transfer"],
        invoicePrefix: settings.invoicePrefix || "INV", lateFeePercentage: settings.lateFeePercentage || 5,
        gracePeriodDays: settings.gracePeriodDays || 7, bankName: settings.bankName || "",
        bankAccount: settings.bankAccount || "", bankSortCode: settings.bankSortCode || "",
        paystackEnabled: settings.paystackEnabled || false, emailNotifications: settings.emailNotifications !== false,
        smsNotifications: settings.smsNotifications || false, announcementNotifications: settings.announcementNotifications !== false,
        attendanceNotifications: settings.attendanceNotifications !== false, gradeNotifications: settings.gradeNotifications !== false,
        paymentNotifications: settings.paymentNotifications !== false, parentCommunicationEnabled: settings.parentCommunicationEnabled !== false,
        requirePasswordChange: settings.requirePasswordChange || false, sessionTimeout: settings.sessionTimeout || 60,
        twoFactorEnabled: settings.twoFactorEnabled || false, language: settings.language || "en",
        dateFormat: settings.dateFormat || "DD/MM/YYYY", subdomain: settings.subdomain, plan: settings.plan,
        createdAt: settings.createdAt,
      });
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: (data: SchoolSettings) => apiClient.put("/settings", data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setSaved(true); setHasChanges(false); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSave = () => { updateSettings.mutate(form); };
  const update = <K extends keyof SchoolSettings>(key: K, value: SchoolSettings[K]) => { setForm((p) => ({ ...p, [key]: value })); setHasChanges(true); };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-muted rounded w-48 mx-auto" />
            <div className="h-4 bg-surface-muted rounded w-64 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-8">{[1,2,3,4].map((i) => <div key={i} className="h-12 bg-surface-muted rounded-xl" />)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Settings className="w-5 h-5 text-white" />
            </div>
            School Settings
          </h1>
          <p className="text-text-muted text-sm mt-1 ml-13">Configure your school profile, academic year, billing, and preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-xs font-medium text-warning bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Unsaved changes
            </span>
          )}
          <button onClick={handleSave} disabled={updateSettings.isPending || !hasChanges}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : updateSettings.isPending
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</span>
              : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 mb-6 bg-white rounded-xl border border-border p-1 shadow-sm">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-primary text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-surface-muted"}`}>
            <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (<>
          <Section title="School Identity" icon={School}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="School Name" icon={Building2} span={2}>
                <Input value={form.schoolName || ""} onChange={(v) => update("schoolName", v)} placeholder="e.g. Sunrise Montessori Academy" />
              </Field>
              <Field label="School Motto" span={2}>
                <Input value={form.schoolMotto || ""} onChange={(v) => update("schoolMotto", v)} placeholder="e.g. Nurturing Independent Thinkers" />
              </Field>
              <Field label="Tagline" span={2} hint="Short tagline for reports and public-facing pages">
                <Input value={form.schoolTagline || ""} onChange={(v) => update("schoolTagline", v)} placeholder="e.g. Where every child matters" />
              </Field>
              <Field label="School Type" icon={Building2}>
                <Select value={form.schoolType || "montessori"} onChange={(v) => update("schoolType", v)}
                  options={[{ value: "montessori", label: "Montessori" }, { value: "traditional", label: "Traditional" }, { value: "hybrid", label: "Hybrid" }]} />
              </Field>
              <Field label="Registration Number" hint="Official school registration number">
                <Input value={form.registrationNumber || ""} onChange={(v) => update("registrationNumber", v)} placeholder="e.g. REG-2025-001" />
              </Field>
            </div>
          </Section>
          <Section title="Contact Information" icon={Phone}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Phone Number" icon={Phone}>
                <Input value={form.schoolPhone || ""} onChange={(v) => update("schoolPhone", v)} placeholder="+234 800 123 4567" type="tel" />
              </Field>
              <Field label="Email Address" icon={Mail}>
                <Input value={form.schoolEmail || ""} onChange={(v) => update("schoolEmail", v)} placeholder="info@school.edu" type="email" />
              </Field>
              <Field label="Website" icon={Globe} span={2}>
                <Input value={form.schoolWebsite || ""} onChange={(v) => update("schoolWebsite", v)} placeholder="https://www.school.edu" />
              </Field>
              <Field label="Address" icon={MapPin} span={2}>
                <Input value={form.schoolAddress || ""} onChange={(v) => update("schoolAddress", v)} placeholder="123 Education Lane, Lagos" />
              </Field>
            </div>
          </Section>
          <Section title="School Logo" icon={Upload}>
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border bg-surface-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.schoolLogo ? <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-cover" />
                  : <div className="text-center"><School className="w-8 h-8 text-text-muted/30 mx-auto" /><p className="text-[10px] text-text-muted mt-1">No logo</p></div>}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-muted mb-2">Upload your school logo. This will appear on the sidebar, reports, and invoices.</p>
                <Input value={form.schoolLogo || ""} onChange={(v) => update("schoolLogo", v)} placeholder="Paste image URL or upload path" />
                <p className="text-xs text-text-muted mt-1">Supported: JPG, PNG, SVG. Recommended: 200x200px</p>
              </div>
            </div>
          </Section>
        </>)}

        {/* ACADEMIC TAB */}
        {activeTab === "academic" && (<>
          <Section title="Academic Year & Terms" icon={Calendar}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Academic Year" icon={Calendar}>
                <Input value={form.academicYear || ""} onChange={(v) => update("academicYear", v)} placeholder="e.g. 2025-2026" />
              </Field>
              <Field label="Current Term">
                <Select value={form.currentTerm || ""} onChange={(v) => update("currentTerm", v)}
                  options={(form.terms || ["Term 1", "Term 2", "Term 3"]).map((t) => ({ value: t, label: t }))}
                  placeholder="Select current term" />
              </Field>
              <Field label="Term Start Date"><Input type="date" value={form.termStartDate || ""} onChange={(v) => update("termStartDate", v)} /></Field>
              <Field label="Term End Date"><Input type="date" value={form.termEndDate || ""} onChange={(v) => update("termEndDate", v)} /></Field>
              <Field label="Weeks Per Term" hint="Number of academic weeks per term">
                <Input type="number" value={String(form.academicWeeksPerTerm || 12)} onChange={(v) => update("academicWeeksPerTerm", Number(v))} />
              </Field>
              <Field label="Max Students Per Class">
                <Input type="number" value={String(form.maxStudentsPerClass || 30)} onChange={(v) => update("maxStudentsPerClass", Number(v))} />
              </Field>
            </div>
          </Section>
          <Section title="School Hours" icon={Clock}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Start Time"><Input type="time" value={form.schoolStartTime || "08:00"} onChange={(v) => update("schoolStartTime", v)} /></Field>
              <Field label="End Time"><Input type="time" value={form.schoolEndTime || "15:00"} onChange={(v) => update("schoolEndTime", v)} /></Field>
              <Field label="Timezone">
                <Select value={form.timezone || "Africa/Lagos"} onChange={(v) => update("timezone", v)}
                  options={[{ value: "Africa/Lagos", label: "West Africa (WAT)" }, { value: "Africa/Nairobi", label: "East Africa (EAT)" },
                    { value: "Africa/Johannesburg", label: "South Africa (SAST)" }, { value: "Europe/London", label: "GMT / London" },
                    { value: "America/New_York", label: "Eastern Time (ET)" }, { value: "Asia/Dubai", label: "Gulf (GST)" }]} />
              </Field>
            </div>
          </Section>
          <Section title="Term Schedule" icon={FileText}>
            <div className="space-y-3">
              {(form.terms || ["Term 1", "Term 2", "Term 3"]).map((term, i) => (
                <div key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${form.currentTerm === term ? "border-primary bg-primary-subtle" : "border-border bg-surface-muted/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${form.currentTerm === term ? "bg-primary text-white" : "bg-white text-text-muted"}`}>{i + 1}</div>
                    <div>
                      <p className="font-semibold text-text-primary text-sm">{term}</p>
                      {form.currentTerm === term && <p className="text-xs text-primary font-medium">Current Term</p>}
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">{form.academicWeeksPerTerm || 12} weeks</p>
                </div>
              ))}
            </div>
          </Section>
        </>)}

        {/* BRANDING TAB */}
        {activeTab === "branding" && (<>
          <Section title="Color Scheme" icon={Palette}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Primary Color" hint="Main brand color for buttons and links">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primaryColor || "#1A56DB"} onChange={(e) => update("primaryColor", e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.primaryColor || "#1A56DB"} onChange={(v) => update("primaryColor", v)} />
                </div>
              </Field>
              <Field label="Accent Color" hint="Secondary color for highlights">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.accentColor || "#F59E0B"} onChange={(e) => update("accentColor", e.target.value)} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                  <Input value={form.accentColor || "#F59E0B"} onChange={(v) => update("accentColor", v)} />
                </div>
              </Field>
            </div>
            <div className="mt-6 p-6 rounded-xl border border-border bg-surface-muted/30">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Color Preview</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md" style={{ backgroundColor: form.primaryColor || "#1A56DB" }}>Primary</div>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md" style={{ backgroundColor: form.accentColor || "#F59E0B" }}>Accent</div>
                <div className="flex-1 h-16 rounded-xl p-3 flex items-center" style={{ backgroundColor: form.primaryColor || "#1A56DB" }}>
                  <span className="text-white text-sm font-semibold">Dashboard Header Preview</span>
                </div>
              </div>
            </div>
          </Section>
          <Section title="Logo & Branding" icon={Upload}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-border bg-white text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden border-2 border-dashed border-border flex items-center justify-center bg-surface-muted">
                  {form.schoolLogo ? <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-cover" /> : <School className="w-10 h-10 text-text-muted/30" />}
                </div>
                <p className="text-sm font-semibold text-text-primary">{form.schoolName || "School Name"}</p>
                <p className="text-xs text-text-muted">{form.schoolMotto || "School Motto"}</p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-slate-800 text-white text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden border-2 border-white/20 flex items-center justify-center bg-white/10">
                  {form.schoolLogo ? <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-cover" /> : <School className="w-10 h-10 text-white/30" />}
                </div>
                <p className="text-sm font-semibold">{form.schoolName || "School Name"}</p>
                <p className="text-xs text-white/60">{form.schoolMotto || "School Motto"}</p>
              </div>
            </div>
          </Section>
        </>)}

        {/* BILLING TAB */}
        {activeTab === "billing" && (<>
          <Section title="Currency & Payment" icon={DollarSign}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Currency">
                <Select value={form.currency || "NGN"} onChange={(v) => { update("currency", v); const sym: Record<string,string> = {NGN:"\u20A6",USD:"$",GBP:"\u00A3",EUR:"\u20AC",GHS:"GH\u20B5",KES:"KSh",ZAR:"R",UGX:"USh"}; update("currencySymbol", sym[v] || ""); }}
                  options={[{ value: "NGN", label: "Nigerian Naira (\u20A6)" }, { value: "USD", label: "US Dollar ($)" },
                    { value: "GBP", label: "British Pound (\u00A3)" }, { value: "EUR", label: "Euro (\u20AC)" },
                    { value: "GHS", label: "Ghanaian Cedis (GH\u20B5)" }, { value: "KES", label: "Kenyan Shilling (KSh)" },
                    { value: "ZAR", label: "South African Rand (R)" }, { value: "UGX", label: "Ugandan Shilling (USh)" }]} />
              </Field>
              <Field label="Currency Symbol"><Input value={form.currencySymbol || ""} onChange={(v) => update("currencySymbol", v)} placeholder="\u20A6" /></Field>
              <Field label="Invoice Prefix" hint="Prefix for invoice numbers"><Input value={form.invoicePrefix || ""} onChange={(v) => update("invoicePrefix", v)} placeholder="INV" /></Field>
              <Field label="Late Fee (%)"><Input type="number" value={String(form.lateFeePercentage || 5)} onChange={(v) => update("lateFeePercentage", Number(v))} /></Field>
              <Field label="Grace Period (Days)" hint="Days after due date before late fee">
                <Input type="number" value={String(form.gracePeriodDays || 7)} onChange={(v) => update("gracePeriodDays", Number(v))} />
              </Field>
            </div>
          </Section>
          <Section title="Bank Details" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Bank Name"><Input value={form.bankName || ""} onChange={(v) => update("bankName", v)} placeholder="e.g. Guaranty Trust Bank" /></Field>
              <Field label="Account Number"><Input value={form.bankAccount || ""} onChange={(v) => update("bankAccount", v)} placeholder="e.g. 0123456789" /></Field>
              <Field label="Sort Code / Routing"><Input value={form.bankSortCode || ""} onChange={(v) => update("bankSortCode", v)} placeholder="e.g. 058-123456" /></Field>
              <Field label="Online Payments">
                <Toggle checked={!!form.paystackEnabled} onChange={(v) => update("paystackEnabled", v)} label="Enable Paystack" description="Allow parents to pay fees online" />
              </Field>
            </div>
          </Section>
        </>)}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (<>
          <Section title="Notification Channels" icon={Bell}>
            <Toggle checked={!!form.emailNotifications} onChange={(v) => update("emailNotifications", v)} label="Email Notifications" description="Send notifications via email" />
            <Toggle checked={!!form.smsNotifications} onChange={(v) => update("smsNotifications", v)} label="SMS Notifications" description="Send SMS alerts for critical updates" />
          </Section>
          <Section title="Notification Types" icon={FileText}>
            <Toggle checked={!!form.announcementNotifications} onChange={(v) => update("announcementNotifications", v)} label="New Announcements" description="Notify users when announcements are published" />
            <Toggle checked={!!form.attendanceNotifications} onChange={(v) => update("attendanceNotifications", v)} label="Attendance Alerts" description="Notify parents when their child is marked absent" />
            <Toggle checked={!!form.gradeNotifications} onChange={(v) => update("gradeNotifications", v)} label="Observation Updates" description="Notify parents when observations are recorded" />
            <Toggle checked={!!form.paymentNotifications} onChange={(v) => update("paymentNotifications", v)} label="Payment Alerts" description="Notify parents of invoices and confirmations" />
            <Toggle checked={!!form.parentCommunicationEnabled} onChange={(v) => update("parentCommunicationEnabled", v)} label="Parent Messaging" description="Allow parents to send messages to teachers" />
          </Section>
        </>)}

        {/* SECURITY TAB */}
        {activeTab === "security" && (<>
          <Section title="Authentication" icon={Shield}>
            <Toggle checked={!!form.requirePasswordChange} onChange={(v) => update("requirePasswordChange", v)} label="Force Password Change" description="Require all users to change password on next login" />
            <Toggle checked={!!form.twoFactorEnabled} onChange={(v) => update("twoFactorEnabled", v)} label="Two-Factor Authentication" description="Require 2FA for admin accounts (coming soon)" />
            <Field label="Session Timeout (minutes)" hint="Auto-logout after inactivity">
              <Input type="number" value={String(form.sessionTimeout || 60)} onChange={(v) => update("sessionTimeout", Number(v))} />
            </Field>
          </Section>
          <Section title="Data & Privacy" icon={FileText}>
            <div className="p-4 rounded-xl bg-surface-muted/50 border border-border space-y-3">
              {[["Data Retention", "Student records retained for 7 years after enrollment"],
                ["Audit Logging", "All user actions logged and cannot be deleted"],
                ["Database Encryption", "All data encrypted at rest and in transit"],
              ].map(([t, d]) => (
                <div key={t} className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold text-text-primary">{t}</p><p className="text-xs text-text-muted">{d}</p></div>
                  <span className="text-xs font-medium text-success bg-green-50 px-2.5 py-1 rounded-full">Active</span>
                </div>
              ))}
            </div>
          </Section>
        </>)}

        {/* SYSTEM TAB */}
        {activeTab === "system" && (<>
          <Section title="Regional Settings" icon={Globe}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Language">
                <Select value={form.language || "en"} onChange={(v) => update("language", v)}
                  options={[{ value: "en", label: "English" }, { value: "fr", label: "French" }, { value: "yo", label: "Yoruba" },
                    { value: "ig", label: "Igbo" }, { value: "ha", label: "Hausa" }, { value: "sw", label: "Swahili" }]} />
              </Field>
              <Field label="Date Format">
                <Select value={form.dateFormat || "DD/MM/YYYY"} onChange={(v) => update("dateFormat", v)}
                  options={[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2025)" }, { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2025)" },
                    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2025-12-31)" }]} />
              </Field>
            </div>
          </Section>
          <Section title="School Identity" icon={Building2}>
            <div className="space-y-3">
              {settings.subdomain && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-muted/50 border border-border">
                  <div><p className="text-sm font-semibold text-text-primary">Subdomain</p><p className="text-xs text-text-muted">Your unique school URL</p></div>
                  <span className="text-sm font-mono font-semibold text-primary">{settings.subdomain}.montessori-erp.com</span>
                </div>
              )}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-muted/50 border border-border">
                <div><p className="text-sm font-semibold text-text-primary">Plan</p><p className="text-xs text-text-muted">Current subscription plan</p></div>
                <span className="text-xs font-semibold text-primary bg-primary-subtle px-3 py-1 rounded-full capitalize">{settings.plan || "starter"}</span>
              </div>
              {settings.createdAt && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-surface-muted/50 border border-border">
                  <div><p className="text-sm font-semibold text-text-primary">Registered</p><p className="text-xs text-text-muted">When your school was registered</p></div>
                  <span className="text-sm text-text-primary">{new Date(settings.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              )}
            </div>
          </Section>
        </>)}
      </div>
    </div>
  );
}
