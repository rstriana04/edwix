import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePagination } from '@/hooks/use-pagination';
import {
  type Part,
  type PartInput,
  useCreatePart,
  useDeletePart,
  usePartCategories,
  useParts,
  useUpdatePart,
} from '@/api/parts';
import { PageError, PageLoading } from '@/components/shared/page-states';

const initialForm: PartInput = {
  sku: '',
  name: '',
  description: '',
  type: 'BRANDED_SPARE',
  categoryId: null,
  unit: 'PCS',
  costPrice: 0,
  salePrice: 0,
  minimumStock: 0,
  storageLocation: '',
  compatibleBrands: [],
  compatibleModels: [],
};

export function InventoryPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Part | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<PartInput>(initialForm);
  const [brands, setBrands] = useState('');
  const [models, setModels] = useState('');

  const { data, isLoading, isError, error } = useParts(page, limit, search || undefined);
  const { data: categories = [] } = usePartCategories();
  const createPart = useCreatePart();
  const updatePart = useUpdatePart();
  const deletePart = useDeletePart();

  const parts = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setBrands('');
    setModels('');
    setModalOpen(true);
  }

  function openEdit(part: Part) {
    setSelected(part);
    setForm({
      sku: part.sku,
      name: part.name,
      description: part.description ?? '',
      type: part.type,
      categoryId: part.category?.id ?? null,
      unit: part.unit,
      costPrice: Number(part.costPrice),
      salePrice: Number(part.salePrice),
      minimumStock: part.minimumStock,
      storageLocation: part.storageLocation ?? '',
      compatibleBrands: part.compatibleBrands ?? [],
      compatibleModels: part.compatibleModels ?? [],
    });
    setBrands((part.compatibleBrands ?? []).join(', '));
    setModels((part.compatibleModels ?? []).join(', '));
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const payload: PartInput = {
      ...form,
      sku: form.sku?.trim() || undefined,
      description: form.description?.trim() ? form.description.trim() : null,
      categoryId: form.categoryId || null,
      storageLocation: form.storageLocation?.trim() ? form.storageLocation.trim() : null,
      compatibleBrands: brands
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      compatibleModels: models
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    };

    try {
      if (selected) {
        await updatePart.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Repuesto actualizado correctamente.' });
      } else {
        await createPart.mutateAsync(payload);
        setStatusMessage({ type: 'success', text: 'Repuesto creado correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar el repuesto.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deletePart.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Repuesto eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el repuesto.' });
    }
  }

  if (isLoading) return <PageLoading title="Inventario" />;
  if (isError) return <PageError title="Inventario" message={error instanceof Error ? error.message : 'No fue posible cargar inventario.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <Button type="button" onClick={openCreate}>Nuevo repuesto</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Repuestos</CardTitle>
          <Input
            placeholder="Buscar por SKU o nombre"
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
                  <th className="px-4 py-2 text-left font-medium">SKU</th>
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">Categoría</th>
                  <th className="px-4 py-2 text-right font-medium">Stock</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay repuestos para mostrar.</td>
                  </tr>
                ) : (
                  parts.map((part) => (
                    <tr key={part.id} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">{part.sku}</td>
                      <td className="px-4 py-2">{part.name}</td>
                      <td className="px-4 py-2">{part.category?.name ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{part.stockQuantity}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/inventory/${part.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(part)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(part); setDeleteOpen(true); }}>Eliminar</Button>
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
        title={selected ? 'Editar repuesto' : 'Crear repuesto'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="part-form" disabled={createPart.isPending || updatePart.isPending}>
              {createPart.isPending || updatePart.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="part-form" onSubmit={handleSubmit} className="grid gap-3">
          <Input placeholder="SKU (opcional)" value={form.sku ?? ''} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} />
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          <Input placeholder="Descripción" value={form.description ?? ''} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}>
            <option value="BRANDED_SPARE">Repuesto de marca</option>
            <option value="GENERIC_COMPONENT">Componente genérico</option>
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.categoryId ?? ''} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value || null }))}>
            <option value="">Sin categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Unidad" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} required />
          <Input type="number" placeholder="Precio costo" value={String(form.costPrice)} onChange={(e) => setForm((s) => ({ ...s, costPrice: Number(e.target.value) }))} required />
          <Input type="number" placeholder="Precio venta" value={String(form.salePrice)} onChange={(e) => setForm((s) => ({ ...s, salePrice: Number(e.target.value) }))} required />
          <Input type="number" placeholder="Stock mínimo" value={String(form.minimumStock ?? 0)} onChange={(e) => setForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))} />
          <Input placeholder="Ubicación" value={form.storageLocation ?? ''} onChange={(e) => setForm((s) => ({ ...s, storageLocation: e.target.value }))} />
          <Input placeholder="Marcas compatibles (coma)" value={brands} onChange={(e) => setBrands(e.target.value)} />
          <Input placeholder="Modelos compatibles (coma)" value={models} onChange={(e) => setModels(e.target.value)} />
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
