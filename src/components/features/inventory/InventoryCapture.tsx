"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { StorageLocation, ProductVariant, InventoryInput } from "@/types";
import { useUser } from "@/context/UserContext";
import { useRefreshOnNav } from "@/hooks/useRefreshOnNav";
import FloorLayout from "./FloorLayout";
import MobileEntrySheet from "./MobileEntrySheet";

export default function InventoryCapture() {
  const { user } = useUser();
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
  const [isLoading, setIsLoading] = useState(true);
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

  // Refetch when navigating to this page
  useRefreshOnNav(fetchData);

  // Initial load only (useEffect will be removed as useRefreshOnNav handles it)
  useEffect(() => {
    if (allLocations.length === 0) {
      fetchData();
    }
  }, []);

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

  // Save only the current location's entries
  const handleSaveCurrentLocation = async () => {
    if (!selectedLocation) return;
    
    const entries = inventoryData.get(selectedLocation.id) || [];
    if (entries.length === 0) return;

    if (!user) {
      setError("Nicht angemeldet.");
      return;
    }

    setError("");
    
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error === "USER_NOT_FOUND") {
          setError("⚠️ Sitzung ungültig. Bitte ausloggen und erneut einloggen.");
          return;
        }
        throw new Error(data.error || "Lagerstand konnte nicht gespeichert werden");
      }

      // Clear this location's entries from local state
      setInventoryData((prev) => {
        const newMap = new Map(prev);
        newMap.delete(selectedLocation.id);
        return newMap;
      });
      
      setSuccess(`✓ ${selectedLocation.name} gespeichert`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      throw err; // Re-throw so MobileEntrySheet knows it failed
    }
  };

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

      {/* Mobile Entry Sheet */}
      {selectedLocation && (
        <MobileEntrySheet
          location={selectedLocation}
          products={products}
          entries={inventoryData.get(selectedLocation.id) || []}
          onUpdate={handleUpdateEntries}
          onClose={() => setSelectedLocation(null)}
          onSave={handleSaveCurrentLocation}
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
