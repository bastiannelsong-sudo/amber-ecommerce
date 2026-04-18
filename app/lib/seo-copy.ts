/**
 * Fuente única de verdad para URLs SEO, títulos y descripciones.
 *
 * Decisiones:
 *   - Slugs en plural español para coincidir con la intención de búsqueda
 *     ("pulseras plata 925" > "pulsera plata 925").
 *   - product_type en la BD está en singular; el slug público es plural.
 *     La conversión vive acá para que cualquier otro rincón la reuse.
 *   - Cada faceta tiene un texto de display (label) y una copy larga
 *     pensada para H1/meta-description. Storytelling > keyword stuffing.
 */

/** Tipos de producto soportados (matchea backend dto `PRODUCT_TYPES`). */
export const PRODUCT_TYPE_SLUGS = [
  'pulseras',
  'collares',
  'aros',
  'anillos',
  'dijes',
  'conjuntos',
  'cadenas',
  'charms',
  'rosarios',
  'medallas',
  'prendedores',
  'tobilleras',
] as const;

export type ProductTypeSlug = (typeof PRODUCT_TYPE_SLUGS)[number];

/** Convierte slug URL (plural) → product_type backend (singular). */
const SLUG_TO_TYPE: Record<ProductTypeSlug, string> = {
  pulseras: 'pulsera',
  collares: 'collar',
  aros: 'aro',
  anillos: 'anillo',
  dijes: 'dije',
  conjuntos: 'conjunto',
  cadenas: 'cadena',
  charms: 'charm',
  rosarios: 'rosario',
  medallas: 'medalla',
  prendedores: 'prendedor',
  tobilleras: 'tobillera',
};

export function slugToProductType(slug: string): string | null {
  return SLUG_TO_TYPE[slug as ProductTypeSlug] ?? null;
}

/** Inversa: product_type backend (singular) → slug URL (plural). */
const TYPE_TO_SLUG: Record<string, ProductTypeSlug> = Object.fromEntries(
  Object.entries(SLUG_TO_TYPE).map(([slug, type]) => [type, slug as ProductTypeSlug]),
);

export function productTypeToSlug(type: string | null | undefined): ProductTypeSlug | null {
  if (!type) return null;
  return TYPE_TO_SLUG[type] ?? null;
}

export function isProductTypeSlug(slug: string): slug is ProductTypeSlug {
  return slug in SLUG_TO_TYPE;
}

/** Copy SEO por tipo de producto. */
export const PRODUCT_TYPE_COPY: Record<
  ProductTypeSlug,
  { h1: string; title: string; description: string; lead: string }
> = {
  pulseras: {
    h1: 'Pulseras',
    title: 'Pulseras de Plata 925, Hilo Rojo y Amuletos | AMBER',
    description:
      'Pulseras de plata fina 925, hilo rojo, nudo de brujas y San Benito. Amuletos de protección para mujer, hombre y bebé. Envío a todo Chile.',
    lead: 'Pulseras con intención: protección, amor, amistad. Plata fina 925, hilo rojo, nudo de brujas, San Benito y más.',
  },
  collares: {
    h1: 'Collares',
    title: 'Collares de Plata 925, Amuletos y Dijes | AMBER',
    description:
      'Collares de plata 925, cadenas con dijes de protección, corazones y símbolos espirituales. Diseños únicos para mujer y hombre.',
    lead: 'Collares y cadenas con propósito: amuletos, corazones, cruces y símbolos de protección en plata fina 925.',
  },
  aros: {
    h1: 'Aros',
    title: 'Aros de Plata 925 y Cristales Swarovski | AMBER',
    description:
      'Aros de plata fina 925 con cristales Swarovski, circones y diseños elegantes. Aros para mujer, estilos clásicos y modernos.',
    lead: 'Aros que completan tu estilo: plata fina 925, cristales Swarovski y diseños únicos para cada ocasión.',
  },
  anillos: {
    h1: 'Anillos',
    title: 'Anillos de Plata 925 y Circones | AMBER',
    description:
      'Anillos de plata fina 925 para mujer. Diseños elegantes con circones, símbolos y detalles únicos.',
    lead: 'Anillos en plata fina 925, desde los diseños más clásicos hasta piezas únicas con símbolos.',
  },
  dijes: {
    h1: 'Dijes',
    title: 'Dijes de Plata 925: San Benito, Cruz, Corazón y más | AMBER',
    description:
      'Dijes de plata fina 925: San Benito, cruz, corazón, amuletos de protección. Combina con cualquier cadena.',
    lead: 'Dijes con significado: protección, amor, fe. Plata 925 pensada para acompañarte cada día.',
  },
  conjuntos: {
    h1: 'Conjuntos',
    title: 'Conjuntos de Collar y Aros a Juego | AMBER',
    description:
      'Conjuntos de joyería: collar y aros a juego en plata fina 925. Sets de regalo perfectos para toda ocasión.',
    lead: 'Conjuntos coordinados: collar y aros pensados para vestirse juntos. Ideal para regalar.',
  },
  cadenas: {
    h1: 'Cadenas',
    title: 'Cadenas de Plata 925 para Hombre y Mujer | AMBER',
    description:
      'Cadenas de plata 925: grumet, cartier, barbada, veneciana. Diseños para hombre y mujer, combinables con cualquier dije.',
    lead: 'Cadenas macizas en plata 925. Estilos clásicos y modernos, para colgar tu dije favorito.',
  },
  charms: {
    h1: 'Charms',
    title: 'Charms y Abalorios de Plata 925 | AMBER',
    description:
      'Charms de plata fina 925 compatibles con pulseras tipo Pandora y cadenas. Símbolos, letras y figuras únicas.',
    lead: 'Charms para personalizar tu pulsera: símbolos, letras, figuras. Cada uno con su propia historia.',
  },
  rosarios: {
    h1: 'Rosarios',
    title: 'Rosarios y Japa Malas | AMBER',
    description:
      'Rosarios católicos y japa malas espirituales. Piezas hechas con dedicación para oración y meditación.',
    lead: 'Rosarios y japa malas: compañeros de oración y meditación. Diseños con sentido espiritual.',
  },
  medallas: {
    h1: 'Medallas',
    title: 'Medallas de Plata: San Benito, Virgen Milagrosa | AMBER',
    description:
      'Medallas de plata 925: San Benito, Virgen Milagrosa, cruz. Perfectas para bebés y adultos.',
    lead: 'Medallas con historia: San Benito, Virgen, protección. Plata fina para llevar contigo.',
  },
  prendedores: {
    h1: 'Prendedores',
    title: 'Prendedores de Plata para Bebé | AMBER',
    description:
      'Prendedores de plata 925 para bebé: San Benito, cinta roja, anti mal de ojo. Regalos únicos de bautismo.',
    lead: 'Prendedores para bebé: tradición chilena de protección. Plata fina y cinta roja de toda la vida.',
  },
  tobilleras: {
    h1: 'Tobilleras',
    title: 'Tobilleras de Plata y Baño de Oro | AMBER',
    description:
      'Tobilleras delicadas en plata fina 925 y baño de oro. Para esos detalles que marcan la diferencia.',
    lead: 'Tobilleras: joyería para los detalles que importan. Plata fina, baño de oro y diseños únicos.',
  },
};

