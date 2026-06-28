'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Globe, Users, LogOut, ShieldAlert,
  Loader2, Menu, X, ArrowLeft, Tags
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, setCargando] = useState(true);
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const esPaginaLogin = pathname === '/admin/login';

  useEffect(() => {
    if (esPaginaLogin) {
      setCargando(false);
      return;
    }

    async function validarAcceso() {
      try {
        const { data: { session: activeSession } } = await supabase.auth.getSession();
        
        if (!activeSession) {
          router.replace('/admin/login');
          return;
        }

        setSession(activeSession);

        // Consultar el perfil
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeSession.user.id)
          .single();

        if (profileError || !profileData || (profileData.role !== 'admin' && profileData.role !== 'moderator')) {
          // Desconectar si no es admin ni moderator
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }

        setPerfil(profileData);
      } catch (err) {
        console.error('Error al validar acceso administrativo:', err);
        router.replace('/admin/login');
      } finally {
        setCargando(false);
      }
    }

    validarAcceso();

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setPerfil(null);
        router.replace('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [esPaginaLogin, router]);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  // Si estamos cargando la validación de sesión
  if (cargando && !esPaginaLogin) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <p className="text-zinc-500 font-medium text-sm tracking-wide">Validando credenciales de acceso...</p>
      </div>
    );
  }

  // Si es la página de login, renderizamos directamente sin envolver en sidebar
  if (esPaginaLogin) {
    return <>{children}</>;
  }

  const enlaces = [
    { nombre: 'Dashboard', url: '/admin', icono: LayoutDashboard },
    { nombre: 'Directorio', url: '/admin/directories', icono: Globe },
    { nombre: 'Categorías', url: '/admin/categories', icono: Tags },
  ];

  // Solo mostrar la sección de usuarios si es rol admin
  if (perfil?.role === 'admin') {
    enlaces.push({ nombre: 'Usuarios / Roles', url: '/admin/users', icono: Users });
  }

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0d0d11]/80 backdrop-blur-xl border-r border-zinc-900/60 p-5">
      {/* Encabezado Sidebar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-pulse"></div>
          <span className="text-sm font-black text-white uppercase tracking-wider">SOS Vzla Admin</span>
        </div>
        <button 
          onClick={() => setMenuMovilAbierto(false)} 
          className="lg:hidden p-1 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Enlaces de Navegación */}
      <nav className="space-y-1.5 flex-1">
        {enlaces.map((enlace) => {
          const Icono = enlace.icono;
          const activo = pathname === enlace.url;
          return (
            <button
              key={enlace.url}
              onClick={() => {
                setMenuMovilAbierto(false);
                router.push(enlace.url);
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs lg:text-sm font-semibold w-full text-left transition-all duration-200 ${
                activo
                  ? 'bg-zinc-900/40 text-cyan-400 border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.06)]'
                  : 'bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
              }`}
            >
              <Icono className={`h-4.5 w-4.5 ${activo ? 'text-cyan-400' : 'text-zinc-500'}`} />
              <span>{enlace.nombre}</span>
            </button>
          );
        })}
      </nav>

      {/* Perfil de Usuario y Logout */}
      <div className="pt-4 border-t border-zinc-900/80 space-y-4">
        <div className="bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-zinc-950 font-black text-sm uppercase">
            {perfil?.email?.slice(0, 2) || 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{perfil?.email}</p>
            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
              perfil?.role === 'admin' 
                ? 'text-cyan-400 bg-cyan-400/10 border border-cyan-500/10' 
                : 'text-amber-400 bg-amber-400/10 border border-amber-500/10'
            }`}>
              {perfil?.role === 'admin' ? 'Administrador' : 'Moderador'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleCerrarSesion}
          className="flex items-center justify-center gap-2.5 w-full bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Sidebar de escritorio */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="h-screen sticky top-0">
          {renderSidebarContent()}
        </div>
      </aside>

      {/* Sidebar móvil deslizante */}
      {menuMovilAbierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setMenuMovilAbierto(false)}></div>
          <aside className="relative w-64 max-w-xs h-full z-10 animate-in slide-in-from-left duration-300">
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabecera Móvil */}
        <header className="lg:hidden flex items-center justify-between bg-[#0d0d11]/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 sticky top-0 z-40">
          <button 
            onClick={() => setMenuMovilAbierto(true)} 
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">SOS Vzla Admin</span>
          <div className="h-8.5 w-8.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 text-xs font-bold">
            {perfil?.email?.slice(0, 1).toUpperCase() || 'A'}
          </div>
        </header>

        {/* Zona de contenido */}
        <main className="p-4 lg:p-8 flex-1 relative overflow-auto max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <a 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-cyan-400 font-semibold transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al Portal Público
            </a>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
