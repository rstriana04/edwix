import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePagination } from '@/hooks/use-pagination';
import {
  type Asset,
  type AssetInput,
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
} from '@/api/assets';
import { PageError, PageLoading } from '@/components/shared/page-states';

const statusLabels: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: 'Disponible', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  IN_USE: { label: 'En uso', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  MAINTENANCE: { label: 'En mantenimiento', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  RETIRED: { label: 'Retirado', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const initialForm: AssetInput = {
  name: '',
  description: '',
  category: '',
  serialNumber: '',
  purchaseDate: '',
  purchaseCost: null,
  warrantyExpiry: '',
  location: '',
  notes: '',
};

export function AssetsPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<AssetInput>(initialForm);

  const { data, isLoading, isError, error } = useAssets(page, limit, search || undefined, statusFilter || undefined);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const assets = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEdit(asset: Asset) {
    setSelected(asset);
    setForm({
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
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const payload: AssetInput = {
      ...form,
      description: form.description?.trim() || null,
      category: form.category?.trim() || null,
      serialNumber: form.serialNumber?.trim() || null,
      purchaseDate: form.purchaseDate || null,
      purchaseCost: form.purchaseCost != null && form.purchaseCost >= 0 ? form.purchaseCost : null,
      warrantyExpiry: form.warrantyExpiry || null,
      location: form.location?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    try {
      if (selected) {
        await updateAsset.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Activo actualizado correctamente.' });
      } else {
        delete payload.status;
        await createAsset.mutateAsync(payload);
        setStatusMessage({ type: 'success', text: 'Activo creado correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar el activo.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteAsset.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Activo eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el activo.' });
    }
  }

  if (isLoading) return <PageLoading title="Activos" />;
  if (isError) return <PageError title="Activos" message={error instanceof Error ? error.message : 'No fue posible cargar activos.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Activos</h2>
        <Button type="button" onClick={openCreate}>Nuevo activo</Button>
      </div>

      {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Activos de la empresa</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); resetToFirstPage(); }}
            >
              <option value="">Todos los estados</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="IN_USE">En uso</option>
              <option value="MAINTENANCE">En mantenimiento</option>
              <option value="RETIRED">Retirado</option>
            </select>
            <Input
              placeholder="Buscar por nombre, serie, categoría..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetToFirstPage(); }}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">Categoría</th>
                  <th className="px-4 py-2 text-left font-medium">N. Serie</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                  <th className="px-4 py-2 text-left font-medium">Ubicación</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay activos para mostrar.</td></tr>
                ) : (
                  assets.map((asset) => {
                    const badge = statusLabels[asset.status] ?? statusLabels.AVAILABLE;
                    return (
                      <tr key={asset.id} className="border-t">
                        <td className="px-4 py-2">{asset.name}</td>
                        <td className="px-4 py-2">{asset.category ?? '—'}</td>
                        <td className="px-4 py-2 font-mono text-xs">{asset.serialNumber ?? '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-2">{asset.location ?? '—'}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/assets/${asset.id}`)}>Ver</Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => openEdit(asset)}>Editar</Button>
                            <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(asset); setDeleteOpen(true); }}>Eliminar</Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {meta.page} de {meta.totalPages} ({meta.total} registros)</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => prev()}>Anterior</Button>
                <Button type="button" variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => next(meta.totalPages)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar activo' : 'Crear activo'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="asset-form" disabled={createAsset.isPending || updateAsset.isPending}>
              {createAsset.isPending || updateAsset.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="asset-form" onSubmit={handleSubmit} className="grid gap-3">
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          <Textarea placeholder="Descripción" value={form.description ?? ''} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <Input placeholder="Categoría" value={form.category ?? ''} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))} />
          <Input placeholder="Número de serie" value={form.serialNumber ?? ''} onChange={(e) => setForm((s) => ({ ...s, serialNumber: e.target.value }))} />
          <Input type="date" placeholder="Fecha de compra" value={form.purchaseDate ?? ''} onChange={(e) => setForm((s) => ({ ...s, purchaseDate: e.target.value }))} />
          <Input type="number" placeholder="Costo de compra" value={form.purchaseCost != null ? String(form.purchaseCost) : ''} onChange={(e) => setForm((s) => ({ ...s, purchaseCost: e.target.value ? Number(e.target.value) : null }))} min={0} />
          <Input type="date" placeholder="Garantía hasta" value={form.warrantyExpiry ?? ''} onChange={(e) => setForm((s) => ({ ...s, warrantyExpiry: e.target.value }))} />
          <Input placeholder="Ubicación" value={form.location ?? ''} onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))} />
          <Textarea placeholder="Notas" value={form.notes ?? ''} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          {selected && (
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.status ?? selected.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              <option value="AVAILABLE">Disponible</option>
              <option value="IN_USE">En uso</option>
              <option value="MAINTENANCE">En mantenimiento</option>
              <option value="RETIRED">Retirado</option>
            </select>
          )}
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
