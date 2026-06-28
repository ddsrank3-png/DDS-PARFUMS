import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Plus, Minus, AlertTriangle, Package, TrendingUp, Search } from 'lucide-react'

export default function Stock() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos')
  const [ajustando, setAjustando] = useState({}) // { [id]: cantidad }

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    setCargando(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('nombre')
    if (error) toast.error('Error cargando productos')
    else setProductos(data || [])
    setCargando(false)
  }

  async function ajustarStock(producto, delta) {
    const nuevoStock = Math.max(0, (producto.stock || 0) + delta)
    const { error } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)
    if (error) {
      toast.error('Error actualizando stock')
    } else {
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: nuevoStock } : p))
    }
  }

  async function establecerStock(producto, valor) {
    const nuevoStock = Math.max(0, parseInt(valor) || 0)
    const { error } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)
    if (error) {
      toast.error('Error actualizando stock')
    } else {
      setProductos(prev => prev.map(p => p.id === producto.id ? { ...p, stock: nuevoStock } : p))
      toast.success(`Stock actualizado — ${producto.nombre}`)
      setAjustando(prev => { const n = { ...prev }; delete n[producto.id]; return n })
    }
  }

  const categorias = ['Todos', ...new Set(productos.map(p => p.categoria))]

  const productosFiltrados = productos.filter(p => {
    const matchTexto = p.nombre.toLowerCase().includes(filtro.toLowerCase())
    const matchCat = categoriaFiltro === 'Todos' || p.categoria === categoriaFiltro
    return matchTexto && matchCat
  })

  const sinStock = productos.filter(p => (p.stock || 0) === 0).length
  const stockBajo = productos.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 3).length
  const totalUnidades = productos.reduce((s, p) => s + (p.stock || 0), 0)
  const valorInventario = productos.reduce((s, p) => s + (p.stock || 0) * Number(p.precio_compra || 0), 0)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
        Inventario / Stock
      </h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Total unidades</div>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{totalUnidades}</div>
        </div>
        <div style={{ background: sinStock > 0 ? 'rgba(224,92,92,0.08)' : 'var(--surface)', border: `1px solid ${sinStock > 0 ? 'rgba(224,92,92,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Sin stock</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: sinStock > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{sinStock}</div>
        </div>
        <div style={{ background: stockBajo > 0 ? 'rgba(224,154,60,0.08)' : 'var(--surface)', border: `1px solid ${stockBajo > 0 ? 'rgba(224,154,60,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Stock bajo (≤3)</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: stockBajo > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{stockBajo}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Valor inventario</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--gold)' }}>S/ {valorInventario.toFixed(2)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input placeholder="Buscar producto..." value={filtro} onChange={e => setFiltro(e.target.value)} style={{ paddingLeft: '30px', fontSize: '13px' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {categorias.map(cat => (
            <button key={cat} onClick={() => setCategoriaFiltro(cat)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500, background: categoriaFiltro === cat ? 'var(--gold)' : 'var(--surface)', color: categoriaFiltro === cat ? 'var(--obsidian)' : 'var(--text-secondary)', border: '1px solid var(--border)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de stock */}
      {cargando ? (
        <div style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando...</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface-raised)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 500 }}>Producto</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Costo</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Precio venta</th>
                <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 500 }}>Ganancia/u</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 500 }}>Stock actual</th>
                <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 500 }}>Ajustar</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(p => {
                const stock = p.stock || 0
                const ganancia = Number(p.precio) - Number(p.precio_compra || 0)
                const stockColor = stock === 0 ? 'var(--danger)' : stock <= 3 ? 'var(--warning)' : 'var(--success)'
                const editandoVal = ajustando[p.id]

                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.categoria}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      S/ {Number(p.precio_compra || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: 'var(--gold)' }}>
                      S/ {Number(p.precio).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: ganancia >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      S/ {ganancia.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {editandoVal !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <input
                            type="number"
                            value={editandoVal}
                            onChange={e => setAjustando(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ width: '60px', textAlign: 'center', fontSize: '13px', padding: '4px 6px' }}
                            min="0"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') establecerStock(p, editandoVal)
                              if (e.key === 'Escape') setAjustando(prev => { const n = { ...prev }; delete n[p.id]; return n })
                            }}
                          />
                          <button onClick={() => establecerStock(p, editandoVal)} style={{ background: 'var(--gold)', color: 'var(--obsidian)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600 }}>
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAjustando(prev => ({ ...prev, [p.id]: stock }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          title="Clic para editar"
                        >
                          <span style={{ fontSize: '18px', fontWeight: 700, color: stockColor }}>{stock}</span>
                          {stock === 0 && <div style={{ fontSize: '10px', color: 'var(--danger)' }}>SIN STOCK</div>}
                          {stock > 0 && stock <= 3 && <div style={{ fontSize: '10px', color: 'var(--warning)' }}>STOCK BAJO</div>}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => ajustarStock(p, -1)}
                          disabled={stock === 0}
                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: stock === 0 ? 'var(--text-muted)' : 'var(--text-primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: stock === 0 ? 'not-allowed' : 'pointer' }}
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => ajustarStock(p, 1)}
                          style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px', fontSize: '13px' }}>
                    No hay productos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
        💡 Toca el número de stock para editarlo directamente, o usa los botones + / − para ajustar de uno en uno.
      </p>
    </div>
  )
}
