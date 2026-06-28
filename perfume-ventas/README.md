# 🌸 Registro de Ventas de Fragancias

App para registrar ventas de perfumes y decants, con base de datos en Supabase y deploy en Netlify.

---

## 🚀 Setup paso a paso

### 1. Configurar Supabase

1. Entra a [app.supabase.com](https://app.supabase.com) y abre tu proyecto
2. Ve a **SQL Editor → New query**
3. Pega todo el contenido de `supabase_schema.sql` y haz clic en **Run**
4. Ve a **Settings → API** y copia:
   - **Project URL** (ej: `https://xyzabcdef.supabase.co`)
   - **anon/public key** (empieza con `eyJ...`)

### 2. Configurar variables de entorno (local)

Crea un archivo `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu_key_aqui
```

### 3. Instalar y correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

### 4. Deploy en Netlify

1. Sube el proyecto a un repositorio de GitHub
2. Entra a [netlify.com](https://netlify.com) → **Add new site → Import an existing project**
3. Conecta tu repositorio de GitHub
4. En **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. En **Environment variables** agrega:
   - `VITE_SUPABASE_URL` = tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = tu anon key
6. Haz clic en **Deploy site**

¡Listo! Netlify te dará un link para compartir.

---

## 📱 Funciones

- **Nueva Venta**: Busca y selecciona productos, aplica descuentos, registra método de pago
- **Ventas del Día**: Ve todas las ventas de cualquier día, con totales por método de pago
- **Resumen**: Estadísticas por rango de fechas, top productos, desglose por pago
- **Configuración**: Agregar/editar/desactivar productos, eliminar ventas

## 💡 Tips

- Puedes **desactivar** un producto sin eliminarlo (no aparece en el catálogo pero mantiene historial)
- Al registrar una venta, se guarda un **snapshot del precio** para que los cambios futuros no afecten ventas pasadas
- Los **descuentos** se pueden aplicar por monto fijo o editando el precio directamente
