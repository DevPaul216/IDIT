"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/components/ui/ThemeProvider";
import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import StorageViewer from "@/components/features/inventory/StorageViewer";
import { getCategoryInfo, CATEGORY_ORDER } from "@/lib/categories";

interface InventorySummary {
  totalPallets: number;
  uniqueLocations: number;
  oldestCheck: string | null;
  newestCheck: string | null;
  byLocation: {
    location: { id: string; name: string; parentId: string | null };
    totalPallets: number;
    productCount: number;
    lastCheckedAt: string;
  }[];
  byProduct: {
    product: { id: string; name: string; category: string; color: string | null };
    totalPallets: number;
    locationCount: number;
  }[];
}

function getFreshnessInfo(lastChecked: string | null): { label: string; color: string; emoji: string } {
  if (!lastChecked) {
    return { label: "Nie geprüft", color: "#6b7280", emoji: "⚪" };
  }
  
  const now = new Date();
  const checked = new Date(lastChecked);
  const diffMs = now.getTime() - checked.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  
  if (diffDays < 1) {
    return { label: "Heute", color: "#22c55e", emoji: "🟢" };
  } else if (diffDays < 7) {
    return { label: `Vor ${Math.floor(diffDays)} Tag(en)`, color: "#eab308", emoji: "🟡" };
  } else {
    return { label: `Vor ${Math.floor(diffDays)} Tag(en)`, color: "#ef4444", emoji: "🔴" };
  }
}

export default function DashboardPage() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if we're in classic theme (no symbols/colors)
  const isClassic = theme === "classic";
  // In classic mode, show only text; in light/dark modes show emoji and colors
  const showSymbols = !isClassic;
  const showColors = !isClassic;

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/inventory/summary");
      if (response.ok) {
        setSummary(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Group products by category
  const productsByCategory = summary?.byProduct.reduce((acc, item) => {
    const category = item.product.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof summary.byProduct>) || {};

  // Get ordered list of categories that have products
  const orderedCategories = useMemo(() => {
    const cats = Object.keys(productsByCategory);
    // Sort by CATEGORY_ORDER, unknown categories at the end
    return cats.sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [productsByCategory]);

  return (
    <PageWrapper
      title="Übersicht"
      description={`Willkommen${user?.name ? `, ${user.name}` : ""}!`}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Product Overview */}
        <div
          className="p-4"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {showSymbols && "📦 "}Produktübersicht
            </h3>
            <button
              onClick={() => fetchSummary()}
              className="p-2 transition-opacity hover:opacity-70"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
              title="Aktualisieren"
            >
              {showSymbols ? "🔄" : "↻"}
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : summary && summary.byProduct.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderedCategories.map((categoryKey) => {
                const items = productsByCategory[categoryKey];
                if (!items || items.length === 0) return null;
                const categoryInfo = getCategoryInfo(categoryKey);
                
                return (
                  <div
                    key={categoryKey}
                    className="rounded-lg overflow-hidden"
                    style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-light)" }}
                  >
                    {/* Category Header */}
                    <div
                      className="px-3 py-2 font-medium text-sm"
                      style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                    >
                      {showSymbols && <span>{categoryInfo.icon} </span>}
                      {categoryInfo.label}
                    </div>
                    
                    {/* Category Products Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {items
                            .sort((a, b) => b.totalPallets - a.totalPallets)
                            .map((item, idx) => (
                              <tr key={item.product.id} style={{ borderBottom: idx < items.length - 1 ? "1px solid var(--border-light)" : undefined }}>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1.5">
                                    {showColors && item.product.color && (
                                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.product.color }} />
                                    )}
                                    <span style={{ color: "var(--text-primary)" }} className="truncate">
                                      {item.product.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5 text-right font-bold whitespace-nowrap" style={{ color: showColors && item.product.color ? item.product.color : "var(--accent)" }}>
                                  {item.totalPallets}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                Noch keine Daten erfasst
              </p>
              <Link
                href="/inventory"
                className="inline-flex items-center px-3 py-1.5 font-medium text-sm"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                Erfassen →
              </Link>
            </div>
          )}
        </div>

        {/* Location Status */}
        <div
          className="p-4"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            {showSymbols && "📍 "}Lagerplätze
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : summary && summary.byLocation.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-light)" }}>
                    <th className="px-3 py-2 text-left font-medium" style={{ color: "var(--text-muted)" }}>Lagerplatz</th>
                    <th className="px-3 py-2 text-center font-medium" style={{ color: "var(--text-muted)" }}>Paletten</th>
                    <th className="px-3 py-2 text-center font-medium" style={{ color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byLocation
                    .sort((a, b) => b.totalPallets - a.totalPallets)
                    .map((item) => {
                      const locFreshness = getFreshnessInfo(item.lastCheckedAt);
                      return (
                        <tr key={item.location.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>
                            {item.location.name}
                          </td>
                          <td className="px-3 py-2 text-center font-bold" style={{ color: "var(--text-primary)" }}>
                            {item.totalPallets}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(0,0,0,0.05)", color: showColors ? locFreshness.color : "var(--text-muted)" }}>
                              {showSymbols && locFreshness.emoji + " "}
                              {locFreshness.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Keine Lagerplätze erfasst
              </p>
            </div>
          )}
        </div>

        {/* Storage Area Viewer */}
        <div
          className="p-4"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            {showSymbols && "🗺️ "}Zonen-Explorer
          </h3>
          <StorageViewer />
        </div>
      </div>
    </PageWrapper>
  );
}
