'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// ── SVGs ──────────────────────────────────────────────────────────────────────
const IconSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
const IconPlus  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>);
const IconEdit  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const IconX     = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IconAlert = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IconTag   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" strokeWidth="0"/></svg>);
const IconLoader = () => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#003cc3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:'spin 0.8s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></svg>);
// ─────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50, 'Máximo 50 caracteres'),
});

const FALLBACK_CATS = ['Alimentos','Comunicación','Donaciones','Educación','Gobierno','Logística','Noticias','Oficial','Salud','Seguridad','Tecnología','Voluntariado'];

// ── Modal & ConfirmDialog ─────────────────────────────────────────────────────
function Modal({ open, onClose, title, description, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.42)', backdropFilter:'blur(3px)' }} onClick={onClose} />
      <div style={{ position:'relative', zIndex:1, background:'#fff', borderRadius:'20px', boxShadow:'0 24px 60px rgba(0,0,0,0.18)', width:'100%', maxWidth:'420px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'22px 22px 0' }}>
          <div>
            <h2 style={{ fontSize:'17px', fontWeight:'800', color:'#0f172a', marginBottom:'3px' }}>{title}</h2>
            {description && <p style={{ fontSize:'13px', color:'#94a3b8' }}>{description}</p>}
          </div>
          <button onClick={onClose} style={{ border:'none', background:'#f1f5f9', borderRadius:'8px', padding:'6px', cursor:'pointer', color:'#64748b', display:'flex', marginLeft:'12px', flexShrink:0 }}><IconX /></button>
        </div>
        <div style={{ padding:'18px 22px 22px' }}>{children}</div>
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
        <p style={{ fontSize:'14px', color:'#64748b', lineHeight:'1.6', marginBottom:'24px' }}>{message}</p>
        <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'9px 18px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding:'9px 18px', borderRadius:'10px', border:'none', background:'#e11d48', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const [datos,        setDatos]        = useState([]);
  const [cargando,     setCargando]     = useState(true);
  const [busqueda,     setBusqueda]     = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId,   setEditandoId]   = useState(null);
  const [alertOpen,    setAlertOpen]    = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [mensajeForm,  setMensajeForm]  = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '' },
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      // Fetch all directories to get actual category usage counts
      const { data, error } = await supabase.from('directorios_web').select('categoria');
      if (error) throw error;

      const counts = {};
      (data || []).forEach(d => {
        if (d.categoria) counts[d.categoria] = (counts[d.categoria] || 0) + 1;
      });

      // Merge fallback + DB categories + localStorage custom
      let localCustom = [];
      try { const s = localStorage.getItem('custom_categories'); if (s) localCustom = JSON.parse(s); } catch {}

      const dbCats = (data || []).map(d => d.categoria).filter(Boolean);
      const allNames = Array.from(new Set([...FALLBACK_CATS, ...dbCats, ...localCustom])).sort();

      setDatos(allNames.map(nombre => ({ id: nombre, nombre, count: counts[nombre] || 0 })));
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const abrirModalCrear = () => {
    setEditandoId(null);
    reset({ nombre: '' });
    setMensajeForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (item) => {
    setEditandoId(item.id);
    reset({ nombre: item.nombre });
    setMensajeForm('');
    setModalAbierto(true);
  };

  const onSubmit = async ({ nombre }) => {
    setMensajeForm('');
    const nuevo = nombre.trim();
    try {
      if (editandoId) {
        // Rename: update all directories with old category name in Supabase
        const { error } = await supabase.from('directorios_web').update({ categoria: nuevo }).eq('categoria', editandoId);
        if (error) throw error;
        // Update localStorage
        try {
          let lc = []; const s = localStorage.getItem('custom_categories'); if (s) lc = JSON.parse(s);
          const updated = lc.map(c => c.toLowerCase() === editandoId.toLowerCase() ? nuevo : c);
          localStorage.setItem('custom_categories', JSON.stringify(updated));
        } catch {}
      } else {
        // Create: just save to localStorage (categories are virtual, driven by directorios_web.categoria)
        try {
          let lc = []; const s = localStorage.getItem('custom_categories'); if (s) lc = JSON.parse(s);
          if (!lc.some(c => c.toLowerCase() === nuevo.toLowerCase())) {
            lc.push(nuevo);
            localStorage.setItem('custom_categories', JSON.stringify(lc));
          }
        } catch {}
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) { setMensajeForm(err.message); }
  };

  const ejecutarEliminar = async () => {
    if (!eliminandoId) return;
    try {
      // Clear the category from all directories
      const { error } = await supabase.from('directorios_web').update({ categoria: null }).eq('categoria', eliminandoId);
      if (error) throw error;
      // Remove from localStorage
      try {
        let lc = []; const s = localStorage.getItem('custom_categories'); if (s) lc = JSON.parse(s);
        localStorage.setItem('custom_categories', JSON.stringify(lc.filter(c => c.toLowerCase() !== eliminandoId.toLowerCase())));
      } catch {}
      setDatos(prev => prev.filter(item => item.id !== eliminandoId));
    } catch (err) { alert(err.message); }
    finally { setAlertOpen(false); setEliminandoId(null); }
  };

  const datosFiltrados = datos.filter(item => {
    const q = busqueda.toLowerCase().trim();
    return !q || (item.nombre || '').toLowerCase().includes(q);
  });

  // ── Style helpers ─────────────────────────────────────────────────────────
  const card = { background:'#fff', border:'1px solid #f1f5f9', borderRadius:'16px', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' };
  const btnIcon = (red) => ({ display:'flex', alignItems:'center', justifyContent:'center', padding:'7px', borderRadius:'8px', border:`1.5px solid ${red ? '#fecdd3' : '#e2e8f0'}`, background: red ? '#fff1f2' : '#f8fafc', color: red ? '#e11d48' : '#374151', cursor:'pointer' });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'24px', fontFamily:'system-ui,-apple-system,sans-serif', userSelect:'none' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:'800', color:'#0f172a', letterSpacing:'-0.02em', marginBottom:'6px' }}>Gestión de Categorías</h1>
          <p style={{ fontSize:'14px', color:'#94a3b8', fontWeight:'500' }}>Crea, edita y elimina las categorías usadas en el directorio.</p>
        </div>
        <button onClick={abrirModalCrear}
          style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 18px', borderRadius:'10px', border:'none', background:'#003cc3', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background='#0031a6'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#003cc3'; }}
        ><IconPlus /> Nueva Categoría</button>
      </div>

      {/* Search bar */}
      <div style={{ ...card, padding:'14px 18px', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ flex:1, position:'relative', maxWidth:'360px' }}>
          <span style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }}><IconSearch /></span>
          <input type="text" placeholder="Buscar categoría..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ width:'100%', height:'38px', paddingLeft:'34px', paddingRight:'12px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#f8fafc', fontSize:'14px', color:'#0f172a', outline:'none', boxSizing:'border-box' }}
            onFocus={e => { e.target.style.borderColor='#003cc3'; e.target.style.background='#fff'; }}
            onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.background='#f8fafc'; }}
          />
        </div>
        <span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'600' }}>{datosFiltrados.length} categoría{datosFiltrados.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={card}>
        {cargando ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px', gap:'14px' }}>
            <IconLoader /><p style={{ fontSize:'13px', color:'#94a3b8', fontWeight:'500' }}>Cargando categorías...</p>
          </div>
        ) : datosFiltrados.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px', gap:'12px', textAlign:'center' }}>
            <p style={{ fontSize:'14px', color:'#94a3b8', fontWeight:'500' }}>No se encontraron categorías.</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1.5px solid #f1f5f9' }}>
                  <th style={{ padding:'12px 16px', textAlign:'left', fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Categoría</th>
                  <th style={{ padding:'12px 16px', textAlign:'center', fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Usos en directorio</th>
                  <th style={{ padding:'12px 16px', textAlign:'right', fontSize:'11px', fontWeight:'700', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom:'1px solid #f8fafc', background: idx%2===0 ? '#fff' : '#fafbfc', transition:'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#f0f4ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = idx%2===0 ? '#fff' : '#fafbfc'; }}
                  >
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:'#eef2ff', color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <IconTag />
                        </div>
                        <span style={{ fontSize:'14px', fontWeight:'700', color:'#0f172a' }}>{item.nombre}</span>
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px', textAlign:'center' }}>
                      <span style={{ display:'inline-block', fontSize:'13px', fontWeight:'700', color: item.count > 0 ? '#003cc3' : '#94a3b8', background: item.count > 0 ? '#eff4ff' : '#f8fafc', padding:'3px 10px', borderRadius:'20px', border:`1px solid ${item.count > 0 ? '#c7d7ff' : '#e2e8f0'}` }}>
                        {item.count} {item.count === 1 ? 'uso' : 'usos'}
                      </span>
                    </td>
                    <td style={{ padding:'13px 16px', textAlign:'right' }}>
                      <div style={{ display:'inline-flex', gap:'7px' }}>
                        <button onClick={() => abrirModalEditar(item)} style={btnIcon(false)} title="Editar"><IconEdit /></button>
                        <button onClick={() => { setEliminandoId(item.id); setAlertOpen(true); }} style={btnIcon(true)} title="Eliminar"><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Footer count */}
        {!cargando && datosFiltrados.length > 0 && (
          <div style={{ padding:'12px 20px', borderTop:'1px solid #f1f5f9' }}>
            <p style={{ fontSize:'12px', color:'#94a3b8', fontWeight:'500' }}>{datosFiltrados.length} categoría{datosFiltrados.length !== 1 ? 's' : ''} en total</p>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editandoId ? 'Editar Categoría' : 'Nueva Categoría'} description="Asigna un nombre descriptivo para organizar el directorio.">
        {mensajeForm && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:'8px', padding:'11px 14px', background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:'10px', marginBottom:'14px' }}>
            <span style={{ color:'#e11d48', flexShrink:0, marginTop:'1px' }}><IconAlert /></span>
            <p style={{ fontSize:'13px', color:'#9f1239', fontWeight:'500' }}>{mensajeForm}</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom:'20px' }}>
            <label htmlFor="cat-nombre" style={{ display:'block', fontSize:'13px', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Nombre de la Categoría</label>
            <input
              id="cat-nombre"
              type="text"
              placeholder="Ej: Salud, Educación, Tecnología..."
              {...register('nombre')}
              style={{ width:'100%', height:'44px', padding:'0 14px', borderRadius:'10px', border:`1.5px solid ${errors.nombre ? '#e11d48' : '#e2e8f0'}`, background:'#f8fafc', fontSize:'15px', color:'#0f172a', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }}
              onFocus={e => { e.target.style.borderColor='#003cc3'; e.target.style.boxShadow='0 0 0 3px rgba(0,60,195,0.08)'; e.target.style.background='#fff'; }}
              onBlur={e => { e.target.style.borderColor = errors.nombre ? '#e11d48' : '#e2e8f0'; e.target.style.boxShadow='none'; e.target.style.background='#f8fafc'; }}
            />
            {errors.nombre && <p style={{ fontSize:'12px', color:'#e11d48', fontWeight:'500', marginTop:'5px' }}>{errors.nombre.message}</p>}
          </div>
          <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', paddingTop:'4px', borderTop:'1px solid #f1f5f9' }}>
            <button type="button" onClick={() => setModalAbierto(false)} style={{ padding:'10px 18px', borderRadius:'10px', border:'1.5px solid #e2e8f0', background:'#fff', color:'#374151', fontSize:'14px', fontWeight:'600', cursor:'pointer' }}>Cancelar</button>
            <button type="submit" disabled={isSubmitting} style={{ padding:'10px 20px', borderRadius:'10px', border:'none', background: isSubmitting ? '#6b97e0' : '#003cc3', color:'#fff', fontSize:'14px', fontWeight:'700', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={alertOpen}
        onCancel={() => { setAlertOpen(false); setEliminandoId(null); }}
        onConfirm={ejecutarEliminar}
        message="Eliminar esta categoría desvinculará todos los registros del directorio que la estén usando actualmente."
      />
    </div>
  );
}
