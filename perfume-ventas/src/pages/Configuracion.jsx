import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, PackageX, Package, Search } from 'lucide-react'

export default function Configuracion() {
  const [seccion, setSeccion] = useState('productos')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estado formulario nuevo/editar producto
  const [editando, setEditando] = useState(null) // null | 'nuevo' | producto.id
  const [form, setForm] = useState({ nombre: '', categoria: 'Decant', precio: '', precio_compra: '', stock: '' })

  // Ventas para editar
  const [ventas, setVentas] = useState([])
  const [fechaVentas, setFechaVentas] = useState(new Date().toISOString().split('T')[0])
  const [cargandoVentas, setCargandoVentas] = useState(false)
  const [filtroProducto, setFiltroProducto] = useState('')

  useEffect(() => { cargarProductos() }, [])

  async function cargarProductos() {
    setCargando(true)
    const { data } = await supabase.from('productos').select('*').order('categoria').order('nombre')
    setProductos(data || [])
    setCargando(false)
  }

  async function cargarVentas() {
    setCargandoVentas(true)
    const { data } = await supabase
      .from('ventas')
      .select(`*, venta_items(*)`)
      .eq('fecha', fechaVentas)
      .order('created_at', { ascending: false })
    setVentas(data || [])
    setCargandoVentas(false)
  }

  useEffect(() => {
    if (seccion === 'ventas') cargarVentas()
  }, [seccion, fechaVentas])

  // --- PRODUCTOS ---
  function iniciarNuevo() {
    setForm({ nombre: '', categoria: 'Decant', precio: '', precio_compra: '', stock: '' })
    setEditando('nuevo')
  }

  function iniciarEdicion(producto) {
    setForm({ nombre: producto.nombre, categoria: producto.categoria, precio: producto.precio, precio_compra: producto.precio_compra || '', stock: producto.stock || '' })
    setEditando(producto.id)
  }

  function cancelarEdicion() {
    setEditando(null)
    setForm({ nombre: '', categoria: 'Decant', precio: '' })
  }

  async function guardarProducto() {
    if (!form.nombre.trim() || !form.precio) {
      toast.error('Nombre y precio son requeridos')
      return
    }
    const precio = parseFloat(form.precio)
    if (isNaN(precio) || precio <= 0) {
      toast.error('Precio inválido')
      return
    }

    if (editando === 'nuevo') {
      const { error } = await supabase.from('productos').insert({
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio,
        precio_compra: parseFloat(form.precio_compra) || 0,
        stock: parseInt(form.stock) || 0,
        activo: true,
      })
      if (error) { toast.error('Error creando producto'); return }
      toast.success('Producto creado')
    } else {
      const { error } = await supabase.from('productos').update({
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        precio,
        precio_compra: parseFloat(form.precio_compra) || 0,
        stock: parseInt(form.stock) || 0,
      }).eq('id', editando)
      if (error) { toast.error('Error actualizando producto'); return }
      toast.success('Producto actualizado')
    }
    cancelarEdicion()
    cargarProductos()
  }

  async function toggleActivo(producto) {
    const { error } = await supabase.from('productos').update({ activo: !producto.activo }).eq('id', producto.id)
    if (error) { toast.error('Error'); return }
    toast.success(producto.activo ? 'Producto desactivado' : 'Producto activado')
    cargarProductos()
  }

  async function eliminarProducto(id) {
    if (!confirm('¿Eliminar permanentemente este producto? No se pueden eliminar productos con ventas asociadas.')) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) {
      toast.error('No se puede eliminar: tiene ventas registradas')
    } else {
      toast.success('Producto eliminado')
      cargarProductos()
    }
  }

  // --- VENTAS ---
  async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) { toast.error('Error eliminando venta'); return }
    toast.success('Venta eliminada')
    cargarVentas()
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(filtroProducto.toLowerCase())
  )

  const SECCIONES = [
    { id: 'productos', label: 'Productos' },
    { id: 'ventas', label: 'Gestión de Ventas' },
  ]

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
        Configuración
      </h2>

      {/* Sub nav */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {SECCIONES.map(s => (
          <button
            key={s.id}
            onClick={() => setSeccion(s.id)}
            style={{
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 500,
              background: 'none',
              color: seccion === s.id ? 'var(--gold)' : 'var(--text-secondary)',
              borderBottom: seccion === s.id ? '2px solid var(--gold)' : '2px solid transparent',
              borderRadius: 0,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* PRODUCTOS */}
      {seccion === 'productos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '320px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                placeholder="Buscar..."
                value={filtroProducto}
                onChange={e => setFiltroProducto(e.target.value)}
                style={{ paddingLeft: '30px', fontSize: '13px' }}
              />
            </div>
            <button
              onClick={iniciarNuevo}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px',
                background: 'var(--gold)',
                color: 'var(--obsidian)',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Plus size={14} />
              Nuevo producto
            </button>
          </div>

          {/* Formulario nuevo/editar */}
          {editando && (
            <div style={{
              background: 'var(--gold-glow)',
              border: '1px solid var(--gold-dim)',
              borderRadius: 'var(--radius)',
              padding: '18px 20px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px', color: 'var(--gold)' }}>
                {editando === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nombre</label>
                  <input
                    value={form.nombre}
                    onChange={e => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Decant 5ml - Acqua di Giò"
                    style={{ fontSize: '13px' }}
                    onKeyDown={e => e.key === 'Enter' && guardarProducto()}
                    autoFocus
                  />
                </div>
                <div style={{ minWidth: '110px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} style={{ fontSize: '13px' }}>
                    <option>Decant</option>
                    <option>Perfume</option>
                    <option>Accesorio</option>
                  </select>
                </div>
                <div style={{ minWidth: '100px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Costo S/</label>
                  <input
                    type="number"
                    value={form.precio_compra}
                    onChange={e => setForm({ ...form, precio_compra: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.50"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div style={{ minWidth: '100px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Venta S/</label>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={e => setForm({ ...form, precio: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.50"
                    style={{ fontSize: '13px' }}
                  />
                </div>
                <div style={{ minWidth: '80px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    min="0"
                    style={{ fontSize: '13px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button onClick={guardarProducto} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600 }}>
                  <Check size={13} /> Guardar
                </button>
                <button onClick={cancelarEdicion} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de productos */}
          {cargando ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando...</div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 500 }}>Producto</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 500 }}>Categoría</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Costo</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Venta</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Ganancia</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 500 }}>Stock</th>
                    <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 500 }}>Estado</th>
                    <th style={{ padding: '10px 16px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--border)', opacity: p.activo ? 1 : 0.5 }}>
                      <td style={{ padding: '11px 16px', fontSize: '13px' }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{p.categoria}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        S/ {Number(p.precio_compra || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>
                        S/ {Number(p.precio).toFixed(2)}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--success)' }}>
                        S/ {(Number(p.precio) - Number(p.precio_compra || 0)).toFixed(2)}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: p.stock === 0 ? 'var(--danger)' : p.stock <= 3 ? 'var(--warning)' : 'var(--text-primary)' }}>
                        {p.stock ?? 0}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: p.activo ? 'rgba(76,175,125,0.15)' : 'var(--surface-raised)',
                          color: p.activo ? 'var(--success)' : 'var(--text-muted)',
                        }}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button onClick={() => iniciarEdicion(p)} title="Editar" style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => toggleActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                            {p.activo ? <PackageX size={14} /> : <Package size={14} />}
                          </button>
                          <button onClick={() => eliminarProducto(p.id)} title="Eliminar" style={{ background: 'none', color: 'var(--danger)', padding: '4px' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '13px' }}>
                        No hay productos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* GESTIÓN DE VENTAS */}
      {seccion === 'ventas' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Fecha:</label>
            <input
              type="date"
              value={fechaVentas}
              onChange={e => setFechaVentas(e.target.value)}
              style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            />
          </div>

          {cargandoVentas ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando...</div>
          ) : ventas.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              Sin ventas en esta fecha
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ventas.map((v, idx) => (
                <div key={v.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ padding: '13px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>#{ventas.length - idx}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{v.metodo_pago}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          {v.venta_items?.length || 0} items
                          {v.notas && ` · ${v.notas}`}
                        </span>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>S/ {Number(v.total).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => eliminarVenta(v.id)}
                      style={{ background: 'var(--danger)', color: 'white', padding: '9px', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', fontWeight: 600 }}
                    >
                      <Trash2 size={14} /> Eliminar venta
                    </button>
                  </div>
                  {v.venta_items?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {v.venta_items.map(item => (
                        <span key={item.id} style={{ background: 'var(--surface-raised)', padding: '3px 8px', borderRadius: '4px' }}>
                          {item.nombre_producto} ×{item.cantidad} — S/ {Number(item.subtotal).toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
