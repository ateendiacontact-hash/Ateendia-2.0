// Country codes with flags for phone input
const COUNTRY_CODES_LIST = [
  { code: '1', flag: '🇺🇸', name: 'EE.UU.', dialCode: '+1' },
  { code: '58', flag: '🇻🇪', name: 'Venezuela', dialCode: '+58' },
  { code: '57', flag: '🇨🇴', name: 'Colombia', dialCode: '+57' },
  { code: '52', flag: '🇲🇽', name: 'México', dialCode: '+52' },
  { code: '34', flag: '🇪🇸', name: 'España', dialCode: '+34' },
  { code: '54', flag: '🇦🇷', name: 'Argentina', dialCode: '+54' },
  { code: '56', flag: '🇨🇱', name: 'Chile', dialCode: '+56' },
  { code: '51', flag: '🇵🇪', name: 'Perú', dialCode: '+51' },
  { code: '55', flag: '🇧🇷', name: 'Brasil', dialCode: '+55' },
  { code: '593', flag: '🇪🇨', name: 'Ecuador', dialCode: '+593' },
  { code: '595', flag: '🇵🇾', name: 'Paraguay', dialCode: '+595' },
  { code: '598', flag: '🇺🇾', name: 'Uruguay', dialCode: '+598' },
  { code: '591', flag: '🇧🇴', name: 'Bolivia', dialCode: '+591' },
  { code: '506', flag: '🇨🇷', name: 'Costa Rica', dialCode: '+506' },
  { code: '507', flag: '🇵🇦', name: 'Panamá', dialCode: '+507' },
  { code: '503', flag: '🇸🇻', name: 'El Salvador', dialCode: '+503' },
  { code: '504', flag: '🇭🇳', name: 'Honduras', dialCode: '+504' },
  { code: '505', flag: '🇳🇮', name: 'Nicaragua', dialCode: '+505' },
  { code: '502', flag: '🇬🇹', name: 'Guatemala', dialCode: '+502' },
];

export interface EvolutionInstance {
  name: string;
  instanceName?: string;
  connectionStatus?: string;
  state?: string;
  status?: string;
  ownerJid?: string;
  profile?: any;
}

export interface EvolutionQRResponse {
  base64?: string;
  code?: string;
  status?: string;
  pairingCode?: string;
}

export interface EvolutionSendResponse {
  key?: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message?: any;
  messageTimestamp?: number;
  status?: string;
}

const EVOLUTION_API_URL = import.meta.env.VITE_WHATSAPP_API_URL || 'http://13.140.37.155:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';

export const getEvolutionConfig = () => ({
  apiUrl: EVOLUTION_API_URL,
  apiKey: EVOLUTION_API_KEY,
});

export const getDefaultHeaders = () => ({
  'apikey': EVOLUTION_API_KEY,
  'Content-Type': 'application/json',
});

export const formatPhoneE164 = (countryCode: string, localNumber: string): string => {
  const cleanLocal = localNumber.replace(/\D/g, '');
  return `${countryCode}${cleanLocal}`;
};

export const parsePhoneE164 = (phone: string): { countryCode: string; localNumber: string } => {
  const clean = phone.replace(/\D/g, '');
  for (const c of COUNTRY_CODES_LIST) {
    if (clean.startsWith(c.code)) {
      return { countryCode: c.code, localNumber: clean.slice(c.code.length) };
    }
  }
  return { countryCode: '1', localNumber: clean };
};

export const COUNTRY_CODES = COUNTRY_CODES_LIST;

export async function deleteInstance(instanceName: string): Promise<boolean> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: { 'apikey': EVOLUTION_API_KEY },
    });
    return response.ok || response.status === 404;
  } catch {
    return false;
  }
}

export async function createInstance(instanceName: string): Promise<{ status: 'created' | 'exists' | 'connected' | 'error'; data?: any; needsDirectConnect?: boolean }> {
  try {
    await deleteInstance(instanceName);

    const checkResponse = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });
    const instances = await checkResponse.json().catch(() => []);
    const normalizedInstances = Array.isArray(instances) ? instances : 
      instances?.instance || instances?.instances || instances?.data || [];
    const existing = normalizedInstances.find((inst: any) => inst.name === instanceName || inst.instanceName === instanceName);

    if (existing && (existing.connectionStatus === 'open' || existing.state === 'open' || existing.status === 'open')) {
      return { status: 'connected', data: existing };
    }

    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 403 || response.status === 400) {
      return { status: 'exists', data, needsDirectConnect: true };
    }

    if (!response.ok) {
      console.error('Error creating instance:', data);
      return { status: 'error', data };
    }

    return { status: 'created', data };
  } catch (error) {
    console.error('Exception creating instance:', error);
    return { status: 'error', data: null };
  }
}

export async function fetchQR(instanceName: string): Promise<EvolutionQRResponse | null> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });
    return await response.json().catch(() => null);
  } catch (error) {
    console.error('Error fetching QR:', error);
    return null;
  }
}

export async function checkConnectionState(instanceName: string): Promise<{ connected: boolean; status?: string; instance?: EvolutionInstance }> {
  try {
    try {
      const stateResponse = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': EVOLUTION_API_KEY },
      });
      if (stateResponse.ok) {
        const stateData = await stateResponse.json().catch(() => ({}));
        const status = stateData?.state || stateData?.status || stateData?.connectionStatus;
        if (status === 'open') {
          return { connected: true, status: 'open', instance: stateData };
        }
        return { connected: false, status, instance: stateData };
      }
    } catch {
      // Fall through to fetchInstances
    }

    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
    });

    const rawData = await response.json().catch(() => null);
    if (!rawData) return { connected: false, status: 'error' };

    let instances: EvolutionInstance[] = [];
    if (Array.isArray(rawData)) {
      instances = rawData;
    } else if (rawData?.instance && Array.isArray(rawData.instance)) {
      instances = rawData.instance;
    } else if (rawData?.instances && Array.isArray(rawData.instances)) {
      instances = rawData.instances;
    } else if (rawData?.data && Array.isArray(rawData.data)) {
      instances = rawData.data;
    }

    const instance = instances.find((inst) => inst.name === instanceName || inst.instanceName === instanceName);
    const instanceStatus = instance?.connectionStatus || instance?.state || instance?.status;

    if (instance && instanceStatus === 'open') {
      return { connected: true, status: instanceStatus, instance };
    }

    if (instance) {
      return { connected: false, status: instanceStatus, instance };
    }

    return { connected: false, status: 'not_found' };
  } catch (error) {
    console.error('Error checking connection:', error);
    return { connected: false, status: 'error' };
  }
}

export async function sendTextMessage(instanceName: string, number: string, text: string): Promise<EvolutionSendResponse | null> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        number: number.replace(/\D/g, ''),
        text,
      }),
    });

    return await response.json().catch(() => null);
  } catch (error) {
    console.error('Error sending message:', error);
    return null;
  }
}

export async function sendMediaMessage(
  instanceName: string,
  number: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
  caption?: string,
  fileName?: string
): Promise<EvolutionSendResponse | null> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify({
        number: number.replace(/\D/g, ''),
        media: mediaUrl,
        mediatype: mediaType,
        caption: caption || '',
        fileName: fileName || 'file',
      }),
    });

    return await response.json().catch(() => null);
  } catch (error) {
    console.error('Error sending media:', error);
    return null;
  }
}