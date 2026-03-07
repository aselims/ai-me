import { useState, useEffect } from "preact/hooks";

interface Props {
  umamiUrl?: string;
  umamiShareId?: string;
}

interface Stats {
  visitors: number | null;
  cardsGenerated: number | null;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function StatsCounter({ umamiUrl, umamiShareId }: Props) {
  const [stats, setStats] = useState<Stats>({ visitors: null, cardsGenerated: null });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!umamiUrl || !umamiShareId) return;

    async function fetchStats() {
      try {
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const res = await fetch(
          `${umamiUrl}/api/share/${umamiShareId}/stats?startAt=${thirtyDaysAgo}&endAt=${now}`
        );
        if (!res.ok) return;
        const data = await res.json();

        setStats({
          visitors: data.visitors?.value ?? data.uniques?.value ?? null,
          cardsGenerated: null, // Custom events need separate endpoint
        });
        setVisible(true);
      } catch {
        // Silently fail — counter just won't show
      }
    }

    fetchStats();
  }, [umamiUrl, umamiShareId]);

  if (!visible) return null;

  return (
    <div style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
      {stats.visitors !== null && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#2563eb" }}>
            {formatNumber(stats.visitors)}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            visitors this month
          </div>
        </div>
      )}
      {stats.cardsGenerated !== null && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#16a34a" }}>
            {formatNumber(stats.cardsGenerated)}
          </div>
          <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            vendor cards generated
          </div>
        </div>
      )}
    </div>
  );
}
