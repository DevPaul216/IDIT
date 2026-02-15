"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import PageWrapper from "@/components/layout/PageWrapper";
import Link from "next/link";
import StorageViewer from "@/components/features/inventory/StorageViewer";

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

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  raw: { label: "Rohmaterial", icon: "🧵" },
  finished: { label: "Fertigprodukte", icon: "📦" },
  packaging: { label: "Verpackung", icon: "🏷️" },
};

export default function DashboardPage() {
  const { user } = useUser();
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    const category = item.product.category || "finished";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof summary.byProduct>) || {};

  return (
    <PageWrapper
      title="Übersicht"
      description={`Willkommen${user?.name ? `, ${user.name}` : ""}!`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Overview - Raw Materials & Finished Products */}
        <div
          className="rounded-xl p-5 lg:col-span-1"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              📦 Produktübersicht
            </h3>
            <button
              onClick={() => fetchSummary()}
              className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              🔄
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : summary && summary.byProduct.length > 0 ? (
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {/* Raw Materials Section */}
              {productsByCategory.raw && productsByCategory.raw.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 py-1" style={{ backgroundColor: "var(--bg-primary)" }}>
                    <span>{CATEGORY_LABELS.raw.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                      {CATEGORY_LABELS.raw.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {productsByCategory.raw
                      .sort((a, b) => b.totalPallets - a.totalPallets)
                      .map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: "var(--bg-tertiary)" }}
                        >
                          <div className="flex items-center gap-2">
                            {item.product.color && (
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.product.color }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {item.product.name}
                            </span>
                          </div>
                          <span
                            className="text-sm font-bold px-2 py-1 rounded"
                            style={{ backgroundColor: item.product.color || "var(--accent)", color: "white" }}
                          >
                            {item.totalPallets}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Finished Products Section */}
              {productsByCategory.finished && productsByCategory.finished.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 py-1" style={{ backgroundColor: "var(--bg-primary)" }}>
                    <span>{CATEGORY_LABELS.finished.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                      {CATEGORY_LABELS.finished.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {productsByCategory.finished
                      .sort((a, b) => b.totalPallets - a.totalPallets)
                      .map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: "var(--bg-tertiary)" }}
                        >
                          <div className="flex items-center gap-2">
                            {item.product.color && (
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.product.color }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {item.product.name}
                            </span>
                          </div>
                          <span
                            className="text-sm font-bold px-2 py-1 rounded"
                            style={{ backgroundColor: item.product.color || "var(--accent)", color: "white" }}
                          >
                            {item.totalPallets}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Packaging Section */}
              {productsByCategory.packaging && productsByCategory.packaging.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 sticky top-0 py-1" style={{ backgroundColor: "var(--bg-primary)" }}>
                    <span>{CATEGORY_LABELS.packaging.icon}</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                      {CATEGORY_LABELS.packaging.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {productsByCategory.packaging
                      .sort((a, b) => b.totalPallets - a.totalPallets)
                      .map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: "var(--bg-tertiary)" }}
                        >
                          <div className="flex items-center gap-2">
                            {item.product.color && (
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.product.color }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                              {item.product.name}
                            </span>
                          </div>
                          <span
                            className="text-sm font-bold px-2 py-1 rounded"
                            style={{ backgroundColor: item.product.color || "var(--accent)", color: "white" }}
                          >
                            {item.totalPallets}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Noch keine Daten erfasst
              </p>
              <Link
                href="/inventory"
                className="inline-flex items-center mt-3 px-4 py-2 rounded-lg font-medium text-sm transition-all"
                style={{ backgroundColor: "var(--accent)", color: "white" }}
              >
                Jetzt erfassen
              </Link>
            </div>
          )}
        </div>

        {/* Location Status */}
        <div
          className="rounded-xl p-5 lg:col-span-1"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            📍 Lagerplatzstatus
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
            </div>
          ) : summary && summary.byLocation.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {summary.byLocation
                .sort((a, b) => b.totalPallets - a.totalPallets)
                .map((item) => {
                  const locFreshness = getFreshnessInfo(item.lastCheckedAt);
                  return (
                    <div
                      key={item.location.id}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{locFreshness.emoji}</span>
                        <div>
                          <span className="text-sm font-medium block" style={{ color: "var(--text-primary)" }}>
                            {item.location.name}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {locFreshness.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                          {item.totalPallets}
                        </span>
                        <span className="text-xs block" style={{ color: "var(--text-muted)" }}>
                          Paletten
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📍</div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Keine Lagerplätze erfasst
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Storage Area Viewer */}
      <div
        className="rounded-xl p-5 mt-4"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <h3 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          🗺️ Zonen-Explorer
        </h3>
        <StorageViewer />
      </div>
    </PageWrapper>
  );
}
