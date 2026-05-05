# Finanzas del Hogar

App web para llevar las finanzas familiares. Frontend estático (HTML + JS vanilla + Tailwind via CDN + Chart.js) y backend serverless en **Cloudflare Pages Functions** con almacenamiento en **Workers KV**.

- **Login único** (un usuario compartido por la familia).
- **Datos sincronizados en la nube**: al iniciar sesión desde cualquier navegador o dispositivo, se ven los mismos datos.
- **Caché local** en `localStorage` para que la app cargue al instante aunque el servidor tarde.
- **Exportar / Importar JSON** como respaldo manual.

---

## Estructura

```
.
├── index.html              # UI principal + overlay de login
├── css/styles.css
├── js/
│   ├── auth.js             # Flujo de login / logout
│   ├── store.js            # Carga y guardado contra /api/data
│   ├── app.js              # Bootstrap (gate de auth + render)
│   └── ...                 # Resto de la app (vistas, forms, etc.)
├── functions/              # Backend (Cloudflare Pages Functions)
│   ├── _lib/auth.js        # Sesión firmada con HMAC + helpers
│   └── api/
│       ├── login.js        # POST /api/login
│       ├── logout.js       # POST /api/logout
│       ├── session.js      # GET  /api/session
│       └── data.js         # GET / PUT /api/data  (KV)
├── wrangler.toml           # Binding KV para dev local
├── .dev.vars.example       # Variables de entorno para dev (copiar a .dev.vars)
└── .gitignore
```

---

## Despliegue en Cloudflare Pages (paso a paso)

### 1. Subir el código a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/finanzas-hogar.git
git push -u origin main
```

> El `.gitignore` ya excluye los `finanzas_*.json` con datos personales.

### 2. Crear el namespace KV

En el panel de Cloudflare → **Workers & Pages** → **KV** → **Create namespace**:

- Nombre: `finanzas-hogar-kv`
- Copia el **ID** que aparece (lo necesitarás solo si usas Wrangler en local).

### 3. Crear el proyecto Pages

Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**:

- Selecciona el repo de GitHub.
- **Build command**: *(vacío — es estático)*
- **Build output directory**: `/` (raíz)
- **Root directory**: `/`
- Deploy.

### 4. Configurar las variables de entorno (secrets)

En el proyecto recién creado → **Settings** → **Environment variables** → añadir como **Secret** (encriptadas, no visibles), ambiente *Production*:

| Nombre            | Valor                                         |
|-------------------|-----------------------------------------------|
| `AUTH_USER`       | `FamiliaPM`                                   |
| `AUTH_PASS`       | `VPM@2025`  *(la contraseña real)*            |
| `SESSION_SECRET`  | una cadena aleatoria larga (32+ caracteres)   |

Para generar `SESSION_SECRET`, en PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))
```

> Cualquier cambio en estas variables requiere **redeploy** desde el panel.

### 5. Bindear el KV al proyecto

En el proyecto Pages → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**:

- **Variable name**: `FINANZAS_KV`  *(exactamente este nombre, así lo lee el código)*
- **KV namespace**: `finanzas-hogar-kv`
- Guardar y **Redeploy**.

### 6. Conectar tu dominio

Proyecto Pages → **Custom domains** → **Set up a custom domain** → escribe tu dominio (ej. `finanzas.tudominio.com`).

- Si el dominio está en Cloudflare, todo se configura solo.
- Si no, añade los registros DNS que indique Cloudflare.

Listo: abre el dominio en cualquier navegador, ingresa con `FamiliaPM` / `VPM@2025`, y los datos se guardan en KV. Desde otro dispositivo, mismo login, mismos datos.

---

## Desarrollo local

Requiere [Node.js](https://nodejs.org/) y Wrangler:

```bash
npm install -g wrangler
```

1. Copia `.dev.vars.example` a `.dev.vars` y pon valores de prueba.
2. Crea (o reutiliza) un KV namespace y pega su ID en `wrangler.toml`.
3. Lanza el dev server:

```bash
wrangler pages dev .
```

Abre http://localhost:8788.

> Si solo quieres ver la UI sin backend, abre `index.html` directamente — el login fallará pero la pantalla se ve.

---

## Cambiar la contraseña

Edita el secret `AUTH_PASS` en el panel de Cloudflare Pages y haz **Retry deployment**. Las sesiones existentes seguirán activas hasta su expiración (30 días). Para forzar el cierre de sesión en todos los dispositivos, cambia también `SESSION_SECRET`.

---

## Notas técnicas

- **Sesiones**: cookie HttpOnly + Secure firmada con HMAC-SHA256. Sin base de datos de sesiones — el token se autovalida.
- **Concurrencia**: si dos dispositivos editan a la vez, gana el último que guarda (last-write-wins). Para una app familiar es suficiente.
- **Coste**: en condiciones normales (familia, decenas de operaciones por día) cabe holgadamente en el plan gratuito de Cloudflare Pages + KV.
