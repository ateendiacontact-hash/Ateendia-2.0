// ===========================================
// server/types/landing.ts
// Tipos para la configuración de la landing page SaaS
// ===========================================

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

export interface SaasLandingConfig {
  hero: LandingHero;
  features: LandingFeature[];
  testimonials: LandingTestimonial[];
  footer: LandingFooter;
}