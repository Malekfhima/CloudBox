import { ChevronRight, Home } from 'lucide-react';
import type { BreadcrumbNode } from '@/src/types';

interface BreadcrumbsProps {
  items: BreadcrumbNode[];
  onNavigate: (folderId: string | null) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-x-auto text-sm">
      {items.map((node, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={node.id ?? 'root'} className="flex items-center gap-1 shrink-0">
            {index > 0 ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
            <button
              type="button"
              onClick={() => onNavigate(node.id)}
              disabled={isLast}
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap transition-colors ${
                isLast
                  ? 'font-semibold text-slate-900 cursor-default'
                  : 'font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {index === 0 ? <Home className="h-3.5 w-3.5" /> : null}
              <span>{node.name}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
