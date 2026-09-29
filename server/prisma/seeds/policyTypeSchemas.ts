// ===========================================
// server/prisma/seeds/policyTypeSchemas.ts
// Definición de los ~210 campos específicos por tipo de póliza.
//
// Estructura: cada tipo tiene un array de PolicyFieldDef.
// El seed usa este archivo para poblar `policy_type_schemas`.
//
// Los campos comunes (número de póliza, prima, fechas) NO están aquí.
// Están en la tabla `policies` como columnas.
// ===========================================

export interface PolicyFieldDef {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'decimal'
    | 'currency'
    | 'percentage'
    | 'date'
    | 'boolean'
    | 'select'
    | 'multiselect'
    | 'email'
    | 'phone'
    | 'ssn'
    | 'vin'
    | 'plate';
  section?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
  description?: string;
  validation?: Record<string, any>;
}

/**
 * Mapa: typeKey → array de campos.
 * Se importa desde seed.ts y se inserta en policy_type_schemas.
 */
export const POLICY_TYPE_SCHEMAS: Record<string, PolicyFieldDef[]> = {

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA 1 — SALUD Y BIENESTAR
  // ═══════════════════════════════════════════════════════

  health_aca: [
    { key: 'plan_level', label: 'Nivel de Plan', type: 'select', section: 'Cobertura', required: true,
      options: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Catastrophic'] },
    { key: 'deductible_individual', label: 'Deducible Individual', type: 'currency', section: 'Cobertura', required: true },
    { key: 'deductible_family', label: 'Deducible Familiar', type: 'currency', section: 'Cobertura' },
    { key: 'out_of_pocket_max', label: 'Out-of-Pocket Máximo', type: 'currency', section: 'Cobertura', required: true },
    { key: 'copay_consultation', label: 'Copago Consulta', type: 'currency', section: 'Copagos' },
    { key: 'copay_specialist', label: 'Copago Especialista', type: 'currency', section: 'Copagos' },
    { key: 'copay_emergency', label: 'Copago Emergencia', type: 'currency', section: 'Copagos' },
    { key: 'network_type', label: 'Tipo de Red', type: 'select', section: 'Red Médica',
      options: ['HMO', 'PPO', 'EPO', 'POS'] },
    { key: 'covers_preexisting', label: 'Cubre Preexistencias', type: 'boolean', section: 'Cobertura Adicional', defaultValue: 'true' },
    { key: 'covers_dental', label: 'Cubre Dental', type: 'boolean', section: 'Cobertura Adicional' },
    { key: 'covers_vision', label: 'Cubre Visión', type: 'boolean', section: 'Cobertura Adicional' },
    { key: 'covers_prescriptions', label: 'Cubre Medicamentos', type: 'boolean', section: 'Cobertura Adicional', defaultValue: 'true' },
  ],

  health_private: [
    { key: 'plan_level', label: 'Nivel de Plan', type: 'select', section: 'Cobertura', required: true,
      options: ['Básico', 'Estándar', 'Premium', 'Élite'] },
    { key: 'network_name', label: 'Nombre de la Red Médica', type: 'text', section: 'Red Médica', required: true },
    { key: 'deductible_individual', label: 'Deducible Individual', type: 'currency', section: 'Cobertura', required: true },
    { key: 'deductible_family', label: 'Deducible Familiar', type: 'currency', section: 'Cobertura' },
    { key: 'out_of_pocket_max', label: 'Out-of-Pocket Máximo', type: 'currency', section: 'Cobertura' },
    { key: 'copay_consultation', label: 'Copago Consulta', type: 'currency', section: 'Copagos' },
    { key: 'copay_specialist', label: 'Copago Especialista', type: 'currency', section: 'Copagos' },
    { key: 'covers_maternity', label: 'Cubre Maternidad', type: 'boolean', section: 'Cobertura Adicional' },
    { key: 'covers_dental', label: 'Cubre Dental', type: 'boolean', section: 'Cobertura Adicional' },
    { key: 'covers_vision', label: 'Cubre Visión', type: 'boolean', section: 'Cobertura Adicional' },
  ],

  health_major_medical: [
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura', required: true },
    { key: 'annual_limit', label: 'Límite Anual', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_surgeries', label: 'Cubre Cirugías', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_hospitalization', label: 'Cubre Hospitalización', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_special_treatments', label: 'Cubre Tratamientos Especiales', type: 'boolean', section: 'Cobertura' },
    { key: 'exclusions', label: 'Exclusiones', type: 'textarea', section: 'Detalles' },
  ],

  dental_vision: [
    { key: 'covers_cleanings', label: 'Cubre Limpiezas', type: 'boolean', section: 'Dental', defaultValue: 'true' },
    { key: 'covers_orthodontics', label: 'Cubre Ortodoncia', type: 'boolean', section: 'Dental' },
    { key: 'annual_dental_limit', label: 'Límite Anual Dental', type: 'currency', section: 'Dental' },
    { key: 'copay_vision_exam', label: 'Copago Examen de Vista', type: 'currency', section: 'Visión' },
    { key: 'covers_glasses', label: 'Cubre Lentes/Armazones', type: 'boolean', section: 'Visión', defaultValue: 'true' },
    { key: 'covers_contacts', label: 'Cubre Lentes de Contacto', type: 'boolean', section: 'Visión' },
  ],

  critical_illness: [
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covered_illnesses', label: 'Enfermedades Cubiertas', type: 'textarea', section: 'Cobertura', required: true },
    { key: 'waiting_period_days', label: 'Periodo de Espera (días)', type: 'number', section: 'Términos' },
    { key: 'max_age', label: 'Edad Máxima de Contratación', type: 'number', section: 'Términos' },
    { key: 'renewable', label: 'Renovable', type: 'boolean', section: 'Términos', defaultValue: 'true' },
  ],

  hospital_indemnity: [
    { key: 'daily_payment', label: 'Pago por Día Hospitalizado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'max_days', label: 'Máx. Días Cubiertos', type: 'number', section: 'Cobertura', required: true },
    { key: 'covers_icu', label: 'Cubre UCI', type: 'boolean', section: 'Cobertura' },
    { key: 'icu_daily_payment', label: 'Pago UCI por Día', type: 'currency', section: 'Cobertura' },
    { key: 'covers_surgery', label: 'Cubre Cirugía', type: 'boolean', section: 'Cobertura' },
    { key: 'surgery_payment', label: 'Pago por Cirugía', type: 'currency', section: 'Cobertura' },
  ],

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA 2 — VIDA Y FINANZAS PERSONALES
  // ═══════════════════════════════════════════════════════

  life: [
    { key: 'life_type', label: 'Tipo de Vida', type: 'select', section: 'Cobertura', required: true,
      options: ['Término', 'IUL', 'Whole Life', 'Universal', 'Final Expense'] },
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'term_years', label: 'Plazo (años)', type: 'number', section: 'Cobertura' },
    { key: 'beneficiaries', label: 'Beneficiarios', type: 'textarea', section: 'Beneficiarios',
      placeholder: 'Nombre, %, Relación — uno por línea' },
    { key: 'medical_exam_required', label: 'Requiere Examen Médico', type: 'boolean', section: 'Términos' },
    { key: 'max_age', label: 'Edad Máxima de Contratación', type: 'number', section: 'Términos' },
  ],

  personal_accident: [
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_accidental_death', label: 'Cubre Muerte Accidental', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_disability', label: 'Cubre Invalidez', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_medical_expenses', label: 'Cubre Gastos Médicos por Accidente', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_dismemberment', label: 'Cubre Desmembramiento', type: 'boolean', section: 'Cobertura' },
    { key: 'excluded_activities', label: 'Actividades Excluidas', type: 'textarea', section: 'Términos' },
  ],

  indemnity: [
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covered_reason', label: 'Motivo Cubierto', type: 'textarea', section: 'Cobertura', required: true },
    { key: 'beneficiary', label: 'Beneficiario Designado', type: 'text', section: 'Beneficiarios' },
    { key: 'coverage_period', label: 'Periodo de Cobertura', type: 'text', section: 'Términos' },
    { key: 'max_age', label: 'Edad Máxima', type: 'number', section: 'Términos' },
  ],

  disability: [
    { key: 'salary_coverage_percent', label: 'Porcentaje de Salario Cubierto', type: 'percentage', section: 'Cobertura', required: true },
    { key: 'waiting_period_days', label: 'Periodo de Espera (días)', type: 'number', section: 'Términos', required: true },
    { key: 'max_duration_months', label: 'Duración Máxima (meses)', type: 'number', section: 'Términos' },
    { key: 'covers_partial', label: 'Cubre Incapacidad Parcial', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_total', label: 'Cubre Incapacidad Total', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'declared_salary', label: 'Salario Declarado', type: 'currency', section: 'Cobertura' },
  ],

  unemployment_protection: [
    { key: 'debt_type', label: 'Tipo de Deuda Cubierta', type: 'select', section: 'Cobertura', required: true,
      options: ['Auto', 'Hipoteca', 'Tarjeta', 'Personal', 'Otro'] },
    { key: 'monthly_coverage', label: 'Monto Mensual Cubierto', type: 'currency', section: 'Cobertura', required: true },
    { key: 'months_covered', label: 'Meses Cubiertos', type: 'number', section: 'Cobertura', required: true },
    { key: 'waiting_period_days', label: 'Periodo de Espera (días)', type: 'number', section: 'Términos' },
    { key: 'requirements', label: 'Requisitos', type: 'textarea', section: 'Términos' },
  ],


  // ═══════════════════════════════════════════════════════
  // CATEGORÍA 3 — MOVILIDAD Y BIENES
  // ═══════════════════════════════════════════════════════

  auto: [
    { key: 'vehicle_make', label: 'Marca del Vehículo', type: 'text', section: 'Vehículo', required: true },
    { key: 'vehicle_model', label: 'Modelo', type: 'text', section: 'Vehículo', required: true },
    { key: 'vehicle_year', label: 'Año', type: 'number', section: 'Vehículo', required: true },
    { key: 'vin', label: 'VIN', type: 'vin', section: 'Vehículo', required: true, placeholder: '17 caracteres' },
    { key: 'license_plate', label: 'Placa', type: 'plate', section: 'Vehículo' },
    { key: 'color', label: 'Color', type: 'text', section: 'Vehículo' },
    { key: 'insured_value', label: 'Valor Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'coverage_type', label: 'Tipo de Cobertura', type: 'select', section: 'Cobertura', required: true,
      options: ['Básica', 'Completa', 'Responsabilidad Civil'] },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
    { key: 'covers_collision', label: 'Cubre Colisión', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_theft', label: 'Cubre Robo', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_third_party', label: 'Cubre Daños a Terceros', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'additional_drivers', label: 'Conductores Adicionales', type: 'textarea', section: 'Conductores',
      placeholder: 'Nombre, Licencia — uno por línea' },
  ],

  home_property: [
    { key: 'property_type', label: 'Tipo de Propiedad', type: 'select', section: 'Propiedad', required: true,
      options: ['Casa', 'Apartamento', 'Alquiler', 'Condominio', 'Otro'] },
    { key: 'address', label: 'Dirección', type: 'text', section: 'Propiedad', required: true },
    { key: 'structure_value', label: 'Valor de la Estructura', type: 'currency', section: 'Cobertura' },
    { key: 'contents_value', label: 'Valor del Contenido', type: 'currency', section: 'Cobertura' },
    { key: 'covers_theft', label: 'Cubre Robo', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_fire', label: 'Cubre Incendio', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_flood', label: 'Cubre Inundación', type: 'boolean', section: 'Cobertura' },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
    { key: 'liability_amount', label: 'Responsabilidad Civil', type: 'currency', section: 'Cobertura' },
  ],

  pet: [
    { key: 'species', label: 'Especie', type: 'select', section: 'Mascota', required: true,
      options: ['Perro', 'Gato', 'Otro'] },
    { key: 'breed', label: 'Raza', type: 'text', section: 'Mascota' },
    { key: 'pet_age', label: 'Edad (años)', type: 'number', section: 'Mascota' },
    { key: 'covers_accidents', label: 'Cubre Accidentes', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_illness', label: 'Cubre Enfermedades', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_vaccines', label: 'Cubre Vacunas', type: 'boolean', section: 'Cobertura' },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
    { key: 'annual_limit', label: 'Límite Anual', type: 'currency', section: 'Cobertura' },
  ],

  gap_insurance: [
    { key: 'vehicle_info', label: 'Vehículo Financiado', type: 'text', section: 'Vehículo', placeholder: 'Marca y modelo' },
    { key: 'original_credit', label: 'Monto Original del Crédito', type: 'currency', section: 'Crédito', required: true },
    { key: 'current_balance', label: 'Saldo Actual', type: 'currency', section: 'Crédito' },
    { key: 'credit_term_months', label: 'Plazo del Crédito (meses)', type: 'number', section: 'Crédito' },
    { key: 'credit_start_date', label: 'Fecha de Inicio del Crédito', type: 'date', section: 'Crédito' },
  ],

  roadside_assistance: [
    { key: 'covers_towing', label: 'Cubre Grúa', type: 'boolean', section: 'Servicios', defaultValue: 'true' },
    { key: 'max_towing_km', label: 'Km Máximos de Grúa', type: 'number', section: 'Servicios' },
    { key: 'covers_tire_change', label: 'Cubre Cambio de Llanta', type: 'boolean', section: 'Servicios', defaultValue: 'true' },
    { key: 'covers_lockout', label: 'Cubre Apertura de Puertas', type: 'boolean', section: 'Servicios' },
    { key: 'covers_fuel', label: 'Cubre Combustible', type: 'boolean', section: 'Servicios' },
    { key: 'geographic_coverage', label: 'Cobertura Geográfica', type: 'text', section: 'Términos' },
  ],

  electronics: [
    { key: 'equipment_type', label: 'Tipo de Equipo', type: 'text', section: 'Equipo', required: true,
      placeholder: 'Celular, Laptop, Tablet, Cámara...' },
    { key: 'brand_model', label: 'Marca / Modelo', type: 'text', section: 'Equipo' },
    { key: 'imei_serial', label: 'IMEI / Serial', type: 'text', section: 'Equipo' },
    { key: 'insured_value', label: 'Valor Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_theft', label: 'Cubre Robo', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_accidental_damage', label: 'Cubre Daño Accidental', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_liquid', label: 'Cubre Líquidos', type: 'boolean', section: 'Cobertura' },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
  ],

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA 4 — ESPECIALES Y VIAJES
  // ═══════════════════════════════════════════════════════

  travel: [
    { key: 'destination', label: 'Destino', type: 'text', section: 'Viaje', required: true },
    { key: 'start_date', label: 'Fecha Inicio', type: 'date', section: 'Viaje', required: true },
    { key: 'end_date', label: 'Fecha Fin', type: 'date', section: 'Viaje', required: true },
    { key: 'travelers_count', label: 'Número de Viajeros', type: 'number', section: 'Viaje' },
    { key: 'covers_cancellation', label: 'Cubre Cancelación', type: 'boolean', section: 'Cobertura' },
    { key: 'cancellation_amount', label: 'Monto Cancelación', type: 'currency', section: 'Cobertura' },
    { key: 'covers_luggage', label: 'Cubre Equipaje', type: 'boolean', section: 'Cobertura' },
    { key: 'luggage_amount', label: 'Monto Equipaje', type: 'currency', section: 'Cobertura' },
    { key: 'covers_medical_emergency', label: 'Cubre Emergencia Médica', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'medical_emergency_amount', label: 'Monto Emergencia Médica', type: 'currency', section: 'Cobertura' },
  ],

  funeral: [
    { key: 'plan_type', label: 'Tipo de Plan', type: 'select', section: 'Plan', required: true,
      options: ['Prepago', 'Indemnización'] },
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_casket', label: 'Cubre Ataúd', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_ceremony', label: 'Cubre Ceremonia', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_cemetery', label: 'Cubre Cementerio', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_transfer', label: 'Cubre Traslado', type: 'boolean', section: 'Cobertura' },
    { key: 'beneficiary', label: 'Beneficiario', type: 'text', section: 'Beneficiarios' },
  ],

  liability: [
    { key: 'liability_type', label: 'Tipo', type: 'select', section: 'Cobertura', required: true,
      options: ['Personal', 'Profesional', 'Comercial'] },
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_personal_damage', label: 'Cubre Daños Personales', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_property_damage', label: 'Cubre Daños Materiales', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'exclusions', label: 'Exclusiones', type: 'textarea', section: 'Términos' },
  ],

  cyber: [
    { key: 'covers_identity_theft', label: 'Cubre Robo de Identidad', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'max_incident_amount', label: 'Monto Máximo por Incidente', type: 'currency', section: 'Cobertura', required: true },
    { key: 'covers_online_fraud', label: 'Cubre Fraude en Línea', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_digital_extortion', label: 'Cubre Extorsión Digital', type: 'boolean', section: 'Cobertura' },
    { key: 'credit_monitoring', label: 'Monitoreo de Crédito Incluido', type: 'boolean', section: 'Servicios' },
    { key: 'covered_devices', label: 'Número de Dispositivos Cubiertos', type: 'number', section: 'Cobertura' },
  ],

  international_medical: [
    { key: 'geographic_zone', label: 'Zona Geográfica Cubierta', type: 'text', section: 'Cobertura', required: true },
    { key: 'max_amount', label: 'Monto Máximo', type: 'currency', section: 'Cobertura', required: true },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
    { key: 'covers_hospitalization', label: 'Cubre Hospitalización', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_medical_evacuation', label: 'Cubre Evacuación Médica', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_repatriation', label: 'Cubre Repatriación', type: 'boolean', section: 'Cobertura' },
  ],

  personal_assistance: [
    { key: 'assistance_type', label: 'Tipo', type: 'select', section: 'Servicios', required: true,
      options: ['Personal', 'Comercial'] },
    { key: 'covered_services', label: 'Servicios Cubiertos', type: 'textarea', section: 'Servicios', required: true },
    { key: 'events_per_year', label: 'Número de Eventos al Año', type: 'number', section: 'Servicios' },
    { key: 'covers_plumbing', label: 'Cubre Plomería', type: 'boolean', section: 'Servicios' },
    { key: 'covers_electricity', label: 'Cubre Electricidad', type: 'boolean', section: 'Servicios' },
    { key: 'covers_locksmith', label: 'Cubre Cerrajería', type: 'boolean', section: 'Servicios' },
    { key: 'covers_emergency_24_7', label: 'Cubre Emergencias 24/7', type: 'boolean', section: 'Servicios', defaultValue: 'true' },
  ],

  // ═══════════════════════════════════════════════════════
  // CATEGORÍA 5 — COMERCIAL / PROFESIONALES
  // ═══════════════════════════════════════════════════════

  professional_liability: [
    { key: 'profession', label: 'Profesión', type: 'text', section: 'Perfil', required: true },
    { key: 'insured_amount', label: 'Monto Asegurado', type: 'currency', section: 'Cobertura', required: true },
    { key: 'deductible', label: 'Deducible', type: 'currency', section: 'Cobertura' },
    { key: 'covers_professional_errors', label: 'Cubre Errores Profesionales', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_negligence', label: 'Cubre Negligencia', type: 'boolean', section: 'Cobertura' },
    { key: 'covers_legal_defense', label: 'Cubre Defensa Legal', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'retroactive_period', label: 'Periodo Retroactivo', type: 'date', section: 'Términos' },
  ],

  business_owners_policy: [
    { key: 'business_type', label: 'Tipo de Negocio', type: 'text', section: 'Negocio', required: true },
    { key: 'address', label: 'Dirección', type: 'text', section: 'Negocio', required: true },
    { key: 'property_value', label: 'Valor de Propiedad', type: 'currency', section: 'Cobertura' },
    { key: 'content_value', label: 'Valor de Contenido', type: 'currency', section: 'Cobertura' },
    { key: 'covers_liability', label: 'Cubre Responsabilidad Civil', type: 'boolean', section: 'Cobertura', defaultValue: 'true' },
    { key: 'covers_business_interruption', label: 'Cubre Interrupción de Negocio', type: 'boolean', section: 'Cobertura' },
    { key: 'liability_amount', label: 'Monto Responsabilidad', type: 'currency', section: 'Cobertura' },
  ],

  surety_bonds: [
    { key: 'bond_type', label: 'Tipo de Fianza', type: 'text', section: 'Fianza', required: true },
    { key: 'bond_amount', label: 'Monto de la Fianza', type: 'currency', section: 'Fianza', required: true },
    { key: 'beneficiary', label: 'Beneficiario', type: 'text', section: 'Beneficiarios' },
    { key: 'validity', label: 'Vigencia', type: 'text', section: 'Términos' },
    { key: 'guarantee_type', label: 'Tipo de Garantía', type: 'text', section: 'Términos' },
  ],

};