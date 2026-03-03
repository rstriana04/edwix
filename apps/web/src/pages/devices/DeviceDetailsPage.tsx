import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  type DeviceInput,
  useCreateDevice,
  useDeleteDevice,
  useDeviceById,
  useDeviceCategories,
  useUpdateDevice,
} from '@/api/devices';
import { useCustomers } from '@/api/customers';
import { PageError, PageLoading } from '@/components/shared/page-states';

export function DeviceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: device, isLoading, isError, error } = useDeviceById(id);
  const { data: categories = [] } = useDeviceCategories();
  const { data: customerOptions } = useCustomers(1, 100);
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const createDevice = useCreateDevice();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<DeviceInput>({
    customerId: '',
    categoryId: '',
    brand: '',
    model: '',
    serialNumber: '',
    color: '',
    imei: '',
    notes: '',
    photos: [],
  });

  if (isLoading) return <PageLoading title="Detalle de dispositivo" />;
  if (isError || !device) return <PageError title="Detalle de dispositivo" message={error instanceof Error ? error.message : 'No fue posible cargar el dispositivo.'} />;

  const deviceData = device;

  function openEdit() {
    setForm({
      customerId: deviceData.customerId,
      categoryId: deviceData.categoryId,
      brand: deviceData.brand,
      model: deviceData.model,
      serialNumber: deviceData.serialNumber ?? '',
      color: deviceData.color ?? '',
      imei: deviceData.imei ?? '',
      notes: deviceData.notes ?? '',
      photos: deviceData.photos ?? [],
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateDevice.mutateAsync({
        id: deviceData.id,
        payload: {
          ...form,
          serialNumber: form.serialNumber?.trim() ? form.serialNumber.trim() : null,
          color: form.color?.trim() ? form.color.trim() : null,
          imei: form.imei?.trim() ? form.imei.trim() : null,
          notes: form.notes?.trim() ? form.notes.trim() : null,
        },
      });
      setStatusMessage({ type: 'success', text: 'Dispositivo actualizado correctamente.' });
      setModalOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deleteDevice.mutateAsync(deviceData.id);
      navigate('/devices');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de dispositivo</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/devices')}>Volver</Button>
          <Button type="button" variant="outline" onClick={openEdit}>Editar</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{deviceData.brand} {deviceData.model}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Cliente:</span> {deviceData.customer ? `${deviceData.customer.firstName} ${deviceData.customer.lastName}` : '—'}</p>
          <p><span className="font-medium">Categoría:</span> {deviceData.category?.name ?? '—'}</p>
          <p><span className="font-medium">Serial:</span> {deviceData.serialNumber ?? '—'}</p>
          <p><span className="font-medium">IMEI:</span> {deviceData.imei ?? '—'}</p>
          <p><span className="font-medium">Color:</span> {deviceData.color ?? '—'}</p>
          <p><span className="font-medium">Notas:</span> {deviceData.notes ?? '—'}</p>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar dispositivo"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="device-edit-form" disabled={updateDevice.isPending || createDevice.isPending}>{updateDevice.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        <form id="device-edit-form" onSubmit={handleSubmit} className="grid gap-3">
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
