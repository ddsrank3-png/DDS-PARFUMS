import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import toast from 'react-hot-toast'
import { Plus, Trash2, RefreshCw, Bus, UtensilsCrossed, Droplets, Package, ShoppingBag, MoreHorizontal } from 'lucide-react'

const CATEGORIAS_GASTO = [
  { id: 'pasaje', label: 'Pasaje', icon: Bus },
  { id: 'comida', label: 'Comida', icon: UtensilsCrossed },
  { id: 'agua', label: 'Agua', icon: Droplets },
  { id: 'materiales', label: 'Materiales', icon: Package },
  { id: 'bolsas', label: 'Bolsas/Sobres', icon: ShoppingBag },
  { id: 'otro', label: 'Otro', icon: MoreHorizontal },
]

export default function Gastos() {
  const [gastos, setGastos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ categoria: 'pasaje', descripcion: '', monto: '' })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarGastos() }, [fecha])

  async function cargarGastos() {
    setCargando(true)
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false })
    if (error) toast.error('Error cargando gastos')
    else setGastos(data || [])
    setCargando(false)
  }

  async function agregarGasto() {
    if (!form.monto || parseFloat(form.monto) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('gastos').insert({
      fecha,
      categoria: form.categoria,
      descripcion: form.descripcion || null,
      monto: parseFloat(form.monto),
    })
    if (error) {
      toast.error('Error guardando gasto')
    } else {
      toast.success('Gasto registrado')
      setForm({ categoria: 'pasaje', descripcion: '', monto: '' })
      setMostrarForm(false)
      cargarGastos()
    }
    setGuardando(false)
  }

  async function eliminarGasto(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) toast.error('Error eliminando gasto')
    else { toast.success('Gasto eliminado'); cargarGastos() }
  }

  const totalGastos = gastos.reduce((s, g) => s + Number(g.monto), 0)

  const porCategoria = CATEGORIAS_GASTO.map(cat => ({
    ...cat,
    total: gastos.filter(g => g.categoria === cat.id).reduce((s, g) => s + Number(g.monto), 0)
  })).filter(c => c.total > 0)

  const hoy = new Date().toISOString().split('T')[0]
  const esHoy = fecha === hoy

  function getCatInfo(id) {
    return CATEGORIAS_GASTO.find(c => c.id === id) || CATEGORIAS_GASTO[CATEGORIAS_GASTO.length - 1]
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 400 }}>
            {esHoy ? 'Gastos de Hoy' : 'Gastos del Día'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
            {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ width: 'auto', padding: '8px 12px', fontSize: '13px' }} />
          <button onClick={cargarGastos} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px', color: 'var(--text-secondary)', display: 'flex' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Total gastos */}
      <div style={{ display: 'grid', gridTemplateColumns: porCategoria.length > 0 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.25)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Total gastos del día</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--danger)' }}>S/ {totalGastos.toFixed(2)}</div>
        </div>
        {porCategoria.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Por categoría</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {porCategoria.map(cat => {
                const Icon = cat.icon
                return (
                  <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <Icon size={12} color="var(--text-muted)" />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{cat.label}</span>
                    <span style={{ fontWeight: 600, color: 'var(--danger)' }}>S/ {cat.total.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Botón agregar */}
      <button
        onClick={() => setMostrarForm(!mostrarForm)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px',
          background: mostrarForm ? 'var(--surface)' : 'var(--gold)',
          color: mostrarForm ? 'var(--text-secondary)' : 'var(--obsidian)',
          border: mostrarForm ? '1px solid var(--border)' : 'none',
          borderRadius: 'var(--radius)',
          fontSize: '13px', fontWeight: 600,
          marginBottom: '16px',
        }}
      >
        <Plus size={15} />
        {mostrarForm ? 'Cancelar' : 'Registrar gasto'}
      </button>

      {/* Formulario */}
      {mostrarForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px', color: 'var(--gold)' }}>Nuevo gasto</div>

          {/* Categorías */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categoría</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORIAS_GASTO.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setForm({ ...form, categoria: cat.id })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px', fontWeight: 500,
                      background: form.categoria === cat.id ? 'var(--gold)' : 'var(--surface-raised)',
                      color: form.categoria === cat.id ? 'var(--obsidian)' : 'var(--text-secondary)',
                      border: `1px solid ${form.categoria === cat.id ? 'var(--gold)' : 'var(--border)'}`,
                    }}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descripción (opcional)</label>
              <input
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Ej: Pasaje al mercado, almuerzo..."
                style={{ fontSize: '13px' }}
              />
            </div>
            <div style={{ minWidth: '110px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monto S/</label>
              <input
                type="number"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.50"
                style={{ fontSize: '13px' }}
                onKeyDown={e => e.key === 'Enter' && agregarGasto()}
                autoFocus
              />
            </div>
          </div>

          <button
            onClick={agregarGasto}
            disabled={guardando}
            style={{
              marginTop: '14px',
              padding: '10px 20px',
              background: 'var(--gold)',
              color: 'var(--obsidian)',
              borderRadius: 'var(--radius)',
              fontSize: '13px', fontWeight: 700,
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </div>
      )}

      {/* Lista de gastos */}
      {cargando ? (
        <div style={{ color: 'var(--text-muted)', padding: '20px', textAlign: 'center' }}>Cargando...</div>
      ) : gastos.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          Sin gastos registrados hoy
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {gastos.map(gasto => {
            const cat = getCatInfo(gasto.categoria)
            const Icon = cat.icon
            return (
              <div key={gasto.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', background: 'rgba(224,92,92,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color="var(--danger)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{cat.label}</div>
                  {gasto.descripcion && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>{gasto.descripcion}</div>}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>
                  S/ {Number(gasto.monto).toFixed(2)}
                </div>
                <button onClick={() => eliminarGasto(gasto.id)} style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
