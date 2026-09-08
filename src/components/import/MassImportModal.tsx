import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Users,
  X,
  Plus,
  Trash2,
  Settings2,
  Table,
  Check,
  HelpCircle,
  Layers,
  Tag,
  Briefcase,
  FileText,
  Sliders,
  Filter,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { CustomFieldDefinition } from '../../types';

interface MassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddedFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  defaultValue: string;
  mappedCsvColumn?: string; // Optional if mapped to an unassigned CSV column
  saveToTenantCustomFields: boolean;
  section: string;
}

// Preset sample files for quick testing
const PRESET_FILES = [
  {
    id: 'obamacare_2025',
    name: 'leads_obamacare_florida_2025.csv',
    size: '14.2 KB',
    category: 'Salud / ACA',
    headers: ['Nombre', 'Apellidos', 'Telefono', 'Email', 'Categoria', 'Cedula_SSN', 'Valor_Estimado', 'Ciudad', 'Notas'],
    rows: [
      {
        Nombre: 'Marcos',
        Apellidos: 'Delgado',
        Telefono: '+1 (786) 555-8812',
        Email: 'marcos.delgado@email.com',
        Categoria: 'Seguro de Salud / ACA',
        Cedula_SSN: '482-19-0921',
        Valor_Estimado: '320',
        Ciudad: 'Miami',
        Notas: 'Interesado en subsidio Silver 94% ACA'
      },
      {
        Nombre: 'Elena',
        Apellidos: 'Vasquez',
        Telefono: '+1 (305) 555-9921',
        Email: 'elena.v@email.com',
        Categoria: 'Seguro de Vida',
        Cedula_SSN: '582-99-1029',
        Valor_Estimado: '180',
        Ciudad: 'Hialeah',
        Notas: 'Póliza término 20 años'
      },
      {
        Nombre: 'Roberto',
        Apellidos: 'Guzman',
        Telefono: '+1 (407) 555-3301',
        Email: 'roberto.g@email.com',
        Categoria: 'Seguro de Salud / ACA',
        Cedula_SSN: '391-02-4821',
        Valor_Estimado: '490',
        Ciudad: 'Orlando',
        Notas: 'Familia de 4 miembros'
      },
      {
        Nombre: 'Lucia',
        Apellidos: 'Morales',
        Telefono: '+1 (786) 555-7744',
        Email: 'lucia.morales@email.com',
        Categoria: 'Seguro de Salud / ACA',
        Cedula_SSN: '891-22-3847',
        Valor_Estimado: '510',
        Ciudad: 'Tampa',
        Notas: 'Renovación abierta 2026'
      }
    ]
  },
  {
    id: 'vida_gastos_finales',
    name: 'prospectos_vida_calificados.csv',
    size: '8.7 KB',
    category: 'Seguro de Vida',
    headers: ['Nombre_Completo', 'Movil', 'Correo', 'Edad', 'Ingreso_Aproximado', 'Estado'],
    rows: [
      {
        Nombre_Completo: 'Carlos Eduardo Mendoza',
        Movil: '+1 (832) 555-4411',
        Correo: 'carlos.mendoza@email.com',
        Edad: '48',
        Ingreso_Aproximado: '45000',
        Estado: 'Texas'
      },
      {
        Nombre_Completo: 'Patricia Jimena Rivas',
        Movil: '+1 (210) 555-9988',
        Correo: 'patricia.rivas@email.com',
        Edad: '52',
        Ingreso_Aproximado: '52000',
        Estado: 'Texas'
      },
      {
        Nombre_Completo: 'Guillermo Alejandro Soria',
        Movil: '+1 (713) 555-1289',
        Correo: 'guillermo.soria@email.com',
        Edad: '39',
        Ingreso_Aproximado: '68000',
        Estado: 'Texas'
      }
    ]
  }
];

