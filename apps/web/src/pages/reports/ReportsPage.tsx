import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLoading } from '@/components/shared/page-states';
import {
  useReportSummary,
  useRevenueReport,
  useTicketStatsReport,
  useTechnicianReport,
  useInventoryReport,
  useTopCustomersReport,
  usePartsUsageReport,
} from '@/api/reports';

function formatCOP(value: number) {
  return Number(value).toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
}

function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  return { from, to };
}

export function ReportsPage() {
  const defaults = getDefaultDateRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('month');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    revenue: true,
    tickets: true,
    technicians: true,
    inventory: true,
    customers: true,
    parts: true,
  });

  const { data: summary, isLoading: summaryLoading } = useReportSummary();
  const { data: revenue, isLoading: revenueLoading } = useRevenueReport(from, to, groupBy);
  const { data: ticketStats, isLoading: ticketsLoading } = useTicketStatsReport(from, to);
  const { data: techReport, isLoading: techLoading } = useTechnicianReport(from, to);
  const { data: inventoryReport, isLoading: invLoading } = useInventoryReport(lowStockOnly);
  const { data: topCustomers, isLoading: custLoading } = useTopCustomersReport(from, to, 10);
  const { data: partsUsage, isLoading: partsLoading } = usePartsUsageReport(from, to, 10);

  function toggleSection(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reportes</h2>

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium">Desde:</label>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto" />
        <label className="text-sm font-medium">Hasta:</label>
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto" />
      </div>

      {/* Summary KPIs */}
      {summaryLoading ? (
        <PageLoading title="Resumen" />
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ingresos del mes</p>
              <p className="text-2xl font-bold">{formatCOP(summary.monthlyRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tickets abiertos</p>
              <p className="text-2xl font-bold">{summary.openTickets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Repuestos bajo stock</p>
              <p className="text-2xl font-bold">{summary.lowStockCount}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Revenue Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('revenue')}>
          <CardTitle className="text-lg">Ingresos {expanded.revenue ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.revenue && (
          <CardContent>
            <div className="mb-3 flex gap-2">
              {(['day', 'week', 'month'] as const).map((g) => (
                <Button key={g} type="button" variant={groupBy === g ? 'default' : 'outline'} size="sm" onClick={() => setGroupBy(g)}>
                  {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                </Button>
              ))}
            </div>
            {revenueLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : revenue ? (
              <>
                <div className="mb-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p><span className="font-medium">Total ingresos:</span> {formatCOP(revenue.summary.totalRevenue)}</p>
                  <p><span className="font-medium">Total pagos:</span> {revenue.summary.totalPayments}</p>
                  <p><span className="font-medium">Promedio/pago:</span> {formatCOP(revenue.summary.averagePayment)}</p>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Periodo</th>
                        <th className="px-4 py-2 text-right font-medium">Total</th>
                        <th className="px-4 py-2 text-right font-medium">Pagos</th>
                        <th className="px-4 py-2 text-right font-medium">Efectivo</th>
                        <th className="px-4 py-2 text-right font-medium">Tarjeta</th>
                        <th className="px-4 py-2 text-right font-medium">Transferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.periods.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">Sin datos para el periodo seleccionado.</td></tr>
                      ) : (
                        revenue.periods.map((p) => (
                          <tr key={p.period} className="border-t">
                            <td className="px-4 py-2">{p.period}</td>
                            <td className="px-4 py-2 text-right">{formatCOP(p.totalRevenue)}</td>
                            <td className="px-4 py-2 text-right">{p.paymentCount}</td>
                            <td className="px-4 py-2 text-right">{formatCOP(p.byMethod.CASH ?? 0)}</td>
                            <td className="px-4 py-2 text-right">{formatCOP(p.byMethod.CARD ?? 0)}</td>
                            <td className="px-4 py-2 text-right">{formatCOP(p.byMethod.BANK_TRANSFER ?? 0)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Ticket Stats Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('tickets')}>
          <CardTitle className="text-lg">Tickets {expanded.tickets ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.tickets && (
          <CardContent>
            {ticketsLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : ticketStats ? (
              <>
                <div className="mb-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p><span className="font-medium">Total tickets:</span> {ticketStats.totalTickets}</p>
                  <p><span className="font-medium">Promedio resolución:</span> {ticketStats.averageResolutionHours}h</p>
                  <p><span className="font-medium">Vencidos:</span> {ticketStats.overdueCount}</p>
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Estado</th>
                        <th className="px-4 py-2 text-right font-medium">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ticketStats.byStatus.map((s) => (
                        <tr key={s.status} className="border-t">
                          <td className="px-4 py-2">{s.status}</td>
                          <td className="px-4 py-2 text-right">{s.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Technician Performance Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('technicians')}>
          <CardTitle className="text-lg">Rendimiento de Técnicos {expanded.technicians ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.technicians && (
          <CardContent>
            {techLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : techReport ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Técnico</th>
                      <th className="px-4 py-2 text-right font-medium">Asignados</th>
                      <th className="px-4 py-2 text-right font-medium">Completados</th>
                      <th className="px-4 py-2 text-right font-medium">Horas prom.</th>
                      <th className="px-4 py-2 text-right font-medium">Min. trabajo</th>
                      <th className="px-4 py-2 text-right font-medium">Ingresos MO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techReport.technicians.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">Sin datos.</td></tr>
                    ) : (
                      techReport.technicians.map((t) => (
                        <tr key={t.id} className="border-t">
                          <td className="px-4 py-2">{t.name}</td>
                          <td className="px-4 py-2 text-right">{t.assignedTickets}</td>
                          <td className="px-4 py-2 text-right">{t.completedTickets}</td>
                          <td className="px-4 py-2 text-right">{t.averageResolutionHours}h</td>
                          <td className="px-4 py-2 text-right">{t.totalLaborMinutes}</td>
                          <td className="px-4 py-2 text-right">{formatCOP(t.totalLaborRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Inventory Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('inventory')}>
          <CardTitle className="text-lg">Inventario {expanded.inventory ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.inventory && (
          <CardContent>
            {invLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : inventoryReport ? (
              <>
                <div className="mb-3 flex items-center gap-4 text-sm">
                  <p><span className="font-medium">Total repuestos:</span> {inventoryReport.totalParts}</p>
                  <p><span className="font-medium">Valor total:</span> {formatCOP(inventoryReport.totalValue)}</p>
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
                    Solo bajo stock
                  </label>
                </div>
                {inventoryReport.lowStockParts.length > 0 && (
                  <>
                    <p className="mb-2 text-sm font-medium">Repuestos con stock bajo:</p>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">SKU</th>
                            <th className="px-4 py-2 text-left font-medium">Nombre</th>
                            <th className="px-4 py-2 text-right font-medium">Stock actual</th>
                            <th className="px-4 py-2 text-right font-medium">Stock mínimo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryReport.lowStockParts.map((p) => (
                            <tr key={p.id} className="border-t">
                              <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                              <td className="px-4 py-2">{p.name}</td>
                              <td className="px-4 py-2 text-right">{p.stockQuantity}</td>
                              <td className="px-4 py-2 text-right">{p.minimumStock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Top Customers Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('customers')}>
          <CardTitle className="text-lg">Mejores Clientes {expanded.customers ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.customers && (
          <CardContent>
            {custLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : topCustomers ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Cliente</th>
                      <th className="px-4 py-2 text-right font-medium">Facturas</th>
                      <th className="px-4 py-2 text-right font-medium">Total gastado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.customers.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">Sin datos.</td></tr>
                    ) : (
                      topCustomers.customers.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="px-4 py-2">{c.name}</td>
                          <td className="px-4 py-2 text-right">{c.invoiceCount}</td>
                          <td className="px-4 py-2 text-right">{formatCOP(c.totalSpent)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Parts Usage Section */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => toggleSection('parts')}>
          <CardTitle className="text-lg">Uso de Repuestos {expanded.parts ? '▾' : '▸'}</CardTitle>
        </CardHeader>
        {expanded.parts && (
          <CardContent>
            {partsLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : partsUsage ? (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">SKU</th>
                      <th className="px-4 py-2 text-left font-medium">Repuesto</th>
                      <th className="px-4 py-2 text-right font-medium">Total usado</th>
                      <th className="px-4 py-2 text-right font-medium">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partsUsage.parts.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">Sin datos.</td></tr>
                    ) : (
                      partsUsage.parts.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                          <td className="px-4 py-2">{p.name}</td>
                          <td className="px-4 py-2 text-right">{p.totalUsed}</td>
                          <td className="px-4 py-2 text-right">{formatCOP(p.totalRevenue)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
