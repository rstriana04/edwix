import * as React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'success' | 'error' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variants: Record<AlertVariant, string> = {
  success: 'border-green-200 bg-green-50 text-green-700',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-border bg-muted/50 text-foreground',
};

export function Alert({ className, variant = 'info', ...props }: AlertProps) {
  return <div className={cn('rounded-md border p-3 text-sm', variants[variant], className)} {...props} />;
}
