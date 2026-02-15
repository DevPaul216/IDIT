"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { StorageLocation, ProductVariant, CurrentInventory } from "@/types";

interface LocationInventory {
  locationId: string;
  totalPallets: number;
  totalWeight: number;
  productCount: number;
  lastCheckedAt: string | null;
  items: {
    product: ProductVariant;
    quantity: number;
  }[];
}

interface StorageViewerProps {
  onClose?: () => void;
}

function getFreshnessInfo(lastChecked: string | null): { label: string; color: string; emoji: string } {
  if (!lastChecked) {
    return { label: "Nie geprüft", color: "#6b7280", emoji: "⚪" };
  }
  
  const now = new Date();
  const checked = new Date(lastChecked);
  const diffMs = now.getTime() - checked.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    return { label: "Gerade eben", color: "#22c55e", emoji: "🟢" };
  } else if (diffDays < 1) {
    return { label: `Vor ${Math.floor(diffHours)} Std.`, color: "#22c55e", emoji: "🟢" };
  } else if (diffDays < 7) {
    return { label: `Vor ${Math.floor(diffDays)} Tag(en)`, color: "#eab308", emoji: "🟡" };
  } else {
    return { label: `Vor ${Math.floor(diffDays)} Tag(en)`, color: "#ef4444", emoji: "🔴" };
  }
}

