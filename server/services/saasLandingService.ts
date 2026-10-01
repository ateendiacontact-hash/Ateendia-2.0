// ============================================
// server/services/saasLandingService.ts
// Lógica de negocio para la configuración de la landing page SaaS
// ============================================

import { prisma } from '../db.js';
import type {
  SaasLandingConfig,
  LandingHero,
  LandingFeature,
  LandingTestimonial,
  LandingFooter,
} from '../types/landing.js';

// ─────────────────────────────────────────────
// Configuración por defecto
// ─────────────────────────────────────────────
const DEFAULT_LANDING_CONFIG: SaasLandingConfig = {
  hero: {
    title: 'Ateendia CRM',
    subtitle: 'La plataforma todo-en-uno para agencias de seguros y servicios financieros',
    ctaText: 'Comenzar gratis',
    ctaLink: '/register',
    backgroundImage: null,
  },
  features: [
    {
      icon: 'Users',
      title: 'Gestión de Clientes',
      description: 'Centraliza toda la información de tus clientes en un solo lugar.',
    },
    {
      icon: 'Shield',
      title: 'Pólizas de Seguros',
      description: 'Administra 13 tipos de pólizas con formularios dinámicos.',
    },
    {
      icon: 'MessageCircle',
      title: 'Multibandeja',
      description: 'WhatsApp, Telegram, Email, Instagram y más en una sola interfaz.',
    },
    {
      icon: 'Brain',
      title: 'IA Integrada',
      description: 'Resúmenes automáticos y respuestas sugeridas con inteligencia artificial.',
    },
  ],
  testimonials: [
    {
      name: 'Cliente Demo',
      company: 'Agencia de Seguros',
      text: 'Ateendia transformó nuestra operación. Ahora todo está centralizado y automatizado.',
      avatarUrl: null,
    },
  ],
  footer: {
    email: 'contacto@ateendia.cloud',
    whatsapp: '+584241234567',
    social: {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: '',
    },
  },
};

const SETTINGS_ID = 'global';

// ─────────────────────────────────────────────
// Validadores
// ─────────────────────────────────────────────
function isValidHero(hero: unknown): hero is LandingHero {
  if (!hero || typeof hero !== 'object') return false;
  const h = hero as Record<string, unknown>;
  return (
    typeof h.title === 'string' &&
    typeof h.subtitle === 'string' &&
    typeof h.ctaText === 'string' &&
    typeof h.ctaLink === 'string'
  );
}

function isValidFeature(feature: unknown): feature is LandingFeature {
  if (!feature || typeof feature !== 'object') return false;
  const f = feature as Record<string, unknown>;
  return (
    typeof f.icon === 'string' &&
    typeof f.title === 'string' &&
    typeof f.description === 'string'
  );
}

function isValidTestimonial(testimonial: unknown): testimonial is LandingTestimonial {
  if (!testimonial || typeof testimonial !== 'object') return false;
  const t = testimonial as Record<string, unknown>;
  return (
    typeof t.name === 'string' &&
    typeof t.company === 'string' &&
    typeof t.text === 'string'
  );
}

function isValidFooter(footer: unknown): footer is LandingFooter {
  if (!footer || typeof footer !== 'object') return false;
  const f = footer as Record<string, unknown>;
  return typeof f.email === 'string' && typeof f.whatsapp === 'string';
}

export function normalizeLandingConfig(input: unknown): SaasLandingConfig {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_LANDING_CONFIG };
  }

  const raw = input as Partial<SaasLandingConfig>;

  return {
    hero: isValidHero(raw.hero) ? raw.hero : DEFAULT_LANDING_CONFIG.hero,
    features:
      Array.isArray(raw.features) && raw.features.every(isValidFeature)
        ? raw.features
        : DEFAULT_LANDING_CONFIG.features,
    testimonials:
      Array.isArray(raw.testimonials) && raw.testimonials.every(isValidTestimonial)
        ? raw.testimonials
        : DEFAULT_LANDING_CONFIG.testimonials,
    footer: isValidFooter(raw.footer) ? raw.footer : DEFAULT_LANDING_CONFIG.footer,
  };
}

// ─────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────

export async function getLandingConfig(): Promise<SaasLandingConfig> {
  const settings = await prisma.saas_platform_settings.findUnique({
    where: { id: SETTINGS_ID },
    select: { landing_config_json: true },
  });

  if (!settings?.landing_config_json) {
    return { ...DEFAULT_LANDING_CONFIG };
  }

  try {
    const parsed = JSON.parse(settings.landing_config_json);
    return normalizeLandingConfig(parsed);
  } catch (error) {
    console.error('[saasLandingService] Error parsing landing_config_json:', error);
    return { ...DEFAULT_LANDING_CONFIG };
  }
}

export async function updateLandingConfig(
  config: Partial<SaasLandingConfig>
): Promise<SaasLandingConfig> {
  const normalized = normalizeLandingConfig(config);

  await prisma.saas_platform_settings.update({
    where: { id: SETTINGS_ID },
    data: {
      landing_config_json: JSON.stringify(normalized),
    },
  });

  return normalized;
}

export function getDefaultLandingConfig(): SaasLandingConfig {
  return { ...DEFAULT_LANDING_CONFIG };
}