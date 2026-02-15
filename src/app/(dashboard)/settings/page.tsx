"use client";

import { useState, useEffect, useMemo } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { StorageLocation, ProductVariant, ProductCategory } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EntityModal, { FieldConfig } from "@/components/ui/EntityModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import FloorPlanEditor from "@/components/features/settings/FloorPlanEditor";

const ADMIN_PASSWORD = "6969";

type Tab = "products" | "locations" | "floorplan";

const CATEGORY_LABELS: Record<ProductCategory, { label: string; icon: string }> = {
  raw: { label: "Rohmaterial", icon: "🧵" },
  finished: { label: "Fertigprodukte", icon: "📦" },
  packaging: { label: "Verpackung", icon: "📋" },
};

// Recursive location row component for hierarchical display
function LocationRowRecursive({
  location,
  depth,
  childrenByParent,
  locations,
  getCapacitySum,
  editingCapacity,
  capacityValue,
  setEditingCapacity,
  setCapacityValue,
  handleSaveCapacity,
  handleDeleteLocation,
  handleOpenLocationModal,
}: {
  location: StorageLocation;
  depth: number;
  childrenByParent: Record<string, StorageLocation[]>;
  locations: StorageLocation[];
  getCapacitySum: (id: string) => number | null;
  editingCapacity: string | null;
  capacityValue: string;
  setEditingCapacity: (id: string | null) => void;
  setCapacityValue: (val: string) => void;
  handleSaveCapacity: (id: string) => Promise<void>;
  handleDeleteLocation: (id: string) => void;
  handleOpenLocationModal: (location: StorageLocation) => void;
}) {
  const children = childrenByParent[location.id] || [];
  const isLeaf = children.length === 0;
  const capacity = getCapacitySum(location.id);
  const paddingLeft = 8 + depth * 1.5;

  return (
    <div key={location.id}>
      {/* Location Row */}
      <div
        className="p-3 flex items-center justify-between gap-2"
        style={{
          borderBottom: "1px solid var(--border-light)",
          backgroundColor: depth === 0 ? (location.color ? `${location.color}15` : undefined) : "var(--bg-secondary)",
          paddingLeft: `${paddingLeft}rem`,
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {location.color && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: location.color }} />}
          <span className={depth === 0 ? "font-semibold" : "font-medium"} style={{ color: "var(--text-primary)" }}>
            {depth > 0 && "↳ "}{location.name}
          </span>
          {!isLeaf && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              • {children.length} Unterbereiche
            </span>
          )}
        </div>

        {/* Capacity Display */}
        <div className="flex items-center gap-2">
          {isLeaf ? (
            // Leaf location: editable capacity
            editingCapacity === location.id ? (
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
                    if (e.key === "Enter") handleSaveCapacity(location.id);
                    if (e.key === "Escape") {
                      setEditingCapacity(null);
                      setCapacityValue("");
                    }
                  }}
                />
                <Button size="sm" onClick={() => handleSaveCapacity(location.id)}>
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCapacity(null);
                    setCapacityValue("");
                  }}
                >
                  ✕
                </Button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingCapacity(location.id);
                  setCapacityValue(location.capacity?.toString() ?? "");
                }}
                className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border-light)",
                }}
                title="Kapazität bearbeiten"
              >
                📦 {location.capacity ?? "∞"}
              </button>
            )
          ) : (
            // Parent location: show sum of children (read-only)
            <button
              disabled
              className="text-xs px-2 py-1 rounded opacity-60 cursor-not-allowed"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-muted)",
                border: "1px dashed var(--border-light)",
              }}
              title="Summe der Unterbereiche"
            >
              📦 {capacity ?? "∞"}
            </button>
          )}
          <Button variant="danger" size="sm" onClick={() => handleDeleteLocation(location.id)}>
            ✕
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleOpenLocationModal(location)}>
            ✎
          </Button>
        </div>
      </div>

      {/* Render children recursively */}
      {children.map((child) => (
        <LocationRowRecursive
          key={child.id}
          location={child}
          depth={depth + 1}
          childrenByParent={childrenByParent}
          locations={locations}
          getCapacitySum={getCapacitySum}
          editingCapacity={editingCapacity}
          capacityValue={capacityValue}
          setEditingCapacity={setEditingCapacity}
          setCapacityValue={setCapacityValue}
          handleSaveCapacity={handleSaveCapacity}
          handleDeleteLocation={handleDeleteLocation}
          handleOpenLocationModal={handleOpenLocationModal}
        />
      ))}
    </div>
  );
}

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

  // Entity modal state
  const [editingEntity, setEditingEntity] = useState<{ type: "product" | "location"; data: ProductVariant | StorageLocation } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDangerous: false,
  });

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

  const { parentLocations, childrenByParent, allNonLeafLocations } = useMemo(() => {
    const parents = locations.filter((l) => !l.parentId);
    const children: Record<string, StorageLocation[]> = {};
    locations.forEach((loc) => {
      if (loc.parentId) {
        if (!children[loc.parentId]) children[loc.parentId] = [];
        children[loc.parentId].push(loc);
      }
    });
    // Non-leaf locations are those that have children
    const nonLeaf = locations.filter((l) => children[l.id]?.length > 0);
    return { parentLocations: parents, childrenByParent: children, allNonLeafLocations: nonLeaf };
  }, [locations]);

  // Calculate total capacity of a location (sum of all leaf children)
  const getCapacitySum = (locationId: string): number | null => {
    const directChildren = childrenByParent[locationId];
    if (!directChildren || directChildren.length === 0) {
      // Leaf node - return its own capacity
      const loc = locations.find((l) => l.id === locationId);
      return loc?.capacity ?? null;
    }
    // Parent node - sum all children recursively
    let sum = 0;
    let hasAny = false;
    const visited = new Set<string>();
    
    const sumRecursive = (id: string): { sum: number; hasCapacity: boolean } => {
      if (visited.has(id)) return { sum: 0, hasCapacity: false };
      visited.add(id);
      
      const children = childrenByParent[id];
      if (!children || children.length === 0) {
        // Leaf node
        const loc = locations.find((l) => l.id === id);
        if (loc?.capacity !== null) {
          return { sum: loc?.capacity ?? 0, hasCapacity: true };
        }
        return { sum: 0, hasCapacity: false };
      }
      
      let total = 0;
      let foundAny = false;
      for (const child of children) {
        const result = sumRecursive(child.id);
        total += result.sum;
        if (result.hasCapacity) foundAny = true;
      }
      return { sum: total, hasCapacity: foundAny };
    };
    
    const result = sumRecursive(locationId);
    return result.hasCapacity ? result.sum : null;
  };

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
    const name = newLocation.name.trim();
    if (!name) {
      alert("Bitte geben Sie einen Namen ein.");
      return;
    }
    setIsAddingLocation(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          parentId: newLocation.parentId || null,
        }),
      });
      if (response.ok) {
        const location = await response.json();
        setLocations((prev) => [...prev, location]);
        setNewLocation({ name: "", parentId: "", x: 0, y: 0 });
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error || "Konnte Lagerplatz nicht hinzufügen"}`);
      }
    } catch (err) {
      console.error("Failed to add location:", err);
      alert("Fehler beim Hinzufügen des Lagerplatzes");
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
    setConfirmDialog({
      isOpen: true,
      title: "Zone löschen",
      message: `Möchten Sie die Zone "${loc?.name}" wirklich löschen?`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/locations/${id}`, { method: "DELETE" });
          if (response.ok) {
            setLocations((prev) => prev.filter((l) => l.id !== id));
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Failed to delete location:", err);
        }
      },
    });
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
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error || "Kapazität konnte nicht gespeichert werden"}`);
      }
    } catch (err) {
      console.error("Failed to update capacity:", err);
      alert("Fehler beim Speichern der Kapazität");
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

  const handleCreateLocation = async (location: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">) => {
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

  // Entity modal handlers
  const handleOpenProductModal = (product: ProductVariant | null) => {
    if (product) {
      setEditingEntity({ type: "product", data: product });
    }
    setIsModalOpen(true);
  };

  const handleOpenLocationModal = (location: StorageLocation | null) => {
    if (location) {
      setEditingEntity({ type: "location", data: location });
    }
    setIsModalOpen(true);
  };

  const handleSaveEntity = async (data: Record<string, unknown>) => {
    if (!editingEntity) return;

    const { type, data: original } = editingEntity;

    try {
      // Only send fields that are different from original to avoid triggering unnecessary validations
      const updateData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== original[key as keyof typeof original]) {
          updateData[key] = value;
        }
      });

      const response = await fetch(`/api/${type === "product" ? "products" : "locations"}/${original.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Fehler beim Speichern");
      }

      const updated = await response.json();

      if (type === "product") {
        setProducts((prev) => prev.map((p) => (p.id === original.id ? updated : p)));
      } else {
        setLocations((prev) => prev.map((l) => (l.id === original.id ? updated : l)));
      }

      setEditingEntity(null);
      setIsModalOpen(false);
    } catch (err) {
      throw err;
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
    setConfirmDialog({
      isOpen: true,
      title: "Produkt löschen",
      message: `Möchten Sie das Produkt "${prod?.name}" wirklich löschen?`,
      isDangerous: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
          if (response.ok) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error("Failed to delete product:", err);
        }
      },
    });
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
          📍 Zonen ({locations.length})
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
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenProductModal(product)}>
                                ✎
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteProduct(product.id)}>✕</Button>
                            </div>
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
                  placeholder="Zone (z.B. Wachsraum)"
                />
              </div>
              <div className="w-40">
                <select
                  value={newLocation.parentId}
                  onChange={(e) => setNewLocation((p) => ({ ...p, parentId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg text-sm"
                  style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  <option value="">Hauptzone</option>
                  {allNonLeafLocations?.map((loc) => {
                    const depth = (() => {
                      let d = 0, p = loc.parentId;
                      const visited = new Set<string>();
                      while (p && !visited.has(p)) {
                        visited.add(p);
                        const parent = locations.find(l => l.id === p);
                        if (!parent) break;
                        d++;
                        p = parent.parentId;
                      }
                      return d;
                    })();
                    return (
                      <option key={loc.id} value={loc.id}>{"↳".repeat(depth + 1)} {loc.name}</option>
                    );
                  })}
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
                Noch keine Zonen definiert
              </div>
            ) : (
              <div>
                {parentLocations.map((parent) => (
                  <LocationRowRecursive
                    key={parent.id}
                    location={parent}
                    depth={0}
                    childrenByParent={childrenByParent}
                    locations={locations}
                    getCapacitySum={getCapacitySum}
                    editingCapacity={editingCapacity}
                    capacityValue={capacityValue}
                    setEditingCapacity={setEditingCapacity}
                    setCapacityValue={setCapacityValue}
                    handleSaveCapacity={handleSaveCapacity}
                    handleDeleteLocation={handleDeleteLocation}
                    handleOpenLocationModal={handleOpenLocationModal}
                  />
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

      {/* Entity Editor Modal */}
      {editingEntity && editingEntity.type === "product" && (
        <EntityModal
          isOpen={isModalOpen}
          title="Produkt bearbeiten"
          fields={[
            { name: "name", label: "Produktname", type: "text", required: true },
            { name: "code", label: "Kürzel", type: "text", placeholder: "z.B. FM3" },
            { name: "articleNumber", label: "Artikelnummer (SKU)", type: "text", placeholder: "Offizielle Nummer" },
            { name: "resourceWeight", label: "Gewicht (kg)", type: "number", placeholder: "z.B. 3.5" },
            {
              name: "category",
              label: "Kategorie",
              type: "select",
              options: Object.entries(CATEGORY_LABELS).map(([key, val]) => ({
                value: key,
                label: `${val.icon} ${val.label}`,
              })),
            },
            { name: "color", label: "Farbe", type: "color" },
          ]}
          initialData={editingEntity.data as unknown as Record<string, unknown>}
          onSave={handleSaveEntity}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {editingEntity && editingEntity.type === "location" && (
        <EntityModal
          isOpen={isModalOpen}
          title="Zone bearbeiten"
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "description", label: "Beschreibung", type: "text", placeholder: "Optional" },
            {
              name: "parentId",
              label: "Übergeordnete Zone",
              type: "select",
              options: [
                { value: "", label: "Hauptbereich" },
                ...allNonLeafLocations
                  .filter((l) => l.id !== editingEntity.data.id) // Prevent circular reference
                  .map((l) => {
                    const depth = (() => {
                      let d = 0,
                        p = l.parentId;
                      const visited = new Set<string>();
                      while (p && !visited.has(p)) {
                        visited.add(p);
                        const parent = locations.find((loc) => loc.id === p);
                        if (!parent) break;
                        d++;
                        p = parent.parentId;
                      }
                      return d;
                    })();
                    return {
                      value: l.id,
                      label: `${"↳".repeat(depth + 1)} ${l.name}`,
                    };
                  }),
              ],
            },
            { name: "color", label: "Farbe", type: "color" },
            { name: "x", label: "X-Position", type: "number" },
            { name: "y", label: "Y-Position", type: "number" },
            { name: "width", label: "Breite", type: "number" },
            { name: "height", label: "Höhe", type: "number" },
          ]}
          initialData={editingEntity.data as unknown as Record<string, unknown>}
          onSave={handleSaveEntity}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        isDangerous={confirmDialog.isDangerous}
        onConfirm={() => {
          confirmDialog.onConfirm();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageWrapper>
  );
}
