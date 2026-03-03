import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { usePagination } from '@/hooks/use-pagination';
import {
  type Invoice,
  type InvoiceInput,
  type InvoiceUpdateInput,
  useCreateInvoice,
  useInvoices,
  useUpdateInvoice,
} from '@/api/invoices';
import type { QuoteLineInput } from '@/api/quotes';
import { useQuotes } from '@/api/quotes';
import { useTickets } from '@/api/tickets';
import { PageError, PageLoading } from '@/components/shared/page-states';

function createLine(): QuoteLineInput {
  return { type: 'LABOR', description: '', quantity: 1, unitPrice: 0, partId: null };
}

function formatThousands(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return Math.trunc(value).toLocaleString('es-CO');
}

function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits);
}

const initialForm: InvoiceInput = {
  ticketId: '',
  quoteId: null,
  dueDate: null,
  notes: '',
  taxRate: 0,
  lines: [createLine()],
};

export function InvoicesPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceInput>(initialForm);

  const { data, isLoading, isError, error } = useInvoices(page, limit, search || undefined);
  const { data: ticketsData } = useTickets(1, 100);
  const { data: quotesData } = useQuotes(1, 100);
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();

  const invoices = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setModalError(null);
    setModalOpen(true);
  }

  function openEdit(invoice: Invoice) {
    setSelected(invoice);
    setForm({
      ticketId: invoice.ticketId,
      quoteId: invoice.quoteId ?? null,
      dueDate: invoice.dueDate ?? null,
      notes: invoice.notes ?? '',
      taxRate: Number(invoice.taxRate),
      lines: (invoice.lines ?? []).length
        ? (invoice.lines ?? []).map((line) => ({
            type: (line as any).type ?? 'LABOR',
            description: line.description,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
            partId: (line as any).partId ?? null,
          }))
        : [createLine()],
    });
    setModalError(null);
    setModalOpen(true);
  }

  function setLine(index: number, updater: (line: QuoteLineInput) => QuoteLineInput) {
    setForm((s) => ({ ...s, lines: s.lines.map((line, i) => (i === index ? updater(line) : line)) }));
  }

  function addLine() {
    setForm((s) => ({ ...s, lines: [...s.lines, createLine()] }));
  }

  function removeLine(index: number) {
    setForm((s) => ({ ...s, lines: s.lines.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    setModalError(null);

    const taxRate = Number(form.taxRate ?? 0);
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setModalError('El impuesto debe estar entre 0 y 100%.');
      return;
    }

    try {
      if (selected) {
        const payload: InvoiceUpdateInput = {
          dueDate: form.dueDate || null,
          notes: form.notes?.trim() ? form.notes.trim() : null,
          taxRate,
          lines: form.lines,
        };
        await updateInvoice.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Factura actualizada correctamente.' });
      } else {
        await createInvoice.mutateAsync({
          ticketId: form.ticketId,
          quoteId: form.quoteId || null,
          dueDate: form.dueDate || null,
          notes: form.notes?.trim() ? form.notes.trim() : null,
          taxRate,
          lines: form.lines,
        });
        setStatusMessage({ type: 'success', text: 'Factura creada correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'No fue posible guardar la factura.');
      setModalError(message);
    }
  }

  if (isLoading) return <PageLoading title="Facturas" />;
  if (isError) return <PageError title="Facturas" message={error instanceof Error ? error.message : 'No fue posible cargar facturas.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Facturas</h2>
        <Button type="button" onClick={openCreate}>Nueva factura</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
          <Input
            placeholder="Buscar por número o cliente"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetToFirstPage();
            }}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Número</th>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay facturas para mostrar.</td></tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-4 py-2">{invoice.customer ? `${invoice.customer.firstName} ${invoice.customer.lastName}` : '—'}</td>
                      <td className="px-4 py-2"><span className="rounded bg-muted px-2 py-0.5 text-xs">{invoice.status}</span></td>
                      <td className="px-4 py-2 text-right">{Number(invoice.total).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/invoices/${invoice.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(invoice)} disabled={invoice.status !== 'DRAFT'}>Editar</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages} ({meta.total} registros)</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => prev()}>Anterior</Button>
                <Button type="button" variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => next(meta.totalPages)}>Siguiente</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar factura' : 'Crear factura'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="invoice-form" disabled={createInvoice.isPending || updateInvoice.isPending}>{createInvoice.isPending || updateInvoice.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        {modalError ? <Alert variant="error">{modalError}</Alert> : null}
        <form id="invoice-form" onSubmit={handleSubmit} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.ticketId} onChange={(e) => setForm((s) => ({ ...s, ticketId: e.target.value }))} required>
            <option value="">Seleccione ticket</option>
            {(ticketsData?.data ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.ticketNumber}</option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.quoteId ?? ''} onChange={(e) => setForm((s) => ({ ...s, quoteId: e.target.value || null }))}>
            <option value="">{(quotesData?.data ?? []).length === 0 ? 'No hay cotizaciones disponibles' : 'Sin cotización'}</option>
            {(quotesData?.data ?? []).map((q) => (
              <option key={q.id} value={q.id}>{q.quoteNumber}</option>
            ))}
          </select>
          <Input type="datetime-local" value={form.dueDate ? form.dueDate.slice(0, 16) : ''} onChange={(e) => setForm((s) => ({ ...s, dueDate: e.target.value || null }))} />
          <Input placeholder="Notas" value={form.notes ?? ''} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          <Input
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="Impuesto (%)"
            value={String(form.taxRate ?? 0)}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                taxRate: Number(e.target.value),
              }))
            }
          />

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Líneas</p>
            {form.lines.map((line, index) => (
              <div key={`line-${index}`} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-5">
                <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={line.type} onChange={(e) => setLine(index, (l) => ({ ...l, type: e.target.value as QuoteLineInput['type'] }))}>
                  <option value="LABOR">Mano de obra</option>
                  <option value="PART">Repuesto</option>
                  <option value="FEE">Cargo</option>
                </select>
                <Input placeholder="Descripción" value={line.description} onChange={(e) => setLine(index, (l) => ({ ...l, description: e.target.value }))} required />
                <Input type="number" placeholder="Cantidad" value={String(line.quantity)} onChange={(e) => setLine(index, (l) => ({ ...l, quantity: Number(e.target.value) }))} required />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Precio unitario"
                  value={formatThousands(Number(line.unitPrice))}
                  onChange={(e) =>
                    setLine(index, (l) => ({
                      ...l,
                      unitPrice: parseThousands(e.target.value),
                    }))
                  }
                  required
                />
                <Button type="button" variant="outline" onClick={() => removeLine(index)} disabled={form.lines.length <= 1}>Quitar</Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addLine}>Agregar línea</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
