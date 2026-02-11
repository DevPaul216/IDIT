"use client";

import { StorageLocation, ProductVariant, InventoryInput, ProductCategory } from "@/types";
import QuickNumberInput from "./QuickNumberInput";
import { useEffect, useRef, useState, useMemo } from "react";

// Category labels for display (no "all" option)
const CATEGORY_TABS: { key: ProductCategory; label: string; icon: string }[] = [
  { key: "raw", label: "Rohmaterial", icon: "🧵" },
  { key: "finished", label: "Fertigprodukte", icon: "📦" },
  { key: "packaging", label: "Verpackung", icon: "🏷️" },
];

interface MobileEntrySheetProps {
  location: StorageLocation;
  products: ProductVariant[];
  entries: InventoryInput[];
  onUpdate: (locationId: string, entries: InventoryInput[]) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function MobileEntrySheet({
  location,
  products,
  entries,
  onUpdate,
  onClose,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: MobileEntrySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  
  // Find first category with products as default
  const defaultCategory = useMemo(() => {
    for (const tab of CATEGORY_TABS) {
      if (products.some((p) => p.category === tab.key)) {
        return tab.key;
      }
    }
    return "raw";
  }, [products]);
  
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(defaultCategory);

  // Create a map for quick lookup
  const entryMap = new Map(entries.map((e) => [e.productId, e.quantity]));

  // Filter products by category and sort (items with inventory first)
  const filteredProducts = useMemo(() => {
    const filtered = products.filter((p) => p.category === activeCategory);
    return filtered.sort((a, b) => {
      const aQty = entryMap.get(a.id) || 0;
      const bQty = entryMap.get(b.id) || 0;
      // Items with quantity come first
      if (aQty > 0 && bQty === 0) return -1;
      if (aQty === 0 && bQty > 0) return 1;
      return 0;
    });
  }, [products, activeCategory, entryMap]);

  // Count products per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newEntries = products
      .map((product) => ({
        locationId: location.id,
        productId: product.id,
        quantity: product.id === productId ? quantity : entryMap.get(product.id) || 0,
      }))
      .filter((e) => e.quantity > 0);

    onUpdate(location.id, newEntries);
  };

  const totalPallets = entries.reduce((sum, e) => sum + e.quantity, 0);

  // Handle swipe gestures for navigation
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && hasPrev && onPrev) {
          onPrev();
        } else if (diffX < 0 && hasNext && onNext) {
          onNext();
        }
      }
    };

    sheet.addEventListener("touchstart", handleTouchStart);
    sheet.addEventListener("touchend", handleTouchEnd);

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchend", handleTouchEnd);
    };
  }, [hasNext, hasPrev, onNext, onPrev]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl animate-slideUp max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-12 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--border-color)" }}
          />
        </div>

        {/* Header */}
        <div
          className="px-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center gap-3">
            {/* Nav buttons */}
            <div className="flex gap-1">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                style={{ backgroundColor: "var(--bg-tertiary)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-primary)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Location info */}
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {location.name}
              </h2>
              {location.description && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {location.description}
                </p>
              )}
            </div>
          </div>

          {/* Total badge */}
          <div
            className="px-4 py-2 rounded-full font-bold text-lg"
            style={{
              backgroundColor: totalPallets > 0 ? "var(--accent)" : "var(--bg-tertiary)",
              color: totalPallets > 0 ? "white" : "var(--text-muted)",
            }}
          >
            {totalPallets} 📦
          </div>
        </div>

        {/* Product inputs - scrollable */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Category tabs */}
          <div 
            className="flex gap-2 p-3 overflow-x-auto shrink-0"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            {CATEGORY_TABS.map((tab) => {
              const count = categoryCounts[tab.key] || 0;
              const isActive = activeCategory === tab.key;
              // Don't show tabs with 0 products
              if (count === 0) return null;
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveCategory(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all active:scale-95"
                  style={{
                    backgroundColor: isActive ? "var(--accent)" : "var(--bg-tertiary)",
                    color: isActive ? "white" : "var(--text-secondary)",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "var(--bg-secondary)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              {products.length === 0 
                ? "Keine Produkte konfiguriert." 
                : "Keine Produkte in dieser Kategorie."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <QuickNumberInput
                  key={product.id}
                  value={entryMap.get(product.id) || 0}
                  onChange={(value) => handleQuantityChange(product.id, value)}
                  label={product.name}
                  color={product.color || undefined}
                />
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Footer with done button */}
        <div
          className="p-4 safe-area-inset-bottom"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          <button
            onClick={onClose}
            className="w-full h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
            style={{
              backgroundColor: "var(--accent)",
              color: "white",
            }}
          >
            ✓ Fertig
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .safe-area-inset-bottom {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </>
  );
}
