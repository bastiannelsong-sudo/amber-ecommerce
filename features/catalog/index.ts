/**
 * Public barrel for the catalog feature.
 * Re-exports domain types and constants consumed by cross-feature callers.
 */

export type {
  CatalogProduct,
  CatalogFilter,
  ActiveFilters,
  SortOption,
  SearchSuggestions,
} from './domain/catalog.types';

export { emptyFilters } from './domain/catalog.types';

export {
  filterProducts,
  sortProducts,
  formatPrice,
  calcDiscount,
  isInStock,
} from './domain/catalog.rules';
