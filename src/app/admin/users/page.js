'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, Trash2, Shield, ShieldCheck, 
  Loader2, RefreshCw, X, AlertTriangle, KeyRound, Mail, UserCog
} from 'lucide-react';

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Estados para modal de creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('moderator'); // 'admin' o 'moderator'
  const [procesandoForm, setProcesandoForm] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  // Cargar lista de usuarios llamando a nuestra API interna
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

  // Cambiar rol de un usuario
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

      // Actualizar estado local
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: nuevoRol } : u));
    } catch (error) {
      alert('Error al cambiar rol: ' + error.message);
    }
  };

  // Eliminar un usuario
  const handleEliminarUsuario = async (userId) => {
    if (userId === usuarioActual?.id) {
      alert('No puedes eliminar tu propia cuenta administrativa.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esto borrará su acceso de autenticación y su perfil.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar usuario');

      setUsuarios(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      alert('Error al eliminar usuario: ' + error.message);
    }
  };

  // Abrir modal de creación
  const abrirModalCrear = () => {
    setEmail('');
    setPassword('');
    setRole('moderator');
    setErrorForm(null);
    setModalAbierto(true);
  };

  // Enviar formulario de creación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcesandoForm(true);
    setErrorForm(null);

    if (password.length < 6) {
      setErrorForm('La contraseña debe tener al menos 6 caracteres.');
      setProcesandoForm(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario staff');

      setModalAbierto(false);
      cargarUsuarios();
    } catch (error) {
      setErrorForm(error.message);
    } finally {
      setProcesandoForm(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-extrabold text-white tracking-tight">
            Personal / Roles y Permisos
          </h1>
          <p className="text-zinc-500 text-xs lg:text-sm mt-1">
            Registra nuevos miembros del equipo y gestiona los niveles de acceso al panel administrativo.
          </p>
        </div>
        
        <button
          onClick={abrirModalCrear}
          className="flex items-center justify-center gap-2 bg-linear-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-zinc-950 font-black px-5 py-3 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(34,211,238,0.15)] text-xs lg:text-sm active:scale-[0.98]"
        >
          <UserPlus className="h-4.5 w-4.5 stroke-[2.5]" />
          <span>Registrar Usuario Staff</span>
        </button>
      </div>

      {/* Explicación de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0c0f17] border border-cyan-500/10 p-4 rounded-2xl flex gap-3">
          <div className="p-2.5 h-10 w-10 shrink-0 rounded-xl bg-cyan-950 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs lg:text-sm font-bold text-white">Rol: Administrador (Admin)</h4>
            <p className="text-[10px] lg:text-xs text-zinc-500 leading-relaxed mt-1">
              Acceso total sin restricciones. Puede crear, modificar y eliminar a otros usuarios del staff, editar sus roles y moderar el directorio completo.
            </p>
          </div>
        </div>

        <div className="bg-[#18110b] border border-amber-500/10 p-4 rounded-2xl flex gap-3">
          <div className="p-2.5 h-10 w-10 shrink-0 rounded-xl bg-amber-950 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs lg:text-sm font-bold text-white">Rol: Moderador (Staff)</h4>
            <p className="text-[10px] lg:text-xs text-zinc-500 leading-relaxed mt-1">
              Acceso de control de datos. Puede crear, editar, eliminar y aprobar registros de directorio, pero no tiene acceso a este gestor de usuarios y roles.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl overflow-hidden shadow-xl">
        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-zinc-500 text-xs font-semibold">Cargando lista de personal...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <AlertTriangle className="h-7 w-7 text-zinc-700 mb-3" />
            <p className="text-zinc-500 font-medium text-xs lg:text-sm">No se encontraron perfiles de staff registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs lg:text-sm">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-900 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4.5">Usuario (Correo)</th>
                  <th className="px-6 py-4.5">Rol / Permisos</th>
                  <th className="px-6 py-4.5">Registrado el</th>
                  <th className="px-6 py-4.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-bold text-xs uppercase shadow-inner">
                          {user.email?.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.email}</span>
                            {user.id === usuarioActual?.id && (
                              <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md font-semibold font-mono">Tú</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        disabled={user.id === usuarioActual?.id}
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-xl border bg-zinc-950 focus:outline-none transition-all cursor-pointer ${
                          user.role === 'admin' 
                            ? 'border-cyan-500/20 text-cyan-400 focus:border-cyan-500' 
                            : 'border-amber-500/20 text-amber-400 focus:border-amber-500'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="moderator">Moderador</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('es-VE', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEliminarUsuario(user.id)}
                        disabled={user.id === usuarioActual?.id}
                        title="Eliminar usuario"
                        className="p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Personal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setModalAbierto(false)}></div>
          
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 backdrop-blur-xl rounded-3xl p-6 lg:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
              <h3 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                <UserCog className="h-5 w-5 text-cyan-400" />
                <span>Registrar Personal</span>
              </h3>
              <button 
                onClick={() => setModalAbierto(false)} 
                className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error local */}
            {errorForm && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{errorForm}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@emergencia.com"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-10 pr-4 py-2.5 text-xs lg:text-sm text-white placeholder-zinc-650 focus:outline-none focus:border-cyan-500/80 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] lg:text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Rol de Acceso
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2.5 text-xs lg:text-sm text-white focus:outline-none focus:border-cyan-500/80 transition-all cursor-pointer font-semibold"
                >
                  <option value="moderator">Moderador (Solo Directorio)</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>

              {/* Botones de acción */}
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
                    <span>Registrar Usuario</span>
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
