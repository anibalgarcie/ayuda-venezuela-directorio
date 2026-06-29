'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// ── Inline SVGs ───────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
  </svg>
);
const IconTags = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l4.58-4.58a2.426 2.426 0 0 0 0-3.42z"/>
    <circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconLoader = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#003cc3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
  </svg>
);
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
  </svg>
);
const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
);
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { nombre: 'Dashboard',       url: '/admin',              Icon: IconDashboard },
  { nombre: 'Directorio',      url: '/admin/directories',  Icon: IconGlobe },
  { nombre: 'Categorías',      url: '/admin/categories',   Icon: IconTags },
];

export default function AdminLayout({ children }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [cargando,   setCargando]   = useState(true);
  const [perfil,     setPerfil]     = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [darkMode,   setDarkMode]   = useState(false);

  const esPaginaLogin = pathname === '/admin/login';

  // Dark mode toggle
  useEffect(() => {
    const root = window.document.documentElement;
    darkMode ? root.classList.add('dark') : root.classList.remove('dark');
  }, [darkMode]);

  // Auth guard
  useEffect(() => {
    if (esPaginaLogin) { setCargando(false); return; }

    async function validarAcceso() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/admin/login'); return; }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles').select('*').eq('id', session.user.id).single();

        if (profileError || !profileData || !['admin', 'moderator'].includes(profileData.role)) {
          await supabase.auth.signOut();
          router.replace('/admin/login');
          return;
        }
        setPerfil(profileData);
      } catch {
        router.replace('/admin/login');
      } finally {
        setCargando(false);
      }
    }

    validarAcceso();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') { setPerfil(null); router.replace('/admin/login'); }
    });
    return () => subscription.unsubscribe();
  }, [esPaginaLogin, router]);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  const breadcrumbs = pathname.split('/').filter(Boolean).map((seg, i, arr) => {
    const labels = { admin: 'Admin', directories: 'Directorio', categories: 'Categorías', users: 'Usuarios' };
    return { label: labels[seg] || (seg.charAt(0).toUpperCase() + seg.slice(1)), url: '/' + arr.slice(0, i + 1).join('/'), isLast: i === arr.length - 1 };
  });

  // ── Sidebar nav links (add users for admin) ──────────────────────────────────
  const enlaces = perfil?.role === 'admin'
    ? [...NAV_LINKS, { nombre: 'Usuarios / Roles', url: '/admin/users', Icon: IconUsers }]
    : NAV_LINKS;

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (cargando && !esPaginaLogin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f8fafc' }}>
        <IconLoader />
        <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500', letterSpacing: '0.02em' }}>Validando credenciales de acceso...</p>
      </div>
    );
  }

  if (esPaginaLogin) return <>{children}</>;

  // ── Sidebar content ──────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', borderRight: '1px solid #f1f5f9', padding: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#003cc3', animation: 'pulse2 2s infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>SOS Vzla Admin</span>
        </div>
        {/* Close btn (mobile only) */}
        <button
          onClick={() => setMenuAbierto(false)}
          className="lg:hidden"
          style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b', display: 'flex' }}
        >
          <IconX />
        </button>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {enlaces.map(({ nombre, url, Icon }) => {
          const activo = pathname === url;
          return (
            <button
              key={url}
              onClick={() => { setMenuAbierto(false); router.push(url); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '12px', border: 'none',
                background: activo ? '#eff4ff' : 'transparent',
                color: activo ? '#003cc3' : '#64748b',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                textAlign: 'left', width: '100%',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!activo) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}}
              onMouseLeave={e => { if (!activo) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
            >
              <Icon />
              {nombre}
              {activo && <span style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#003cc3', flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Theme + Volver */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            {darkMode ? <IconSun /> : <IconMoon />}
            Tema
          </button>
          <button onClick={() => router.push('/')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
          >
            <IconArrowLeft />
            Público
          </button>
        </div>

        {/* User card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#003cc3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', flexShrink: 0 }}>
            {perfil?.email?.slice(0, 2) || 'AD'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perfil?.email}</p>
            <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '3px', padding: '2px 6px', borderRadius: '4px', background: '#eff4ff', color: '#003cc3' }}>
              {perfil?.role === 'admin' ? 'Administrador' : 'Moderador'}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button onClick={handleCerrarSesion} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: 'none', background: '#fff1f2', color: '#e11d48', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.15s', width: '100%' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ffe4e6'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; }}
        >
          <IconLogOut />
          Cerrar Sesión
        </button>
      </div>

      <style>{`@keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Sidebar desktop */}
      <aside className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
        <div style={{ height: '100vh', position: 'sticky', top: 0 }}>
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile overlay + sidebar */}
      {menuAbierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} className="lg:hidden">
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }} onClick={() => setMenuAbierto(false)} />
          <aside style={{ position: 'relative', width: '240px', maxWidth: '80vw', height: '100%', zIndex: 10 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Mobile header */}
        <header className="lg:hidden" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 40 }}>
          <button onClick={() => setMenuAbierto(true)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#374151', display: 'flex' }}>
            <IconMenu />
          </button>
          <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>SOS Vzla Admin</span>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff4ff', border: '1.5px solid #c7d7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#003cc3', fontSize: '12px', fontWeight: '800' }}>
            {perfil?.email?.slice(0, 1).toUpperCase() || 'A'}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '24px 24px 48px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {/* Breadcrumbs */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {breadcrumbs.map((crumb, idx) => (
              <div key={crumb.url} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {idx > 0 && <span style={{ color: '#cbd5e1' }}><IconChevronRight /></span>}
                {crumb.isLast ? (
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{crumb.label}</span>
                ) : (
                  <button onClick={() => router.push(crumb.url)} style={{ border: 'none', background: 'none', fontSize: '13px', color: '#94a3b8', fontWeight: '500', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0f172a'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; }}
                  >
                    {crumb.label}
                  </button>
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
