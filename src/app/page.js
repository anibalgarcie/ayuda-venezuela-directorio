'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; // Conexión a tu BD

import { 
  Globe, Activity, Search, PlusCircle, RefreshCw, Package, MapPin, AlertTriangle, ExternalLink, Phone, Languages, X
} from 'lucide-react';

const diccionario = {
  es: {
    titulo: "Venezuela", buscar: "Buscar ciudad, insumo, nombre...", reportar: "Reportar Datos", refrescar: "Actualizar",
    stats: { localizados: "Localizados", ayuda: "Ayuda (Tons)", hospitales: "Hospitales", alertas: "Peligros" },
    menus: [
      { id: 'directorios_web', nombre: 'Enlaces y Sitios Web', icono: Globe, habilitado: true },
      { id: 'centros_acopio', nombre: 'Centros de Acopio', icono: MapPin, habilitado: false },
      { id: 'contactos_recursos', nombre: 'Contactos y Rescatistas', icono: Phone, habilitado: false },
      { id: 'reportes_sismos', nombre: 'Sismos y Réplicas', icono: Activity, habilitado: false },
    ]
  },
  en: {
    titulo: "Venezuela", buscar: "Search city, supply, name...", reportar: "Report Data", refrescar: "Refresh",
    stats: { localizados: "Located", ayuda: "Aid (Tons)", hospitals: "Hospitals", alertas: "Dangers" },
    menus: [
      { id: 'directorios_web', nombre: 'Links & Websites', icono: Globe, habilitado: true },
      { id: 'centros_acopio', nombre: 'Collection Centers', icono: MapPin, habilitado: false },
      { id: 'contactos_recursos', nombre: 'Contacts & Rescuers', icono: Phone, habilitado: false },
      { id: 'reportes_sismos', font: 'Quakes & Aftershocks', icono: Activity, habilitado: false },
    ]
  }
};

