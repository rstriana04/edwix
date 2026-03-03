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
  type Supplier,
  type SupplierInput,
  useCreateSupplier,
  useDeleteSupplier,
  useSuppliers,
  useUpdateSupplier,
} from '@/api/suppliers';
import { PageError, PageLoading } from '@/components/shared/page-states';

const initialForm: SupplierInput = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  paymentTerms: '',
  deliveryNotes: '',
  notes: '',
};

export function SuppliersPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInput>(initialForm);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError, error } = useSuppliers(page, limit, search || undefined);
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const suppliers = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setSelected(supplier);
    setForm({
      name: supplier.name,
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      website: supplier.website ?? '',
      address: supplier.address ?? '',
      paymentTerms: supplier.paymentTerms ?? '',
      deliveryNotes: supplier.deliveryNotes ?? '',
      notes: supplier.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    const payload: SupplierInput = {
      ...form,
      contactName: form.contactName?.trim() ? form.contactName.trim() : null,
      phone: form.phone?.trim() ? form.phone.trim() : null,
      email: form.email?.trim() ? form.email.trim() : null,
      website: form.website?.trim() ? form.website.trim() : null,
      address: form.address?.trim() ? form.address.trim() : null,
      paymentTerms: form.paymentTerms?.trim() ? form.paymentTerms.trim() : null,
      deliveryNotes: form.deliveryNotes?.trim() ? form.deliveryNotes.trim() : null,
      notes: form.notes?.trim() ? form.notes.trim() : null,
    };

    try {
      if (selected) {
        await updateSupplier.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Proveedor actualizado correctamente.' });
      } else {
        await createSupplier.mutateAsync(payload);
        setStatusMessage({ type: 'success', text: 'Proveedor creado correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar el proveedor.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteSupplier.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Proveedor eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el proveedor.' });
    }
  }

  if (isLoading) return <PageLoading title="Proveedores" />;
  if (isError) return <PageError title="Proveedores" message={error instanceof Error ? error.message : 'No fue posible cargar proveedores.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Proveedores</h2>
        <Button type="button" onClick={openCreate}>Nuevo proveedor</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
          <Input
            placeholder="Buscar por nombre, contacto, teléfono o correo"
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
                  <th className="px-4 py-2 text-left font-medium">Nombre</th>
                  <th className="px-4 py-2 text-left font-medium">Contacto</th>
                  <th className="px-4 py-2 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-2 text-left font-medium">Correo</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay proveedores para mostrar.</td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-t">
                      <td className="px-4 py-2">{supplier.name}</td>
                      <td className="px-4 py-2">{supplier.contactName ?? '—'}</td>
                      <td className="px-4 py-2">{supplier.phone ?? '—'}</td>
                      <td className="px-4 py-2">{supplier.email ?? '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/suppliers/${supplier.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(supplier)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(supplier); setDeleteOpen(true); }}>Eliminar</Button>
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
        title={selected ? 'Editar proveedor' : 'Crear proveedor'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="supplier-form" disabled={createSupplier.isPending || updateSupplier.isPending}>{createSupplier.isPending || updateSupplier.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        <form id="supplier-form" onSubmit={handleSubmit} className="grid gap-3">
          <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
          <Input placeholder="Contacto" value={form.contactName ?? ''} onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))} />
          <Input placeholder="Teléfono" value={form.phone ?? ''} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
          <Input placeholder="Correo" type="email" value={form.email ?? ''} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <Input placeholder="Sitio web" value={form.website ?? ''} onChange={(e) => setForm((s) => ({ ...s, website: e.target.value }))} />
          <Input placeholder="Dirección" value={form.address ?? ''} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          <Input placeholder="Términos de pago" value={form.paymentTerms ?? ''} onChange={(e) => setForm((s) => ({ ...s, paymentTerms: e.target.value }))} />
          <Input placeholder="Notas de entrega" value={form.deliveryNotes ?? ''} onChange={(e) => setForm((s) => ({ ...s, deliveryNotes: e.target.value }))} />
          <Input placeholder="Notas" value={form.notes ?? ''} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteSupplier.isPending}
        title="Eliminar proveedor"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
