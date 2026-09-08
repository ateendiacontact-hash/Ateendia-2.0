import React, { useState } from 'react';
import {
  Server,
  Database,
  Key,
  ShieldCheck,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Cpu,
  HardDrive,
  Activity,
  Lock,
  Zap,
  Globe,
  Download,
  Code,
  Layers,
  ArrowUpRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { SaasDatabaseConfig, SaasVpsDeploymentConfig } from '../../types';

export const SaasVpsDatabaseSection: React.FC = () => {
  const {
    saasDatabaseConfig,
    updateSaasDatabaseConfig,
    testDatabaseConnection,
    saasVpsConfig,
    updateSaasVpsConfig,
    saasLandingConfig
  } = useTenant();

  const [activeSubTab, setActiveSubTab] = useState<'database' | 'vps' | 'docker_deploy'>('database');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    tablesFound?: number;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testDatabaseConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error inesperado al conectar con el backend.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const crmBrand = saasLandingConfig.crmName || 'Ateendia';
  const crmDomain = saasLandingConfig.domainName || 'ateendia.cloud';

  const dockerComposeCode = `version: '3.8'

services:
  ${crmBrand.toLowerCase()}-app:
    image: node:20-alpine
    container_name: ${crmBrand.toLowerCase()}_crm_production
    restart: always
    working_dir: /app
    ports:
      - "${saasVpsConfig.appPort || 3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PROVIDER=${saasDatabaseConfig.provider}
      - DATABASE_URL=${saasDatabaseConfig.provider === 'supabase' ? (saasDatabaseConfig.supabase?.projectUrl || '') : (saasDatabaseConfig.pocketbase?.apiUrl || 'http://localhost:8090')}
      - SAAS_DOMAIN=${crmDomain}
      - JWT_SECRET=ateendia_super_secure_vault_token_2026_x9
    volumes:
      - ./:/app
      - /app/node_modules
    command: npm run start

  # Base de Datos PocketBase Integrada (si se usa host local en VPS)
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: ${crmBrand.toLowerCase()}_pocketbase
    restart: always
    ports:
      - "8090:8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public`;

  const deployScriptCode = `#!/bin/bash
# ==========================================================
# Script de Despliegue Automatizado para ${crmBrand} CRM en VPS
# ==========================================================
set -e

echo "🚀 Iniciando despliegue de ${crmBrand} en ${saasVpsConfig.serverIp || 'VPS Central'}..."

# 1. Actualizar paquetes del sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker y Docker Compose si no existen
if ! command -v docker &> /dev/null; then
    echo "📦 Instalando Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

# 3. Configurar Certificado SSL Automático Let's Encrypt para ${crmDomain}
echo "🔒 Configurando certificado SSL Let's Encrypt para ${crmDomain}..."
sudo apt install -y certbot nginx

# 4. Iniciar Contenedores
echo "🐳 Levantando contenedores con Docker Compose..."
docker compose down || true
docker compose up -d --build

echo "✅ Despliegue completado con éxito! CRM ${crmBrand} activo en https://${crmDomain}"`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Server className="w-48 h-48 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  Infraestructura VPS & Base de Datos Externa
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  Enlaza de forma segura el SaaS con <strong className="text-indigo-300">PocketBase</strong>, <strong className="text-emerald-300">Supabase</strong>, <strong className="text-amber-300">Firebase</strong>, <strong className="text-cyan-300">MongoDB</strong> o un <strong className="text-purple-300">Servidor VPS Dedicado</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              saasDatabaseConfig.status === 'connected'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                saasDatabaseConfig.status === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span>
                {saasDatabaseConfig.status === 'connected'
                  ? `Conectado a ${saasDatabaseConfig.provider.toUpperCase()}`
                  : 'Modo Local / Desconectado'}
              </span>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verificando...' : 'Probar Conexión'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-slate-50 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveSubTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'database'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Base de Datos Externa ({saasDatabaseConfig.provider.toUpperCase()})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vps')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'vps'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Servidor VPS / Nginx / SSL</span>
        </button>

        <button
          onClick={() => setActiveSubTab('docker_deploy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'docker_deploy'
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Docker & Script de Despliegue</span>
        </button>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in duration-300 ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-xs">
                {testResult.success ? 'Conexión Segura Verificada' : 'Aviso de Verificación'}
              </div>
              <p className="text-xs mt-0.5">{testResult.message}</p>
              {testResult.latencyMs && (
                <span className="inline-block mt-1 font-mono text-[11px] font-semibold px-2 py-0.5 bg-white/80 rounded">
                  Latencia de red: {testResult.latencyMs} ms
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: DATABASE INTEGRATION */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          {/* Provider Selector Cards */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Selecciona el Motor de Base de Datos para el CRM
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                {
                  id: 'supabase',
                  name: 'Supabase',
                  badge: 'PostgreSQL Cloud',
                  desc: 'Auth, Realtime, SQL RLS',
                  color: 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                },
                {
                  id: 'pocketbase',
                  name: 'PocketBase',
                  badge: 'Lightweight SQLite',
                  desc: '1 binario, REST, Realtime',
                  color: 'border-indigo-500 bg-indigo-50/40 text-indigo-800'
                },
                {
                  id: 'firebase',
                  name: 'Firebase',
                  badge: 'Firestore NoSQL',
                  desc: 'Google Cloud, Auth, Rules',
                  color: 'border-amber-500 bg-amber-50/40 text-amber-800'
                },
                {
                  id: 'mongodb',
                  name: 'MongoDB',
                  badge: 'Atlas Cluster',
                  desc: 'JSON Document Store',
                  color: 'border-cyan-500 bg-cyan-50/40 text-cyan-800'
                },
                {
                  id: 'postgresql',
                  name: 'PostgreSQL',
                  badge: 'Dedicated VPS DB',
                  desc: 'Relacional puro estándar',
                  color: 'border-blue-500 bg-blue-50/40 text-blue-800'
                }
              ].map((p) => {
                const isSelected = saasDatabaseConfig.provider === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => updateSaasDatabaseConfig({ provider: p.id as any })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${p.color} ring-2 ring-indigo-400 ring-offset-1 shadow-md scale-[1.02]`
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-slate-900">{p.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 mb-1">
                      {p.badge}
                    </span>
                    <p className="text-[11px] text-slate-500 leading-tight">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configuration Form based on selected provider */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  Credenciales de Conexión: {saasDatabaseConfig.provider.toUpperCase()}
                </h3>
                <p className="text-xs text-slate-500">
                  Los datos sensibles se resguardan cifrados con algoritmo AES-256 en las variables de entorno.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Sincronización Automática:</label>
                <input
                  type="checkbox"
                  checked={saasDatabaseConfig.autoSync}
                  onChange={(e) => updateSaasDatabaseConfig({ autoSync: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* POCKETBASE CONFIG */}
            {saasDatabaseConfig.provider === 'pocketbase' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PocketBase Host / URL</label>
                  <input
                    type="text"
                    placeholder="https://pb.tudominio.com o http://127.0.0.1:8090"
                    value={saasDatabaseConfig.pocketbase?.apiUrl || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        pocketbase: { ...saasDatabaseConfig.pocketbase, apiUrl: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Admin Master PocketBase</label>
                  <input
                    type="email"
                    placeholder="admin@tudominio.com"
                    value={saasDatabaseConfig.pocketbase?.adminEmail || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        pocketbase: { ...saasDatabaseConfig.pocketbase, adminEmail: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña Admin Master</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={saasDatabaseConfig.pocketbase?.adminPassword || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        pocketbase: { ...saasDatabaseConfig.pocketbase, adminPassword: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saasDatabaseConfig.pocketbase?.autoCreateCollections !== false}
                      onChange={(e) =>
                        updateSaasDatabaseConfig({
                          pocketbase: {
                            ...saasDatabaseConfig.pocketbase,
                            autoCreateCollections: e.target.checked
                          } as any
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Crear automáticamente colecciones (tenants, clients, policies, audit_logs)</span>
                  </label>
                </div>
              </div>
            )}

            {/* SUPABASE CONFIG */}
            {saasDatabaseConfig.provider === 'supabase' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project URL (Supabase API)</label>
                  <input
                    type="text"
                    placeholder="https://xyzcompany.supabase.co"
                    value={saasDatabaseConfig.supabase?.projectUrl || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        supabase: { ...saasDatabaseConfig.supabase, projectUrl: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Anon Public Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={saasDatabaseConfig.supabase?.anonPublicKey || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        supabase: { ...saasDatabaseConfig.supabase, anonPublicKey: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Service Role Key (Secret Backend Master)</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={saasDatabaseConfig.supabase?.serviceRoleKey || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        supabase: { ...saasDatabaseConfig.supabase, serviceRoleKey: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Database Password (Postgres Direct)</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={saasDatabaseConfig.supabase?.dbPassword || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        supabase: { ...saasDatabaseConfig.supabase, dbPassword: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* FIREBASE CONFIG */}
            {saasDatabaseConfig.provider === 'firebase' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    placeholder="ateendia-crm-prod"
                    value={saasDatabaseConfig.firebase?.projectId || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        firebase: { ...saasDatabaseConfig.firebase, projectId: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Web API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={saasDatabaseConfig.firebase?.apiKey || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        firebase: { ...saasDatabaseConfig.firebase, apiKey: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Auth Domain</label>
                  <input
                    type="text"
                    placeholder="ateendia-crm-prod.firebaseapp.com"
                    value={saasDatabaseConfig.firebase?.authDomain || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        firebase: { ...saasDatabaseConfig.firebase, authDomain: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage Bucket</label>
                  <input
                    type="text"
                    placeholder="ateendia-crm-prod.appspot.com"
                    value={saasDatabaseConfig.firebase?.storageBucket || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        firebase: { ...saasDatabaseConfig.firebase, storageBucket: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* MONGODB CONFIG */}
            {saasDatabaseConfig.provider === 'mongodb' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">MongoDB Connection URI</label>
                  <input
                    type="password"
                    placeholder="mongodb+srv://admin:pass@cluster0.mongodb.net/?retryWrites=true&w=majority"
                    value={saasDatabaseConfig.mongodb?.connectionUri || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        mongodb: { ...saasDatabaseConfig.mongodb, connectionUri: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Base de Datos</label>
                  <input
                    type="text"
                    placeholder="ateendia_production"
                    value={saasDatabaseConfig.mongodb?.databaseName || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        mongodb: { ...saasDatabaseConfig.mongodb, databaseName: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* POSTGRESQL DEDICATED CONFIG */}
            {saasDatabaseConfig.provider === 'postgresql' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Host del Servidor</label>
                  <input
                    type="text"
                    placeholder="127.0.0.1 o db.tudominio.com"
                    value={saasDatabaseConfig.postgresql?.host || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        postgresql: { ...saasDatabaseConfig.postgresql, host: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Puerto (Default 5432)</label>
                  <input
                    type="number"
                    value={saasDatabaseConfig.postgresql?.port || 5432}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        postgresql: { ...saasDatabaseConfig.postgresql, port: parseInt(e.target.value) || 5432 } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de Base de Datos</label>
                  <input
                    type="text"
                    placeholder="ateendia_crm"
                    value={saasDatabaseConfig.postgresql?.database || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        postgresql: { ...saasDatabaseConfig.postgresql, database: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario DB</label>
                  <input
                    type="text"
                    placeholder="postgres"
                    value={saasDatabaseConfig.postgresql?.user || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        postgresql: { ...saasDatabaseConfig.postgresql, user: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={saasDatabaseConfig.postgresql?.password || ''}
                    onChange={(e) =>
                      updateSaasDatabaseConfig({
                        postgresql: { ...saasDatabaseConfig.postgresql, password: e.target.value } as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saasDatabaseConfig.postgresql?.ssl !== false}
                      onChange={(e) =>
                        updateSaasDatabaseConfig({
                          postgresql: {
                            ...saasDatabaseConfig.postgresql,
                            ssl: e.target.checked
                          } as any
                        })
                      }
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span>Conexión SSL Requerida (TLS)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: VPS INFRASTRUCTURE */}
      {activeSubTab === 'vps' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* VPS Server Specs */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Parámetros del Servidor VPS Central
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor de Servidor VPS / Cloud</label>
                  <select
                    value={saasVpsConfig.provider || 'contabo'}
                    onChange={(e) => updateSaasVpsConfig({ provider: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="contabo">Contabo Cloud VPS (Alemania / EE.UU. / Singapur / UK)</option>
                    <option value="ovh">OVH Cloud VPS & Dedicated (Francia / Canadá / Polonia / USA)</option>
                    <option value="hetzner">Hetzner Cloud (Alemania / Finlandia / Ashburn USA)</option>
                    <option value="digitalocean">DigitalOcean Droplet</option>
                    <option value="aws">AWS EC2 / Lightsail</option>
                    <option value="linode">Linode / Akamai Cloud</option>
                    <option value="vultr">Vultr High Frequency Compute</option>
                    <option value="hostinger">Hostinger KVM VPS</option>
                    <option value="coolify">Coolify / CapRover Self-Hosted PaaS</option>
                    <option value="custom">Servidor Dedicado On-Premise / Bare-Metal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IP Pública del Servidor</label>
                    <input
                      type="text"
                      placeholder="159.69.84.120"
                      value={saasVpsConfig.serverIp}
                      onChange={(e) => updateSaasVpsConfig({ serverIp: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Puerto SSH</label>
                    <input
                      type="number"
                      value={saasVpsConfig.sshPort || 22}
                      onChange={(e) => updateSaasVpsConfig({ sshPort: parseInt(e.target.value) || 22 })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario SSH Root/Deployer</label>
                  <input
                    type="text"
                    placeholder="root o deploy"
                    value={saasVpsConfig.sshUser || 'root'}
                    onChange={(e) => updateSaasVpsConfig({ sshUser: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* CONTABO DEDICATED FORM */}
                {saasVpsConfig.provider === 'contabo' && (
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-indigo-700" />
                        Configuración de API & Región Contabo
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded font-bold">
                        Contabo API v1
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Client ID (OAuth)</label>
                        <input
                          type="text"
                          placeholder="client-contabo-uuid"
                          value={saasVpsConfig.contabo?.clientId || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              contabo: { ...saasVpsConfig.contabo, clientId: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">API Secret / Token</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={saasVpsConfig.contabo?.apiToken || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              contabo: { ...saasVpsConfig.contabo, apiToken: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Data Center Región</label>
                        <select
                          value={saasVpsConfig.contabo?.dataCenterRegion || 'US-east'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              contabo: {
                                ...saasVpsConfig.contabo,
                                dataCenterRegion: e.target.value as any
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <option value="US-east">🇺🇸 US East (New York / Miami)</option>
                          <option value="US-central">🇺🇸 US Central (St. Louis)</option>
                          <option value="US-west">🇺🇸 US West (Seattle)</option>
                          <option value="EU">🇩🇪 Unión Europea (Alemania)</option>
                          <option value="UK">🇬🇧 Reino Unido (Londres)</option>
                          <option value="SIN">🇸🇬 Asia Pacífico (Singapur)</option>
                          <option value="AUS">🇦🇺 Oceanía (Sídney)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Modelo / Plan VPS</label>
                        <select
                          value={saasVpsConfig.contabo?.instanceType || 'VPS M'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              contabo: {
                                ...saasVpsConfig.contabo,
                                instanceType: e.target.value as any
                              }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <option value="VPS S">VPS S (4 vCPU / 8 GB RAM / 50 GB NVMe)</option>
                          <option value="VPS M">VPS M (6 vCPU / 16 GB RAM / 100 GB NVMe)</option>
                          <option value="VPS L">VPS L (8 vCPU / 30 GB RAM / 200 GB NVMe)</option>
                          <option value="VPS XL">VPS XL (10 vCPU / 60 GB RAM / 400 GB NVMe)</option>
                          <option value="VDS S">VDS S (Dedicado 3 vCPU / 24 GB RAM)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* OVH CLOUD DEDICATED FORM */}
                {saasVpsConfig.provider === 'ovh' && (
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-700" />
                        Credenciales OVHcloud API & OpenStack
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-800 rounded font-bold">
                        Anti-DDoS VAC Activo
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Application Key (AK)</label>
                        <input
                          type="text"
                          placeholder="ovh-app-key-123"
                          value={saasVpsConfig.ovh?.applicationKey || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, applicationKey: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Application Secret (AS)</label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••"
                          value={saasVpsConfig.ovh?.applicationSecret || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, applicationSecret: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Consumer Key (CK)</label>
                        <input
                          type="password"
                          placeholder="consumer-token-xxx"
                          value={saasVpsConfig.ovh?.consumerKey || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, consumerKey: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Datacenter OVH</label>
                        <select
                          value={saasVpsConfig.ovh?.region || 'GRA'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, region: e.target.value as any }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <option value="GRA">🇫🇷 Gravelines (GRA, Francia)</option>
                          <option value="SBG">🇫🇷 Estrasburgo (SBG, Francia)</option>
                          <option value="BHS">🇨🇦 Beauharnois (BHS, Canadá / USA)</option>
                          <option value="VIN">🇺🇸 Vint Hill (VIN, Virginia USA)</option>
                          <option value="FRA">🇩🇪 Frankfurt (FRA, Alemania)</option>
                          <option value="WAW">🇵🇱 Varsovia (WAW, Polonia)</option>
                          <option value="UK">🇬🇧 Londres (UK)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Gama de Servidor OVH</label>
                        <select
                          value={saasVpsConfig.ovh?.vpsModel || 'Comfort'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, vpsModel: e.target.value as any }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <option value="Value">Value (1 vCPU / 2 GB / 40 GB NVMe)</option>
                          <option value="Essential">Essential (2 vCPU / 4 GB / 80 GB NVMe)</option>
                          <option value="Comfort">Comfort (4 vCPU / 8 GB / 160 GB NVMe)</option>
                          <option value="Elite">Elite (8 vCPU / 16 GB / 320 GB NVMe)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Protección Anti-DDoS</label>
                        <select
                          value={saasVpsConfig.ovh?.antiDdosMode || 'advanced'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              ovh: { ...saasVpsConfig.ovh, antiDdosMode: e.target.value as any }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                        >
                          <option value="standard">Anti-DDoS Estándar (Automático)</option>
                          <option value="advanced">Anti-DDoS Avanzado 24/7 (Recomendado)</option>
                          <option value="game">Anti-DDoS Game & Realtime Shield</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* HETZNER DEDICATED FORM */}
                {saasVpsConfig.provider === 'hetzner' && (
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3 animate-in fade-in">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-rose-700" />
                      Configuración Hetzner Cloud API (hcloud)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">API Token Hetzner</label>
                        <input
                          type="password"
                          placeholder="hcloud_token_••••••••"
                          value={saasVpsConfig.hetzner?.apiToken || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              hetzner: { ...saasVpsConfig.hetzner, apiToken: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Ubicación Datacenter</label>
                        <select
                          value={saasVpsConfig.hetzner?.location || 'fsn1'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              hetzner: { ...saasVpsConfig.hetzner, location: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold"
                        >
                          <option value="fsn1">🇩🇪 Falkenstein (fsn1, Alemania)</option>
                          <option value="nbg1">🇩🇪 Nuremberg (nbg1, Alemania)</option>
                          <option value="hel1">🇫🇮 Helsinki (hel1, Finlandia)</option>
                          <option value="ash">🇺🇸 Ashburn (ash, Virginia USA)</option>
                          <option value="hil">🇺🇸 Hillsboro (hil, Oregon USA)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* DIGITALOCEAN DEDICATED FORM */}
                {saasVpsConfig.provider === 'digitalocean' && (
                  <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 space-y-3 animate-in fade-in">
                    <span className="text-xs font-bold text-cyan-900 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-700" />
                      DigitalOcean Personal Access Token
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Bearer Token (dop_v1)</label>
                        <input
                          type="password"
                          placeholder="dop_v1_••••••••"
                          value={saasVpsConfig.digitalocean?.apiToken || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              digitalocean: { ...saasVpsConfig.digitalocean, apiToken: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Región Droplet</label>
                        <select
                          value={saasVpsConfig.digitalocean?.region || 'nyc1'}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              digitalocean: { ...saasVpsConfig.digitalocean, region: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold"
                        >
                          <option value="nyc1">🇺🇸 New York (NYC1)</option>
                          <option value="nyc3">🇺🇸 New York (NYC3)</option>
                          <option value="sfo3">🇺🇸 San Francisco (SFO3)</option>
                          <option value="fra1">🇩🇪 Frankfurt (FRA1)</option>
                          <option value="lon1">🇬🇧 London (LON1)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* AWS DEDICATED FORM */}
                {saasVpsConfig.provider === 'aws' && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-amber-700" />
                      Credenciales AWS IAM (EC2 / Lightsail)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Access Key ID</label>
                        <input
                          type="text"
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          value={saasVpsConfig.aws?.accessKeyId || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              aws: { ...saasVpsConfig.aws, accessKeyId: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Secret Access Key</label>
                        <input
                          type="password"
                          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                          value={saasVpsConfig.aws?.secretAccessKey || ''}
                          onChange={(e) =>
                            updateSaasVpsConfig({
                              aws: { ...saasVpsConfig.aws, secretAccessKey: e.target.value }
                            })
                          }
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SSL & Reverse Proxy */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Seguridad SSL Let's Encrypt & Nginx
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dominio Principal Apuntado</label>
                  <input
                    type="text"
                    placeholder="ateendia.cloud"
                    value={saasLandingConfig.domainName || 'ateendia.cloud'}
                    onChange={(e) => {
                      updateSaasVpsConfig({ domain: e.target.value });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Certificado SSL Automático:</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      {saasVpsConfig.sslEnabled ? 'Activo (Let\'s Encrypt)' : 'Desactivado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Nginx Reverse Proxy:</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                      {saasVpsConfig.nginxConfigured ? 'Habilitado' : 'Pendiente'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Subdominios Wildcard (*.dominio):</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                      Multi-Tenant Dinámico
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCKER & DEPLOYMENT SCRIPT */}
      {activeSubTab === 'docker_deploy' && (
        <div className="space-y-6">
          {/* Docker Compose File */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-cyan-300">docker-compose.yml</span>
              </div>
              <button
                onClick={() => handleCopy(dockerComposeCode, 'docker-compose')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'docker-compose' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'docker-compose' ? 'Copiado' : 'Copiar Archivo'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
              {dockerComposeCode}
            </pre>
          </div>

          {/* Deployment Script */}
          <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-emerald-300">deploy.sh (Script de 1-Clic)</span>
              </div>
              <button
                onClick={() => handleCopy(deployScriptCode, 'deploy-sh')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedKey === 'deploy-sh' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'deploy-sh' ? 'Copiado' : 'Copiar Script'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-300/90 overflow-x-auto border border-slate-800/80 leading-relaxed">
              {deployScriptCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
