import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/src/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to load data',
  message = 'An unexpected error occurred while communicating with CloudBox servers.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/40 px-6 py-12 text-center"
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry} className="mt-5">
          <RotateCcw className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
