import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Trash2, RefreshCw, CreditCard, Banknote, Smartphone } from 'lucide-react'

const METODO_ICON = {
  'Efectivo': Banknote,
  'Yape/Plin': Smartphone,
  'Transferencia': CreditCard,
}

export default function VentasHoy() {
  const [ventas, setVentas] = useState([])
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandida, setExpandida] = useState(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => { cargarDatos() }, [fecha])

  async function cargarDatos() {
    setCargando(true)
    const [ventasRes, gastosRes] = await Promise.all([
      supabase.from('ventas').select('*, venta_items(*)').eq('fecha', fecha).order('created_at', { ascending: false }),
      supabase.from('gastos').select('*').eq('fecha', fecha),
    ])
    if (ventasRes.error) toast.error('Error cargando ventas')
    else setVentas(ventasRes.data || [])
    if (!gastosRes.error) setGastos(gastosRes.data || [])
    setCargando(false)
  }

  async function eliminarVenta(id) {
    if (!confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    if (error) toast.error('Error eliminando venta')
    else { toast.success('Venta eliminada'); cargarDatos() }
  }

  const totalVentas = ventas.reduce((sum, v) => sum + Number(v.total), 0)
  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const neto = totalVentas - totalGastos
  const totalEfectivo = ventas.filter(v => v.metodo_pago === 'Efectivo').reduce((s, v) => s + Number(v.total), 0)
  const totalDigital = ventas.filter(v => v.metodo_pago !== 'Efectivo').reduce((s, v) => s + Number(v.total), 0)

  const hoy = new Date().toISOString().split('T')[0]
  const esHoy = fecha === hoy

  function formatHora(ts) {
    return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400 }}>
            {esHoy ? 'Ventas de Hoy' : 'Ventas del Día'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: 'auto', padding: '8px 12px' }} />
          <button onClick={cargarDatos} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', color: 'var(--text-secondary)', display: 'flex' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Resumen del día */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '24px' }}>
        {[
          { label: 'Ventas totales', value: `S/ ${totalVentas.toFixed(2)}`, color: 'var(--gold)', border: 'var(--gold-dim)' },
          { label: 'Gastos del día', value: `S/ ${totalGastos.toFixed(2)}`, color: 'var(--danger)', border: 'rgba(224,92,92,0.3)' },
          { label: 'Neto del día', value: `S/ ${neto.toFixed(2)}`, color: neto >= 0 ? 'var(--success)' : 'var(--danger)', border: neto >= 0 ? 'rgba(76,175,125,0.3)' : 'rgba(224,92,92,0.3)' },
          { label: 'Efectivo', value: `S/ ${totalEfectivo.toFixed(2)}`, color: 'var(--text-primary)', border: 'var(--border)' },
          { label: 'Digital', value: `S/ ${totalDigital.toFixed(2)}`, color: 'var(--text-primary)', border: 'var(--border)' },
        ].map(({ label, value, color, border }) => (
          <div key={label} style={{ background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>{label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Lista de ventas */}
      {cargando ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Cargando...</div>
      ) : ventas.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>Sin ventas registradas</p>
          <p style={{ fontSize: '13px' }}>Las ventas de este día aparecerán aquí</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ventas.map((venta, idx) => {
            const IconoPago = METODO_ICON[venta.metodo_pago] || CreditCard
            const abierta = expandida === venta.id
            return (
              <div key={venta.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', background: 'var(--surface-raised)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                    {ventas.length - idx}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <IconoPago size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{venta.metodo_pago}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>·</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatHora(venta.created_at)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {venta.venta_items?.length || 0} {venta.venta_items?.length === 1 ? 'producto' : 'productos'}
                      {venta.notas && <span> · {venta.notas}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--gold)', marginRight: '8px' }}>
                    S/ {Number(venta.total).toFixed(2)}
                  </div>
                  <button onClick={() => eliminarVenta(venta.id)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px', marginRight: '4px' }}>
                    <Trash2 size={14} />
                  </button>
                  <button onClick={() => setExpandida(abierta ? null : venta.id)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                    {abierta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                {abierta && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                          <th style={{ textAlign: 'left', paddingBottom: '8px', fontWeight: 500 }}>Producto</th>
                          <th style={{ textAlign: 'center', paddingBottom: '8px', fontWeight: 500 }}>Cant.</th>
                          <th style={{ textAlign: 'right', paddingBottom: '8px', fontWeight: 500 }}>Precio</th>
                          <th style={{ textAlign: 'right', paddingBottom: '8px', fontWeight: 500 }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venta.venta_items?.map(item => (
                          <tr key={item.id} style={{ borderTop: '1px solid var(--border)', fontSize: '12px' }}>
                            <td style={{ padding: '8px 0', paddingRight: '12px' }}>
                              {item.nombre_producto}
                              {item.descuento > 0 && <span style={{ fontSize: '10px', color: 'var(--success)', marginLeft: '6px' }}>-S/ {Number(item.descuento).toFixed(2)}</span>}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{item.cantidad}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>S/ {Number(item.precio_unitario).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold)' }}>S/ {Number(item.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
