import { useContext, useEffect, useState, useCallback } from 'react';
import { TenantBranding } from '../types';
import { useTenant } from '../context/TenantContext';
import { 
  initializeApiClient, 
  clientsService,
  policiesService,
  pipelineService,
  whatsappService,
  templatesService,
  campaignsService,
  integrationsService,
  smtpService,
  bankingService,
  telephonyService,
  documentsService,
  notesService,
  activitiesService,
  auditService,
  alertsService,
  notificationsService,
  saasService,
  usersService,
  brandingService,
} from '../services';
import { useService, useServiceList } from '../hooks/useService';

export function useServices() {
  const { currentTenant, currentUser } = useTenant();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      initializeApiClient(currentTenant);
      setInitialized(true);
    }
  }, [currentTenant]);

  // Clients
  const clientsList = useServiceList(
    useCallback((filters, page, pageSize) => clientsService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createClient = useService(
    useCallback((data) => clientsService.create(data), []),
    { showToast: true }
  );

  const updateClient = useService(
    useCallback((data) => clientsService.update(data), []),
    { showToast: true }
  );

  const deleteClient = useService(
    useCallback((id) => clientsService.delete(id), []),
    { showToast: true }
  );

  // Policies
  const policiesList = useServiceList(
    useCallback((filters, page, pageSize) => policiesService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createPolicy = useService(
    useCallback((data) => policiesService.create(data), []),
    { showToast: true }
  );

  const updatePolicy = useService(
    useCallback((data) => policiesService.update(data), []),
    { showToast: true }
  );

  const deletePolicy = useService(
    useCallback((id) => policiesService.delete(id), []),
    { showToast: true }
  );

  // Pipeline
  const pipelines = useServiceList(
    useCallback((_, page, pageSize) => pipelineService.getAll().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  const moveClientStage = useService(
    useCallback((data) => pipelineService.moveClientStage(data), []),
    { showToast: true }
  );

  const reassignClient = useService(
    useCallback((clientId, agentId) => pipelineService.reassignClient(clientId, agentId), []),
    { showToast: true }
  );

  // WhatsApp
  const whatsappConfig = useService(
    useCallback(() => whatsappService.getConfig(), []),
    { showToast: false }
  );

  const updateWhatsAppConfig = useService(
    useCallback((config) => whatsappService.updateConfig(config), []),
    { showToast: true }
  );

  const conversations = useServiceList(
    useCallback((_, page, pageSize) => whatsappService.getConversations().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  const sendWhatsAppMessage = useService(
    useCallback((data) => whatsappService.sendMessage(data), []),
    { showToast: true }
  );

  const startWhatsAppConversation = useService(
    useCallback((data) => whatsappService.startConversation(data), []),
    { showToast: true }
  );

  // Templates
  const templatesList = useServiceList(
    useCallback((filters, page, pageSize) => templatesService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createTemplate = useService(
    useCallback((data) => templatesService.create(data), []),
    { showToast: true }
  );

  const updateTemplate = useService(
    useCallback((data) => templatesService.update(data), []),
    { showToast: true }
  );

  const deleteTemplate = useService(
    useCallback((id) => templatesService.delete(id), []),
    { showToast: true }
  );

  // Campaigns
  const campaignsList = useServiceList(
    useCallback((filters, page, pageSize) => campaignsService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createCampaign = useService(
    useCallback((data) => campaignsService.create(data), []),
    { showToast: true }
  );

  const executeCampaign = useService(
    useCallback((data) => campaignsService.execute(data), []),
    { showToast: true }
  );

  // Integrations (n8n, AI, Vectors)
  const n8nConfig = useService(
    useCallback(() => integrationsService.getN8nConfig(), []),
    { showToast: false }
  );

  const updateN8nConfig = useService(
    useCallback((config) => integrationsService.updateN8nConfig(config), []),
    { showToast: true }
  );

  const testN8nConnection = useService(
    useCallback((config) => integrationsService.testN8nConnection(config), []),
    { showToast: true }
  );

  const aiConfig = useService(
    useCallback(() => integrationsService.getAiConfig(), []),
    { showToast: false }
  );

  const updateAiConfig = useService(
    useCallback((config) => integrationsService.updateAiConfig(config), []),
    { showToast: true }
  );

  const testAiInference = useService(
    useCallback((prompt, config) => integrationsService.testAiInference(prompt, config), []),
    { showToast: true }
  );

  const knowledgeBase = useServiceList(
    useCallback((_, page, pageSize) => integrationsService.getKnowledgeBase().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  const searchKnowledgeBase = useService(
    useCallback((query, topK) => integrationsService.searchKnowledgeBase(query, topK), []),
    { showToast: false }
  );

  const uploadDocument = useService(
    useCallback((file, metadata) => integrationsService.uploadDocument(file, metadata), []),
    { showToast: true }
  );

  const scheduledRules = useServiceList(
    useCallback((_, page, pageSize) => integrationsService.getScheduledRules().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  const updateScheduledRules = useService(
    useCallback((rules) => integrationsService.updateScheduledRules(rules), []),
    { showToast: true }
  );

  const antiSpamSettings = useService(
    useCallback(() => integrationsService.getAntiSpamSettings(), []),
    { showToast: false }
  );

  const updateAntiSpamSettings = useService(
    useCallback((settings) => integrationsService.updateAntiSpamSettings(settings), []),
    { showToast: true }
  );

  // SMTP
  const smtpConfig = useService(
    useCallback(() => smtpService.getConfig(), []),
    { showToast: false }
  );

  const updateSmtpConfig = useService(
    useCallback((config) => smtpService.updateConfig(config), []),
    { showToast: true }
  );

  const testSmtpConnection = useService(
    useCallback((toEmail, config) => smtpService.testConnection({ toEmail, config }), []),
    { showToast: true }
  );

  const sendEmail = useService(
    useCallback((data) => smtpService.sendEmail(data), []),
    { showToast: true }
  );

  // Banking
  const bankAccounts = useServiceList(
    useCallback((filters, page, pageSize) => bankingService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createBankAccount = useService(
    useCallback((data) => bankingService.create(data), []),
    { showToast: true }
  );

  const updateBankAccount = useService(
    useCallback((data) => bankingService.update(data), []),
    { showToast: true }
  );

  const deleteBankAccount = useService(
    useCallback((id) => bankingService.delete(id), []),
    { showToast: true }
  );

  const setDefaultPaymentMethod = useService(
    useCallback((clientId, paymentMethodId) => bankingService.setDefault(clientId, paymentMethodId), []),
    { showToast: true }
  );

  // Telephony
  const issabelConfig = useService(
    useCallback(() => telephonyService.getConfig(), []),
    { showToast: false }
  );

  const updateIssabelConfig = useService(
    useCallback((config) => telephonyService.updateConfig(config), []),
    { showToast: true }
  );

  const testIssabelConnection = useService(
    useCallback((config) => telephonyService.testConnection(config), []),
    { showToast: true }
  );

  const callRecords = useServiceList(
    useCallback((filters, page, pageSize) => telephonyService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const startCall = useService(
    useCallback((data) => telephonyService.startCall(data), []),
    { showToast: true }
  );

  const endCall = useService(
    useCallback((data) => telephonyService.endCall(data), []),
    { showToast: true }
  );

  // Documents
  const documents = useServiceList(
    useCallback((filters, page, pageSize) => documentsService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createDocument = useService(
    useCallback((data) => documentsService.create(data), []),
    { showToast: true }
  );

  const deleteDocument = useService(
    useCallback((id) => documentsService.delete(id), []),
    { showToast: true }
  );

  const uploadDocumentFile = useService(
    useCallback((file, clientId, metadata) => documentsService.upload(file, clientId, metadata), []),
    { showToast: true }
  );

  // Notes
  const notes = useServiceList(
    useCallback((filters, page, pageSize) => notesService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createNote = useService(
    useCallback((data) => notesService.create(data), []),
    { showToast: true }
  );

  // Activities
  const activities = useServiceList(
    useCallback((filters, page, pageSize) => activitiesService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createActivity = useService(
    useCallback((data) => activitiesService.create(data), []),
    { showToast: false }
  );

  // Audit
  const auditLogs = useServiceList(
    useCallback((filters, page, pageSize) => auditService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const recordAudit = useService(
    useCallback((data) => auditService.record(data), []),
    { showToast: false }
  );

  // Alerts
  const alerts = useServiceList(
    useCallback((_, page, pageSize) => alertsService.getAll().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  const dismissAlert = useService(
    useCallback((id) => alertsService.dismiss(id), []),
    { showToast: true }
  );

  // Notifications
  const notifications = useServiceList(
    useCallback((page, pageSize) => notificationsService.list(page, pageSize), []),
    { showToast: false }
  );

  const markNotificationRead = useService(
    useCallback((id) => notificationsService.markAsRead(id), []),
    { showToast: false }
  );

  // SaaS
  const saasTenants = useServiceList(
    useCallback((page, pageSize) => saasService.listTenants(page, pageSize), []),
    { showToast: false }
  );

  const createTenant = useService(
    useCallback((data) => saasService.createTenant(data), []),
    { showToast: true }
  );

  const updateTenant = useService(
    useCallback((data) => saasService.updateTenant(data), []),
    { showToast: true }
  );

  const saasPlans = useServiceList(
    useCallback((_, page, pageSize) => saasService.getPlans().then(r => ({ success: r.success, data: { data: r.data || [], total: r.data?.length || 0, page: 1, pageSize: 100, totalPages: 1 } })), []),
    { showToast: false }
  );

  // Users
  const usersList = useServiceList(
    useCallback((filters, page, pageSize) => usersService.list(filters, page, pageSize), []),
    { showToast: false }
  );

  const createUser = useService(
    useCallback((data) => usersService.create(data), []),
    { showToast: true }
  );

  const updateUser = useService(
    useCallback((data) => usersService.update(data), []),
    { showToast: true }
  );

  const updateUserRole = useService(
    useCallback((id, role) => usersService.updateRole(id, role), []),
    { showToast: true }
  );

  const toggleUser2FA = useService(
    useCallback((userId, enabled) => usersService.toggle2FA({ userId, enabled }), []),
    { showToast: true }
  );

  // Branding
  const tenantBranding = useService(
    useCallback(() => brandingService.getBranding(), []),
    { showToast: false }
  );

  const updateBranding = useService(
    useCallback((data) => brandingService.updateBranding(data), []),
    { showToast: true }
  );

  const tenantLandingConfig = useService(
    useCallback(() => brandingService.getLandingConfig(), []),
    { showToast: false }
  );

  const updateLandingConfig = useService(
    useCallback((config) => brandingService.updateLandingConfig(config), []),
    { showToast: true }
  );

  return {
    initialized,
    currentTenant,
    currentUser,
    // Clients
    clientsList,
    createClient,
    updateClient,
    deleteClient,
    // Policies
    policiesList,
    createPolicy,
    updatePolicy,
    deletePolicy,
    // Pipeline
    pipelines,
    moveClientStage,
    reassignClient,
    // WhatsApp
    whatsappConfig,
    updateWhatsAppConfig,
    conversations,
    sendWhatsAppMessage,
    startWhatsAppConversation,
    // Templates
    templatesList,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // Campaigns
    campaignsList,
    createCampaign,
    executeCampaign,
    // Integrations
    n8nConfig,
    updateN8nConfig,
    testN8nConnection,
    aiConfig,
    updateAiConfig,
    testAiInference,
    knowledgeBase,
    searchKnowledgeBase,
    uploadDocument,
    scheduledRules,
    updateScheduledRules,
    antiSpamSettings,
    updateAntiSpamSettings,
    // SMTP
    smtpConfig,
    updateSmtpConfig,
    testSmtpConnection,
    sendEmail,
    // Banking
    bankAccounts,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    setDefaultPaymentMethod,
    // Telephony
    issabelConfig,
    updateIssabelConfig,
    testIssabelConnection,
    callRecords,
    startCall,
    endCall,
    // Documents
    documents,
    createDocument,
    deleteDocument,
    uploadDocumentFile,
    // Notes
    notes,
    createNote,
    // Activities
    activities,
    createActivity,
    // Audit
    auditLogs,
    recordAudit,
    // Alerts
    alerts,
    dismissAlert,
    // Notifications
    notifications,
    markNotificationRead,
    // SaaS
    saasTenants,
    createTenant,
    updateTenant,
    saasPlans,
    // Users
    usersList,
    createUser,
    updateUser,
    updateUserRole,
    toggleUser2FA,
    // Branding
    tenantBranding,
    updateBranding,
    tenantLandingConfig,
    updateLandingConfig,
  };
}