/**
 * CATUI-ARCH + CATUI-SWAP — CatalogContainer RTL tests
 * RED phase: written before implementation.
 * Mocks: use-catalog-filters, useCartStore, next/navigation, organisms.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/features/catalog/application/use-catalog-filters', () => ({
  useCatalogFilters: vi.fn(),
}));

vi.mock('@/app/lib/stores/cart.store', () => ({
  useCartStore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/catalogo',
}));

// Mock all organisms to keep test focused on container wiring
vi.mock('@/features/catalog/ui/organisms/CatalogLayout', () => ({
  CatalogLayout: ({ sidebar, grid }: { sidebar: React.ReactNode; grid: React.ReactNode }) => (
    <div data-testid="catalog-layout">
      <div data-testid="sidebar-slot">{sidebar}</div>
      <div data-testid="grid-slot">{grid}</div>
    </div>
  ),
}));

vi.mock('@/features/catalog/ui/organisms/ProductGrid', () => ({
  ProductGrid: ({
    products,
    onAddToCart,
    emptyState,
  }: {
    products: unknown[];
    onAddToCart: () => void;
    emptyState: React.ReactNode;
  }) => (
    <div data-testid="product-grid">
      {products.length === 0 ? emptyState : <div data-testid="products-count">{products.length} products</div>}
      <button data-testid="add-to-cart-btn" onClick={() => onAddToCart()}>
        Add
      </button>
    </div>
  ),
}));

vi.mock('@/features/catalog/ui/organisms/FilterSidebarPanel', () => ({
  FilterSidebarPanel: () => <div data-testid="filter-sidebar-panel" />,
}));

vi.mock('@/features/catalog/ui/organisms/MobileFilterDrawer', () => ({
  MobileFilterDrawer: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="mobile-filter-drawer">{children}</div> : null),
}));

vi.mock('@/features/catalog/ui/molecules/CatalogControlsBar', () => ({
  CatalogControlsBar: ({ onFilterOpen }: { onFilterOpen: () => void }) => (
    <div data-testid="controls-bar">
      <button data-testid="open-filter-btn" onClick={onFilterOpen}>
        Filters
      </button>
    </div>
  ),
}));

vi.mock('@/features/catalog/ui/molecules/LoadingMoreIndicator', () => ({
  LoadingMoreIndicator: () => <div data-testid="loading-more" />,
}));

vi.mock('@/features/catalog/ui/molecules/AllProductsShown', () => ({
  AllProductsShown: () => <div data-testid="all-products-shown" />,
}));

vi.mock('@/features/catalog/ui/molecules/ActiveFilterChips', () => ({
  ActiveFilterChips: () => <div data-testid="active-filter-chips" />,
}));

vi.mock('@/features/catalog/ui/atoms/PaginationProgress', () => ({
  PaginationProgress: () => <div data-testid="pagination-progress" />,
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { useCatalogFilters } from '@/features/catalog/application/use-catalog-filters';
import { useCartStore } from '@/app/lib/stores/cart.store';
import { CatalogContainer } from './CatalogContainer';
import type { Product } from '@/app/lib/types';
import { emptyFilters } from '@/features/catalog/domain/catalog.types';

const makeProduct = (id: number): Product =>
  ({
    product_id: id,
    name: `Product ${id}`,
    price: 10000,
    image_url: '',
    slug: `product-${id}`,
    stock: 5,
    category: { name: 'Joyeria' },
  } as unknown as Product);

const mockAddItem = vi.fn();
const mockSetFilterOpen = vi.fn();
const mockLoadMore = vi.fn();

const baseHookResult = {
  filters: emptyFilters,
  sortOption: 'newest' as const,
  viewMode: 'grid-3' as const,
  isFilterOpen: false,
  visibleCount: 24,
  isLoadingMore: false,
  visibleProducts: [makeProduct(1), makeProduct(2)],
  totalCount: 2,
  hasMore: false,
  progressPercent: 100,
  activeFilterCount: 0,
  materialOptions: [],
  styleOptions: [],
  collectionOptions: [],
  minPrice: 0,
  maxPrice: 100000,
  onFiltersChange: vi.fn(),
  onSortChange: vi.fn(),
  onViewModeChange: vi.fn(),
  setFilterOpen: mockSetFilterOpen,
  loadMore: mockLoadMore,
};

beforeEach(() => {
  vi.clearAllMocks();

  (useCatalogFilters as ReturnType<typeof vi.fn>).mockReturnValue(baseHookResult);

  (useCartStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (state: { addItem: typeof mockAddItem }) => unknown) =>
      selector({ addItem: mockAddItem })
  );
});

describe('CatalogContainer', () => {
  it('renders the catalog layout', async () => {
    await act(async () => {
      render(<CatalogContainer products={[makeProduct(1)]} collections={[]} />);
    });

    expect(screen.getByTestId('catalog-layout')).toBeInTheDocument();
  });

  it('passes product count from hook to the grid', async () => {
    await act(async () => {
      render(<CatalogContainer products={[makeProduct(1), makeProduct(2)]} collections={[]} />);
    });

    expect(screen.getByTestId('products-count')).toHaveTextContent('2 products');
  });

  it('opens MobileFilterDrawer when setFilterOpen is triggered', async () => {
    (useCatalogFilters as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseHookResult,
      isFilterOpen: false,
    });

    await act(async () => {
      render(<CatalogContainer products={[makeProduct(1)]} collections={[]} />);
    });

    expect(screen.queryByTestId('mobile-filter-drawer')).not.toBeInTheDocument();

    // Re-render with isFilterOpen = true (simulates setFilterOpen callback)
    (useCatalogFilters as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseHookResult,
      isFilterOpen: true,
    });

    const openBtn = screen.getByTestId('open-filter-btn');
    fireEvent.click(openBtn);

    expect(mockSetFilterOpen).toHaveBeenCalledWith(true);
  });

  it('calls addItem when onAddToCart fires from grid', async () => {
    await act(async () => {
      render(<CatalogContainer products={[makeProduct(1)]} collections={[]} />);
    });

    const addBtn = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(addBtn);

    expect(mockAddItem).toHaveBeenCalled();
  });
});
