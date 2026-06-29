'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { 
  Globe, Search, PlusCircle, Edit2, Trash2, Check, X, 
  ExternalLink, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog';

// Zod Schema for validation
const schema = z.object({
  titulo: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  url: z.string().url('Ingresa una dirección URL válida (ej. https://ejemplo.com)'),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  aprobado: z.boolean().default(false)
});

export default function AdminDirectories() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroAprobado, setFiltroAprobado] = useState('todos');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  const [alertOpen, setAlertOpen] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [categoriasDB, setCategoriasDB] = useState([]);
  const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      categoria: 'Enlaces y Sitios Web',
      url: '',
      descripcion: '',
      aprobado: false
    }
  });

  const aprobadoValue = watch('aprobado');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const { data: catData } = await supabase.from('categorias_web').select('*').order('nombre', { ascending: true });
      if (catData) setCategoriasDB(catData);

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

  const handleToggleAprobado = async (id, estadoActual) => {
    try {
      const { error } = await supabase
        .from('directorios_web')
        .update({ aprobado: !estadoActual })
        .eq('id', id);

      if (error) throw error;
      setDatos(prev => prev.map(item => item.id === id ? { ...item, aprobado: !estadoActual } : item));
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const confirmarEliminar = (id) => {
    setEliminandoId(id);
    setAlertOpen(true);
  };

  const ejecutarEliminar = async () => {
    if (!eliminandoId) return;
    try {
      const { error } = await supabase
        .from('directorios_web')
        .delete()
        .eq('id', eliminandoId);

      if (error) throw error;
      setDatos(prev => prev.filter(item => item.id !== eliminandoId));
    } catch (error) {
      alert('Error al eliminar registro: ' + error.message);
    } finally {
      setAlertOpen(false);
      setEliminandoId(null);
    }
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    reset({
      titulo: '',
      categoria: 'General',
      url: '',
      descripcion: '',
      aprobado: true
    });
    setMensajeForm({ tipo: '', texto: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    reset({
      titulo: item.titulo || '',
      categoria: item.categoria || 'General',
      url: item.url || '',
      descripcion: item.descripcion || item.detalles || '',
      aprobado: item.aprobado || false
    });
    setMensajeForm({ tipo: '', texto: '' });
    setModalAbierto(true);
  };

  const onSubmit = async (values) => {
    setMensajeForm({ tipo: '', texto: '' });
    try {
      if (editandoId) {
        const { error } = await supabase
          .from('directorios_web')
          .update(values)
          .eq('id', editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('directorios_web')
          .insert([values]);
        if (error) throw error;
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      setMensajeForm({ tipo: 'error', texto: error.message });
    }
  };

  const datosFiltrados = datos.filter(item => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.titulo || '').toLowerCase().includes(q) ||
      (item.descripcion || '').toLowerCase().includes(q) ||
      (item.categoria || '').toLowerCase().includes(q) ||
      (item.url || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight">
            Gestión de Directorio
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1">
            Modera, edita y crea registros para la tabla <code className="text-primary font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">directorios_web</code>.
          </p>
        </div>
        
        <Button onClick={abrirModalCrear} className="gap-2">
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Crear Registro</span>
        </Button>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border rounded-xl p-4">
        {/* Pestañas de Filtro */}
        <div className="flex bg-muted p-1 rounded-lg border border-border w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'aprobados', label: 'Aprobados' },
            { id: 'pendientes', label: 'Pendientes' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFiltroAprobado(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all w-full md:w-auto text-center ${
                filtroAprobado === tab.id
                  ? 'bg-background text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar registro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Contenedor Principal (Tabla) */}
      <Card>
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-xs font-semibold">Cargando registros...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
            <AlertTriangle className="h-7 w-7 text-muted-foreground animate-bounce" />
            <p className="text-muted-foreground font-medium text-xs lg:text-sm">No se encontraron registros que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registro</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Enlace</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="py-3">
                    <div className="font-bold text-foreground max-w-xs md:max-w-sm truncate">{item.titulo}</div>
                    <div className="text-muted-foreground text-[11px] max-w-xs md:max-w-sm truncate mt-0.5">{item.descripcion || 'Sin descripción'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase font-semibold tracking-wide text-[10px]">
                      {item.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {item.url ? (
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span className="truncate">{item.url}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground font-mono">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAprobado(item.id, item.aprobado)}
                      className="h-7 px-2.5 rounded-full"
                    >
                      {item.aprobado ? (
                        <Badge variant="success" className="gap-1 rounded-full text-[10px]">
                          <Check className="h-2.5 w-2.5" /> Aprobado
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="gap-1 rounded-full text-[10px]">
                          <X className="h-2.5 w-2.5" /> Pendiente
                        </Badge>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => abrirModalEditar(item)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmarEliminar(item.id)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal para Crear / Editar */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editandoId ? 'Editar Registro' : 'Nuevo Registro de Directorio'}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del recurso web para agregarlo al directorio verificado.
            </DialogDescription>
          </DialogHeader>

          {mensajeForm.texto && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{mensajeForm.texto}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Título / Nombre
              </label>
              <Input
                {...register('titulo')}
                placeholder="Ej: SOS Telecomunicaciones"
              />
              {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categoría
              </label>
              <select
                {...register('categoria')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card text-foreground"
              >
                <option value="">Seleccionar Categoría...</option>
                {categoriasDB.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </select>
              {errors.categoria && <p className="text-xs text-destructive">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                URL del Enlace Web
              </label>
              <Input
                {...register('url')}
                placeholder="https://ejemplo.com"
              />
              {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Descripción / Detalles
              </label>
              <Textarea
                {...register('descripcion')}
                placeholder="Explica brevemente de qué trata este enlace web..."
                rows={3}
              />
              {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
            </div>

            {/* Switch de Aprobación */}
            <div className="flex items-center justify-between border border-border rounded-xl p-3 bg-muted/20">
              <div>
                <p className="text-xs font-bold">Aprobado / Activo</p>
                <p className="text-[10px] text-muted-foreground">Los registros aprobados se muestran al público de inmediato.</p>
              </div>
              <Switch
                checked={aprobadoValue}
                onCheckedChange={(checked) => setValue('aprobado', checked)}
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para eliminación */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el registro de forma permanente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={ejecutarEliminar} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
