import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCreateStockMovement, useDeletePart, usePartById, usePartMovements } from '@/api/parts';
import { PageError, PageLoading } from '@/components/shared/page-states';

export function PartDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: part, isLoading, isError, error } = usePartById(id, true);
  const { data: movements } = usePartMovements(id, 1, 50);
  const createMovement = useCreateStockMovement();
  const deletePart = useDeletePart();

  const [movementOpen, setMovementOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');

  if (isLoading) return <PageLoading title="Detalle de repuesto" />;
  if (isError || !part) return <PageError title="Detalle de repuesto" message={error instanceof Error ? error.message : 'No fue posible cargar el repuesto.'} />;

  const partData = part;

  async function handleMovement(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await createMovement.mutateAsync({
        partId: partData.id,
        payload: {
          type: movementType,
          quantity,
          reason: reason.trim() || null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Movimiento registrado correctamente.' });
      setMovementOpen(false);
      setQuantity(1);
      setReason('');
      setMovementType('IN');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible registrar el movimiento.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deletePart.mutateAsync(partData.id);
      navigate('/inventory');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el repuesto.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de repuesto</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory')}>Volver</Button>
          <Button type="button" variant="outline" onClick={() => setMovementOpen(true)}>Movimiento de stock</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{partData.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">SKU:</span> {partData.sku}</p>
          <p><span className="font-medium">Tipo:</span> {partData.type}</p>
          <p><span className="font-medium">Categoría:</span> {partData.category?.name ?? '—'}</p>
          <p><span className="font-medium">Stock actual:</span> {partData.stockQuantity}</p>
          <p><span className="font-medium">Stock mínimo:</span> {partData.minimumStock}</p>
          <p><span className="font-medium">Precio venta:</span> {Number(partData.salePrice).toLocaleString('es-CO')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {(movements?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {(movements?.data ?? []).map((m: any) => (
                <div key={m.id} className="rounded-md border p-3 text-sm">
                  <p><span className="font-medium">Tipo:</span> {m.type}</p>
                  <p><span className="font-medium">Cantidad:</span> {m.quantity}</p>
                  <p><span className="font-medium">Motivo:</span> {m.reason ?? '—'}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={movementOpen}
        onClose={() => setMovementOpen(false)}
        title="Registrar movimiento"
        widthClassName="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setMovementOpen(false)}>Cancelar</Button>
            <Button type="submit" form="movement-form" disabled={createMovement.isPending}>{createMovement.isPending ? 'Guardando...' : 'Registrar'}</Button>
          </div>
        }
      >
        <form id="movement-form" onSubmit={handleMovement} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={movementType} onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT')}>
            <option value="IN">Entrada</option>
            <option value="OUT">Salida</option>
            <option value="ADJUSTMENT">Ajuste</option>
          </select>
          <Input type="number" placeholder="Cantidad" value={String(quantity)} onChange={(e) => setQuantity(Number(e.target.value))} min={0} required />
          <Input placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deletePart.isPending}
        title="Eliminar repuesto"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
