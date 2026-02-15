"use client";

import { useState, useEffect, useCallback } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { useRefreshOnNavAndFocus } from "@/hooks/useRefreshOnNav";

interface AnalyticsData {
  summary: {
    totalItems: number;
    uniqueLocationsWithStock: number;
    uniqueProductsInStock: number;
    totalLocations: number;
    totalProducts: number;
    changesThisWeek: number;
  };
  productTotals: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string | null;
    totalQuantity: number;
    locationCount: number;
  }>;
  stockHistory: Array<{
    date: string;
    totalStock: number;
  }>;
}

// Simple area chart component
function AreaChart({
  data,
  valueKey,
  height = 120,
  color = "var(--accent-primary)",
}: {
  data: Array<Record<string, unknown>>;
  valueKey: string;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height, color: "var(--text-muted)" }}>
        Keine Daten
      </div>
    );
  }

  const values = data.map((d) => d[valueKey] as number);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = values.map((val, i) => {
    const x = (i / (values.length - 1 || 1)) * 100;
    const y = 100 - ((val - minValue) / range) * 100;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `M 0,100 L ${points.join(" L ")} L 100,100 Z`;

  return (
    <div style={{ height }} className="relative">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{data[0]?.date ? new Date(data[0].date as string).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : ""}</span>
        <span>{data[data.length - 1]?.date ? new Date(data[data.length - 1].date as string).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }) : ""}</span>
      </div>
      <div className="absolute top-0 right-0 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
        {maxValue}
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/analytics");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Fehler beim Laden der Analytik");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refetch when navigating to this page or when page comes to focus
  useRefreshOnNavAndFocus(fetchAnalytics);

  if (isLoading) {
    return (
      <PageWrapper title="Analytik" description="Lagerbestand auswerten">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !data) {
    return (
      <PageWrapper title="Analytik" description="Lagerbestand auswerten">
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          {error || "Keine Daten verfügbar"}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Analytik" description="Lagerbestand auswerten">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Gesamtbestand" value={data.summary.totalItems} icon="📦" />
        <StatCard label="Produkte" value={`${data.summary.uniqueProductsInStock}/${data.summary.totalProducts}`} icon="🏷️" />
        <StatCard label="Lagerplätze" value={`${data.summary.uniqueLocationsWithStock}/${data.summary.totalLocations}`} icon="📍" />
        <StatCard label="Änderungen" value={data.summary.changesThisWeek} icon="🔄" />
      </div>

      {/* Stock History Chart */}
      <div
        className="p-4 rounded-xl mb-6"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          📈 Bestandsverlauf (30 Tage)
        </h3>
        <AreaChart data={data.stockHistory} valueKey="totalStock" height={150} color="#f97316" />
      </div>

      {/* Product Table */}
      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          🏷️ Bestand nach Produkt
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-muted)" }}>Produkt</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Bestand</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Lagerplätze</th>
              </tr>
            </thead>
            <tbody>
              {data.productTotals.map((product) => (
                <tr key={product.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      {product.color && (
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                      )}
                      <span style={{ color: "var(--text-primary)" }}>{product.name}</span>
                      {product.code && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                          {product.code}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-medium" style={{ color: "var(--text-primary)" }}>
                    {product.totalQuantity}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: "var(--text-muted)" }}>
                    {product.locationCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
