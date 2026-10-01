import type { Content } from './en'

export const es: Content = {
  brand: 'Winzu',
  fictionalLabel: 'Un restaurante ficticio en Chamberí',
  skipToDesk: 'Ir al escritorio',
  clickHint: 'Haz clic en el agua para seguir las balizas',
  deskHint: 'Haz clic en el mapa o en los papeles del escritorio',
  closeFocus: 'Volver',
  langToggle: { en: 'EN', es: 'ES' },
  documents: [
    {
      id: 'letter_burn',
      title: 'Si el local arde esta noche',
      body: '¿Qué papel dice lo que te deben?',
      options: [
        { id: 'lease', label: 'El arrendamiento' },
        { id: 'policy', label: 'La póliza' },
        { id: 'unknown', label: 'No lo sé' },
      ],
    },
    {
      id: 'letter_renewal',
      title: 'Renovaciones sobre la mesa',
      body: '¿Qué pago se renueva antes de que nadie lo recuerde?',
      options: [
        { id: 'rent', label: 'La renta' },
        { id: 'insurance', label: 'El seguro' },
        { id: 'nobody', label: 'Nadie lo sigue' },
      ],
    },
    {
      id: 'letter_copy',
      title: 'La única copia',
      body: '¿Quién, aparte del dueño, guarda la única copia?',
      options: [
        { id: 'asesoria', label: 'La asesoría' },
        { id: 'landlord', label: 'El arrendador' },
        { id: 'unsure', label: 'No estoy seguro' },
      ],
    },
    {
      id: 'book',
      title: 'Notas del libro',
      body: 'Un cuaderno de pagos, renovaciones y preguntas abiertas — abre las cartas para los bordes afilados.',
    },
  ],
  map: {
    title: 'Bar Norte',
    subtitle: 'Chamberí · Madrid — el mapa vivo de un lugar ficticio',
    nodeTypes: {
      asset: 'Activo',
      debt: 'Deuda',
      coverage: 'Cobertura',
      counterparty: 'Contraparte',
    },
    askPrompt: 'Pregunta al mapa',
    presets: [
      { id: 'uncovered', label: '¿Qué está sin cubrir?' },
      { id: 'renewals', label: '¿Qué se renueva en 90 días?' },
      { id: 'rent', label: '¿Quién cobra el alquiler?' },
    ],
    source: 'Fuente',
  },
  beats: [
    'Los papeles están en todas partes. El cuadro, en ninguna.',
    'Subes. Lees. Conectas activos, deudas, coberturas, contrapartes — cada valor cita su origen.',
    'Fase 1: pymes de hostelería en Madrid. Fase 2: agroindustria. ~20–50 €/mes, beta con descuento primero.',
    'Después: un sistema operativo de activos del mundo real. La tokenización es después — no esta página.',
  ],
  cta: {
    title: 'Recorramos esto juntos',
    body: 'Sin cuenta. Sin subir nada. Solo una conversación.',
    mail: 'Escríbenos',
    calendly: 'Reservar hora',
  },
  footer: 'Winzu · estático · sin backend',
}