/** Tags SEO-relevantes (landing pages por símbolo/intención). */
export const TAG_COPY: Record<
  string,
  { h1: string; title: string; description: string; lead: string }
> = {
  'san-benito': {
    h1: 'San Benito',
    title: 'Amuletos de San Benito: Pulseras, Medallas y Dijes | AMBER',
    description:
      'Medalla, pulsera y dije de San Benito en plata 925. Protección espiritual contra el mal. Regalo tradicional chileno.',
    lead: 'San Benito es el amuleto más pedido en Chile. Protección espiritual en plata fina 925.',
  },
  'nudo-de-brujas': {
    h1: 'Nudo de Brujas',
    title: 'Nudo de Brujas: Pulseras y Dijes de Protección | AMBER',
    description:
      'El Nudo de Brujas protege de energías negativas. Pulseras y dijes en plata 925 con este símbolo ancestral.',
    lead: 'Un símbolo ancestral de protección. Nudo de Brujas en plata 925 para escudar tu energía.',
  },
  'hilo-rojo': {
    h1: 'Hilo Rojo',
    title: 'Pulseras de Hilo Rojo: Protección y 7 Nudos | AMBER',
    description:
      'Pulseras de hilo rojo con 7 nudos, San Benito y nudo de brujas. Tradición de protección para bebés y adultos.',
    lead: 'El hilo rojo atado con siete nudos protege del mal de ojo. Tradición que cruza generaciones.',
  },
  'mano-de-fatima': {
    h1: 'Mano de Fátima',
    title: 'Mano de Fátima: Amuletos de Protección | AMBER',
    description:
      'La Mano de Fátima (Hamsa) aleja la envidia y el mal de ojo. Joyería en plata 925 con este símbolo.',
    lead: 'La Hamsa: símbolo de protección reconocido en muchas culturas. Ahora en plata fina 925.',
  },
  'ojo-turco': {
    h1: 'Ojo Turco',
    title: 'Ojo Turco: Pulseras y Dijes Protectores | AMBER',
    description:
      'El Ojo Turco protege contra el mal de ojo. Pulseras y dijes en plata con este amuleto universal.',
    lead: 'Ojo Turco: el guardián más conocido contra la envidia. Protección que se lleva encima.',
  },
  corazon: {
    h1: 'Corazones',
    title: 'Joyería con Corazones: Pulseras, Collares y Dijes | AMBER',
    description:
      'Pulseras, collares y dijes con corazones en plata 925. Regalos de amor para mamá, pareja y amigas.',
    lead: 'Corazones en plata fina: la expresión más clara de un te quiero. Para regalar o regalarte.',
  },
  cruz: {
    h1: 'Cruces',
    title: 'Cruces de Plata 925: Dijes y Colgantes | AMBER',
    description:
      'Cruces de plata fina 925. Símbolos de fe para collares y dijes, tradicionales y contemporáneos.',
    lead: 'Cruces que acompañan: fe, protección, tradición. En plata 925 para llevar cada día.',
  },
  'arbol-de-la-vida': {
    h1: 'Árbol de la Vida',
    title: 'Árbol de la Vida: Amuletos de Plata | AMBER',
    description:
      'El Árbol de la Vida representa conexión, fuerza y equilibrio. Joyería con este símbolo en plata 925.',
    lead: 'Árbol de la Vida: raíces, equilibrio y conexión. Un amuleto para recordar de dónde venís.',
  },
  infinito: {
    h1: 'Infinito',
    title: 'Joyería del Infinito: Amor sin Fin | AMBER',
    description:
      'Símbolo del infinito en plata 925: pulseras, collares y anillos. Amor eterno, amistad sin fin.',
    lead: 'El símbolo infinito: todo lo que no tiene fin. Para las relaciones que duran una vida.',
  },
  mariposa: {
    h1: 'Mariposas',
    title: 'Joyería con Mariposas: Transformación | AMBER',
    description:
      'Mariposas en plata 925: símbolos de transformación y renacer. Pulseras, aros y dijes delicados.',
    lead: 'Mariposas: transformación, libertad, renacer. Joyería sutil con mensaje profundo.',
  },
  regalo: {
    h1: 'Ideas de Regalo',
    title: 'Regalos de Joyería en Plata 925 | AMBER',
    description:
      'Joyería de regalo: pulseras, collares y conjuntos en plata 925 listos para sorprender. Presentación incluida.',
    lead: 'Una joya siempre es buen regalo. Más cuando viene con historia y plata fina.',
  },
  proteccion: {
    h1: 'Amuletos de Protección',
    title: 'Amuletos de Protección: San Benito, Hilo Rojo y Más | AMBER',
    description:
      'Amuletos protectores: San Benito, nudo de brujas, hilo rojo, Mano de Fátima. Plata 925 para cuidarte.',
    lead: 'Protección en forma de joya: los símbolos que cuidan desde siempre, ahora en plata fina.',
  },
  swarovski: {
    h1: 'Con Cristales Swarovski',
    title: 'Joyería con Cristales Swarovski | AMBER',
    description:
      'Pulseras, aros y collares con cristales Swarovski auténticos engarzados en plata 925.',
    lead: 'El brillo Swarovski en joyería de plata fina: elegancia sin esfuerzo.',
  },
};

