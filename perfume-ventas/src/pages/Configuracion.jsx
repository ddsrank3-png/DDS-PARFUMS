import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Check, X, PackageX, Package, Search } from 'lucide-react'

export default function Configuracion() {
  const [seccion, setSeccion] = useState('productos')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Estado formulario nuevo/editar producto
  const [editando, setEditando] = useState(null)
  const FORM_INICIAL = {
    nombre: '',
    precio_sellado: '', stock_sellado: '', costo_sellado: '', cat_sellado: 'Perfume',
    precio_3ml: '', stock_3ml: '', costo_3ml: '', cat_3ml: 'Decant',
    precio_5ml: '', stock_5ml: '', costo_5ml: '', cat_5ml: 'Decant',
    precio_10ml: '', stock_10ml: '', costo_10ml: '', cat_10ml: 'Decant',
    precio_30ml: '', stock_30ml: '', costo_30ml: '', cat_30ml: 'Decant',
  }
  const [form, setForm] = useState({ ...FORM_INICIAL })

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
    setForm({ ...FORM_INICIAL })
    setEditando('nuevo')
  }

  function iniciarEdicion(producto) {
    const key = producto.tipo === 'Sellado' ? 'sellado'
      : producto.tipo === 'Decant 3ml' ? '3ml'
      : producto.tipo === 'Decant 5ml' ? '5ml'
      : producto.tipo === 'Decant 10ml' ? '10ml'
      : '30ml'
    setForm({
      ...FORM_INICIAL,
      nombre: producto.nombre,
      [`precio_${key}`]: producto.precio,
      [`stock_${key}`]: producto.stock || '',
      [`costo_${key}`]: producto.precio_compra || '',
      [`cat_${key}`]: producto.categoria || 'Decant',
    })
    setEditando(producto.id)
  }

  function cancelarEdicion() {
    setEditando(null)
    setForm({ ...FORM_INICIAL })
  }

  async function guardarProducto() {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }

    const TALLAS = [
      { key: 'sellado', tipo: 'Sellado' },
      { key: '3ml', tipo: 'Decant 3ml' },
      { key: '5ml', tipo: 'Decant 5ml' },
      { key: '10ml', tipo: 'Decant 10ml' },
      { key: '30ml', tipo: 'Decant 30ml' },
    ]

    if (editando === 'nuevo') {
      // Crear un producto por cada talla que tenga precio
      const tallasACrear = TALLAS.filter(t => {
        const precio = parseFloat(form[`precio_${t.key}`])
        return !isNaN(precio) && precio > 0
      })

      if (tallasACrear.length === 0) {
        toast.error('Agrega al menos un precio (sellado, 3ml, 5ml, etc.)')
        return
      }

      const inserts = tallasACrear.map(t => ({
        nombre: form.nombre.trim(),
        categoria: form[`cat_${t.key}`] || 'Decant',
        tipo: t.tipo,
        precio: parseFloat(form[`precio_${t.key}`]),
        precio_compra: parseFloat(form[`costo_${t.key}`]) || 0,
        stock: parseInt(form[`stock_${t.key}`]) || 0,
        activo: true,
      }))

      const { error } = await supabase.from('productos').insert(inserts)
      if (error) { toast.error('Error creando productos'); return }
      toast.success(`${inserts.length} producto${inserts.length > 1 ? 's' : ''} creado${inserts.length > 1 ? 's' : ''} ✓`)
    } else {
      // Edición simple — actualiza el producto individual
      const talla = TALLAS.find(t => parseFloat(form[`precio_${t.key}`]) > 0)
      if (!talla) { toast.error('Agrega al menos un precio'); return }
      const precio = parseFloat(form[`precio_${talla.key}`])
      const { error } = await supabase.from('productos').update({
        nombre: form.nombre.trim(),
        categoria: form[`cat_${talla.key}`] || 'Decant',
        tipo: talla.tipo,
        precio,
        precio_compra: parseFloat(form[`costo_${talla.key}`]) || 0,
        stock: parseInt(form[`stock_${talla.key}`]) || 0,
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
  const [editandoVenta, setEditandoVenta] = useState(null)
  const [formVenta, setFormVenta] = useState({})

  async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) { toast.error('Error eliminando venta'); return }
    toast.success('Venta eliminada')
    cargarVentas()
  }

  function iniciarEdicionVenta(v) {
    setEditandoVenta(v.id)
    setFormVenta({ metodo_pago: v.metodo_pago, notas: v.notas || '', total: v.total })
  }

  async function guardarEdicionVenta() {
    const { error } = await supabase.from('ventas').update({
      metodo_pago: formVenta.metodo_pago,
      notas: formVenta.notas || null,
      total: parseFloat(formVenta.total) || 0,
    }).eq('id', editandoVenta)
    if (error) { toast.error('Error actualizando venta'); return }
    toast.success('Venta actualizada')
    setEditandoVenta(null)
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
            <div style={{ background: 'var(--gold-glow)', border: '1px solid var(--gold-dim)', borderRadius: 'var(--radius)', padding: '18px 20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px', color: 'var(--gold)' }}>
                {editando === 'nuevo' ? '✨ Nuevo producto — agrega los precios por talla' : 'Editar producto'}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nombre del perfume</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Khamrah Clasico" style={{ fontSize: '13px' }} autoFocus />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Tallas — deja vacío el precio de lo que no vendas
              </div>
              <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                  <thead>
                    <tr style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500, width: '110px' }}>Talla</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Categoría</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Costo S/</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Precio venta S/</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'sellado', label: '🏷 Sellado' },
                      { key: '3ml', label: '💧 3ml' },
                      { key: '5ml', label: '💧 5ml' },
                      { key: '10ml', label: '💧 10ml' },
                      { key: '30ml', label: '💧 30ml' },
                    ].map(({ key, label }) => (
                      <tr key={key} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 8px', fontSize: '13px', fontWeight: 500 }}>{label}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <select value={form[`cat_${key}`]} onChange={e => setForm({ ...form, [`cat_${key}`]: e.target.value })} style={{ fontSize: '12px', padding: '5px 6px' }}>
                            <option>Decant</option>
                            <option>Perfume</option>
                            <option>Accesorio</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" value={form[`costo_${key}`]} onChange={e => setForm({ ...form, [`costo_${key}`]: e.target.value })} placeholder="0.00" min="0" step="0.50" style={{ fontSize: '12px', padding: '5px 6px', width: '80px' }} disabled={!form[`precio_${key}`]} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" value={form[`precio_${key}`]} onChange={e => setForm({ ...form, [`precio_${key}`]: e.target.value })} placeholder="—" min="0" step="0.50" style={{ fontSize: '12px', padding: '5px 6px', width: '80px' }} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="number" value={form[`stock_${key}`]} onChange={e => setForm({ ...form, [`stock_${key}`]: e.target.value })} placeholder="0" min="0" style={{ fontSize: '12px', padding: '5px 6px', width: '70px' }} disabled={!form[`precio_${key}`]} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 500 }}>Tipo</th>
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
                      <td style={{ padding: '11px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{p.tipo || 'Sellado'}</td>
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

                    {/* Formulario edición */}
                    {editandoVenta === v.id ? (
                      <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Método de pago</label>
                            <select value={formVenta.metodo_pago} onChange={e => setFormVenta({...formVenta, metodo_pago: e.target.value})} style={{ fontSize: '13px' }}>
                              <option>Efectivo</option>
                              <option>Yape/Plin</option>
                              <option>Transferencia</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Total S/</label>
                            <input type="number" value={formVenta.total} onChange={e => setFormVenta({...formVenta, total: e.target.value})} style={{ fontSize: '13px' }} min="0" step="0.01" />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Notas</label>
                          <input value={formVenta.notas} onChange={e => setFormVenta({...formVenta, notas: e.target.value})} placeholder="Opcional..." style={{ fontSize: '13px' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button onClick={guardarEdicionVenta} style={{ padding: '9px', background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 700 }}>
                            ✓ Guardar
                          </button>
                          <button onClick={() => setEditandoVenta(null)} style={{ padding: '9px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button onClick={() => iniciarEdicionVenta(v)} style={{ padding: '9px', background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => eliminarVenta(v.id)} style={{ background: 'var(--danger)', color: 'white', padding: '9px', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600 }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    )}
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

