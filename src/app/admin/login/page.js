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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

// Schema validation using Zod
const loginSchema = z.object({
  email: z.string().min(1, { message: 'El correo electrónico es requerido.' }).email({ message: 'El formato de correo no es válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

export default function AdminLogin() {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState(null);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
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
    setCargando(true);
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
              {errorGlobal && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-2.5 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorGlobal}</span>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4" noValidate>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="admin@correo.com"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={cargando}
                    className="w-full font-bold mt-2"
                  >
                    {cargando ? (
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
              </Form>
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
