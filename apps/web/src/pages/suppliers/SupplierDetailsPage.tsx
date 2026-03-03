import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { type SupplierInput, useDeleteSupplier, useSupplierById, useUpdateSupplier } from '@/api/suppliers';
import { PageError, PageLoading } from '@/components/shared/page-states';

export function SupplierDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isLoading, isError, error } = useSupplierById(id);
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<SupplierInput>({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    paymentTerms: '',
    deliveryNotes: '',
    notes: '',
  });

  if (isLoading) return <PageLoading title="Detalle de proveedor" />;
  if (isError || !supplier) return <PageError title="Detalle de proveedor" message={error instanceof Error ? error.message : 'No fue posible cargar el proveedor.'} />;

  const supplierData = supplier;

  function openEdit() {
    setForm({
      name: supplierData.name,
      contactName: supplierData.contactName ?? '',
      phone: supplierData.phone ?? '',
      email: supplierData.email ?? '',
      website: supplierData.website ?? '',
      address: supplierData.address ?? '',
      paymentTerms: supplierData.paymentTerms ?? '',
      deliveryNotes: supplierData.deliveryNotes ?? '',
      notes: supplierData.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateSupplier.mutateAsync({
        id: supplierData.id,
        payload: {
          ...form,
          contactName: form.contactName?.trim() ? form.contactName.trim() : null,
          phone: form.phone?.trim() ? form.phone.trim() : null,
          email: form.email?.trim() ? form.email.trim() : null,
          website: form.website?.trim() ? form.website.trim() : null,
          address: form.address?.trim() ? form.address.trim() : null,
          paymentTerms: form.paymentTerms?.trim() ? form.paymentTerms.trim() : null,
          deliveryNotes: form.deliveryNotes?.trim() ? form.deliveryNotes.trim() : null,
          notes: form.notes?.trim() ? form.notes.trim() : null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Proveedor actualizado correctamente.' });
      setModalOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deleteSupplier.mutateAsync(supplierData.id);
      navigate('/suppliers');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de proveedor</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/suppliers')}>Volver</Button>
          <Button type="button" variant="outline" onClick={openEdit}>Editar</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{supplierData.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Contacto:</span> {supplierData.contactName ?? '—'}</p>
          <p><span className="font-medium">Teléfono:</span> {supplierData.phone ?? '—'}</p>
          <p><span className="font-medium">Correo:</span> {supplierData.email ?? '—'}</p>
          <p><span className="font-medium">Sitio web:</span> {supplierData.website ?? '—'}</p>
          <p><span className="font-medium">Dirección:</span> {supplierData.address ?? '—'}</p>
          <p><span className="font-medium">Términos de pago:</span> {supplierData.paymentTerms ?? '—'}</p>
          <p><span className="font-medium">Notas de entrega:</span> {supplierData.deliveryNotes ?? '—'}</p>
          <p><span className="font-medium">Notas:</span> {supplierData.notes ?? '—'}</p>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar proveedor"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="supplier-edit-form" disabled={updateSupplier.isPending}>{updateSupplier.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        <form id="supplier-edit-form" onSubmit={handleEdit} className="grid gap-3">
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
