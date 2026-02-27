import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
  // Placeholder KPI cards — will be wired to real data in Phase 3
  const kpis = [
    { label: 'Open Tickets', value: '—', icon: Wrench, color: 'text-blue-500' },
    { label: 'Overdue', value: '—', icon: AlertTriangle, color: 'text-red-500' },
    { label: 'Ready for Pickup', value: '—', icon: CheckCircle, color: 'text-green-500' },
    { label: 'Avg Repair Time', value: '—', icon: Clock, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
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
