'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, KeyRound, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single();
      if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
        router.replace('/admin');
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        throw new Error('No se encontró un perfil administrativo para esta cuenta.');
      }
      if (profile.role !== 'admin' && profile.role !== 'moderator') {
        await supabase.auth.signOut();
        throw new Error('Acceso restringido. No tienes permisos para el panel de administración.');
      }
      router.replace('/admin');
    } catch (err) {
      setError(err.message || 'Error inesperado al iniciar sesión.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground flex flex-col justify-between">
      {/* Cabecera */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
            <span>Ayuda Venezuela</span>
          </a>
          <a href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            ← Volver al portal
          </a>
        </div>
      </header>

      {/* Tarjeta de login central */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Iniciar Sesión</h1>
            <p className="text-sm text-muted-foreground">
              Accede al panel de administración del directorio.
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      placeholder="admin@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contraseña
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={cargando}
                  className="w-full font-bold mt-2"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Ingresar al Panel</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Nota inferior */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border bg-card">
        Solo usuarios administradores y moderadores autorizados tienen acceso.
      </footer>
    </div>
  );
}
