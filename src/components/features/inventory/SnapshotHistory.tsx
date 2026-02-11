"use client";

import { useState, useEffect } from "react";
import { InventorySnapshot } from "@/types";
import Button from "@/components/ui/Button";

interface SnapshotWithMeta extends InventorySnapshot {
  _count?: { entries: number };
}

export default function SnapshotHistory() {
  const [snapshots, setSnapshots] = useState<SnapshotWithMeta[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<InventorySnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const fetchSnapshots = async () => {
    try {
      const response = await fetch("/api/snapshots?limit=50");
      if (response.ok) {
        const data = await response.json();
        setSnapshots(data);
      }
    } catch (err) {
      console.error("Failed to fetch snapshots:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSnapshotDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/snapshots/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedSnapshot(data);
      }
    } catch (err) {
      console.error("Failed to load snapshot detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
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
      {/* Snapshot List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
      >
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
            Recent Snapshots
          </h3>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            Noch keine Snapshots vorhanden. Erstellen Sie Ihren ersten Lagerbestand-Snapshot oben.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors cursor-pointer"
                style={{ backgroundColor: selectedSnapshot?.id === snapshot.id ? "var(--bg-tertiary)" : "transparent" }}
                onClick={() => loadSnapshotDetail(snapshot.id)}
              >
                <div>
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatDate(snapshot.takenAt)}
                  </div>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Von {snapshot.takenBy?.name || snapshot.takenBy?.email || "Unbekannt"}
                    {snapshot._count && ` • ${snapshot._count.entries} Einträge`}
                  </div>
                  {snapshot.notes && (
                    <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                      {snapshot.notes}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  Anzeigen
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Snapshot Detail */}
      {selectedSnapshot && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Snapshot-Details - {formatDate(selectedSnapshot.takenAt)}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedSnapshot(null)}>
              Schließen
            </Button>
          </div>

          {isLoadingDetail ? (
            <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
              Wird geladen...
            </div>
          ) : (
            <div className="p-4">
              {selectedSnapshot.notes && (
                <div
                  className="mb-4 p-3 rounded-lg"
                  style={{ backgroundColor: "var(--bg-tertiary)" }}
                >
                  <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    Notizen
                  </div>
                  <div style={{ color: "var(--text-primary)" }}>
                    {selectedSnapshot.notes}
                  </div>
                </div>
              )}

              {/* Group entries by location */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <th
                        className="text-left p-2 text-sm font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Lagerplatz
                      </th>
                      <th
                        className="text-left p-2 text-sm font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Produkt
                      </th>
                      <th
                        className="text-right p-2 text-sm font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Menge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSnapshot.entries?.map((entry) => (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: "1px solid var(--border-light)" }}
                      >
                        <td className="p-2" style={{ color: "var(--text-primary)" }}>
                          {entry.location?.name || entry.locationId}
                        </td>
                        <td className="p-2" style={{ color: "var(--text-secondary)" }}>
                          {entry.product?.name || entry.productId}
                          {entry.product?.code && (
                            <span style={{ color: "var(--text-muted)" }}>
                              {" "}({entry.product.code})
                            </span>
                          )}
                        </td>
                        <td
                          className="p-2 text-right font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {entry.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: "var(--bg-tertiary)" }}>
                      <td
                        colSpan={2}
                        className="p-2 font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Gesamt
                      </td>
                      <td
                        className="p-2 text-right font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {selectedSnapshot.entries?.reduce((sum, e) => sum + e.quantity, 0) || 0}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
