import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Search, Plus, Minus, Trash2, ShoppingBag, Tag, ChevronDown } from 'lucide-react'

const METODOS_PAGO = ['Efectivo', 'Yape/Plin', 'Transferencia']

export default function NuevaVenta() {
  const [productos, setProductos] = useState([])
  const [filtro, setFiltro] = useState('')
  const [carrito, setCarrito] = useState([]) // [{producto, cantidad, precioFinal, descuento}]
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [editandoDescuento, setEditandoDescuento] = useState(null) // producto_id

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre')
    if (error) {
      toast.error('Error cargando productos')
      return
    }
    setProductos(data || [])
  }

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  const productosFiltrados = productos.filter(p => {
    const matchTexto = p.nombre.toLowerCase().includes(filtro.toLowerCase())
    const matchCat = categoriaFiltro === 'Todos' || p.categoria === categoriaFiltro
    return matchTexto && matchCat
  })

  function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.producto.id === producto.id)
    if (existe) {
      setCarrito(carrito.map(item =>
        item.producto.id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
    } else {
      setCarrito([...carrito, {
        producto,
        cantidad: 1,
        precioFinal: producto.precio,
        descuento: 0,
      }])
    }
  }

  function cambiarCantidad(productoId, delta) {
    setCarrito(carrito.map(item => {
      if (item.producto.id !== productoId) return item
      const nuevaCantidad = item.cantidad + delta
      if (nuevaCantidad < 1) return item
      return { ...item, cantidad: nuevaCantidad }
    }))
  }

  function quitarDelCarrito(productoId) {
    setCarrito(carrito.filter(item => item.producto.id !== productoId))
  }

  function aplicarDescuento(productoId, descuentoStr) {
    const descuento = parseFloat(descuentoStr) || 0
    setCarrito(carrito.map(item => {
      if (item.producto.id !== productoId) return item
      const precioFinal = Math.max(0, item.producto.precio - descuento)
      return { ...item, descuento, precioFinal }
    }))
  }

  function setPrecioManual(productoId, precioStr) {
    const precioFinal = parseFloat(precioStr) || 0
    setCarrito(carrito.map(item => {
      if (item.producto.id !== productoId) return item
      const descuento = Math.max(0, item.producto.precio - precioFinal)
      return { ...item, precioFinal, descuento }
    }))
  }

  const total = carrito.reduce((sum, item) => sum + item.precioFinal * item.cantidad, 0)
  const totalDescuentos = carrito.reduce((sum, item) => sum + item.descuento * item.cantidad, 0)

  async function registrarVenta() {
    if (carrito.length === 0) {
      toast.error('Agrega al menos un producto')
      return
    }
    setGuardando(true)
    try {
      // Crear venta
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          metodo_pago: metodoPago,
          notas: notas || null,
          total,
          fecha: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (ventaError) throw ventaError

      // Crear items
      const items = carrito.map(item => ({
        venta_id: ventaData.id,
        producto_id: item.producto.id,
        nombre_producto: item.producto.nombre,
        precio_original: item.producto.precio,
        precio_unitario: item.precioFinal,
        descuento: item.descuento,
        cantidad: item.cantidad,
        subtotal: item.precioFinal * item.cantidad,
      }))

      const { error: itemsError } = await supabase.from('venta_items').insert(items)
      if (itemsError) throw itemsError

      toast.success(`Venta registrada — S/ ${total.toFixed(2)}`)
      setCarrito([])
      setNotas('')
      setMetodoPago('Efectivo')
    } catch (err) {
      toast.error('Error registrando venta: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
      {/* Catálogo */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
          Catálogo de Productos
        </h2>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              placeholder="Buscar producto..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaFiltro(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: categoriaFiltro === cat ? 'var(--gold)' : 'var(--surface)',
                  color: categoriaFiltro === cat ? 'var(--obsidian)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {productosFiltrados.map(producto => {
            const enCarrito = carrito.find(item => item.producto.id === producto.id)
            return (
              <button
                key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                style={{
                  background: enCarrito ? 'var(--gold-glow)' : 'var(--surface)',
                  border: `1px solid ${enCarrito ? 'var(--gold-dim)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  {producto.categoria}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {producto.nombre}
                </div>
                <div style={{ fontSize: '15px', color: 'var(--gold)', fontWeight: 600 }}>
                  S/ {producto.precio.toFixed(2)}
                </div>
                {enCarrito && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '20px', height: '20px',
                    background: 'var(--gold)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                    color: 'var(--obsidian)',
                  }}>
                    {enCarrito.cantidad}
                  </div>
                )}
              </button>
            )
          })}
          {productosFiltrados.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
              No hay productos
            </div>
          )}
        </div>
      </div>

      {/* Carrito / Venta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'sticky',
          top: '0',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} color="var(--gold)" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Venta actual</span>
            {carrito.length > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--gold)',
                color: 'var(--obsidian)',
                borderRadius: '12px',
                padding: '1px 8px',
                fontSize: '11px',
                fontWeight: 700,
              }}>
                {carrito.reduce((s, i) => s + i.cantidad, 0)} items
              </span>
            )}
          </div>

          {/* Items del carrito */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {carrito.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Toca un producto para agregarlo
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.producto.id} style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, fontSize: '12px', fontWeight: 500, lineHeight: 1.4, paddingRight: '8px' }}>
                      {item.producto.nombre}
                    </div>
                    <button onClick={() => quitarDelCarrito(item.producto.id)} style={{ background: 'none', color: 'var(--text-muted)', padding: '2px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {/* Cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => cambiarCantidad(item.producto.id, -1)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={11} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item.producto.id, 1)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Precio final */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      {item.descuento > 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          S/ {item.producto.precio.toFixed(2)}
                        </div>
                      )}
                      <div style={{ fontSize: '14px', color: 'var(--gold)', fontWeight: 700 }}>
                        S/ {(item.precioFinal * item.cantidad).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Descuento / precio manual */}
                  <button
                    onClick={() => setEditandoDescuento(editandoDescuento === item.producto.id ? null : item.producto.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: 'none', color: 'var(--text-muted)', fontSize: '11px',
                      padding: '2px 0',
                    }}
                  >
                    <Tag size={11} />
                    {item.descuento > 0 ? `Descuento: S/ ${item.descuento.toFixed(2)}` : 'Aplicar descuento'}
                    <ChevronDown size={11} style={{ transform: editandoDescuento === item.producto.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                  </button>

                  {editandoDescuento === item.producto.id && (
                    <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Descuento S/</label>
                        <input
                          type="number"
                          value={item.descuento || ''}
                          onChange={e => aplicarDescuento(item.producto.id, e.target.value)}
                          placeholder="0.00"
                          min="0"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>Precio final S/</label>
                        <input
                          type="number"
                          value={item.precioFinal || ''}
                          onChange={e => setPrecioManual(item.producto.id, e.target.value)}
                          min="0"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Totales y acciones */}
          {carrito.length > 0 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              {totalDescuentos > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--success)', marginBottom: '6px' }}>
                  <span>Descuentos aplicados</span>
                  <span>- S/ {totalDescuentos.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>
                <span>Total</span>
                <span style={{ color: 'var(--gold)' }}>S/ {total.toFixed(2)}</span>
              </div>

              {/* Método de pago */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Método de pago
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {METODOS_PAGO.map(m => (
                    <button
                      key={m}
                      onClick={() => setMetodoPago(m)}
                      style={{
                        flex: 1,
                        padding: '7px 4px',
                        fontSize: '11px',
                        fontWeight: 500,
                        borderRadius: 'var(--radius-sm)',
                        background: metodoPago === m ? 'var(--gold)' : 'var(--surface-raised)',
                        color: metodoPago === m ? 'var(--obsidian)' : 'var(--text-secondary)',
                        border: `1px solid ${metodoPago === m ? 'var(--gold)' : 'var(--border)'}`,
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <textarea
                placeholder="Notas (opcional)..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
                rows={2}
                style={{ fontSize: '12px', marginBottom: '12px', resize: 'none' }}
              />

              <button
                onClick={registrarVenta}
                disabled={guardando}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: guardando ? 'var(--gold-dim)' : 'var(--gold)',
                  color: 'var(--obsidian)',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.03em',
                }}
              >
                {guardando ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
