'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { LogIn, KeyRound, Mail, AlertCircle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('El formato de correo no es válido.'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export default function AdminLogin() {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
        router.replace('/admin');
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (valores) => {
    setErrorGlobal(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: valores.email,
        password: valores.password,
      });
      if (authError) throw authError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

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
      setErrorGlobal(err.message || 'Error inesperado al iniciar sesión.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-slate-900">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>Ayuda Venezuela</span>
          </a>
          <a href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
            ← Volver al portal
          </a>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Icon + Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel de Administración</h1>
            <p className="text-sm text-slate-500">Inicia sesión con tus credenciales de acceso</p>
          </div>

          <Card className="shadow-xl border-slate-200">
            <CardContent className="pt-6 space-y-5">
              {errorGlobal && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2.5 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorGlobal}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(handleLogin)} className="space-y-4" noValidate>
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@correo.com"
                      className="pl-9"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-semibold h-10"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
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

          <p className="text-center text-xs text-slate-400">
            Solo usuarios administradores y moderadores autorizados tienen acceso.
          </p>
        </div>
      </main>
    </div>
  );
}
