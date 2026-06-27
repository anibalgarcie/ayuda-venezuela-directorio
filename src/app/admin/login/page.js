'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, KeyRound, Mail, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Redirigir al dashboard si ya hay una sesión activa
  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Verificar si tiene perfil admin/moderator
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
          router.replace('/admin');
        }
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      // 1. Iniciar sesión
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Verificar rol en la tabla de perfiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        // Si no hay perfil o da error, cerramos sesión inmediatamente
        await supabase.auth.signOut();
        throw new Error('No se encontró un perfil administrativo asignado a esta cuenta.');
      }

      if (profile.role !== 'admin' && profile.role !== 'moderator') {
        await supabase.auth.signOut();
        throw new Error('Acceso restringido. No tienes permisos para ingresar al panel de administración.');
      }

      // Redirigir al panel si todo es correcto
      router.replace('/admin');
    } catch (err) {
      setError(err.message || 'Error inesperado al iniciar sesión.');
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Círculos decorativos de fondo con difuminado */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3.5 bg-cyan-950/60 border border-cyan-500/30 rounded-2xl text-cyan-400 mb-4 shadow-inner">
            <KeyRound className="h-6 w-6 stroke-[2]" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Panel de Control
          </h2>
          <p className="text-zinc-500 text-xs lg:text-sm mt-1.5 font-medium">
            Inicia sesión para gestionar el directorio y los accesos
          </p>
        </div>

        {/* Alerta de Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-start gap-3 text-xs lg:text-sm leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@correo.com"
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-3 text-sm lg:text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl pl-11 pr-4 py-3 text-sm lg:text-[15px] text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-extrabold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(34,211,238,0.15)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base mt-2"
          >
            {cargando ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <LogIn className="h-5 w-5 stroke-[2]" />
                <span>Ingresar al Panel</span>
              </>
            )}
          </button>
        </form>

        {/* Volver a la web */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-zinc-500 hover:text-cyan-400 font-semibold transition-colors duration-200"
          >
            ← Volver al Directorio Público
          </a>
        </div>
      </div>
    </div>
  );
}
