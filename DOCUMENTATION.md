# Cash & Flow — Documentación Técnica

> Última actualización: 2024-03-03
> Mantener este archivo actualizado conforme se integra la base de datos.

---

## 1. Estructura del Proyecto

```
Cash_Flow/
├── index.html          # Página principal (pública)
├── admin.html          # Panel de administración (protegido)
├── css/
│   └── styles.css      # Todos los estilos de la app
├── js/
│   ├── app.js          # Lógica principal (loader, video scrubbing, flipbook)
│   ├── db.js           # Mock DB (reemplazar por llamadas a Supabase/REST)
│   └── admin.js        # Lógica del panel admin
├── assets/
│   └── logo.png        # Logo de la marca (sin fondo)
├── multimedia_cash/    # Imágenes de los vehículos y eventos
│   ├── car_001.jpg     # Zentorno (Pegassi)
│   ├── car_002.jpg     # Itali RSX (Grotti)
│   ├── car_003.jpg     # Oppressor Mk I (Pegassi)
│   ├── car_004.jpg     # Panto (Benefactor)
│   ├── flipbook_garage.png
│   ├── flipbook_event.png
│   └── event_upcoming.png
└── NUDRE3547.MOV       # Video de fondo (NO sube a GitHub — .gitignore)
```

---

## 2. Secciones de la Página Principal

| Sección         | ID HTML        | Descripción                                  |
|----------------|----------------|----------------------------------------------|
| Hero           | `.hero`        | Video de fondo + logo animado + CTAs         |
| Inventario     | `#inventory`   | Grid de tarjetas de vehículos                |
| Blog/Flipbook  | `#blog`        | Libro animado con páginas de contenido       |
| Eventos        | `#events`      | Eventos próximos y pasados                   |
| Footer/Contacto| `#contact`     | Links, tagline, copyright                    |

---

## 3. Modelo de Datos — Vehículos (Inventario)

Actualmente en `js/db.js` como array en `localStorage`.

**Estructura de cada vehículo:**

```js
{
  id:           Number,       // ID único (autoincremental)
  brand:        String,       // Marca. Ej: "Pegassi"
  model:        String,       // Modelo. Ej: "Zentorno"
  year:         Number,       // Año. Ej: 2024
  price:        String,       // Precio formateado. Ej: "$7,250,000 MXN"
  engine:       String,       // Descripción del motor. Ej: "6.8L V12 Mid-Engine"
  hp:           String,       // Potencia. Ej: "750 HP"
  acceleration: String,       // 0-100 km/h. Ej: "2.8s (0-100 km/h)"
  color:        String,       // Color. Ej: "Azul Eléctrico"
  imageUrl:     String,       // Ruta relativa a la imagen. Ej: "multimedia_cash/car_001.jpg"
  description:  String        // Descripción larga del vehículo
}
```

**Tabla DB sugerida (Supabase):** `vehicles`

| Campo         | Tipo          | Notas                             |
|---------------|---------------|-----------------------------------|
| id            | uuid / serial | Primary key                       |
| brand         | text          |                                   |
| model         | text          |                                   |
| year          | integer       |                                   |
| price_mxn     | numeric       | Guardar como número, formatear en front |
| engine        | text          |                                   |
| hp            | integer       |                                   |
| acceleration  | text          | Ej: "2.8s"                        |
| color         | text          |                                   |
| image_url     | text          | URL de Supabase Storage           |
| description   | text          |                                   |
| is_available  | boolean       | true/false según stock            |
| created_at    | timestamptz   | Default now()                     |

---

## 4. Modelo de Datos — Eventos

Actualmente en HTML estático en `index.html`. Migrar a DB.

**Estructura de cada evento:**

```js
{
  id:          Number,
  title:       String,    // Ej: "Cash & Flow Night Vol. 3"
  date:        String,    // ISO format. Ej: "2024-04-15"
  description: String,
  location:    String,    // Ej: "Parque Industrial Querétaro"
  imageUrl:    String,    // Ruta a la imagen del evento
  status:      String,    // "upcoming" | "past"
  cta_url:     String,    // URL de registro (puede ser null para pasados)
  cta_label:   String     // Ej: "Registrarme" | null
}
```

