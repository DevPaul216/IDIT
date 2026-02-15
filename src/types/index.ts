// Shared TypeScript types for IDIT

export interface User {
  id: string;
  name: string;
  pin?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Simple user for client-side context
export interface SimpleUser {
  id: string;
  name: string;
}

// Storage location on the floor (supports hierarchical structure)
export interface StorageLocation {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: StorageLocation;
  children?: StorageLocation[];
  childCount?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string | null;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Product variant / type of goods
// Category is a string - configure display labels in lib/categories.ts
export interface ProductVariant {
  id: string;
  name: string;
  code: string | null;
  articleNumber: string | null; // Official article/SKU number
  category: string;
  color: string | null;
  resourceWeight: number | null; // Weight in kg
  createdAt: Date;
  updatedAt: Date;
}

// Current inventory state for a location+product combo
export interface CurrentInventory {
  id: string;
  locationId: string;
  productId: string;
  quantity: number;
  lastCheckedAt: Date;
  lastCheckedById: string;
  location?: StorageLocation;
  product?: ProductVariant;
  lastCheckedBy?: SimpleUser;
}

// Audit log entry for inventory changes
export interface InventoryLog {
  id: string;
  locationId: string;
  productId: string;
  previousQty: number | null;
  newQty: number;
  changedById: string;
  changedAt: Date;
  location?: StorageLocation;
  product?: ProductVariant;
  changedBy?: SimpleUser;
}

// For the inventory input form (before saving)
export interface InventoryInput {
  locationId: string;
  productId: string;
  quantity: number;
}
