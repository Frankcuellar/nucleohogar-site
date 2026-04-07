// ================================================
// script.js — Núcleo Hogar Landing Page
// Funcionalidad mínima, sin dependencias
// ================================================

// 1. Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// 2. Tracking de clicks en botones WhatsApp (para Google Analytics / Meta Pixel)
document.querySelectorAll('.btn-whatsapp, .whatsapp-float').forEach(function(btn) {
  btn.addEventListener('click', function() {
    // Google Analytics 4 (descomentar si usas GA4):
    // gtag('event', 'whatsapp_click', { event_category: 'conversion' });

    // Meta Pixel (descomentar si usas Facebook Ads):
    // fbq('track', 'Contact');

    console.log('WhatsApp click tracked');
  });
});

// 3. Botón flotante: ocultar cuando el hero es visible, mostrar al hacer scroll
var floatBtn = document.querySelector('.whatsapp-float');
var hero = document.querySelector('.hero');

if (floatBtn && hero) {
  var observer = new IntersectionObserver(function(entries) {
    var isHeroVisible = entries[0].isIntersecting;
    floatBtn.style.opacity = isHeroVisible ? '0' : '1';
    floatBtn.style.pointerEvents = isHeroVisible ? 'none' : 'auto';
  }, { threshold: 0.3 });

  observer.observe(hero);
}

// 4. Animación suave de entrada para las secciones al hacer scroll
var sections = document.querySelectorAll('.problemas, .servicios, .confianza, .como-funciona, .cobertura, .cta-final');

if ('IntersectionObserver' in window) {
  var sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        sectionObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  sections.forEach(function(section) {
    section.classList.add('fade-in');
    sectionObserver.observe(section);
  });
}
