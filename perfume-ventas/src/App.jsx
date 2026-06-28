import React, { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { ShoppingBag, CalendarDays, BarChart3, Settings, Boxes, ReceiptText } from 'lucide-react'
import NuevaVenta from './pages/NuevaVenta.jsx'
import VentasHoy from './pages/VentasHoy.jsx'
import Resumen from './pages/Resumen.jsx'
import Configuracion from './pages/Configuracion.jsx'
import Stock from './pages/Stock.jsx'
import Gastos from './pages/Gastos.jsx'
import SetupModal from './components/SetupModal.jsx'

const TABS = [
  { id: 'venta', label: 'Nueva Venta', icon: ShoppingBag },
  { id: 'hoy', label: 'Ventas del Día', icon: CalendarDays },
  { id: 'gastos', label: 'Gastos', icon: ReceiptText },
  { id: 'resumen', label: 'Resumen', icon: BarChart3 },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'config', label: 'Configuración', icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState('venta')
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!url || !key || url === 'YOUR_SUPABASE_URL') {
      setNeedsSetup(true)
    }
  }, [])

  const ActivePage = { venta: NuevaVenta, hoy: VentasHoy, gastos: Gastos, resumen: Resumen, stock: Stock, config: Configuracion }[tab]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'var(--charcoal)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        height: '56px',
        flexShrink: 0,
      }}>
        {/* Logo DDS */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--gold)',
        }}>
          DDS
        </div>
        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: 'var(--text-primary)',
            textTransform: 'uppercase',
          }}>
            Día de Suerte
          </span>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            Parfums · Ica
          </span>
        </div>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Registro de Ventas
        </span>
      </header>

      {/* Nav tabs */}
      <nav style={{
        background: 'var(--charcoal)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        padding: '0 16px',
        gap: '2px',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: tab === id ? 'var(--gold)' : 'var(--text-secondary)',
              background: 'none',
              borderBottom: tab === id ? '2px solid var(--gold)' : '2px solid transparent',
              borderRadius: 0,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={14} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {needsSetup ? (
          <SetupModal onClose={() => setNeedsSetup(false)} />
        ) : (
          <ActivePage />
        )}
      </main>

      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'toast-dark',
          duration: 3000,
        }}
      />

      <style>{`
        @media (max-width: 600px) {
          .nav-label { display: none; }
          main { padding: 16px; }
        }
      `}</style>
    </div>
  )
}
