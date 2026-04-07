# Núcleo Hogar — Setup CMS + Build Pipeline

## Arquitectura

```
Sanity CMS (servicio publicado)
    → Webhook → GitHub repository_dispatch (cms_publish)
        → GitHub Actions: node build.js
            → Fetch services de Sanity API
            → Genera /electricista-monterrey/index.html, etc.
            → wrangler pages deploy → Cloudflare Pages
```

**Zero npm dependencies** — el build.js usa solo módulos nativos de Node (https, fs, path).

---

## Paso 1: Crear proyecto en Sanity

```bash
# Instalar Sanity CLI (si no lo tienes)
npm install -g sanity@latest

# Crear nuevo proyecto Sanity
cd nucleohogar-site/sanity
sanity init --project-name="nucleohogar" --dataset="production"
```

Esto te dará un **SANITY_PROJECT_ID** (ej: `abc123de`).

### Agregar el schema de servicios

Copia `sanity/schemas/service.js` al directorio de schemas de tu proyecto Sanity y agrégalo al `schema.js` principal:

```javascript
// sanity.config.js (o schema.js según la versión)
import service from './schemas/service'

export default defineConfig({
  // ...
  schema: {
    types: [service],
  },
})
```

### Crear token de lectura

1. Ir a [manage.sanity.io](https://manage.sanity.io)
2. Seleccionar proyecto → Settings → API → Tokens
3. Crear token con permisos de **Read** (Viewer)
4. Guardar el token — lo necesitas para GitHub Secrets

---

## Paso 2: Configurar GitHub Secrets

En el repo `Frankcuellar/nucleohogar-site` → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `SANITY_PROJECT_ID` | El ID de tu proyecto Sanity |
| `SANITY_DATASET` | `production` |
| `SANITY_TOKEN` | Token de lectura (Viewer) |
| `CLOUDFLARE_API_TOKEN` | Token de API con permisos de Pages |
| `CLOUDFLARE_ACCOUNT_ID` | `6b6ab1e7185dbfaa9893f917ad6085a6` |

**Nota:** El `CLOUDFLARE_API_TOKEN` debe tener permisos:
- Account > Cloudflare Pages > Edit
- Zone > DNS > Read (opcional)

Si ya tienes uno de ZenHome con el mismo account, puedes reutilizarlo.

---

## Paso 3: Configurar Webhook de Sanity → GitHub

Para que el build se ejecute automáticamente cuando publicas en Sanity:

1. Ir a [manage.sanity.io](https://manage.sanity.io) → tu proyecto → Settings → API → Webhooks
2. Crear webhook:
   - **Name:** Deploy nucleohogar-site
   - **URL:** `https://api.github.com/repos/Frankcuellar/nucleohogar-site/dispatches`
   - **HTTP Method:** POST
   - **HTTP Headers:**
     - `Authorization`: `Bearer TU_GITHUB_TOKEN`
     - `Content-Type`: `application/json`
   - **HTTP Body:** `{"event_type": "cms_publish"}`
   - **Filter:** Publicar solo cuando se modifica un documento de tipo `service`
   - **Trigger on:** Create, Update, Delete

### Crear GitHub Token para el webhook

1. Ir a [github.com/settings/tokens](https://github.com/settings/tokens)
2. Crear **Fine-grained token**:
   - Repository: `Frankcuellar/nucleohogar-site`
   - Permissions: Contents (Read and write)
3. Usar este token en el webhook de Sanity

---

## Paso 4: Migrar contenido existente a Sanity

Las 3 páginas de servicio actuales (electricista, minisplit, plomería) tienen todo el contenido hardcodeado en HTML. Hay que migrar ese contenido a documentos en Sanity.

### Opción A: Crear manualmente en Sanity Studio

Abrir Sanity Studio, crear 3 documentos de tipo "Servicio" y llenar los campos copiando del HTML actual.

### Opción B: Script de migración (más rápido)

Ejecutar desde la terminal con tu token de escritura:

```bash
# Necesitas un token con permisos de WRITE (Editor o Admin)
export SANITY_PROJECT_ID="tu-project-id"
export SANITY_DATASET="production"
export SANITY_WRITE_TOKEN="tu-token-de-escritura"

node migrate-content.js
```

El script `migrate-content.js` (incluido en el repo) crea los 3 documentos con todo el contenido de las páginas actuales.

---

## Paso 5: Subir imágenes a Sanity

Las imágenes actuales (Hero.png, Servicio Electrico .png, etc.) deben subirse al asset pipeline de Sanity:

1. Abrir Sanity Studio
2. En cada documento de servicio, subir la imagen del hero correspondiente
3. Sanity genera automáticamente URLs de CDN optimizadas

O programáticamente:
```bash
sanity dataset import ./images-export.ndjson production
```

---

## Paso 6: Probar el pipeline

### Test local
```bash
export SANITY_PROJECT_ID="tu-project-id"
export SANITY_DATASET="production"
export SANITY_TOKEN="tu-token-lectura"

node build.js
```

Esto genera las carpetas con `index.html` dentro de cada slug de servicio.

### Test en GitHub
```bash
cd nucleohogar-site
git add build.js .github/workflows/deploy.yml sanity/
git commit -m "feat: add Sanity CMS pipeline for service pages"
git push origin main
```

Ir a GitHub → Actions → verificar que el workflow ejecuta correctamente.

### Test del webhook
1. Abrir Sanity Studio
2. Editar y publicar un servicio
3. Verificar en GitHub → Actions que se disparó un nuevo workflow
4. Verificar en nucleohogar.com.mx que la página se actualizó

---

## Estructura de URLs generadas

| Sanity slug | URL final |
|-------------|-----------|
| `electricista-monterrey` | `nucleohogar.com.mx/electricista-monterrey/` |
| `minisplit-monterrey` | `nucleohogar.com.mx/minisplit-monterrey/` |
| `plomeria-monterrey` | `nucleohogar.com.mx/plomeria-monterrey/` |

Las URLs coinciden exactamente con los archivos HTML actuales (menos la extensión `.html`). El `_redirects` debería redirigir las URLs viejas:

```
/electricista-monterrey.html /electricista-monterrey/ 301
/minisplit-monterrey.html /minisplit-monterrey/ 301
/plomeria-monterrey.html /plomeria-monterrey/ 301
```

---

## Cómo publica el equipo de marketing

1. Abrir Sanity Studio (URL proporcionada tras el setup)
2. Click en "Servicio" → "Crear nuevo"
3. Llenar todos los campos (hero, dolores, soluciones, detalle, FAQ)
4. Activar "Publicado" → Click "Publish"
5. El webhook dispara el build automáticamente
6. En ~30 segundos la nueva página está live en nucleohogar.com.mx

**Para editar una página existente:**
1. Abrir el documento en Sanity Studio
2. Hacer los cambios
3. Click "Publish"
4. El build regenera TODAS las páginas (incluyendo internal linking actualizado)

---

## IDs de referencia

- **Cloudflare Account:** `6b6ab1e7185dbfaa9893f917ad6085a6`
- **Cloudflare Pages project:** `nucleohogar-site`
- **GitHub repo:** `Frankcuellar/nucleohogar-site`
- **Domain:** `nucleohogar.com.mx`
- **GA4:** `G-WJDX79TCKH`
- **WhatsApp:** `+52 813 907 8447` (encoded: `528139078447`)
- **Sanity Project ID:** _(se genera en el Paso 1)_
