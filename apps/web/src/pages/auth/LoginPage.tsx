import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
              ?.error?.message || 'No fue posible iniciar sesion';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left column — brand panel (hidden on mobile) */}
      <div
        className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #0c1a3a 0%, #060d1f 60%, #020713 100%)',
        }}
      >
        {/* Subtle glow effect behind logo */}
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, #00a8ff 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-col items-center px-12">
          <img
            src="/logo-edwix.jpeg"
            alt="Alexis PC Movil"
            className="w-72 h-72 object-contain rounded-2xl shadow-2xl"
            style={{
              boxShadow: '0 0 60px rgba(0, 168, 255, 0.15), 0 25px 50px rgba(0, 0, 0, 0.4)',
            }}
          />
          <p className="mt-8 text-center text-sm tracking-wide" style={{ color: '#5b9bd5' }}>
            Sistema de gestion para taller
          </p>
        </div>
      </div>

      {/* Right column — login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo (visible only on small screens) */}
          <div className="flex flex-col items-center lg:hidden">
            <img
              src="/logo-edwix.jpeg"
              alt="Alexis PC Movil"
              className="w-20 h-20 object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Iniciar sesion</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Correo
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@edwix.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contrasena
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Ingrese su contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold"
              disabled={loading}
              style={{
                background: loading ? undefined : 'linear-gradient(135deg, #0066cc 0%, #00a8ff 100%)',
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Alexis PC Movil &mdash; Soluciones electronicas con energia
          </p>
        </div>
      </div>
    </div>
  );
}
