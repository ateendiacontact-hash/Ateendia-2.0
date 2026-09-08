import { pb, COLLECTIONS } from './pocketbase';
import { IssabelConfig, CallRecord } from '../types';

export interface AmiAction {
  action: string;
  [key: string]: any;
}

export interface AmiResponse {
  response: string;
  actionid?: string;
  message?: string;
  [key: string]: any;
}

export interface ClickToCallData {
  number: string;
  clientId?: string;
  clientName?: string;
  agentExtension: string;
}

export interface CallResult {
  success: boolean;
  callId?: string;
  error?: string;
}

class PbxService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  private config: IssabelConfig | null = null;

  async initialize(): Promise<boolean> {
    try {
      this.config = await this.getConfig();
      if (!this.config?.isConnected) return false;
      
      await this.connectAMI();
      return true;
    } catch (e) {
      console.error('PBX initialization failed:', e);
      return false;
    }
  }

  async getConfig(): Promise<IssabelConfig | null> {
    try {
      const records = await pb.collection(COLLECTIONS.ISSABEL_CONFIG).getFullList({
        filter: `tenantId = "${pb.authStore.model?.tenantId}"`,
      });
      return records[0] as unknown as IssabelConfig || null;
    } catch (e) {
      return null;
    }
  }

  async saveConfig(config: Partial<IssabelConfig>): Promise<IssabelConfig> {
    const existing = await this.getConfig();
    if (existing) {
      const existingRecord = await pb.collection(COLLECTIONS.ISSABEL_CONFIG).getFirstListItem(`tenantId = "${pb.authStore.model?.tenantId}"`);
      return pb.collection(COLLECTIONS.ISSABEL_CONFIG).update(existingRecord.id, config) as unknown as IssabelConfig;
    }
    return pb.collection(COLLECTIONS.ISSABEL_CONFIG).create({
      ...config,
      tenantId: pb.authStore.model?.tenantId,
    }) as unknown as IssabelConfig;
  }

  async testConnection(config?: Partial<IssabelConfig>): Promise<{ success: boolean; message: string }> {
    const testConfig = config || this.config;
    if (!testConfig) return { success: false, message: 'No hay configuración' };

    try {
      // Test AMI connection
      const ws = new WebSocket(`ws://${testConfig.host}:${testConfig.amiPort}/ws`);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.close();
          resolve({ success: false, message: 'Timeout de conexión' });
        }, 5000);

        ws.onopen = () => {
          // Send login action
          ws.send(JSON.stringify({
            action: 'Login',
            username: testConfig.amiUser,
            secret: testConfig.amiSecret,
          }));
        };

        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (response.response === 'Success') {
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true, message: 'Conexión AMI exitosa' });
          } else if (response.response === 'Error') {
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, message: response.message || 'Error de autenticación AMI' });
          }
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve({ success: false, message: 'Error de conexión WebSocket' });
        };
      });
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  private async connectAMI(): Promise<void> {
    if (!this.config) return;

    try {
      this.ws = new WebSocket(`ws://${this.config.host}:${this.config.amiPort}/ws`);
      
      this.ws.onopen = () => {
        console.log('AMI WebSocket connected');
        this.reconnectAttempts = 0;
        this.sendAction({ action: 'Login', username: this.config!.amiUser, secret: this.config!.amiSecret });
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          this.handleAmiResponse(response);
        } catch (e) {
          console.error('AMI message parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.log('AMI WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('AMI WebSocket error:', error);
      };
    } catch (e) {
      console.error('AMI connection error:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connectAMI(), 5000 * this.reconnectAttempts);
    }
  }

  private sendAction(action: AmiAction) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(action));
    }
  }

  private handleAmiResponse(response: AmiResponse) {
    // Emit to listeners
    const event = response.event?.toLowerCase() || 'response';
    this.emit(event, response);
    
    // Handle specific events
    switch (response.event) {
      case 'Newchannel':
        this.emit('call_started', response);
        break;
      case 'Hangup':
        this.emit('call_ended', response);
        break;
      case 'BridgeEnter':
        this.emit('call_answered', response);
        break;
      case 'Cdr':
        this.handleCdr(response);
        break;
    }
  }

  private async handleCdr(cdr: any) {
    const callRecord: Partial<CallRecord> = {
      tenantId: pb.authStore.model?.tenantId,
      clientId: cdr.calleridnum ? await this.findClientByPhone(cdr.calleridnum) : undefined,
      agentId: pb.authStore.model?.id,
      agentName: pb.authStore.model?.name,
      agentExtension: pb.authStore.model?.extension,
      destinationNumber: cdr.dst,
      direction: cdr.direction || 'outbound',
      status: cdr.disposition,
      durationSeconds: parseInt(cdr.duration) || 0,
      recordingUrl: cdr.recordingfile,
      timestamp: new Date().toISOString(),
    };

    await pb.collection(COLLECTIONS.CALL_RECORDS).create(callRecord);
    this.emit('cdr_received', callRecord);
  }

  private async findClientByPhone(phone: string): Promise<string | undefined> {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const clients = await pb.collection(COLLECTIONS.CLIENTS).getList(1, 1, {
        filter: `tenantId = "${pb.authStore.model?.tenantId}" && phone ~ "${cleanPhone}"`,
      });
      return clients.items[0]?.id;
    } catch {
      return undefined;
    }
  }

  async clickToCall(data: ClickToCallData): Promise<CallResult> {
    if (!this.config) return { success: false, error: 'PBX no configurado' };

    try {
      const channel = `SIP/${data.agentExtension}`;
      const extension = data.number;
      const context = this.config.defaultContext || 'from-internal';
      const callerId = data.clientName ? `${data.clientName} <${data.number}>` : data.number;

      this.sendAction({
        action: 'Originate',
        channel,
        ext: extension,
        context,
        priority: 1,
        callerid: callerId,
        timeout: 30000,
        async: true,
        actionid: `call_${Date.now()}`,
      });

      // Create pending call record
      const callRecord = await pb.collection(COLLECTIONS.CALL_RECORDS).create({
        tenantId: pb.authStore.model?.tenantId,
        clientId: data.clientId,
        clientName: data.clientName,
        agentId: pb.authStore.model?.id,
        agentName: pb.authStore.model?.name,
        agentExtension: data.agentExtension,
        destinationNumber: data.number,
        direction: 'outbound',
        status: 'RINGING',
        timestamp: new Date().toISOString(),
      });

      return { success: true, callId: callRecord.id };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async hangupCall(channel: string): Promise<CallResult> {
    this.sendAction({ action: 'Hangup', channel });
    return { success: true };
  }

  async transferCall(channel: string, extension: string): Promise<CallResult> {
    this.sendAction({ action: 'Redirect', channel, ext: extension, context: this.config?.defaultContext || 'from-internal', priority: 1 });
    return { success: true };
  }

  async getCallHistory(filters?: { clientId?: string; agentId?: string; dateFrom?: string; dateTo?: string }, page = 1, perPage = 50) {
    let filter = `tenantId = "${pb.authStore.model?.tenantId}"`;
    
    if (filters?.clientId) filter += ` && clientId = "${filters.clientId}"`;
    if (filters?.agentId) filter += ` && agentId = "${filters.agentId}"`;
    if (filters?.dateFrom) filter += ` && timestamp >= "${filters.dateFrom}"`;
    if (filters?.dateTo) filter += ` && timestamp <= "${filters.dateTo}"`;

    return pb.collection(COLLECTIONS.CALL_RECORDS).getList(page, perPage, { filter, sort: '-timestamp' });
  }

  async getActiveCalls(): Promise<any[]> {
    // Query AMI for active channels
    this.sendAction({ action: 'Status' });
    // Response will come via event listener
    return [];
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.eventListeners.get(event)?.forEach(cb => cb(data));
    this.eventListeners.get('*')?.forEach(cb => cb(data));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const pbxService = new PbxService();
export default pbxService;