// Shared TypeScript types for IDIT

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product variant / type of goods
export interface ProductVariant {
  id: string;
  name: string;
  code: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Point-in-time inventory snapshot
export interface InventorySnapshot {
  id: string;
  takenAt: Date;
  takenById: string;
  notes: string | null;
  createdAt: Date;
  takenBy?: User;
  entries?: InventoryEntry[];
}

// Individual entry within a snapshot
export interface InventoryEntry {
  id: string;
  snapshotId: string;
  locationId: string;
  productId: string;
  quantity: number;
  location?: StorageLocation;
  product?: ProductVariant;
}

// For the inventory input form (before saving)
export interface InventoryInput {
  locationId: string;
  productId: string;
  quantity: number;
}
