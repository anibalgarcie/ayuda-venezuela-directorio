'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Tags, Search, PlusCircle, Edit2, Trash2, X, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function AdminCategories() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  // Estados para modal de edición/creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [procesandoForm, setProcesandoForm] = useState(false);

  // Cargar registros
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('categorias_web')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      setDatos(data || []);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Eliminar un registro
  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Esto podría afectar a los directorios que la usen.')) return;

    try {
      const { error } = await supabase
        .from('categorias_web')
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
    setNombre('');
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    setNombre(item.nombre || '');
    setModalAbierto(true);
  };

  // Guardar formulario (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setProcesandoForm(true);

    const payload = {
      nombre: nombre.trim()
    };

    try {
      if (editandoId) {
        // Editar
        const { error } = await supabase
          .from('categorias_web')
          .update(payload)
          .eq('id', editandoId);

        if (error) throw error;
      } else {
        // Crear
        const { error } = await supabase
          .from('categorias_web')
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
    const texto = `${item.nombre}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold text-white tracking-tight">
            Gestión de Categorías
          </h1>
          <p className="text-zinc-500 text-xs lg:text-sm mt-1">
            Crea, edita y elimina categorías para usar en el directorio y reporte.
          </p>
        </div>
        
        <button
          onClick={abrirModalCrear}
          className="flex items-center justify-center gap-2 bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-black px-5 py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(34,211,238,0.15)] text-xs lg:text-sm active:scale-[0.98]"
        >
          <PlusCircle className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-end bg-zinc-900/10 border border-zinc-900 rounded-2xl p-4">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar categoría..."
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
            <p className="text-zinc-500 text-xs font-semibold">Cargando categorías...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertTriangle className="h-7 w-7 text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-medium text-xs lg:text-sm">No se encontraron categorías.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs lg:text-sm">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4.5">ID</th>
                  <th className="px-6 py-4.5 w-full">Nombre de la Categoría</th>
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {datosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                      {item.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-white truncate">{item.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2 justify-end w-full">
                        <button
                          onClick={() => abrirModalEditar(item)}
                          title="Editar categoría"
                          className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleEliminar(item.id)}
                          title="Eliminar categoría"
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
          
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 backdrop-blur-xl rounded-3xl p-6 lg:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
              <h3 className="text-base lg:text-lg font-bold text-white">
                {editandoId ? 'Editar Categoría' : 'Nueva Categoría'}
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
                  Nombre de Categoría
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Salud"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                />
              </div>

              {/* Botones de acción del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 mt-6">
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
                    <span>Guardar</span>
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
