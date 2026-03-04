import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CustomersPage } from '@/pages/customers/CustomersPage';
import { CustomerDetailsPage } from '@/pages/customers/CustomerDetailsPage';
import { DevicesPage } from '@/pages/devices/DevicesPage';
import { DeviceDetailsPage } from '@/pages/devices/DeviceDetailsPage';
import { TicketsPage } from '@/pages/tickets/TicketsPage';
import { TicketDetailsPage } from '@/pages/tickets/TicketDetailsPage';
import { InventoryPage } from '@/pages/inventory/InventoryPage';
import { PartDetailsPage } from '@/pages/inventory/PartDetailsPage';
import { SuppliersPage } from '@/pages/suppliers/SuppliersPage';
import { SupplierDetailsPage } from '@/pages/suppliers/SupplierDetailsPage';
import { QuotesPage } from '@/pages/quotes/QuotesPage';
import { QuoteDetailsPage } from '@/pages/quotes/QuoteDetailsPage';
import { InvoicesPage } from '@/pages/invoices/InvoicesPage';
import { InvoiceDetailsPage } from '@/pages/invoices/InvoiceDetailsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AssetsPage } from '@/pages/assets/AssetsPage';
import { AssetDetailsPage } from '@/pages/assets/AssetDetailsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = localStorage.getItem('accessToken');
  if (!isAuthenticated && !token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = localStorage.getItem('accessToken');
  if (isAuthenticated || token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'customers/:id', element: <CustomerDetailsPage /> },
      { path: 'devices', element: <DevicesPage /> },
      { path: 'devices/:id', element: <DeviceDetailsPage /> },
      { path: 'tickets', element: <TicketsPage /> },
      { path: 'tickets/:id', element: <TicketDetailsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/:id', element: <PartDetailsPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'suppliers/:id', element: <SupplierDetailsPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'quotes/:id', element: <QuoteDetailsPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
      { path: 'invoices/:id', element: <InvoiceDetailsPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/:id', element: <AssetDetailsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
