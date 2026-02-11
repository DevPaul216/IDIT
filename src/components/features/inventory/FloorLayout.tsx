"use client";

import { StorageLocation, ProductVariant, InventoryInput } from "@/types";
import { useMemo, useState } from "react";

interface FloorLayoutProps {
  locations: StorageLocation[];
  products: ProductVariant[];
  inventoryData: Map<string, InventoryInput[]>;
  onLocationClick: (location: StorageLocation) => void;
  onDrillIn?: (location: StorageLocation) => void;
  selectedLocationId?: string;
  compact?: boolean;
  currentParent?: StorageLocation | null;
  onNavigateBack?: () => void;
}

export default function FloorLayout({
  locations,
  products,
  inventoryData,
  onLocationClick,
  onDrillIn,
  selectedLocationId,
  compact = false,
  currentParent,
  onNavigateBack,
}: FloorLayoutProps) {
  const [scale, setScale] = useState(1);

  // Calculate canvas bounds - coordinates are already in pixels
  const { maxX, maxY } = useMemo(() => {
    const maxX = Math.max(...locations.map((l) => l.x + l.width), 800);
    const maxY = Math.max(...locations.map((l) => l.y + l.height), 600);
    return { maxX, maxY };
  }, [locations]);

  // Get total quantity for a location (including all children recursively)
  const getLocationTotal = (locationId: string): number => {
    const entries = inventoryData.get(locationId) || [];
    return entries.reduce((sum, e) => sum + e.quantity, 0);
  };

  // Get color based on fill level (more vibrant colors)
  const getLocationStyle = (location: StorageLocation, isSelected: boolean) => {
    const total = getLocationTotal(location.id);
    const hasData = total > 0;
    const hasChildren = (location.childCount || 0) > 0;
    
    let bgColor = hasChildren ? "var(--bg-secondary)" : "var(--bg-tertiary)";
    let textColor = "var(--text-muted)";
    let borderColor = "var(--border-color)";
    
    // Use location color if it has one and has children (for parent areas)
    if (hasChildren && location.color) {
      bgColor = location.color + "22"; // Add transparency
      borderColor = location.color;
      textColor = location.color;
    } else if (hasData) {
      if (total < 5) {
        bgColor = "#22c55e"; // green
        textColor = "white";
      } else if (total < 15) {
        bgColor = "#f59e0b"; // amber
        textColor = "white";
      } else {
        bgColor = "#ef4444"; // red
        textColor = "white";
      }
    }
    
    if (isSelected) {
      borderColor = "#3b82f6";
    }

    return {
      backgroundColor: bgColor,
      color: textColor,
      borderColor,
      boxShadow: isSelected
        ? "0 0 0 3px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(0,0,0,0.15)"
        : hasData || hasChildren
        ? "0 4px 12px rgba(0,0,0,0.15)"
        : "0 2px 4px rgba(0,0,0,0.05)",
    };
  };

  const handleLocationClick = (location: StorageLocation) => {
    const hasChildren = (location.childCount || 0) > 0;
    if (hasChildren && onDrillIn) {
      onDrillIn(location);
    } else {
      onLocationClick(location);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb navigation when inside a parent */}
      {currentParent && onNavigateBack && (
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">← Zurück zur Übersicht</span>
          <span className="ml-auto text-sm px-2 py-1 rounded-lg" style={{ 
            backgroundColor: currentParent.color || "var(--accent)",
            color: "white" 
          }}>
            {currentParent.name}
          </span>
        </button>
      )}

      {/* Zoom controls for mobile */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            −
          </button>
          <span className="text-sm font-medium min-w-[3rem] text-center" style={{ color: "var(--text-muted)" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.25))}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            +
          </button>
        </div>
        
        {/* Legend - compact for mobile */}
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }} />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#22c55e" }} />
            <span>1-4</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span>5-14</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span>15+</span>
          </div>
        </div>
      </div>

      {/* Scrollable floor plan */}
      <div
        className="overflow-auto rounded-xl touch-pan-x touch-pan-y"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-light)",
        }}
      >
        <div
          className="relative p-4 min-w-fit"
          style={{
            width: maxX * scale + 32,
            height: maxY * scale + 32,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {/* Grid background pattern */}
          <div
            className="absolute inset-4 rounded-lg opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(var(--border-light) 1px, transparent 1px),
                linear-gradient(90deg, var(--border-light) 1px, transparent 1px)
              `,
              backgroundSize: `10px 10px`,
            }}
          />

          {/* Storage locations */}
          {locations.map((location) => {
            const total = getLocationTotal(location.id);
            const isSelected = selectedLocationId === location.id;
            const style = getLocationStyle(location, isSelected);
            const hasChildren = (location.childCount || 0) > 0;

            return (
              <button
                key={location.id}
                onClick={() => handleLocationClick(location)}
                className="absolute flex flex-col items-center justify-center transition-all duration-150 cursor-pointer active:scale-95 touch-manipulation"
                style={{
                  left: location.x + 16,
                  top: location.y + 16,
                  width: location.width,
                  height: location.height,
                  borderRadius: "12px",
                  border: isSelected ? "3px solid" : hasChildren ? "2px dashed" : "2px solid",
                  ...style,
                }}
              >
                <span className="font-bold text-base sm:text-lg">
                  {location.name}
                </span>
                {hasChildren ? (
                  <span className="text-xs sm:text-sm font-semibold opacity-90 flex items-center gap-1">
                    <span>{location.childCount} Bereiche</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold opacity-90">
                    {total > 0 ? `${total} 📦` : "—"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
