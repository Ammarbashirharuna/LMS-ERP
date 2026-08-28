import { AlertTriangle, CheckCircle, Info, X } from "lucide-react";

type ConfirmVariant = "danger" | "success" | "info" | "warning";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const variantConfig: Record<ConfirmVariant, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; confirmBg: string }> = {
  danger: { icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-danger", confirmBg: "bg-danger hover:bg-red-700" },
  success: { icon: CheckCircle, iconBg: "bg-green-100", iconColor: "text-success", confirmBg: "bg-success hover:bg-green-700" },
  warning: { icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-warning", confirmBg: "bg-warning hover:bg-amber-700" },
  info: { icon: Info, iconBg: "bg-blue-100", iconColor: "text-blue-600", confirmBg: "bg-primary hover:bg-primary-hover" },
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-surface rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 text-center">
          <div className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-7 h-7 ${config.iconColor}`} />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
          <p className="text-sm text-text-muted leading-relaxed">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-text-muted bg-surface-muted rounded-xl hover:bg-border transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50 ${config.confirmBg}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast notification for success/error messages                      */
/* ------------------------------------------------------------------ */

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const config = {
    success: { bg: "bg-success", icon: CheckCircle },
    error: { bg: "bg-danger", icon: AlertTriangle },
    info: { bg: "bg-primary", icon: Info },
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-[200] ${config.bg} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in max-w-sm`}>
      <config.icon className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
