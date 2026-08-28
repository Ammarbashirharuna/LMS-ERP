import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../api/client";
import { SyncStatus } from "../sync/SyncStatus";
import {
  LayoutDashboard,
  GraduationCap,
  School,
  ClipboardCheck,
  FileText,
  BookOpen,
  DollarSign,
  Users,
  Package,
  MessageSquare,
  Megaphone,
  Trophy,
  Shield,
  LogOut,
  UserCircle,
  X,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiClient.get("/settings").then((r) => r.data),
    retry: 1,
    staleTime: 300000,
  });
  const schoolName = settingsData?.schoolName || "Montessori ERP";

  if (!user) return null;

  const navigation = getNavItems(user.role);

  return (
    <nav className="bg-surface w-64 h-full overflow-y-auto shadow-sm flex flex-col border-r border-border glass">
      {/* Brand */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          {settingsData?.schoolLogo ? (
            <img src={settingsData.schoolLogo} alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
          ) : (
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <School className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-text-primary text-sm truncate">{schoolName}</p>
            <p className="text-xs text-text-muted">{settingsData?.schoolMotto || "Montessori LMS"}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center">
            <span className="text-sm font-bold text-primary">
              {(user.firstName || user.email || "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {user.firstName || user.email}
            </p>
            <p className="text-xs text-text-muted capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary-subtle text-primary border-l-[3px] border-primary pl-[9px]"
                  : "text-text-muted hover:bg-surface-muted hover:text-text-primary"
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        {/* Sync Status */}
        <div className="px-3 py-2">
          <SyncStatus />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-muted w-full mb-1"
          >
            <X className="w-[18px] h-[18px]" />
            Close Menu
          </button>
        )}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-primary-subtle text-primary border-l-[3px] border-primary pl-[9px]"
                : "text-text-muted hover:bg-surface-muted hover:text-text-primary"
            }`
          }
        >
          <UserCircle className="w-[18px] h-[18px]" />
          Profile
        </NavLink>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-surface-muted hover:text-danger w-full transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

function getNavItems(role: string): NavItem[] {
  const base: NavItem[] = [{ path: "/", label: "Dashboard", icon: LayoutDashboard }];

  const roleNav: Record<string, NavItem[]> = {
    admin: [
      ...base,
      { path: "/students", label: "Students", icon: GraduationCap },
      { path: "/classes", label: "Classes", icon: School },
      { path: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { path: "/observations", label: "Observations", icon: FileText },
      { path: "/report-cards", label: "Report Cards", icon: FileText },
      { path: "/curriculum", label: "Curriculum", icon: BookOpen },
      { path: "/finance", label: "Finance", icon: DollarSign },
      { path: "/hr", label: "HR & Staff", icon: Users },
      { path: "/inventory", label: "Inventory", icon: Package },
      { path: "/messages", label: "Messages", icon: MessageSquare },
      { path: "/announcements", label: "Announcements", icon: Megaphone },
      { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { path: "/settings", label: "Settings", icon: Settings },
      { path: "/audit", label: "Audit Log", icon: Shield },
    ],
    teacher: [
      ...base,
      { path: "/students", label: "My Students", icon: GraduationCap },
      { path: "/classes", label: "My Classes", icon: School },
      { path: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { path: "/observations", label: "Observations", icon: FileText },
      { path: "/report-cards", label: "Report Cards", icon: FileText },
      { path: "/curriculum", label: "Curriculum", icon: BookOpen },
      { path: "/lesson-plans", label: "Lesson Plans", icon: FileText },
      { path: "/messages", label: "Messages", icon: MessageSquare },
      { path: "/announcements", label: "Announcements", icon: Megaphone },
      { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
    parent: [
      ...base,
      { path: "/students", label: "My Children", icon: GraduationCap },
      { path: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { path: "/observations", label: "Observations", icon: FileText },
      { path: "/report-cards", label: "Report Cards", icon: FileText },
      { path: "/finance", label: "Fees & Payments", icon: DollarSign },
      { path: "/messages", label: "Messages", icon: MessageSquare },
      { path: "/announcements", label: "Announcements", icon: Megaphone },
    ],
    student: [
      ...base,
      { path: "/curriculum", label: "My Learning", icon: BookOpen },
      { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { path: "/announcements", label: "Announcements", icon: Megaphone },
    ],
  };

  return roleNav[role] || base;
}
