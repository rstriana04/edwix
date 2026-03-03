import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function Modal({ open, title, onClose, children, footer, widthClassName = 'max-w-2xl' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full ${widthClassName} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
        {footer ? <div className="border-t px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
