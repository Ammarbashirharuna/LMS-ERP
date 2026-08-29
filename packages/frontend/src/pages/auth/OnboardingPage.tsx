import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";
import {
  School,
  Calendar,
  Users,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ClassTemplate {
  name: string;
  ageRange: string;
}

/* ------------------------------------------------------------------ */
/*  Step Indicators                                                    */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { icon: School, label: "School Info" },
    { icon: Calendar, label: "Academic Year" },
    { icon: GraduationCap, label: "Classes" },
    { icon: Users, label: "Invite Teachers" },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              i < currentStep
                ? "bg-success text-white"
                : i === currentStep
                ? "bg-primary text-white ring-4 ring-primary/20"
                : "bg-surface-muted text-text-muted"
            }`}
          >
            {i < currentStep ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-12 h-0.5 ${i < currentStep ? "bg-success" : "bg-surface-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: School Info
  const [schoolName, setSchoolName] = useState("");
  const [schoolMotto, setSchoolMotto] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");

  // Step 2: Academic Year
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getFullYear() + 1}`;
  });
  const [currentTerm, setCurrentTerm] = useState("Term 1");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-09-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear() + 1}-06-30`;
  });

  // Step 3: Classes
  const [classes, setClasses] = useState<ClassTemplate[]>([
    { name: "Infant Community", ageRange: "0-3 years" },
    { name: "Casa (3-6)", ageRange: "3-6 years" },
    { name: "Lower Elementary", ageRange: "6-9 years" },
    { name: "Upper Elementary", ageRange: "9-12 years" },
  ]);
  const [newClassName, setNewClassName] = useState("");
  const [newClassAge, setNewClassAge] = useState("");

  // Step 4: Invite Teachers
  const [teacherEmails, setTeacherEmails] = useState<{ email: string; name: string }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return schoolName.trim().length > 0;
      case 1: return academicYear && startDate && endDate;
      case 2: return classes.length > 0;
      case 3: return true; // Teachers are optional
      default: return true;
    }
  };

  const handleAddClass = () => {
    if (newClassName.trim()) {
      setClasses([...classes, { name: newClassName.trim(), ageRange: newClassAge.trim() || "Not specified" }]);
      setNewClassName("");
      setNewClassAge("");
    }
  };

  const handleRemoveClass = (index: number) => {
    setClasses(classes.filter((_, i) => i !== index));
  };

  const handleAddTeacher = () => {
    if (inviteEmail.trim()) {
      setTeacherEmails([...teacherEmails, { email: inviteEmail.trim(), name: inviteName.trim() }]);
      setInviteEmail("");
      setInviteName("");
    }
  };

  const handleRemoveTeacher = (index: number) => {
    setTeacherEmails(teacherEmails.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // Save school settings
      await apiClient.put("/settings", {
        schoolName,
        schoolMotto,
        schoolPhone,
        schoolEmail,
        schoolAddress,
        academicYear,
        currentTerm,
        termStartDate: startDate,
        termEndDate: endDate,
      });

      // Create classes
      for (const cls of classes) {
        await apiClient.post("/classes", {
          name: cls.name,
          academicYear,
        });
      }

      navigate("/");
    } catch (err: any) {
      const msg = err?.message || "Setup failed. Please try again.";
      if (msg.includes("401") || msg.includes("expired") || msg.includes("Session")) {
        setError("Your session has expired. Please go back and log in first.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center py-12">
      <div className="surface p-8 w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <School className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Welcome to Montessori ERP</h1>
          <p className="text-text-muted text-sm mt-1">Let&apos;s set up your school in a few quick steps</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} totalSteps={4} />

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-danger text-sm">{error}</div>
        )}

        {/* Step Content */}
        <div className="min-h-[320px]">
          {/* Step 1: School Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">School Information</h2>
              <p className="text-sm text-text-muted">Tell us about your school</p>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">School Name *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Sunrise Montessori School"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">School Motto</label>
                <input
                  type="text"
                  value={schoolMotto}
                  onChange={(e) => setSchoolMotto(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. Nurturing Independent Thinkers"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Phone</label>
                  <input
                    type="tel"
                    value={schoolPhone}
                    onChange={(e) => setSchoolPhone(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Email</label>
                  <input
                    type="email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Address</label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic Year */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Academic Year Setup</h2>
              <p className="text-sm text-text-muted">Configure your current academic year and term</p>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Academic Year *</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. 2025-2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Current Term</label>
                <select
                  value={currentTerm}
                  onChange={(e) => setCurrentTerm(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                >
                  <option>Term 1</option>
                  <option>Term 2</option>
                  <option>Term 3</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary-subtle border border-primary/20 text-sm text-primary">
                <strong>Note:</strong> You can change these settings later from the School Settings page.
              </div>
            </div>
          )}

          {/* Step 3: Classes */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Class Setup</h2>
              <p className="text-sm text-text-muted">Create your classroom structure (you can add more later)</p>

              {/* Existing classes */}
              <div className="space-y-2">
                {classes.map((cls, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
                    <div>
                      <span className="font-medium text-text-primary text-sm">{cls.name}</span>
                      <span className="text-xs text-text-muted ml-2">({cls.ageRange})</span>
                    </div>
                    <button onClick={() => handleRemoveClass(i)} className="p-1 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new class */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Class name"
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
                />
                <input
                  type="text"
                  value={newClassAge}
                  onChange={(e) => setNewClassAge(e.target.value)}
                  placeholder="Age range"
                  className="w-40 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddClass()}
                />
                <button onClick={handleAddClass} className="btn-primary flex items-center gap-1 text-sm">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Invite Teachers */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Invite Teachers</h2>
              <p className="text-sm text-text-muted">Add teacher emails to send them login invitations (optional — you can do this later)</p>

              {/* Invited teachers */}
              {teacherEmails.length > 0 && (
                <div className="space-y-2">
                  {teacherEmails.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
                      <div>
                        <span className="font-medium text-text-primary text-sm">{t.name || "Teacher"}</span>
                        <span className="text-xs text-text-muted ml-2">{t.email}</span>
                      </div>
                      <button onClick={() => handleRemoveTeacher(i)} className="p-1 rounded-lg hover:bg-red-50 text-text-muted hover:text-danger transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add teacher */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Teacher name"
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTeacher()}
                />
                <button onClick={handleAddTeacher} className="btn-primary flex items-center gap-1 text-sm">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-success">
                <strong>Note:</strong> You can create teacher accounts later from the HR & Staff page using the &quot;Create Login&quot; feature.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Complete Setup"} <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
