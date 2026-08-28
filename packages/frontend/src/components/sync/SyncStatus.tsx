import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { onlineStatus } from "../../services/offlineSync";

type SyncState = "synced" | "pending" | "conflict" | "offline";

export function SyncStatus() {
  const [isOnline, setIsOnline] = useState(onlineStatus.isOnline());
  const [syncState, setSyncState] = useState<SyncState>("synced");

  useEffect(() => {
    const unsub = onlineStatus.subscribe(() => {
      const online = onlineStatus.isOnline();
      setIsOnline(online);
      if (online) {
        setSyncState("synced");
      } else {
        setSyncState("offline");
      }
    });

    // Listen for online/offline browser events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => { setIsOnline(false); setSyncState("offline"); };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) setSyncState("offline");
  }, [isOnline]);

  // Compact inline version for sidebar
  const configs: Record<SyncState, { icon: React.ReactNode; label: string; className: string }> = {
    synced: {
      icon: <CheckCircle className="w-3 h-3" />,
      label: "Synced",
      className: "bg-success/10 text-success border-success/20",
    },
    pending: {
      icon: <RefreshCw className="w-3 h-3 animate-spin" />,
      label: "Syncing...",
      className: "bg-warning/10 text-warning border-warning/20",
    },
    conflict: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: "Conflict",
      className: "bg-danger/10 text-danger border-danger/20",
    },
    offline: {
      icon: <WifiOff className="w-3 h-3" />,
      label: "Offline",
      className: "bg-danger/10 text-danger border-danger/20",
    },
  };

  const config = configs[syncState];

  return (
    <>
      {/* Offline banner — shows prominently at the top of the page */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-danger text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
          <WifiOff className="w-4 h-4" />
          You are offline — changes will sync when connection is restored
        </div>
      )}

      {/* Compact badge for sidebar/header */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-300 ${config.className}`}>
        {config.icon}
        <span className="hidden sm:inline">{config.label}</span>
      </div>
    </>
  );
}
