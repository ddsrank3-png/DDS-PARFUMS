import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { TrendingUp, Package, Tag, Calendar } from 'lucide-react'

function getFirstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function Resumen() {
  const [desde, setDesde] = useState(getFirstDayOfMonth())
  const [hasta, setHasta] = useState(new Date().toISOString().split('T')[0])
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarResumen()
  }, [desde, hasta])

  async function cargarResumen() {
    setCargando(true)
    const { data, error } = await supabase
      .from('ventas')
      .select(`*, venta_items(*)`)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: false })

    if (error) {
      toast.error('Error cargando resumen')
    } else {
      setVentas(data || [])
    }
    setCargando(false)
  }

  // Estadísticas
  const totalIngresos = ventas.reduce((s, v) => s + Number(v.total), 0)
  const totalTransacciones = ventas.length
  const totalDescuentos = ventas.flatMap(v => v.venta_items || []).reduce((s, i) => s + Number(i.descuento) * i.cantidad, 0)

  // Agrupado por método de pago
  const porMetodo = ventas.reduce((acc, v) => {
    acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + Number(v.total)
    return acc
  }, {})

  // Top productos
  const allItems = ventas.flatMap(v => v.venta_items || [])
  const porProducto = allItems.reduce((acc, item) => {
    const key = item.nombre_producto
    if (!acc[key]) acc[key] = { nombre: key, cantidad: 0, ingresos: 0 }
    acc[key].cantidad += item.cantidad
    acc[key].ingresos += Number(item.subtotal)
    return acc
  }, {})
  const topProductos = Object.values(porProducto).sort((a, b) => b.ingresos - a.ingresos).slice(0, 10)

  // Ventas por día
  const porDia = ventas.reduce((acc, v) => {
    acc[v.fecha] = (acc[v.fecha] || 0) + Number(v.total)
    return acc
  }, {})
  const diasOrdenados = Object.entries(porDia).sort((a, b) => a[0].localeCompare(b[0]))
  const maxDia = Math.max(...diasOrdenados.map(([, t]) => t), 1)

  function formatFecha(f) {
    return new Date(f + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
  }

  // Preajustes de rango
  function setRango(tipo) {
    const hoy = new Date()
    const pad = n => String(n).padStart(2, '0')
    if (tipo === 'semana') {
      const inicio = new Date(hoy)
      inicio.setDate(hoy.getDate() - 6)
      setDesde(`${inicio.getFullYear()}-${pad(inicio.getMonth()+1)}-${pad(inicio.getDate())}`)
      setHasta(hoy.toISOString().split('T')[0])
    } else if (tipo === 'mes') {
      setDesde(`${hoy.getFullYear()}-${pad(hoy.getMonth()+1)}-01`)
      setHasta(hoy.toISOString().split('T')[0])
    } else if (tipo === 'mesAnterior') {
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      setDesde(`${mes.getFullYear()}-${pad(mes.getMonth()+1)}-01`)
      setHasta(`${fin.getFullYear()}-${pad(fin.getMonth()+1)}-${pad(fin.getDate())}`)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400, marginBottom: '20px' }}>
        Resumen de Ventas
      </h2>

      {/* Filtro de fechas */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ width: 'auto', padding: '7px 10px', fontSize: '13px' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>hasta</span>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ width: 'auto', padding: '7px 10px', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {[['semana', 'Última semana'], ['mes', 'Este mes'], ['mesAnterior', 'Mes anterior']].map(([k, label]) => (
              <button key={k} onClick={() => setRango(k)} style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Cargando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { icon: TrendingUp, label: 'Ingresos totales', value: `S/ ${totalIngresos.toFixed(2)}`, color: 'var(--gold)' },
              { icon: Package, label: 'Transacciones', value: totalTransacciones, color: 'var(--text-primary)' },
              { icon: Tag, label: 'Descuentos dados', value: `S/ ${totalDescuentos.toFixed(2)}`, color: 'var(--danger)' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Icon size={15} color="var(--text-muted)" />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Por método de pago */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Por método de pago</h3>
              {Object.entries(porMetodo).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin datos</p>
              ) : (
                Object.entries(porMetodo).map(([metodo, monto]) => (
                  <div key={metodo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ flex: 1, marginRight: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px' }}>{metodo}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>S/ {monto.toFixed(2)}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--surface-raised)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', background: 'var(--gold)', borderRadius: '2px', width: `${(monto / totalIngresos * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
                      {(monto / totalIngresos * 100).toFixed(0)}%
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Ventas por día */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Ventas por día</h3>
              {diasOrdenados.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin datos</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {diasOrdenados.map(([dia, total]) => (
                    <div key={dia}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatFecha(dia)}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>S/ {total.toFixed(2)}</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--surface-raised)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', background: 'var(--gold-dim)', borderRadius: '2px', width: `${(total / maxDia * 100).toFixed(0)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top productos */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-secondary)' }}>Top productos por ingresos</h3>
            {topProductos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sin datos</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '10px', fontWeight: 500 }}>Producto</th>
                    <th style={{ textAlign: 'center', paddingBottom: '10px', fontWeight: 500 }}>Vendidos</th>
                    <th style={{ textAlign: 'right', paddingBottom: '10px', fontWeight: 500 }}>Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.map((p, i) => (
                    <tr key={p.nombre} style={{ borderTop: '1px solid var(--border)', fontSize: '13px' }}>
                      <td style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '18px' }}>#{i + 1}</span>
                        {p.nombre}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '9px 0' }}>{p.cantidad}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--gold)', padding: '9px 0' }}>S/ {p.ingresos.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