export default function StorageViewer({ onClose }: StorageViewerProps) {
  const [allLocations, setAllLocations] = useState<StorageLocation[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [inventory, setInventory] = useState<CurrentInventory[]>([]);
  const [navigationStack, setNavigationStack] = useState<StorageLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      const [locRes, prodRes, invRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/products"),
        fetch("/api/inventory/current"),
      ]);

      const locData = locRes.ok ? await locRes.json() : [];
      const prodData = prodRes.ok ? await prodRes.json() : [];
      const invData = invRes.ok ? await invRes.json() : [];
      
      setAllLocations(locData);
      setProducts(prodData);
      setInventory(invData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derive currentParent from navigationStack
  const currentParent = useMemo(() => {
    return navigationStack[navigationStack.length - 1] || null;
  }, [navigationStack]);

  // Filter locations based on current parent
  const displayedLocations = useMemo(() => {
    if (currentParent) {
      return allLocations.filter((l) => l.parentId === currentParent.id);
    }
    return allLocations.filter((l) => !l.parentId);
  }, [allLocations, currentParent]);

  // Calculate canvas bounds - coordinates are in pixels
  const { maxX, maxY } = useMemo(() => {
    if (displayedLocations.length === 0) return { maxX: 800, maxY: 600 };
    const maxX = Math.max(...displayedLocations.map((l) => l.x + l.width), 800);
    const maxY = Math.max(...displayedLocations.map((l) => l.y + l.height), 600);
    return { maxX, maxY };
  }, [displayedLocations]);

  // Build inventory lookup by location
  const inventoryByLocation = useMemo(() => {
    const map: Record<string, LocationInventory> = {};
    
    inventory.forEach((item) => {
      if (!map[item.locationId]) {
        map[item.locationId] = {
          locationId: item.locationId,
          totalPallets: 0,
          totalWeight: 0,
          productCount: 0,
          lastCheckedAt: null,
          items: [],
        };
      }
      
      const loc = map[item.locationId];
      loc.totalPallets += item.quantity;
      loc.productCount += 1;
      
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        loc.items.push({ product, quantity: item.quantity });
        if (product.resourceWeight) {
          loc.totalWeight += product.resourceWeight * item.quantity;
        }
      }
      
      if (!loc.lastCheckedAt || new Date(item.lastCheckedAt) > new Date(loc.lastCheckedAt)) {
        loc.lastCheckedAt = item.lastCheckedAt as unknown as string;
      }
    });
    
    return map;
  }, [inventory, products]);

  // Calculate aggregated inventory for parent locations
  const getAggregatedInventory = useCallback((locationId: string): LocationInventory => {
    const location = allLocations.find((l) => l.id === locationId);
    const hasChildren = (location?.childCount || 0) > 0;
    
    if (!hasChildren) {
      return inventoryByLocation[locationId] || {
        locationId,
        totalPallets: 0,
        totalWeight: 0,
        productCount: 0,
        lastCheckedAt: null,
        items: [],
      };
    }
    
    const aggregated: LocationInventory = {
      locationId,
      totalPallets: 0,
      totalWeight: 0,
      productCount: 0,
      lastCheckedAt: null,
      items: [],
    };
    
    const collectFromChildren = (parentId: string) => {
      const children = allLocations.filter((l) => l.parentId === parentId);
      children.forEach((child) => {
        if ((child.childCount || 0) > 0) {
          collectFromChildren(child.id);
        } else {
          const childInv = inventoryByLocation[child.id];
          if (childInv) {
            aggregated.totalPallets += childInv.totalPallets;
            aggregated.totalWeight += childInv.totalWeight;
            aggregated.productCount += childInv.productCount;
            aggregated.items.push(...childInv.items);
            if (!aggregated.lastCheckedAt || (childInv.lastCheckedAt && new Date(childInv.lastCheckedAt) > new Date(aggregated.lastCheckedAt))) {
              aggregated.lastCheckedAt = childInv.lastCheckedAt;
            }
          }
        }
      });
    };
    
    collectFromChildren(locationId);
    return aggregated;
  }, [allLocations, inventoryByLocation]);

  // Get color based on fill level and capacity
  const getLocationStyle = (location: StorageLocation, isSelected: boolean) => {
    const inv = getAggregatedInventory(location.id);
    const total = inv.totalPallets;
    const hasChildren = (location.childCount || 0) > 0;
    const capacity = location.capacity;
    const utilization = capacity ? (total / capacity) * 100 : null;
    
    let bgColor = hasChildren ? "var(--bg-secondary)" : "var(--bg-tertiary)";
    let textColor = "var(--text-muted)";
    let borderColor = "var(--border-color)";
    
    if (hasChildren && location.color) {
      bgColor = location.color + "22";
      borderColor = location.color;
      textColor = location.color;
    } else if (total > 0) {
      // Color based on capacity utilization if available, otherwise quantity
      if (utilization !== null) {
        if (utilization > 90) {
          bgColor = "#ef4444"; // red - nearly full
          textColor = "white";
        } else if (utilization > 70) {
          bgColor = "#f59e0b"; // amber - getting full
          textColor = "white";
        } else {
          bgColor = "#22c55e"; // green - good
          textColor = "white";
        }
      } else {
        // Fallback to quantity-based colors
        if (total < 5) {
          bgColor = "#22c55e";
          textColor = "white";
        } else if (total < 15) {
          bgColor = "#f59e0b";
          textColor = "white";
        } else {
          bgColor = "#ef4444";
          textColor = "white";
        }
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
        : total > 0 || hasChildren
        ? "0 4px 12px rgba(0,0,0,0.15)"
        : "0 2px 4px rgba(0,0,0,0.05)",
    };
  };

  const handleDrillIn = (location: StorageLocation) => {
    setNavigationStack((prev) => [...prev, location]);
    setSelectedLocation(null);
  };

  const handleNavigateBack = () => {
    setNavigationStack((prev) => {
      const newStack = [...prev];
      newStack.pop();
      return newStack;
    });
    setSelectedLocation(null);
  };

  const handleLocationClick = (location: StorageLocation) => {
    const hasChildren = (location.childCount || 0) > 0;
    if (hasChildren) {
      handleDrillIn(location);
    } else {
      setSelectedLocation(selectedLocation?.id === location.id ? null : location);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Breadcrumb navigation */}
      {currentParent && (
        <button
          onClick={handleNavigateBack}
          className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all active:scale-[0.98] w-full"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">← Zurück</span>
          <span className="ml-auto text-sm px-2 py-1 rounded-lg" style={{ 
            backgroundColor: currentParent.color || "var(--accent)",
            color: "white" 
          }}>
            {currentParent.name}
          </span>
        </button>
      )}

      {/* Zoom controls */}
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
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#22c55e" }} />
            <span>&lt;70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span>70-90%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span>&gt;90%</span>
          </div>
        </div>
      </div>

      {/* Floor plan */}
      {displayedLocations.length > 0 ? (
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
              className="absolute inset-4 rounded-lg opacity-30 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(var(--border-light) 1px, transparent 1px),
                  linear-gradient(90deg, var(--border-light) 1px, transparent 1px)
                `,
                backgroundSize: `10px 10px`,
              }}
            />

            {/* Locations */}
            {displayedLocations.map((location) => {
              const inv = getAggregatedInventory(location.id);
              const isSelected = selectedLocation?.id === location.id;
              const style = getLocationStyle(location, isSelected);
              const hasChildren = (location.childCount || 0) > 0;
              const freshness = getFreshnessInfo(inv.lastCheckedAt);
              const capacity = location.capacity;
              const utilization = capacity ? Math.min((inv.totalPallets / capacity) * 100, 100) : null;

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
                  {/* Location name */}
                  <span className="font-bold text-base sm:text-lg">
                    {location.name}
                  </span>
                  
                  {hasChildren ? (
                    <>
                      <span className="text-xs font-semibold opacity-90 flex items-center gap-1">
                        <span>{location.childCount} Bereiche</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      {inv.totalPallets > 0 && (
                        <span className="text-xs opacity-80 mt-0.5">
                          {inv.totalPallets} Pal. • {Math.round(inv.totalWeight)} kg
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Inventory summary */}
                      <span className="text-xs sm:text-sm font-semibold opacity-90">
                        {inv.totalPallets > 0 ? `${inv.totalPallets} 📦` : "—"}
                      </span>
                      {inv.totalWeight > 0 && (
                        <span className="text-[10px] opacity-80">
                          {Math.round(inv.totalWeight)} kg
                        </span>
                      )}
                      {/* Freshness indicator */}
                      <span className="text-[10px] opacity-70 mt-0.5">
                        {freshness.emoji}
                      </span>
                    </>
                  )}
                  
                  {/* Capacity bar for leaf locations */}
                  {!hasChildren && utilization !== null && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${utilization}%`,
                          backgroundColor: "rgba(255,255,255,0.8)",
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Keine Zonen konfiguriert
          </p>
        </div>
      )}

      {/* Selected location detail panel */}
      {selectedLocation && !((selectedLocation.childCount || 0) > 0) && (
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            border: `2px solid ${selectedLocation.color || "var(--accent)"}`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              📍 {selectedLocation.name}
            </h4>
            <button
              onClick={() => setSelectedLocation(null)}
              className="p-1 rounded-lg"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          </div>
          
          {(() => {
            const inv = inventoryByLocation[selectedLocation.id];
            const freshness = getFreshnessInfo(inv?.lastCheckedAt || null);
            const capacity = selectedLocation.capacity;
            const utilization = capacity && inv ? Math.min((inv.totalPallets / capacity) * 100, 100) : null;
            
            return (
              <div className="space-y-3">
                {/* Stats row */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                      {inv?.totalPallets || 0}
                    </span>
                    <span className="ml-1" style={{ color: "var(--text-muted)" }}>Paletten</span>
                  </div>
                  {(inv?.totalWeight || 0) > 0 && (
                    <div>
                      <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                        {Math.round(inv?.totalWeight || 0)}
                      </span>
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>kg</span>
                    </div>
                  )}
                  <div className="ml-auto" style={{ color: freshness.color }}>
                    {freshness.emoji} {freshness.label}
                  </div>
                </div>
                
                {/* Capacity bar */}
                {utilization !== null && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>Auslastung</span>
                      <span style={{ color: utilization > 90 ? "#ef4444" : utilization > 70 ? "#f59e0b" : "#22c55e" }}>
                        {Math.round(utilization)}% ({inv?.totalPallets || 0}/{capacity})
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${utilization}%`,
                          backgroundColor: utilization > 90 ? "#ef4444" : utilization > 70 ? "#f59e0b" : "#22c55e",
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Product list */}
                {inv && inv.items.length > 0 ? (
                  <div className="space-y-1 pt-2 border-t" style={{ borderColor: "var(--border-light)" }}>
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Produkte:</span>
                    {inv.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      >
                        <div className="flex items-center gap-2">
                          {item.product.color && (
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.product.color }} />
                          )}
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                            {item.product.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-bold px-2 py-0.5 rounded"
                            style={{ backgroundColor: item.product.color || "var(--accent)", color: "white" }}
                          >
                            {item.quantity}
                          </span>
                          {item.product.resourceWeight && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              ({Math.round(item.product.resourceWeight * item.quantity)} kg)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm pt-2" style={{ color: "var(--text-muted)" }}>
                    Kein Bestand erfasst
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
