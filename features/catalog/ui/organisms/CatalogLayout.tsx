'use client';

/**
 * CATUI-ORG-1 — CatalogLayout organism.
 * Desktop two-column layout: FilterSidebarPanel slot (left) + main slot (right).
 * Pure slot-based props, zero logic.
 */

import { ReactNode } from 'react';

interface CatalogLayoutProps {
  sidebar: ReactNode;
  grid: ReactNode;
}

export function CatalogLayout({ sidebar, grid }: CatalogLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Sidebar — desktop only, sticky */}
      <div className="hidden lg:block lg:sticky lg:top-24 self-start">
        {sidebar}
      </div>

      {/* Main content: controls bar + product grid */}
      <div className="flex-1 min-w-0">
        {grid}
      </div>
    </div>
  );
}
