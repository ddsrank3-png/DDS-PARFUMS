import React from 'react'
import { FlaskConical, ExternalLink } from 'lucide-react'

export default function SetupModal({ onClose }) {
  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '40px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <FlaskConical size={28} color="var(--gold)" />
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 400 }}>
          Configuración inicial
        </h1>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.7 }}>
        Para usar la app necesitas conectarla a tu base de datos de Supabase. Sigue estos pasos:
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {[
          {
            num: '1',
            title: 'Crea el schema en Supabase',
            body: 'Abre tu proyecto de Supabase → SQL Editor → New query. Pega el contenido del archivo supabase_schema.sql que viene en el proyecto y ejecuta.',
          },
          {
            num: '2',
            title: 'Obtén tus credenciales',
            body: 'En Supabase ve a Settings → API. Copia el Project URL y el anon/public key.',
          },
          {
            num: '3',
            title: 'Crea el archivo .env',
            body: 'En la raíz del proyecto crea un archivo .env con:\nVITE_SUPABASE_URL=tu_url_aqui\nVITE_SUPABASE_ANON_KEY=tu_key_aqui',
          },
          {
            num: '4',
            title: 'Deploy en Netlify',
            body: 'Sube el proyecto a GitHub, conecta en Netlify y agrega las variables de entorno (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY) en Site settings → Environment variables.',
          },
        ].map(({ num, title, body }) => (
          <div key={num} style={{ display: 'flex', gap: '16px' }}>
            <div style={{
              width: '28px', height: '28px',
              borderRadius: '50%',
              background: 'var(--gold-glow)',
              border: '1px solid var(--gold-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--gold)',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              {num}
            </div>
            <div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <a
          href="https://app.supabase.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 16px',
            background: 'var(--gold)',
            color: 'var(--obsidian)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={14} />
          Abrir Supabase
        </a>
        <button
          onClick={onClose}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '13px',
          }}
        >
          Ya lo configuré, continuar
        </button>
      </div>
    </div>
  )
}
