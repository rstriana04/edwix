import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePagination } from '@/hooks/use-pagination';
import {
  type Customer,
  type CustomerInput,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/api/customers';
import { PageError, PageLoading } from '@/components/shared/page-states';

const initialForm: CustomerInput = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  idDocument: '',
  address: '',
  notes: '',
};

export function CustomersPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, next, prev } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(initialForm);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError, error } = useCustomers(page, limit, search || undefined);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const customers = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
  const isEditing = useMemo(() => Boolean(selected), [selected]);

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setSelected(customer);
    setForm({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email ?? '',
      idDocument: customer.idDocument ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setModalOpen(true);
  }

  function openDelete(customer: Customer) {
    setSelected(customer);
    setDeleteOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    const payload: CustomerInput = {
      ...form,
      email: form.email?.trim() ? form.email.trim() : null,
      idDocument: form.idDocument?.trim() ? form.idDocument.trim() : null,
      address: form.address?.trim() ? form.address.trim() : null,
      notes: form.notes?.trim() ? form.notes.trim() : null,
    };

    try {
      if (selected) {
        await updateCustomer.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Cliente actualizado correctamente.' });
      } else {
        await createCustomer.mutateAsync(payload);
        setStatusMessage({ type: 'success', text: 'Cliente creado correctamente.' });
      }
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible guardar el cliente.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteCustomer.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Cliente eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible eliminar el cliente.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  if (isLoading) return <PageLoading title="Clientes" />;
  if (isError) return <PageError title="Clientes" message={error instanceof Error ? error.message : 'No fue posible cargar clientes.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <Button type="button" onClick={openCreate}>Nuevo cliente</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
          <Input
            placeholder="Buscar por nombre, teléfono o correo"
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
                  <th className="px-4 py-2 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-2 text-left font-medium">Correo</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No hay clientes para mostrar.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="border-t">
                      <td className="px-4 py-2">{customer.firstName} {customer.lastName}</td>
                      <td className="px-4 py-2">{customer.phone}</td>
                      <td className="px-4 py-2">{customer.email ?? '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/customers/${customer.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(customer)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => openDelete(customer)}>Eliminar</Button>
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
        onClose={closeModal}
        title={isEditing ? 'Editar cliente' : 'Crear cliente'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" form="customer-form" disabled={createCustomer.isPending || updateCustomer.isPending}>
              {createCustomer.isPending || updateCustomer.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="grid gap-3">
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
        description={`Esta acción eliminará a ${selected?.firstName ?? ''} ${selected?.lastName ?? ''}.`}
      />
    </div>
  );
}
