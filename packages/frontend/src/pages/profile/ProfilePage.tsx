import { useAuth } from "../../hooks/useAuth";
import { User, Shield, Key, Mail, Calendar, LogOut } from "lucide-react";

export function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleColors: Record<string, string> = {
    admin: "bg-primary text-white",
    teacher: "bg-success text-white",
    parent: "bg-primary-subtle text-primary",
    student: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="surface p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-3xl font-bold text-white">
              {(user.firstName || user.email || "?")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary">
              {user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </h1>
            <p className="text-text-muted mt-1">{user.email}</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || "bg-surface-muted text-text-muted"}`}>
                <Shield className="w-3 h-3" />
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
              <span className="text-xs text-text-muted">Tenant: {user.tenantId.slice(0, 8)}...</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Account Details */}
      <div className="surface p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Account Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-muted rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-1">Email</p>
            <p className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Mail className="w-4 h-4 text-text-muted" />
              {user.email}
            </p>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-1">Role</p>
            <p className="text-sm font-medium text-text-primary flex items-center gap-2">
              <Shield className="w-4 h-4 text-text-muted" />
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-1">User ID</p>
            <p className="text-sm font-medium text-text-primary font-mono truncate">
              {user.id}
            </p>
          </div>
          <div className="p-4 bg-surface-muted rounded-xl">
            <p className="text-xs font-medium text-text-muted mb-1">Tenant</p>
            <p className="text-sm font-medium text-text-primary font-mono truncate">
              {user.tenantId}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="surface p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Permissions ({user.permissions?.length || 0})
        </h2>
        {user.permissions && user.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="inline-flex px-3 py-1 bg-surface-muted rounded-lg text-xs font-medium text-text-primary"
              >
                {perm}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-text-muted text-sm">No permissions assigned</p>
        )}
      </div>
    </div>
  );
}
