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
  type Device,
  type DeviceInput,
  useCreateDevice,
  useDeleteDevice,
  useDeviceCategories,
  useDevices,
  useUpdateDevice,
} from '@/api/devices';
import { useCustomers } from '@/api/customers';
import { PageError, PageLoading } from '@/components/shared/page-states';

const initialForm: DeviceInput = {
  customerId: '',
  categoryId: '',
  brand: '',
  model: '',
  serialNumber: '',
  color: '',
  imei: '',
  notes: '',
  photos: [],
};

export function DevicesPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Device | null>(null);
  const [form, setForm] = useState<DeviceInput>(initialForm);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isError, error } = useDevices(page, limit, search || undefined, customerId || undefined, categoryId || undefined);
  const { data: categories = [] } = useDeviceCategories();
  const { data: customerOptions } = useCustomers(1, 100);
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();

  const devices = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEdit(device: Device) {
    setSelected(device);
    setForm({
      customerId: device.customerId,
      categoryId: device.categoryId,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber ?? '',
      color: device.color ?? '',
      imei: device.imei ?? '',
      notes: device.notes ?? '',
      photos: device.photos ?? [],
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const payload: DeviceInput = {
      ...form,
      serialNumber: form.serialNumber?.trim() ? form.serialNumber.trim() : null,
      color: form.color?.trim() ? form.color.trim() : null,
      imei: form.imei?.trim() ? form.imei.trim() : null,
      notes: form.notes?.trim() ? form.notes.trim() : null,
      photos: form.photos ?? [],
    };

    try {
      if (selected) {
        await updateDevice.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Dispositivo actualizado correctamente.' });
      } else {
        await createDevice.mutateAsync(payload);
        setStatusMessage({ type: 'success', text: 'Dispositivo creado correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible guardar el dispositivo.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteDevice.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Dispositivo eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No fue posible eliminar el dispositivo.';
      setStatusMessage({ type: 'error', text: message });
    }
  }

  if (isLoading) return <PageLoading title="Dispositivos" />;
  if (isError) return <PageError title="Dispositivos" message={error instanceof Error ? error.message : 'No fue posible cargar dispositivos.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Dispositivos</h2>
        <Button type="button" onClick={openCreate}>Nuevo dispositivo</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <Input
              placeholder="Buscar por marca, modelo, serial o IMEI"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                resetToFirstPage();
              }}
            >
              <option value="">Todos los clientes</option>
              {(customerOptions?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                resetToFirstPage();
              }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2 text-left font-medium">Categoría</th>
                  <th className="px-4 py-2 text-left font-medium">Marca / Modelo</th>
                  <th className="px-4 py-2 text-left font-medium">Serial / IMEI</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay dispositivos para mostrar.</td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device.id} className="border-t">
                      <td className="px-4 py-2">{device.customer ? `${device.customer.firstName} ${device.customer.lastName}` : '—'}</td>
                      <td className="px-4 py-2">{device.category?.name ?? '—'}</td>
                      <td className="px-4 py-2">{device.brand} {device.model}</td>
                      <td className="px-4 py-2">{device.serialNumber || device.imei || '—'}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/devices/${device.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(device)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(device); setDeleteOpen(true); }}>Eliminar</Button>
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
        title={selected ? 'Editar dispositivo' : 'Crear dispositivo'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="device-form" disabled={createDevice.isPending || updateDevice.isPending}>
              {createDevice.isPending || updateDevice.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="device-form" onSubmit={handleSubmit} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.customerId} onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value }))} required>
            <option value="">Seleccione cliente</option>
            {(customerOptions?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.categoryId} onChange={(e) => setForm((s) => ({ ...s, categoryId: e.target.value }))} required>
            <option value="">Seleccione categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Marca" value={form.brand} onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))} required />
          <Input placeholder="Modelo" value={form.model} onChange={(e) => setForm((s) => ({ ...s, model: e.target.value }))} required />
          <Input placeholder="Serial" value={form.serialNumber ?? ''} onChange={(e) => setForm((s) => ({ ...s, serialNumber: e.target.value }))} />
          <Input placeholder="IMEI" value={form.imei ?? ''} onChange={(e) => setForm((s) => ({ ...s, imei: e.target.value }))} />
          <Input placeholder="Color" value={form.color ?? ''} onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))} />
          <Input placeholder="Notas" value={form.notes ?? ''} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteDevice.isPending}
        title="Eliminar dispositivo"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
