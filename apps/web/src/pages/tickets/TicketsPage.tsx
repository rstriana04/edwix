import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { usePagination } from '@/hooks/use-pagination';
import {
  type Ticket,
  type TicketInput,
  type TicketUpdateInput,
  useCreateTicket,
  useDeleteTicket,
  useTicketStatuses,
  useTickets,
  useUpdateTicket,
} from '@/api/tickets';
import { useCustomers } from '@/api/customers';
import { useDevices } from '@/api/devices';
import { PageError, PageLoading } from '@/components/shared/page-states';

const initialForm: TicketInput = {
  customerId: '',
  deviceId: '',
  assignedTechnicianId: null,
  reportedFault: '',
  accessoriesReceived: [],
  preExistingDamage: '',
  damagePhotos: [],
  estimatedDeliveryDate: null,
};

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('No fue posible procesar la imagen.'));
      }
    };
    reader.onerror = () => reject(new Error('No fue posible procesar la imagen.'));
    reader.readAsDataURL(file);
  });
}

export function TicketsPage() {
  const navigate = useNavigate();
  const { page, limit, resetToFirstPage, prev, next } = usePagination(1, 10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [form, setForm] = useState<TicketInput>(initialForm);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessories, setAccessories] = useState('');
  const [existingDamagePhotos, setExistingDamagePhotos] = useState<string[]>([]);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState<File[]>([]);

  const { data, isLoading, isError, error } = useTickets(page, limit, search || undefined, statusFilter ? { statusId: statusFilter } : undefined);
  const { data: statuses = [] } = useTicketStatuses();
  const { data: customersData } = useCustomers(1, 100);
  const { data: devicesData } = useDevices(1, 100);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const tickets = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
  const isEditing = useMemo(() => Boolean(selected), [selected]);
  const filteredDevices = useMemo(() => {
    if (!form.customerId) return devicesData?.data ?? [];
    return (devicesData?.data ?? []).filter((d) => d.customerId === form.customerId);
  }, [devicesData?.data, form.customerId]);

  function openCreate() {
    setSelected(null);
    setForm(initialForm);
    setAccessories('');
    setExistingDamagePhotos([]);
    setSelectedPhotoFiles([]);
    setModalOpen(true);
  }

  function openEdit(ticket: Ticket) {
    setSelected(ticket);
    setForm({
      customerId: ticket.customerId,
      deviceId: ticket.deviceId,
      assignedTechnicianId: ticket.assignedTechnicianId ?? null,
      reportedFault: ticket.reportedFault,
      accessoriesReceived: ticket.accessoriesReceived ?? [],
      preExistingDamage: ticket.preExistingDamage ?? '',
      damagePhotos: ticket.damagePhotos ?? [],
      estimatedDeliveryDate: ticket.estimatedDeliveryDate ?? null,
    });
    setAccessories((ticket.accessoriesReceived ?? []).join(', '));
    setExistingDamagePhotos(ticket.damagePhotos ?? []);
    setSelectedPhotoFiles([]);
    setModalOpen(true);
  }

  async function handlePhotoSelection(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const maxAllowed = 5 - existingDamagePhotos.length;
    if (files.length > maxAllowed) {
      setStatusMessage({
        type: 'error',
        text: `Solo puedes adjuntar hasta 5 fotos por ticket. Disponibles: ${Math.max(maxAllowed, 0)}.`,
      });
      e.target.value = '';
      return;
    }
    setStatusMessage(null);
    setSelectedPhotoFiles(files);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    const newDamagePhotos = await Promise.all(selectedPhotoFiles.map((f) => fileToDataUrl(f)));
    const allDamagePhotos = [...existingDamagePhotos, ...newDamagePhotos];

    if (allDamagePhotos.length > 5) {
      setStatusMessage({
        type: 'error',
        text: 'Solo se permiten 5 fotos por ticket.',
      });
      return;
    }

    const payloadBase: TicketInput = {
      ...form,
      accessoriesReceived: accessories
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      damagePhotos: allDamagePhotos,
      preExistingDamage: form.preExistingDamage?.trim() ? form.preExistingDamage.trim() : null,
      estimatedDeliveryDate: form.estimatedDeliveryDate || null,
    };

    try {
      if (selected) {
        const payload: TicketUpdateInput = payloadBase;
        await updateTicket.mutateAsync({ id: selected.id, payload });
        setStatusMessage({ type: 'success', text: 'Ticket actualizado correctamente.' });
      } else {
        await createTicket.mutateAsync(payloadBase);
        setStatusMessage({ type: 'success', text: 'Ticket creado correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
      setSelectedPhotoFiles([]);
      setExistingDamagePhotos([]);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar el ticket.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteTicket.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Ticket eliminado correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el ticket.' });
    }
  }

  if (isLoading) return <PageLoading title="Tickets" />;
  if (isError) return <PageError title="Tickets" message={error instanceof Error ? error.message : 'No fue posible cargar tickets.'} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Tickets</h2>
        <Button type="button" onClick={openCreate}>Nuevo ticket</Button>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 pb-2">
          <CardTitle className="text-lg">Listado</CardTitle>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              placeholder="Buscar por ticket, cliente o dispositivo"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetToFirstPage();
              }}
            >
              <option value="">Todos los estados</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Número</th>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2 text-left font-medium">Dispositivo</th>
                  <th className="px-4 py-2 text-left font-medium">Estado</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No hay tickets para mostrar.</td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{ticket.ticketNumber}</td>
                      <td className="px-4 py-2">{ticket.customer ? `${ticket.customer.firstName} ${ticket.customer.lastName}` : '—'}</td>
                      <td className="px-4 py-2">{ticket.device ? `${ticket.device.brand} ${ticket.device.model}` : '—'}</td>
                      <td className="px-4 py-2">
                        {ticket.status ? (
                          <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${ticket.status.color}20`, color: ticket.status.color }}>
                            {ticket.status.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/tickets/${ticket.id}`)}>Ver</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(ticket)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(ticket); setDeleteOpen(true); }}>Eliminar</Button>
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
        title={isEditing ? 'Editar ticket' : 'Crear ticket'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="ticket-form" disabled={createTicket.isPending || updateTicket.isPending}>
              {createTicket.isPending || updateTicket.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="ticket-form" onSubmit={handleSubmit} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.customerId} onChange={(e) => setForm((s) => ({ ...s, customerId: e.target.value, deviceId: '' }))} required>
            <option value="">Seleccione cliente</option>
            {(customersData?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.deviceId} onChange={(e) => setForm((s) => ({ ...s, deviceId: e.target.value }))} required>
            <option value="">Seleccione dispositivo</option>
            {filteredDevices.map((d) => (
              <option key={d.id} value={d.id}>{d.brand} {d.model}</option>
            ))}
          </select>
          <Input placeholder="Falla reportada" value={form.reportedFault} onChange={(e) => setForm((s) => ({ ...s, reportedFault: e.target.value }))} required />
          <Input placeholder="Accesorios (separados por coma)" value={accessories} onChange={(e) => setAccessories(e.target.value)} />
          <Input placeholder="Daños previos" value={form.preExistingDamage ?? ''} onChange={(e) => setForm((s) => ({ ...s, preExistingDamage: e.target.value }))} />
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fotos de daño (máximo 5)</label>
            <Input type="file" accept="image/*" multiple onChange={handlePhotoSelection} />
            <p className="text-xs text-muted-foreground">
              {existingDamagePhotos.length} existentes + {selectedPhotoFiles.length} nuevas.
            </p>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Fecha estimada de entrega</label>
            <Input
              type="date"
              value={form.estimatedDeliveryDate ? form.estimatedDeliveryDate.slice(0, 10) : ''}
              onChange={(e) => setForm((s) => ({ ...s, estimatedDeliveryDate: e.target.value || null }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteTicket.isPending}
        title="Eliminar ticket"
        description="Esta acción no se puede deshacer."
      />
    </div>
  );
}
