// ===========================================
// server/prisma/seeds/policyTypes.ts
// Definición de los 26 tipos de seguros.
// Los campos específicos están en policyTypeSchemas.ts
// ===========================================

export interface PolicyTypeDef {
  id: string;
  key: string;
  name: string;
  shortName: string;
  description: string;
  categoryId: string;
  icon?: string;
  sortOrder: number;
}

export const POLICY_TYPES: PolicyTypeDef[] = [
  // ═══════════════════════════════════════════════════
  // CATEGORÍA 1 — SALUD Y BIENESTAR
  // ═══════════════════════════════════════════════════
  {
    id: 'ptype-health-aca',
    key: 'health_aca',
    name: 'Salud / ACA',
    shortName: 'ACA',
    description: 'Seguros de salud bajo el Affordable Care Act (Obamacare). Incluye subsidios APTC.',
    categoryId: 'cat-health',
    icon: 'HeartPulse',
    sortOrder: 1,
  },
  {
    id: 'ptype-health-private',
    key: 'health_private',
    name: 'Salud Privada',
    shortName: 'Salud Priv.',
    description: 'Seguros médicos privados fuera del mercado ACA.',
    categoryId: 'cat-health',
    icon: 'Stethoscope',
    sortOrder: 2,
  },
  {
    id: 'ptype-major-medical',
    key: 'health_major_medical',
    name: 'Gastos Médicos Mayores',
    shortName: 'GMM',
    description: 'Seguros complementarios que cubren gastos no incluidos en el plan principal.',
    categoryId: 'cat-health',
    icon: 'Hospital',
    sortOrder: 3,
  },
  {
    id: 'ptype-dental-vision',
    key: 'dental_vision',
    name: 'Dental / Visión',
    shortName: 'Dental/Visión',
    description: 'Coberturas dentales y de vista.',
    categoryId: 'cat-health',
    icon: 'Smile',
    sortOrder: 4,
  },
  {
    id: 'ptype-critical-illness',
    key: 'critical_illness',
    name: 'Enfermedades Graves',
    shortName: 'Critical Illness',
    description: 'Paga un monto fijo al diagnóstico de cáncer, infarto, ACV, etc.',
    categoryId: 'cat-health',
    icon: 'Activity',
    sortOrder: 5,
  },
  {
    id: 'ptype-hospital-indemnity',
    key: 'hospital_indemnity',
    name: 'Indemnización Hospitalaria',
    shortName: 'Indem. Hosp.',
    description: 'Paga un monto diario por cada día hospitalizado.',
    categoryId: 'cat-health',
    icon: 'Bed',
    sortOrder: 6,
  },

  // ═══════════════════════════════════════════════════
  // CATEGORÍA 2 — VIDA Y FINANZAS PERSONALES
  // ═══════════════════════════════════════════════════
  {
    id: 'ptype-life',
    key: 'life',
    name: 'Vida',
    shortName: 'Vida',
    description: 'Seguros de vida (término, IUL, whole life) que protegen a la familia.',
    categoryId: 'cat-life',
    icon: 'Heart',
    sortOrder: 1,
  },
  {
    id: 'ptype-personal-accident',
    key: 'personal_accident',
    name: 'Accidentes Personales',
    shortName: 'Accidentes',
    description: 'Cubre lesiones por accidentes: fracturas, hospitalización, invalidez.',
    categoryId: 'cat-life',
    icon: 'AlertTriangle',
    sortOrder: 2,
  },
  {
    id: 'ptype-indemnity',
    key: 'indemnity',
    name: 'Indemnización',
    shortName: 'Indemnización',
    description: 'Coberturas de indemnización por despido, discapacidad o situaciones específicas.',
    categoryId: 'cat-life',
    icon: 'Receipt',
    sortOrder: 3,
  },
  {
    id: 'ptype-disability',
    key: 'disability',
    name: 'Incapacidad',
    shortName: 'Disability',
    description: 'Reemplaza un porcentaje del salario si el titular no puede trabajar.',
    categoryId: 'cat-life',
    icon: 'UserX',
    sortOrder: 4,
  },
  {
    id: 'ptype-unemployment',
    key: 'unemployment_protection',
    name: 'Desempleo / Protección de Pagos',
    shortName: 'Protec. Pagos',
    description: 'Cubre pagos de deudas si el titular pierde el empleo.',
    categoryId: 'cat-life',
    icon: 'Briefcase',
    sortOrder: 5,
  },

  // ═══════════════════════════════════════════════════
  // CATEGORÍA 3 — MOVILIDAD Y BIENES
  // ═══════════════════════════════════════════════════
  {
    id: 'ptype-auto',
    key: 'auto',
    name: 'Auto',
    shortName: 'Auto',
    description: 'Seguros de automóvil: cobertura básica, completa y responsabilidad civil.',
    categoryId: 'cat-mobility',
    icon: 'Car',
    sortOrder: 1,
  },
  {
    id: 'ptype-home',
    key: 'home_property',
    name: 'Hogar / Propiedad',
    shortName: 'Hogar',
    description: 'Homeowners y Renters. Cubre estructura, contenido, robo, incendio, etc.',
    categoryId: 'cat-mobility',
    icon: 'Home',
    sortOrder: 2,
  },
  {
    id: 'ptype-pet',
    key: 'pet',
    name: 'Mascotas',
    shortName: 'Mascotas',
    description: 'Cubre gastos veterinarios, cirugías y medicamentos para perros y gatos.',
    categoryId: 'cat-mobility',
    icon: 'PawPrint',
    sortOrder: 3,
  },
  {
    id: 'ptype-gap',
    key: 'gap_insurance',
    name: 'GAP Insurance',
    shortName: 'GAP',
    description: 'Cubre la diferencia entre lo que paga el seguro de auto y la deuda pendiente.',
    categoryId: 'cat-mobility',
    icon: 'TrendingDown',
    sortOrder: 4,
  },
  {
    id: 'ptype-roadside',
    key: 'roadside_assistance',
    name: 'Asistencia en Carretera',
    shortName: 'Roadside',
    description: 'Grúa, cambio de llanta, apertura de puertas, combustible de emergencia.',
    categoryId: 'cat-mobility',
    icon: 'Wrench',
    sortOrder: 5,
  },
  {
    id: 'ptype-electronics',
    key: 'electronics',
    name: 'Equipos Electrónicos',
    shortName: 'Electrónicos',
    description: 'Protección para celulares, laptops, tablets y cámaras.',
    categoryId: 'cat-mobility',
    icon: 'Smartphone',
    sortOrder: 6,
  },

  // ═══════════════════════════════════════════════════
  // CATEGORÍA 4 — ESPECIALES Y VIAJES
  // ═══════════════════════════════════════════════════
  {
    id: 'ptype-travel',
    key: 'travel',
    name: 'Viaje',
    shortName: 'Viaje',
    description: 'Cobertura en viajes: cancelación, equipaje, emergencias médicas.',
    categoryId: 'cat-special',
    icon: 'Plane',
    sortOrder: 1,
  },
  {
    id: 'ptype-funeral',
    key: 'funeral',
    name: 'Funerario',
    shortName: 'Funerario',
    description: 'Cubre gastos funerarios: ataúd, ceremonia, cementerio. Puede ser prepago.',
    categoryId: 'cat-special',
    icon: 'Church',
    sortOrder: 2,
  },
  {
    id: 'ptype-liability',
    key: 'liability',
    name: 'Responsabilidad Civil',
    shortName: 'Resp. Civil',
    description: 'Protege si el titular causa daños a terceros (personales o materiales).',
    categoryId: 'cat-special',
    icon: 'Shield',
    sortOrder: 3,
  },
  {
    id: 'ptype-cyber',
    key: 'cyber',
    name: 'Ciberseguridad',
    shortName: 'Cyber',
    description: 'Protección contra robo de identidad, fraude en línea y extorsión digital.',
    categoryId: 'cat-special',
    icon: 'Lock',
    sortOrder: 4,
  },
  {
    id: 'ptype-intl-medical',
    key: 'international_medical',
    name: 'Asistencia Médica Internacional',
    shortName: 'Asist. Intl.',
    description: 'Cobertura médica cuando el titular viaja o reside fuera de su país.',
    categoryId: 'cat-special',
    icon: 'Globe2',
    sortOrder: 5,
  },
  {
    id: 'ptype-personal-assistance',
    key: 'personal_assistance',
    name: 'Asistencia Personal/Comercial',
    shortName: 'Asistencia',
    description: 'Servicios de asistencia: plomería, electricidad, cerrajería, emergencias.',
    categoryId: 'cat-special',
    icon: 'HandHeart',
    sortOrder: 6,
  },

  // ═══════════════════════════════════════════════════
  // CATEGORÍA 5 — COMERCIAL / PROFESIONALES
  // ═══════════════════════════════════════════════════
  {
    id: 'ptype-professional-liability',
    key: 'professional_liability',
    name: 'Responsabilidad Profesional (E&O)',
    shortName: 'E&O',
    description: 'Errors & Omissions. Protege a profesionales por errores en su trabajo.',
    categoryId: 'cat-business',
    icon: 'UserCheck',
    sortOrder: 1,
  },
  {
    id: 'ptype-business-owners',
    key: 'business_owners_policy',
    name: 'Multirriesgo PyME (BOP)',
    shortName: 'BOP',
    description: 'Business Owners Policy. Combina cobertura de propiedad + responsabilidad civil.',
    categoryId: 'cat-business',
    icon: 'Building2',
    sortOrder: 2,
  },
  {
    id: 'ptype-surety-bonds',
    key: 'surety_bonds',
    name: 'Caución / Fianzas',
    shortName: 'Fianzas',
    description: 'Garantiza el cumplimiento de obligaciones contractuales o legales.',
    categoryId: 'cat-business',
    icon: 'FileSignature',
    sortOrder: 3,
  },
];