const STANDARD_CRM_FIELDS = [
  { key: 'firstName', label: 'Nombre' },
  { key: 'lastName', label: 'Apellidos' },
  { key: 'phone', label: 'Teléfono Principal' },
  { key: 'secondaryPhone', label: 'Teléfono Secundario' },
  { key: 'email', label: 'Correo Electrónico' },
  { key: 'category', label: 'Categoría de Seguro' },
  { key: 'idNumber', label: 'Cédula / DNI / SSN' },
  { key: 'dealValue', label: 'Valor Estimado ($)' },
  { key: 'leadSource', label: 'Origen del Lead' },
  { key: 'status', label: 'Estado del Lead' },
  { key: 'birthDate', label: 'Fecha de Nacimiento' },
  { key: 'gender', label: 'Género' },
  { key: 'city', label: 'Ciudad' },
  { key: 'state', label: 'Estado / Provincia' },
  { key: 'zipCode', label: 'Código Postal' },
  { key: 'notes', label: 'Notas / Observaciones' }
];

export const MassImportModal: React.FC<MassImportModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    currentTenant,
    createClient,
    pipelines,
    catalogs,
    customFields,
    addCustomField
  } = useTenant();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps: 1: File & Mapping, 2: Missing Fields & Defaults, 3: Distribution, 4: Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File metadata
  const [fileName, setFileName] = useState<string>(PRESET_FILES[0].name);
  const [fileSize, setFileSize] = useState<string>(PRESET_FILES[0].size);
  const [csvHeaders, setCsvHeaders] = useState<string[]>(PRESET_FILES[0].headers);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>(PRESET_FILES[0].rows);

  // Column Mapping: csvHeader -> crmFieldKey (or 'custom_field' or 'ignore')
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(() => {
    return {
      Nombre: 'firstName',
      Apellidos: 'lastName',
      Telefono: 'phone',
      Email: 'email',
      Categoria: 'category',
      Cedula_SSN: 'idNumber',
      Valor_Estimado: 'dealValue',
      Ciudad: 'city',
      Notas: 'notes'
    };
  });

  // Default values for standard fields if missing in CSV
  const [defaultValues, setDefaultValues] = useState<{
    category: string;
    leadSource: string;
    status: string;
    pipelineId: string;
    stageId: string;
    tags: string;
  }>({
    category: 'Seguro de Salud / ACA',
    leadSource: 'Importación Masiva CSV',
    status: 'Lead',
    pipelineId: pipelines[0]?.id || 'pipe-01',
    stageId: pipelines[0]?.stages?.[0]?.id || 'stage-01',
    tags: 'Importado_CSV'
  });

  // Added Missing Fields / Custom Attributes
  const [addedFields, setAddedFields] = useState<AddedFieldConfig[]>([]);

  // New field form state
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [newFieldName, setNewFieldName] = useState<string>('');
  const [newFieldLabel, setNewFieldLabel] = useState<string>('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'select' | 'boolean'>('text');
  const [newFieldDefaultValue, setNewFieldDefaultValue] = useState<string>('');
  const [newFieldMappedColumn, setNewFieldMappedColumn] = useState<string>('');
  const [newFieldSaveToCatalog, setNewFieldSaveToCatalog] = useState<boolean>(true);

  // Distribution settings
  const [distributionMode, setDistributionMode] = useState<'round_robin' | 'single_agent' | 'unassigned'>('round_robin');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const activeAgents = users.filter((u) => u.tenantId === currentTenant.id && u.role === 'agent');

  // Auto-detect mappings when headers change
  const autoMapHeaders = (headers: string[]) => {
    const newMap: Record<string, string> = {};
    headers.forEach((header) => {
      const h = header.toLowerCase().trim().replace(/[_\s-]+/g, '');
      if (h.includes('nombrecompleto') || h === 'nombrecompleto') {
        newMap[header] = 'firstName';
      } else if (h.includes('nombre') || h.includes('firstname') || h === 'name') {
        newMap[header] = 'firstName';
      } else if (h.includes('apellido') || h.includes('lastname')) {
        newMap[header] = 'lastName';
      } else if (h.includes('telefono') || h.includes('phone') || h.includes('movil') || h.includes('celular')) {
        newMap[header] = 'phone';
      } else if (h.includes('tel2') || h.includes('secundario')) {
        newMap[header] = 'secondaryPhone';
      } else if (h.includes('email') || h.includes('correo')) {
        newMap[header] = 'email';
      } else if (h.includes('categoria') || h.includes('ramo') || h.includes('category')) {
        newMap[header] = 'category';
      } else if (h.includes('cedula') || h.includes('dni') || h.includes('ssn') || h.includes('idnumber') || h.includes('doc')) {
        newMap[header] = 'idNumber';
      } else if (h.includes('valor') || h.includes('deal') || h.includes('monto') || h.includes('ingreso') || h.includes('prima')) {
        newMap[header] = 'dealValue';
      } else if (h.includes('ciudad') || h.includes('city')) {
        newMap[header] = 'city';
      } else if (h.includes('estado') || h.includes('state')) {
        newMap[header] = 'state';
      } else if (h.includes('zip') || h.includes('postal')) {
        newMap[header] = 'zipCode';
      } else if (h.includes('nota') || h.includes('comment') || h.includes('observacion')) {
        newMap[header] = 'notes';
      } else if (h.includes('origen') || h.includes('source')) {
        newMap[header] = 'leadSource';
      } else if (h.includes('nacimiento') || h.includes('birth') || h.includes('dob')) {
        newMap[header] = 'birthDate';
      } else if (h.includes('genero') || h.includes('sexo') || h.includes('gender')) {
        newMap[header] = 'gender';
      } else {
        newMap[header] = 'ignore';
      }
    });
    setColumnMapping(newMap);
  };

  // Handle parsing an uploaded CSV/Text file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      // Detect separator: comma, semicolon, tab
      const firstLine = lines[0];
      let sep = ',';
      if (firstLine.includes(';') && !firstLine.includes(',')) sep = ';';
      else if (firstLine.includes('\t')) sep = '\t';

      // Parse headers
      const headers = firstLine.split(sep).map((h) => h.replace(/^["']|["']$/g, '').trim());
      setCsvHeaders(headers);

      // Parse rows
      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const values = line.split(sep).map((v) => v.replace(/^["']|["']$/g, '').trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        rows.push(rowObj);
      }

      setRawRows(rows);
      autoMapHeaders(headers);
    };
    reader.readAsText(file);
  };

  // Load a preset file for quick testing
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_FILES.find((p) => p.id === presetId) || PRESET_FILES[0];
    setFileName(preset.name);
    setFileSize(preset.size);
    setCsvHeaders(preset.headers);
    setRawRows(preset.rows);
    autoMapHeaders(preset.headers);
  };

  // Add a new missing field
  const handleSaveAddedField = () => {
    const label = newFieldLabel.trim() || newFieldName.trim();
    if (!label) return;

    const name = (newFieldName.trim() || label.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')).toLowerCase();

    const newField: AddedFieldConfig = {
      id: `field_${Date.now()}`,
      name,
      label,
      type: newFieldType,
      defaultValue: newFieldDefaultValue.trim(),
      mappedCsvColumn: newFieldMappedColumn || undefined,
      saveToTenantCustomFields: newFieldSaveToCatalog,
      section: 'Datos Personalizados de Importación'
    };

    setAddedFields((prev) => [...prev, newField]);

    // Reset inline form
    setNewFieldName('');
    setNewFieldLabel('');
    setNewFieldDefaultValue('');
    setNewFieldMappedColumn('');
    setNewFieldSaveToCatalog(true);
    setIsAddingField(false);
  };

  const handleRemoveAddedField = (id: string) => {
    setAddedFields((prev) => prev.filter((f) => f.id !== id));
  };

  // Normalized preview items combining CSV + Added Missing Fields
  const previewItems = useMemo(() => {
    return rawRows.slice(0, 5).map((row) => {
      // Standard mapped values
      let firstName = '';
      let lastName = '';
      let phone = '';
      let secondaryPhone = '';
      let email = '';
      let category = defaultValues.category;
      let idNumber = '';
      let dealValue = 0;
      let city = '';
      let state = '';
      let zipCode = '';
      let notes = '';
      let leadSource = defaultValues.leadSource;
      let status = defaultValues.status;
      let birthDate = '1990-01-01';
      let gender: 'M' | 'F' | 'Otro' = 'M';

      Object.entries(columnMapping).forEach(([csvHeader, crmKey]) => {
        const val = row[csvHeader] || '';
        if (crmKey === 'firstName') firstName = val;
        else if (crmKey === 'lastName') lastName = val;
        else if (crmKey === 'phone') phone = val;
        else if (crmKey === 'secondaryPhone') secondaryPhone = val;
        else if (crmKey === 'email') email = val;
        else if (crmKey === 'category' && val) category = val;
        else if (crmKey === 'idNumber') idNumber = val;
        else if (crmKey === 'dealValue') dealValue = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
        else if (crmKey === 'city') city = val;
        else if (crmKey === 'state') state = val;
        else if (crmKey === 'zipCode') zipCode = val;
        else if (crmKey === 'notes') notes = val;
        else if (crmKey === 'leadSource' && val) leadSource = val;
        else if (crmKey === 'status' && val) status = val;
        else if (crmKey === 'birthDate' && val) birthDate = val;
        else if (crmKey === 'gender' && val) gender = val.startsWith('F') ? 'F' : 'M';
      });

      // Handle split if single full name was mapped to firstName
      if (firstName && !lastName && firstName.includes(' ')) {
        const parts = firstName.split(' ');
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      }

      // Added missing fields dictionary
      const customFieldValues: Record<string, any> = {};
      addedFields.forEach((af) => {
        if (af.mappedCsvColumn && row[af.mappedCsvColumn]) {
          customFieldValues[af.name] = row[af.mappedCsvColumn];
        } else {
          customFieldValues[af.name] = af.defaultValue || '—';
        }
      });

      return {
        firstName: firstName || 'Prospecto',
        lastName: lastName || 'Nuevo',
        phone: phone || '+1 (000) 000-0000',
        email: email || '',
        category,
        idNumber,
        dealValue,
        city,
        state,
        zipCode,
        notes,
        leadSource,
        status,
        customFields: customFieldValues
      };
    });
  }, [rawRows, columnMapping, defaultValues, addedFields]);

  // Execute Real Import Process
  const handleExecuteImport = () => {
    setIsProcessing(true);
    setProgressPercent(15);

    // If any added field had `saveToTenantCustomFields` checked, register in tenant custom fields definition
    addedFields.forEach((af) => {
      if (af.saveToTenantCustomFields) {
        const alreadyExists = customFields.some((f) => f.name === af.name);
        if (!alreadyExists) {
          addCustomField({
            entityType: 'client',
            name: af.name,
            label: af.label,
            type: af.type,
            required: false,
            section: 'Campos Importación',
            order: customFields.length + 1
          });
        }
      }
    });

    const total = rawRows.length;
    let agentIdx = 0;

    const timer = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 25;
      });
    }, 250);

    setTimeout(() => {
      clearInterval(timer);

      rawRows.forEach((row, idx) => {
        let firstName = '';
        let lastName = '';
        let phone = '';
        let secondaryPhone = '';
        let email = '';
        let category = defaultValues.category;
        let idNumber = '';
        let dealValue = 0;
        let city = '';
        let state = '';
        let zipCode = '';
        let notes = '';
        let leadSource = defaultValues.leadSource;
        let status: any = defaultValues.status || 'Lead';
        let birthDate = '1990-01-01';
        let gender: 'M' | 'F' | 'Otro' = 'M';

        Object.entries(columnMapping).forEach(([csvHeader, crmKey]) => {
          const val = row[csvHeader] || '';
          if (crmKey === 'firstName') firstName = val;
          else if (crmKey === 'lastName') lastName = val;
          else if (crmKey === 'phone') phone = val;
          else if (crmKey === 'secondaryPhone') secondaryPhone = val;
          else if (crmKey === 'email') email = val;
          else if (crmKey === 'category' && val) category = val;
          else if (crmKey === 'idNumber') idNumber = val;
          else if (crmKey === 'dealValue') dealValue = parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
          else if (crmKey === 'city') city = val;
          else if (crmKey === 'state') state = val;
          else if (crmKey === 'zipCode') zipCode = val;
          else if (crmKey === 'notes') notes = val;
          else if (crmKey === 'leadSource' && val) leadSource = val;
          else if (crmKey === 'status' && val) status = val;
          else if (crmKey === 'birthDate' && val) birthDate = val;
          else if (crmKey === 'gender' && val) gender = val.startsWith('F') ? 'F' : 'M';
        });

        if (firstName && !lastName && firstName.includes(' ')) {
          const parts = firstName.split(' ');
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        }

        // Custom fields record
        const clientCustomFields: Record<string, any> = {};
        addedFields.forEach((af) => {
          if (af.mappedCsvColumn && row[af.mappedCsvColumn]) {
            clientCustomFields[af.name] = row[af.mappedCsvColumn];
          } else if (af.defaultValue) {
            clientCustomFields[af.name] = af.defaultValue;
          }
        });

        // Agent Assignment
        let assignedId = '';
        if (distributionMode === 'round_robin' && activeAgents.length > 0) {
          assignedId = activeAgents[agentIdx % activeAgents.length].id;
          agentIdx++;
        } else if (distributionMode === 'single_agent') {
          assignedId = selectedAgentId || activeAgents[0]?.id || '';
        }

        const tagList = defaultValues.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        createClient({
          firstName: firstName || `Lead #${idx + 1}`,
          lastName: lastName || 'Importado',
          phone: phone || '+1 (000) 000-0000',
          secondaryPhone,
          email: email || `lead${idx + 1}@import.temp`,
          birthDate,
          gender,
          category: category || 'Regular',
          idNumber: idNumber || '',
          address: {
            city: city || undefined,
            state: state || undefined,
            zipCode: zipCode || undefined
          },
          dealValue: dealValue || 0,
          status,
          assignedAgentId: assignedId,
          pipelineId: defaultValues.pipelineId,
          stageId: defaultValues.stageId,
          leadSource: leadSource || 'Importación Masiva CSV',
          tags: tagList.length > 0 ? tagList : ['Importado_CSV'],
          customFields: clientCustomFields
        });
      });

      setProgressPercent(100);
      setIsProcessing(false);
      setImportedCount(total);
      setStep(4);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Importación Masiva de Clientes (CSV)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Mapeo Inteligente DDD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Reconocimiento de columnas, agregador de campos faltantes y distribución equitativa.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
          <div
            onClick={() => step > 1 && setStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              step === 1 ? 'text-purple-700 font-bold' : step > 1 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 1 ? 'bg-purple-600 text-white' : step > 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </div>
            <span>1. Archivo & Mapeo ({rawRows.length} contactos)</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            onClick={() => step > 2 && setStep(2)}
            className={`flex items-center gap-2 cursor-pointer transition-colors ${
              step === 2 ? 'text-purple-700 font-bold' : step > 2 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 2 ? 'bg-purple-600 text-white' : step > 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step > 2 ? '✓' : '2'}
            </div>
            <span>2. Campos Faltantes ({addedFields.length} agregados)</span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />

          <div
            className={`flex items-center gap-2 ${
              step === 3 ? 'text-purple-700 font-bold' : step === 4 ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 3 ? 'bg-purple-600 text-white' : step === 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step === 4 ? '✓' : '3'}
            </div>
            <span>3. Distribución & Importar</span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= STEP 1: FILE & COLUMN RECOGNITION ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in">
              {/* File Status & Upload Container */}
              <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-950 truncate max-w-xs">{fileName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 font-semibold">
                        {fileSize}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-purple-800/80 font-medium mt-1">
                      <span>
                        <strong>{rawRows.length}</strong> contactos detectados
                      </span>
                      <span>•</span>
                      <span>
                        <strong>{csvHeaders.length}</strong> columnas reconocidas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv, .txt, .tsv, .xlsx, .xls"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-purple-600" />
                    <span>Cargar Otro Archivo</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Selector for Fast Demos */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Archivos de muestra para pruebas:
                </span>
                <div className="flex items-center gap-2">
                  {PRESET_FILES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleLoadPreset(p.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        fileName === p.name
                          ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.name.split('.')[0]} ({p.rows.length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Recognition & Auto-Mapping Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-purple-600" />
                    <span>Reconocimiento y Mapeo de Columnas CSV</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => autoMapHeaders(csvHeaders)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-mapear de nuevo
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="grid grid-cols-12 bg-slate-100/80 p-2.5 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <div className="col-span-4">Columna en tu CSV</div>
                    <div className="col-span-4">Campo en el CRM (DDD)</div>
                    <div className="col-span-4">Muestra del 1er Registro</div>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white">
                    {csvHeaders.map((header) => {
                      const sampleVal = rawRows[0]?.[header] || '—';
                      const currentMapped = columnMapping[header] || 'ignore';
                      const isMapped = currentMapped !== 'ignore';

                      return (
                        <div key={header} className="grid grid-cols-12 items-center p-2.5 text-xs hover:bg-slate-50/80">
                          <div className="col-span-4 flex items-center gap-2 font-mono font-semibold text-slate-800 truncate pr-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isMapped ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            <span className="truncate">{header}</span>
                          </div>

                          <div className="col-span-4 pr-2">
                            <select
                              value={currentMapped}
                              onChange={(e) =>
                                setColumnMapping((prev) => ({ ...prev, [header]: e.target.value }))
                              }
                              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-all ${
                                isMapped
                                  ? 'bg-purple-50/50 text-purple-900 border-purple-200 font-bold'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                            >
                              <option value="ignore">❌ Ignorar columna</option>
                              <optgroup label="Campos Estándar del Cliente">
                                {STANDARD_CRM_FIELDS.map((f) => (
                                  <option key={f.key} value={f.key}>
                                    {f.label}
                                  </option>
                                ))}
                              </optgroup>
                              {customFields.filter((cf) => cf.entityType === 'client').length > 0 && (
                                <optgroup label="Campos Personalizados Existentes">
                                  {customFields
                                    .filter((cf) => cf.entityType === 'client')
                                    .map((cf) => (
                                      <option key={cf.name} value={`custom_${cf.name}`}>
                                        ⚙️ {cf.label}
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                            </select>
                          </div>

                          <div className="col-span-4 text-slate-500 font-mono text-[11px] truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            {sampleVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Vista Previa de Contactos ({previewItems.length} de {rawRows.length}):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Mostrando los primeros registros</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-40">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Nombre</th>
                        <th className="p-2.5">Teléfono</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Categoría</th>
                        <th className="p-2.5">Cédula/SSN</th>
                        <th className="p-2.5">Valor ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewItems.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-2.5 font-bold text-slate-900">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">{r.phone}</td>
                          <td className="p-2.5 text-slate-500">{r.email || '—'}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {r.category}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-500">{r.idNumber || '—'}</td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {r.dealValue > 0 ? `$${r.dealValue.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: ADD MISSING FIELDS & DEFAULT VALUES ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* Feature Banner: Agregar Campos Faltantes */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-purple-950">
                      ¿Faltan datos o columnas en el archivo CSV?
                    </h3>
                    <p className="text-[11px] text-purple-800/80 mt-0.5">
                      Agrega nuevos campos personalizados o define valores por defecto para asignarlos automáticamente a todos los contactos importados.
                    </p>
                  </div>
                </div>

                {!isAddingField && (
                  <button
                    type="button"
                    onClick={() => setIsAddingField(true)}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Campo Faltante</span>
                  </button>
                )}
              </div>

              {/* Form to Add a Missing / Custom Field */}
              {isAddingField && (
                <div className="p-4 border-2 border-purple-300 rounded-2xl bg-purple-50/40 space-y-4 animate-in fade-in zoom-in-98">
                  <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-purple-700" />
                      <h4 className="text-xs font-extrabold text-purple-950">Nuevo Campo Faltante / Personalizado</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddingField(false)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nombre / Etiqueta del Campo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Compañía Actual, Ingreso Anual, Deducible Deseado..."
                        value={newFieldLabel}
                        onChange={(e) => {
                          setNewFieldLabel(e.target.value);
                          if (!newFieldName) {
                            setNewFieldName(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'));
                          }
                        }}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tipo de Dato
                      </label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="text">Texto Libre (String)</option>
                        <option value="number">Numérico / Monto ($)</option>
                        <option value="date">Fecha (YYYY-MM-DD)</option>
                        <option value="select">Selección / Categoría</option>
                        <option value="boolean">Booleano (Sí / No)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Valor Predeterminado (Para todos los contactos del lote)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Florida Blue, $45,000, 2026, Sí..."
                        value={newFieldDefaultValue}
                        onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        O vincular a columna del CSV (opcional)
                      </label>
                      <select
                        value={newFieldMappedColumn}
                        onChange={(e) => setNewFieldMappedColumn(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-700"
                      >
                        <option value="">Ninguna (usar valor predeterminado)</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h} (Columna CSV)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newFieldSaveToCatalog}
                        onChange={(e) => setNewFieldSaveToCatalog(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Guardar también como campo permanente del CRM de {currentTenant.name}</span>
                    </label>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingField(false)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAddedField}
                        disabled={!newFieldLabel.trim()}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs"
                      >
                        Guardar Campo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* List of Added Missing Fields */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Campos Adicionales Configurados para este Lote ({addedFields.length})</span>
                </div>

                {addedFields.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 bg-slate-50/50">
                    No has agregado campos faltantes aún. Puedes presionar <strong>"+ Agregar Campo Faltante"</strong> si tu CSV carece de algún dato clave.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {addedFields.map((field) => (
                      <div
                        key={field.id}
                        className="p-3 border border-purple-200 bg-white rounded-xl flex items-center justify-between shadow-2xs hover:border-purple-300"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{field.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700 uppercase">
                              {field.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                            {field.mappedCsvColumn ? (
                              <span>Vinculado a columna: <strong>{field.mappedCsvColumn}</strong></span>
                            ) : (
                              <span>Valor asignado: <strong>"{field.defaultValue || 'Vacío'}"</strong></span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAddedField(field.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar campo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Default Values Configuration */}
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Valores Por Defecto para Campos Estándar Faltantes</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Categoría Predeterminada
                    </label>
                    <select
                      value={defaultValues.category}
                      onChange={(e) =>
                        setDefaultValues((prev) => ({ ...prev, category: e.target.value }))
                      }
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      {catalogs?.clientCategories?.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )) || (
                        <>
                          <option value="Seguro de Salud / ACA">Seguro de Salud / ACA</option>
                          <option value="Seguro de Vida">Seguro de Vida</option>
                          <option value="VIP">VIP</option>
                          <option value="Regular">Regular</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Origen del Lead
                    </label>
                    <input
                      type="text"
                      value={defaultValues.leadSource}
                      onChange={(e) =>
                        setDefaultValues((prev) => ({ ...prev, leadSource: e.target.value }))
                      }
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                      placeholder="Importación Masiva CSV"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Etiquetas (Separadas por coma)
                    </label>
                    <input
                      type="text"
                      value={defaultValues.tags}
                      onChange={(e) =>
                        setDefaultValues((prev) => ({ ...prev, tags: e.target.value }))
                      }
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                      placeholder="Importado_CSV, Leads_2026"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Preview with added custom fields */}
              {addedFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Vista Previa con los Campos Faltantes Incorporados:</span>
                  </div>
                  <div className="overflow-x-auto border border-purple-200 rounded-xl bg-purple-50/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-purple-100/70 text-purple-900 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Contacto</th>
                          {addedFields.map((af) => (
                            <th key={af.id} className="p-2">
                              + {af.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {previewItems.slice(0, 3).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-900">
                              {r.firstName} {r.lastName}
                            </td>
                            {addedFields.map((af) => (
                              <td key={af.id} className="p-2 font-mono text-purple-800">
                                {r.customFields[af.name] || af.defaultValue || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 3: DISTRIBUTION & EXECUTION ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>Regla de Distribución y Asignación de Contactos</span>
                </div>

                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      distributionMode === 'round_robin'
                        ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="distributionMode"
                      checked={distributionMode === 'round_robin'}
                      onChange={() => setDistributionMode('round_robin')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          Asignación Round-Robin Equitativa
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full">
                          Recomendado ({activeAgents.length} Asesores Activos)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reparte de forma balanceada y secuencial los {rawRows.length} contactos entre todos los asesores del tenant {currentTenant.name}.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      distributionMode === 'single_agent'
                        ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="distributionMode"
                      checked={distributionMode === 'single_agent'}
                      onChange={() => setDistributionMode('single_agent')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-extrabold text-slate-900">
                        Asignar Todos a un Asesor Específico
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Asigna el 100% de este lote a un solo agente o asesor comercial.
                      </p>
                      {distributionMode === 'single_agent' && (
                        <div className="mt-2.5">
                          <select
                            value={selectedAgentId}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                          >
                            <option value="">Selecciona asesor asignado...</option>
                            {activeAgents.map((a) => (
                              <option key={a.id} value={a.id}>
                                👤 {a.name} ({a.email})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      distributionMode === 'unassigned'
                        ? 'border-purple-500 bg-purple-50/50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="distributionMode"
                      checked={distributionMode === 'unassigned'}
                      onChange={() => setDistributionMode('unassigned')}
                      className="mt-0.5 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        Sin Asignar (Pool de Leads General)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Los contactos ingresan a la bandeja general sin asesor para ser reclamados manualmente.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary of Import Parameters */}
              <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2 text-xs">
                <div className="font-extrabold text-purple-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Resumen de la Importación Masiva</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-400 block">Total Filas CSV</span>
                    <strong className="text-slate-900 text-xs">{rawRows.length} contactos</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-400 block">Columnas Mapeadas</span>
                    <strong className="text-slate-900 text-xs">
                      {Object.values(columnMapping).filter((v) => v !== 'ignore').length} campos
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-400 block">Campos Faltantes</span>
                    <strong className="text-purple-700 text-xs">+{addedFields.length} agregados</strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-purple-100">
                    <span className="text-slate-400 block">Asignación</span>
                    <strong className="text-slate-900 text-xs truncate block">
                      {distributionMode === 'round_robin'
                        ? 'Round-Robin'
                        : distributionMode === 'single_agent'
                        ? 'Asesor único'
                        : 'Pool general'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Animated Progress Bar during execution */}
              {isProcessing && (
                <div className="space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                    <span>Creando e indexando contactos en el CRM...</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: SUCCESS CONFIRMATION ================= */}
          {step === 4 && (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">¡Importación Exitosa!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Se han importado y registrado correctamente <strong>{importedCount} contactos</strong> en el CRM de{' '}
                  <strong>{currentTenant.name}</strong> con todos sus campos mapeados y personalizados.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contactos Creados:</span>
                  <strong className="text-emerald-700">{importedCount} clientes</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Campos Faltantes Aplicados:</span>
                  <strong className="text-purple-700">+{addedFields.length} campos</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Distribución:</span>
                  <strong className="text-slate-800">
                    {distributionMode === 'round_robin' ? 'Round-Robin Equitativo' : 'Asesor Directo'}
                  </strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98"
                >
                  Ver Clientes en el Directorio
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {step !== 4 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as any)}
                disabled={isProcessing}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
            )}

            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-98"
                >
                  <span>Siguiente: Configurar Campos Faltantes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-98"
                >
                  <span>Siguiente: Distribución & Asignación</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isProcessing || rawRows.length === 0}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-98"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importando {rawRows.length} contactos...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Ejecutar Importación ({rawRows.length} Contactos)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
