'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Globe, Search, PlusCircle, Edit2, Trash2, Check, X, 
  ExternalLink, CheckSquare, Square, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function AdminDirectories() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAprobado, setFiltroAprobado] = useState('todos'); // 'todos', 'aprobados', 'pendientes'
  
  // Estados para modal de edición/creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [url, setUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [aprobado, setAprobado] = useState(false);
  const [procesandoForm, setProcesandoForm] = useState(false);

  // Cargar registros
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      let query = supabase.from('directorios_web').select('*');
      
      if (filtroAprobado === 'aprobados') {
        query = query.eq('aprobado', true);
      } else if (filtroAprobado === 'pendientes') {
        query = query.eq('aprobado', false);
      }
      
      const { data, error } = await query.order('creado_en', { ascending: false });
      if (error) throw error;
      setDatos(data || []);
    } catch (error) {
      console.error('Error al cargar directorios:', error);
    } finally {
      setCargando(false);
    }
  }, [filtroAprobado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Alternar estado de aprobación rápidamente
  const handleToggleAprobado = async (id, estadoActual) => {
    try {
      const { error } = await supabase
        .from('directorios_web')
        .update({ aprobado: !estadoActual })
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local rápido
      setDatos(prev => prev.map(item => item.id === id ? { ...item, aprobado: !estadoActual } : item));
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  // Eliminar un registro
  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro permanentemente?')) return;

    try {
      const { error } = await supabase
        .from('directorios_web')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDatos(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      alert('Error al eliminar registro: ' + error.message);
    }
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setEditandoId(null);
    setTitulo('');
    setCategoria('Enlaces y Sitios Web');
    setUrl('');
    setDescripcion('');
    setAprobado(true); // Registros manuales del admin se aprueban por defecto
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    setTitulo(item.titulo || '');
    setCategoria(item.categoria || '');
    setUrl(item.url || '');
    setDescripcion(item.descripcion || item.detalles || '');
    setAprobado(item.aprobado || false);
    setModalAbierto(true);
  };

  // Guardar formulario (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesandoForm(true);

    const payload = {
      titulo,
      categoria,
      url,
      descripcion,
      aprobado
    };

    try {
      if (editandoId) {
        // Editar
        const { error } = await supabase
          .from('directorios_web')
          .update(payload)
          .eq('id', editandoId);

        if (error) throw error;
      } else {
        // Crear
        const { error } = await supabase
          .from('directorios_web')
          .insert([payload]);

        if (error) throw error;
      }

      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      alert('Error al guardar datos: ' + error.message);
    } finally {
      setProcesandoForm(false);
    }
  };

  // Filtrar localmente por búsqueda de texto
  const datosFiltrados = datos.filter(item => {
    const texto = `${item.titulo} ${item.categoria} ${item.descripcion} ${item.url}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Directorio
          </h1>
          <p className="text-zinc-500 text-xs lg:text-sm mt-1">
            Modera, edita y crea registros para la tabla <code className="text-cyan-400 font-mono text-[11px] bg-zinc-950 px-1.5 py-0.5 rounded">directorios_web</code>.
          </p>
        </div>
        
        <button
          onClick={abrirModalCrear}
          className="flex items-center justify-center gap-2 bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-black px-5 py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(34,211,238,0.15)] text-xs lg:text-sm active:scale-[0.98]"
        >
          <PlusCircle className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Crear Registro</span>
        </button>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4">
        {/* Pestañas de Filtro */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/60 w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'aprobados', label: 'Aprobados' },
            { id: 'pendientes', label: 'Pendientes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroAprobado(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all w-full md:w-auto text-center ${
                filtroAprobado === tab.id
                  ? 'bg-zinc-900 text-cyan-400 border border-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar registro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/80 transition-all duration-300"
          />
        </div>
      </div>

      {/* Contenedor Principal (Tabla) */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl overflow-hidden shadow-xl">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-zinc-500 text-xs font-semibold">Cargando registros...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertTriangle className="h-7 w-7 text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-medium text-xs lg:text-sm">No se encontraron registros que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs lg:text-sm">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4.5">Registro</th>
                  <th className="px-6 py-4.5">Categoría</th>
                  <th className="px-6 py-4.5">Enlace</th>
                  <th className="px-6 py-4.5 text-center">Estado</th>
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {datosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white max-w-xs md:max-w-sm truncate">{item.titulo}</div>
                      <div className="text-zinc-500 text-[11px] max-w-xs md:max-w-sm truncate mt-0.5">{item.descripcion || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      {item.url ? (
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-cyan-500 hover:text-cyan-400 inline-flex items-center gap-1 hover:underline"
                        >
                          <span className="truncate max-w-[150px]">{item.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-zinc-600 font-mono">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleAprobado(item.id, item.aprobado)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide transition-all ${
                          item.aprobado
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        }`}
                      >
                        {item.aprobado ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>Aprobado</span>
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 text-amber-400" />
                            <span>Pendiente</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => abrirModalEditar(item)}
                          title="Editar registro"
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(item.id)}
                          title="Eliminar registro"
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Overlay para Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setModalAbierto(false)}></div>
          
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 backdrop-blur-xl rounded-3xl p-6 lg:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
              <h3 className="text-base lg:text-lg font-bold text-white">
                {editandoId ? 'Editar Registro' : 'Nuevo Registro de Directorio'}
              </h3>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Título / Nombre
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="SOS Telecomunicaciones"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Categoría
                </label>
                <input
                  type="text"
                  required
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Enlaces y Sitios Web"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  URL del Enlace Web
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://ejemplo.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Descripción / Detalles
                </label>
                <textarea
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Explica brevemente de qué trata este enlace web..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all resize-none"
                />
              </div>

              {/* Toggle de Aprobación */}
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setAprobado(!aprobado)}
                  className="text-cyan-400 focus:outline-none"
                >
                  {aprobado ? (
                    <CheckSquare className="h-6 w-6 stroke-[2]" />
                  ) : (
                    <Square className="h-6 w-6 stroke-[2] text-zinc-600" />
                  )}
                </button>
                <div>
                  <p className="text-xs font-bold text-white">Aprobar registro de inmediato</p>
                  <p className="text-[10px] text-zinc-500">Los registros aprobados se muestran al público en general.</p>
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950 transition-all text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoForm}
                  className="bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-black px-5 py-2.5 rounded-xl transition-all text-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5"
                >
                  {procesandoForm ? (
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <span>{editandoId ? 'Guardar Cambios' : 'Crear Registro'}</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
