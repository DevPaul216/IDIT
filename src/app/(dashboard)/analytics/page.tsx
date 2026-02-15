"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
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
  locationUtilization: Array<{
    id: string;
    name: string;
    parentName: string | null;
    capacity: number | null;
    currentStock: number;
    utilizationPercent: number | null;
  }>;
  topMovers: Array<{
    id: string;
    name: string;
    code: string | null;
    color: string | null;
    added: number;
    removed: number;
    changes: number;
    totalMovement: number;
  }>;
  staffActivity: Array<{
    userId: string;
    userName: string;
    changes: number;
    lastActivity: string;
  }>;
  categoryData: Array<{
    category: string;
    quantity: number;
    productCount: number;
  }>;
  dataFreshness: {
    oldestCheckAt: string | null;
    newestCheckAt: string | null;
  };
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
function StatCard({ label, value, icon, showSymbols }: { label: string; value: string | number; icon: string; showSymbols: boolean }) {
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
        {showSymbols && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const isClassic = theme === "classic";
  const showSymbols = !isClassic;
  const showColors = !isClassic;

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
        <StatCard label="Gesamtbestand" value={data.summary.totalItems} icon="📦" showSymbols={showSymbols} />
        <StatCard label="Produkte" value={`${data.summary.uniqueProductsInStock}/${data.summary.totalProducts}`} icon="🏷️" showSymbols={showSymbols} />
        <StatCard label="Lagerplätze" value={`${data.summary.uniqueLocationsWithStock}/${data.summary.totalLocations}`} icon="📍" showSymbols={showSymbols} />
        <StatCard label="Änderungen" value={data.summary.changesThisWeek} icon="🔄" showSymbols={showSymbols} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left column: Charts */}
        <div className="lg:col-span-2">
          {/* Stock History Chart */}
          <div
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {showSymbols && "📈 "}Bestandsverlauf (30 Tage)
            </h3>
            <AreaChart data={data.stockHistory} valueKey="totalStock" height={150} color="#f97316" />
          </div>

          {/* Category Breakdown */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {showSymbols && "📊 "}Bestand nach Kategorie
            </h3>
            <div className="space-y-3">
              {data.categoryData.map((cat, idx) => {
                const total = data.summary.totalItems;
                const percent = total > 0 ? Math.round((cat.quantity / total) * 100) : 0;
                const categoryNames: Record<string, string> = {
                  raw: "Rohmaterial",
                  finished: "Fertigprodukte",
                  packaging: "Verpackung",
                  other: "Sonstiges",
                };
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span style={{ color: "var(--text-primary)", fontSize: "0.875rem" }}>
                        {categoryNames[cat.category] || cat.category}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {cat.quantity} Stk. ({percent}%) • {cat.productCount} Produkte
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b"][idx % 4],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Activity & Data Freshness */}
        <div className="space-y-6">
          {/* Staff Activity */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {showSymbols && "👥 "}Mitarbeiteraktivität
            </h3>
            <div className="space-y-3">
              {data.staffActivity.slice(0, 5).map((staff) => {
                const lastActivity = new Date(staff.lastActivity);
                const hoursAgo = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60));
                let timeLabel = "";
                if (hoursAgo < 1) {
                  timeLabel = "gerade eben";
                } else if (hoursAgo < 24) {
                  timeLabel = `vor ${hoursAgo}h`;
                } else {
                  timeLabel = `vor ${Math.floor(hoursAgo / 24)}d`;
                }
                return (
                  <div key={staff.userId} style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p style={{ color: "var(--text-primary)", fontWeight: 500, fontSize: "0.875rem" }}>
                          {staff.userName}
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                          {staff.changes} Änderungen
                        </p>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {timeLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Freshness */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {showSymbols && "🕐 "}Datenaktualität
            </h3>
            <div className="space-y-2">
              <div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Aktuellste Erfassung</p>
                <p style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 500 }}>
                  {data.dataFreshness.newestCheckAt
                    ? new Date(data.dataFreshness.newestCheckAt).toLocaleDateString("de-DE", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Keine Daten"}
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Älteste Erfassung</p>
                <p style={{ color: "var(--text-primary)", fontSize: "0.875rem", fontWeight: 500 }}>
                  {data.dataFreshness.oldestCheckAt
                    ? new Date(data.dataFreshness.oldestCheckAt).toLocaleDateString("de-DE", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Keine Daten"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Utilization */}
      <div
        className="p-4 rounded-xl mb-6"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {showSymbols && "📦 "}Lagerplatzauslastung
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                <th className="text-left py-2 px-3" style={{ color: "var(--text-muted)" }}>Lagerplatz</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Bestand</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Kapazität</th>
                <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Auslastung</th>
              </tr>
            </thead>
            <tbody>
              {data.locationUtilization
                .filter((loc) => loc.capacity !== null)
                .slice(0, 10)
                .map((loc) => {
                  const util = loc.utilizationPercent ?? 0;
                  const color = util > 90 ? "#ef4444" : util > 70 ? "#f59e0b" : "#22c55e";
                  return (
                    <tr key={loc.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td className="py-2 px-3">
                        <div>
                          <p style={{ color: "var(--text-primary)" }}>{loc.name}</p>
                          {loc.parentName && (
                            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{loc.parentName}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right" style={{ color: "var(--text-primary)" }}>
                        {loc.currentStock}
                      </td>
                      <td className="py-2 px-3 text-right" style={{ color: "var(--text-muted)" }}>
                        {loc.capacity}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <div
                            className="h-1.5 w-16 rounded-full overflow-hidden"
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(util, 100)}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span style={{ color, fontWeight: 500, fontSize: "0.875rem" }}>
                            {util}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Movement & Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Table */}
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {showSymbols && "🏷️ "}Bestand nach Produkt
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <th className="text-left py-2 px-3" style={{ color: "var(--text-muted)" }}>Produkt</th>
                  <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Bestand</th>
                  <th className="text-right py-2 px-3" style={{ color: "var(--text-muted)" }}>Orte</th>
                </tr>
              </thead>
              <tbody>
                {data.productTotals.slice(0, 8).map((product) => (
                  <tr key={product.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {showColors && product.color && (
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

        {/* Top Movers */}
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {showSymbols && "🚀 "}Meistbewegt (7 Tage)
          </h3>
          <div className="space-y-3">
            {data.topMovers.map((product, idx) => {
              const added = product.added;
              const removed = product.removed;
              const net = added - removed;
              const netColor = net > 0 ? "#22c55e" : net < 0 ? "#ef4444" : "var(--text-muted)";
              return (
                <div
                  key={product.id}
                  style={{
                    borderBottom: idx < data.topMovers.length - 1 ? "1px solid var(--border-light)" : "none",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {showColors && product.color && (
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: product.color }} />
                      )}
                      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {product.name}
                      </span>
                      {product.code && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                          {product.code}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-muted)" }}>
                      {showSymbols && "📥"} {added} +{showSymbols && " "}{showSymbols && "📤"} {removed} −
                    </span>
                    <span style={{ color: netColor, fontWeight: 500 }}>
                      {net > 0 ? "+" : ""}{net}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
