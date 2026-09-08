import { pb, COLLECTIONS } from './pocketbase';

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.ateendia.cloud/webhook';

export interface N8nWebhookPayload {
  event: string;
  payload: any;
  timestamp: string;
  tenantId?: string;
  userId?: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
}

export const n8nService = {
  // Send webhook to n8n
  async sendWebhook(event: string, payload: any): Promise<boolean> {
    if (!N8N_WEBHOOK_URL) return false;

    const webhookPayload: N8nWebhookPayload = {
      event,
      payload,
      timestamp: new Date().toISOString(),
      tenantId: pb.authStore.model?.tenantId,
      userId: pb.authStore.model?.id,
    };

    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      });
      return response.ok;
    } catch (e) {
      console.error('n8n webhook failed:', e);
      return false;
    }
  },

  // Predefined event emitters
  async emitClientCreated(client: any) {
    return this.sendWebhook('client.created', client);
  },

  async emitClientUpdated(client: any, changes: any) {
    return this.sendWebhook('client.updated', { client, changes });
  },

  async emitPolicyCreated(policy: any) {
    return this.sendWebhook('policy.created', policy);
  },

  async emitPolicyStatusChanged(policyId: string, oldStatus: string, newStatus: string) {
    return this.sendWebhook('policy.status_changed', { policyId, oldStatus, newStatus });
  },

  async emitPaymentDue(client: any, policy: any, daysUntilDue: number) {
    return this.sendWebhook('payment.due', { client, policy, daysUntilDue });
  },

  async emitDocumentExpiring(document: any, client: any, daysUntilExpiry: number) {
    return this.sendWebhook('document.expiring', { document, client, daysUntilExpiry });
  },

  async emitBirthday(client: any) {
    return this.sendWebhook('client.birthday', client);
  },

  async emitWhatsAppMessage(message: any, conversation: any) {
    return this.sendWebhook('whatsapp.message_received', { message, conversation });
  },

  async emitPipelineStageChanged(client: any, oldStage: string, newStage: string) {
    return this.sendWebhook('pipeline.stage_changed', { client, oldStage, newStage });
  },

  async emitLeadCreated(lead: any) {
    return this.sendWebhook('lead.created', lead);
  },

  async emitCallCompleted(call: any) {
    return this.sendWebhook('call.completed', call);
  },

  async emitCampaignExecuted(campaign: any, stats: any) {
    return this.sendWebhook('campaign.executed', { campaign, stats });
  },

  // Webhook endpoints for n8n to call back
  async handleN8nCallback(endpoint: string, data: any): Promise<any> {
    switch (endpoint) {
      case 'create-client':
        return this.handleCreateClient(data);
      case 'update-client':
        return this.handleUpdateClient(data);
      case 'create-policy':
        return this.handleCreatePolicy(data);
      case 'send-whatsapp':
        return this.handleSendWhatsApp(data);
      case 'send-email':
        return this.handleSendEmail(data);
      case 'update-pipeline-stage':
        return this.handleUpdatePipelineStage(data);
      case 'create-lead':
        return this.handleCreateLead(data);
      case 'create-deal':
        return this.handleCreateDeal(data);
      default:
        return { success: false, error: 'Unknown endpoint' };
    }
  },

  // Handlers for n8n callbacks
  async handleCreateClient(data: any) {
    const tenantId = data.tenantId || pb.authStore.model?.tenantId;
    const record = await pb.collection(COLLECTIONS.CLIENTS).create({
      ...data,
      tenantId,
      status: data.status || 'Lead',
      createdAt: new Date().toISOString(),
    });
    return { success: true, client: record };
  },

  async handleUpdateClient(data: any) {
    const { id, ...updates } = data;
    const record = await pb.collection(COLLECTIONS.CLIENTS).update(id, updates);
    return { success: true, client: record };
  },

  async handleCreatePolicy(data: any) {
    const tenantId = data.tenantId || pb.authStore.model?.tenantId;
    const record = await pb.collection(COLLECTIONS.POLICIES).create({
      ...data,
      tenantId,
      createdAt: new Date().toISOString(),
    });
    return { success: true, policy: record };
  },

  async handleSendWhatsApp(data: any) {
    const { instanceName, number, text, mediaUrl, mediaType } = data;
    const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://13.140.37.155:8080';
    const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution2026';

    const url = mediaUrl 
      ? `${EVOLUTION_API_URL}/message/sendMedia/${instanceName}`
      : `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;

    const body = mediaUrl
      ? { number: number.replace(/\D/g, ''), media: mediaUrl, mediatype: mediaType, caption: text }
      : { number: number.replace(/\D/g, ''), text };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'apikey': EVOLUTION_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return { success: response.ok, data: await response.json() };
  },

  async handleSendEmail(data: any) {
    const { to, subject, body, templateId, variables } = data;
    
    // Call email service
    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, templateId, variables }),
    });

    return { success: response.ok, data: await response.json() };
  },

  async handleUpdatePipelineStage(data: any) {
    const { clientId, stageId, notes } = data;
    const record = await pb.collection(COLLECTIONS.CLIENTS).update(clientId, {
      stageId,
      updatedAt: new Date().toISOString(),
    });
    
    // Create activity
    await pb.collection(COLLECTIONS.ACTIVITIES).create({
      clientId,
      type: 'stage_change',
      title: `Etapa actualizada a ${stageId}`,
      description: notes || '',
      userId: pb.authStore.model?.id,
      tenantId: pb.authStore.model?.tenantId,
    });

    return { success: true, client: record };
  },

  async handleCreateLead(data: any) {
    const tenantId = data.tenantId || pb.authStore.model?.tenantId;
    const record = await pb.collection(COLLECTIONS.LEADS).create({
      ...data,
      tenantId,
      status: 'new',
      createdAt: new Date().toISOString(),
    });
    return { success: true, lead: record };
  },

  async handleCreateDeal(data: any) {
    const tenantId = data.tenantId || pb.authStore.model?.tenantId;
    const record = await pb.collection(COLLECTIONS.DEALS).create({
      ...data,
      tenantId,
      createdAt: new Date().toISOString(),
    });
    return { success: true, deal: record };
  },

  // Subscribe to n8n workflow updates
  subscribeToWorkflows(callback: (workflows: N8nWorkflow[]) => void) {
    // This would typically be a separate WebSocket connection to n8n
    // For now, we'll poll or use a separate endpoint
    return () => {};
  },

  // Test n8n connection
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const start = Date.now();
    try {
      const response = await fetch(N8N_WEBHOOK_URL.replace('/webhook', '/healthz'), {
        method: 'GET',
      });
      const latency = Date.now() - start;
      return { success: response.ok, message: response.ok ? 'Conexión exitosa' : 'Error de conexión', latency };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
};

export default n8nService;