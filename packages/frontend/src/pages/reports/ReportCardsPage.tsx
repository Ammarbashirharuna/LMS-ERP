import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import {
  FileText, Search, ChevronRight, Award, BookOpen, Star,
  User, Printer, Download,
} from "lucide-react";

interface SchoolSettings {
  schoolName?: string; schoolMotto?: string; schoolTagline?: string;
  schoolLogo?: string; schoolPhone?: string; schoolEmail?: string;
  schoolAddress?: string; academicYear?: string; currentTerm?: string;
  primaryColor?: string; accentColor?: string;
}

interface Student {
  id: string; firstName: string; lastName: string;
  classRoom?: { name: string; academicYear: string };
}

interface Observation {
  id: string; note: string; masteryLevel: string; createdAt: string;
  curriculumItem?: { title: string; area?: { name: string } };
  teacher?: { firstName: string; lastName: string };
}

interface CurriculumArea {
  id: string; name: string; items: { id: string; title: string }[];
}

function getMasteryColor(level: string) {
  switch (level) {
    case "MASTERED": return "bg-success text-white";
    case "PRACTICING": return "bg-warning text-white";
    case "INTRODUCED": return "bg-primary-subtle text-primary";
    default: return "bg-surface-muted text-text-muted";
  }
}

function getMasteryIcon(level: string) {
  switch (level) {
    case "MASTERED": return "\u2B50";
    case "PRACTICING": return "\uD83D\uDD04";
    case "INTRODUCED": return "\uD83D\uDCD6";
    default: return "\u2014";
  }
}

function getOverallProgress(observations: Observation[]) {
  if (observations.length === 0) return { mastered: 0, practicing: 0, introduced: 0, total: 0 };
  return {
    mastered: observations.filter((o) => o.masteryLevel === "MASTERED").length,
    practicing: observations.filter((o) => o.masteryLevel === "PRACTICING").length,
    introduced: observations.filter((o) => o.masteryLevel === "INTRODUCED").length,
    total: observations.length,
  };
}

/* ------------------------------------------------------------------ */
/*  Branded Report Card                                                */
/* ------------------------------------------------------------------ */

