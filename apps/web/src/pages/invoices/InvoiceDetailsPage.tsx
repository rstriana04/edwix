import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { useAddPayment, useInvoiceById } from '@/api/invoices';
import { PageError, PageLoading } from '@/components/shared/page-states';

function formatThousands(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';
  return Math.trunc(value).toLocaleString('es-CO');
}

function parseThousands(value: string): number {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits);
}

export function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading, isError, error } = useInvoiceById(id);
  const addPayment = useAddPayment();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading) return <PageLoading title="Detalle de factura" />;
  if (isError || !invoice) return <PageError title="Detalle de factura" message={error instanceof Error ? error.message : 'No fue posible cargar la factura.'} />;

  const invoiceData = invoice;

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCurrency(value: number): string {
    return Number(value).toLocaleString('es-CO');
  }

  function formatDate(value?: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-CO');
  }

  function handlePrintSummaryPdf() {
    const customerName = invoiceData.customer
      ? `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}`
      : '—';
    const lineRows = (invoiceData.lines ?? [])
      .map(
        (line) => `
          <tr>
            <td>${escapeHtml(line.description)}</td>
            <td style="text-align:right;">${formatCurrency(Number(line.quantity))}</td>
            <td style="text-align:right;">${formatCurrency(Number(line.unitPrice))}</td>
            <td style="text-align:right;">${formatCurrency(Number(line.total))}</td>
          </tr>
        `
      )
      .join('');
    const paymentRows = (invoiceData.payments ?? [])
      .map(
        (payment) => `
          <tr>
            <td>${new Date(payment.paidAt).toLocaleString('es-CO')}</td>
            <td>${escapeHtml(payment.method)}</td>
            <td style="text-align:right;">${formatCurrency(Number(payment.amount))}</td>
          </tr>
        `
      )
      .join('');
    const content = `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Resumen ${escapeHtml(invoiceData.invoiceNumber)}</title>
          <style>
            body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #111827; }
            .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
            h1 { margin:0; font-size:22px; }
            .meta { font-size:13px; margin-top:4px; line-height:1.6; }
            .section { margin-top:18px; }
            .section-title { font-size:14px; font-weight:700; margin-bottom:8px; }
            table { width:100%; border-collapse:collapse; font-size:12px; }
            th, td { border:1px solid #d1d5db; padding:8px; vertical-align:top; }
            th { background:#f3f4f6; text-align:left; }
            .totals { width:300px; margin-left:auto; margin-top:14px; font-size:13px; }
            .totals-row { display:flex; justify-content:space-between; padding:4px 0; }
            .total-final { border-top:1px solid #9ca3af; margin-top:6px; padding-top:6px; font-weight:700; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Resumen de Factura</h1>
              <div class="meta">
                <div><strong>Número:</strong> ${escapeHtml(invoiceData.invoiceNumber)}</div>
                <div><strong>Estado:</strong> ${escapeHtml(invoiceData.status)}</div>
                <div><strong>Fecha de vencimiento:</strong> ${formatDate(invoiceData.dueDate)}</div>
              </div>
            </div>
            <div class="meta" style="text-align:right;">
              <div><strong>Cliente:</strong> ${escapeHtml(customerName)}</div>
              <div><strong>Ticket:</strong> ${escapeHtml(invoiceData.ticket?.ticketNumber ?? '—')}</div>
              <div><strong>Cotización:</strong> ${escapeHtml(invoiceData.quote?.quoteNumber ?? '—')}</div>
              <div><strong>Emitido:</strong> ${formatDate(invoiceData.createdAt)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalle de líneas</div>
            <table>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th style="text-align:right;">Cantidad</th>
                  <th style="text-align:right;">Valor unitario</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineRows || '<tr><td colspan="4">Sin líneas registradas</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(Number(invoiceData.subtotal))}</span></div>
            <div class="totals-row"><span>Impuesto</span><span>${formatCurrency(Number(invoiceData.taxAmount))}</span></div>
            <div class="totals-row total-final"><span>Total</span><span>${formatCurrency(Number(invoiceData.total))}</span></div>
          </div>

          <div class="section">
            <div class="section-title">Pagos registrados</div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th style="text-align:right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${paymentRows || '<tr><td colspan="3">Sin pagos registrados</td></tr>'}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      setStatusMessage({ type: 'error', text: 'No fue posible abrir la vista de impresión.' });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handlePayment(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await addPayment.mutateAsync({
        invoiceId: invoiceData.id,
        payload: {
          amount,
          method,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Pago registrado correctamente.' });
      setPaymentOpen(false);
      setAmount(0);
      setMethod('CASH');
      setReference('');
      setNotes('');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible registrar el pago.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de factura</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Volver</Button>
          <Button type="button" variant="outline" onClick={handlePrintSummaryPdf}>Imprimir resumen PDF</Button>
          <Button type="button" onClick={() => setPaymentOpen(true)}>Registrar pago</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{invoiceData.invoiceNumber}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Estado:</span> {invoiceData.status}</p>
          <p><span className="font-medium">Cliente:</span> {invoiceData.customer ? `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}` : '—'}</p>
          <p><span className="font-medium">Ticket:</span> {invoiceData.ticket?.ticketNumber ?? '—'}</p>
          <p><span className="font-medium">Subtotal:</span> {Number(invoiceData.subtotal).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Impuesto:</span> {Number(invoiceData.taxAmount).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Total:</span> {Number(invoiceData.total).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Fecha vencimiento:</span> {invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('es-CO') : '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {(invoiceData.payments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {invoiceData.payments?.map((payment) => (
                <div key={payment.id} className="rounded-md border p-3 text-sm">
                  <p><span className="font-medium">Valor:</span> {Number(payment.amount).toLocaleString('es-CO')}</p>
                  <p><span className="font-medium">Método:</span> {payment.method}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(payment.paidAt).toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Registrar pago"
        widthClassName="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button>
            <Button type="submit" form="payment-form" disabled={addPayment.isPending}>{addPayment.isPending ? 'Guardando...' : 'Registrar'}</Button>
          </div>
        }
      >
        <form id="payment-form" onSubmit={handlePayment} className="grid gap-3">
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Valor"
            value={formatThousands(Number(amount))}
            onChange={(e) => setAmount(parseThousands(e.target.value))}
            required
          />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={method} onChange={(e) => setMethod(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER')}>
            <option value="CASH">Efectivo</option>
            <option value="CARD">Tarjeta</option>
            <option value="BANK_TRANSFER">Transferencia</option>
          </select>
          <Input placeholder="Referencia" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Input placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
}
