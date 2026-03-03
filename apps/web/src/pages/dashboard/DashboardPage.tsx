import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { useDashboardIndicators } from '@/api/dashboard';

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardIndicators();
  const averageRepairValue = data ? `${Number(data.averageRepairHours).toLocaleString('es-CO')} h` : '—';
  const kpis = [
    {
      label: 'Tickets abiertos',
      value: isLoading ? '...' : String(data?.openTickets ?? '—'),
      icon: Wrench,
      color: 'text-blue-500',
    },
    {
      label: 'Vencidos',
      value: isLoading ? '...' : String(data?.overdueTickets ?? '—'),
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      label: 'Listos para entrega',
      value: isLoading ? '...' : String(data?.readyForDeliveryTickets ?? '—'),
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'Tiempo promedio reparación',
      value: isLoading ? '...' : averageRepairValue,
      icon: Clock,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Panel</h2>
      {isError ? <Alert variant="error">{error instanceof Error ? error.message : 'No fue posible cargar indicadores.'}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
