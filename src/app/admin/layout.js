'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Globe, Users, LogOut, LoaderCircle, Menu, X, ArrowLeft, Tags, Moon, Sun, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [cargando, setCargando] = useState(true);
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [darkMode, setDarkMode] = useState(true); // Default dark mode for admin

  const esPaginaLogin = pathname === '/admin/login';

  // Apply dark mode theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

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
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <LoaderCircle className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium text-sm tracking-wide">Validando credenciales de acceso...</p>
      </div>
    );
  }

  if (esPaginaLogin) {
    return <>{children}</>;
  }

  const enlaces = [
    { nombre: 'Dashboard', url: '/admin', icono: LayoutDashboard },
    { nombre: 'Directorio', url: '/admin/directories', icono: Globe },
    { nombre: 'Categorías', url: '/admin/categories', icono: Tags },
  ];

  if (perfil?.role === 'admin') {
    enlaces.push({ nombre: 'Usuarios / Roles', url: '/admin/users', icono: Users });
  }

  // Generate breadcrumbs from path
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const url = `/${segments.slice(0, index + 1).join('/')}`;
      const isLast = index === segments.length - 1;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === 'admin') label = 'Admin';
      if (segment === 'directories') label = 'Directorio';
      if (segment === 'categories') label = 'Categorías';
      if (segment === 'users') label = 'Usuarios';

      return { label, url, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border p-5 text-card-foreground">
      {/* Encabezado Sidebar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-sm font-black uppercase tracking-wider">SOS Vzla Admin</span>
        </div>
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setMenuMovilAbierto(false)} 
          className="lg:hidden h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Enlaces de Navegación */}
      <nav className="space-y-1.5 flex-1">
        {enlaces.map((enlace) => {
          const Icono = enlace.icono;
          const activo = pathname === enlace.url;
          return (
            <Button
              key={enlace.url}
              variant={activo ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 text-sm font-semibold transition-all ${
                activo ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => {
                setMenuMovilAbierto(false);
                router.push(enlace.url);
              }}
            >
              <Icono className="h-4 w-4" />
              <span>{enlace.nombre}</span>
            </Button>
          );
        })}
      </nav>

      {/* Perfil de Usuario y Logout */}
      <div className="pt-4 border-t border-border space-y-4">
        {/* Theme Toggle & Back Button */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="flex-1 justify-center gap-2"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Tema</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 justify-center gap-2"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Público</span>
          </Button>
        </div>

        <div className="border border-border rounded-xl p-3 flex items-center gap-3 bg-muted/40">
          <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm uppercase">
            {perfil?.email?.slice(0, 2) || 'AD'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate">{perfil?.email}</p>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {perfil?.role === 'admin' ? 'Administrador' : 'Moderador'}
            </span>
          </div>
        </div>

        <Button 
          variant="destructive"
          onClick={handleCerrarSesion}
          className="w-full gap-2 text-xs font-bold"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesión</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
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
        <header className="lg:hidden flex items-center justify-between bg-card border-b border-border px-4 py-3 sticky top-0 z-40">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMenuMovilAbierto(true)} 
            className="h-9 w-9 text-muted-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-xs font-extrabold uppercase tracking-wider">SOS Vzla Admin</span>
          <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-primary text-xs font-bold">
            {perfil?.email?.slice(0, 1).toUpperCase() || 'A'}
          </div>
        </header>

        {/* Zona de contenido */}
        <main className="p-4 lg:p-8 flex-1 relative overflow-auto max-w-7xl mx-auto w-full">
          {/* Breadcrumbs Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.url} className="flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.isLast ? (
                  <span className="font-semibold text-foreground">{crumb.label}</span>
                ) : (
                  <span 
                    onClick={() => router.push(crumb.url)}
                    className="hover:text-foreground cursor-pointer transition-colors"
                  >
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>

          {children}
        </main>
      </div>
    </div>
  );
}
