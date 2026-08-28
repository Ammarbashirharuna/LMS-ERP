import { useLeaderboard, useBadges } from "../../hooks/useGamification";
import type { LeaderboardEntry, Badge } from "../../api/gamification";

export function LeaderboardPage() {
  const { data: entries, isLoading } = useLeaderboard("weekly");
  const { data: badges } = useBadges();

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 page-enter">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-muted rounded w-1/4"></div>
          <div className="h-64 bg-surface-muted rounded"></div>
        </div>
      </div>
    );
  }

  const leaderboard = (entries ?? []) as LeaderboardEntry[];
  const badgeList = (badges ?? []) as Badge[];

  return (
    <div className="p-4 sm:p-6 lg:p-8 page-enter">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>
          <p className="text-text-muted mt-1">Weekly top performers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="surface rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-muted border-b border-border">
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">#</th>
                  <th className="text-left px-4 py-2 text-sm font-medium text-text-muted">Student</th>
                  <th className="text-right px-4 py-2 text-sm font-medium text-text-muted">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-text-muted">
                      No leaderboard entries yet.
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-border">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-800"
                              : index === 1
                                ? "bg-gray-200 text-gray-700"
                                : index === 2
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-surface-muted text-text-muted"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {entry.student?.firstName} {entry.student?.lastName}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-primary">
                        {entry.score}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="surface p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Badges</h2>
            <div className="space-y-3">
              {badgeList.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-lg">
                    {badge.icon || "🏅"}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{badge.name}</p>
                    <p className="text-xs text-text-muted">
                      {badge.awardees?.length ?? 0} awarded
                    </p>
                  </div>
                </div>
              ))}
              {badgeList.length === 0 && (
                <p className="text-sm text-text-muted">No badges configured yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
