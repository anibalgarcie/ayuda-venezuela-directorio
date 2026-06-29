'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
  </svg>
);
const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconKey = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>
  </svg>
);
const IconLoader = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation: 'spin 0.8s linear infinite'}}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);
const IconLogIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'El correo es requerido.').email('Formato de correo inválido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
});

export default function AdminLogin() {
  const router = useRouter();
  const [errorGlobal, setErrorGlobal] = useState(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile && (profile.role === 'admin' || profile.role === 'moderator')) {
        router.replace('/admin');
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (vals) => {
    setErrorGlobal(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: vals.email, password: vals.password });
      if (authError) throw authError;
      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
      if (profileError || !profile) { await supabase.auth.signOut(); throw new Error('No se encontró un perfil administrativo.'); }
      if (profile.role !== 'admin' && profile.role !== 'moderator') { await supabase.auth.signOut(); throw new Error('No tienes permisos de acceso al panel.'); }
      router.replace('/admin');
    } catch (err) {
      setErrorGlobal(err.message || 'Error inesperado al iniciar sesión.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Panel Izquierdo (Branding) ── */}
      <div className="hidden lg:flex" style={{
        width: '45%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8edff 100%)',
        borderRight: '1px solid #e2e8f0',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(0,60,195,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', right: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(59,130,246,0.06)', pointerEvents: 'none' }} />

        {/* Top: Link volver */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: '#003cc3', fontWeight: '700', fontSize: '14px',
            textDecoration: 'none', transition: 'opacity 0.2s',
          }}>
            <IconArrowLeft />
            Volver al portal público
          </Link>
        </div>

        {/* Middle: Branding */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#003cc3', color: '#fff',
            boxShadow: '0 12px 32px rgba(0,60,195,0.3)',
            marginBottom: '28px',
          }}>
            <IconShield />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Gestión Segura<br />del Directorio
          </h1>
          <p style={{ fontSize: '16px', color: '#64748b', lineHeight: '1.7', maxWidth: '380px' }}>
            Accede al panel de administración para moderar enlaces, gestionar recursos y mantener la integridad de la plataforma.
          </p>
        </div>

        {/* Bottom: Footer */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600' }}>
            Ayuda Venezuela &copy; {new Date().getFullYear()}
          </span>
        </div>
      </div>

      {/* ── Panel Derecho (Formulario) ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px 24px',
        background: '#ffffff',
        position: 'relative',
      }}>

        {/* Botón volver móvil */}
        <div className="lg:hidden" style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            <IconArrowLeft />
            Volver
          </Link>
        </div>

        {/* Contenedor del formulario */}
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Título */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Iniciar Sesión
            </h2>
            <p style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '500' }}>
              Ingresa tus credenciales de administrador.
            </p>
          </div>

          {/* Error global */}
          {errorGlobal && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              background: '#fef2f2', border: '1px solid #fecaca',
              marginBottom: '24px',
            }}>
              <span style={{ color: '#dc2626', marginTop: '1px', flexShrink: 0 }}><IconAlert /></span>
              <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500', lineHeight: '1.5' }}>{errorGlobal}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit(handleLogin)} method="post" noValidate>

            {/* Campo Email */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
                  <IconMail />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  {...register('email')}
                  style={{
                    width: '100%',
                    height: '48px',
                    paddingLeft: '46px',
                    paddingRight: '16px',
                    borderRadius: '12px',
                    border: errors.email ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '15px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#003cc3'; e.target.style.boxShadow = '0 0 0 4px rgba(0,60,195,0.08)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
              {errors.email && (
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500', marginTop: '6px' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Campo Contraseña */}
            <div style={{ marginBottom: '28px' }}>
              <label htmlFor="password" style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}>
                  <IconKey />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  style={{
                    width: '100%',
                    height: '48px',
                    paddingLeft: '46px',
                    paddingRight: '16px',
                    borderRadius: '12px',
                    border: errors.password ? '1.5px solid #ef4444' : '1.5px solid #e2e8f0',
                    background: '#f8fafc',
                    fontSize: '15px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#003cc3'; e.target.style.boxShadow = '0 0 0 4px rgba(0,60,195,0.08)'; e.target.style.background = '#fff'; }}
                  onBlur={e => { e.target.style.borderColor = errors.password ? '#ef4444' : '#e2e8f0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
              {errors.password && (
                <p style={{ fontSize: '13px', color: '#ef4444', fontWeight: '500', marginTop: '6px' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderRadius: '12px',
                border: 'none',
                background: isSubmitting ? '#6b97e0' : '#003cc3',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(0,60,195,0.25)',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.1s',
              }}
              onMouseEnter={e => { if (!isSubmitting) { e.target.style.background = '#0031a6'; e.target.style.boxShadow = '0 6px 24px rgba(0,60,195,0.35)'; }}}
              onMouseLeave={e => { if (!isSubmitting) { e.target.style.background = '#003cc3'; e.target.style.boxShadow = '0 4px 16px rgba(0,60,195,0.25)'; }}}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isSubmitting ? (
                <><IconLoader /> Verificando credenciales...</>
              ) : (
                <>Ingresar al panel <IconLogIn /></>
              )}
            </button>
          </form>

          {/* Footer del formulario */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              Acceso restringido. Solo personal autorizado puede ingresar a esta sección.
            </p>
          </div>
        </div>
      </div>

      {/* CSS global para animación del dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input::placeholder { color: #cbd5e1; }
      `}</style>
    </div>
  );
}
