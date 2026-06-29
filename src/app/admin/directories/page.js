'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// ── SVGs ──────────────────────────────────────────────────────────────────────
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const IconEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconExternal = () => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>);
const IconX = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconAlert = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconChevLeft = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>);
const IconChevRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>);
const IconLoader = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#003cc3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>);
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

const schema = z.object({
  titulo:      z.string().min(2, 'Mínimo 2 caracteres'),
  categoria:   z.string().min(1, 'Selecciona una categoría'),
  url:         z.string().url('URL inválida (ej. https://ejemplo.com)'),
  descripcion: z.string().min(5, 'Mínimo 5 caracteres'),
  estado:      z.enum(['pendiente', 'aprobado', 'rechazado']).default('pendiente'),
  destacado:   z.boolean().default(false),
  activo:      z.boolean().default(true),
});

const FALLBACK_CATS = ['Alimentos','Comunicación','Donaciones','Educación','Gobierno','Logística','Noticias','Oficial','Salud','Seguridad','Tecnología','Voluntariado'];
const ESTADO_CFG   = { aprobado: { bg:'#f0fdf4', color:'#16a34a' }, pendiente: { bg:'#fffbeb', color:'#d97706' }, rechazado: { bg:'#fff1f2', color:'#e11d48' } };

// ── Reusable sub-components ───────────────────────────────────────────────────
function Toggle({ checked, onChange, activeColor = '#003cc3' }) {
  return (
    <button type="button" onClick={onChange} style={{ width:'38px', height:'20px', borderRadius:'10px', background: checked ? activeColor : '#e2e8f0', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <span style={{ position:'absolute', top:'2px', left: checked ? '20px' : '2px', width:'16px', height:'16px', borderRadius:'50%', background:'#fff', transition:'left 0.18s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.42)', backdropFilter:'blur(3px)' }} onClick={onClose} />
      <div style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:'20px', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', width:'100%', maxWidth:'540px', maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 24px 0' }}>
          <div>
            <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#0f172a', marginBottom:'4px' }}>{title}</h2>
            {description && <p style={{ fontSize:'13px', color:'#94a3b8' }}>{description}</p>}
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#f1f5f9', borderRadius:'8px', padding:'6px', cursor:'pointer', color:'#64748b', display:'flex', marginLeft:'12px', flexShrink:0 }}><IconX /></button>
        </div>
        <div style={{ padding:'20px 24px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, onCancel, onConfirm, message }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.48)', backdropFilter:'blur(3px)' }} onClick={onCancel} />
      <div style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:'16px', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', width:'100%', maxWidth:'380px', padding:'28px' }}>
        <h3 style={{ fontSize:'16px', fontWeight:'800', color:'#0f172a', marginBottom:'10px' }}>¿Confirmas la eliminación?</h3>
        <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.6', marginBottom:'24px' }}>{message || 'Esta acción no se puede deshacer. El registro se eliminará permanentemente.'}</p>
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'9px 18px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding:'9px 18px', borderRadius:'10px', border:'none', background:'#e11d48', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

const fieldLabel = { display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' };
const inputBase  = (err) => ({ width:'100%', height:'42px', padding:'0 12px', borderRadius:'10px', border:`1.5px solid ${err ? '#e11d48' : '#e2e8f0'}`, background:'#f8fafc', fontSize:'14px', color:'#0f172a', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' });
const focusHandlers = (err) => ({
  onFocus: e => { e.target.style.borderColor='#003cc3'; e.target.style.boxShadow='0 0 0 3px rgba(0,60,195,0.08)'; e.target.style.background='#fff'; },
  onBlur:  e => { e.target.style.borderColor = err ? '#e11d48' : '#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc'; },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDirectories() {
  const [datos,         setDatos]         = useState([]);
  const [cargando,      setCargando]      = useState(true);
  const [busqueda,      setBusqueda]      = useState('');
  const [filtro,        setFiltro]        = useState('todos');
  const [pagina,        setPagina]        = useState(1);
  const [modalAbierto,  setModalAbierto]  = useState(false);
  const [editandoId,    setEditandoId]    = useState(null);
  const [alertOpen,     setAlertOpen]     = useState(false);
  const [eliminandoId,  setEliminandoId]  = useState(null);
  const [categorias,    setCategorias]    = useState([]);
  const [mensajeForm,   setMensajeForm]   = useState('');

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { titulo:'', categoria:'General', url:'', descripcion:'', estado:'pendiente', destacado:false, activo:true },
  });

  const estadoValue    = watch('estado');
  const destacadoValue = watch('destacado');
  const activoValue    = watch('activo');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      let q = supabase.from('directorios_web').select('*');
      if (filtro === 'aprobados')  q = q.eq('estado', 'aprobado');
      if (filtro === 'pendientes') q = q.eq('estado', 'pendiente');
      const { data, error } = await q.order('creado_en', { ascending: false });
      if (error) throw error;
      setDatos(data || []);
      // Build category list
      const fromDB  = Array.from(new Set((data || []).map(d => d.categoria).filter(Boolean)));
      const merged  = [...new Set([...FALLBACK_CATS, ...fromDB])].sort();
      setCategorias(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // Reset to page 1 on filter/search change
  useEffect(() => { setPagina(1); }, [filtro, busqueda]);

  const handleToggleEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase.from('directorios_web').update({ estado: nuevoEstado }).eq('id', id);
      if (error) throw error;
      setDatos(prev => prev.map(item => item.id === id ? { ...item, estado: nuevoEstado } : item));
    } catch (err) { alert(err.message); }
  };

  const handleToggleBoolean = async (id, campo, valorActual) => {
    try {
      const { error } = await supabase.from('directorios_web').update({ [campo]: !valorActual }).eq('id', id);
      if (error) throw error;
      setDatos(prev => prev.map(item => item.id === id ? { ...item, [campo]: !valorActual } : item));
    } catch (err) { alert(err.message); }
  };

  const abrirModalCrear = () => {
    setEditandoId(null);
    reset({ titulo:'', categoria:'General', url:'', descripcion:'', estado:'pendiente', destacado:false, activo:true });
    setMensajeForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    reset({ titulo: item.titulo || '', categoria: item.categoria || 'General', url: item.url || '', descripcion: item.descripcion || '', estado: item.estado || 'pendiente', destacado: !!item.destacado, activo: item.activo !== false });
    setMensajeForm('');
    setModalAbierto(true);
  };

  const onSubmit = async (values) => {
    setMensajeForm('');
    try {
      if (editandoId) {
        const { error } = await supabase.from('directorios_web').update(values).eq('id', editandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('directorios_web').insert([values]);
        if (error) throw error;
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) { setMensajeForm(err.message); }
  };

  const ejecutarEliminar = async () => {
    if (!eliminandoId) return;
    try {
      const { error } = await supabase.from('directorios_web').delete().eq('id', eliminandoId);
      if (error) throw error;
      setDatos(prev => prev.filter(item => item.id !== eliminandoId));
    } catch (err) { alert(err.message); }
    finally { setAlertOpen(false); setEliminandoId(null); }
  };

  // ── Filtering + Pagination ────────────────────────────────────────────────
  const datosFiltrados = datos.filter(item => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (item.titulo||'').toLowerCase().includes(q) || (item.descripcion||'').toLowerCase().includes(q) || (item.categoria||'').toLowerCase().includes(q) || (item.url||'').toLowerCase().includes(q);
  });

  const totalPaginas = Math.max(1, Math.ceil(datosFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const datosPagina  = datosFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  // ── Shared style objects ──────────────────────────────────────────────────
  const card = { background:'#fff', border:'1px solid #f1f5f9', borderRadius:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' };
  const btnPrimary = { display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 18px', borderRadius:'10px', border:'none', background:'#003cc3', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' };
  const btnIcon    = (red) => ({ display:'flex', alignItems:'center', justifyContent:'center', padding:'7px', borderRadius:'8px', border:`1.5px solid ${red ? '#fecdd3' : '#e2e8f0'}`, background: red ? '#fff1f2' : '#f8fafc', color: red ? '#e11d48' : '#374151', cursor:'pointer' });
  const pageBtn    = (active, disabled) => ({ display:'flex', alignItems:'center', justifyContent:'center', minWidth:'34px', height:'34px', padding:'0 6px', borderRadius:'8px', border:`1.5px solid ${active ? '#003cc3' : '#e2e8f0'}`, background: active ? '#003cc3' : '#fff', color: active ? '#fff' : (disabled ? '#cbd5e1' : '#374151'), fontSize:'13px', fontWeight:'700', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:'system-ui,-apple-system,sans-serif', userSelect:'none' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:'800', color:'#0f172a', letterSpacing:'-0.02em', marginBottom:'6px' }}>Gestión de Directorio</h1>
          <p style={{ fontSize:'14px', color:'#94a3b8', fontWeight:'500' }}>Modera, edita y crea registros para el directorio de ayuda.</p>
        </div>
        <button onClick={abrirModalCrear} style={btnPrimary}
          onMouseEnter={e => { e.currentTarget.style.background='#0031a6'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#003cc3'; }}
        ><IconPlus /> Crear Registro</button>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
        <div style={{ display:'flex', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', padding:'4px', gap:'3px' }}>
          {[['todos','Todos'],['aprobados','Aprobados'],['pendientes','Pendientes']].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)} style={{ padding:'5px 12px', borderRadius:'7px', border:'none', fontSize:'13px', fontWeight:'700', cursor:'pointer', background: filtro===id ? '#fff' : 'transparent', color: filtro===id ? '#003cc3' : '#94a3b8', boxShadow: filtro===id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition:'all 0.15s' }}>{label}</button>
          ))}
        </div>
        <div style={{ flex:1, minWidth:'180px', position:'relative' }}>
          <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}><IconSearch /></span>
          <input type="text" placeholder="Buscar por título, URL, categoría..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width:'100%', height:'38px', paddingLeft:'34px', paddingRight:'12px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:'14px', color:'#0f172a', outline:'none', boxSizing:'border-box' }}
            onFocus={e => { e.target.style.borderColor='#003cc3'; e.target.style.background='#fff'; }}
            onBlur={e =>  { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; }}
          />
        </div>
        <span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600', whiteSpace:'nowrap' }}>{datosFiltrados.length} resultado{datosFiltrados.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={card}>
        {cargando ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px', gap:'14px' }}>
            <IconLoader /><p style={{ fontSize:'13px', color:'#94a3b8', fontWeight:'500' }}>Cargando registros...</p>
          </div>
        ) : datosPagina.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px', gap:'12px', textAlign:'center' }}>
            <p style={{ fontSize:'14px', color:'#94a3b8', fontWeight:'500' }}>No se encontraron registros.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1.5px solid #f1f5f9' }}>
                  {['Registro','Categoría','Enlace','Estado','Vis / Dest','Acciones'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datosPagina.map((item, idx) => {
                  const ec = ESTADO_CFG[item.estado] || ESTADO_CFG.pendiente;
                  return (
                    <tr key={item.id} style={{ borderBottom:'1px solid #f8fafc', background: idx%2===0 ? '#fff' : '#fafbfc', transition:'background 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background='#f0f4ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = idx%2===0 ? '#fff' : '#fafbfc'; }}
                    >
                      <td style={{ padding:'13px 16px', maxWidth:'240px' }}>
                        <div style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.titulo}</div>
                        <div style={{ fontSize:'12px', color:'#94a3b8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'2px' }}>{item.descripcion || 'Sin descripción'}</div>
                      </td>
                      <td style={{ padding:'13px 16px', whiteSpace:'nowrap' }}>
                        <span style={{ fontSize:'11px', fontWeight:'700', color:'#4f46e5', background:'#eef2ff', padding:'3px 8px', borderRadius:'6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{item.categoria}</span>
                      </td>
                      <td style={{ padding:'13px 16px', maxWidth:'150px' }}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'4px', color:'#003cc3', fontSize:'13px', textDecoration:'none', overflow:'hidden', maxWidth:'130px' }}>
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.url.replace(/^https?:\/\//, '')}</span>
                            <IconExternal />
                          </a>
                        ) : <span style={{ color:'#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <select value={item.estado || 'pendiente'} onChange={e => handleToggleEstado(item.id, e.target.value)}
                          style={{ fontSize:'11px', fontWeight:'700', color: ec.color, background: ec.bg, border:'none', borderRadius:'8px', padding:'4px 8px', cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                          <option value="aprobado">Aprobado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <span style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', width:'24px' }}>Vis</span>
                            <Toggle checked={item.activo !== false} onChange={() => handleToggleBoolean(item.id, 'activo', item.activo !== false)} activeColor="#16a34a" />
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <span style={{ fontSize:'10px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', width:'24px' }}>Dest</span>
                            <Toggle checked={!!item.destacado} onChange={() => handleToggleBoolean(item.id, 'destacado', !!item.destacado)} activeColor="#d97706" />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <div style={{ display:'flex', gap:'7px' }}>
                          <button onClick={() => abrirModalEditar(item)} style={btnIcon(false)} title="Editar"><IconEdit /></button>
                          <button onClick={() => { setEliminandoId(item.id); setAlertOpen(true); }} style={btnIcon(true)} title="Eliminar"><IconTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────────────── */}
        {!cargando && datosFiltrados.length > PAGE_SIZE && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderTop:'1px solid #f1f5f9', flexWrap:'wrap', gap:'10px' }}>
            <span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'500' }}>
              Mostrando {(paginaActual - 1) * PAGE_SIZE + 1}–{Math.min(paginaActual * PAGE_SIZE, datosFiltrados.length)} de {datosFiltrados.length}
            </span>
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1} style={pageBtn(false, paginaActual === 1)}><IconChevLeft /></button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && arr[i - 1] !== n - 1) acc.push('...');
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === '...'
                    ? <span key={`e${i}`} style={{ fontSize:'13px', color:'#94a3b8', padding:'0 4px' }}>…</span>
                    : <button key={n} onClick={() => setPagina(n)} style={pageBtn(n === paginaActual, false)}>{n}</button>
                )
              }
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} style={pageBtn(false, paginaActual === totalPaginas)}><IconChevRight /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Crear / Editar ──────────────────────────────────────────── */}
      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editandoId ? 'Editar Registro' : 'Nuevo Registro'} description="Completa los datos del recurso web.">
        {mensajeForm && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'11px 14px', background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:'10px', marginBottom:'16px' }}>
            <span style={{ color:'#e11d48', flexShrink:0, marginTop:'1px' }}><IconAlert /></span>
            <p style={{ fontSize:'13px', color:'#9f1239', fontWeight:'500' }}>{mensajeForm}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Título */}
          <div style={{ marginBottom:'14px' }}>
            <label style={fieldLabel}>Título / Nombre</label>
            <input type="text" placeholder="Ej: SOS Telecomunicaciones" {...register('titulo')} style={inputBase(!!errors.titulo)} {...focusHandlers(errors.titulo)} />
            {errors.titulo && <p style={{ fontSize:'12px', color:'#e11d48', marginTop:'4px', fontWeight:'500' }}>{errors.titulo.message}</p>}
          </div>
          {/* Categoría */}
          <div style={{ marginBottom:'14px' }}>
            <label style={fieldLabel}>Categoría</label>
            <select value={watch('categoria')||''} onChange={e => setValue('categoria', e.target.value, { shouldValidate:true })}
              style={{ ...inputBase(!!errors.categoria), appearance:'none' }}>
              <option value="">Seleccionar...</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.categoria && <p style={{ fontSize:'12px', color:'#e11d48', marginTop:'4px', fontWeight:'500' }}>{errors.categoria.message}</p>}
          </div>
          {/* URL */}
          <div style={{ marginBottom:'14px' }}>
            <label style={fieldLabel}>URL del Enlace</label>
            <input type="url" placeholder="https://ejemplo.com" {...register('url')} style={inputBase(!!errors.url)} {...focusHandlers(errors.url)} />
            {errors.url && <p style={{ fontSize:'12px', color:'#e11d48', marginTop:'4px', fontWeight:'500' }}>{errors.url.message}</p>}
          </div>
          {/* Descripción */}
          <div style={{ marginBottom:'16px' }}>
            <label style={fieldLabel}>Descripción</label>
            <textarea rows={3} placeholder="Describe brevemente el recurso..." {...register('descripcion')}
              style={{ ...inputBase(!!errors.descripcion), height:'auto', padding:'10px 12px', resize:'vertical' }}
              {...focusHandlers(errors.descripcion)} />
            {errors.descripcion && <p style={{ fontSize:'12px', color:'#e11d48', marginTop:'4px', fontWeight:'500' }}>{errors.descripcion.message}</p>}
          </div>
          {/* Config panel */}
          <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'12px', padding:'14px', marginBottom:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <span style={{ fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>Estado</span>
              <select value={estadoValue} onChange={e => setValue('estado', e.target.value)}
                style={{ fontSize:'12px', fontWeight:'700', padding:'4px 10px', borderRadius:'8px', border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', color: ESTADO_CFG[estadoValue]?.color || '#374151' }}>
                <option value="aprobado">Aprobado</option>
                <option value="pendiente">Pendiente</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'12px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Activo (Visible)</p>
                <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Si está inactivo, no se muestra al público.</p>
              </div>
              <Toggle checked={activoValue} onChange={() => setValue('activo', !activoValue)} activeColor="#16a34a" />
            </div>
            <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:'12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Destacado</p>
                <p style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px' }}>Resalta este enlace visualmente.</p>
              </div>
              <Toggle checked={destacadoValue} onChange={() => setValue('destacado', !destacadoValue)} activeColor="#d97706" />
            </div>
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ padding:'10px 18px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} style={{ padding:'10px 20px', borderRadius:'10px', border:'none', background: isSubmitting ? '#6b97e0' : '#003cc3', color:'#fff', fontSize:'14px', fontWeight:'700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={alertOpen} onCancel={() => { setAlertOpen(false); setEliminandoId(null); }} onConfirm={ejecutarEliminar} />
    </div>
  );
}
