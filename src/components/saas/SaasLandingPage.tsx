import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  Phone, 
  Building2, 
  Users, 
  User,
  Shield, 
  Zap, 
  Globe, 
  Star, 
  MessageSquare, 
  CreditCard, 
  Database, 
  Cpu, 
  Loader2,
  ChevronRight,
  Lock,
  Award
} from 'lucide-react';
import { pb, COLLECTIONS, n8nService, paymentService } from '../../services';

export const SaasLandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'features' | 'pricing' | 'demo' | 'register'>('features');
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    employees: '1-5',
    message: '',
  });
  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    subdomain: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    planId: 'pro',
    billingCycle: 'monthly' as 'monthly' | 'annual',
    paymentMethod: 'stripe' as 'stripe' | 'paypal' | 'bank_transfer' | 'zelle' | 'crypto_usdt',
  });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 79,
      annualPrice: 790,
      description: 'Ideal para agentes independientes',
      features: [
        'Hasta 5 usuarios',
        '5,000 clientes',
        '1 línea WhatsApp',
        '20 GB almacenamiento',
        'Pipeline de ventas',
        'Plantillas de mensajes',
        'Reportes básicos',
        'Soporte por email',
      ],
      popular: false,
    },
    {
      id: 'pro',
      name: 'Pro Business',
      price: 149,
      annualPrice: 1490,
      description: 'Para agencias en crecimiento',
      features: [
        'Hasta 10 usuarios',
        '25,000 clientes',
        '2 líneas WhatsApp',
        '50 GB almacenamiento',
        'Pipeline múltiple',
        'Campañas masivas',
        'Integración n8n',
        'IA Assistant básico',
        'Soporte prioritario',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      annualPrice: 2990,
      description: 'Para grandes organizaciones',
      features: [
        'Hasta 25 usuarios',
        'Clientes ilimitados',
        '5 líneas WhatsApp',
        '100 GB almacenamiento',
        'Todo en Pro +',
        'IA Assistant avanzado',
        'PBX Issabel integrado',
        'Bases de datos dedicadas',
        'SLA 99.9%',
        'Soporte 24/7 dedicado',
        'Onboarding personalizado',
      ],
      popular: false,
    },
  ];

  const features = [
    { icon: Users, title: 'Gestión de Clientes 360°', desc: 'Perfil completo con pólizas, documentos, notas, bancos y bitácora de actividades.' },
    { icon: Globe, title: 'Pipeline de Ventas Visual', desc: 'Kanban drag-and-drop con origen de lead (Web, WhatsApp, Ads, Llamadas) y agente asignado.' },
    { icon: MessageSquare, title: 'WhatsApp Cloud Multi-Línea', desc: 'Hasta 5 líneas simultáneas con QR, chatbot IA, plantillas y respuestas automáticas.' },
    { icon: Cpu, title: 'Inteligencia Artificial Integrada', desc: 'Chatbot con RAG para seguros ACA/Vida, auto-responder 24/7 y análisis de sentimientos.' },
    { icon: Zap, title: 'Automatizaciones n8n', desc: 'Webhooks bidireccionales, flujos visuales, Google Sheets, Telegram, Slack y más.' },
    { icon: Database, title: 'Multi-Tenant SaaS Seguro', desc: 'Aislamiento de datos por empresa, roles granulares, auditoría inmutable y backup automático.' },
    { icon: CreditCard, title: 'Facturación y Cobranza', desc: 'Métodos de pago, domiciliación ACH, tarjetas, recordatorios automáticos y conciliación.' },
    { icon: Phone, title: 'PBX Issabel Click-to-Call', desc: 'Llamadas desde el CRM, grabación, CDR, colas IVR y softphone WebRTC integrado.' },
    { icon: Shield, title: 'Cumplimiento y Seguridad', desc: 'Encriptación AES-256, 2FA, logs de auditoría, anti-spam, LGPD/HIPAA ready.' },
  ];

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitting(true);
    setError(null);

    try {
      // Save to PocketBase
      const record = await pb.collection(COLLECTIONS.DEMO_REQUESTS).create({
        ...demoForm,
        status: 'new',
        submittedAt: new Date().toISOString(),
        source: 'landing_general',
      });

      // Send to n8n
      await n8nService.emitLeadCreated({ ...demoForm, requestId: record.id });

      setDemoSuccess(true);
      setDemoForm({ name: '', email: '', phone: '', company: '', employees: '1-5', message: '' });
    } catch (e: any) {
      setError(e.message || 'Error al enviar solicitud');
    } finally {
      setDemoSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterSubmitting(true);
    setError(null);

    try {
      const selectedPlan = plans.find(p => p.id === registerForm.planId);
      const amount = registerForm.billingCycle === 'annual' 
        ? (selectedPlan?.annualPrice || selectedPlan?.price * 10) 
        : (selectedPlan?.price || 149);

      // Create pending tenant
      const record = await pb.collection(COLLECTIONS.TENANTS_PENDING).create({
        ...registerForm,
        amount,
        currency: 'USD',
        status: 'pending_payment',
        submittedAt: new Date().toISOString(),
        source: 'landing_general',
      });

      // Send to n8n
      await n8nService.sendWebhook('tenant.registration', { 
        pendingId: record.id, 
        ...registerForm, 
        amount,
        planName: selectedPlan?.name 
      });

      setRegisterSuccess(true);
      setRegisterForm({
        companyName: '',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPhone: '',
        planId: 'pro',
        billingCycle: 'monthly',
        paymentMethod: 'stripe',
      });
    } catch (e: any) {
      setError(e.message || 'Error al registrar empresa');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  const scrollToSection = (section: string) => {
    setActiveTab(section as any);
    const element = document.getElementById(section);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900">Ateendia CRM</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-600 hover:text-purple-600">Características</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-slate-600 hover:text-purple-600">Planes</button>
              <button onClick={() => scrollToSection('demo')} className="text-sm font-medium text-slate-600 hover:text-purple-600">Demo</button>
              <button onClick={() => scrollToSection('register')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700">Comenzar Gratis</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" />
            <span>Nuevo: IA Assistant + n8n + PBX Integrado</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
            CRM de Seguros <span className="text-purple-600">Todo en Uno</span> para Agencias
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Gestiona clientes, pólizas ACA/Vida, WhatsApp, llamadas, cobranza y automatizaciones 
            en una sola plataforma. Multi-tenant, seguro y listo para escalar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => scrollToSection('demo')} className="px-8 py-4 bg-purple-600 text-white rounded-xl text-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Solicitar Demo Gratis
            </button>
            <button onClick={() => scrollToSection('register')} className="px-8 py-4 bg-slate-900 text-white rounded-xl text-lg font-bold hover:bg-slate-700 transition-colors flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Crear mi Cuenta
            </button>
          </div>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>14 días gratis</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Sin tarjeta de crédito</span></div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Cancela 언제든</span></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Todo lo que tu agencia necesita</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Potencia tus ventas con herramientas diseñadas específicamente para seguros de salud y vida.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Planes simples y transparentes</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Sin sorpresas. Todas las funciones incluidas. Escala cuando lo necesites.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative p-8 rounded-3xl bg-white border-2 ${
                plan.popular 
                  ? 'border-purple-500 shadow-xl shadow-purple-500/10' 
                  : 'border-slate-200 hover:border-purple-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                    Más Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-slate-600 text-sm mt-1">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                    <span className="text-slate-500">/mes</span>
                  </div>
                  <p className="text-sm text-emerald-600 font-semibold mt-1">
                    {plan.annualPrice && `Ahorra ${Math.round((plan.price * 12 - plan.annualPrice) / (plan.price * 12) * 100)}% anual ($${plan.annualPrice}/año)`}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => {
                    registerForm.planId = plan.id;
                    scrollToSection('register');
                  }}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-colors ${
                    plan.popular 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-slate-100 text-slate-900 hover:bg-purple-50 hover:text-purple-700 border border-slate-200'
                  }`}
                >
                  {plan.popular ? 'Empezar Ahora' : 'Elegir Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Request Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Solicita tu Demo Personalizada</h2>
            <p className="text-lg text-slate-600">Un especialista te contactará en menos de 24h para mostrarte el CRM en vivo.</p>
          </div>
          {demoSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-800 mb-2">¡Demo Solicitada!</h3>
              <p className="text-emerald-700">Te contactaremos pronto a <strong>{demoForm.email}</strong> para agendar tu demo personalizada.</p>
              <button onClick={() => setDemoSuccess(false)} className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">Volver</button>
            </div>
          ) : (
            <form onSubmit={handleDemoSubmit} className="bg-slate-50/50 p-8 rounded-3xl border border-slate-200 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre *</label>
                  <input type="text" value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none" placeholder="Juan Pérez" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email corporativo *</label>
                  <input type="email" value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none" placeholder="juan@empresa.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono *</label>
                  <input type="tel" value={demoForm.phone} onChange={e => setDemoForm({...demoForm, phone: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none" placeholder="+1 (786) 555-0199" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Empresa / Agencia *</label>
                  <input type="text" value={demoForm.company} onChange={e => setDemoForm({...demoForm, company: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none" placeholder="Seguros ABC" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Número de asesores</label>
                  <select value={demoForm.employees} onChange={e => setDemoForm({...demoForm, employees: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none">
                    <option value="1-5">1-5 asesores</option>
                    <option value="6-15">6-15 asesores</option>
                    <option value="16-50">16-50 asesores</option>
                    <option value="50+">50+ asesores</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mensaje adicional</label>
                <textarea value={demoForm.message} onChange={e => setDemoForm({...demoForm, message: e.target.value})} rows={3} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none" placeholder="Cuéntanos qué necesitas..." />
              </div>
              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}
              <button type="submit" disabled={demoSubmitting} className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {demoSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enviar Solicitud <ChevronRight className="w-5 h-5" /></>}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Register Section */}
      <section id="register" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">Crea tu Cuenta en Minutos</h2>
            <p className="text-lg text-slate-600">Configura tu agencia, elige tu plan y empieza a vender hoy mismo.</p>
          </div>
          {registerSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-800 mb-2">¡Empresa Registrada!</h3>
              <p className="text-emerald-700 mb-4">Hemos recibido tu solicitud. Revisaremos el pago y activaremos tu cuenta en menos de 2 horas.</p>
              <p className="text-emerald-600 text-sm">Recibirás un email en <strong>{registerForm.adminEmail}</strong> con los siguientes pasos.</p>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2"><Lock className="w-5 h-5" /> Información de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Agencia *</label>
                    <input type="text" value={registerForm.companyName} onChange={e => setRegisterForm({...registerForm, companyName: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500" placeholder="Seguros Mi Empresa" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Subdominio *</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={registerForm.subdomain} onChange={e => setRegisterForm({...registerForm, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500" placeholder="mi-empresa" />
                      <span className="text-slate-500">.ateendia.cloud</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><User className="w-5 h-5" /> Administrador Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre completo *</label>
                    <input type="text" value={registerForm.adminName} onChange={e => setRegisterForm({...registerForm, adminName: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500" placeholder="María González" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
                    <input type="email" value={registerForm.adminEmail} onChange={e => setRegisterForm({...registerForm, adminEmail: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500" placeholder="maria@miempresa.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono (WhatsApp) *</label>
                    <input type="tel" value={registerForm.adminPhone} onChange={e => setRegisterForm({...registerForm, adminPhone: e.target.value})} required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500" placeholder="+1 (786) 555-0199" />
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2"><Award className="w-5 h-5" /> Plan y Facturación</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {plans.map(plan => (
                    <button 
                      type="button"
                      onClick={() => setRegisterForm({...registerForm, planId: plan.id})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${registerForm.planId === plan.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                    >
                      <div className="font-bold text-slate-900">{plan.name}</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1">${plan.price}/mes</div>
                      <div className="text-xs text-slate-500 mt-1">{plan.features.length} funciones incluidas</div>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Ciclo de facturación</label>
                    <select value={registerForm.billingCycle} onChange={e => setRegisterForm({...registerForm, billingCycle: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500">
                      <option value="monthly">Mensual</option>
                      <option value="annual">Anual (2 meses gratis)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Método de pago inicial</label>
                    <select value={registerForm.paymentMethod} onChange={e => setRegisterForm({...registerForm, paymentMethod: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-500">
                      <option value="stripe">Tarjeta (Stripe)</option>
                      <option value="paypal">PayPal</option>
                      <option value="bank_transfer">Transferencia Bancaria</option>
                      <option value="zelle">Zelle</option>
                      <option value="crypto_usdt">USDT Crypto</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-sm">{error}</div>}
              <button type="submit" disabled={registerSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {registerSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Crear mi Cuenta <ArrowRight className="w-5 h-5" /></>}
              </button>
              <p className="text-center text-xs text-slate-500">Al continuar, aceptas nuestros <a href="#" className="text-purple-600 hover:underline">Términos de Servicio</a> y <a href="#" className="text-purple-600 hover:underline">Política de Privacidad</a></p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">Ateendia CRM</span>
            </div>
            <p className="text-slate-400 text-sm">CRM SaaS multi-tenant para agencias de seguros de salud y vida. Potenciado por IA.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Producto</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-purple-400">Características</a></li>
              <li><a href="#pricing" className="hover:text-purple-400">Precios</a></li>
              <li><a href="#demo" className="hover:text-purple-400">Demo</a></li>
              <li><a href="#" className="hover:text-purple-400">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Empresa</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-400">Nosotros</a></li>
              <li><a href="#" className="hover:text-purple-400">Blog</a></li>
              <li><a href="#" className="hover:text-purple-400">Carreras</a></li>
              <li><a href="#" className="hover:text-purple-400">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-purple-400">Privacidad</a></li>
              <li><a href="#" className="hover:text-purple-400">Términos</a></li>
              <li><a href="#" className="hover:text-purple-400">Cookies</a></li>
              <li><a href="#" className="hover:text-purple-400">Seguridad</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
          © 2026 Ateendia CRM. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export default SaasLandingPage;