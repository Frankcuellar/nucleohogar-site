#!/usr/bin/env node
/**
 * Núcleo Hogar — Static Site Builder
 *
 * Fetches services from Sanity CMS and generates static HTML pages
 * for Cloudflare Pages deployment.
 *
 * Architecture: Hero → Dolores → Solución → Detalle → FAQ → CTA → Otros Servicios
 *
 * Usage: node build.js
 *
 * Required env vars:
 *   SANITY_PROJECT_ID  - Your Sanity project ID
 *   SANITY_DATASET     - Dataset name (default: "production")
 *   SANITY_TOKEN       - Read token (optional for public datasets)
 *
 * Zero npm dependencies — uses only native Node modules.
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// ─── Config ───
const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET = process.env.SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_TOKEN || ''
const WA_NUMBER = '528139078447'
const DOMAIN = 'https://nucleohogar.com.mx'
const GA4_ID = 'G-WJDX79TCKH'
const BRAND = 'Núcleo Hogar'
const BRAND_TAGLINE = 'Cuidamos lo que más amas'
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-default.jpg`

if (!PROJECT_ID) {
  console.error('❌ Falta SANITY_PROJECT_ID. Configura tu archivo .env')
  process.exit(1)
}

// ─── Sanity API fetch (nativo, sin SDK) ───
function sanityFetch(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query)
    const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encoded}`
    const options = {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    }
    https.get(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            console.error('Sanity API error:', parsed.error)
            reject(new Error(parsed.error.description || parsed.error.type || 'Unknown Sanity error'))
            return
          }
          resolve(parsed.result || [])
        } catch (e) {
          console.error('Failed to parse Sanity response:', data.substring(0, 500))
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// ─── Image URL builder ───
function imageUrl(ref, width = 600) {
  if (!ref || !ref.asset || !ref.asset._ref) return ''
  const parts = ref.asset._ref.replace('image-', '').split('-')
  const id = parts.slice(0, -2).join('-')
  const dimensions = parts[parts.length - 2]
  const format = parts[parts.length - 1]
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${format}?w=${width}&auto=format`
}

// ─── Escape HTML ───
function escapeHtml(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Category labels & SEO ───
const CATEGORY_LABELS = {
  electricista: 'Electricista',
  minisplit: 'Minisplit / Aire Acondicionado',
  plomeria: 'Plomería',
  mantenimiento: 'Mantenimiento General',
  impermeabilizacion: 'Impermeabilización',
  pintura: 'Pintura',
  cerrajeria: 'Cerrajería',
}

const CATEGORY_SEO = {
  electricista: {
    keyword: 'electricista en Monterrey',
    serviceType: 'Electricista Residencial',
  },
  minisplit: {
    keyword: 'instalación de minisplit en Monterrey',
    serviceType: 'Instalación y Mantenimiento de Minisplit',
  },
  plomeria: {
    keyword: 'plomero en Monterrey',
    serviceType: 'Plomería Residencial',
  },
  mantenimiento: {
    keyword: 'mantenimiento del hogar en Monterrey',
    serviceType: 'Mantenimiento Residencial',
  },
  impermeabilizacion: {
    keyword: 'impermeabilización en Monterrey',
    serviceType: 'Impermeabilización Residencial',
  },
  pintura: {
    keyword: 'pintor en Monterrey',
    serviceType: 'Pintura Residencial',
  },
  cerrajeria: {
    keyword: 'cerrajero en Monterrey',
    serviceType: 'Cerrajería Residencial',
  },
}

// ─── SEO helpers ───
function generateSeoTitle(s) {
  const cat = CATEGORY_LABELS[s.category] || 'Servicio'
  return `${cat} en Monterrey | Servicio Residencial | ${BRAND}`
}

function generateSeoDescription(s) {
  const cat = CATEGORY_LABELS[s.category] || 'Servicio'
  return `${cat} profesional en Monterrey y área metropolitana. Técnicos puntuales, trabajo limpio y garantía por escrito. Cotización rápida por WhatsApp.`
}

// ─── WhatsApp URL helper ───
function waUrl(message) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`
}

// ─── WhatsApp SVG (reusable) ───
const WA_SVG_24 = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
const WA_SVG_18 = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
const WA_SVG_32 = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'

// ─── CSS Design System (inline) ───
const CSS = `
:root{--color-primary:#25D366;--color-primary-dark:#1DA851;--color-accent:#1B2A4A;--color-accent-warm:#D97706;--color-brand-dark:#0F1D32;--color-brand-ice:#F0F7FF;--color-text:#1a1a1a;--color-text-muted:#64748B;--color-text-on-dark:#fff;--color-bg:#fff;--color-bg-alt:#F0F7FF;--color-border:#e2e5eb;--font-family:'Inter',system-ui,-apple-system,sans-serif;--border-radius:8px;--border-radius-lg:16px;--shadow:0 2px 8px rgba(0,0,0,0.06);--shadow-lg:0 8px 24px rgba(0,0,0,0.12);--container-max:1100px;--container-padding:1.25rem}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-family);font-size:1rem;line-height:1.6;color:var(--color-text);background:var(--color-bg);-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.container{max-width:var(--container-max);margin:0 auto;padding:0 var(--container-padding)}
.site-header{padding:.75rem 0;background:var(--color-brand-dark);border-bottom:none;position:sticky;top:0;z-index:100}
.header-inner{display:flex;align-items:center;justify-content:space-between}
.header-logo{display:flex;align-items:center;gap:.6rem}
.header-logo img{height:40px;width:40px;object-fit:contain}
.header-logo-text{color:#fff;font-size:1.15rem;font-weight:700;letter-spacing:-.01em;line-height:1.1}
.header-logo-sub{display:block;font-size:.6rem;font-weight:400;color:rgba(255,255,255,.55);letter-spacing:.04em;text-transform:uppercase;margin-top:1px}
.header-nav{display:flex;align-items:center;gap:1.75rem}
.header-nav a{color:rgba(255,255,255,.85);font-size:.875rem;font-weight:500;transition:color .2s;white-space:nowrap}
.header-nav a:hover{color:#fff}
.header-cta{display:inline-flex;align-items:center;gap:.4rem;background:var(--color-primary);color:#fff;font-weight:600;font-size:.875rem;padding:.6rem 1.25rem;border-radius:var(--border-radius);transition:background .2s;white-space:nowrap}
.header-cta:hover{background:var(--color-primary-dark)}
.menu-toggle{display:none;background:none;border:none;cursor:pointer;padding:.5rem;color:#fff}
.menu-toggle svg{display:block}
@media(max-width:767px){
  .header-nav{display:none;position:absolute;top:100%;left:0;right:0;background:var(--color-brand-dark);flex-direction:column;padding:1rem var(--container-padding) 1.5rem;gap:0;border-top:1px solid rgba(255,255,255,.1);box-shadow:0 8px 24px rgba(0,0,0,.3)}
  .header-nav.open{display:flex}
  .header-nav a{padding:.75rem 0;border-bottom:1px solid rgba(255,255,255,.06);width:100%;font-size:1rem}
  .header-nav a:last-of-type{border-bottom:none}
  .header-nav .header-cta{margin-top:.5rem;width:100%;justify-content:center;padding:.75rem 1.25rem}
  .menu-toggle{display:block}
}
section h2{font-size:clamp(1.5rem,4vw,2.25rem);font-weight:700;line-height:1.2;margin-bottom:2rem;color:var(--color-accent)}
section h3{font-size:1.125rem;font-weight:600;margin-bottom:.5rem;color:var(--color-accent)}
.btn-whatsapp{display:inline-flex;align-items:center;gap:.5rem;background:var(--color-primary);color:#fff;font-weight:600;font-size:1rem;padding:.875rem 1.75rem;border-radius:var(--border-radius);transition:background .2s,transform .1s;cursor:pointer;border:none}
.btn-whatsapp:hover{background:var(--color-primary-dark)}
.btn-whatsapp:active{transform:scale(.98)}
.btn-whatsapp.btn-lg{font-size:1.125rem;padding:1rem 2rem}
.btn-whatsapp-light{background:#fff;color:var(--color-accent)}
.btn-whatsapp-light:hover{background:#f0f0f0}
.btn-whatsapp-light svg{fill:var(--color-primary)}
.btn-microcopy{font-size:clamp(0.8rem,2vw,0.875rem);color:var(--color-text-muted);margin-top:.5rem}
.btn-microcopy-light{color:rgba(255,255,255,.7)}
.whatsapp-float{position:fixed;bottom:1.5rem;right:1.5rem;width:60px;height:60px;background:var(--color-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-lg);z-index:1000;transition:transform .2s,opacity .3s}
.whatsapp-float:hover{transform:scale(1.08)}
section{padding:5rem 0}
.hero-servicio{padding:5rem 0 4rem;background:var(--color-brand-dark);color:var(--color-text-on-dark)}
.hero-servicio-grid{display:grid;gap:2.5rem;align-items:center}
.hero-servicio h1{font-size:clamp(1.75rem,4.5vw,2.5rem);font-weight:700;line-height:1.15;margin-bottom:1rem;color:#fff}
.hero-servicio .hero-tag{font-size:.8rem;font-weight:600;color:var(--color-primary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:1rem;display:inline-block;background:rgba(37,211,102,.15);padding:.3rem .75rem;border-radius:999px}
.hero-servicio .hero-subtitle{font-size:1.1rem;color:rgba(255,255,255,.8);line-height:1.5;margin-bottom:2rem;max-width:540px}
.hero-servicio-img{border-radius:var(--border-radius-lg);overflow:hidden;aspect-ratio:4/3}
.hero-servicio-img img{width:100%;height:100%;object-fit:cover}
@media(min-width:768px){.hero-servicio-grid{grid-template-columns:1fr 1fr;gap:3rem}.hero-servicio{padding:6rem 0}}
.dolores{background:var(--color-bg);padding:5rem 0}
.dolores h2{text-align:center}
.dolor-grid{display:grid;gap:1.5rem;max-width:900px;margin:0 auto}
.dolor-card{display:flex;gap:1.25rem;align-items:flex-start;background:var(--color-brand-ice);padding:1.5rem;border-radius:var(--border-radius-lg);border-left:4px solid var(--color-accent-warm)}
.dolor-icon{font-size:1.5rem;flex-shrink:0;margin-top:.1rem}
.dolor-card h3{color:var(--color-accent);font-size:1rem;margin-bottom:.35rem}
.dolor-card p{color:var(--color-text-muted);font-size:.9rem;line-height:1.5}
@media(min-width:640px){.dolor-grid{grid-template-columns:repeat(2,1fr)}}
.solucion{background:var(--color-brand-dark);color:#fff;text-align:center}
.solucion h2{color:#fff}
.solucion-intro{font-size:1.1rem;color:rgba(255,255,255,.8);max-width:700px;margin:0 auto 2.5rem}
.solucion-grid{display:grid;gap:1.25rem;max-width:900px;margin:0 auto;text-align:left}
.solucion-item{background:rgba(255,255,255,.08);padding:1.5rem;border-radius:var(--border-radius);border:1px solid rgba(255,255,255,.1)}
.solucion-item strong{display:block;color:var(--color-accent-warm);font-size:1rem;margin-bottom:.35rem}
.solucion-item p{color:rgba(255,255,255,.75);font-size:.9rem}
@media(min-width:640px){.solucion-grid{grid-template-columns:repeat(2,1fr)}}
.servicios-detalle{background:var(--color-bg)}
.servicios-detalle h2{text-align:center}
.detalle-grid{display:grid;gap:1.5rem;max-width:900px;margin:0 auto}
.detalle-card{background:var(--color-brand-ice);padding:1.75rem;border-radius:var(--border-radius-lg);border:1px solid rgba(27,42,74,.08)}
.detalle-card h3{font-size:1.05rem;color:var(--color-accent);margin-bottom:.5rem}
.detalle-card p{color:var(--color-text-muted);font-size:.9rem;line-height:1.5}
@media(min-width:640px){.detalle-grid{grid-template-columns:repeat(2,1fr)}}
.faq{background:var(--color-brand-ice)}
.faq h2{text-align:center}
.faq-list{max-width:750px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--color-border);padding:1.25rem 0}
.faq-item:first-child{border-top:1px solid var(--color-border)}
.faq-q{font-weight:600;color:var(--color-accent);font-size:1rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:1rem}
.faq-q::after{content:'+';font-size:1.25rem;flex-shrink:0;transition:transform .2s}
.faq-item.open .faq-q::after{transform:rotate(45deg)}
.faq-a{max-height:0;overflow:hidden;transition:max-height .3s ease;color:var(--color-text-muted);font-size:.9rem;line-height:1.6}
.faq-item.open .faq-a{max-height:300px;padding-top:.75rem}
.cta-final{background:#0C1829;color:var(--color-text-on-dark);text-align:center;padding:6rem 0}
.cta-final h2{color:var(--color-text-on-dark);max-width:700px;margin-left:auto;margin-right:auto}
.cta-final p{color:rgba(255,255,255,.8);font-size:1.1rem;max-width:550px;margin:0 auto 2rem}
.otros-servicios{background:var(--color-bg);text-align:center}
.otros-grid{display:grid;gap:1.25rem;max-width:700px;margin:0 auto}
.otro-card{background:var(--color-brand-ice);padding:1.5rem;border-radius:var(--border-radius-lg);border:1px solid rgba(27,42,74,.08);transition:box-shadow .2s}
.otro-card:hover{box-shadow:var(--shadow)}
.otro-card h3{margin-bottom:.35rem}
.otro-card p{color:var(--color-text-muted);font-size:.9rem}
@media(min-width:640px){.otros-grid{grid-template-columns:repeat(2,1fr)}}
footer{background:#0C1829;color:rgba(255,255,255,.6);text-align:center;padding:2rem 0;font-size:.875rem}
.footer-logo{height:50px;width:auto;margin:0 auto 1rem}
.footer-location{margin-bottom:.75rem}
.footer-legal{margin-bottom:.5rem}
.footer-legal a{color:rgba(255,255,255,.75);text-decoration:underline}
.footer-legal a:hover{color:#fff}
.footer-copy{font-size:.8rem;color:rgba(255,255,255,.35)}
.breadcrumb{padding:.75rem 0;background:rgba(15,29,50,.05);font-size:.8rem}
.breadcrumb a{color:var(--color-primary-dark);text-decoration:underline}
.breadcrumb span{color:var(--color-text-muted)}
.fade-in{opacity:0;transform:translateY(20px);transition:opacity .5s,transform .5s}
.fade-in.visible{opacity:1;transform:translateY(0)}
.alerta-peligro{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:var(--border-radius-lg);padding:1.5rem;text-align:center;max-width:750px;margin:2.5rem auto 0}
.alerta-peligro strong{color:#DC2626;display:block;margin-bottom:.35rem}
.alerta-peligro p{color:#7F1D1D;font-size:.9rem}
@media(max-width:767px){
  section{padding:4rem 0}
  .hero-servicio{padding:4rem 0 3.5rem}
  .hero-servicio-grid{text-align:center}
  .hero-servicio .hero-subtitle{margin-left:auto;margin-right:auto}
  .btn-whatsapp.btn-lg{width:100%;justify-content:center}
  .header-logo img{height:34px;width:34px}
  .header-logo-text{font-size:1rem}
  .header-logo-sub{font-size:.55rem}
  .hero-servicio-img{aspect-ratio:16/9}
  .dolor-grid{grid-template-columns:1fr}
  .solucion-grid{grid-template-columns:1fr}
  .detalle-grid{grid-template-columns:1fr}
  .otros-grid{grid-template-columns:1fr}
}
@media(max-width:400px){:root{--container-padding:1rem}}
`

// ─── Service page template ───
function servicePageHtml(s, otherServices) {
  const slug = s.slug?.current || ''
  const seoTitle = escapeHtml(s.seoTitle || generateSeoTitle(s))
  const seoDesc = escapeHtml(s.seoDescription || generateSeoDescription(s))
  const seoKeywords = s.seoKeywords ? `\n  <meta name="keywords" content="${escapeHtml(s.seoKeywords)}">` : ''
  const heroImg = imageUrl(s.heroImage, 800)
  const socialImage = imageUrl(s.heroImage, 1200) || DEFAULT_OG_IMAGE
  const heroImgTag = heroImg
    ? `<div class="hero-servicio-img"><img src="${heroImg}" alt="${escapeHtml(s.title)} — técnico profesional de ${BRAND} en Monterrey"></div>`
    : ''

  // WhatsApp messages (3 CTAs diferenciados)
  const waHero = waUrl(s.heroWaMessage || `Hola, necesito ${(CATEGORY_LABELS[s.category] || 'un servicio').toLowerCase()} en Monterrey`)
  const waMid = waUrl(s.midWaMessage || `Hola, estoy viendo su página de ${escapeHtml(s.title)} y me interesa una cotización`)
  const waClose = waUrl(s.ctaWaMessage || `Hola, necesito ${(CATEGORY_LABELS[s.category] || 'un servicio').toLowerCase()} en Monterrey. ¿Pueden ayudarme?`)

  // Pain points
  const painPointsHtml = (s.painPoints || []).map(p => `
        <div class="dolor-card">
          <span class="dolor-icon">${escapeHtml(p.icon || '⚠️')}</span>
          <div>
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.description)}</p>
          </div>
        </div>`).join('')

  // Danger alert
  const dangerHtml = s.dangerAlert?.title ? `
      <div class="alerta-peligro">
        <strong>${escapeHtml(s.dangerAlert.title)}</strong>
        <p>${escapeHtml(s.dangerAlert.text)}</p>
      </div>` : ''

  // Solutions
  const solutionsHtml = (s.solutions || []).map(sol => `
        <div class="solucion-item">
          <strong>${escapeHtml(sol.title)}</strong>
          <p>${escapeHtml(sol.description)}</p>
        </div>`).join('')

  // Service details
  const detailsHtml = (s.serviceDetails || []).map(d => `
        <div class="detalle-card">
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.description)}</p>
        </div>`).join('')

  // FAQs
  const faqsHtml = (s.faqs || []).map(f => `
        <div class="faq-item">
          <div class="faq-q" onclick="this.parentElement.classList.toggle('open')">${escapeHtml(f.question)}</div>
          <div class="faq-a">${escapeHtml(f.answer)}</div>
        </div>`).join('')

  // FAQ JSON-LD
  const faqSchema = (s.faqs || []).length > 0 ? `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[${(s.faqs || []).map(f =>
    `{"@type":"Question","name":"${escapeHtml(f.question)}","acceptedAnswer":{"@type":"Answer","text":"${escapeHtml(f.answer)}"}}`
  ).join(',')}]}
  </script>` : ''

  // Service JSON-LD
  const catSeo = CATEGORY_SEO[s.category] || { keyword: s.title, serviceType: s.title }
  const serviceSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Service","name":"${escapeHtml(s.title)}","description":"${seoDesc}","provider":{"@type":"HomeAndConstructionBusiness","name":"${BRAND}","url":"${DOMAIN}","telephone":"+${WA_NUMBER}","areaServed":{"@type":"City","name":"Monterrey"},"address":{"@type":"PostalAddress","addressLocality":"Monterrey","addressRegion":"Nuevo León","addressCountry":"MX"}},"serviceType":"${escapeHtml(catSeo.serviceType)}","areaServed":{"@type":"City","name":"Monterrey"}}
  </script>`

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"${DOMAIN}/"},{"@type":"ListItem","position":2,"name":"${escapeHtml(s.title)}"}]}
  </script>`

  // Other services (internal linking)
  const otherServicesHtml = otherServices
    .filter(o => o._id !== s._id)
    .map(o => {
      const oSlug = o.slug?.current || ''
      const oCat = CATEGORY_LABELS[o.category] || o.title
      return `
        <a href="/${oSlug}/" class="otro-card">
          <h3>${escapeHtml(oCat)} en Monterrey</h3>
          <p>${escapeHtml(o.heroSubtitle || generateSeoDescription(o)).substring(0, 100)}</p>
        </a>`
    }).join('')

  // Nav links (all published services)
  const navLinks = otherServices.map(o => {
    const oSlug = o.slug?.current || ''
    const active = o._id === s._id ? ' style="color:#fff"' : ''
    return `<a href="/${oSlug}/"${active}>${escapeHtml(CATEGORY_LABELS[o.category] || o.title)}</a>`
  }).join('\n        ')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_ID}');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${seoTitle}</title>
  <meta name="description" content="${seoDesc}">${seoKeywords}
  <link rel="canonical" href="${DOMAIN}/${slug}/">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  ${heroImg ? `<link rel="preload" as="image" href="${heroImg}" fetchpriority="high">` : ''}
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${seoDesc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${DOMAIN}/${slug}/">
  <meta property="og:locale" content="es_MX">
  <meta property="og:site_name" content="${BRAND}">
  <meta property="og:image" content="${socialImage}">
  <meta property="og:image:secure_url" content="${socialImage}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${seoTitle}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDesc}">
  <meta name="twitter:image" content="${socialImage}">
  <meta name="twitter:image:alt" content="${seoTitle}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="header-logo">
        <img src="/Logo%20Blanco.png" alt="${BRAND}">
        <span class="header-logo-text">${BRAND}<span class="header-logo-sub">${BRAND_TAGLINE}</span></span>
      </a>
      <button class="menu-toggle" aria-label="Abrir menú" onclick="document.querySelector('.header-nav').classList.toggle('open')">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <nav class="header-nav">
        <a href="/">Inicio</a>
        ${navLinks}
        <a href="${waUrl('Hola, necesito ayuda con un servicio del hogar')}" class="header-cta" target="_blank" rel="noopener">
          ${WA_SVG_18}
          Escríbenos
        </a>
      </nav>
    </div>
  </header>

  <div class="breadcrumb">
    <div class="container">
      <a href="/">Inicio</a> <span>&rsaquo; ${escapeHtml(s.title)}</span>
    </div>
  </div>

  <!-- HERO -->
  <section class="hero-servicio">
    <div class="container">
      <div class="hero-servicio-grid">
        <div>
          <span class="hero-tag">${escapeHtml(s.heroTag || s.title)}</span>
          <h1>${escapeHtml(s.heroTitle || s.title)}</h1>
          ${s.heroSubtitle ? `<p class="hero-subtitle">${escapeHtml(s.heroSubtitle)}</p>` : ''}
          <a href="${waHero}" class="btn-whatsapp btn-lg" target="_blank" rel="noopener" onclick="gtag('event','click',{event_category:'CTA',event_label:'hero_cta_${slug}'})">
            ${WA_SVG_24}
            ${escapeHtml(s.heroCta || 'Pedir cotización por WhatsApp')}
          </a>
          <p class="btn-microcopy btn-microcopy-light">Respondemos rápido · Sin compromiso</p>
        </div>
        ${heroImgTag}
      </div>
    </div>
  </section>

  ${painPointsHtml ? `<!-- DOLORES -->
  <section class="dolores">
    <div class="container">
      <h2>${escapeHtml(s.painSectionTitle || 'Problemas que no deberías ignorar')}</h2>
      <div class="dolor-grid">${painPointsHtml}
      </div>${dangerHtml}
    </div>
  </section>` : ''}

  ${solutionsHtml ? `<!-- SOLUCIÓN -->
  <section class="solucion">
    <div class="container">
      <h2>${escapeHtml(s.solutionSectionTitle || 'Cómo lo resolvemos')}</h2>
      ${s.solutionIntro ? `<p class="solucion-intro">${escapeHtml(s.solutionIntro)}</p>` : ''}
      <div class="solucion-grid">${solutionsHtml}
      </div>
      <div style="margin-top:2.5rem">
        <a href="${waMid}" class="btn-whatsapp btn-lg" target="_blank" rel="noopener" onclick="gtag('event','click',{event_category:'CTA',event_label:'mid_cta_${slug}'})">
          ${WA_SVG_24}
          Cotización rápida por WhatsApp
        </a>
        <p class="btn-microcopy btn-microcopy-light">Le respondemos en minutos · Sin compromiso</p>
      </div>
    </div>
  </section>` : ''}

  ${detailsHtml ? `<!-- SERVICIOS DETALLE -->
  <section class="servicios-detalle">
    <div class="container">
      <h2>${escapeHtml(s.detailSectionTitle || `Servicios de ${CATEGORY_LABELS[s.category] || ''} en Monterrey`)}</h2>
      <div class="detalle-grid">${detailsHtml}
      </div>
    </div>
  </section>` : ''}

  ${faqsHtml ? `<!-- FAQ -->
  <section class="faq">
    <div class="container">
      <h2>${escapeHtml(s.faqSectionTitle || 'Preguntas frecuentes')}</h2>
      <div class="faq-list">${faqsHtml}
      </div>
    </div>
  </section>` : ''}

  <!-- CTA FINAL -->
  <section class="cta-final">
    <div class="container">
      <h2>${escapeHtml(s.ctaTitle || 'No espere más — resolvemos hoy')}</h2>
      <p>${escapeHtml(s.ctaSubtitle || 'Escríbanos hoy, cuéntenos qué pasa en su casa y reciba una cotización aproximada por mensaje.')}</p>
      <a href="${waClose}" class="btn-whatsapp btn-lg btn-whatsapp-light" target="_blank" rel="noopener" onclick="gtag('event','click',{event_category:'CTA',event_label:'footer_cta_${slug}'})">
        ${WA_SVG_24}
        Escribir por WhatsApp ahora
      </a>
      <p class="btn-microcopy btn-microcopy-light">Respuesta rápida · Sin compromiso</p>
    </div>
  </section>

  ${otherServicesHtml ? `<!-- OTROS SERVICIOS -->
  <section class="otros-servicios">
    <div class="container">
      <h2>También resolvemos esto en su hogar</h2>
      <div class="otros-grid">${otherServicesHtml}
      </div>
    </div>
  </section>` : ''}

  <footer>
    <div class="container">
      <img src="/Logo%20Blanco.png" alt="${BRAND} — ${BRAND_TAGLINE}" class="footer-logo">
      <p class="footer-location">Monterrey, Nuevo León y área metropolitana</p>
      <p class="footer-legal"><a href="/aviso-de-privacidad/">Aviso de privacidad</a></p>
      <p class="footer-copy">&copy; ${new Date().getFullYear()} ${BRAND}. Todos los derechos reservados.</p>
    </div>
  </footer>

  <a href="${waHero}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp">
    ${WA_SVG_32}
  </a>

  <script>
document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var nav=document.querySelector('.header-nav');if(nav)nav.classList.remove('open');var t=document.querySelector(this.getAttribute('href'));if(t)t.scrollIntoView({behavior:'smooth',block:'start'});});});
var f=document.querySelector('.whatsapp-float'),h=document.querySelector('.hero-servicio');
if(f&&h){var o=new IntersectionObserver(function(e){var v=e[0].isIntersecting;f.style.opacity=v?'0':'1';f.style.pointerEvents=v?'none':'auto';},{threshold:0.3});o.observe(h);}
var secs=document.querySelectorAll('.dolores,.solucion,.servicios-detalle,.faq,.cta-final,.otros-servicios');
if('IntersectionObserver' in window){var so=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('visible');so.unobserve(x.target);}});},{threshold:0.1,rootMargin:'0px 0px -50px 0px'});secs.forEach(function(x){x.classList.add('fade-in');so.observe(x);});}
  </script>

  ${faqSchema}
  ${serviceSchema}
  ${breadcrumbSchema}
</body>
</html>`
}

// ─── Sitemap generator ───
function generateSitemap(services) {
  const now = new Date().toISOString().split('T')[0]
  const urls = [
    `  <url><loc>${DOMAIN}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${now}</lastmod></url>`,
    ...services.map(s => {
      const slug = s.slug?.current || ''
      return `  <url><loc>${DOMAIN}/${slug}/</loc><changefreq>weekly</changefreq><priority>0.8</priority><lastmod>${now}</lastmod></url>`
    }),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

// ─── Main build ───
async function main() {
  console.log(`🔨 Building ${BRAND} service pages from Sanity...`)
  console.log(`   Project: ${PROJECT_ID} | Dataset: ${DATASET}`)

  // Fetch all published services
  const query = `*[_type == "service" && published == true] | order(sortOrder asc, title asc)`
  const services = await sanityFetch(query)
  console.log(`📦 Found ${services.length} published services`)

  if (services.length === 0) {
    console.log('⚠️  No published services found. Skipping page generation.')
    console.log('   The existing static pages (index.html, etc.) will still be deployed.')
    return
  }

  // Generate each service page
  for (const service of services) {
    const slug = service.slug?.current
    if (!slug) {
      console.warn(`⚠️  Service "${service.title}" has no slug — skipping`)
      continue
    }

    const dir = path.resolve(__dirname, slug)
    fs.mkdirSync(dir, { recursive: true })

    const html = servicePageHtml(service, services)
    const filePath = path.join(dir, 'index.html')
    fs.writeFileSync(filePath, html, 'utf8')
    console.log(`  ✅ /${slug}/index.html`)
  }

  // Update sitemap
  const sitemapPath = path.resolve(__dirname, 'sitemap.xml')
  fs.writeFileSync(sitemapPath, generateSitemap(services), 'utf8')
  console.log(`  ✅ sitemap.xml (${services.length + 1} URLs)`)

  console.log(`\n🎉 Build complete! ${services.length} service pages generated.`)
}

main().catch((err) => {
  console.error('💥 Build failed:', err)
  process.exit(1)
})
