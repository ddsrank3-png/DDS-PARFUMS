import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Search, Plus, Minus, Trash2, ShoppingBag, Tag, ChevronDown, X } from 'lucide-react'

const METODOS_PAGO = ['Efectivo', 'Yape/Plin', 'Transferencia']
const TIPOS = ['Todos', 'Sellado', 'Decant 3ml', 'Decant 5ml', 'Decant 10ml', 'Decant 30ml']

// ── CarritoPanel FUERA del componente principal para evitar re-mounts ──
function CarritoPanel({
  carrito, total, totalOriginal, totalItems, descuentoGlobal,
  editandoDescuento, metodoPago, notas, guardando,
  onQuitarItem, onCambiarCantidad, onAplicarDescuento, onPrecioManual,
  onDescuentoGlobal, onLimpiarDescuento, onMetodoPago, onNotas,
  onToggleDescuento, onRegistrar,
}) {
  const totalDescuentos = totalOriginal - total
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShoppingBag size={15} color="var(--gold)" />
        <span style={{ fontWeight: 600, fontSize: '13px' }}>Venta actual</span>
        {carrito.length > 0 && (
          <span style={{ marginLeft: 'auto', background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: '12px', padding: '1px 8px', fontSize: '11px', fontWeight: 700 }}>
            {totalItems} items
          </span>
        )}
      </div>

      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
        {carrito.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            Toca un producto para agregarlo
          </div>
        ) : (
          carrito.map(item => (
            <div key={item.producto.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div style={{ flex: 1, fontSize: '12px', fontWeight: 500, lineHeight: 1.4, paddingRight: '8px' }}>
                  {item.producto.nombre}
                </div>
                <button onClick={() => onQuitarItem(item.producto.id)} style={{ background: 'none', color: 'var(--text-muted)', padding: '2px' }}>
                  <Trash2 size={12} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <button onClick={() => onCambiarCantidad(item.producto.id, -1)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Minus size={10} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '18px', textAlign: 'center' }}>{item.cantidad}</span>
                  <button onClick={() => onCambiarCantidad(item.producto.id, 1)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={10} />
                  </button>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  {item.descuento > 0 && <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>S/ {(item.producto.precio * item.cantidad).toFixed(2)}</div>}
                  <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 700 }}>S/ {(item.precioFinal * item.cantidad).toFixed(2)}</div>
                </div>
              </div>
              <button onClick={() => onToggleDescuento(item.producto.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', color: item.descuento > 0 ? 'var(--success)' : 'var(--text-muted)', fontSize: '11px', padding: '2px 0' }}>
                <Tag size={10} />
                {item.descuento > 0 ? `Desc: S/ ${item.descuento.toFixed(2)}/u` : 'Descuento individual'}
                <ChevronDown size={10} style={{ transform: editandoDescuento === item.producto.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </button>
              {editandoDescuento === item.producto.id && (
                <div style={{ marginTop: '7px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Descuento S/</label>
                    <input type="number" defaultValue={item.descuento || ''} onBlur={e => onAplicarDescuento(item.producto.id, e.target.value)} placeholder="0.00" min="0" style={{ padding: '5px 8px', fontSize: '12px' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Precio final S/</label>
                    <input type="number" defaultValue={item.precioFinal || ''} onBlur={e => onPrecioManual(item.producto.id, e.target.value)} min="0" style={{ padding: '5px 8px', fontSize: '12px' }} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {carrito.length > 0 && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '12px', background: 'var(--surface-raised)', borderRadius: 'var(--radius)', padding: '10px 12px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '11px', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '7px', fontWeight: 600 }}>
              <Tag size={11} /> Descuento a toda la venta
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={descuentoGlobal}
                onChange={e => onDescuentoGlobal(e.target.value)}
                placeholder="S/ 0.00"
                min="0"
                style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
              />
              {descuentoGlobal && parseFloat(descuentoGlobal) > 0 && (
                <button onClick={onLimpiarDescuento} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {totalDescuentos > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', marginBottom: '5px' }}>
              <span>Descuento total</span>
              <span>- S/ {totalDescuentos.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '18px', marginBottom: '14px' }}>
            <span>Total</span>
            <span style={{ color: 'var(--gold)' }}>S/ {total.toFixed(2)}</span>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Método de pago</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              {METODOS_PAGO.map(m => (
                <button key={m} onClick={() => onMetodoPago(m)} style={{ flex: 1, padding: '7px 4px', fontSize: '11px', fontWeight: 500, borderRadius: 'var(--radius-sm)', background: metodoPago === m ? 'var(--gold)' : 'var(--surface-raised)', color: metodoPago === m ? 'var(--obsidian)' : 'var(--text-secondary)', border: `1px solid ${metodoPago === m ? 'var(--gold)' : 'var(--border)'}` }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <textarea placeholder="Notas (opcional)..." value={notas} onChange={e => onNotas(e.target.value)} rows={2} style={{ fontSize: '12px', marginBottom: '10px', resize: 'none' }} />

          <button onClick={onRegistrar} disabled={guardando} style={{ width: '100%', padding: '13px', background: guardando ? 'var(--gold-dim)' : 'var(--gold)', color: 'var(--obsidian)', borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '14px', letterSpacing: '0.03em' }}>
            {guardando ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function NuevaVenta() {
  const [productos, setProductos] = useState([])
  const [filtro, setFiltro] = useState('')
  const [carrito, setCarrito] = useState([])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [tipoFiltro, setTipoFiltro] = useState('Todos')
  const [editandoDescuento, setEditandoDescuento] = useState(null)
  const [descuentoGlobal, setDescuentoGlobal] = useState('')
  const [mostrarCarrito, setMostrarCarrito] = useState(false)

  useEffect(() => { cargarProductos() }, [])

  async function cargarProductos() {
    const { data, error } = await supabase.from('productos').select('*').eq('activo', true).order('categoria').order('nombre')
    if (error) { toast.error('Error cargando productos'); return }
    setProductos(data || [])
  }

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]
  const productosFiltrados = productos.filter(p => {
    const matchTexto = p.nombre.toLowerCase().includes(filtro.toLowerCase())
    const matchCat = categoriaFiltro === 'Todos' || p.categoria === categoriaFiltro
    const matchTipo = tipoFiltro === 'Todos' || (p.tipo || 'Sellado') === tipoFiltro
    return matchTexto && matchCat && matchTipo
  })

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id)
      if (existe) return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item)
      return [...prev, { producto, cantidad: 1, precioFinal: producto.precio, descuento: 0 }]
    })
    setDescuentoGlobal('')
  }, [])

  const cambiarCantidad = useCallback((productoId, delta) => {
    setCarrito(prev => prev.map(item => {
      if (item.producto.id !== productoId) return item
      const nuevaCantidad = item.cantidad + delta
      if (nuevaCantidad < 1) return item
      return { ...item, cantidad: nuevaCantidad }
    }))
    setDescuentoGlobal('')
  }, [])

  const quitarDelCarrito = useCallback((productoId) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId))
    setDescuentoGlobal('')
  }, [])

  const aplicarDescuento = useCallback((productoId, descuentoStr) => {
    const descuento = parseFloat(descuentoStr) || 0
    setCarrito(prev => prev.map(item => {
      if (item.producto.id !== productoId) return item
      return { ...item, descuento, precioFinal: Math.max(0, item.producto.precio - descuento) }
    }))
  }, [])

  const setPrecioManual = useCallback((productoId, precioStr) => {
    const precioFinal = parseFloat(precioStr) || 0
    setCarrito(prev => prev.map(item => {
      if (item.producto.id !== productoId) return item
      return { ...item, precioFinal, descuento: Math.max(0, item.producto.precio - precioFinal) }
    }))
  }, [])

  const aplicarDescuentoGlobal = useCallback((valorStr) => {
    setDescuentoGlobal(valorStr)
    const descTotal = parseFloat(valorStr) || 0
    if (descTotal <= 0) {
      setCarrito(prev => prev.map(item => ({ ...item, precioFinal: item.producto.precio, descuento: 0 })))
      return
    }
    setCarrito(prev => {
      const totalOriginal = prev.reduce((s, item) => s + item.producto.precio * item.cantidad, 0)
      if (totalOriginal === 0) return prev
      return prev.map(item => {
        const proporcion = (item.producto.precio * item.cantidad) / totalOriginal
        const descItem = (descTotal * proporcion) / item.cantidad
        const precioFinal = Math.max(0, item.producto.precio - descItem)
        return { ...item, descuento: parseFloat(descItem.toFixed(2)), precioFinal: parseFloat(precioFinal.toFixed(2)) }
      })
    })
  }, [])

  const toggleDescuento = useCallback((id) => {
    setEditandoDescuento(prev => prev === id ? null : id)
  }, [])

  const totalOriginal = carrito.reduce((s, item) => s + item.producto.precio * item.cantidad, 0)
  const total = carrito.reduce((sum, item) => sum + item.precioFinal * item.cantidad, 0)
  const totalItems = carrito.reduce((s, i) => s + i.cantidad, 0)

  async function registrarVenta() {
    if (carrito.length === 0) { toast.error('Agrega al menos un producto'); return }
    for (const item of carrito) {
      if (item.producto.stock !== null && item.producto.stock < item.cantidad) {
        toast.error(`Stock insuficiente para ${item.producto.nombre} (disponible: ${item.producto.stock})`)
        return
      }
    }
    setGuardando(true)
    try {
      const { data: ventaData, error: ventaError } = await supabase.from('ventas')
        .insert({ metodo_pago: metodoPago, notas: notas || null, total, fecha: new Date().toISOString().split('T')[0] })
        .select().single()
      if (ventaError) throw ventaError

      const items = carrito.map(item => ({
        venta_id: ventaData.id,
        producto_id: item.producto.id,
        nombre_producto: item.producto.nombre,
        precio_original: item.producto.precio,
        precio_unitario: item.precioFinal,
        descuento: item.descuento,
        cantidad: item.cantidad,
        subtotal: item.precioFinal * item.cantidad,
        precio_compra: item.producto.precio_compra || 0,
      }))

      const { error: itemsError } = await supabase.from('venta_items').insert(items)
      if (itemsError) throw itemsError

      for (const item of carrito) {
        if (item.producto.stock !== null) {
          await supabase.from('productos').update({ stock: Math.max(0, item.producto.stock - item.cantidad) }).eq('id', item.producto.id)
        }
      }

      toast.success(`✓ Venta registrada — S/ ${total.toFixed(2)}`)
      setCarrito([])
      setNotas('')
      setMetodoPago('Efectivo')
      setDescuentoGlobal('')
      setMostrarCarrito(false)
      cargarProductos()
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const carritoProps = {
    carrito, total, totalOriginal, totalItems, descuentoGlobal,
    editandoDescuento, metodoPago, notas, guardando,
    onQuitarItem: quitarDelCarrito,
    onCambiarCantidad: cambiarCantidad,
    onAplicarDescuento: aplicarDescuento,
    onPrecioManual: setPrecioManual,
    onDescuentoGlobal: aplicarDescuentoGlobal,
    onLimpiarDescuento: () => aplicarDescuentoGlobal(''),
    onMetodoPago: setMetodoPago,
    onNotas: setNotas,
    onToggleDescuento: toggleDescuento,
    onRegistrar: registrarVenta,
  }

  const ProductoCard = ({ producto }) => {
    const enCarrito = carrito.find(item => item.producto.id === producto.id)
    return (
      <button onClick={() => agregarAlCarrito(producto)} style={{ background: enCarrito ? 'var(--gold-glow)' : 'var(--surface)', border: `1px solid ${enCarrito ? 'var(--gold-dim)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', position: 'relative' }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
          {producto.tipo ? `${producto.categoria} · ${producto.tipo}` : producto.categoria}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.4 }}>{producto.nombre}</div>
        <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 600 }}>S/ {producto.precio.toFixed(2)}</div>
        <div style={{ fontSize: '10px', marginTop: '3px', color: producto.stock === 0 ? 'var(--danger)' : producto.stock <= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>
          {producto.stock === 0 ? '⚠ Sin stock' : `Stock: ${producto.stock}`}
        </div>
        {enCarrito && (
          <div style={{ position: 'absolute', top: '7px', right: '7px', width: '19px', height: '19px', background: 'var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--obsidian)' }}>
            {enCarrito.cantidad}
          </div>
        )}
      </button>
    )
  }

  return (
    <>
      {/* DESKTOP */}
      <div className="desktop-layout" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 400, marginBottom: '16px' }}>Catálogo</h2>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ paddingLeft: '30px', fontSize: '13px' }} />
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {categorias.map(cat => (
                <button key={cat} onClick={() => setCategoriaFiltro(cat)} style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, background: categoriaFiltro === cat ? 'var(--gold)' : 'var(--surface)', color: categoriaFiltro === cat ? 'var(--obsidian)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {TIPOS.map(tipo => (
                <button key={tipo} onClick={() => setTipoFiltro(tipo)} style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, background: tipoFiltro === tipo ? '#5a4aaf' : 'var(--surface)', color: tipoFiltro === tipo ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {tipo}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {productosFiltrados.map(p => <ProductoCard key={p.id} producto={p} />)}
            {productosFiltrados.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No hay productos</div>}
          </div>
        </div>
        <div style={{ position: 'sticky', top: '0', alignSelf: 'start' }}>
          <CarritoPanel {...carritoProps} />
        </div>
      </div>

      {/* MÓVIL */}
      <div className="mobile-layout" style={{ display: 'none', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ paddingLeft: '30px', fontSize: '13px' }} />
        </div>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px', flexWrap: 'wrap' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoriaFiltro(cat)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500, background: categoriaFiltro === cat ? 'var(--gold)' : 'var(--surface)', color: categoriaFiltro === cat ? 'var(--obsidian)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {cat}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {TIPOS.map(tipo => (
            <button key={tipo} onClick={() => setTipoFiltro(tipo)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500, background: tipoFiltro === tipo ? '#5a4aaf' : 'var(--surface)', color: tipoFiltro === tipo ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {tipo}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '90px' }}>
          {productosFiltrados.map(p => <ProductoCard key={p.id} producto={p} />)}
        </div>

        {carrito.length > 0 && !mostrarCarrito && (
          <button onClick={() => setMostrarCarrito(true)} style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--obsidian)', borderRadius: '50px', padding: '14px 28px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 20px rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', gap: '10px', zIndex: 100, whiteSpace: 'nowrap' }}>
            <ShoppingBag size={16} />
            Ver venta · S/ {total.toFixed(2)}
            <span style={{ background: 'var(--obsidian)', color: 'var(--gold)', borderRadius: '12px', padding: '1px 7px', fontSize: '11px' }}>{totalItems}</span>
          </button>
        )}

        {mostrarCarrito && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ background: 'var(--charcoal)', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Venta actual</span>
                <button onClick={() => setMostrarCarrito(false)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <CarritoPanel {...carritoProps} />
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 700px) {
          .desktop-layout { display: none !important; }
          .mobile-layout { display: block !important; }
        }
      `}</style>
    </>
  )
}
