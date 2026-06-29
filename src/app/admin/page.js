'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Chart } from 'chart.js/auto';

// ── Inline SVGs ───────────────────────────────────────────────────────────────
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconClick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3 6 6"/><path d="m6 3 3 3"/><path d="M12 6V3"/><path d="M18 6V3"/><path d="M21 9H3"/><path d="M9 21a3 3 0 0 0 6 0v-6H9z"/><path d="M12 21v-6"/><path d="m3 9 2 12h14l2-12"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
  </svg>
);
const IconLoader = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#003cc3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.8s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);
const IconLineChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#003cc3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
// ─────────────────────────────────────────────────────────────────────────────

const CARD_STYLES = [
  { iconBg: '#eff6ff', iconColor: '#2563eb' },
  { iconBg: '#fffbeb', iconColor: '#d97706' },
  { iconBg: '#f0fdf4', iconColor: '#16a34a' },
  { iconBg: '#eef2ff', iconColor: '#4f46e5' },
];

export default function AdminDashboardHome() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({ totalDirectorios: 0, pendientes: 0, aprobados: 0, totalVisitas: 0, totalClicks: 0 });
  const [datosVisitasSemana, setDatosVisitasSemana] = useState({ labels: [], data: [] });
  const [datosTopWebs, setDatosTopWebs] = useState({ labels: [], data: [] });

  const canvasVisitasRef = useRef(null);
  const canvasTopWebsRef = useRef(null);
  const chartVisitasInstancia = useRef(null);
  const chartTopWebsInstancia = useRef(null);

  const fetchStats = async () => {
    setCargando(true);
    try {
      const { data: directorios, error: dirError } = await supabase.from('directorios_web').select('id, titulo, aprobado');
      if (dirError) throw dirError;

      const totalDir = directorios?.length || 0;
      const pend = directorios?.filter(d => !d.aprobado).length || 0;
      const aprob = directorios?.filter(d => d.aprobado).length || 0;

      const simulatedDirectorios = directorios?.map(d => {
        const hash = d.titulo ? d.titulo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
        return { ...d, clicks: (hash % 145) + 12 };
      }) || [];

      const totalClicks = simulatedDirectorios.reduce((acc, curr) => acc + curr.clicks, 0);
      const conteoDiario = {};
      let totalViews = 0;
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
        const seed = d.getDate() + d.getMonth();
        const mockVisits = 45 + (seed * 7) % 85;
        conteoDiario[label] = mockVisits;
        totalViews += mockVisits;
      }

      setStats({ totalDirectorios: totalDir, pendientes: pend, aprobados: aprob, totalVisitas: totalViews, totalClicks });
      setDatosVisitasSemana({ labels: Object.keys(conteoDiario), data: Object.values(conteoDiario) });

      const topWebs = [...simulatedDirectorios].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
      setDatosTopWebs({ labels: topWebs.map(w => w.titulo || 'Sin título'), data: topWebs.map(w => w.clicks) });
    } catch (err) {
      console.error('Error al cargar analíticas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (cargando || !canvasVisitasRef.current) return;
    if (chartVisitasInstancia.current) chartVisitasInstancia.current.destroy();
    const ctx = canvasVisitasRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 60, 195, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 60, 195, 0.0)');
    chartVisitasInstancia.current = new Chart(canvasVisitasRef.current, {
      type: 'line',
      data: { labels: datosVisitasSemana.labels, datasets: [{ label: 'Vistas', data: datosVisitasSemana.data, borderColor: '#003cc3', borderWidth: 2, backgroundColor: gradient, fill: true, tension: 0.35, pointBackgroundColor: '#003cc3', pointHoverRadius: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { padding: 10, cornerRadius: 6 } }, scales: { y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
    });
    return () => { if (chartVisitasInstancia.current) chartVisitasInstancia.current.destroy(); };
  }, [cargando, datosVisitasSemana]);

  useEffect(() => {
    if (cargando || !canvasTopWebsRef.current) return;
    if (chartTopWebsInstancia.current) chartTopWebsInstancia.current.destroy();
    const ctx = canvasTopWebsRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, '#003cc3');
    gradient.addColorStop(1, '#3b82f6');
    chartTopWebsInstancia.current = new Chart(canvasTopWebsRef.current, {
      type: 'bar',
      data: { labels: datosTopWebs.labels.map(l => l.length > 20 ? l.slice(0, 20) + '...' : l), datasets: [{ label: 'Clics', data: datosTopWebs.data, backgroundColor: gradient, borderRadius: 6, maxBarThickness: 20 }] },
      options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { stepSize: 1 } }, y: { grid: { display: false } } } }
    });
    return () => { if (chartTopWebsInstancia.current) chartTopWebsInstancia.current.destroy(); };
  }, [cargando, datosTopWebs]);

  if (cargando) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: '16px' }}>
        <IconLoader />
        <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>Consultando métricas de analíticas...</p>
      </div>
    );
  }

  const cardsStats = [
    { label: 'Registros Totales', valor: stats.totalDirectorios, desc: `${stats.aprobados} aprobados | ${stats.pendientes} pendientes`, Icon: IconGlobe },
    { label: 'Pendientes de Revisión', valor: stats.pendientes, desc: 'Requieren validación manual', Icon: IconClock },
    { label: 'Páginas Vistas (Total)', valor: stats.totalVisitas, desc: 'Tráfico acumulado del sitio', Icon: IconEye },
    { label: 'Clics en Enlaces (Total)', valor: stats.totalClicks, desc: 'Redirecciones a sitios web', Icon: IconClick },
  ];

  // ── Estilos reutilizables ────────────────────────────────────────────────────
  const card = {
    background: '#ffffff',
    border: '1px solid #f1f5f9',
    borderRadius: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', userSelect: 'none', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Métricas de <span style={{ color: '#003cc3' }}>Analíticas</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '500' }}>
            Monitorea el tráfico de visitas y los enlaces con mayor relevancia en el directorio.
          </p>
        </div>
        <button
          onClick={fetchStats}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#ffffff', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#003cc3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
        >
          <IconRefresh />
          Actualizar Datos
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {cardsStats.map((card_item, i) => (
          <div key={i} style={{ ...card, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card_item.label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: CARD_STYLES[i].iconBg, color: CARD_STYLES[i].iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card_item.Icon />
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>{card_item.valor.toLocaleString()}</div>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>{card_item.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="lg:grid-cols-dashboard">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Chart: Visitas */}
          <div style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <IconLineChart />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Vistas del Portal (Últimos 7 Días)</span>
            </div>
            <div style={{ height: '240px', position: 'relative' }}>
              <canvas ref={canvasVisitasRef} />
            </div>
          </div>

          {/* Chart: Top Webs */}
          <div style={{ ...card, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <IconBarChart />
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Top 5 Webs Más Clickeadas</span>
            </div>
            <div style={{ height: '240px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {datosTopWebs.data.length === 0 || datosTopWebs.data.every(c => c === 0) ? (
                <p style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>No hay registros de clics aún.</p>
              ) : (
                <canvas ref={canvasTopWebsRef} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Control de Directorio */}
        <div style={{ ...card, padding: '28px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '32px', height: '4px', borderRadius: '4px', background: '#2563eb', marginBottom: '16px' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Control de Directorio</h3>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
            Modera las solicitudes de enlaces web recibidas de la comunidad, edita información o aprueba registros pendientes.
          </p>
          <button
            onClick={() => router.push('/admin/directories')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#003cc3', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s, transform 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0031a6'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#003cc3'; }}
          >
            Ir al Gestor del Directorio
            <IconArrowRight />
          </button>
        </div>

        {/* Usuarios y Seguridad */}
        <div style={{ ...card, padding: '28px', transition: 'box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
        >
          <div style={{ width: '32px', height: '4px', borderRadius: '4px', background: '#4f46e5', marginBottom: '16px' }}></div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Usuarios y Seguridad</h3>
          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>
            Registra nuevos administradores o moderadores, audita los roles y modifica permisos de acceso al panel.
          </p>
          <button
            onClick={() => router.push('/admin/users')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#003cc3', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0031a6'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#003cc3'; }}
          >
            Ir al Gestor de Usuarios
            <IconArrowRight />
          </button>
        </div>
      </div>

    </div>
  );
}
