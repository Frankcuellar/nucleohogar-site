#!/usr/bin/env node
/**
 * Núcleo Hogar — Content Migration Script
 *
 * Migrates the 3 existing hardcoded service pages into Sanity CMS documents.
 * Run once after setting up the Sanity project.
 *
 * Usage:
 *   export SANITY_PROJECT_ID="your-project-id"
 *   export SANITY_DATASET="production"
 *   export SANITY_WRITE_TOKEN="your-write-token"
 *   node migrate-content.js
 */

const https = require('https')

const PROJECT_ID = process.env.SANITY_PROJECT_ID
const DATASET = process.env.SANITY_DATASET || 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

if (!PROJECT_ID || !TOKEN) {
  console.error('❌ Necesitas SANITY_PROJECT_ID y SANITY_WRITE_TOKEN')
  process.exit(1)
}

// ─── Sanity mutation API ───
function sanityMutate(mutations) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ mutations })
    const options = {
      hostname: `${PROJECT_ID}.api.sanity.io`,
      path: `/v2024-01-01/data/mutate/${DATASET}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            reject(new Error(JSON.stringify(parsed.error)))
          } else {
            resolve(parsed)
          }
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ─── Service documents ───
const services = [
  {
    _id: 'service-electricista-monterrey',
    _type: 'service',
    title: 'Electricista en Monterrey',
    slug: { _type: 'slug', current: 'electricista-monterrey' },
    category: 'electricista',
    heroTag: 'Electricista en Monterrey',
    heroTitle: 'Un problema eléctrico en casa no es solo una molestia — es un riesgo real',
    heroSubtitle: 'Ese switch que truena, esa luz que parpadea o ese apagón parcial que "ya volverá" pueden convertirse en un cortocircuito, un daño a sus aparatos o algo peor. No lo deje para después.',
    heroCta: 'Pedir cotización por WhatsApp',
    heroWaMessage: 'Hola, necesito un electricista en Monterrey',
    painSectionTitle: 'Problemas eléctricos que la gente deja pasar hasta que es tarde',
    painPoints: [
      { _key: 'p1', icon: '⚡', title: 'Se baja el pastilla cada vez que prende algo', description: 'Cada que conecta la plancha, el microondas o la secadora, se va la luz. No es que el aparato esté malo — es que su instalación ya no soporta la carga y hay riesgo de sobrecalentamiento.' },
      { _key: 'p2', icon: '🔌', title: 'Tiene contactos que no sirven o que sacan chispas', description: 'Un contacto dañado no solo es inútil — es peligroso. Los cables sueltos o el cableado viejo pueden causar arcos eléctricos que generan calor y, en el peor caso, un incendio.' },
      { _key: 'p3', icon: '🌑', title: 'Tiene una parte de la casa sin luz', description: 'Un apagón parcial puede ser un cable roto, un pastilla dañado o un problema en el centro de carga. Mientras más tiempo lo deja así, más difícil y costosa se vuelve la reparación.' },
      { _key: 'p4', icon: '💡', title: 'Las luces parpadean o se atenúan solas', description: 'No son los focos — es la instalación. Un cable flojo o un neutro dañado puede estar causando variaciones de voltaje que acortan la vida de sus aparatos electrónicos.' },
      { _key: 'p5', icon: '🏗️', title: 'Necesita una instalación nueva o ampliación', description: 'Va a remodelar, agregar un cuarto, poner un minisplit o necesita más contactos. Una instalación mal hecha le va a dar problemas por años. Necesita que quede bien desde el inicio.' },
      { _key: 'p6', icon: '😰', title: 'No confía en el "electricista de la esquina"', description: 'Ya le pasó: dejó entrar a alguien que "sabía de electricidad", le cobró barato, y a las dos semanas el problema volvió. O peor: le dejó la instalación peor de como estaba.' },
    ],
    dangerAlert: {
      title: 'Los problemas eléctricos no se resuelven solos — empeoran',
      text: 'Según la NFPA, las fallas eléctricas residenciales son la primera causa de incendios en el hogar. No espere a que un problema menor se convierta en una emergencia.',
    },
    solutionSectionTitle: 'Cómo trabajamos: sin adivinanzas, sin sorpresas',
    solutionIntro: 'Primero diagnosticamos, después le explicamos qué encontramos y cuánto cuesta. Usted decide si procedemos. Así de simple.',
    solutions: [
      { _key: 's1', title: 'Diagnóstico eléctrico completo', description: 'Revisamos centro de carga, cableado, contactos y circuitos. Identificamos el problema exacto antes de proponer cualquier solución.' },
      { _key: 's2', title: 'Reparación segura y definitiva', description: 'No hacemos parches. Reparamos el problema de raíz usando material de calidad para que no regrese. Trabajo limpio y ordenado.' },
      { _key: 's3', title: 'Instalaciones a norma', description: 'Toda instalación nueva la hacemos conforme a la NOM-001-SEDE. Cableado adecuado, protecciones correctas y acabado profesional.' },
      { _key: 's4', title: 'Garantía por escrito', description: '30 días de garantía en todo nuestro trabajo. Si algo no queda bien, regresamos sin costo adicional hasta que quede resuelto.' },
    ],
    midWaMessage: 'Hola, estoy viendo su página de electricista en Monterrey y me interesa una cotización',
    detailSectionTitle: 'Servicios eléctricos residenciales en Monterrey',
    serviceDetails: [
      { _key: 'd1', title: 'Reparación de cortos circuitos', description: 'Localizamos el punto exacto del corto, reparamos el cableado dañado y verificamos que todo el circuito quede seguro.' },
      { _key: 'd2', title: 'Apagones parciales', description: 'Diagnosticamos por qué una parte de su casa perdió energía y restauramos el suministro de forma segura y definitiva.' },
      { _key: 'd3', title: 'Cambio de centro de carga', description: 'Si su centro de carga es viejo, no tiene las protecciones adecuadas o ya no soporta la demanda, lo actualizamos a norma.' },
      { _key: 'd4', title: 'Instalación de contactos y apagadores', description: 'Contactos nuevos, apagadores, contactos con USB, tomas para minisplit o secadora. Todo con cableado adecuado y bien terminado.' },
      { _key: 'd5', title: 'Cableado para remodelaciones', description: 'Si va a ampliar, remodelar o construir, hacemos toda la instalación eléctrica desde cero con material certificado y a norma.' },
      { _key: 'd6', title: 'Revisión eléctrica preventiva', description: 'Una revisión completa de su instalación para detectar problemas antes de que se conviertan en emergencias. Ideal para casas con más de 10 años.' },
    ],
    faqSectionTitle: 'Preguntas frecuentes sobre electricidad residencial',
    faqs: [
      { _key: 'f1', question: '¿Por qué se baja el pastilla cada vez que conecto algo?', answer: 'Generalmente es porque el circuito está sobrecargado, es decir, tiene demasiados aparatos conectados a un mismo circuito. También puede ser un cable dañado o un pastilla defectuoso. Un diagnóstico profesional identifica la causa exacta.' },
      { _key: 'f2', question: '¿Cuándo debo cambiar mi centro de carga?', answer: 'Si su centro de carga tiene más de 15 años, si usa fusibles en vez de pastillas, si se siente caliente al tacto, o si ya agregó circuitos que no estaban planeados. Un centro de carga actualizado protege su instalación y sus aparatos.' },
      { _key: 'f3', question: '¿Es peligroso tener contactos que sacan chispas?', answer: 'Sí. Las chispas indican cables sueltos o desgastados que pueden generar arcos eléctricos. Esto produce calor y es una de las principales causas de incendios residenciales. Debe repararse lo antes posible.' },
      { _key: 'f4', question: '¿Trabajan los fines de semana?', answer: 'Sí, atendemos de lunes a sábado. Para emergencias eléctricas, escríbanos por WhatsApp y le confirmamos disponibilidad lo antes posible.' },
      { _key: 'f5', question: '¿Ofrecen garantía en el trabajo eléctrico?', answer: 'Sí. Todos nuestros servicios incluyen 30 días de garantía por escrito. Si algo no queda bien, regresamos sin costo adicional.' },
    ],
    ctaTitle: 'No espere a que un problema eléctrico se convierta en una emergencia',
    ctaSubtitle: 'Escríbanos hoy, cuéntenos qué pasa en su casa y reciba una cotización aproximada por mensaje.',
    ctaWaMessage: 'Hola, necesito un electricista en Monterrey. ¿Pueden ayudarme?',
    seoTitle: 'Electricista en Monterrey | Servicio Eléctrico Residencial | Núcleo Hogar',
    seoDescription: 'Electricista profesional en Monterrey. Reparaciones, instalaciones, cortos circuitos y apagones parciales. Técnicos puntuales con garantía por escrito. Cotización por WhatsApp.',
    seoKeywords: 'electricista monterrey, electricista residencial monterrey, servicio eléctrico monterrey, reparación eléctrica monterrey, instalación eléctrica monterrey, corto circuito monterrey',
    published: true,
    featured: true,
    sortOrder: 1,
  },
  {
    _id: 'service-minisplit-monterrey',
    _type: 'service',
    title: 'Minisplit en Monterrey',
    slug: { _type: 'slug', current: 'minisplit-monterrey' },
    category: 'minisplit',
    heroTag: 'Minisplit en Monterrey',
    heroTitle: 'Su minisplit no enfría, huele raro o gotea — y el calor de Monterrey no espera',
    heroSubtitle: 'Un equipo que no enfría bien, que gotea agua dentro de la casa o que hace ruidos extraños no solo es incómodo — está gastando más luz de la necesaria y puede dañarse por completo si no se atiende a tiempo.',
    heroCta: 'Pedir cotización por WhatsApp',
    heroWaMessage: 'Hola, necesito servicio de minisplit en Monterrey',
    painSectionTitle: 'Problemas con el minisplit que la gente ignora hasta que deja de funcionar',
    painPoints: [
      { _key: 'p1', icon: '🥵', title: 'El minisplit prende pero no enfría', description: 'Puede ser falta de gas refrigerante, filtros tapados o un compresor dañado. Mientras más lo use así, más electricidad gasta y más rápido se deteriora el equipo.' },
      { _key: 'p2', icon: '💧', title: 'Gotea agua dentro de la casa', description: 'El dren está tapado o la charola de condensado está rota. El agua puede dañar su pared, su piso o causar humedad que genera moho.' },
      { _key: 'p3', icon: '😷', title: 'Huele mal cuando lo prende', description: 'Hongos y bacterias acumuladas en los filtros y el evaporador. Ese aire que respira su familia puede estar contaminado y causar alergias o problemas respiratorios.' },
      { _key: 'p4', icon: '🔊', title: 'Hace ruidos extraños', description: 'Vibraciones, zumbidos o sonidos metálicos indican piezas flojas, un ventilador desbalanceado o un compresor en mal estado. No se va a arreglar solo.' },
      { _key: 'p5', icon: '⚡', title: 'El recibo de luz subió demasiado', description: 'Un minisplit sucio o con falta de mantenimiento puede consumir hasta 30% más electricidad. El mantenimiento regular es una inversión que se paga sola.' },
      { _key: 'p6', icon: '🏠', title: 'Necesita instalar uno nuevo', description: 'Va a poner un minisplit por primera vez o va a cambiar uno viejo. Una instalación mal hecha reduce la vida del equipo y puede causar problemas eléctricos.' },
    ],
    dangerAlert: {
      title: 'En Monterrey, quedarse sin aire acondicionado no es opción',
      text: 'Con temperaturas que superan los 40°C en verano, un minisplit que no funciona bien es un problema de salud, no solo de comodidad. No espere a que falle por completo.',
    },
    solutionSectionTitle: 'Cómo trabajamos: diagnóstico primero, después la solución',
    solutionIntro: 'Revisamos su equipo, le explicamos qué tiene y cuánto cuesta repararlo. Sin sorpresas, sin cargos ocultos.',
    solutions: [
      { _key: 's1', title: 'Diagnóstico técnico completo', description: 'Revisamos presión de gas, estado del compresor, filtros, dren, conexiones eléctricas y funcionamiento general. Le decimos exactamente qué tiene.' },
      { _key: 's2', title: 'Mantenimiento preventivo profesional', description: 'Lavado de filtros y serpentín, revisión de gas, limpieza de dren, verificación eléctrica. Su equipo queda como nuevo y enfriando al máximo.' },
      { _key: 's3', title: 'Reparación con refacciones originales', description: 'Si necesita reparación, usamos refacciones de calidad. Reparamos fugas de gas, reemplazamos capacitores, tarjetas y ventiladores.' },
      { _key: 's4', title: 'Instalación profesional certificada', description: 'Instalamos su minisplit con carga de gas correcta, tubería de cobre, cableado adecuado y soporte bien anclado. Garantía en mano de obra.' },
    ],
    midWaMessage: 'Hola, estoy viendo su página de minisplit en Monterrey y me interesa una cotización',
    detailSectionTitle: 'Servicios de minisplit y aire acondicionado en Monterrey',
    serviceDetails: [
      { _key: 'd1', title: 'Instalación de minisplit', description: 'Instalación completa: soporte, tubería de cobre, cableado eléctrico dedicado, carga de gas y prueba de funcionamiento. Todas las marcas.' },
      { _key: 'd2', title: 'Mantenimiento preventivo', description: 'Lavado de filtros, serpentín y turbina. Revisión de gas refrigerante, limpieza de dren y verificación eléctrica. Recomendado cada 6 meses.' },
      { _key: 'd3', title: 'Recarga de gas refrigerante', description: 'Verificamos presión, detectamos fugas si las hay, y recargamos con el gas correcto para su equipo (R410a, R22, R32).' },
      { _key: 'd4', title: 'Reparación de minisplit', description: 'Diagnosticamos y reparamos cualquier falla: no enfría, gotea, hace ruido, no prende, se apaga solo. Refacciones de calidad.' },
      { _key: 'd5', title: 'Cambio de equipo', description: 'Si su equipo ya no tiene reparación, le ayudamos a elegir el tamaño correcto y lo instalamos con todo incluido.' },
      { _key: 'd6', title: 'Desinstalación y reubicación', description: 'Si va a remodelar o cambiar de casa, desinstalamos y reinstalamos su equipo en la nueva ubicación con recuperación de gas.' },
    ],
    faqSectionTitle: 'Preguntas frecuentes sobre minisplit y aire acondicionado',
    faqs: [
      { _key: 'f1', question: '¿Cada cuánto debo darle mantenimiento a mi minisplit?', answer: 'Lo ideal es cada 6 meses, especialmente antes del verano. En Monterrey, donde los equipos trabajan a máxima capacidad varios meses al año, el mantenimiento regular extiende la vida útil y reduce el consumo de electricidad.' },
      { _key: 'f2', question: '¿Por qué mi minisplit no enfría bien?', answer: 'Las causas más comunes son: filtros sucios, falta de gas refrigerante, serpentín del condensador sucio, o un problema en el compresor. Un diagnóstico profesional identifica la causa exacta.' },
      { _key: 'f3', question: '¿Cuánto cuesta instalar un minisplit?', answer: 'Depende de la capacidad del equipo y la complejidad de la instalación (distancia entre unidades, altura, cableado existente). Escríbanos por WhatsApp con los datos de su espacio y le cotizamos sin compromiso.' },
      { _key: 'f4', question: '¿Qué tamaño de minisplit necesito?', answer: 'Depende del tamaño del cuarto, la orientación, y cuánto sol recibe. Como regla general: 1 tonelada (12,000 BTU) para cuartos de hasta 20m². Le ayudamos a elegir el tamaño correcto.' },
      { _key: 'f5', question: '¿Trabajan con todas las marcas?', answer: 'Sí. Damos servicio a Mirage, Carrier, LG, Samsung, Hisense, Midea, Mabe y todas las marcas disponibles en el mercado.' },
    ],
    ctaTitle: 'No sufra el calor — resolvemos hoy',
    ctaSubtitle: 'Escríbanos por WhatsApp, cuéntenos qué pasa con su equipo y reciba una cotización rápida.',
    ctaWaMessage: 'Hola, necesito servicio de minisplit en Monterrey. ¿Pueden ayudarme?',
    seoTitle: 'Minisplit en Monterrey | Instalación y Mantenimiento | Núcleo Hogar',
    seoDescription: 'Instalación, mantenimiento y reparación de minisplit en Monterrey. Técnicos certificados, todas las marcas, garantía por escrito. Cotización rápida por WhatsApp.',
    seoKeywords: 'minisplit monterrey, instalación minisplit monterrey, mantenimiento minisplit monterrey, reparación minisplit monterrey, aire acondicionado monterrey',
    published: true,
    featured: true,
    sortOrder: 2,
  },
  {
    _id: 'service-plomeria-monterrey',
    _type: 'service',
    title: 'Plomería en Monterrey',
    slug: { _type: 'slug', current: 'plomeria-monterrey' },
    category: 'plomeria',
    heroTag: 'Plomero en Monterrey',
    heroTitle: 'Una fuga de agua en casa no es un "goteo menor" — es dinero y daño que crece cada día',
    heroSubtitle: 'Esa fuga que "no es tanta", ese drenaje lento o ese baño que no descarga bien está causando daño en sus paredes, su piso o su recibo de agua. Mientras más espere, más caro sale.',
    heroCta: 'Pedir cotización por WhatsApp',
    heroWaMessage: 'Hola, necesito un plomero en Monterrey',
    painSectionTitle: 'Problemas de plomería que la gente deja pasar hasta que se convierten en emergencia',
    painPoints: [
      { _key: 'p1', icon: '💧', title: 'Tiene una fuga que no encuentra', description: 'Manchas de humedad en paredes o techo, el recibo de agua subió sin razón. Hay una fuga oculta que está causando daño estructural y desperdiciando agua.' },
      { _key: 'p2', icon: '🚿', title: 'El agua sale con poca presión', description: 'Si el agua sale débil en regadera o llaves, puede ser una tubería tapada, una válvula dañada o un problema en el tinaco. No es normal y tiene solución.' },
      { _key: 'p3', icon: '🚽', title: 'El drenaje está tapado o huele mal', description: 'Un drenaje lento o con mal olor indica acumulación de grasa, cabello o un problema más serio en la tubería. Mientras más espere, peor se pone.' },
      { _key: 'p4', icon: '🔧', title: 'Un mueble de baño o cocina gotea', description: 'La llave del lavabo, el mezclador de la regadera o la llave de la cocina gotean. Parece poco, pero una llave que gotea desperdicia hasta 11,000 litros al año.' },
      { _key: 'p5', icon: '🏗️', title: 'Necesita una instalación nueva', description: 'Va a remodelar baño o cocina, o necesita conexión para lavadora, calentador o tinaco. Una instalación mal hecha le va a dar fugas y problemas por años.' },
      { _key: 'p6', icon: '😤', title: 'Ya llamó a otro plomero y no le resolvió', description: 'Le hicieron un "parche" que duró poco, le cobraron de más, o simplemente no encontraron el problema. Necesita a alguien que haga las cosas bien desde la primera vez.' },
    ],
    dangerAlert: {
      title: 'Las fugas de agua no se arreglan solas — empeoran',
      text: 'Una fuga pequeña puede desperdiciar más de 30,000 litros al año y causar daño estructural. En Monterrey, donde el agua es un recurso escaso, cada gota cuenta.',
    },
    solutionSectionTitle: 'Cómo trabajamos: encontramos el problema real, no hacemos parches',
    solutionIntro: 'Primero diagnosticamos con precisión, le explicamos qué encontramos y cuánto cuesta. Usted decide si procedemos.',
    solutions: [
      { _key: 's1', title: 'Diagnóstico preciso', description: 'Localizamos el problema exacto antes de proponer soluciones. No adivinamos — verificamos presión, revisamos conexiones y detectamos fugas ocultas.' },
      { _key: 's2', title: 'Reparación definitiva', description: 'No hacemos parches temporales. Reparamos de raíz con material de calidad para que el problema no regrese. Trabajo limpio y ordenado.' },
      { _key: 's3', title: 'Instalaciones a norma', description: 'Toda instalación nueva con tubería y conexiones de calidad. Probamos presión antes de entregar para garantizar que no haya fugas.' },
      { _key: 's4', title: 'Garantía por escrito', description: '30 días de garantía en todo nuestro trabajo. Si algo no queda bien, regresamos sin costo adicional.' },
    ],
    midWaMessage: 'Hola, estoy viendo su página de plomería en Monterrey y me interesa una cotización',
    detailSectionTitle: 'Servicios de plomería residencial en Monterrey',
    serviceDetails: [
      { _key: 'd1', title: 'Detección y reparación de fugas', description: 'Localizamos fugas ocultas en paredes, pisos y techos. Reparamos la tubería dañada y verificamos que quede sellada correctamente.' },
      { _key: 'd2', title: 'Destape de drenajes', description: 'Destapamos lavabos, regaderas, WC, coladeras y drenajes principales. Usamos equipo profesional para limpiezas profundas.' },
      { _key: 'd3', title: 'Reparación de llaves y mezcladoras', description: 'Reparamos o reemplazamos llaves de cocina, baño, regadera y jardín. Todas las marcas y modelos.' },
      { _key: 'd4', title: 'Instalación de muebles de baño', description: 'Instalamos WC, lavabos, regaderas, tinas y accesorios de baño. Conexiones seguras y acabado limpio.' },
      { _key: 'd5', title: 'Instalación de calentadores', description: 'Instalamos calentadores de paso, boilers y calentadores solares. Conexión de gas y agua con todas las medidas de seguridad.' },
      { _key: 'd6', title: 'Tubería para remodelaciones', description: 'Si va a remodelar baño o cocina, hacemos toda la plomería desde cero con material certificado y probamos presión antes de entregar.' },
    ],
    faqSectionTitle: 'Preguntas frecuentes sobre plomería residencial',
    faqs: [
      { _key: 'f1', question: '¿Cómo sé si tengo una fuga oculta?', answer: 'Las señales más comunes son: manchas de humedad en paredes o techo, recibo de agua inusualmente alto, sonido de agua corriendo cuando todo está cerrado, o pisos que se sienten húmedos. Un diagnóstico profesional confirma la ubicación exacta.' },
      { _key: 'f2', question: '¿Pueden destapar un drenaje que ya intenté destapar yo?', answer: 'Sí. Cuando los métodos caseros no funcionan, generalmente es porque la obstrucción es más profunda o más severa. Usamos equipo profesional que llega donde los métodos caseros no pueden.' },
      { _key: 'f3', question: '¿Cuánto tarda una reparación de fuga?', answer: 'Depende de la ubicación y severidad. Una fuga visible en tubería expuesta puede repararse en 1-2 horas. Una fuga oculta en pared puede requerir más tiempo para localizar y reparar.' },
      { _key: 'f4', question: '¿Trabajan fines de semana?', answer: 'Sí, atendemos de lunes a sábado. Para emergencias de plomería (fugas activas, drenaje completamente tapado), escríbanos por WhatsApp y le confirmamos disponibilidad.' },
      { _key: 'f5', question: '¿Qué garantía tienen?', answer: '30 días de garantía por escrito en toda nuestra mano de obra. Si algo no queda bien, regresamos sin costo adicional.' },
    ],
    ctaTitle: 'No deje que una fuga se convierta en un problema mayor',
    ctaSubtitle: 'Escríbanos hoy, cuéntenos qué pasa en su casa y reciba una cotización aproximada por mensaje.',
    ctaWaMessage: 'Hola, necesito un plomero en Monterrey. ¿Pueden ayudarme?',
    seoTitle: 'Plomero en Monterrey | Plomería Residencial | Núcleo Hogar',
    seoDescription: 'Plomero profesional en Monterrey. Fugas, destapes, instalaciones y reparaciones. Diagnóstico preciso, trabajo limpio y garantía por escrito. Cotización por WhatsApp.',
    seoKeywords: 'plomero monterrey, plomería monterrey, plomero residencial monterrey, reparación fugas monterrey, destape drenaje monterrey',
    published: true,
    featured: true,
    sortOrder: 3,
  },
]

async function main() {
  console.log('🔄 Migrando contenido de Núcleo Hogar a Sanity...\n')

  for (const service of services) {
    console.log(`  📝 Creando: ${service.title}`)
    try {
      await sanityMutate([{ createOrReplace: service }])
      console.log(`  ✅ ${service.title} — creado exitosamente`)
    } catch (err) {
      console.error(`  ❌ ${service.title} — error:`, err.message)
    }
  }

  console.log(`\n🎉 Migración completa. ${services.length} servicios creados en Sanity.`)
  console.log('   Ahora sube las imágenes del hero en Sanity Studio.')
}

main().catch((err) => {
  console.error('💥 Migración fallida:', err)
  process.exit(1)
})
