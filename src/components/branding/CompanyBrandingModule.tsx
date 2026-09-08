import React, { useState } from 'react';
import {
  Palette,
  Building,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Sliders,
  Settings2,
  CreditCard,
  Globe
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { CompanyPlanBillingTab } from './CompanyPlanBillingTab';
import { CompanyMicroLandingTab } from './CompanyMicroLandingTab';

export const CompanyBrandingModule: React.FC = () => {
  const { currentTenant, updateTenantBranding } = useTenant();

  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'microlanding' | 'billing'>('branding');
  const [companyName, setCompanyName] = useState(currentTenant.name);
  const [primaryColor, setPrimaryColor] = useState(currentTenant.primaryColor || '#7C3AED');
  const [accentColor, setAccentColor] = useState(currentTenant.accentColor || '#10B981');
  const [logoUrl, setLogoUrl] = useState(currentTenant.logoUrl || '');
  const [timezone, setTimezone] = useState(currentTenant.timezone || 'America/New_York');
  const [currency, setCurrency] = useState(currentTenant.currency || 'USD');

  // Master Catalogs State
  const [categories, setCategories] = useState<string[]>(
    currentTenant.categories || ['Seguro de Salud / ACA', 'Seguro de Vida', 'Dental & Visión', 'Medicare']
  );
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Custom Fields State
  const [customFields, setCustomFields] = useState<any[]>(
    currentTenant.customFields || [
      { id: 'cf-1', label: 'Estatus Migratorio', type: 'select', required: false },
      { id: 'cf-2', label: 'Ingreso Anual Estimado ($)', type: 'number', required: true }
    ]
  );
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantBranding({
      name: companyName,
      primaryColor,
      accentColor,
      logoUrl,
      timezone,
      currency,
      categories,
      customFields
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    setCategories([...categories, newCategoryInput.trim()]);
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields([
      ...customFields,
      {
        id: `cf-${Date.now()}`,
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: false
      }
    ]);
    setNewFieldLabel('');
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Personalización Multi-Empresa & Configuración</h1>
            <p className="text-xs text-slate-500">
              Configura colores, logotipos, catálogos maestros y consulta tu plan de suscripción para {currentTenant.name}.
            </p>
          </div>
        </div>

        {activeSubTab === 'branding' && (
          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Todo el Branding</span>
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('branding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'branding'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Identidad de Marca & Catálogos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('microlanding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'microlanding'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Micro-Landing Web & Captación</span>
        </button>

        <button
          onClick={() => setActiveSubTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'billing'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plan SaaS & Facturación</span>
        </button>
      </div>

      {activeSubTab === 'billing' ? (
        <CompanyPlanBillingTab />
      ) : activeSubTab === 'microlanding' ? (
        <CompanyMicroLandingTab />
      ) : (
        <>
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Personalización guardada exitosamente para la empresa!</span>
            </div>
          )}

          {/* Grid: Identity on Left, Master Catalogs & Fields on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Identidad Visual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              Identidad de Empresa & Colores
            </h2>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Comercial de la Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Primario (Marca)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Color Acento</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 border rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zona Horaria</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
                >
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="America/Caracas">America/Caracas (VET)</option>
                  <option value="America/Bogota">America/Bogota (COT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Moneda Principal</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold text-purple-700"
                >
                  <option value="USD">USD ($ - Dólares)</option>
                  <option value="EUR">EUR (€ - Euros)</option>
                  <option value="COP">COP ($ - Pesos Col)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Master Catalogs & Dynamic Custom Fields */}
        <div className="space-y-6">
          {/* Master Categories Catalog */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Catálogo Maestro de Categorías
                </h2>
              </div>
            </div>

            {/* List */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat, i) => (
                <div
                  key={i}
                  className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(i)}
                    className="text-purple-400 hover:text-rose-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add inline */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="Nueva categoría (ej: Accidentes Personales)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border rounded-xl text-xs font-medium"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Dynamic Custom Fields Builder */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Campos Personalizados del Cliente
                </h2>
              </div>
            </div>

            <div className="space-y-2">
              {customFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <div className="font-semibold text-slate-800">{field.label}</div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono rounded">
                      {field.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new field */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="Nombre del campo..."
                className="col-span-2 px-3 py-1.5 bg-slate-50 border rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddField}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear</span>
              </button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
