"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";
import { InventoryLog } from "@/types";
import { useRefreshOnNavAndFocus } from "@/hooks/useRefreshOnNav";

export default function InventoryHistory() {
  const { theme } = useTheme();
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "week">("all");
  
  const isClassic = theme === "classic";
  const showSymbols = !isClassic;
  const showColors = !isClassic;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/inventory/logs?limit=100";
      
      if (filter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        url += `&from=${today.toISOString()}`;
      } else if (filter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        url += `&from=${weekAgo.toISOString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  // Refetch when route changes or page comes to focus
  useRefreshOnNavAndFocus(fetchLogs);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (date: Date | string) => {
    return new Date(date).toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  };

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const dateKey = new Date(log.changedAt).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, InventoryLog[]>);

  const getChangeIndicator = (prev: number | null, next: number) => {
    if (prev === null) {
      return { emoji: "🆕", text: `Neu: ${next}`, color: "#3b82f6", simple: "NEW" };
    }
    const diff = next - prev;
    if (diff > 0) {
      return { emoji: "📈", text: `+${diff}`, color: "#22c55e", simple: "↑" };
    } else if (diff < 0) {
      return { emoji: "📉", text: `${diff}`, color: "#ef4444", simple: "↓" };
    }
    return { emoji: "↔️", text: "0", color: "#6b7280", simple: "=" };
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg"
            style={{ backgroundColor: "var(--bg-tertiary)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div
        className="flex gap-2 p-2 rounded-xl"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <button
          onClick={() => setFilter("all")}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: filter === "all" ? "var(--accent)" : "transparent",
            color: filter === "all" ? "white" : "var(--text-secondary)",
          }}
        >
          Alle
        </button>
        <button
          onClick={() => setFilter("today")}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: filter === "today" ? "var(--accent)" : "transparent",
            color: filter === "today" ? "white" : "var(--text-secondary)",
          }}
        >
          Heute
        </button>
        <button
          onClick={() => setFilter("week")}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: filter === "week" ? "var(--accent)" : "transparent",
            color: filter === "week" ? "white" : "var(--text-secondary)",
          }}
        >
          Diese Woche
        </button>
      </div>

      {/* Log List */}
      {logs.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          {showSymbols && <div className="text-5xl mb-4">📭</div>}
          <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Keine Änderungen
          </h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {filter === "today"
              ? "Heute wurden noch keine Änderungen vorgenommen."
              : filter === "week"
              ? "Diese Woche wurden keine Änderungen vorgenommen."
              : "Es wurden noch keine Lagerbestände erfasst."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedLogs).map(([dateKey, dayLogs]) => (
            <div key={dateKey}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatDateOnly(dateKey)}
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: "var(--border-light)" }} />
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                  {dayLogs.length} Änderungen
                </span>
              </div>

              {/* Day's Logs */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
              >
                {dayLogs.map((log, idx) => {
                  const change = getChangeIndicator(log.previousQty, log.newQty);
                  return (
                    <div
                      key={log.id}
                      className="p-3 flex items-center justify-between"
                      style={{
                        borderBottom: idx < dayLogs.length - 1 ? "1px solid var(--border-light)" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{showSymbols ? change.emoji : change.simple}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                              {log.location?.name}
                            </span>
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                              {log.product?.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                            <span>{formatTime(log.changedAt)}</span>
                            <span>•</span>
                            <span>{log.changedBy?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm" style={{ color: showColors ? change.color : "var(--text-primary)" }}>
                          {change.text}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {log.previousQty ?? "—"} → {log.newQty}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {logs.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {logs.length}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Änderungen
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {new Set(logs.map((l) => l.locationId)).size}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Lagerplätze
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {new Set(logs.map((l) => l.changedById)).size}
              </div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                Benutzer
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
