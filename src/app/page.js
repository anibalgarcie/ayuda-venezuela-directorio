'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Globe, Activity, Search, MapPin, Phone, ExternalLink, X,
  RefreshCw, Languages, PlusCircle, AlertTriangle, SlidersHorizontal,
  HeartPulse, Landmark, Gift, Truck, Radio, BookOpen,
  ShieldCheck, Users, Building2, Megaphone, FlaskConical,
  CheckCircle2, GraduationCap, Newspaper, Cpu, Utensils,
  Zap, HandHeart, Wifi, Heart, Menu,
} from 'lucide-react';

/*
  ── Category → { Icon, bg, color, gradient } map ───────────────────────
  Regla UX: los colores semánticos y los íconos expresivos permiten
  reconocimiento inmediato de categoría sin leer la etiqueta.
  NINGUNA categoría usa gris — todos los colores son vibrantes y accesibles.
*/
const CATEGORY_MAP = {
  'Salud':         { Icon: HeartPulse,    bg: '#fff0f0', color: '#ff3b30', grad: 'linear-gradient(135deg,#ff3b30,#ff6b6b)' },
  'Oficial':       { Icon: Landmark,      bg: '#e8f1ff', color: '#003cc3', grad: 'linear-gradient(135deg,#003cc3,#34aadc)' },
  'Gobierno':      { Icon: Building2,     bg: '#eeeeff', color: '#5856d6', grad: 'linear-gradient(135deg,#5856d6,#a78bfa)' },
  'Donaciones':    { Icon: HandHeart,     bg: '#fff4e0', color: '#ff9500', grad: 'linear-gradient(135deg,#ff9500,#ffcc02)' },
  'Logística':     { Icon: Truck,         bg: '#fff8e1', color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#fcd34d)' },
  'Comunicación':  { Icon: Radio,         bg: '#f5f0ff', color: '#7c3aed', grad: 'linear-gradient(135deg,#7c3aed,#c084fc)' },
  'Educación':     { Icon: GraduationCap, bg: '#edfff4', color: '#16a34a', grad: 'linear-gradient(135deg,#16a34a,#4ade80)' },
  'Voluntariado':  { Icon: Heart,         bg: '#fff0f7', color: '#db2777', grad: 'linear-gradient(135deg,#db2777,#f472b6)' },
  'Tecnología':    { Icon: Cpu,           bg: '#eff6ff', color: '#2563eb', grad: 'linear-gradient(135deg,#2563eb,#60a5fa)' },
  'Seguridad':     { Icon: ShieldCheck,   bg: '#ecfdf5', color: '#059669', grad: 'linear-gradient(135deg,#059669,#34d399)' },
  'Alimentos':     { Icon: Utensils,      bg: '#fff7ed', color: '#ea580c', grad: 'linear-gradient(135deg,#ea580c,#fb923c)' },
  'Noticias':      { Icon: Newspaper,     bg: '#fefce8', color: '#ca8a04', grad: 'linear-gradient(135deg,#ca8a04,#fbbf24)' },
  'Investigación': { Icon: FlaskConical,  bg: '#f0f9ff', color: '#0284c7', grad: 'linear-gradient(135deg,#0284c7,#38bdf8)' },
  'General':       { Icon: Zap,           bg: '#f0f0ff', color: '#4f46e5', grad: 'linear-gradient(135deg,#4f46e5,#818cf8)' },
};

/* Fallback — always vibrant indigo, never gray */
function getCategoryStyle(categoria) {
  return CATEGORY_MAP[categoria] || { Icon: Globe, bg: '#f0f0ff', color: '#4f46e5', grad: 'linear-gradient(135deg,#4f46e5,#818cf8)' };
}

/* ─── i18n ──────────────────────────────────────────────────────────── */
const i18n = {
  es: {
    titulo:        'Ayuda Venezuela',
    subtitulo:     'Directorio de páginas web de emergencia',
    descripcion:   'Colección verificada de recursos web dedicados a la ayuda humanitaria, respuesta de emergencia y coordinación logística en Venezuela.',
    buscar:        'Buscar recursos, categorías, nombres...',
    reportar:      'Reportar Enlace',
    refrescar:     'Actualizar',
    visitarEnlace: 'Visitar Sitio',
    resultados:    'resultados',
    cargando:      'Consultando base de datos...',
    sinResultados: 'No hay registros aprobados en esta categoría aún.',
    sinBusqueda:   'No se encontraron resultados para tu búsqueda.',
    modalTitulo:   'Reportar un Enlace',
    campoTitulo:   'Título del Sitio *',
    campoUrl:      'Dirección URL *',
    campoCategoria:'Categoría',
    campoAlcance:  'Alcance',
    campoDescripcion:'Descripción *',
    alcanceValor:  'Nacional / Web',
    btnEnviar:     'Enviar para Moderación',
    btnProcesando: 'Procesando...',
    exito:         '¡Reporte recibido! Será revisado por los moderadores.',
    errorCampos:   'Por favor, rellena todos los campos obligatorios.',
    banner:        'Red de Recursos en Vivo',
    verified:      'Verificado',
    noDesc:        'Sin descripción disponible.',
    noTitle:       'Sin título',
    pronto:        'Próximamente',
    todos:         'Todos',
    menus: [
      { id: 'todos',              nombre: 'Todos',             icono: SlidersHorizontal, habilitado: true  },
      { id: 'directorios_web',    nombre: 'Sitios Web',        icono: Globe,             habilitado: true  },
      { id: 'centros_acopio',     nombre: 'Centros de Acopio', icono: MapPin,            habilitado: false },
      { id: 'contactos_recursos', nombre: 'Contactos',         icono: Phone,             habilitado: false },
      { id: 'reportes_sismos',    nombre: 'Sismos',            icono: Activity,          habilitado: false },
    ],
  },
  en: {
    titulo:        'Ayuda Venezuela',
    subtitulo:     'Humanitarian Resource Directory',
    descripcion:   'A verified collection of web resources dedicated to humanitarian aid, emergency response, and logistics coordination in Venezuela.',
    buscar:        'Search resources, categories, names...',
    reportar:      'Report Link',
    refrescar:     'Refresh',
    visitarEnlace: 'Visit Site',
    resultados:    'results',
    cargando:      'Querying database...',
    sinResultados: 'No approved records in this category yet.',
    sinBusqueda:   'No results found for your search.',
    modalTitulo:   'Report a Link',
    campoTitulo:   'Site Title *',
    campoUrl:      'URL Address *',
    campoCategoria:'Category',
    campoAlcance:  'Scope',
    campoDescripcion:'Description *',
    alcanceValor:  'National / Web',
    btnEnviar:     'Submit for Review',
    btnProcesando: 'Processing...',
    exito:         'Report received! It will be reviewed by moderators.',
    errorCampos:   'Please fill in all required fields.',
    banner:        'Live Resource Network',
    verified:      'Verified',
    noDesc:        'No description available.',
    noTitle:       'Untitled',
    pronto:        'Coming Soon',
    todos:         'All',
    menus: [
      { id: 'todos',              nombre: 'All',                icono: SlidersHorizontal, habilitado: true  },
      { id: 'directorios_web',    nombre: 'Websites',           icono: Globe,             habilitado: true  },
      { id: 'centros_acopio',     nombre: 'Collection Centers', icono: MapPin,            habilitado: false },
      { id: 'contactos_recursos', nombre: 'Contacts',           icono: Phone,             habilitado: false },
      { id: 'reportes_sismos',    nombre: 'Quakes',             icono: Activity,          habilitado: false },
    ],
  },
};

const categoryEmoji = {
  Salud: '🏥', Oficial: '🏛️', Donaciones: '💙',
  Logística: '📦', Comunicación: '📡', Educación: '🎓',
};

/* ═══════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [menuActivo, setMenuActivo]     = useState('directorios_web');
  const [busqueda, setBusqueda]         = useState('');
  const [idioma, setIdioma]             = useState('es');
  const [cargando, setCargando]         = useState(false);
  const [datos, setDatos]               = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario]     = useState({ titulo: '', url: '', descripcion: '', categoria: '' });
  const [enviando, setEnviando]         = useState(false);
  const [notificacion, setNotificacion] = useState({ tipo: '', texto: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = i18n[idioma];

  /* ── fetch ── */
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setDatos([]);
    try {
      // "todos" fetches from the main active table
      const tabla = menuActivo === 'todos' ? 'directorios_web' : menuActivo;
      const { data, error } = await supabase
        .from(tabla).select('*').eq('aprobado', true).order('creado_en', { ascending: false });
      if (error) throw error;
      setDatos(data || []);
    } catch (err) {
      console.error(`Error en "${menuActivo}":`, err.message);
    } finally {
      setCargando(false);
    }
  }, [menuActivo]);

  useEffect(() => { const id = setTimeout(cargarDatos, 0); return () => clearTimeout(id); }, [cargarDatos]);

  /* ── analytics ── */
  useEffect(() => {
    supabase.from('analytics_views').insert([{ path: '/' }]).then(({ error }) => {
      if (error) console.warn('Analytics:', error.message);
    });
  }, []);

  /* ── search filter ── */
  const datosFiltrados = datos.filter((item) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.titulo || item.nombre || '').toLowerCase().includes(q) ||
      (item.descripcion || item.detalles || '').toLowerCase().includes(q) ||
      (item.categoria || '').toLowerCase().includes(q)
    );
  });

  /* ── click tracking ── */
  const handleVisitLink = (item) => {
    if (item.id) supabase.rpc('increment_clicks', { row_id: item.id }).then(({ error }) => {
      if (error) console.warn('Click tracking:', error.message);
    });
    window.open(item.url, '_blank', 'noopener,noreferrer');
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.titulo || !formulario.url || !formulario.descripcion) {
      setNotificacion({ tipo: 'error', texto: t.errorCampos });
      return;
    }
    setEnviando(true);
    setNotificacion({ tipo: '', texto: '' });
    try {
      const { error } = await supabase.from('directorios_web').insert([{
        titulo: formulario.titulo, url: formulario.url,
        descripcion: formulario.descripcion, categoria: formulario.categoria || 'General', aprobado: false,
      }]);
      if (error) throw error;
      setNotificacion({ tipo: 'exito', texto: t.exito });
      setFormulario({ titulo: '', url: '', descripcion: '', categoria: '' });
      setTimeout(() => { setModalAbierto(false); setNotificacion({ tipo: '', texto: '' }); }, 3000);
    } catch (err) {
      setNotificacion({ tipo: 'error', texto: `No se pudo enviar: ${err.message}` });
    } finally {
      setEnviando(false);
    }
  };

  const closeModal = () => { setModalAbierto(false); setNotificacion({ tipo: '', texto: '' }); };

  const notifColors = notificacion.tipo === 'exito'
    ? { border: 'rgba(52,199,89,0.35)', bg: 'rgba(52,199,89,0.06)', icon: '#34c759', text: '#1a7a38' }
    : { border: 'rgba(255,59,48,0.35)', bg: 'rgba(255,59,48,0.06)', icon: '#ff3b30', text: '#cc1f12' };

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F7' }}>

      {/* ══ HEADER ══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.72)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <a href="/" style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: '#1d1d1f', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3b30', display: 'inline-block', boxShadow: '0 0 0 3px rgba(255,59,48,0.2)' }} />
            {t.titulo}
          </a>

          {/* Desktop nav */}
          <nav className="desktop-nav" style={{ gap: 24 }}>
            <a href="#directorio" style={{ fontSize: 14, fontWeight: 600, color: '#003cc3', textDecoration: 'none' }}>Directorio</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setModalAbierto(true); }} style={{ fontSize: 14, fontWeight: 500, color: '#86868b', textDecoration: 'none' }}>Reportar</a>
          </nav>

          {/* Desktop Actions */}
          <div className="desktop-nav" style={{ alignItems: 'center', gap: 8 }}>
            <button onClick={cargarDatos} title={t.refrescar} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#86868b', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={16} className={cargando ? 'spinner' : ''} />
            </button>
            <button onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')} style={{ background: 'none', border: '1.5px solid #d2d2d7', borderRadius: 9999, padding: '5px 13px', fontSize: 13, fontWeight: 600, color: '#1d1d1f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Languages size={13} color="#86868b" />
              {idioma === 'es' ? 'EN' : 'ES'}
            </button>
            <a href="/admin/login" style={{ background: 'none', border: '1.5px solid #d2d2d7', borderRadius: 9999, padding: '6px 15px', fontSize: 13, fontWeight: 600, color: '#1d1d1f', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Iniciar Sesión
            </a>
            <button
              onClick={() => setModalAbierto(true)}
              style={{
                background: 'rgba(0, 113, 227, 0.08)', color: '#003cc3',
                border: 'none', borderRadius: 9999, padding: '7px 17px',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 113, 227, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 113, 227, 0.08)'; }}
            >
              {t.reportar}
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
            style={{ display: 'none' }} /* overridden by className */
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ══ MOBILE MENU PANEL ══ */}
      {mobileMenuOpen && (
        <div className="fade-in" style={{
          position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
          background: 'rgba(255, 255, 255, 0.96)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          zIndex: 49, display: 'flex', flexDirection: 'column', padding: '28px 24px',
          gap: 20
        }}>
          <a
            href="#directorio"
            onClick={() => setMobileMenuOpen(false)}
            style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #e8e8ed', display: 'block' }}
          >
            Directorio
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); setModalAbierto(true); }}
            style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #e8e8ed', display: 'block' }}
          >
            {t.reportar}
          </a>
          <a
            href="/admin/login"
            style={{ fontSize: 18, fontWeight: 700, color: '#1d1d1f', textDecoration: 'none', padding: '12px 0', borderBottom: '1px solid #e8e8ed', display: 'block' }}
          >
            Iniciar Sesión
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#86868b' }}>Idioma / Language</span>
            <button
              onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
              style={{ background: 'none', border: '1.5px solid #d2d2d7', borderRadius: 9999, padding: '7px 18px', fontSize: 14, fontWeight: 600, color: '#1d1d1f', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Languages size={15} color="#86868b" />
              {idioma === 'es' ? 'English (EN)' : 'Español (ES)'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#86868b' }}>Actualizar datos</span>
            <button
              onClick={() => { cargarDatos(); setMobileMenuOpen(false); }}
              style={{ background: '#F5F5F7', border: '1.5px solid #d2d2d7', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#1d1d1f' }}
            >
              <RefreshCw size={16} className={cargando ? 'spinner' : ''} />
            </button>
          </div>
        </div>
      )}

      {/* ══ HERO ══ */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 9999, padding: '5px 14px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34c759' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#86868b' }}>{t.banner}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: '#1d1d1f', marginBottom: 14, maxWidth: 680 }}>
          {t.subtitulo}
        </h1>
        <p style={{ fontSize: 17, fontWeight: 500, color: '#86868b', maxWidth: 580, lineHeight: 1.6 }}>
          {t.descripcion}
        </p>
      </section>

      {/* ══ FILTER BAR ══ */}
      <div id="directorio" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '16px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>

          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#86868b', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder={t.buscar}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%', background: '#F5F5F7', border: '1.5px solid #e8e8ed',
                borderRadius: 12, padding: '10px 14px 10px 38px',
                fontSize: 14, fontFamily: 'inherit', color: '#1d1d1f', outline: 'none',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#003cc3'; e.target.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.12)'; }}
              onBlur={(e)  => { e.target.style.borderColor = '#e8e8ed'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: '#e8e8ed', flexShrink: 0 }} />

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: '999 1 0' }}>
            {t.menus.map((m) => {
              const Icono = m.icono;
              const active = menuActivo === m.id;
              return (
                <button
                  key={m.id}
                  disabled={!m.habilitado}
                  onClick={() => m.habilitado && setMenuActivo(m.id)}
                  title={!m.habilitado ? t.pronto : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: active ? '8px 16px' : '7px 14px',
                    borderRadius: 9999,
                    border: active ? '2px solid #003cc3' : '1.5px solid transparent',
                    background: active ? '#003cc3' : '#F5F5F7',
                    color: !m.habilitado ? '#c7c7cc' : active ? '#fff' : '#1d1d1f',
                    fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
                    cursor: m.habilitado ? 'pointer' : 'not-allowed',
                    opacity: !m.habilitado ? 0.55 : 1,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icono size={13} />
                  {m.nombre}
                  {!m.habilitado && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(0,0,0,0.08)', borderRadius: 4, padding: '1px 5px', color: '#86868b', marginLeft: 2 }}>
                      Pronto
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Result count */}
          {!cargando && (
            <span style={{ fontSize: 12, fontWeight: 600, color: '#86868b', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {datosFiltrados.length} {t.resultados}
            </span>
          )}
        </div>
      </div>

      {/* ══ CARDS GRID ══ */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 100px' }}>

        {cargando ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 14 }}>
            <div style={{ width: 34, height: 34, border: '3px solid #d2d2d7', borderTopColor: '#003cc3', borderRadius: '50%' }} className="spinner" />
            <p style={{ color: '#86868b', fontSize: 14, fontWeight: 500 }}>{t.cargando}</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 10 }}>
            <AlertTriangle size={28} color="#c7c7cc" />
            <p style={{ color: '#86868b', fontSize: 14, fontWeight: 500 }}>
              {busqueda ? t.sinBusqueda : t.sinResultados}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {datosFiltrados.map((item, i) => {
              const { Icon, bg, color } = getCategoryStyle(item.categoria);
              return (
                <article
                  key={item.id}
                  className="apple-card fade-in-up"
                  style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0, animationDelay: `${i * 0.04}s` }}
                >
                  {/* ── Card tags ── */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    
                    {/* Category tag */}
                    {item.categoria && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                        background: bg, color: color,
                        padding: '3px 9px', borderRadius: 6,
                      }}>
                        {item.categoria}
                      </span>
                    )}

                    {/* Verified badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(52,199,89,0.10)',
                      border: '1px solid rgba(52,199,89,0.25)',
                      borderRadius: 9999, padding: '3px 9px',
                    }}>
                      <CheckCircle2 size={11} color="#34c759" strokeWidth={2.5} />
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#34c759' }}>
                        {t.verified}
                      </span>
                    </div>
                  </div>

                  {/* ── Card body ── */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                    {/* Title — primary content, largest text on card */}
                    <h3 style={{
                      fontSize: 16, fontWeight: 700, lineHeight: 1.3,
                      color: '#1d1d1f', marginBottom: 8, letterSpacing: '-0.01em',
                    }}>
                      {item.titulo || item.nombre || t.noTitle}
                    </h3>

                    {/* Description — secondary content, clamped to 3 lines */}
                    <p style={{
                      fontSize: 13, fontWeight: 400, color: '#6e6e73',
                      lineHeight: 1.65, marginBottom: 20, flexGrow: 1,
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {item.descripcion || item.detalles || t.noDesc}
                    </p>
                  </div>

                  {/* ── CTA button — filled, colorful, prominent ── */}
                  {item.url && (
                    <button
                      onClick={() => handleVisitLink(item)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                        width: '100%', padding: '11px 16px',
                        background: '#003cc3',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        color: '#fff',
                        fontFamily: 'inherit', fontWeight: 600, fontSize: 14,
                        letterSpacing: '0.01em',
                        boxShadow: `0 4px 14px rgba(0, 60, 195, 0.4)`,
                        transition: 'filter 0.15s ease, transform 0.12s ease, box-shadow 0.15s ease',
                        marginTop: 4,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.1)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 8px 20px rgba(0, 60, 195, 0.55)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = `0 4px 14px rgba(0, 60, 195, 0.4)`;
                      }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(0.98)'; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(-1px) scale(1)'; }}
                    >
                      {t.visitarEnlace}
                      <ExternalLink size={14} strokeWidth={2.2} />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ MOBILE FAB ══ */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 40, display: 'none' }} className="mobile-fab">
        <button
          onClick={() => setModalAbierto(true)}
          style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(0, 113, 227, 0.95)', backdropFilter: 'blur(10px)',
            color: '#fff', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(0, 113, 227, 0.35)', transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          title={t.reportar}
        >
          <PlusCircle size={22} />
        </button>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 40 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1d1d1f', marginBottom: 10 }}>Ayuda Venezuela</div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#86868b', lineHeight: 1.6 }}>
              Centralizando la coordinación humanitaria y transparencia de emergencia para Venezuela.
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1d1d1f', marginBottom: 14 }}>Enlaces Rápidos</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Recursos de Emergencia', 'Materiales de Ayuda', 'Reportes'].map((l) => (
                <li key={l}><a href="#" style={{ fontSize: 13, fontWeight: 500, color: '#86868b', textDecoration: 'none' }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1d1d1f', marginBottom: 14 }}>Conectar</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Portal de Voluntarios', 'Contáctanos', 'Privacidad'].map((l) => (
                <li key={l}><a href="#" style={{ fontSize: 13, fontWeight: 500, color: '#86868b', textDecoration: 'none' }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div style={{ background: '#F5F5F7', borderRadius: 16, padding: 18 }}>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#86868b', marginBottom: 12 }}>Estado del Sistema</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c759' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>Todos los sistemas operacionales</span>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b' }}>© 2025 Ayuda Venezuela</p>
            </div>
          </div>
        </div>
      </footer>

      {/* ══ MODAL ══ */}
      {modalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(10px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="apple-card fade-in-up"
            style={{ width: '100%', maxWidth: 490, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.18)', background: '#fff', position: 'relative' }}
          >
            {/* Loader overlay during submission */}
            {enviando && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12
              }}>
                <div style={{ width: 38, height: 38, border: '3.5px solid #d2d2d7', borderTopColor: '#003cc3', borderRadius: '50%' }} className="spinner" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>{t.btnProcesando}</span>
              </div>
            )}

            {/* Header */}
            <div style={{ padding: '20px 22px', borderBottom: '1px solid #F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, background: '#F5F5F7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={17} color="#003cc3" />
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1d1d1f' }}>{t.modalTitulo}</h2>
              </div>
              <button onClick={closeModal} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#F5F5F7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ padding: 22, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

              {notificacion.texto && (
                <div style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${notifColors.border}`, background: notifColors.bg, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <AlertTriangle size={15} color={notifColors.icon} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: notifColors.text }}>{notificacion.texto}</span>
                </div>
              )}

              {[
                { label: t.campoTitulo,    type: 'text', key: 'titulo',      placeholder: 'Ej: Registro Civil Digital...' },
                { label: t.campoUrl,       type: 'url',  key: 'url',         placeholder: 'https://ejemplo.com' },
              ].map(({ label, type, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>{label}</label>
                  <input
                    type={type} required placeholder={placeholder}
                    value={formulario[key]}
                    onChange={(e) => setFormulario({ ...formulario, [key]: e.target.value })}
                    style={{ width: '100%', background: '#F5F5F7', border: '1.5px solid #d2d2d7', borderRadius: 12, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#1d1d1f', outline: 'none' }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>{t.campoCategoria}</label>
                  <input type="text" placeholder="Salud, Oficial..." value={formulario.categoria} onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })} style={{ width: '100%', background: '#F5F5F7', border: '1.5px solid #d2d2d7', borderRadius: 12, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#1d1d1f', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>{t.campoAlcance}</label>
                  <div style={{ background: '#F5F5F7', border: '1.5px solid #d2d2d7', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#86868b', fontWeight: 500 }}>{t.alcanceValor}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86868b', marginBottom: 8 }}>{t.campoDescripcion}</label>
                <textarea required rows={3} placeholder="Describe brevemente qué información provee este enlace..." value={formulario.descripcion} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} style={{ width: '100%', background: '#F5F5F7', border: '1.5px solid #d2d2d7', borderRadius: 12, padding: '12px 16px', fontSize: 15, fontFamily: 'inherit', color: '#1d1d1f', outline: 'none', resize: 'none' }} />
              </div>

              <button
                type="submit"
                disabled={enviando || notificacion.tipo === 'exito'}
                style={{ width: '100%', background: enviando || notificacion.tipo === 'exito' ? '#d2d2d7' : '#003cc3', color: '#fff', border: 'none', borderRadius: 9999, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: enviando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {t.btnEnviar}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Responsive */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 640px) {
          .mobile-fab { display: flex !important; }
        }
        @media (max-width: 768px) {
          nav { display: none !important; }
        }
      `}} />
    </div>
  );
}
