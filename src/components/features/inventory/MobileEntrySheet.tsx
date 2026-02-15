"use client";

import { StorageLocation, ProductVariant, InventoryInput, ProductCategory } from "@/types";
import QuickNumberInput from "./QuickNumberInput";
import { useEffect, useRef, useState, useMemo } from "react";

// Inline numpad component for table view
function TableNumpad({
  product,
  value,
  onConfirm,
  onDiscard,
}: {
  product: ProductVariant;
  value: number;
  onConfirm: (value: number) => void;
  onDiscard: () => void;
}) {
  const [inputValue, setInputValue] = useState(value === 0 ? "" : value.toString());

  const handleKey = (key: string) => {
    if (key === "backspace") {
      setInputValue((prev) => prev.slice(0, -1));
    } else if (key === "clear") {
      setInputValue("");
    } else {
      const newValue = inputValue + key;
      if (parseInt(newValue) <= 999) {
        setInputValue(newValue);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[70] animate-fadeIn" />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-[320px] rounded-2xl p-4"
        style={{ backgroundColor: "var(--bg-primary)" }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {product.color && (
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: product.color }} />
            )}
            <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
              {product.name}
            </span>
          </div>
          <div
            className="text-5xl font-bold py-4 rounded-xl"
            style={{ 
              backgroundColor: "var(--bg-secondary)",
              color: inputValue ? "var(--text-primary)" : "var(--text-muted)",
            }}
          >
            {inputValue || "0"}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKey(num)}
              className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95"
              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleKey("clear")}
            className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "#ef4444" }}
          >
            C
          </button>
          <button
            onClick={() => handleKey("0")}
            className="h-14 rounded-xl text-2xl font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            0
          </button>
          <button
            onClick={() => handleKey("backspace")}
            className="h-14 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
          >
            ⌫
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onDiscard}
            className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
            style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            Verwerfen
          </button>
          <button
            onClick={() => onConfirm(parseInt(inputValue) || 0)}
            className="h-14 rounded-xl text-lg font-bold transition-all active:scale-95"
            style={{ backgroundColor: product.color || "var(--accent)", color: "white" }}
          >
            ✓ OK
          </button>
        </div>
      </div>
    </>
  );
}

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
  onSave: () => Promise<void>;
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
  onSave,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: MobileEntrySheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

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

  // All products sorted: items with quantity first, then by name
  const allProductsSorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const aQty = entryMap.get(a.id) || 0;
      const bQty = entryMap.get(b.id) || 0;
      // Items with quantity come first
      if (aQty > 0 && bQty === 0) return -1;
      if (aQty === 0 && bQty > 0) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
  }, [products, entryMap]);

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
          {/* View toggle and category tabs */}
          <div 
            className="flex items-center gap-2 p-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            {/* View mode toggle */}
            <div 
              className="flex rounded-lg p-1 shrink-0"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              <button
                onClick={() => setViewMode("grid")}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === "grid" ? "var(--bg-primary)" : "transparent",
                  color: viewMode === "grid" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: viewMode === "grid" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode("table")}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === "table" ? "var(--bg-primary)" : "transparent",
                  color: viewMode === "table" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                ☰
              </button>
            </div>

            {/* Category tabs - only show in grid mode */}
            {viewMode === "grid" && (
              <div className="flex gap-2 overflow-x-auto">
                {CATEGORY_TABS.map((tab) => {
                  const count = categoryCounts[tab.key] || 0;
                  const isActive = activeCategory === tab.key;
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
            )}

            {/* Table view label */}
            {viewMode === "table" && (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                Alle Produkte ({products.length})
              </span>
            )}
          </div>

          {/* Product content area */}
          <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "grid" ? (
            /* Grid View */
            filteredProducts.length === 0 ? (
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
            )
          ) : (
            /* Table View */
            <div className="space-y-1">
              {allProductsSorted.map((product) => {
                const qty = entryMap.get(product.id) || 0;
                const isEditing = editingProductId === product.id;
                
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-3 px-3 rounded-xl transition-all"
                    style={{
                      backgroundColor: qty > 0 ? (product.color ? `${product.color}15` : "var(--accent-light)") : "var(--bg-secondary)",
                      borderLeft: qty > 0 ? `4px solid ${product.color || "var(--accent)"}` : "4px solid transparent",
                    }}
                  >
                    {/* Product info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {product.color && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: product.color }}
                        />
                      )}
                      <span 
                        className="font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {product.name}
                      </span>
                    </div>

                    {/* Quantity - tappable */}
                    <button
                      onClick={() => setEditingProductId(product.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-lg min-w-[80px] justify-center transition-all active:scale-95"
                      style={{
                        backgroundColor: qty > 0 ? (product.color || "var(--accent)") : "var(--bg-tertiary)",
                        color: qty > 0 ? "white" : "var(--text-muted)",
                      }}
                    >
                      {qty}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>

        {/* Footer with save & done button */}
        <div
          className="p-4 safe-area-inset-bottom"
          style={{ borderTop: "1px solid var(--border-light)" }}
        >
          <button
            onClick={async () => {
              if (entries.length > 0) {
                setIsSaving(true);
                try {
                  await onSave();
                } finally {
                  setIsSaving(false);
                }
              }
              onClose();
            }}
            disabled={isSaving}
            className="w-full h-14 rounded-xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-70"
            style={{
              backgroundColor: entries.length > 0 ? "var(--accent)" : "var(--bg-tertiary)",
              color: entries.length > 0 ? "white" : "var(--text-muted)",
            }}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Speichern...
              </span>
            ) : entries.length > 0 ? (
              `💾 Speichern & Fertig (${totalPallets} Paletten)`
            ) : (
              "✓ Fertig"
            )}
          </button>
        </div>
      </div>

      {/* Inline numpad for table view editing */}
      {editingProductId && (
        <TableNumpad
          product={products.find(p => p.id === editingProductId)!}
          value={entryMap.get(editingProductId) || 0}
          onConfirm={(value) => {
            handleQuantityChange(editingProductId, value);
            setEditingProductId(null);
          }}
          onDiscard={() => setEditingProductId(null)}
        />
      )}

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
