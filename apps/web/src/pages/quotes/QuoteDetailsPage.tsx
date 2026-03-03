import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useDeleteQuote, useQuoteById, useUpdateQuoteStatus } from '@/api/quotes';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageError, PageLoading } from '@/components/shared/page-states';

const statuses: Array<'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'INVOICED'> = ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'INVOICED'];

export function QuoteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: quote, isLoading, isError, error } = useQuoteById(id);
  const updateStatus = useUpdateQuoteStatus();
  const deleteQuote = useDeleteQuote();

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageLoading title="Detalle de cotización" />;
  if (isError || !quote) return <PageError title="Detalle de cotización" message={error instanceof Error ? error.message : 'No fue posible cargar la cotización.'} />;

  const quoteData = quote;

  async function handleStatus(nextStatus: typeof statuses[number]) {
    setStatusMessage(null);
    try {
      await updateStatus.mutateAsync({ id: quoteData.id, status: nextStatus });
      setStatusMessage({ type: 'success', text: 'Estado actualizado correctamente.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar el estado.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deleteQuote.mutateAsync(quoteData.id);
      navigate('/quotes');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar la cotización.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de cotización</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/quotes')}>Volver</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{quoteData.quoteNumber}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Estado actual:</span> {quoteData.status}</p>
          <p><span className="font-medium">Cliente:</span> {quoteData.customer ? `${quoteData.customer.firstName} ${quoteData.customer.lastName}` : '—'}</p>
          <p><span className="font-medium">Ticket:</span> {quoteData.ticket?.ticketNumber ?? '—'}</p>
          <p><span className="font-medium">Subtotal:</span> {Number(quoteData.subtotal).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Impuesto:</span> {Number(quoteData.taxAmount).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Total:</span> {Number(quoteData.total).toLocaleString('es-CO')}</p>
          <p><span className="font-medium">Notas:</span> {quoteData.notes ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Líneas</CardTitle>
        </CardHeader>
        <CardContent>
          {(quoteData.lines ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay líneas registradas.</p>
          ) : (
            <div className="space-y-2">
              {quoteData.lines?.map((line) => (
                <div key={line.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 text-sm md:grid-cols-4">
                  <p>{line.description}</p>
                  <p>Cantidad: {Number(line.quantity)}</p>
                  <p>Precio: {Number(line.unitPrice).toLocaleString('es-CO')}</p>
                  <p>Total: {Number(line.total).toLocaleString('es-CO')}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <Button key={s} type="button" variant={quoteData.status === s ? 'default' : 'outline'} onClick={() => handleStatus(s)} disabled={updateStatus.isPending}>
                {s}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteQuote.isPending}
        title="Eliminar cotización"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
