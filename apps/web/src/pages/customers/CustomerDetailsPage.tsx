import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  type CustomerInput,
  useCustomerById,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/api/customers';
import { PageError, PageLoading } from '@/components/shared/page-states';

export function CustomerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading, isError, error } = useCustomerById(id);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<CustomerInput>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idDocument: '',
    address: '',
    notes: '',
  });

  const hasDevices = useMemo(() => Array.isArray((customer as any)?.devices) && (customer as any).devices.length > 0, [customer]);

  if (isLoading) return <PageLoading title="Detalle de cliente" />;
  if (isError || !customer) return <PageError title="Detalle de cliente" message={error instanceof Error ? error.message : 'No fue posible cargar el cliente.'} />;

  const customerData = customer;

  function openEdit() {
    setForm({
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      phone: customerData.phone,
      email: customerData.email ?? '',
      idDocument: customerData.idDocument ?? '',
      address: customerData.address ?? '',
      notes: customerData.notes ?? '',
    });
    setModalOpen(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateCustomer.mutateAsync({
        id: customerData.id,
        payload: {
          ...form,
          email: form.email?.trim() ? form.email.trim() : null,
          idDocument: form.idDocument?.trim() ? form.idDocument.trim() : null,
          address: form.address?.trim() ? form.address.trim() : null,
          notes: form.notes?.trim() ? form.notes.trim() : null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Cliente actualizado correctamente.' });
      setModalOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deleteCustomer.mutateAsync(customerData.id);
      navigate('/customers');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de cliente</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/customers')}>Volver</Button>
          <Button type="button" variant="outline" onClick={openEdit}>Editar</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{customerData.firstName} {customerData.lastName}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Teléfono:</span> {customerData.phone}</p>
          <p><span className="font-medium">Correo:</span> {customerData.email ?? '—'}</p>
          <p><span className="font-medium">Documento:</span> {customerData.idDocument ?? '—'}</p>
          <p><span className="font-medium">Dirección:</span> {customerData.address ?? '—'}</p>
          <p><span className="font-medium">Notas:</span> {customerData.notes ?? '—'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos asociados</CardTitle>
        </CardHeader>
        <CardContent>
          {hasDevices ? (
            <div className="space-y-2">
              {(customerData as any).devices.map((d: any) => (
                <div key={d.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{d.brand} {d.model}</p>
                  <p className="text-muted-foreground">{d.category?.name ?? 'Sin categoría'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Este cliente no tiene dispositivos asociados.</p>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar cliente"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="customer-edit-form" disabled={updateCustomer.isPending}>{updateCustomer.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        <form id="customer-edit-form" onSubmit={handleEdit} className="grid gap-3">
          <Input placeholder="Nombres" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} required />
          <Input placeholder="Apellidos" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} required />
          <Input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} required />
          <Input placeholder="Correo" type="email" value={form.email ?? ''} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
          <Input placeholder="Documento" value={form.idDocument ?? ''} onChange={(e) => setForm((s) => ({ ...s, idDocument: e.target.value }))} />
          <Input placeholder="Dirección" value={form.address ?? ''} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} />
          <Input placeholder="Notas" value={form.notes ?? ''} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteCustomer.isPending}
        title="Eliminar cliente"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
