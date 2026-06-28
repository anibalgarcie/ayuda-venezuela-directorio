'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogIn, KeyRound, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState(null);

  /* ── Redirect if already logged in ── */
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

  /* ── Login handler ── */
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

  /* ── Shared styles ── */
  const inputStyle = {
    width: '100%', background: '#F5F5F7', border: '1.5px solid #d2d2d7',
    borderRadius: 12, padding: '13px 16px 13px 44px',
    fontSize: 15, fontFamily: 'inherit', color: '#1d1d1f', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* ── Top bar ── */}
      <header style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ fontSize: 20, fontWeight: 800, color: '#1d1d1f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b30', display: 'inline-block', boxShadow: '0 0 0 3px rgba(255,59,48,0.2)' }} />
            Ayuda Venezuela
          </a>
          <a href="/" style={{ fontSize: 13, fontWeight: 600, color: '#86868b', textDecoration: 'none' }}>
            ← Volver al directorio
          </a>
        </div>
      </header>

      {/* ── Main centered card ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Icon + heading */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <KeyRound size={28} color="#0071e3" />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: '#1d1d1f', marginBottom: 8 }}>
              Iniciar Sesión
            </h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#86868b', lineHeight: 1.5 }}>
              Accede al panel de administración del directorio
            </p>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>

            {/* Error alert */}
            {error && (
              <div style={{ marginBottom: 20, padding: '13px 16px', borderRadius: 12, border: '1.5px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.05)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle size={16} color="#ff3b30" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#cc1f12', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    required
                    placeholder="admin@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#0071e3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = '#d2d2d7'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>
                  Contraseña
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = '#0071e3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)'; }}
                    onBlur={(e)  => { e.target.style.borderColor = '#d2d2d7'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%', background: cargando ? '#d2d2d7' : '#0071e3',
                  color: '#fff', border: 'none', borderRadius: 9999,
                  padding: '14px 0', fontSize: 15, fontWeight: 700,
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4, transition: 'background 0.2s',
                }}
              >
                {cargando ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    Ingresar al Panel
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, fontWeight: 500, color: '#86868b' }}>
            Solo usuarios administradores y moderadores pueden acceder.
          </p>
        </div>
      </main>

      {/* Spinner keyframe */}
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