function ReportCard({ student, observations, settings }: {
  student: Student; observations: Observation[]; settings: SchoolSettings;
}) {
  const progress = getOverallProgress(observations);
  const progressPercent = progress.total > 0 ? Math.round((progress.mastered / progress.total) * 100) : 0;
  const primaryColor = settings.primaryColor || "#1A56DB";

  const areaObservations = new Map<string, Observation[]>();
  for (const obs of observations) {
    const areaName = obs.curriculumItem?.area?.name || "General";
    if (!areaObservations.has(areaName)) areaObservations.set(areaName, []);
    areaObservations.get(areaName)!.push(obs);
  }

  const term = observations.length > 0
    ? new Date(observations[0].createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

  const handlePrint = () => { window.print(); };

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
      {/* Report Header - Branded */}
      <div className="p-6 sm:p-8 text-white text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/15 translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          {/* School branding */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {settings.schoolLogo ? (
              <img src={settings.schoolLogo} alt="School logo" className="w-12 h-12 rounded-xl object-cover border-2 border-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="text-left">
              <p className="text-sm font-bold">{settings.schoolName || "Montessori School"}</p>
              <p className="text-xs text-white/70">{settings.schoolMotto || "Nurturing Independent Thinkers"}</p>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold">Student Progress Report</h2>
          <p className="text-white/80 mt-1 text-sm">{settings.academicYear || student.classRoom?.academicYear || "Current Year"} {settings.currentTerm ? `\u2014 ${settings.currentTerm}` : ""}</p>

          <div className="mt-4 flex items-center justify-center gap-4 sm:gap-8 text-sm flex-wrap">
            <div>
              <span className="text-white/60 text-xs">Student</span>
              <p className="font-bold">{student.firstName} {student.lastName}</p>
            </div>
            <div>
              <span className="text-white/60 text-xs">Class</span>
              <p className="font-bold">{student.classRoom?.name || "N/A"}</p>
            </div>
            <div>
              <span className="text-white/60 text-xs">Report Period</span>
              <p className="font-bold">{term || "All Time"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="p-5 sm:p-6 border-b border-border">
        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-sm sm:text-base">
          <Award className="w-5 h-5" style={{ color: primaryColor }} /> Overall Progress Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 stagger-in">
          <div className="text-center p-3 sm:p-4 rounded-xl bg-surface-muted/50 card-hover">
            <p className="text-2xl sm:text-3xl font-bold text-text-primary">{progress.total}</p>
            <p className="text-xs text-text-muted mt-1">Total</p>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-xl bg-green-50 card-hover">
            <p className="text-2xl sm:text-3xl font-bold text-success">{progress.mastered}</p>
            <p className="text-xs text-text-muted mt-1">Mastered</p>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-xl bg-amber-50 card-hover">
            <p className="text-2xl sm:text-3xl font-bold text-warning">{progress.practicing}</p>
            <p className="text-xs text-text-muted mt-1">Practicing</p>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-xl bg-primary-subtle card-hover">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>{progress.introduced}</p>
            <p className="text-xs text-text-muted mt-1">Introduced</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
            <span className="font-medium">Mastery Progress</span>
            <span className="font-bold" style={{ color: primaryColor }}>{progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
            <div className="h-full rounded-full progress-animate" style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${primaryColor}, ${settings.accentColor || "#F59E0B"})` }} />
          </div>
        </div>
      </div>

      {/* By Curriculum Area */}
      <div className="p-5 sm:p-6 border-b border-border">
        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-sm sm:text-base">
          <BookOpen className="w-5 h-5" style={{ color: primaryColor }} /> Progress by Area
        </h3>
        {areaObservations.size === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No observations recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-in">
            {Array.from(areaObservations.entries()).map(([areaName, obs]) => {
              const areaProgress = getOverallProgress(obs);
              const areaPercent = areaProgress.total > 0 ? Math.round((areaProgress.mastered / areaProgress.total) * 100) : 0;
              return (
                <div key={areaName} className="border border-border rounded-xl p-4 card-hover">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-text-primary text-sm">{areaName}</h4>
                    <span className="text-xs text-text-muted">{obs.length} observation{obs.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-muted overflow-hidden mb-3">
                    <div className="h-full rounded-full progress-animate" style={{ width: `${areaPercent}%`, background: `linear-gradient(90deg, ${primaryColor}, ${settings.accentColor || "#F59E0B"})` }} />
                  </div>
                  <div className="space-y-2">
                    {obs.map((o) => (
                      <div key={o.id} className="flex items-center gap-2 sm:gap-3 text-sm">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${getMasteryColor(o.masteryLevel)}`}>
                          {getMasteryIcon(o.masteryLevel)} {o.masteryLevel}
                        </span>
                        <span className="text-text-primary font-medium truncate">{o.curriculumItem?.title || "General"}</span>
                        {o.teacher && <span className="text-text-muted text-xs hidden sm:inline">by {o.teacher.firstName} {o.teacher.lastName}</span>}
                        <span className="text-text-muted text-xs ml-auto flex-shrink-0">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Observations */}
      <div className="p-5 sm:p-6 border-b border-border">
        <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2 text-sm sm:text-base">
          <Star className="w-5 h-5" style={{ color: primaryColor }} /> Recent Teacher Observations
        </h3>
        <div className="space-y-3 stagger-in">
          {observations.slice(0, 10).map((obs) => (
            <div key={obs.id} className="p-3 rounded-xl bg-surface-muted/50 card-hover">
              <div className="flex items-center justify-between mb-1">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${getMasteryColor(obs.masteryLevel)}`}>{obs.masteryLevel}</span>
                <span className="text-xs text-text-muted">{new Date(obs.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-text-primary mt-1">{obs.note}</p>
              {obs.teacher && (
                <p className="text-xs text-text-muted mt-1">{"\u2014"} {obs.teacher.firstName} {obs.teacher.lastName}{obs.curriculumItem?.title ? ` \u00B7 ${obs.curriculumItem.title}` : ""}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Branded Footer */}
      <div className="p-5 sm:p-6 border-t border-border bg-surface-muted/30 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {settings.schoolLogo ? (
            <img src={settings.schoolLogo} alt="" className="w-6 h-6 rounded-md object-cover" />
          ) : null}
          <p className="text-xs font-semibold text-text-primary">{settings.schoolName || "Montessori School"}</p>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">
          {settings.schoolAddress && <>{settings.schoolAddress} | </>}
          {settings.schoolPhone && <>{settings.schoolPhone} | </>}
          {settings.schoolEmail && <>{settings.schoolEmail}<br /></>}
        </p>
        <p className="text-xs text-text-muted mt-2">
          Generated on {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Print/Download buttons */}
      <div className="p-4 border-t border-border flex justify-center gap-3 no-print">
        <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-sm">
          <Printer className="w-4 h-4" /> Print Report Card
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export function ReportCardsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings").then((r) => r.data),
    retry: 1, staleTime: 300000,
  });
  const settings: SchoolSettings = settingsData?.data || settingsData || {};

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiClient.get("/students?limit=200").then((r) => r.data),
    retry: 1,
  });

  const { data: observationsData, isLoading: obsLoading } = useQuery({
    queryKey: ["observations", selectedStudentId],
    queryFn: () => apiClient.get(`/observations?studentId=${selectedStudentId}`).then((r) => r.data),
    enabled: !!selectedStudentId, retry: 1,
  });

  const students: Student[] = studentsData?.data || studentsData || [];
  const observations: Observation[] = observationsData?.data || observationsData || [];
  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return s.firstName.toLowerCase().includes(t) || s.lastName.toLowerCase().includes(t);
  });
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Report Cards
            </h1>
            <p className="text-text-muted text-sm mt-1 ml-13">Observation-based progress reports for parents and teachers</p>
          </div>
        </div>

        {/* Student Selection */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> Select Student
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Search students by name..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
          </div>
          {studentsLoading ? (
            <div className="text-center py-8 text-text-muted animate-pulse">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-10 h-10 text-text-muted/30 mx-auto mb-2" />
              <p className="text-text-muted text-sm">No students found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-in">
              {filteredStudents.map((s) => (
                <button key={s.id} onClick={() => setSelectedStudentId(s.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left card-hover transition-all ${selectedStudentId === s.id ? "bg-primary text-white shadow-lg" : "bg-surface-muted/50 hover:bg-primary-subtle"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedStudentId === s.id ? "bg-white/20" : "bg-primary-subtle"}`}>
                    <span className={`text-sm font-bold ${selectedStudentId === s.id ? "text-white" : "text-primary"}`}>{s.firstName[0]}{s.lastName[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${selectedStudentId === s.id ? "text-white" : "text-text-primary"}`}>{s.firstName} {s.lastName}</p>
                    <p className={`text-xs ${selectedStudentId === s.id ? "text-white/70" : "text-text-muted"}`}>{s.classRoom?.name || "No class"}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedStudentId === s.id ? "text-white/70" : "text-text-muted"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report Card */}
        {selectedStudentId && (
          obsLoading ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
              <div className="animate-pulse text-text-muted">Generating report card...</div>
            </div>
          ) : selectedStudent ? (
            <ReportCard student={selectedStudent} observations={observations} settings={settings} />
          ) : null
        )}

        {/* Empty state */}
        {!selectedStudentId && (
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 text-text-muted/20 mx-auto mb-4" />
            <p className="text-text-muted font-medium text-lg">Select a student above to view their report card</p>
            <p className="text-text-muted text-sm mt-1">Report cards are generated from teacher observations and mastery levels</p>
          </div>
        )}
      </div>
    </div>
  );
}
