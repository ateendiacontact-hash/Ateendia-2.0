// ===========================================
// server/prisma/seeds/policyCategories.ts
// Definición de las 5 categorías de seguros.
// ===========================================

export interface PolicyCategoryDef {
  id: string;
  key: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  sortOrder: number;
}

export const POLICY_CATEGORIES: PolicyCategoryDef[] = [
  {
    id: 'cat-health',
    key: 'health_wellness',
    name: 'Salud y Bienestar',
    description: 'Seguros médicos, dentales, de enfermedades graves y hospitalización',
    icon: 'HeartPulse',
    color: '#ef4444',
    sortOrder: 1,
  },
  {
    id: 'cat-life',
    key: 'life_finance',
    name: 'Vida y Finanzas Personales',
    description: 'Seguros de vida, accidentes, incapacidad y protección financiera',
    icon: 'ShieldCheck',
    color: '#3b82f6',
    sortOrder: 2,
  },
  {
    id: 'cat-mobility',
    key: 'mobility_property',
    name: 'Movilidad y Bienes',
    description: 'Seguros de auto, hogar, mascotas y equipos electrónicos',
    icon: 'Car',
    color: '#10b981',
    sortOrder: 3,
  },
  {
    id: 'cat-special',
    key: 'special_travel',
    name: 'Especiales y Viajes',
    description: 'Seguros de viaje, funerarios, cibernéticos y asistencia internacional',
    icon: 'Globe',
    color: '#f59e0b',
    sortOrder: 4,
  },
  {
    id: 'cat-business',
    key: 'business_professional',
    name: 'Comercial / Profesionales',
    description: 'Seguros para empresas y profesionales independientes',
    icon: 'Briefcase',
    color: '#8b5cf6',
    sortOrder: 5,
  },
];