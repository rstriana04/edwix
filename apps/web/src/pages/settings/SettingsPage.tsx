import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageLoading, PageError } from '@/components/shared/page-states';
import {
  type BusinessProfileInput,
  type LaborRateInput,
  useBusinessProfile,
  useUpdateBusinessProfile,
  useLaborRates,
  useCreateLaborRate,
  useUpdateLaborRate,
  useDeleteLaborRate,
  useGeneralSettings,
  useUpsertSetting,
  useDeleteSetting,
  type LaborRate,
  type SettingEntry,
} from '@/api/settings';
import { useDeviceCategories } from '@/api/devices';

type Tab = 'profile' | 'labor' | 'general';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configuración</h2>

      <div className="flex gap-2">
        {([
          ['profile', 'Perfil del Negocio'],
          ['labor', 'Tarifas de Mano de Obra'],
          ['general', 'Configuración General'],
        ] as [Tab, string][]).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            variant={activeTab === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {activeTab === 'profile' && <BusinessProfileTab />}
      {activeTab === 'labor' && <LaborRatesTab />}
      {activeTab === 'general' && <GeneralSettingsTab />}
    </div>
  );
}

// ── Business Profile Tab ────────────────────────

function BusinessProfileTab() {
  const { data: profile, isLoading, isError, error } = useBusinessProfile();
  const updateProfile = useUpdateBusinessProfile();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<BusinessProfileInput | null>(null);

  if (isLoading) return <PageLoading title="Perfil del negocio" />;
  if (isError) return <PageError title="Perfil del negocio" message={error instanceof Error ? error.message : 'Error al cargar el perfil.'} />;

  const currentForm: BusinessProfileInput = form ?? {
    name: profile?.name ?? '',
    logo: profile?.logo ?? '',
    address: profile?.address ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
    taxId: profile?.taxId ?? '',
    footerText: profile?.footerText ?? '',
    currency: profile?.currency ?? 'COP',
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateProfile.mutateAsync({
        ...currentForm,
        logo: currentForm.logo?.trim() || null,
        address: currentForm.address?.trim() || null,
        phone: currentForm.phone?.trim() || null,
        email: currentForm.email?.trim() || null,
        taxId: currentForm.taxId?.trim() || null,
        footerText: currentForm.footerText?.trim() || null,
      });
      setStatusMessage({ type: 'success', text: 'Perfil actualizado correctamente.' });
      setForm(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible actualizar el perfil.' });
    }
  }

  return (
    <>
      {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}
      <Card>
        <CardHeader><CardTitle>Perfil del Negocio</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-3 max-w-lg">
            <Input placeholder="Nombre del negocio" value={currentForm.name} onChange={(e) => setForm({ ...currentForm, name: e.target.value })} required />
            <Input placeholder="Logo URL" value={currentForm.logo ?? ''} onChange={(e) => setForm({ ...currentForm, logo: e.target.value })} />
            <Input placeholder="Teléfono" value={currentForm.phone ?? ''} onChange={(e) => setForm({ ...currentForm, phone: e.target.value })} />
            <Input placeholder="Email" type="email" value={currentForm.email ?? ''} onChange={(e) => setForm({ ...currentForm, email: e.target.value })} />
            <Input placeholder="Dirección" value={currentForm.address ?? ''} onChange={(e) => setForm({ ...currentForm, address: e.target.value })} />
            <Input placeholder="NIT / RUT" value={currentForm.taxId ?? ''} onChange={(e) => setForm({ ...currentForm, taxId: e.target.value })} />
            <Textarea placeholder="Texto de pie de página" value={currentForm.footerText ?? ''} onChange={(e) => setForm({ ...currentForm, footerText: e.target.value })} />
            <Input placeholder="Moneda" value={currentForm.currency ?? 'COP'} onChange={(e) => setForm({ ...currentForm, currency: e.target.value })} />
            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

// ── Labor Rates Tab ─────────────────────────────

const initialLaborForm: LaborRateInput = { deviceCategoryId: '', description: '', ratePerHour: 0 };

function LaborRatesTab() {
  const { data: rates = [], isLoading, isError, error } = useLaborRates();
  const { data: categories = [] } = useDeviceCategories();
  const createRate = useCreateLaborRate();
  const updateRate = useUpdateLaborRate();
  const deleteRate = useDeleteLaborRate();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LaborRate | null>(null);
  const [form, setForm] = useState<LaborRateInput>(initialLaborForm);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (isLoading) return <PageLoading title="Tarifas" />;
  if (isError) return <PageError title="Tarifas" message={error instanceof Error ? error.message : 'Error al cargar tarifas.'} />;

  function openCreate() {
    setSelected(null);
    setForm(initialLaborForm);
    setModalOpen(true);
  }

  function openEdit(rate: LaborRate) {
    setSelected(rate);
    setForm({
      deviceCategoryId: rate.deviceCategoryId,
      description: rate.description,
      ratePerHour: Number(rate.ratePerHour),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      if (selected) {
        await updateRate.mutateAsync({ id: selected.id, payload: form });
        setStatusMessage({ type: 'success', text: 'Tarifa actualizada correctamente.' });
      } else {
        await createRate.mutateAsync(form);
        setStatusMessage({ type: 'success', text: 'Tarifa creada correctamente.' });
      }
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar la tarifa.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteRate.mutateAsync(selected.id);
      setStatusMessage({ type: 'success', text: 'Tarifa eliminada correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar la tarifa.' });
    }
  }

  return (
    <>
      {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Tarifas de Mano de Obra</CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>Nueva tarifa</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Categoría</th>
                  <th className="px-4 py-2 text-left font-medium">Descripción</th>
                  <th className="px-4 py-2 text-right font-medium">Tarifa/hora</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rates.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No hay tarifas configuradas.</td></tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="border-t">
                      <td className="px-4 py-2">{rate.deviceCategory?.name ?? '—'}</td>
                      <td className="px-4 py-2">{rate.description}</td>
                      <td className="px-4 py-2 text-right">{Number(rate.ratePerHour).toLocaleString('es-CO')}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(rate)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(rate); setDeleteOpen(true); }}>Eliminar</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar tarifa' : 'Nueva tarifa'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="labor-form" disabled={createRate.isPending || updateRate.isPending}>
              {createRate.isPending || updateRate.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="labor-form" onSubmit={handleSubmit} className="grid gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={form.deviceCategoryId}
            onChange={(e) => setForm((s) => ({ ...s, deviceCategoryId: e.target.value }))}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Input placeholder="Descripción" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} required />
          <Input type="number" placeholder="Tarifa por hora" value={String(form.ratePerHour)} onChange={(e) => setForm((s) => ({ ...s, ratePerHour: Number(e.target.value) }))} min={0} required />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteRate.isPending}
        title="Eliminar tarifa"
        description="Esta acción no se puede deshacer."
      />
    </>
  );
}

// ── General Settings Tab ────────────────────────

function GeneralSettingsTab() {
  const { data: allSettings = [], isLoading, isError, error } = useGeneralSettings();
  const upsertSetting = useUpsertSetting();
  const deleteSetting = useDeleteSetting();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<SettingEntry | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formValue, setFormValue] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (isLoading) return <PageLoading title="Configuración general" />;
  if (isError) return <PageError title="Configuración general" message={error instanceof Error ? error.message : 'Error al cargar configuración.'} />;

  // Filter out auto-numbering sequence keys
  const settings = allSettings.filter((s) => !s.key.includes('_seq_'));

  function openCreate() {
    setSelected(null);
    setFormKey('');
    setFormValue('');
    setModalOpen(true);
  }

  function openEdit(setting: SettingEntry) {
    setSelected(setting);
    setFormKey(setting.key);
    setFormValue(setting.value);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await upsertSetting.mutateAsync({ key: formKey.trim(), value: formValue.trim() });
      setStatusMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
      setModalOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible guardar la configuración.' });
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setStatusMessage(null);
    try {
      await deleteSetting.mutateAsync(selected.key);
      setStatusMessage({ type: 'success', text: 'Configuración eliminada correctamente.' });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err instanceof Error ? err.message : 'No fue posible eliminar la configuración.' });
    }
  }

  return (
    <>
      {statusMessage && <Alert variant={statusMessage.type}>{statusMessage.text}</Alert>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Configuración General</CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>Nueva configuración</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Clave</th>
                  <th className="px-4 py-2 text-left font-medium">Valor</th>
                  <th className="px-4 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {settings.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No hay configuraciones.</td></tr>
                ) : (
                  settings.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs">{s.key}</td>
                      <td className="px-4 py-2">{s.value}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => { setSelected(s); setDeleteOpen(true); }}>Eliminar</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? 'Editar configuración' : 'Nueva configuración'}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="setting-form" disabled={upsertSetting.isPending}>
              {upsertSetting.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <form id="setting-form" onSubmit={handleSubmit} className="grid gap-3">
          <Input placeholder="Clave" value={formKey} onChange={(e) => setFormKey(e.target.value)} required disabled={!!selected} />
          <Input placeholder="Valor" value={formValue} onChange={(e) => setFormValue(e.target.value)} required />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteSetting.isPending}
        title="Eliminar configuración"
        description="Esta acción no se puede deshacer."
      />
    </>
  );
}
