import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageError, PageLoading } from '@/components/shared/page-states';
import {
  useAssetById,
  useDeleteAsset,
  useUpdateAsset,
  useCheckoutAsset,
  useCheckinAsset,
  useAddAssetMaintenance,
  useAssetCheckouts,
  useAssetMaintenanceLog,
  type AssetInput,
  type CheckoutInput,
  type MaintenanceInput,
} from '@/api/assets';
import { useUsers } from '@/api/users';

const statusLabels: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: 'Disponible', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  IN_USE: { label: 'En uso', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  MAINTENANCE: { label: 'En mantenimiento', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  RETIRED: { label: 'Retirado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

export function AssetDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: asset, isLoading, isError, error } = useAssetById(id);
  const { data: checkoutsData } = useAssetCheckouts(id, 1, 50);
  const { data: maintenanceData } = useAssetMaintenanceLog(id, 1, 50);
  const { data: users = [] } = useUsers();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const checkoutAsset = useCheckoutAsset();
  const checkinAsset = useCheckinAsset();
  const addMaintenance = useAddAssetMaintenance();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editForm, setEditForm] = useState<AssetInput>({ name: '' });
  const [checkoutForm, setCheckoutForm] = useState<CheckoutInput>({ checkedOutToId: '', notes: '' });
  const [checkinNotes, setCheckinNotes] = useState('');
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceInput>({ description: '', cost: null, performedAt: '', nextMaintenanceDate: '', notes: '' });

  if (isLoading) return <PageLoading title="Detalle de activo" />;
  if (isError || !asset) return <PageError title="Detalle de activo" message={error instanceof Error ? error.message : 'No fue posible cargar el activo.'} />;

  const activeCheckout = asset.checkouts?.find((c) => !c.checkedInAt);
  const badge = statusLabels[asset.status] ?? statusLabels.AVAILABLE;

  function openEdit() {
    if (!asset) return;
    setEditForm({
      name: asset.name,
      description: asset.description ?? '',
      category: asset.category ?? '',
      serialNumber: asset.serialNumber ?? '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: asset.purchaseCost != null ? Number(asset.purchaseCost) : null,
      warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.split('T')[0] : '',
      location: asset.location ?? '',
      notes: asset.notes ?? '',
      status: asset.status,
    });
    setEditOpen(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setStatusMessage(null);
    try {
      await updateAsset.mutateAsync({
        id: asset.id,
        payload: {
          ...editForm,
          description: editForm.description?.trim() || null,
          category: editForm.category?.trim() || null,
          serialNumber: editForm.serialNumber?.trim() || null,
          purchaseDate: editForm.purchaseDate || null,
          purchaseCost: editForm.purchaseCost != null && editForm.purchaseCost >= 0 ? editForm.purchaseCost : null,
          warrantyExpiry: editForm.warrantyExpiry || null,
          location: editForm.location?.trim() || null,
          notes: editForm.notes?.trim() || null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Activo actualizado correctamente.' });
      setEditOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar el activo.' });
    }
  }

  async function handleDelete() {
    if (!asset) return;
    setStatusMessage(null);
    try {
      await deleteAsset.mutateAsync(asset.id);
      navigate('/assets');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el activo.' });
    }
  }

  async function handleCheckout(e: FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setStatusMessage(null);
    try {
      await checkoutAsset.mutateAsync({
        assetId: asset.id,
        payload: { checkedOutToId: checkoutForm.checkedOutToId, notes: checkoutForm.notes?.trim() || null },
      });
      setStatusMessage({ type: 'success', text: 'Activo asignado correctamente.' });
      setCheckoutOpen(false);
      setCheckoutForm({ checkedOutToId: '', notes: '' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible asignar el activo.' });
    }
  }

  async function handleCheckin(e: FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setStatusMessage(null);
    try {
      await checkinAsset.mutateAsync({ assetId: asset.id, notes: checkinNotes.trim() || null });
      setStatusMessage({ type: 'success', text: 'Activo devuelto correctamente.' });
      setCheckinOpen(false);
      setCheckinNotes('');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible devolver el activo.' });
    }
  }

  async function handleMaintenance(e: FormEvent) {
    e.preventDefault();
    if (!asset) return;
    setStatusMessage(null);
    try {
      await addMaintenance.mutateAsync({
        assetId: asset.id,
        payload: {
          description: maintenanceForm.description,
          cost: maintenanceForm.cost,
          performedAt: maintenanceForm.performedAt || undefined,
          nextMaintenanceDate: maintenanceForm.nextMaintenanceDate || null,
          notes: maintenanceForm.notes?.trim() || null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Mantenimiento registrado correctamente.' });
      setMaintenanceOpen(false);
      setMaintenanceForm({ description: '', cost: null, performedAt: '', nextMaintenanceDate: '', notes: '' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible registrar el mantenimiento.' });
    }
  }

  async function handleMarkAvailable() {
    if (!asset) return;
    setStatusMessage(null);
    try {
      await updateAsset.mutateAsync({ id: asset.id, payload: { status: 'AVAILABLE' } });
      setStatusMessage({ type: 'success', text: 'Activo marcado como disponible.' });
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar el estado.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de activo</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/assets')}>Volver</Button>
          {asset.status === 'AVAILABLE' && (
            <Button type="button" onClick={() => setCheckoutOpen(true)}>Asignar</Button>
          )}
          {asset.status === 'IN_USE' && (
            <Button type="button" onClick={() => setCheckinOpen(true)}>Devolver</Button>
          )}
          {asset.status === 'MAINTENANCE' && (
            <Button type="button" onClick={handleMarkAvailable}>Marcar disponible</Button>
          )}
          {asset.status !== 'RETIRED' && (
            <Button type="button" variant="outline" onClick={() => setMaintenanceOpen(true)}>Registrar mantenimiento</Button>
          )}
          <Button type="button" variant="outline" onClick={openEdit}>Editar</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)} disabled={asset.status === 'IN_USE'}>Eliminar</Button>
        </div>
      </div>

      {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}

      <Card>
        <CardHeader><CardTitle>{asset.name}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Estado:</span> <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span></p>
          {asset.description && <p><span className="font-medium">Descripción:</span> {asset.description}</p>}
          {asset.category && <p><span className="font-medium">Categoría:</span> {asset.category}</p>}
          {asset.serialNumber && <p><span className="font-medium">N. Serie:</span> {asset.serialNumber}</p>}
          {asset.purchaseDate && <p><span className="font-medium">Fecha compra:</span> {new Date(asset.purchaseDate).toLocaleDateString('es-CO')}</p>}
          {asset.purchaseCost != null && <p><span className="font-medium">Costo:</span> {Number(asset.purchaseCost).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>}
          {asset.warrantyExpiry && <p><span className="font-medium">Garantía hasta:</span> {new Date(asset.warrantyExpiry).toLocaleDateString('es-CO')}</p>}
          {asset.location && <p><span className="font-medium">Ubicación:</span> {asset.location}</p>}
          {asset.notes && <p><span className="font-medium">Notas:</span> {asset.notes}</p>}
        </CardContent>
      </Card>

      {activeCheckout && (
        <Card>
          <CardHeader><CardTitle className="text-base">Asignación activa</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p><span className="font-medium">Asignado a:</span> {activeCheckout.checkedOutTo?.firstName} {activeCheckout.checkedOutTo?.lastName}</p>
            <p><span className="font-medium">Asignado por:</span> {activeCheckout.checkedOutBy?.firstName} {activeCheckout.checkedOutBy?.lastName}</p>
            <p><span className="font-medium">Desde:</span> {new Date(activeCheckout.checkedOutAt).toLocaleDateString('es-CO')}</p>
            {activeCheckout.notes && <p><span className="font-medium">Notas:</span> {activeCheckout.notes}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de mantenimiento</CardTitle></CardHeader>
        <CardContent>
          {(maintenanceData?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay registros de mantenimiento.</p>
          ) : (
            <div className="space-y-2">
              {(maintenanceData?.data ?? []).map((m) => (
                <div key={m.id} className="rounded-md border p-3 text-sm">
                  <p><span className="font-medium">Descripción:</span> {m.description}</p>
                  <p><span className="font-medium">Realizado por:</span> {m.performedBy?.firstName} {m.performedBy?.lastName}</p>
                  <p><span className="font-medium">Fecha:</span> {new Date(m.performedAt).toLocaleDateString('es-CO')}</p>
                  {m.cost != null && <p><span className="font-medium">Costo:</span> {Number(m.cost).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</p>}
                  {m.nextMaintenanceDate && <p><span className="font-medium">Próximo mantenimiento:</span> {new Date(m.nextMaintenanceDate).toLocaleDateString('es-CO')}</p>}
                  {m.notes && <p><span className="font-medium">Notas:</span> {m.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de asignaciones</CardTitle></CardHeader>
        <CardContent>
          {(checkoutsData?.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay registros de asignación.</p>
          ) : (
            <div className="space-y-2">
              {(checkoutsData?.data ?? []).map((c) => (
                <div key={c.id} className="rounded-md border p-3 text-sm">
                  <p><span className="font-medium">Asignado a:</span> {c.checkedOutTo?.firstName} {c.checkedOutTo?.lastName}</p>
                  <p><span className="font-medium">Asignado por:</span> {c.checkedOutBy?.firstName} {c.checkedOutBy?.lastName}</p>
                  <p><span className="font-medium">Desde:</span> {new Date(c.checkedOutAt).toLocaleDateString('es-CO')}</p>
                  <p><span className="font-medium">Hasta:</span> {c.checkedInAt ? new Date(c.checkedInAt).toLocaleDateString('es-CO') : 'Activo'}</p>
                  {c.notes && <p><span className="font-medium">Notas:</span> {c.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar activo" footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button type="submit" form="edit-asset-form" disabled={updateAsset.isPending}>{updateAsset.isPending ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      }>
        <form id="edit-asset-form" onSubmit={handleEdit} className="grid gap-3">
          <Input placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))} required />
          <Textarea placeholder="Descripción" value={editForm.description ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} />
          <Input placeholder="Categoría" value={editForm.category ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, category: e.target.value }))} />
          <Input placeholder="Número de serie" value={editForm.serialNumber ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, serialNumber: e.target.value }))} />
          <Input type="date" value={editForm.purchaseDate ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, purchaseDate: e.target.value }))} />
          <Input type="number" placeholder="Costo" value={editForm.purchaseCost != null ? String(editForm.purchaseCost) : ''} onChange={(e) => setEditForm((s) => ({ ...s, purchaseCost: e.target.value ? Number(e.target.value) : null }))} min={0} />
          <Input type="date" value={editForm.warrantyExpiry ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, warrantyExpiry: e.target.value }))} />
          <Input placeholder="Ubicación" value={editForm.location ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, location: e.target.value }))} />
          <Textarea placeholder="Notas" value={editForm.notes ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, notes: e.target.value }))} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={editForm.status ?? asset.status} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}>
            <option value="AVAILABLE">Disponible</option>
            <option value="IN_USE">En uso</option>
            <option value="MAINTENANCE">En mantenimiento</option>
            <option value="RETIRED">Retirado</option>
          </select>
        </form>
      </Modal>

      {/* Checkout Modal */}
      <Modal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} title="Asignar activo" widthClassName="max-w-md" footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>Cancelar</Button>
          <Button type="submit" form="checkout-form" disabled={checkoutAsset.isPending}>{checkoutAsset.isPending ? 'Asignando...' : 'Asignar'}</Button>
        </div>
      }>
        <form id="checkout-form" onSubmit={handleCheckout} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={checkoutForm.checkedOutToId} onChange={(e) => setCheckoutForm((s) => ({ ...s, checkedOutToId: e.target.value }))} required>
            <option value="">Seleccionar usuario</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
            ))}
          </select>
          <Input placeholder="Notas (opcional)" value={checkoutForm.notes ?? ''} onChange={(e) => setCheckoutForm((s) => ({ ...s, notes: e.target.value }))} />
        </form>
      </Modal>

      {/* Checkin Modal */}
      <Modal open={checkinOpen} onClose={() => setCheckinOpen(false)} title="Devolver activo" widthClassName="max-w-md" footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setCheckinOpen(false)}>Cancelar</Button>
          <Button type="submit" form="checkin-form" disabled={checkinAsset.isPending}>{checkinAsset.isPending ? 'Devolviendo...' : 'Devolver'}</Button>
        </div>
      }>
        <form id="checkin-form" onSubmit={handleCheckin} className="grid gap-3">
          <Input placeholder="Notas (opcional)" value={checkinNotes} onChange={(e) => setCheckinNotes(e.target.value)} />
        </form>
      </Modal>

      {/* Maintenance Modal */}
      <Modal open={maintenanceOpen} onClose={() => setMaintenanceOpen(false)} title="Registrar mantenimiento" footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setMaintenanceOpen(false)}>Cancelar</Button>
          <Button type="submit" form="maintenance-form" disabled={addMaintenance.isPending}>{addMaintenance.isPending ? 'Guardando...' : 'Registrar'}</Button>
        </div>
      }>
        <form id="maintenance-form" onSubmit={handleMaintenance} className="grid gap-3">
          <Input placeholder="Descripción" value={maintenanceForm.description} onChange={(e) => setMaintenanceForm((s) => ({ ...s, description: e.target.value }))} required />
          <Input type="number" placeholder="Costo (opcional)" value={maintenanceForm.cost != null ? String(maintenanceForm.cost) : ''} onChange={(e) => setMaintenanceForm((s) => ({ ...s, cost: e.target.value ? Number(e.target.value) : null }))} min={0} />
          <Input type="date" placeholder="Fecha realizado" value={maintenanceForm.performedAt ?? ''} onChange={(e) => setMaintenanceForm((s) => ({ ...s, performedAt: e.target.value }))} />
          <Input type="date" placeholder="Próximo mantenimiento" value={maintenanceForm.nextMaintenanceDate ?? ''} onChange={(e) => setMaintenanceForm((s) => ({ ...s, nextMaintenanceDate: e.target.value }))} />
          <Textarea placeholder="Notas" value={maintenanceForm.notes ?? ''} onChange={(e) => setMaintenanceForm((s) => ({ ...s, notes: e.target.value }))} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteAsset.isPending}
        title="Eliminar activo"
        description="Esta acción no se puede deshacer. Se eliminarán también los registros de asignación y mantenimiento."
      />
    </div>
  );
}
