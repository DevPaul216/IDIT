// Central category configuration
// Add new categories here - they'll automatically appear in all UI components

export interface CategoryConfig {
  key: string;
  label: string;
  icon: string;
}

// Default category configs - used for display when a category is known
// If a product has a category not in this list, it will still show with a default icon
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  raw: { key: "raw", label: "Rohmaterial", icon: "🧵" },
  intermediate: { key: "intermediate", label: "Zwischenprodukte", icon: "⚙️" },
  finished: { key: "finished", label: "Fertigprodukte", icon: "📦" },
  packaging: { key: "packaging", label: "Verpackung", icon: "🏷️" },
  other: { key: "other", label: "Sonstiges", icon: "📋" },
};

// Order in which categories should appear in the UI
export const CATEGORY_ORDER = ["raw", "intermediate", "finished", "packaging", "other"];

// Get category display info (with fallback for unknown categories)
export function getCategoryInfo(category: string): CategoryConfig {
  return CATEGORY_CONFIG[category] || {
    key: category,
    label: category.charAt(0).toUpperCase() + category.slice(1),
    icon: "📁",
  };
}

// Get all known categories as an array (in order)
export function getOrderedCategories(): CategoryConfig[] {
  return CATEGORY_ORDER.map((key) => CATEGORY_CONFIG[key]).filter(Boolean);
}

// Extract unique categories from products (preserves order, adds unknown ones at end)
export function getCategoriesFromProducts(products: { category: string }[]): CategoryConfig[] {
  const seen = new Set<string>();
  const result: CategoryConfig[] = [];
  
  // First add known categories in order (if they have products)
  for (const key of CATEGORY_ORDER) {
    if (products.some((p) => p.category === key) && !seen.has(key)) {
      seen.add(key);
      result.push(getCategoryInfo(key));
    }
  }
  
  // Then add any unknown categories
  for (const product of products) {
    if (!seen.has(product.category)) {
      seen.add(product.category);
      result.push(getCategoryInfo(product.category));
    }
  }
  
  return result;
}
