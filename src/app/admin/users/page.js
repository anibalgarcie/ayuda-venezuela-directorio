'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, Trash2, Shield, ShieldCheck, 
  LoaderCircle, RefreshCw, AlertTriangle, KeyRound, Mail, UserCog
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin', 'moderator'], { errorMap: () => ({ message: 'Selecciona un rol válido' }) })
});

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  
  const [errorForm, setErrorForm] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', role: 'moderator' }
  });

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUsuarioActual(session.user);

      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener la lista de usuarios.');
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error: ' + error.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleChangeRole = async (userId, nuevoRol) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: userId, role: nuevoRol })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar rol');
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: nuevoRol } : u));
    } catch (error) {
      alert('Error al cambiar rol: ' + error.message);
    }
  };

  const confirmarEliminar = (userId) => {
    if (userId === usuarioActual?.id) {
      alert('No puedes eliminar tu propia cuenta administrativa.');
      return;
    }
    setEliminandoId(userId);
    setAlertOpen(true);
  };

  const ejecutarEliminar = async () => {
    if (!eliminandoId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users?id=${eliminandoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');
      setUsuarios(prev => prev.filter(u => u.id !== eliminandoId));
    } catch (error) {
      alert('Error al eliminar usuario: ' + error.message);
    } finally {
      setAlertOpen(false);
      setEliminandoId(null);
    }
  };

  const abrirModalCrear = () => {
    reset({ email: '', password: '', role: 'moderator' });
    setErrorForm(null);
    setModalAbierto(true);
  };

  const onSubmit = async (values) => {
    setErrorForm(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(values)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario staff');

      setModalAbierto(false);
      cargarUsuarios();
    } catch (error) {
      setErrorForm(error.message);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold tracking-tight">
            Personal / Roles y Permisos
          </h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1">
            Registra nuevos miembros del equipo y gestiona los niveles de acceso al panel administrativo.
          </p>
        </div>
        
        <Button onClick={abrirModalCrear} className="gap-2">
          <UserPlus className="h-4.5 w-4.5" />
          <span>Registrar Usuario Staff</span>
        </Button>
      </div>

      {/* Explicación de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="flex gap-3 p-4 bg-blue-500/5 border-blue-500/10">
          <div className="p-2.5 h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs lg:text-sm font-bold text-foreground">Rol: Administrador (Admin)</h4>
            <p className="text-[10px] lg:text-xs text-muted-foreground leading-relaxed mt-1">
              Acceso total sin restricciones. Puede crear, modificar y eliminar a otros usuarios del staff, editar sus roles y moderar el directorio completo.
            </p>
          </div>
        </Card>

        <Card className="flex gap-3 p-4 bg-amber-500/5 border-amber-500/10">
          <div className="p-2.5 h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs lg:text-sm font-bold text-foreground">Rol: Moderador (Staff)</h4>
            <p className="text-[10px] lg:text-xs text-muted-foreground leading-relaxed mt-1">
              Acceso de control de datos. Puede crear, editar, eliminar y aprobar registros de directorio, pero no tiene acceso a este gestor de usuarios y roles.
            </p>
          </div>
        </Card>
      </div>

      {/* Lista de Usuarios */}
      <Card>
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <LoaderCircle className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-xs font-semibold">Cargando lista de personal...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center gap-3">
            <AlertTriangle className="h-7 w-7 text-muted-foreground animate-bounce" />
            <p className="text-muted-foreground font-medium text-xs lg:text-sm">No se encontraron perfiles de staff registrados.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario (Correo)</TableHead>
                <TableHead>Rol / Permisos</TableHead>
                <TableHead>Registrado el</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold text-xs uppercase shadow-inner">
                        {user.email?.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{user.email}</span>
                          {user.id === usuarioActual?.id && (
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 rounded font-semibold font-mono">Tú</Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{user.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <select
                      value={user.role}
                      disabled={user.id === usuarioActual?.id}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg border bg-transparent text-foreground cursor-pointer focus:outline-none transition-all ${
                        user.role === 'admin' 
                          ? 'border-primary/20 text-primary' 
                          : 'border-amber-500/20 text-amber-500'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <option value="admin">Administrador</option>
                      <option value="moderator">Moderador</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('es-VE', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={user.id === usuarioActual?.id}
                      onClick={() => confirmarEliminar(user.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal para Registrar Personal */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              <span>Registrar Personal</span>
            </DialogTitle>
            <DialogDescription>
              Crea una cuenta administrativa de acceso rápido para un nuevo miembro del equipo.
            </DialogDescription>
          </DialogHeader>

          {errorForm && (
            <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorForm}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  {...register('email')}
                  placeholder="staff@emergencia.com"
                  className="pl-9"
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Contraseña Temporal
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  {...register('password')}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-9"
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rol de Acceso
              </label>
              <select
                {...register('role')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-card text-foreground"
              >
                <option value="moderator">Moderador (Solo Directorio)</option>
                <option value="admin">Administrador (Acceso Total)</option>
              </select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
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
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Registrar Usuario'}
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
              Esta acción eliminará de forma permanente la cuenta administrativa y el perfil de acceso del usuario seleccionado de la base de datos de autenticación.
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