**Tabla DB sugerida:** `events`

| Campo       | Tipo        | Notas                                 |
|-------------|-------------|---------------------------------------|
| id          | uuid        | Primary key                           |
| title       | text        |                                       |
| event_date  | date        |                                       |
| description | text        |                                       |
| location    | text        |                                       |
| image_url   | text        | URL de Supabase Storage               |
| status      | text        | CHECK: 'upcoming' OR 'past'           |
| cta_url     | text        | Nullable                              |
| cta_label   | text        | Nullable                              |
| created_at  | timestamptz | Default now()                         |

---

## 5. Modelo de Datos — Flipbook (Blog)

Actualmente en HTML estático. Migrar a DB para que sea editable desde Admin.

**Estructura de cada página del flipbook:**

```js
{
  id:        Number,
  order:     Number,   // Posición en el flipbook (1, 2, 3...)
  tag:       String,   // Etiqueta superior. Ej: "NUESTRA HISTORIA"
  title:     String,
  body:      String,   // Texto (puede contener HTML básico)
  imageUrl:  String,   // Imagen izquierda de la página
  isActive:  Boolean   // Para activar/desactivar sin borrar
}
```

**Tabla DB sugerida:** `flipbook_pages`

| Campo      | Tipo        | Notas                       |
|------------|-------------|-----------------------------|
| id         | uuid        | Primary key                 |
| page_order | integer     | Orden de aparición          |
| tag        | text        |                             |
| title      | text        |                             |
| body       | text        | Plain text o HTML sanitizado|
| image_url  | text        | Supabase Storage            |
| is_active  | boolean     | Default true                |
| created_at | timestamptz | Default now()               |

---

## 6. Panel de Administración (`admin.html`)

| Función         | Descripción                                 | Estado      |
|----------------|---------------------------------------------|-------------|
| CRUD Vehículos  | Crear, editar, eliminar vehículos           | ✅ Activo (mock DB) |
| CRUD Eventos    | Gestionar eventos próximos y pasados        | 🔜 Pendiente |
| CRUD Flipbook   | Editar páginas del flipbook                 | 🔜 Pendiente |
| Login           | Autenticación básica (ver `pass` file)      | 🔜 Migrar a Supabase Auth |

---

## 7. Variables de Entorno (cuando se conecte la DB)

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
```

**Integración:** Agregar `@supabase/supabase-js` via CDN o npm.

```html
<!-- CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
```

Reemplazar todas las llamadas a `window.CashFlowDB` en `app.js` y `admin.js`
por llamadas a `supabase.from('vehicles').select(...)`.

---

## 8. Flujo del Sistema Actual (Frontend-only)

```
index.html
   │
   ├── js/db.js        →  CashFlowDB (mock, usa localStorage)
   │       ├── getAllCars()
   │       ├── addCar()
   │       ├── updateCar()
   │       └── deleteCar()
   │
   └── js/app.js       →  Lógica UI
           ├── Loader + FLIP logo animation
           ├── Video scrubbing (scroll-linked)
           ├── Navbar glassmorphism on scroll
           ├── Flipbook auto-advance (7s)
           └── loadInventory() → llama CashFlowDB.getAllCars()
```

---

## 9. Próximos Pasos para Integración con DB

1. **Crear proyecto en Supabase** → obtener URL + anon key
2. **Crear tablas** según esquemas de las secciones 3, 4 y 5
3. **Configurar Storage** para imágenes (bucket `media`)
4. **Reemplazar `db.js`** por módulo Supabase
5. **Agregar auth** en `admin.html` con Supabase Auth
6. **Agregar CRUD de Eventos y Flipbook** al panel Admin
7. **Habilitar RLS** (Row Level Security) en Supabase para proteger datos

---

*Este archivo debe actualizarse cada vez que se modifique la estructura de datos o se agreguen nuevas secciones a la página.*