export function getProductTypeCopy(slug: ProductTypeSlug) {
  return PRODUCT_TYPE_COPY[slug];
}

/**
 * Materiales soportados como segmento SEO anidado (/pulseras/plata-925).
 * El valor a la izquierda es el slug URL; a la derecha, el valor backend.
 */
export const MATERIAL_SLUGS = {
  'plata-925': 'plata-925',
  acero: 'acero',
  hilo: 'hilo',
  cristales: 'cristales',
  cobre: 'cobre',
  cuero: 'cuero',
  'piedra-natural': 'piedra-natural',
} as const;

export type MaterialSlug = keyof typeof MATERIAL_SLUGS;

export function slugToMaterial(slug: string): string | null {
  return (MATERIAL_SLUGS as Record<string, string>)[slug] ?? null;
}

export function isMaterialSlug(slug: string): slug is MaterialSlug {
  return slug in MATERIAL_SLUGS;
}

export const MATERIAL_LABELS: Record<MaterialSlug, string> = {
  'plata-925': 'Plata 925',
  acero: 'Acero Quirúrgico',
  hilo: 'Hilo',
  cristales: 'Cristales',
  cobre: 'Cobre',
  cuero: 'Cuero',
  'piedra-natural': 'Piedra Natural',
};

/** Combinaciones type × material que sí tenemos (evita generar URLs vacías). */
export const TYPE_MATERIAL_COMBOS: Array<{ type: ProductTypeSlug; material: MaterialSlug }> = [
  { type: 'pulseras', material: 'plata-925' },
  { type: 'pulseras', material: 'hilo' },
  { type: 'pulseras', material: 'acero' },
  { type: 'pulseras', material: 'cristales' },
  { type: 'pulseras', material: 'cuero' },
  { type: 'pulseras', material: 'piedra-natural' },
  { type: 'collares', material: 'plata-925' },
  { type: 'collares', material: 'acero' },
  { type: 'aros', material: 'plata-925' },
  { type: 'aros', material: 'cristales' },
  { type: 'anillos', material: 'plata-925' },
  { type: 'dijes', material: 'plata-925' },
  { type: 'conjuntos', material: 'plata-925' },
  { type: 'cadenas', material: 'plata-925' },
  { type: 'cadenas', material: 'acero' },
];

export function getTagCopy(tag: string) {
  return TAG_COPY[tag] ?? null;
}

/** Tags con landing SEO disponibles (los que tenemos copy para). */
export function getSupportedTagSlugs(): string[] {
  return Object.keys(TAG_COPY);
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://amberjoyeria.cl';
