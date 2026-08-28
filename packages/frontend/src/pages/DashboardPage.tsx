import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { apiClient } from "../api/client";
import {
  GraduationCap, ClipboardCheck, School, FileText, ArrowRight,
  TrendingUp, DollarSign, MessageSquare, Megaphone, Users,
  AlertCircle, CreditCard, Clock,
} from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, trend, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-5 sm:p-6 flex items-start gap-4 rounded-2xl border border-border shadow-sm card-hover">
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-text-muted">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-0.5">{value}</p>
        {trend && (
          <p className="text-xs text-success mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings").then((r) => r.data),
    retry: 1,
  });

  const schoolName = settingsData?.schoolName || "Montessori ERP";

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: () => apiClient.get("/students?limit=100").then((r) => r.data),
  });

  const { data: attendance } = useQuery({
    queryKey: ["attendance-today"],
    queryFn: () => {
      const today = new Date().toISOString().split("T")[0];
      return apiClient.get(`/attendance?date=${today}`).then((r) => r.data);
    },
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: () => apiClient.get("/classes").then((r) => r.data),
  });

  const { data: observations } = useQuery({
    queryKey: ["observations"],
    queryFn: () => apiClient.get("/observations?limit=5").then((r) => r.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => apiClient.get("/finance/invoices?limit=100").then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "parent",
  });

  const { data: messages } = useQuery({
    queryKey: ["messages"],
    queryFn: () => apiClient.get("/communication/messages?limit=5").then((r) => r.data),
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiClient.get("/communication/announcements?limit=3").then((r) => r.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ["hr-staff"],
    queryFn: () => apiClient.get("/hr?limit=100").then((r) => r.data),
    enabled: user?.role === "admin",
  });

  const studentList = students?.data || students || [];
  const attendanceList = attendance?.data || attendance || [];
  const classList = classes?.data || classes || [];
  const observationList = observations?.data || observations || [];
  const invoiceList = invoices?.data || invoices || [];
  const messageList = messages?.data || messages || [];
  const announcementList = announcements?.data || announcements || [];
  const staffList = staffData?.data || staffData || [];

  const totalStudents = Array.isArray(studentList) ? studentList.length : 0;
  const totalClasses = Array.isArray(classList) ? classList.length : 0;
  const presentToday = Array.isArray(attendanceList)
    ? attendanceList.filter((a: { status: string }) => a.status === "PRESENT").length : 0;
  const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0;

  // Finance stats
  const totalInvoices = invoiceList.length;
  const pendingInvoices = invoiceList.filter((inv: { status: string }) => inv.status === "PENDING").length;
  const paidInvoices = invoiceList.filter((inv: { status: string }) => inv.status === "PAID").length;
  const totalRevenue = invoiceList.reduce((sum: number, inv: { amount: number; status: string }) => inv.status === "PAID" ? sum + Number(inv.amount) : sum, 0);
  const pendingAmount = invoiceList.reduce((sum: number, inv: { amount: number; status: string }) => inv.status === "PENDING" ? sum + Number(inv.amount) : sum, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          Welcome back, {user?.firstName || user?.email}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {user?.role === "admin" ? `School Admin Dashboard \u2014 ${schoolName}`
            : user?.role === "teacher" ? "Here\u2019s your daily overview"
            : "Stay updated on your children\u2019s progress"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 stagger-in">
        <StatCard icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />} label="Total Students"
          value={totalStudents} trend={`${totalClasses} classes`} color="bg-primary-subtle" />
        <StatCard icon={<ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-success" />} label="Attendance Today"
          value={`${attendanceRate}%`} trend={presentToday > 0 ? `${presentToday} present` : "No records yet"} color="bg-green-50" />
        <StatCard icon={<School className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />} label="Active Classes"
          value={totalClasses} color="bg-primary-subtle" />
        <StatCard icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />} label="Observations"
          value={observationList.length} trend="Recent" color="bg-amber-50" />

        {/* Finance Stats - Admin & Parent only */}
        {(user?.role === "admin" || user?.role === "parent") && (
          <>
            <StatCard icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-success" />} label="Total Revenue"
              value={`${totalRevenue.toLocaleString()}`} trend={`${paidInvoices} paid`} color="bg-green-50" />
            <StatCard icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-danger" />} label="Pending Payments"
              value={`${pendingAmount.toLocaleString()}`} trend={`${pendingInvoices} invoices`} color="bg-red-50" />
          </>
        )}

        {/* HR Stats - Admin only */}
        {user?.role === "admin" && (
          <StatCard icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />} label="Staff Members"
            value={Array.isArray(staffList) ? staffList.length : 0} color="bg-primary-subtle" />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 stagger-in">
        {/* Recent Observations */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Observations</h2>
          {observationList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
              <p className="text-text-muted text-sm">No observations recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {observationList.slice(0, 5).map((obs: { id: string; note: string; masteryLevel: string; createdAt: string; student?: { firstName: string; lastName: string } }) => (
                <div key={obs.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-muted/50 hover:bg-surface-muted transition-colors">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mt-0.5 flex-shrink-0 ${
                    obs.masteryLevel === "MASTERED" ? "bg-success text-white"
                    : obs.masteryLevel === "PRACTICING" ? "bg-warning text-white"
                    : "bg-primary-subtle text-primary"}`}>
                    {obs.masteryLevel}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary line-clamp-2">{obs.note}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {obs.student ? `${obs.student.firstName} ${obs.student.lastName}` : "Student"} &mdash; {new Date(obs.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Announcements */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Announcements</h2>
            <a href="/announcements" className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          {announcementList.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
              <p className="text-text-muted text-sm">No announcements yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcementList.map((ann: { id: string; title: string; body: string; createdAt: string }) => (
                <div key={ann.id} className="p-3 rounded-xl bg-surface-muted/50 hover:bg-surface-muted transition-colors">
                  <p className="text-sm font-semibold text-text-primary">{ann.title}</p>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{ann.body}</p>
                  <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {new Date(ann.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Messages */}
        {(user?.role === "admin" || user?.role === "teacher" || user?.role === "parent") && (
          <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
              <a href="/messages" className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
                Open inbox <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            {messageList.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-text-muted/40 mx-auto mb-2" />
                <p className="text-text-muted text-sm">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messageList.slice(0, 5).map((msg: { id: string; content: string; createdAt: string; subject?: string }) => (
                  <div key={msg.id} className="p-3 rounded-xl bg-surface-muted/50 hover:bg-surface-muted transition-colors">
                    {msg.subject && <p className="text-sm font-semibold text-text-primary">{msg.subject}</p>}
                    <p className="text-xs text-text-muted line-clamp-2 mt-0.5">{msg.content}</p>
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {(user?.role === "admin" || user?.role === "teacher"
              ? [
                  { href: "/attendance", icon: ClipboardCheck, label: "Take Attendance", color: "text-primary" },
                  { href: "/observations", icon: FileText, label: "Observations", color: "text-success" },
                  { href: "/students", icon: GraduationCap, label: "Students", color: "text-primary" },
                  { href: "/messages", icon: MessageSquare, label: "Messages", color: "text-blue-500" },
                  ...(user?.role === "admin" ? [
                    { href: "/finance", icon: DollarSign, label: "Finance", color: "text-success" },
                    { href: "/hr", icon: Users, label: "HR & Staff", color: "text-primary" },
                  ] : []),
                  { href: "/announcements", icon: Megaphone, label: "Announcements", color: "text-warning" },
                ]
              : [
                  { href: "/students", icon: GraduationCap, label: "My Children", color: "text-primary" },
                  { href: "/finance", icon: DollarSign, label: "Fees & Payments", color: "text-success" },
                  { href: "/messages", icon: MessageSquare, label: "Messages", color: "text-blue-500" },
                  { href: "/announcements", icon: Megaphone, label: "Announcements", color: "text-warning" },
                ]
            ).map((action) => (
              <a key={action.href} href={action.href}
                className="flex flex-col items-center p-4 sm:p-5 rounded-xl bg-surface-muted/50 hover:bg-primary-subtle transition-all duration-150 text-center group">
                <action.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${action.color} mb-2 group-hover:scale-110 transition-transform`} />
                <span className="text-xs sm:text-sm font-medium text-text-primary">{action.label}</span>
                <ArrowRight className="w-3 h-3 text-text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
