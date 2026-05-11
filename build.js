#!/usr/bin/env node
/**
 * Núcleo Hogar — Static Site Builder (v2 — diseño navy/gold/paper)
 *
 * Genera /<slug>/index.html para cada servicio publicado en Sanity.
 * Mismo lenguaje visual que el home: Plus Jakarta Sans + Inter, paleta navy + gold + paper,
 * con secciones: Breadcrumb → Hero → Pain → Why → Detalles → Cases → FAQ → Final CTA → Otros servicios.
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

const CATEGORY_ICONS = {
  electricista: 'ico-bolt',
  minisplit: 'ico-snow',
  plomeria: 'ico-drop',
  mantenimiento: 'ico-wrench',
  impermeabilizacion: 'ico-shield',
  pintura: 'ico-wrench',
  cerrajeria: 'ico-shield',
}

const CATEGORY_SEO = {
  electricista: { keyword: 'electricista en Monterrey', serviceType: 'Electricista Residencial' },
  minisplit: { keyword: 'instalación de minisplit en Monterrey', serviceType: 'Instalación y Mantenimiento de Minisplit' },
  plomeria: { keyword: 'plomero en Monterrey', serviceType: 'Plomería Residencial' },
  mantenimiento: { keyword: 'mantenimiento del hogar en Monterrey', serviceType: 'Mantenimiento Residencial' },
  impermeabilizacion: { keyword: 'impermeabilización en Monterrey', serviceType: 'Impermeabilización Residencial' },
  pintura: { keyword: 'pintor en Monterrey', serviceType: 'Pintura Residencial' },
  cerrajeria: { keyword: 'cerrajero en Monterrey', serviceType: 'Cerrajería Residencial' },
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

// ─── CSS Design System (mismo lenguaje que el home) ───
const CSS = `
:root{
  --navy:#0F2545;--navy-2:#1B3A6B;--navy-3:#2A5298;--navy-soft:#3a5784;
  --gold:#C9A961;--gold-soft:#E4D4A8;--gold-deep:#a8884a;
  --ink:#0a1628;--body:#3a3f4a;--body-2:#5a6271;--muted:#8a8478;
  --paper:#F7F4EE;--paper-2:#EFEADD;--paper-3:#E6DFCE;
  --line:#e1dbc9;--line-2:#c8bfa9;
  --wa:#25D366;--wa-d:#128C7E;
  --display:'Plus Jakarta Sans',system-ui,sans-serif;
  --body-font:'Inter',system-ui,sans-serif;
  --r-sm:10px;--r:16px;--r-lg:24px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--body-font);background:var(--paper);color:var(--body);-webkit-font-smoothing:antialiased;font-size:16px;line-height:1.6}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}
button{font-family:inherit}
.container{max-width:1240px;margin:0 auto;padding:0 28px}
h1,h2,h3,h4,h5{font-family:var(--display);color:var(--navy);margin:0;font-weight:700;letter-spacing:-0.022em;line-height:1.08}
h1{font-size:clamp(32px,4.6vw,54px);letter-spacing:-0.03em;line-height:1.05}
h2{font-size:clamp(26px,3.2vw,40px);letter-spacing:-0.025em;line-height:1.08}
h3{font-size:clamp(19px,2vw,24px);letter-spacing:-0.02em}
h4{font-size:17px;letter-spacing:-0.01em;font-weight:600}
p{margin:0}
.lead{font-size:17px;line-height:1.6;color:var(--body)}
.eyebrow{font-family:var(--display);font-weight:600;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:var(--navy-soft);display:inline-flex;align-items:center}
.eyebrow .dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--gold);margin-right:10px;vertical-align:middle}
.eyebrow.gold{color:var(--gold-deep)}
.eyebrow.light{color:var(--gold-soft)}
.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:999px;font-family:var(--display);font-weight:600;font-size:14.5px;text-decoration:none;border:none;cursor:pointer;transition:transform .15s ease,box-shadow .2s ease,background .2s ease,color .2s ease}
.btn:hover{transform:translateY(-1px)}
.btn-wa{background:var(--wa);color:#fff;box-shadow:0 10px 24px -10px rgba(18,140,126,0.5)}
.btn-wa:hover{background:var(--wa-d);box-shadow:0 14px 28px -12px rgba(18,140,126,0.65)}
.btn-navy{background:var(--navy);color:#fff}
.btn-navy:hover{background:var(--navy-2)}
.btn-ghost{background:transparent;color:var(--navy);border:1.5px solid var(--navy)}
.btn-ghost:hover{background:var(--navy);color:#fff}
.btn-link{font-family:var(--display);color:var(--navy);font-weight:600;font-size:13.5px;border-bottom:1.5px solid var(--gold);padding-bottom:2px;display:inline-flex;align-items:center;gap:6px}
.btn-link:hover{color:var(--navy-2);border-color:var(--navy-2)}
.btn .ico-wa,.btn-link .ico-arrow{width:18px;height:18px;fill:currentColor}
.btn-link .ico-arrow{stroke:currentColor;fill:none;stroke-width:2;width:14px;height:14px}
.btn-microcopy{font-size:13px;color:var(--body-2);margin-top:14px}
.btn-microcopy-light{color:rgba(255,255,255,0.6)}

header.nav{position:sticky;top:0;z-index:50;background:rgba(247,244,238,0.92);backdrop-filter:saturate(140%) blur(14px);-webkit-backdrop-filter:saturate(140%) blur(14px);border-bottom:1px solid var(--line)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;padding:14px 0;gap:24px}
.brand{display:flex;align-items:center;text-decoration:none}
.brand img.brand-logo{height:52px;width:auto;display:block}
nav.links{display:flex;gap:28px;align-items:center}
nav.links a{color:var(--navy);font-size:14px;font-weight:500;font-family:var(--display);position:relative}
nav.links a:hover{color:var(--navy-2)}
nav.links a:after{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform .25s ease}
nav.links a:hover:after{transform:scaleX(1)}
.menu-toggle{display:none;background:none;border:none;cursor:pointer;padding:.5rem;color:var(--navy)}

.breadcrumb{background:var(--paper-2);font-size:12.5px;font-family:var(--display);font-weight:500;color:var(--navy-soft);padding:14px 0;border-bottom:1px solid var(--line)}
.breadcrumb a{color:var(--navy-2);text-decoration:underline;text-decoration-color:var(--gold)}
.breadcrumb a:hover{color:var(--navy)}

section.hero{padding:72px 0 88px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;right:-15%;top:-25%;width:55%;height:85%;background:radial-gradient(closest-side,rgba(201,169,97,0.18),transparent 70%);pointer-events:none}
.hero-grid{display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center}
.hero .eyebrow{margin-bottom:18px}
.hero h1 em{font-style:normal;color:var(--navy-2);position:relative;display:inline-block}
.hero h1 em::after{content:"";position:absolute;left:-2%;right:-2%;bottom:0.06em;height:0.18em;background:var(--gold);opacity:0.55;z-index:-1;border-radius:2px}
.hero .lead{margin:24px 0 30px;max-width:540px;color:var(--body)}
.hero .ctas{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.hero-visual{position:relative;height:480px;border-radius:var(--r-lg);overflow:hidden;border:1px solid var(--line);box-shadow:0 30px 60px -28px rgba(15,37,69,0.22)}
.hero-visual img{width:100%;height:100%;object-fit:cover}
.hero-visual .badge{position:absolute;left:18px;bottom:18px;background:#fff;border-radius:var(--r);padding:14px 18px;box-shadow:0 26px 50px -22px rgba(15,37,69,0.28);display:flex;align-items:center;gap:12px;border:1px solid var(--line);max-width:78%}
.hero-visual .badge .wa-ico{width:40px;height:40px;border-radius:50%;background:var(--wa);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.hero-visual .badge .wa-ico svg{width:20px;height:20px;fill:#fff}
.hero-visual .badge b{font-size:13.5px;color:var(--navy);display:block;font-weight:600;font-family:var(--display)}
.hero-visual .badge span{font-size:11.5px;color:var(--body-2)}
.hero .trust-row{display:flex;gap:32px;margin-top:40px;padding-top:28px;border-top:1px solid var(--line);max-width:580px;flex-wrap:wrap}
.hero .trust-row .t{display:flex;flex-direction:column;gap:4px}
.hero .trust-row .t b{font-family:var(--display);font-weight:700;color:var(--navy);font-size:22px;line-height:1;letter-spacing:-0.02em}
.hero .trust-row .t span{font-size:12.5px;color:var(--body-2)}

section.pain{background:var(--navy);color:#e9eef7;padding:80px 0;position:relative;overflow:hidden}
section.pain::before{content:"";position:absolute;left:-15%;top:-20%;width:60%;height:120%;background:radial-gradient(closest-side,rgba(201,169,97,0.14),transparent 70%);pointer-events:none}
.pain-head{max-width:760px;position:relative;margin-bottom:40px}
section.pain h2{color:#fff;margin-top:14px}
section.pain .lead{color:rgba(255,255,255,0.78);margin-top:18px;font-size:16.5px}
.pain-bullets{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.pain-bullet{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:var(--r);padding:22px 20px;display:flex;flex-direction:column;gap:10px;transition:background .25s ease,border-color .25s ease,transform .2s ease}
.pain-bullet:hover{background:rgba(255,255,255,0.06);border-color:rgba(201,169,97,0.4);transform:translateY(-2px)}
.pain-bullet .ico{width:36px;height:36px;border-radius:10px;background:rgba(201,169,97,0.14);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:18px}
.pain-bullet b{font-family:var(--display);color:#fff;font-size:15px;font-weight:600;line-height:1.3}
.pain-bullet span{font-size:13px;color:rgba(255,255,255,0.7);line-height:1.55}
.alerta-peligro{margin-top:32px;padding:18px 22px;background:rgba(201,169,97,0.1);border:1px solid rgba(201,169,97,0.35);border-radius:var(--r);color:#fff}
.alerta-peligro strong{color:var(--gold-soft);display:block;margin-bottom:4px;font-family:var(--display);font-size:14px;letter-spacing:0.04em;text-transform:uppercase}
.alerta-peligro p{color:rgba(255,255,255,0.85);font-size:14px;line-height:1.5}

section.solucion{padding:88px 0;background:var(--paper)}
.solucion-grid{display:grid;grid-template-columns:1fr 1.3fr;gap:48px;align-items:start;margin-top:36px}
.solucion-visual{background:linear-gradient(135deg,var(--navy),var(--navy-2));border-radius:var(--r-lg);padding:40px;color:#fff;position:relative;overflow:hidden;min-height:380px;display:flex;flex-direction:column;justify-content:space-between}
.solucion-visual::before{content:"";position:absolute;right:-30%;top:-30%;width:80%;height:80%;background:radial-gradient(closest-side,rgba(201,169,97,0.25),transparent 70%)}
.solucion-visual .quote-big{font-family:var(--display);font-weight:600;font-size:25px;line-height:1.25;color:#fff;position:relative;margin-top:18px}
.solucion-visual .quote-big .gold{color:var(--gold-soft)}
.solucion-visual .stats{margin-top:24px;display:flex;gap:18px;flex-wrap:wrap;position:relative}
.solucion-visual .stats .stat b{display:block;font-family:var(--display);font-weight:800;font-size:26px;color:var(--gold-soft);line-height:1}
.solucion-visual .stats .stat span{font-size:11.5px;color:rgba(255,255,255,0.7);margin-top:4px;display:block}
.solucion-points{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:0}
.sol-point{display:flex;gap:14px;align-items:start;padding:18px 0;border-top:1px solid var(--line)}
.sol-point .check{width:32px;height:32px;border-radius:50%;background:rgba(201,169,97,0.15);color:var(--gold-deep);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:700}
.sol-point b{font-family:var(--display);font-size:15px;color:var(--navy);display:block;font-weight:600;margin-bottom:3px}
.sol-point span{font-size:13.5px;color:var(--body);line-height:1.55}

section.detalles{padding:88px 0;background:var(--paper-2)}
.section-head{display:flex;justify-content:space-between;align-items:end;gap:36px;margin-bottom:40px;flex-wrap:wrap}
.section-head .left{max-width:680px}
.section-head .left .eyebrow{margin-bottom:16px}
.section-head .left p{margin-top:14px;font-size:16px;color:var(--body);max-width:580px;line-height:1.6}
.detalle-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.detalle-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:24px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s ease,transform .2s ease}
.detalle-card:hover{border-color:var(--line-2);transform:translateY(-2px)}
.detalle-card h3{font-size:18px;color:var(--navy);font-family:var(--display);font-weight:700}
.detalle-card p{color:var(--body);font-size:14px;line-height:1.6}

section.cases{padding:88px 0;background:var(--paper)}
.case-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.case-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:22px;display:flex;flex-direction:column;gap:14px;transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease;text-decoration:none;color:inherit}
.case-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 18px 32px -20px rgba(15,37,69,0.16)}
.case-card .ico-mini{width:36px;height:36px;border-radius:10px;background:var(--paper-2);color:var(--navy);display:flex;align-items:center;justify-content:center}
.case-card .ico-mini svg{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.8}
.case-card .q{font-family:var(--display);font-weight:600;font-size:15.5px;color:var(--navy);line-height:1.35}
.case-card .arrow{margin-top:auto;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--navy);font-weight:600;font-family:var(--display)}

section.faq{padding:88px 0;background:var(--paper-2)}
.faq-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:48px}
details.faq-item{border-top:1px solid var(--line);padding:20px 0}
details.faq-item:last-child{border-bottom:1px solid var(--line)}
details.faq-item summary{list-style:none;display:flex;justify-content:space-between;align-items:center;gap:24px;font-family:var(--display);font-weight:600;font-size:17px;color:var(--navy);line-height:1.35;cursor:pointer}
details.faq-item summary::-webkit-details-marker{display:none}
details.faq-item summary .plus{width:28px;height:28px;border-radius:50%;background:var(--paper);color:var(--navy);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;transition:transform .25s ease,background .2s ease}
details.faq-item[open] summary .plus{transform:rotate(45deg);background:var(--gold);color:#fff}
details.faq-item p{margin:14px 0 0;font-size:14.5px;color:var(--body);line-height:1.65;padding-right:32px}

section.final-cta{padding:96px 0;background:var(--navy);color:#fff;text-align:center;position:relative;overflow:hidden}
section.final-cta::before{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:85%;height:140%;background:radial-gradient(closest-side,rgba(201,169,97,0.18),transparent 70%)}
.final-cta-inner{position:relative;max-width:780px;margin:0 auto;padding:0 24px}
.final-cta-logo{height:74px;width:auto;margin:0 auto 22px;opacity:.98}
.final-cta h2{color:#fff;font-size:clamp(30px,4.2vw,48px)}
.final-cta p{font-size:17px;color:rgba(255,255,255,0.78);margin:22px auto 28px;max-width:520px;line-height:1.6}
.final-cta .small{margin-top:22px;font-size:12.5px;color:rgba(255,255,255,0.5);letter-spacing:0.04em}

section.otros{padding:80px 0;background:var(--paper)}
.otros-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:32px}
.otro-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:24px;display:flex;gap:16px;align-items:start;text-decoration:none;color:inherit;transition:border-color .2s ease,transform .2s ease}
.otro-card:hover{border-color:var(--line-2);transform:translateY(-2px)}
.otro-card .ico-sm{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,var(--paper-2),var(--paper-3));color:var(--navy);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.otro-card .ico-sm svg{width:24px;height:24px;stroke:currentColor;fill:none;stroke-width:1.6}
.otro-card h3{font-size:18px;margin-bottom:6px}
.otro-card p{color:var(--body);font-size:13.5px;line-height:1.5}

footer.site{padding:60px 0 26px;background:#0a1830;color:rgba(255,255,255,0.7);font-size:14px}
.footer-grid{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:40px}
.footer-brand{display:flex;flex-direction:column;gap:18px;max-width:340px}
.footer-brand img.footer-logo{height:62px;width:auto;display:block}
.footer-brand p{margin:0;color:rgba(255,255,255,0.6);font-size:13.5px;line-height:1.6}
footer.site h5{font-family:var(--display);color:#fff;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;margin:0 0 14px;font-weight:600}
footer.site ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px}
footer.site ul li a{color:rgba(255,255,255,0.7);font-size:13.5px}
footer.site ul li a:hover{color:var(--gold-soft)}
.footer-bottom{margin-top:44px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;font-size:12px;color:rgba(255,255,255,0.45)}

.wa-float{position:fixed;right:24px;bottom:24px;z-index:80;background:var(--wa);color:#fff;border-radius:999px;padding:14px 22px 14px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 14px 28px -12px rgba(18,140,126,0.55);text-decoration:none;font-weight:600;font-size:14px;font-family:var(--display);transition:opacity .3s,transform .2s ease}
.wa-float:hover{transform:translateY(-2px)}
.wa-float svg{width:24px;height:24px;fill:#fff}
.wa-float.hidden{opacity:0;pointer-events:none}

@media (max-width:1100px){.pain-bullets{grid-template-columns:repeat(2,1fr)}.case-grid{grid-template-columns:repeat(2,1fr)}.detalle-grid{grid-template-columns:1fr}}
@media (max-width:1024px){.hero-grid{grid-template-columns:1fr;gap:36px}.hero-visual{height:340px}.solucion-grid,.faq-grid{grid-template-columns:1fr;gap:32px}.solucion-points{grid-template-columns:1fr}.footer-grid{grid-template-columns:1fr 1fr;gap:32px}.otros-grid{grid-template-columns:1fr}}
@media (max-width:767px){
  .container{padding:0 20px}
  nav.links{display:none;position:absolute;top:100%;left:0;right:0;background:var(--paper);flex-direction:column;padding:18px 20px 22px;gap:0;border-top:1px solid var(--line);box-shadow:0 12px 28px rgba(15,37,69,0.12)}
  nav.links.open{display:flex}
  nav.links a{padding:14px 0;border-bottom:1px solid var(--line);width:100%;font-size:15px}
  nav.links a:last-of-type{border-bottom:none}
  nav.links a:after{display:none}
  .menu-toggle{display:block}
  .nav-cta-desktop{display:none}
  .hero{padding:40px 0 56px}
  .pain-bullets{grid-template-columns:1fr}
  .case-grid{grid-template-columns:1fr}
  section.pain,section.solucion,section.detalles,section.faq,section.cases,section.otros{padding:56px 0}
  section.final-cta{padding:64px 0}
  .wa-float span{display:none}
  .wa-float{padding:14px;border-radius:50%}
  .brand img.brand-logo{height:44px}
  .footer-brand img.footer-logo{height:54px}
}
`

// ─── SVG sprite (compartido) ───
const SVG_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="ico-wa" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></symbol>
    <symbol id="ico-bolt" viewBox="0 0 24 24"><path d="M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z" stroke-linejoin="round"/></symbol>
    <symbol id="ico-snow" viewBox="0 0 24 24"><path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" stroke-linecap="round"/></symbol>
    <symbol id="ico-drop" viewBox="0 0 24 24"><path d="M12 2 C 12 2, 4 12, 4 16 a8 8 0 0 0 16 0 C 20 12, 12 2, 12 2 Z" stroke-linejoin="round"/></symbol>
    <symbol id="ico-wrench" viewBox="0 0 24 24"><path d="M14.7 6.3a4.5 4.5 0 0 1 6 6L19 14l-9 9-3-3 9-9 1.7-1.7Z M5 19l3 3" stroke-linejoin="round"/></symbol>
    <symbol id="ico-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="ico-check" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="ico-chat" viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3-6.2L21 4l-1 4.2A8 8 0 0 1 21 12Z" stroke-linejoin="round"/></symbol>
    <symbol id="ico-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" stroke-linecap="round"/></symbol>
    <symbol id="ico-shield" viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 4 9 8 10 4-1 8-5 8-10V5l-8-3Z M9 12l2 2 4-4" stroke-linejoin="round" stroke-linecap="round"/></symbol>
    <symbol id="ico-home" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v10a2 2 0 0 1-2 2h-3v-7H8v7H5a2 2 0 0 1-2-2V11Z" stroke-linejoin="round"/></symbol>
  </defs>
</svg>
`

const WA_BTN_HTML = '<svg class="ico-wa"><use href="#ico-wa"/></svg>'

// ─── Service page template ───
function servicePageHtml(s, otherServices) {
  const slug = s.slug?.current || ''
  const seoTitle = escapeHtml(s.seoTitle || generateSeoTitle(s))
  const seoDesc = escapeHtml(s.seoDescription || generateSeoDescription(s))
  const seoKeywords = s.seoKeywords ? `\n  <meta name="keywords" content="${escapeHtml(s.seoKeywords)}">` : ''
  const heroImg = imageUrl(s.heroImage, 800)
  const socialImage = imageUrl(s.heroImage, 1200) || DEFAULT_OG_IMAGE
  const catLabel = CATEGORY_LABELS[s.category] || 'Servicio'
  const catIcon = CATEGORY_ICONS[s.category] || 'ico-wrench'

  // WhatsApp messages
  const waHero = waUrl(s.heroWaMessage || `Hola, necesito ${catLabel.toLowerCase()} en Monterrey`)
  const waMid = waUrl(s.midWaMessage || `Hola, estoy viendo su página de ${s.title} y me interesa una cotización`)
  const waClose = waUrl(s.ctaWaMessage || `Hola, necesito ${catLabel.toLowerCase()} en Monterrey. ¿Pueden ayudarme?`)
  const waNav = waUrl('Hola, vi su página y necesito ayuda con un tema en mi casa')

  // Hero visual
  const heroVisualHtml = heroImg ? `
    <div class="hero-visual">
      <img src="${heroImg}" alt="${escapeHtml(s.title)} — técnico profesional de ${BRAND} en Monterrey">
      <div class="badge">
        <div class="wa-ico"><svg><use href="#ico-wa"/></svg></div>
        <div>
          <b>Te contestamos hoy</b>
          <span>Lun–Sáb · 8:00 a 20:00</span>
        </div>
      </div>
    </div>` : ''

  // Pain bullets
  const painBulletsHtml = (s.painPoints || []).slice(0, 6).map((p, i) => {
    const icoIds = ['ico-clock', 'ico-chat', 'ico-shield', 'ico-home', 'ico-bolt', 'ico-drop']
    return `<div class="pain-bullet">
      <div class="ico"><svg><use href="#${icoIds[i % icoIds.length]}"/></svg></div>
      <b>${escapeHtml(p.title)}</b>
      <span>${escapeHtml(p.description)}</span>
    </div>`
  }).join('\n        ')

  const dangerHtml = s.dangerAlert?.title ? `
        <div class="alerta-peligro">
          <strong>${escapeHtml(s.dangerAlert.title)}</strong>
          <p>${escapeHtml(s.dangerAlert.text)}</p>
        </div>` : ''

  // Solution points
  const solutionsHtml = (s.solutions || []).slice(0, 6).map(sol => `
        <div class="sol-point">
          <div class="check"><svg><use href="#ico-check"/></svg></div>
          <div>
            <b>${escapeHtml(sol.title)}</b>
            <span>${escapeHtml(sol.description)}</span>
          </div>
        </div>`).join('')

  // Service details
  const detailsHtml = (s.serviceDetails || []).map(d => `
        <div class="detalle-card">
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.description)}</p>
        </div>`).join('')

  // FAQs (todas abiertas + JSON-LD)
  const faqsHtml = (s.faqs || []).map((f, i) => `
        <details class="faq-item"${i < 3 ? ' open' : ''}>
          <summary>${escapeHtml(f.question)}<span class="plus">+</span></summary>
          <p>${escapeHtml(f.answer)}</p>
        </details>`).join('')

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
  {"@context":"https://schema.org","@type":"Service","name":"${escapeHtml(s.title)}","description":"${seoDesc}","provider":{"@type":"HomeAndConstructionBusiness","name":"${BRAND}","url":"${DOMAIN}","telephone":"+${WA_NUMBER}","email":"contacto@nucleohogar.com.mx","areaServed":{"@type":"City","name":"Monterrey"},"address":{"@type":"PostalAddress","addressLocality":"Monterrey","addressRegion":"Nuevo León","addressCountry":"MX"}},"serviceType":"${escapeHtml(catSeo.serviceType)}","areaServed":[{"@type":"City","name":"Monterrey"},{"@type":"City","name":"San Pedro Garza García"},{"@type":"City","name":"Guadalupe"},{"@type":"City","name":"San Nicolás de los Garza"},{"@type":"City","name":"Apodaca"},{"@type":"City","name":"Escobedo"},{"@type":"City","name":"Santa Catarina"},{"@type":"City","name":"García"}]}
  </script>`

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = `
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Inicio","item":"${DOMAIN}/"},{"@type":"ListItem","position":2,"name":"${escapeHtml(s.title)}","item":"${DOMAIN}/${slug}/"}]}
  </script>`

  // Other services
  const otherServicesHtml = otherServices
    .filter(o => o._id !== s._id)
    .map(o => {
      const oSlug = o.slug?.current || ''
      const oCat = CATEGORY_LABELS[o.category] || o.title
      const oIco = CATEGORY_ICONS[o.category] || 'ico-wrench'
      return `
        <a href="/${oSlug}/" class="otro-card">
          <div class="ico-sm"><svg><use href="#${oIco}"/></svg></div>
          <div>
            <h3>${escapeHtml(oCat)} en Monterrey</h3>
            <p>${escapeHtml(o.heroSubtitle || generateSeoDescription(o)).substring(0, 110)}</p>
          </div>
        </a>`
    }).join('')

  // Cases (genéricos por categoría)
  const casesByCategory = {
    electricista: [
      ['Quiero instalar una lámpara', 'ico-bolt'],
      ['Se quemó un contacto', 'ico-bolt'],
      ['Tengo una falla eléctrica', 'ico-bolt'],
    ],
    minisplit: [
      ['Mi minisplit no enfría', 'ico-snow'],
      ['Mi minisplit tira agua', 'ico-drop'],
      ['Mantenimiento antes del calor', 'ico-snow'],
    ],
    plomeria: [
      ['Tengo una fuga en el lavabo', 'ico-drop'],
      ['Se tapó el WC', 'ico-drop'],
      ['Cambio de llaves', 'ico-wrench'],
    ],
    mantenimiento: [
      ['Quiero resolver varios pendientes', 'ico-wrench'],
      ['Necesito ajustes generales', 'ico-wrench'],
      ['Mantenimiento preventivo', 'ico-shield'],
    ],
  }
  const cases = casesByCategory[s.category] || casesByCategory.mantenimiento
  const casesHtml = cases.map(([q, ico]) => `
        <a class="case-card" href="${waUrl('Hola, ' + q.toLowerCase())}" target="_blank" rel="noopener">
          <div class="ico-mini"><svg><use href="#${ico}"/></svg></div>
          <div class="q">"${escapeHtml(q)}"</div>
          <div class="arrow">Consultar <svg><use href="#ico-arrow"/></svg></div>
        </a>`).join('')

  return `<!DOCTYPE html>
<html lang="es-MX">
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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${seoDesc}">
  <meta name="twitter:image" content="${socialImage}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
${SVG_SPRITE}

<header class="nav">
  <div class="container nav-inner">
    <a href="/" class="brand" aria-label="${BRAND} — ${BRAND_TAGLINE}">
      <img src="/Heder%20sin%20fondo.webp" alt="${BRAND} — ${BRAND_TAGLINE}" class="brand-logo">
    </a>
    <button class="menu-toggle" aria-label="Abrir menú" onclick="document.querySelector('nav.links').classList.toggle('open')">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <nav class="links">
      <a href="/">Inicio</a>
      <a href="/#servicios">Servicios</a>
      <a href="/#zonas">Zonas</a>
      <a href="/#faq">Preguntas</a>
    </nav>
    <a href="${waNav}" class="btn btn-wa nav-cta-desktop" target="_blank" rel="noopener">
      ${WA_BTN_HTML}
      WhatsApp
    </a>
  </div>
</header>

<div class="breadcrumb">
  <div class="container">
    <a href="/">Inicio</a> &rsaquo; <span>${escapeHtml(s.title)}</span>
  </div>
</div>

<section class="hero" id="inicio">
  <div class="container hero-grid">
    <div>
      <div class="eyebrow"><span class="dot"></span>${escapeHtml(s.heroTag || `${catLabel} en Monterrey`)}</div>
      <h1>${escapeHtml(s.heroTitle || s.title)}</h1>
      ${s.heroSubtitle ? `<p class="lead">${escapeHtml(s.heroSubtitle)}</p>` : ''}
      <div class="ctas">
        <a href="${waHero}" class="btn btn-wa" target="_blank" rel="noopener">
          ${WA_BTN_HTML}
          ${escapeHtml(s.heroCta || 'Pedir cotización por WhatsApp')}
        </a>
        <a href="#detalles" class="btn btn-ghost">Ver servicios</a>
      </div>
      <p class="btn-microcopy">Respuesta rápida · Sin compromiso</p>
      <div class="trust-row">
        <div class="t"><b>200+</b><span>hogares atendidos</span></div>
        <div class="t"><b>4.9 ★</b><span>en reseñas reales</span></div>
        <div class="t"><b>30 días</b><span>de garantía por escrito</span></div>
      </div>
    </div>
    ${heroVisualHtml}
  </div>
</section>

${painBulletsHtml ? `<section class="pain">
  <div class="container">
    <div class="pain-head">
      <div class="eyebrow gold"><span class="dot"></span>Lo entendemos</div>
      <h2>${escapeHtml(s.painSectionTitle || 'Problemas que no deberías ignorar')}</h2>
    </div>
    <div class="pain-bullets">
        ${painBulletsHtml}
    </div>${dangerHtml}
  </div>
</section>` : ''}

${solutionsHtml ? `<section class="solucion">
  <div class="container">
    <div class="section-head">
      <div class="left">
        <div class="eyebrow"><span class="dot"></span>Cómo lo resolvemos</div>
        <h2>${escapeHtml(s.solutionSectionTitle || 'Así trabajamos en tu casa')}</h2>
        ${s.solutionIntro ? `<p>${escapeHtml(s.solutionIntro)}</p>` : ''}
      </div>
    </div>
    <div class="solucion-grid">
      <div class="solucion-visual">
        <div>
          <div class="eyebrow light"><span class="dot"></span>Lo que nos diferencia</div>
          <div class="quote-big">Cuidamos <span class="gold">lo que más amas</span>: tu casa, tu tiempo y tu tranquilidad.</div>
          <div class="stats">
            <div class="stat"><b>200+</b><span>Hogares atendidos</span></div>
            <div class="stat"><b>30 días</b><span>De garantía</span></div>
          </div>
        </div>
      </div>
      <div class="solucion-points">${solutionsHtml}
      </div>
    </div>
    <div style="margin-top:36px;text-align:center">
      <a href="${waMid}" class="btn btn-wa" target="_blank" rel="noopener">
        ${WA_BTN_HTML}
        Cotización rápida por WhatsApp
      </a>
    </div>
  </div>
</section>` : ''}

${detailsHtml ? `<section class="detalles" id="detalles">
  <div class="container">
    <div class="section-head">
      <div class="left">
        <div class="eyebrow"><span class="dot"></span>Nuestros servicios</div>
        <h2>${escapeHtml(s.detailSectionTitle || `Servicios de ${catLabel} en Monterrey`)}</h2>
      </div>
    </div>
    <div class="detalle-grid">${detailsHtml}
    </div>
  </div>
</section>` : ''}

<section class="cases">
  <div class="container">
    <div class="section-head">
      <div class="left">
        <div class="eyebrow"><span class="dot"></span>Casos frecuentes</div>
        <h2>Lo que más nos piden de ${catLabel.toLowerCase()}.</h2>
        <p>Reconoces alguno? Da click para iniciar la conversación con el caso pre-llenado.</p>
      </div>
    </div>
    <div class="case-grid">${casesHtml}
    </div>
  </div>
</section>

${faqsHtml ? `<section class="faq" id="faq">
  <div class="container faq-grid">
    <div>
      <div class="eyebrow"><span class="dot"></span>Preguntas frecuentes</div>
      <h2 style="margin-top:14px">${escapeHtml(s.faqSectionTitle || 'Lo que más nos preguntan.')}</h2>
      <p style="margin:22px 0;color:var(--body);max-width:380px;line-height:1.65">¿Tienes otra duda? Escríbenos directo por WhatsApp.</p>
      <a href="${waUrl('Hola, tengo una pregunta sobre ' + s.title)}" class="btn btn-navy" target="_blank" rel="noopener">
        ${WA_BTN_HTML}
        Preguntar por WhatsApp
      </a>
    </div>
    <div class="faq-list">${faqsHtml}
    </div>
  </div>
</section>` : ''}

<section class="final-cta">
  <div class="final-cta-inner">
    <img src="/Heder%202.webp" alt="${BRAND} — ${BRAND_TAGLINE}" class="final-cta-logo">
    <h2>${escapeHtml(s.ctaTitle || '¿Tienes un pendiente en casa?')}</h2>
    <p>${escapeHtml(s.ctaSubtitle || 'Escríbenos hoy, cuéntanos qué pasa y recibe una cotización aproximada por mensaje.')}</p>
    <a href="${waClose}" class="btn btn-wa" target="_blank" rel="noopener">
      ${WA_BTN_HTML}
      Escribir por WhatsApp
    </a>
    <div class="small">Lun–Sáb · 8:00 a 20:00 · Monterrey y área metropolitana</div>
  </div>
</section>

${otherServicesHtml ? `<section class="otros">
  <div class="container">
    <div class="section-head">
      <div class="left">
        <div class="eyebrow"><span class="dot"></span>También resolvemos esto</div>
        <h2>Otros servicios en tu hogar.</h2>
      </div>
    </div>
    <div class="otros-grid">${otherServicesHtml}
    </div>
  </div>
</section>` : ''}

<footer class="site">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="/Heder%202.webp" alt="${BRAND} — ${BRAND_TAGLINE}" class="footer-logo">
        <p>Servicios confiables de electricidad residencial, minisplit, plomería y mantenimiento general para casas y departamentos en Monterrey y área metropolitana.</p>
      </div>
      <div>
        <h5>Servicios</h5>
        <ul>
          <li><a href="/electricista-monterrey/">Electricidad residencial</a></li>
          <li><a href="/minisplit-monterrey/">Minisplit</a></li>
          <li><a href="/plomeria-monterrey/">Plomería</a></li>
          <li><a href="${waUrl('Hola, tengo varios pendientes en mi casa y quiero cotizar')}" target="_blank" rel="noopener">Mantenimiento general</a></li>
        </ul>
      </div>
      <div>
        <h5>Información</h5>
        <ul>
          <li><a href="/#como-funciona">Cómo funciona</a></li>
          <li><a href="/#zonas">Zonas de servicio</a></li>
          <li><a href="/#faq">Preguntas frecuentes</a></li>
          <li><a href="/aviso-de-privacidad/">Aviso de privacidad</a></li>
        </ul>
      </div>
      <div>
        <h5>Contacto</h5>
        <ul>
          <li><a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener">WhatsApp: 81-3907-8447</a></li>
          <li><a href="mailto:contacto@nucleohogar.com.mx">contacto@nucleohogar.com.mx</a></li>
          <li>Lun–Sáb · 8:00 a 20:00</li>
          <li>Monterrey, N.L.</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© ${new Date().getFullYear()} ${BRAND} · ${BRAND_TAGLINE}</div>
      <div>Hecho en Monterrey</div>
    </div>
  </div>
</footer>

<a href="${waClose}" class="wa-float" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">
  <svg><use href="#ico-wa"/></svg>
  <span>Chatear ahora</span>
</a>

${serviceSchema}
${breadcrumbSchema}
${faqSchema}

<script>
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var href=this.getAttribute('href');
    if(href==='#'||href.length<2)return;
    e.preventDefault();
    var nav=document.querySelector('nav.links');
    if(nav)nav.classList.remove('open');
    var t=document.querySelector(href);
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
var f=document.querySelector('.wa-float'),h=document.querySelector('.hero');
if(f&&h&&'IntersectionObserver' in window){
  var o=new IntersectionObserver(function(e){
    var v=e[0].isIntersecting;
    if(v){f.classList.add('hidden')}else{f.classList.remove('hidden')}
  },{threshold:0.3});
  o.observe(h);
}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(link){
    link.addEventListener('click',function(e){
      var servicio='${s.category || 'general'}';
      var ubicacion='otro',el=e.currentTarget;
      if(el.classList.contains('nav-cta-desktop'))ubicacion='header';
      else if(el.classList.contains('wa-float'))ubicacion='flotante';
      else if(el.closest&&el.closest('.hero'))ubicacion='hero';
      else if(el.closest&&el.closest('.final-cta'))ubicacion='cta_final';
      else if(el.closest&&el.closest('.cases'))ubicacion='casos';
      else if(el.closest&&el.closest('.detalles'))ubicacion='detalles';
      else if(el.closest&&el.closest('.faq'))ubicacion='faq';
      else if(el.closest&&el.closest('.solucion'))ubicacion='solucion';
      else if(el.closest&&el.closest('footer'))ubicacion='footer';
      if(typeof gtag==='function'){
        gtag('event','whatsapp_lead',{event_category:'conversion',event_label:servicio,servicio:servicio,ubicacion_boton:ubicacion,pagina:document.title});
      }
    });
  });
});
</script>

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
  console.log(`🔨 Building ${BRAND} service pages from Sanity (diseño v2)...`)
  console.log(`   Project: ${PROJECT_ID} | Dataset: ${DATASET}`)

  const query = `*[_type == "service" && published == true] | order(sortOrder asc, title asc)`
  const services = await sanityFetch(query)
  console.log(`📦 Found ${services.length} published services`)

  if (services.length === 0) {
    console.log('⚠️  No published services found. Skipping page generation.')
    console.log('   El index.html estático sigue desplegándose.')
    return
  }

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

  const sitemapPath = path.resolve(__dirname, 'sitemap.xml')
  fs.writeFileSync(sitemapPath, generateSitemap(services), 'utf8')
  console.log(`  ✅ sitemap.xml (${services.length + 1} URLs)`)

  console.log(`\n🎉 Build complete! ${services.length} service pages generated.`)
}

main().catch((err) => {
  console.error('💥 Build failed:', err)
  process.exit(1)
})
