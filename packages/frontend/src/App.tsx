import { Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NavShell } from "./components/layout/NavShell";
import { AuthProvider } from "./hooks/useAuth";
import { StudentsPage } from "./pages/students/StudentsPage";
import { StudentDetailPage } from "./pages/students/StudentDetailPage";
import { AddStudentPage } from "./pages/students/AddStudentPage";
import { EditStudentPage } from "./pages/students/EditStudentPage";
import { AttendancePage } from "./pages/attendance/AttendancePage";
import { AttendanceHistoryPage } from "./pages/attendance/AttendanceHistoryPage";
import { ObservationsPage } from "./pages/observations/ObservationsPage";
import { AddObservationPage } from "./pages/observations/AddObservationPage";
import { CurriculumPage } from "./pages/curriculum/CurriculumPage";
import { LessonPlansPage } from "./pages/curriculum/LessonPlansPage";
import { StudentProgressPage } from "./pages/curriculum/StudentProgressPage";
import { FinancePage } from "./pages/finance/FinancePage";
import { AnnouncementsPage } from "./pages/communication/AnnouncementsPage";
import { MessagesPage } from "./pages/communication/MessagesPage";
import { LeaderboardPage } from "./pages/gamification/LeaderboardPage";
import { AIInsightsPage } from "./pages/ai/InsightsPage";
import { AIAssistant } from "./components/ai/AIAssistant";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ClassesPage } from "./pages/classes/ClassesPage";
import { HRPage } from "./pages/hr/HRPage";
import { InventoryPage } from "./pages/inventory/InventoryPage";
import { AuditLogPage } from "./pages/audit/AuditLogPage";
import { ProfilePage } from "./pages/profile/ProfilePage";
import { OnboardingPage } from "./pages/auth/OnboardingPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { ReportCardsPage } from "./pages/reports/ReportCardsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<NavShell />}>
            <Route index element={<DashboardPage />} />
            {/* Students */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/add" element={<AddStudentPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />
            {/* Attendance */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/history" element={<AttendanceHistoryPage />} />
            {/* Observations */}
            <Route path="/observations" element={<ObservationsPage />} />
            <Route path="/observations/add" element={<AddObservationPage />} />
            {/* Curriculum */}
            <Route path="/curriculum" element={<CurriculumPage />} />
            <Route path="/lesson-plans" element={<LessonPlansPage />} />
            <Route path="/students/:id/progress" element={<StudentProgressPage />} />
            {/* Finance */}
            <Route path="/finance" element={<FinancePage />} />
            {/* Classes */}
            <Route path="/classes" element={<ClassesPage />} />
            {/* HR */}
            <Route path="/hr" element={<HRPage />} />
            {/* Inventory */}
            <Route path="/inventory" element={<InventoryPage />} />
            {/* Communication */}
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            {/* Gamification */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            {/* Audit */}
            <Route path="/audit" element={<AuditLogPage />} />
            {/* AI */}
            <Route path="/students/:id/insights" element={<AIInsightsPage />} />
            {/* Reports */}
            <Route path="/report-cards" element={<ReportCardsPage />} />
            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />
            {/* Profile */}
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        <AIAssistant />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
