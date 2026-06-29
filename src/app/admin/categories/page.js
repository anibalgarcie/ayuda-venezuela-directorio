'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { 
  Tags, Search, PlusCircle, Edit2, Trash2, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel
} from '@/components/ui/alert-dialog';

// Zod Schema
const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
});

export default function AdminCategories() {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  
  const [alertOpen, setAlertOpen] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [mensajeForm, setMensajeForm] = useState({ tipo: '', texto: '' });
  const [customCategories, setCustomCategories] = useState([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' }
  });

  // Load custom categories from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_categories');
      if (stored) {
        setCustomCategories(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read custom categories from localStorage:', e);
    }
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      // 1. Get directories from Supabase to count usage
      const { data, error } = await supabase
        .from('directorios_web')
        .select('categoria');
      if (error) throw error;

      // 2. Count categories usage
      const counts = {};
      (data || []).forEach(d => {
        if (d.categoria) {
          counts[d.categoria] = (counts[d.categoria] || 0) + 1;
        }
      });

      // 3. Fallback categories
      const fallbackCategoryNames = [
        'Salud', 'Oficial', 'Gobierno', 'Donaciones', 'Logística', 
        'Comunicación', 'Educación', 'Voluntariado', 'Tecnología', 
        'Seguridad', 'Alimentos', 'Noticias'
      ];

      // Retrieve locally saved custom categories
      let localCustom = [];
      try {
        const stored = localStorage.getItem('custom_categories');
        if (stored) localCustom = JSON.parse(stored);
      } catch (e) {}

      const uniqueNames = Array.from(new Set([
        ...fallbackCategoryNames,
        ...(data || []).map(d => d.categoria).filter(Boolean),
        ...localCustom
      ])).sort();

      const catList = uniqueNames.map(name => ({
        id: name,
        nombre: name,
        count: counts[name] || 0
      }));

      setDatos(catList);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const confirmarEliminar = (id) => {
    setEliminandoId(id);
    setAlertOpen(true);
  };

  const ejecutarEliminar = async () => {
    if (!eliminandoId) return;
    try {
      // Update directories in Supabase using this category to clear it
      const { error } = await supabase
        .from('directorios_web')
        .update({ categoria: '' })
        .eq('categoria', eliminandoId);

      if (error) throw error;

      // Remove from localStorage custom categories
      try {
        let localCustom = [];
        const stored = localStorage.getItem('custom_categories');
        if (stored) localCustom = JSON.parse(stored);
        
        const updated = localCustom.filter(c => c.toLowerCase() !== eliminandoId.toLowerCase());
        localStorage.setItem('custom_categories', JSON.stringify(updated));
        setCustomCategories(updated);
      } catch (e) {}

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
    reset({ nombre: '' });
    setMensajeForm({ tipo: '', texto: '' });
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    reset({ nombre: item.nombre || '' });
    setMensajeForm({ tipo: '', texto: '' });
    setModalAbierto(true);
  };

  const onSubmit = async (values) => {
    setMensajeForm({ tipo: '', texto: '' });
    const nuevoNombre = values.nombre.trim();
    try {
      if (editandoId) {
        // Renaming an existing category - Update all directories in Supabase
        const { error } = await supabase
          .from('directorios_web')
          .update({ categoria: nuevoNombre })
          .eq('categoria', editandoId);

        if (error) throw error;

        // Update in localStorage custom categories if present
        try {
          let localCustom = [];
          const stored = localStorage.getItem('custom_categories');
          if (stored) localCustom = JSON.parse(stored);
          
          const updated = localCustom.map(c => c.toLowerCase() === editandoId.toLowerCase() ? nuevoNombre : c);
          localStorage.setItem('custom_categories', JSON.stringify(updated));
          setCustomCategories(updated);
        } catch (e) {}
      } else {
        // Creating a new category - Add to localStorage custom categories
        try {
          let localCustom = [];
          const stored = localStorage.getItem('custom_categories');
          if (stored) localCustom = JSON.parse(stored);
          
          if (!localCustom.some(c => c.toLowerCase() === nuevoNombre.toLowerCase())) {
            localCustom.push(nuevoNombre);
            localStorage.setItem('custom_categories', JSON.stringify(localCustom));
            setCustomCategories(localCustom);
          }
        } catch (e) {}
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
    return (item.nombre || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight">
            Gestión de Categorías
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1">
            Crea, edita y elimina categorías para usar en el directorio y reporte.
          </p>
        </div>
        
        <Button onClick={abrirModalCrear} className="gap-2">
          <PlusCircle className="h-4.5 w-4.5" />
          <span>Nueva Categoría</span>
        </Button>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-end bg-card border border-border rounded-xl p-4">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar categoría..."
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
            <p className="text-muted-foreground text-xs font-semibold">Cargando categorías...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
            <AlertTriangle className="h-7 w-7 text-muted-foreground animate-bounce" />
            <p className="text-muted-foreground font-medium text-xs lg:text-sm">No se encontraron categorías.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre de la Categoría</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datosFiltrados.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-muted-foreground text-xs">{item.id}</TableCell>
                  <TableCell className="font-bold text-foreground">{item.nombre}</TableCell>
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
              {editandoId ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription>
              Asigna un nombre descriptivo a la categoría de los recursos web.
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
              <Label htmlFor="cat-nombre">Nombre de Categoría</Label>
              <Input
                id="cat-nombre"
                {...register('nombre')}
                placeholder="Ej: Salud"
              />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-6">
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
              Eliminar esta categoría puede afectar a los registros del directorio que la estén utilizando en este momento.
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
