"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { StorageLocation, ProductVariant, InventoryInput } from "@/types";
import FloorLayout from "./FloorLayout";
import MobileEntrySheet from "./MobileEntrySheet";

export default function InventoryCapture() {
  const [allLocations, setAllLocations] = useState<StorageLocation[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [inventoryData, setInventoryData] = useState<Map<string, InventoryInput[]>>(
    new Map()
  );
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(
    null
  );
  const [currentParent, setCurrentParent] = useState<StorageLocation | null>(null);
  const [navigationStack, setNavigationStack] = useState<StorageLocation[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter locations based on current parent
  const displayedLocations = useMemo(() => {
    if (currentParent) {
      // Show children of current parent
      return allLocations.filter((l) => l.parentId === currentParent.id);
    }
    // Show root locations (no parent)
    return allLocations.filter((l) => !l.parentId);
  }, [allLocations, currentParent]);

  // Fetch locations and products
  const fetchData = useCallback(async () => {
    try {
      const [locRes, prodRes] = await Promise.all([
        fetch("/api/locations?includeChildren=false"),
        fetch("/api/products"),
      ]);

      if (!locRes.ok || !prodRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [locData, prodData] = await Promise.all([
        locRes.json(),
        prodRes.json(),
      ]);

      setAllLocations(locData);
      setProducts(prodData);
    } catch (err) {
      setError("Daten konnten nicht geladen werden. Bitte Seite neu laden.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation helpers for moving between locations in current view
  const currentLocationIndex = useMemo(() => {
    if (!selectedLocation) return -1;
    return displayedLocations.findIndex((l) => l.id === selectedLocation.id);
  }, [selectedLocation, displayedLocations]);

  const goToNextLocation = () => {
    // Get all leaf locations (no children) in current view
    const leafLocations = displayedLocations.filter((l) => (l.childCount || 0) === 0);
    const currentLeafIndex = leafLocations.findIndex((l) => l.id === selectedLocation?.id);
    if (currentLeafIndex < leafLocations.length - 1) {
      setSelectedLocation(leafLocations[currentLeafIndex + 1]);
    }
  };

  const goToPrevLocation = () => {
    const leafLocations = displayedLocations.filter((l) => (l.childCount || 0) === 0);
    const currentLeafIndex = leafLocations.findIndex((l) => l.id === selectedLocation?.id);
    if (currentLeafIndex > 0) {
      setSelectedLocation(leafLocations[currentLeafIndex - 1]);
    }
  };

  const handleLocationClick = (location: StorageLocation) => {
    setSelectedLocation(location);
  };

  const handleDrillIn = (location: StorageLocation) => {
    setNavigationStack((prev) => [...prev, location]);
    setCurrentParent(location);
    setSelectedLocation(null);
  };

  const handleNavigateBack = () => {
    setNavigationStack((prev) => {
      const newStack = [...prev];
      newStack.pop();
      const newParent = newStack[newStack.length - 1] || null;
      setCurrentParent(newParent);
      return newStack;
    });
    setSelectedLocation(null);
  };

  const handleUpdateEntries = (locationId: string, entries: InventoryInput[]) => {
    setInventoryData((prev) => {
      const newMap = new Map(prev);
      if (entries.length === 0) {
        newMap.delete(locationId);
      } else {
        newMap.set(locationId, entries);
      }
      return newMap;
    });
  };

  const handleSaveSnapshot = async () => {
    const allEntries: InventoryInput[] = [];
    inventoryData.forEach((entries) => {
      allEntries.push(...entries);
    });

    if (allEntries.length === 0) {
      setError("Bitte erfassen Sie mindestens einen Lagerplatz.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || null,
          entries: allEntries,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Snapshot konnte nicht gespeichert werden");
      }

      setInventoryData(new Map());
      setSelectedLocation(null);
      setNotes("");
      setSuccess("✓ Lagerbestand erfolgreich gespeichert!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot konnte nicht gespeichert werden");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm("Alle erfassten Daten löschen?")) {
      setInventoryData(new Map());
      setSelectedLocation(null);
      setCurrentParent(null);
      setNavigationStack([]);
      setNotes("");
    }
  };

  // Calculate totals - count all locations that have data
  const totalPallets = Array.from(inventoryData.values())
    .flat()
    .reduce((sum, e) => sum + e.quantity, 0);
  const locationsWithData = inventoryData.size;
  const leafLocations = allLocations.filter((l) => (l.childCount || 0) === 0);
  const hasData = locationsWithData > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div
            className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
          <p style={{ color: "var(--text-muted)" }}>Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages - positioned at top */}
      {error && (
        <div
          className="mx-4 mb-4 p-3 rounded-xl text-sm font-medium animate-shake"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}
        >
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div
          className="mx-4 mb-4 p-3 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}
        >
          {success}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-hidden">
      {allLocations.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full p-8 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
              Keine Lagerplätze konfiguriert
            </h3>
            <p>Bitte zuerst Lagerplätze in der Lagerkonfiguration hinzufügen.</p>
          </div>
        ) : (
          <div
            className="h-full rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                🗺️ Grundriss
              </h3>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Tippen zum Erfassen
              </span>
            </div>

            {/* Floor layout */}
            <div className="p-2">
              <FloorLayout
                locations={displayedLocations}
                products={products}
                inventoryData={inventoryData}
                onLocationClick={handleLocationClick}
                onDrillIn={handleDrillIn}
                selectedLocationId={selectedLocation?.id}
                currentParent={currentParent}
                onNavigateBack={handleNavigateBack}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar - always visible */}
      <div
        className="mt-4 rounded-2xl p-4"
        style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
        }}
      >
        {/* Stats row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Lagerplätze</div>
                <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {locationsWithData}/{leafLocations.length}
                </div>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <span className="text-2xl">📦</span>
              <div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>Paletten</div>
                <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                  {totalPallets}
                </div>
              </div>
            </div>
          </div>

          {/* Clear button */}
          {hasData && (
            <button
              onClick={handleClear}
              className="p-3 rounded-xl transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-muted)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Notes input */}
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionale Notizen..."
          className="w-full px-4 py-3 rounded-xl mb-4 text-base"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        />

        {/* Save button */}
        <button
          onClick={handleSaveSnapshot}
          disabled={isSaving || !hasData}
          className="w-full h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: hasData ? "var(--accent)" : "var(--bg-tertiary)",
            color: hasData ? "white" : "var(--text-muted)",
          }}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Speichern...
            </span>
          ) : (
            `💾 Snapshot speichern${hasData ? ` (${totalPallets} Paletten)` : ""}`
          )}
        </button>
      </div>

      {/* Mobile Entry Sheet */}
      {selectedLocation && (
        <MobileEntrySheet
          location={selectedLocation}
          products={products}
          entries={inventoryData.get(selectedLocation.id) || []}
          onUpdate={handleUpdateEntries}
          onClose={() => setSelectedLocation(null)}
          onNext={goToNextLocation}
          onPrev={goToPrevLocation}
          hasNext={
            displayedLocations.filter((l) => (l.childCount || 0) === 0)
              .findIndex((l) => l.id === selectedLocation?.id) <
            displayedLocations.filter((l) => (l.childCount || 0) === 0).length - 1
          }
          hasPrev={
            displayedLocations.filter((l) => (l.childCount || 0) === 0)
              .findIndex((l) => l.id === selectedLocation?.id) > 0
          }
        />
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
