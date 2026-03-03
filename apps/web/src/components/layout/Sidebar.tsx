import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  Truck,
  FileText,
  Receipt,
  HardDrive,
  BarChart3,
  Settings,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Panel', icon: LayoutDashboard },
  { to: '/customers', label: 'Clientes', icon: Users },
  { to: '/devices', label: 'Dispositivos', icon: Smartphone },
  { to: '/tickets', label: 'Tickets', icon: Wrench },
  { to: '/inventory', label: 'Inventario', icon: Package },
  { to: '/suppliers', label: 'Proveedores', icon: Truck },
  { to: '/quotes', label: 'Cotizaciones', icon: FileText },
  { to: '/invoices', label: 'Facturas', icon: Receipt },
  { to: '/assets', label: 'Activos', icon: HardDrive },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">Edwix</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
              end={item.to === '/'}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
