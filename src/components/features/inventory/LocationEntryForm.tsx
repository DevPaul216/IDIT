"use client";

import { StorageLocation, ProductVariant, InventoryInput } from "@/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface LocationEntryFormProps {
  location: StorageLocation;
  products: ProductVariant[];
  entries: InventoryInput[];
  onUpdate: (locationId: string, entries: InventoryInput[]) => void;
  onClose: () => void;
}

export default function LocationEntryForm({
  location,
  products,
  entries,
  onUpdate,
  onClose,
}: LocationEntryFormProps) {
  // Create a map for quick lookup
  const entryMap = new Map(
    entries.map((e) => [e.productId, e.quantity])
  );

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = parseInt(value) || 0;
    const newEntries = products
      .map((product) => ({
        locationId: location.id,
        productId: product.id,
        quantity:
          product.id === productId
            ? quantity
            : entryMap.get(product.id) || 0,
      }))
      .filter((e) => e.quantity > 0);

    onUpdate(location.id, newEntries);
  };

  const totalPallets = entries.reduce((sum, e) => sum + e.quantity, 0);

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="font-semibold text-lg"
            style={{ color: "var(--text-primary)" }}
          >
            {location.name}
          </h3>
          {location.description && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {location.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Gesamt: {totalPallets} Paletten
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fertig
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.map((product) => (
          <div key={product.id} className="flex flex-col gap-1">
            <label
              className="text-sm font-medium flex items-center gap-2"
              style={{ color: "var(--text-secondary)" }}
            >
              {product.color && (
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: product.color }}
                />
              )}
              {product.code || product.name}
            </label>
            <Input
              type="number"
              min="0"
              value={entryMap.get(product.id) || ""}
              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
              placeholder="0"
              className="text-center"
            />
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Keine Produkte konfiguriert. Bitte zuerst Produkte in der Lagerkonfiguration hinzufügen.
        </p>
      )}
    </div>
  );
}
