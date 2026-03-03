import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAddTicketNote, useDeleteTicket, useTicketById, useTicketStatuses, useUpdateTicket } from '@/api/tickets';
import { PageError, PageLoading } from '@/components/shared/page-states';

export function TicketDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: ticket, isLoading, isError, error } = useTicketById(id, true);
  const { data: statuses = [] } = useTicketStatuses();
  const updateTicket = useUpdateTicket();
  const addNote = useAddTicketNote();
  const deleteTicket = useDeleteTicket();

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [reportedFault, setReportedFault] = useState('');
  const [statusId, setStatusId] = useState('');
  const [note, setNote] = useState('');

  if (isLoading) return <PageLoading title="Detalle de ticket" />;
  if (isError || !ticket) return <PageError title="Detalle de ticket" message={error instanceof Error ? error.message : 'No fue posible cargar el ticketData.'} />;

  const ticketData = ticket;

  function openEdit() {
    setReportedFault(ticketData.reportedFault);
    setStatusId(ticketData.statusId);
    setModalOpen(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateTicket.mutateAsync({
        id: ticketData.id,
        payload: {
          reportedFault,
          statusId,
        },
      });
      setStatusMessage({ type: 'success', text: 'Ticket actualizado correctamente.' });
      setModalOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar el ticketData.' });
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await addNote.mutateAsync({ ticketId: ticketData.id, content: note, isPublic: false });
      setStatusMessage({ type: 'success', text: 'Nota registrada correctamente.' });
      setNote('');
      setNoteOpen(false);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible registrar la nota.' });
    }
  }

  async function handleDelete() {
    setStatusMessage(null);
    try {
      await deleteTicket.mutateAsync(ticketData.id);
      navigate('/tickets');
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar el ticketData.' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Detalle de ticket</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>Volver</Button>
          <Button type="button" variant="outline" onClick={() => setNoteOpen(true)}>Agregar nota</Button>
          <Button type="button" variant="outline" onClick={openEdit}>Editar</Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>Eliminar</Button>
        </div>
      </div>

      {statusMessage ? <Alert variant={statusMessage.type}>{statusMessage.text}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>{ticketData.ticketNumber}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <p><span className="font-medium">Cliente:</span> {ticketData.customer ? `${ticketData.customer.firstName} ${ticketData.customer.lastName}` : '—'}</p>
          <p><span className="font-medium">Dispositivo:</span> {ticketData.device ? `${ticketData.device.brand} ${ticketData.device.model}` : '—'}</p>
          <p><span className="font-medium">Estado:</span> {ticketData.status?.name ?? '—'}</p>
          <p><span className="font-medium">Falla reportada:</span> {ticketData.reportedFault}</p>
          <p><span className="font-medium">Accesorios:</span> {(ticketData.accessoriesReceived ?? []).join(', ') || '—'}</p>
          <p><span className="font-medium">Código público:</span> {ticketData.publicAccessCode}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            {(ticketData.notes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay notas registradas.</p>
            ) : (
              <div className="space-y-3">
                {ticketData.notes?.map((n) => (
                  <div key={n.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{n.user.firstName} {n.user.lastName}</p>
                    <p>{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de estado</CardTitle>
          </CardHeader>
          <CardContent>
            {(ticketData.statusChanges ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay cambios de estado.</p>
            ) : (
              <div className="space-y-3">
                {ticketData.statusChanges?.map((change) => (
                  <div key={change.id} className="rounded-md border p-3 text-sm">
                    <p>{change.fromStatus?.name ?? 'Inicial'} → {change.toStatus.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(change.createdAt).toLocaleString('es-CO')}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Editar ticket"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="ticket-edit-form" disabled={updateTicket.isPending}>{updateTicket.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        }
      >
        <form id="ticket-edit-form" onSubmit={handleEdit} className="grid gap-3">
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={statusId} onChange={(e) => setStatusId(e.target.value)} required>
            <option value="">Seleccione estado</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <Input placeholder="Falla reportada" value={reportedFault} onChange={(e) => setReportedFault(e.target.value)} required />
        </form>
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Agregar nota"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setNoteOpen(false)}>Cancelar</Button>
            <Button type="submit" form="ticket-note-form" disabled={addNote.isPending}>{addNote.isPending ? 'Guardando...' : 'Guardar nota'}</Button>
          </div>
        }
      >
        <form id="ticket-note-form" onSubmit={handleAddNote} className="grid gap-3">
          <Textarea placeholder="Escriba la nota" value={note} onChange={(e) => setNote(e.target.value)} required />
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
