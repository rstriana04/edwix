import { Alert } from '@/components/ui/alert';

export function PageLoading({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="text-muted-foreground">Cargando...</div>
    </div>
  );
}

export function PageError({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Alert variant="error">{message}</Alert>
    </div>
  );
}
