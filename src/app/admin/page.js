'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Chart } from 'chart.js/auto';
import { 
  Globe, Clock, Eye, MousePointerClick, ArrowRight,
  RefreshCw, AlertTriangle, LayoutDashboard, BarChart3, LineChart
} from 'lucide-react';

export default function AdminDashboardHome() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [stats, setStats] = useState({
    totalDirectorios: 0,
    pendientes: 0,
    aprobados: 0,
    totalVisitas: 0,
    totalClicks: 0
  });

  // Datos para los gráficos
  const [datosVisitasSemana, setDatosVisitasSemana] = useState({ labels: [], data: [] });
  const [datosTopWebs, setDatosTopWebs] = useState({ labels: [], data: [] });

  // Referencias para los gráficos Chart.js
  const canvasVisitasRef = useRef(null);
  const canvasTopWebsRef = useRef(null);
  const chartVisitasInstancia = useRef(null);
  const chartTopWebsInstancia = useRef(null);

  const fetchStats = async () => {
    setCargando(true);
    try {
      // 1. Obtener registros de directorios_web para contadores y clics
      const { data: directorios, error: dirError } = await supabase
        .from('directorios_web')
        .select('aprobado, clicks');

      if (dirError) throw dirError;

      const totalDir = directorios?.length || 0;
      const pend = directorios?.filter(d => !d.aprobado).length || 0;
      const aprob = directorios?.filter(d => d.aprobado).length || 0;
      const totalClicks = directorios?.reduce((acc, curr) => acc + (curr.clicks || 0), 0) || 0;

      // 2. Obtener total histórico de vistas de página
      const { count: totalViewsCount, error: viewsCountError } = await supabase
        .from('analytics_views')
        .select('*', { count: 'exact', head: true });

      if (viewsCountError) throw viewsCountError;

      setStats({
        totalDirectorios: totalDir,
        pendientes: pend,
        aprobados: aprob,
        totalVisitas: totalViewsCount || 0,
        totalClicks
      });

      // 3. Obtener visitas de los últimos 7 días para gráfico de línea
      const sieteDiasAtras = new Date();
      sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 7);
      
      const { data: visitas7Dias, error: errorVisitas7 } = await supabase
        .from('analytics_views')
        .select('creado_en')
        .gte('creado_en', sieteDiasAtras.toISOString());

      if (errorVisitas7) throw errorVisitas7;

      // Agrupar visitas por fecha local
      const conteoDiario = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
        conteoDiario[label] = 0;
      }

      visitas7Dias?.forEach(v => {
        const label = new Date(v.creado_en).toLocaleDateString('es-VE', { month: 'short', day: 'numeric' });
        if (conteoDiario[label] !== undefined) {
          conteoDiario[label]++;
        }
      });

      setDatosVisitasSemana({
        labels: Object.keys(conteoDiario),
        data: Object.values(conteoDiario)
      });

      // 4. Obtener Top 5 de directorios con más clics para gráfico de barras
      const { data: topWebs, error: topWebsError } = await supabase
        .from('directorios_web')
        .select('titulo, clicks')
        .order('clicks', { ascending: false })
        .limit(5);

      if (topWebsError) throw topWebsError;

      setDatosTopWebs({
        labels: topWebs?.map(w => w.titulo || 'Sin título') || [],
        data: topWebs?.map(w => w.clicks || 0) || []
      });

    } catch (err) {
      console.error('Error al cargar analíticas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Efecto para renderizar / actualizar Gráfico de Visitas
  useEffect(() => {
    if (cargando || !canvasVisitasRef.current) return;

    if (chartVisitasInstancia.current) {
      chartVisitasInstancia.current.destroy();
    }

    const ctx = canvasVisitasRef.current.getContext('2d');
    
    // Crear degradado para la línea
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(34, 211, 238, 0.3)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.0)');

    chartVisitasInstancia.current = new Chart(canvasVisitasRef.current, {
      type: 'line',
      data: {
        labels: datosVisitasSemana.labels,
        datasets: [{
          label: 'Vistas de Página',
          data: datosVisitasSemana.data,
          borderColor: '#22d3ee', // cyan-400
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#22d3ee',
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#fff',
            bodyColor: '#a1a1aa',
            borderColor: '#27272a',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          y: {
            grid: { color: 'rgba(39, 39, 42, 0.4)' },
            ticks: { color: '#71717a', stepSize: 1 }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#71717a' }
          }
        }
      }
    });

    return () => {
      if (chartVisitasInstancia.current) {
        chartVisitasInstancia.current.destroy();
      }
    };
  }, [cargando, datosVisitasSemana]);

  // Efecto para renderizar / actualizar Gráfico de Webs Más Clickeadas
  useEffect(() => {
    if (cargando || !canvasTopWebsRef.current) return;

    if (chartTopWebsInstancia.current) {
      chartTopWebsInstancia.current.destroy();
    }

    const ctx = canvasTopWebsRef.current.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, '#a855f7'); // purple-500
    gradient.addColorStop(1, '#6366f1'); // indigo-500

    chartTopWebsInstancia.current = new Chart(canvasTopWebsRef.current, {
      type: 'bar',
      data: {
        labels: datosTopWebs.labels.map(l => l.length > 20 ? l.slice(0, 20) + '...' : l),
        datasets: [{
          label: 'Clics en el Botón',
          data: datosTopWebs.data,
          backgroundColor: gradient,
          borderRadius: 8,
          borderSkipped: false,
          maxBarThickness: 24
        }]
      },
      options: {
        indexAxis: 'y', // Convertir en barras horizontales
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#18181b',
            titleColor: '#fff',
            bodyColor: '#a1a1aa',
            borderColor: '#27272a',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(39, 39, 42, 0.4)' },
            ticks: { color: '#71717a', stepSize: 1 }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#71717a' }
          }
        }
      }
    });

    return () => {
      if (chartTopWebsInstancia.current) {
        chartTopWebsInstancia.current.destroy();
      }
    };
  }, [cargando, datosTopWebs]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-zinc-800 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 text-xs lg:text-sm font-medium">Consultando métricas de analíticas...</p>
      </div>
    );
  }

  const cardsStats = [
    { 
      label: 'Registros Totales', 
      valor: stats.totalDirectorios, 
      desc: `${stats.aprobados} aprobados | ${stats.pendientes} pendientes`,
      icono: Globe, 
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/10'
    },
    { 
      label: 'Pendientes de Revisión', 
      valor: stats.pendientes, 
      desc: 'Requieren validación manual',
      icono: Clock, 
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/10'
    },
    { 
      label: 'Páginas Vistas (Total)', 
      valor: stats.totalVisitas, 
      desc: 'Tráfico acumulado del sitio',
      icono: Eye, 
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/10'
    },
    { 
      label: 'Clics en Enlaces (Total)', 
      valor: stats.totalClicks, 
      desc: 'Redirecciones a sitios web',
      icono: MousePointerClick, 
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/10'
    },
  ];

  return (
    <div className="space-y-8 select-none">
      
      {/* Saludo y Cabecera con Refrescar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Métricas de <span className="bg-linear-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Analíticas</span>
          </h1>
          <p className="text-zinc-500 text-xs lg:text-sm mt-1.5 font-medium">
            Monitorea el tráfico de visitas y los enlaces con mayor relevancia en el directorio.
          </p>
        </div>

        <button 
          onClick={fetchStats}
          className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-inner"
        >
          <RefreshCw className="h-4 w-4 text-cyan-400" />
          <span>Actualizar Datos</span>
        </button>
      </div>

      {/* Grid de Contadores de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {cardsStats.map((card, i) => {
          const Icono = card.icono;
          return (
            <div 
              key={i} 
              className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-zinc-800 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] lg:text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{card.label}</p>
                  <p className="text-2xl lg:text-3xl font-black text-white tracking-tight mt-1">{card.valor}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${card.bgColor} ${card.color} shadow-inner`}>
                  <Icono className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-950 text-[11px] text-zinc-500 font-medium">
                {card.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de Gráficos Integrados */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Gráfico 1: Vistas Últimos 7 Días */}
        <div className="lg:col-span-7 bg-[#0d0d11]/80 border border-zinc-900 rounded-3xl p-5 lg:p-6 shadow-xl flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm lg:text-base font-bold text-white">Vistas del Portal (Últimos 7 Días)</h3>
          </div>
          <div className="relative flex-1 min-h-[220px]">
            <canvas ref={canvasVisitasRef} />
          </div>
        </div>

        {/* Gráfico 2: Top 5 Sitios Más Visitados */}
        <div className="lg:col-span-5 bg-[#0d0d11]/80 border border-zinc-900 rounded-3xl p-5 lg:p-6 shadow-xl flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            <h3 className="text-sm lg:text-base font-bold text-white">Top 5 Webs Más Clickeadas</h3>
          </div>
          <div className="relative flex-1 min-h-[220px]">
            {datosTopWebs.data.length === 0 || datosTopWebs.data.every(c => c === 0) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-6 w-6 text-zinc-650 mb-2" />
                <p className="text-zinc-500 text-xs font-semibold">No hay registros de clics en enlaces aún.</p>
              </div>
            ) : (
              <canvas ref={canvasTopWebsRef} />
            )}
          </div>
        </div>

      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gestión del Directorio */}
        <div className="bg-zinc-900/10 border border-zinc-900/80 rounded-3xl p-6 lg:p-7 flex flex-col justify-between hover:border-zinc-800 transition-all duration-300">
          <div>
            <div className="h-2 w-10 bg-cyan-500 rounded-full mb-4"></div>
            <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">
              Control de Directorio
            </h3>
            <p className="text-zinc-500 text-xs lg:text-sm mt-1.5 leading-relaxed">
              Modera las solicitudes de enlaces web recibidas de la comunidad, edita información incorrecta o aprueba registros pendientes.
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/admin/directories')}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs lg:text-sm font-semibold py-3 px-4 rounded-xl mt-6 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all duration-300 group w-full lg:w-fit"
          >
            <span>Ir al Gestor del Directorio</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Auditoría / Seguridad */}
        <div className="bg-zinc-900/10 border border-zinc-900/80 rounded-3xl p-6 lg:p-7 flex flex-col justify-between hover:border-zinc-800 transition-all duration-300">
          <div>
            <div className="h-2 w-10 bg-purple-500 rounded-full mb-4"></div>
            <h3 className="text-lg lg:text-xl font-bold text-white tracking-tight">
              Usuarios y Seguridad
            </h3>
            <p className="text-zinc-500 text-xs lg:text-sm mt-1.5 leading-relaxed">
              Registra nuevos administradores o moderadores para el staff, audita los roles y modifica permisos de acceso.
            </p>
          </div>
          
          <button 
            onClick={() => router.push('/admin/users')}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs lg:text-sm font-semibold py-3 px-4 rounded-xl mt-6 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all duration-300 group w-full lg:w-fit"
          >
            <span>Ir al Gestor de Usuarios</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

      </div>

    </div>
  );
}
