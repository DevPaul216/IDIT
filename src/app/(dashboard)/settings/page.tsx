"use client";

import { useState, useEffect, useMemo } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { StorageLocation, ProductVariant, ProductCategory } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FloorPlanEditor from "@/components/features/settings/FloorPlanEditor";

const ADMIN_PASSWORD = "6969";

type Tab = "products" | "locations" | "floorplan";

const CATEGORY_LABELS: Record<ProductCategory, { label: string; icon: string }> = {
  raw: { label: "Rohmaterial", icon: "🧵" },
  finished: { label: "Fertigprodukte", icon: "📦" },
  packaging: { label: "Verpackung", icon: "📋" },
};

export default function SettingsPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("products");

  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New location form
  const [newLocation, setNewLocation] = useState({ name: "", parentId: "", x: 0, y: 0 });
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({ name: "", code: "", color: "", category: "finished" as ProductCategory });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Capacity editing
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [capacityValue, setCapacityValue] = useState("");

  useEffect(() => {
    const unlocked = sessionStorage.getItem("settings_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchData();
    }
  }, [isUnlocked]);

  const fetchData = async () => {
    try {
      const [locRes, prodRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/products"),
      ]);
      if (locRes.ok && prodRes.ok) {
        setLocations(await locRes.json());
        setProducts(await prodRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const { parentLocations, childrenByParent } = useMemo(() => {
    const parents = locations.filter((l) => !l.parentId);
    const children: Record<string, StorageLocation[]> = {};
    locations.forEach((loc) => {
      if (loc.parentId) {
        if (!children[loc.parentId]) children[loc.parentId] = [];
        children[loc.parentId].push(loc);
      }
    });
    return { parentLocations: parents, childrenByParent: children };
  }, [locations]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem("settings_unlocked", "true");
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput("");
    }
  };

  // Location handlers
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name.trim()) return;
    setIsAddingLocation(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLocation.name,
          parentId: newLocation.parentId || null,
          x: newLocation.x,
          y: newLocation.y,
        }),
      });
      if (response.ok) {
        const location = await response.json();
        setLocations((prev) => [...prev, location]);
        setNewLocation({ name: "", parentId: "", x: 0, y: 0 });
      }
    } catch (err) {
      console.error("Failed to add location:", err);
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    const loc = locations.find((l) => l.id === id);
    const hasChildren = childrenByParent[id]?.length > 0;
    if (hasChildren) {
      alert("Dieser Lagerplatz hat Unterbereiche. Bitte zuerst die Unterbereiche löschen.");
      return;
    }
    if (!confirm(`"${loc?.name}" löschen?`)) return;
    try {
      const response = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete location:", err);
    }
  };

  const handleSaveCapacity = async (id: string) => {
    const capacity = capacityValue === "" ? null : parseInt(capacityValue);
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacity }),
      });
      if (response.ok) {
        setLocations((prev) => prev.map((loc) => (loc.id === id ? { ...loc, capacity } : loc)));
        setEditingCapacity(null);
        setCapacityValue("");
      }
    } catch (err) {
      console.error("Failed to update capacity:", err);
    }
  };

  const handleSaveFloorPlan = async (changes: { id: string; bounds: { x: number; y: number; width: number; height: number } }[]) => {
    try {
      await Promise.all(
        changes.map(({ id, bounds }) =>
          fetch(`/api/locations/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bounds),
          })
        )
      );
      // Refresh all locations from DB
      const res = await fetch("/api/locations");
      if (res.ok) setLocations(await res.json());
    } catch (err) {
      console.error("Failed to save floor plan:", err);
    }
  };

  const handleCreateLocation = async (location: Omit<StorageLocation, "id" | "createdAt" | "updatedAt" | "isActive">) => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(location),
      });
      if (response.ok) {
        const newLocation = await response.json();
        setLocations((prev) => [...prev, newLocation]);
      }
    } catch (err) {
      console.error("Failed to create location:", err);
    }
  };

  // Product handlers
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    setIsAddingProduct(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          code: newProduct.code || null,
          category: newProduct.category,
          color: newProduct.color || null,
        }),
      });
      if (response.ok) {
        const product = await response.json();
        setProducts((prev) => [...prev, product]);
        setNewProduct({ name: "", code: "", color: "", category: "finished" });
      }
    } catch (err) {
      console.error("Failed to add product:", err);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!confirm(`"${prod?.name}" löschen?`)) return;
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // Password lock screen
  if (!isUnlocked) {
    return (
      <PageWrapper title="Lagerkonfiguration" description="Geschützter Bereich">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
          >
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔒</div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin-Bereich</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Passwort erforderlich</p>
            </div>
            <form onSubmit={handleUnlock}>
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                placeholder="Passwort eingeben"
                className="text-center text-lg tracking-widest"
                autoFocus
              />
              {passwordError && (
                <p className="text-sm mt-2 text-center" style={{ color: "#ef4444" }}>Falsches Passwort</p>
              )}
              <Button type="submit" className="w-full mt-4" disabled={!passwordInput}>Entsperren</Button>
            </form>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper title="Lagerkonfiguration" description="Lagerplätze und Produkte konfigurieren">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Lagerkonfiguration" description="Lagerplätze und Produktvarianten konfigurieren">
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("products")}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: activeTab === "products" ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: activeTab === "products" ? "white" : "var(--text-muted)",
          }}
        >
          🏷️ Produktvarianten ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("locations")}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: activeTab === "locations" ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: activeTab === "locations" ? "white" : "var(--text-muted)",
          }}
        >
          📍 Lagerbereiche ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab("floorplan")}
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: activeTab === "floorplan" ? "var(--accent-primary)" : "var(--bg-secondary)",
            color: activeTab === "floorplan" ? "white" : "var(--text-muted)",
          }}
        >
          🗺️ Grundriss bearbeiten
        </button>
      </div>

      {/* Product Variants Tab */}
      {activeTab === "products" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          {/* Add Product Form */}
          <form
            onSubmit={handleAddProduct}
            className="p-4"
            style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[150px]">
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Produktname"
                />
              </div>
              <div className="w-24">
                <Input
                  value={newProduct.code}
                  onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))}
                  placeholder="Kürzel"
                />
              </div>
              <div className="w-36">
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value as ProductCategory }))}
                  className="w-full h-10 px-3 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat].icon} {CATEGORY_LABELS[cat].label}</option>
                  ))}
                </select>
              </div>
              <div className="w-16">
                <Input
                  type="color"
                  value={newProduct.color || "#3b82f6"}
                  onChange={(e) => setNewProduct((p) => ({ ...p, color: e.target.value }))}
                  className="h-10 p-1"
                />
              </div>
              <Button type="submit" disabled={isAddingProduct || !newProduct.name.trim()}>
                {isAddingProduct ? "..." : "+"}
              </Button>
            </div>
          </form>

          {/* Product List - Grouped by Category */}
          <div className="max-h-[60vh] overflow-y-auto">
            {products.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                Noch keine Produkte definiert
              </div>
            ) : (
              <div>
                {(["raw", "finished", "packaging"] as ProductCategory[]).map((category) => {
                  const categoryProducts = products.filter((p) => p.category === category);
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <div
                        className="px-4 py-2 text-sm font-medium sticky top-0"
                        style={{ backgroundColor: "var(--bg-secondary)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}
                      >
                        {CATEGORY_LABELS[category].icon} {CATEGORY_LABELS[category].label} ({categoryProducts.length})
                      </div>
                      <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                        {categoryProducts.map((product) => (
                          <div key={product.id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {product.color && (
                                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: product.color }} />
                              )}
                              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{product.name}</span>
                              {product.code && (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)" }}>
                                  {product.code}
                                </span>
                              )}
                            </div>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)}>✕</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storage Locations Tab */}
      {activeTab === "locations" && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          {/* Add Location Form */}
          <form
            onSubmit={handleAddLocation}
            className="p-4"
            style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[150px]">
                <Input
                  value={newLocation.name}
                  onChange={(e) => setNewLocation((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name (z.B. Wachsraum)"
                />
              </div>
              <div className="w-40">
                <select
                  value={newLocation.parentId}
                  onChange={(e) => setNewLocation((p) => ({ ...p, parentId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  <option value="">Hauptbereich</option>
                  {parentLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>↳ {loc.name}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={isAddingLocation || !newLocation.name.trim()}>
                {isAddingLocation ? "..." : "+ Hinzufügen"}
              </Button>
            </div>
          </form>

          {/* Location List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {parentLocations.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                Noch keine Lagerbereiche definiert
              </div>
            ) : (
              <div>
                {parentLocations.map((parent) => (
                  <div key={parent.id}>
                    {/* Parent Location */}
                    <div
                      className="p-3 flex items-center justify-between"
                      style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: parent.color ? `${parent.color}15` : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        {parent.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: parent.color }} />}
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{parent.name}</span>
                        {childrenByParent[parent.id]?.length > 0 && (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            • {childrenByParent[parent.id].length} Unterbereiche
                          </span>
                        )}
                      </div>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteLocation(parent.id)}>✕</Button>
                    </div>

                    {/* Children */}
                    {childrenByParent[parent.id]?.map((child) => (
                      <div
                        key={child.id}
                        className="p-3 pl-8 flex items-center justify-between gap-2"
                        style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-secondary)" }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span style={{ color: "var(--text-muted)" }}>↳</span>
                          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{child.name}</span>
                        </div>

                        {/* Capacity */}
                        <div className="flex items-center gap-2">
                          {editingCapacity === child.id ? (
                            <>
                              <Input
                                type="number"
                                value={capacityValue}
                                onChange={(e) => setCapacityValue(e.target.value)}
                                placeholder="∞"
                                className="w-20 text-center"
                                min={0}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveCapacity(child.id);
                                  if (e.key === "Escape") { setEditingCapacity(null); setCapacityValue(""); }
                                }}
                              />
                              <Button size="sm" onClick={() => handleSaveCapacity(child.id)}>✓</Button>
                              <Button variant="ghost" size="sm" onClick={() => { setEditingCapacity(null); setCapacityValue(""); }}>✕</Button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setEditingCapacity(child.id); setCapacityValue(child.capacity?.toString() ?? ""); }}
                              className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-muted)", border: "1px dashed var(--border-light)" }}
                              title="Kapazität bearbeiten"
                            >
                              📦 {child.capacity ?? "∞"}
                            </button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => handleDeleteLocation(child.id)}>✕</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floor Plan Editor Tab */}
      {activeTab === "floorplan" && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <FloorPlanEditor
            locations={locations}
            onSave={handleSaveFloorPlan}
            onCreate={handleCreateLocation}
          />
        </div>
      )}
    </PageWrapper>
  );
}
