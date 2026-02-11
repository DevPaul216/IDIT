"use client";

import { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { StorageLocation, ProductVariant } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New location form
  const [newLocation, setNewLocation] = useState({ name: "", x: 0, y: 0 });
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({ name: "", code: "", color: "" });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name.trim()) return;

    setIsAddingLocation(true);
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLocation),
      });

      if (response.ok) {
        const location = await response.json();
        setLocations((prev) => [...prev, location]);
        setNewLocation({ name: "", x: 0, y: 0 });
      }
    } catch (err) {
      console.error("Failed to add location:", err);
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Diesen Lagerplatz löschen?")) return;

    try {
      const response = await fetch(`/api/locations/${id}`, { method: "DELETE" });
      if (response.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete location:", err);
    }
  };

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
          color: newProduct.color || null,
        }),
      });

      if (response.ok) {
        const product = await response.json();
        setProducts((prev) => [...prev, product]);
        setNewProduct({ name: "", code: "", color: "" });
      }
    } catch (err) {
      console.error("Failed to add product:", err);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Dieses Produkt löschen?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  if (isLoading) {
    return (
      <PageWrapper title="Lagerkonfiguration" description="Lagerplätze und Produkte konfigurieren">
        <div className="animate-pulse space-y-4">
          <div className="h-48 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }} />
          <div className="h-48 rounded-lg" style={{ backgroundColor: "var(--bg-tertiary)" }} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Lagerkonfiguration"
      description="Lagerplätze und Produktvarianten konfigurieren"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Locations */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Lagerplätze
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Definieren Sie Bereiche auf dem Grundriss, wo Paletten gelagert werden
            </p>
          </div>

          {/* Add Location Form */}
          <form
            onSubmit={handleAddLocation}
            className="p-4"
            style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[120px]">
                <Input
                  value={newLocation.name}
                  onChange={(e) => setNewLocation((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Name (z.B. A1)"
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={newLocation.x}
                  onChange={(e) => setNewLocation((p) => ({ ...p, x: parseInt(e.target.value) || 0 }))}
                  placeholder="X"
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={newLocation.y}
                  onChange={(e) => setNewLocation((p) => ({ ...p, y: parseInt(e.target.value) || 0 }))}
                  placeholder="Y"
                />
              </div>
              <Button type="submit" disabled={isAddingLocation || !newLocation.name.trim()}>
                {isAddingLocation ? "..." : "Hinzufügen"}
              </Button>
            </div>
          </form>

          {/* Location List */}
          <div className="max-h-64 overflow-y-auto">
            {locations.length === 0 ? (
              <div className="p-4 text-center" style={{ color: "var(--text-muted)" }}>
                Noch keine Lagerplätze
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {location.name}
                      </span>
                      <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
                        ({location.x}, {location.y})
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      Löschen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Variants */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>
              Produktvarianten
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Definieren Sie die Arten von Gütern/Paletten, die Sie erfassen
            </p>
          </div>

          {/* Add Product Form */}
          <form
            onSubmit={handleAddProduct}
            className="p-4"
            style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-tertiary)" }}
          >
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[120px]">
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
              <div className="w-24">
                <Input
                  type="color"
                  value={newProduct.color || "#3b82f6"}
                  onChange={(e) => setNewProduct((p) => ({ ...p, color: e.target.value }))}
                  className="h-10 p-1"
                />
              </div>
              <Button type="submit" disabled={isAddingProduct || !newProduct.name.trim()}>
                {isAddingProduct ? "..." : "Hinzufügen"}
              </Button>
            </div>
          </form>

          {/* Product List */}
          <div className="max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <div className="p-4 text-center" style={{ color: "var(--text-muted)" }}>
                Noch keine Produkte
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-light)" }}>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {product.color && (
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: product.color }}
                        />
                      )}
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {product.name}
                      </span>
                      {product.code && (
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                          ({product.code})
                        </span>
                      )}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Löschen
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
