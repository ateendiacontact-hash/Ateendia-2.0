// ===========================================
// server/types/landing.ts
// Tipos para la configuración de la landing page SaaS
// ===========================================
//
// NOTA (Sesión 3.5.B.3): el tipo principal se renombró de
// `SaasLandingConfig` a `SaasLandingContentConfig` para evitar
// colisión con el `SaasLandingConfig` del frontend (que es el
// CMS completo del Super Admin, con crmName, heroBadge, etc.).

export interface LandingHero {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  backgroundImage?: string | null;
}

export interface LandingFeature {
  icon: string;
  title: string;
  description: string;
}

export interface LandingTestimonial {
  name: string;
  company: string;
  text: string;
  avatarUrl?: string | null;
}

export interface LandingFooter {
  email: string;
  whatsapp: string;
  social: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
}

/**
 * Configuración de CONTENIDO de la landing page SaaS.
 *
 * Contiene los bloques editables por el Super Admin desde el panel:
 * hero, features, testimonios, footer.
 *
 * Se guarda como JSON en `saas_platform_settings.landing_config_json`.
 *
 * ⚠️ NO confundir con `SaasLandingConfig` del frontend
 * (CMS completo con crmName, pricingPlans, heroBadge, etc.).
 */
export interface SaasLandingContentConfig {
  hero: LandingHero;
  features: LandingFeature[];
  testimonials: LandingTestimonial[];
  footer: LandingFooter;
}