export default function Home() {
  const [menuActivo, setMenuActivo] = useState('directorios_web');
  const [busqueda, setBusqueda] = useState('');
  const [idioma, setIdioma] = useState('es');
  
  const [cargando, setCargando] = useState(false);
  const [datos, setDatos] = useState([]);

  // --- ESTADOS PARA EL REPORTE DE DATOS ---
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState({ titulo: '', url: '', descripcion: '', categoria: '' });
  const [enviando, setEnviando] = useState(false);
  const [notificacion, setNotificacion] = useState({ tipo: '', texto: '' }); // 'exito' | 'error'

  const t = diccionario[idioma];

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setDatos([]); 

    try {
      const { data, error } = await supabase
        .from(menuActivo)
        .select('*')
        .eq('aprobado', true)
        .order('creado_en', { ascending: false });
        
      if (error) throw error;
      setDatos(data || []);
    } catch (error) {
      console.error(`❌ Error en tabla "${menuActivo}":`, error.message || error);
      if (error.details) console.error(`🔍 Detalles:`, error.details);
    } finally {
      setCargando(false);
    }
  }, [menuActivo]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarDatos();
    }, 0);

    return () => clearTimeout(temporizador);
  }, [cargarDatos]);

  // --- LÓGICA DEL BUSCADOR EN TIEMPO REAL ---
  const datosFiltrados = datos.filter((item) => {
    const término = busqueda.toLowerCase().trim();
    if (!término) return true;

    const titulo = (item.titulo || item.nombre || '').toLowerCase();
    const descripcion = (item.descripcion || item.detalles || '').toLowerCase();
    const categoria = (item.categoria || '').toLowerCase();

    return titulo.includes(término) || descripcion.includes(término) || categoria.includes(término);
  });

  // --- ENVIAR REPORTE A SUPABASE ---
  const manejarEnvioReporte = async (e) => {
    e.preventDefault();
    if (!formulario.titulo || !formulario.url || !formulario.descripcion) {
      setNotificacion({ tipo: 'error', texto: 'Por favor, rellena todos los campos obligatorios.' });
      return;
    }

    setEnviando(true);
    setNotificacion({ tipo: '', texto: '' });

    try {
      const { error } = await supabase
        .from('directorios_web') 
        .insert([
          {
            titulo: formulario.titulo,
            url: formulario.url,
            descripcion: formulario.descripcion,
            categoria: formulario.categoria || 'General',
            aprobado: false 
          }
        ]);

      if (error) throw error;

      setNotificacion({ tipo: 'exito', texto: '¡Reporte recibido con éxito! Será revisado por los moderadores a la brevedad.' });
      setFormulario({ titulo: '', url: '', descripcion: '', categoria: '' });
      
      setTimeout(() => {
        setModalAbierto(false);
        setNotificacion({ tipo: '', texto: '' });
      }, 3000);

    } catch (error) {
      console.error('❌ Error al insertar reporte:', error);
      setNotificacion({ tipo: 'error', texto: `No se pudo enviar: ${error.message || 'Error de conexión'}` });
    } finally {
      setEnviando(false);
    }
  };

  // DESACTIVADO TEMPORALMENTE: Evita el error PGRST205 porque la tabla 'analytics_views' no existe todavía.
  /*
  useEffect(() => {
    supabase.from('analytics_views').insert([{ path: '/' }]).then(({ error }) => {
      if (error) console.error('Error tracking page view:', error);
    });
  }, []);
  */

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* HEADER SUPERIOR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09090b]/80 border-b border-zinc-900 px-4 lg:px-6 py-4 w-full flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            S.O.S <span className="bg-linear-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">{t.titulo}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={cargarDatos}
            title={t.refrescar}
            className={`p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-cyan-400 hover:bg-zinc-800/80 hover:text-white transition-all duration-300 shadow-inner ${cargando ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="h-4 w-4 lg:h-5 lg:w-5" />
          </button>
          
          <button 
            onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-bold hover:border-cyan-500/40 hover:bg-zinc-900 transition-all duration-300"
          >
            <Languages className="h-4 w-4 text-cyan-400" />
            {idioma === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        
        {/* REJILLA PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* PANEL IZQUIERDO */}
          <aside className="lg:col-span-3 space-y-4 lg:space-y-6 lg:sticky lg:top-28">
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-3 shadow-md backdrop-blur-sm overflow-hidden">
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 lg:h-5 lg:w-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder={t.buscar}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 lg:pl-11 pr-4 py-3 text-sm lg:text-[15px] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-300"
                />
              </div>
            </div>

            {/* MENÚ FILTRADO */}
            <nav className="grid grid-cols-1 lg:flex lg:flex-col gap-2 w-full">
              {t.menus.map((m) => {
                const Icono = m.icono;
                const activo = menuActivo === m.id;
                
                return (
                  <button
                    key={m.id}
                    disabled={!m.habilitado}
                    onClick={() => {
                      if (m.habilitado) setMenuActivo(m.id);
                    }}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[16px] lg:text-[15px] font-semibold transition-all duration-200 text-left justify-start relative ${
                      !m.habilitado
                        ? 'opacity-40 bg-zinc-950/10 border-zinc-950/50 text-zinc-600 cursor-not-allowed'
                        : activo 
                        ? 'bg-zinc-900/40 text-cyan-400 border-cyan-500 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.08)] scale-[1.01]' 
                        : 'bg-zinc-900/40 border-zinc-900/60 text-zinc-400 hover:bg-zinc-900/90 hover:text-zinc-200 hover:border-zinc-800'
                    }`}
                  >
                    <Icono className={`h-4 w-4 lg:h-5 lg:w-5 shrink-0 transition-transform duration-200 ${!m.habilitado ? 'text-zinc-700' : activo ? 'text-cyan-400 scale-110' : 'text-zinc-500'}`} />
                    <span className="truncate">{m.nombre}</span>
                  </button>
                );
              })}
            </nav>

            {/* BOTÓN REPORTAR ESCRITORIO */}
            <button 
              onClick={() => setModalAbierto(true)}
              className="hidden lg:flex w-full bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-extrabold py-4 rounded-xl transition-all duration-300 items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(34,211,238,0.15)] active:scale-[0.99]"
            >
              <PlusCircle className="h-5 w-5 stroke-[2.5]" />
              <span className="text-base tracking-tight">{t.reportar}</span>
            </button>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <section className="lg:col-span-9">
            <div className="bg-zinc-900/10 border border-zinc-900/80 rounded-3xl lg:rounded-4xl p-5 lg:p-8 min-h-[55vh] lg:min-h-[65vh] shadow-xl backdrop-blur-sm overflow-hidden">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 lg:mb-8 pb-4 lg:pb-5 border-b border-zinc-900 overflow-hidden">
                <h2 className="text-xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <span className="h-6 lg:h-8 w-1 bg-cyan-500 rounded-full inline-block"></span>
                  {t.menus.find(m => m.id === menuActivo)?.nombre || "Categoría"}
                </h2>
                {!cargando && (
                  <span className="text-[15px] text-zinc-500 font-mono bg-zinc-900/50 border border-zinc-800/60 px-3 py-1.5 rounded-lg w-fit">
                    {datosFiltrados.length} resultados
                  </span>
                )}
              </div>

              {cargando ? (
                <div className="flex flex-col items-center justify-center py-20 lg:py-28">
                  <div className="w-10 h-10 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-400 text-xs lg:text-sm font-medium tracking-wide">Consultando base de datos...</p>
                </div>
              ) : datosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800/60 rounded-2xl bg-zinc-950/20 px-4 text-center">
                  <AlertTriangle className="h-7 w-7 text-zinc-600 mb-3" />
                  <p className="text-zinc-500 font-medium text-sm">
                    {busqueda ? 'No se encontraron resultados para tu búsqueda.' : 'No hay registros aprobados en esta categoría aún.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-5">
                  {datosFiltrados.map((item) => (
                    <div key={item.id} className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800/80 hover:bg-zinc-900/40 transition-all duration-300 rounded-2xl p-5 flex flex-col justify-between shadow-sm group overflow-hidden">
                      <div>
                        {/* CONTENEDOR HEADER DE LA TARJETA */}
                        <div className="flex items-center justify-between gap-3 mb-3 w-full overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {/* CÍRCULO VERDE DE VERIFICADO */}
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <h3 className="font-bold text-white text-[17px] lg:text-[19px] leading-snug group-hover:text-cyan-400 transition-colors duration-300 truncate">
                              {item.titulo || item.nombre || "Registro sin título"}
                            </h3>
                          </div>
                          
                          {item.categoria && (
                            <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-500/10 px-2.5 py-1 rounded-md shrink-0 whitespace-nowrap">
                              {item.categoria}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-zinc-400 text-[13px] lg:text-[14px] leading-relaxed mb-5 line-clamp-3">
                          {item.descripcion || item.detalles || "Sin descripción disponible."}
                        </p>
                      </div>
                      
                      {item.url && (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center text-[15px] justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs lg:text-sm font-semibold py-2.5 lg:py-3 rounded-xl transition-all duration-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 active:scale-[0.98]"
                        >
                          <span>Visitar Enlace</span> 
                          <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </section>
        </div>
      </div>

      {/* BOTÓN FLOTANTE MÓVIL */}
      <div className="lg:hidden fixed bottom-6 left-5 right-5 z-50">
        <button 
          onClick={() => setModalAbierto(true)}
          className="w-full bg-linear-to-r from-cyan-500 to-teal-500 text-zinc-950 font-black py-4 rounded-xl shadow-[0_8px_30px_rgba(34,211,238,0.25)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <PlusCircle className="h-5 w-5 stroke-[2.5]" />
          <span className="text-base tracking-tight">{t.reportar}</span>
        </button>
      </div>

      {/* --- MODAL DE REPORTAR DATOS --- */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white">Reportar Enlace o Sitio Web</h3>
              </div>
              <button 
                onClick={() => { setModalAbierto(false); setNotificacion({ tipo: '', texto: '' }); }}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={manejarEnvioReporte} className="p-6 space-y-4 overflow-y-auto">
              
              {notificacion.texto && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start gap-2.5 ${
                  notificacion.tipo === 'exito' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{notificacion.texto}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Título del Sitio *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Registro Civil Digital, Telemedicina Gratuita..."
                  value={formulario.titulo}
                  onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Dirección URL (Link) *</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://ejemplo.com/recurso"
                  value={formulario.url}
                  onChange={(e) => setFormulario({ ...formulario, url: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Categoría / Etiqueta</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Salud, Oficial, Donaciones..."
                    value={formulario.categoria}
                    onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alcance</label>
                  <div className="w-full bg-zinc-900/50 border border-zinc-900 text-zinc-500 rounded-xl px-4 py-3 text-sm select-none">
                    Nacional / Web
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Descripción del recurso *</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Describe brevemente qué información provee este enlace y cómo ayuda a los ciudadanos..."
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/80 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={enviando || notificacion.tipo === 'exito'}
                  className="w-full bg-linear-to-r from-cyan-500 to-teal-500 text-zinc-950 font-extrabold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(34,211,238,0.15)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enviando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <span>Enviar para Moderación</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
      `}} />
    </main>
  );
}