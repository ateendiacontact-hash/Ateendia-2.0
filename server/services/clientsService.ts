// ===========================================
// server/services/clientsService.ts
// Lógica de negocio del módulo de clientes.
// Aislamiento multi-tenant: TODAS las queries filtran por tenantId.
// ===========================================

import { prisma } from '../db.js';

// ─── Tipos ───

export interface ListClientsInput {
  tenantId: string;
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}

export interface ListClientsOutput {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateClientInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  birthDate?: string;
  gender?: string;
  idNumber?: string;
  category?: string;
  status?: string;
  leadSource?: string;
  assignedAgentId?: string;
  dealValue?: number;
}

export interface UpdateClientInput {
  tenantId: string;
  clientId: string;
  // Todos los campos son opcionales en update
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  secondaryPhone?: string;
  birthDate?: string;
  gender?: string;
  idNumber?: string;
  maritalStatus?: string;
  category?: string;
  status?: string;
  leadSource?: string;
  dealValue?: number;
}

// ─── Helpers ───

/**
 * Formatea un cliente de la DB al formato de respuesta API.
 * Extrae solo los campos necesarios (evita exponer metadatos).
 */
function formatClient(client: any) {
  return {
    id: client.id,
    tenantId: client.tenant_id,
    firstName: client.first_name,
    lastName: client.last_name,
    fullName: `${client.first_name} ${client.last_name}`.trim(),
    email: client.email,
    phone: client.phone,
    secondaryPhone: client.secondary_phone,
    birthDate: client.birth_date,
    gender: client.gender,
    idNumber: client.id_number,
    maritalStatus: client.marital_status,
    category: client.category,
    status: client.status,
    leadSource: client.lead_source,
    assignedAgentId: client.assigned_agent_id,
    pipelineId: client.pipeline_id,
    stageId: client.stage_id,
    dealValue: client.deal_value ? Number(client.deal_value) : 0,
    createdAt: client.created_at,
    updatedAt: client.updated_at,
  };
}

// ─── List ───

/**
 * Lista clientes con paginación, filtros y aislamiento por tenant.
 */
export async function listClients(input: ListClientsInput): Promise<ListClientsOutput> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  // Construir WHERE con filtros + tenantId (aislamiento)
  const where: any = {
    tenant_id: input.tenantId,  // ⬅️ AISLAMIENTO CRÍTICO
  };

  if (input.status) {
    where.status = input.status;
  }

  if (input.search && input.search.trim().length > 0) {
    const term = input.search.trim();
    where.OR = [
      { first_name: { contains: term } },
      { last_name: { contains: term } },
      { email: { contains: term } },
      { phone: { contains: term } },
    ];
  }

  // Ejecutar ambas queries en paralelo
  const [total, clients] = await Promise.all([
    prisma.clients.count({ where }),
    prisma.clients.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  return {
    data: clients.map(formatClient),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Get by ID ───

/**
 * Obtiene un cliente por ID, validando que pertenezca al tenant.
 * Devuelve null si no existe O si pertenece a otro tenant.
 */
export async function getClientById(tenantId: string, clientId: string) {
  const client = await prisma.clients.findFirst({
    where: {
      id: clientId,
      tenant_id: tenantId,  // ⬅️ AISLAMIENTO CRÍTICO
    },
  });

  return client ? formatClient(client) : null;
}

// ─── Create ───

/**
 * Crea un cliente nuevo.
 */
export async function createClient(input: CreateClientInput) {
  const id = `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const client = await prisma.clients.create({
    data: {
      id,
      tenant_id: input.tenantId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email ?? null,
      phone: input.phone,
      secondary_phone: input.secondaryPhone ?? null,
      birth_date: input.birthDate ? new Date(input.birthDate) : null,
      gender: input.gender ?? null,
      id_number: input.idNumber ?? null,
      category: input.category ?? 'General',
      status: input.status ?? 'Lead',
      lead_source: input.leadSource ?? null,
      assigned_agent_id: input.assignedAgentId ?? null,
      deal_value: input.dealValue ?? 0,
    },
  });

  return formatClient(client);
}

// ─── Update ───

/**
 * Actualiza un cliente existente.
 * Devuelve null si no existe o no pertenece al tenant.
 */
export async function updateClient(input: UpdateClientInput) {
  // Verificar primero que exista y pertenezca al tenant
  const existing = await prisma.clients.findFirst({
    where: {
      id: input.clientId,
      tenant_id: input.tenantId,
    },
  });

  if (!existing) {
    return null;
  }

  // Construir el update solo con los campos provistos
  const data: any = {};

  if (input.firstName !== undefined)      data.first_name = input.firstName;
  if (input.lastName !== undefined)       data.last_name = input.lastName;
  if (input.email !== undefined)          data.email = input.email;
  if (input.phone !== undefined)          data.phone = input.phone;
  if (input.secondaryPhone !== undefined) data.secondary_phone = input.secondaryPhone;
  if (input.birthDate !== undefined)      data.birth_date = input.birthDate ? new Date(input.birthDate) : null;
  if (input.gender !== undefined)         data.gender = input.gender;
  if (input.idNumber !== undefined)       data.id_number = input.idNumber;
  if (input.maritalStatus !== undefined)  data.marital_status = input.maritalStatus;
  if (input.category !== undefined)       data.category = input.category;
  if (input.status !== undefined)         data.status = input.status;
  if (input.leadSource !== undefined)     data.lead_source = input.leadSource;
  if (input.dealValue !== undefined)      data.deal_value = input.dealValue;

  const updated = await prisma.clients.update({
    where: { id: input.clientId },
    data,
  });

  return formatClient(updated);
}

// ─── Delete (soft) ───

/**
 * Soft delete: marca el cliente como 'Inactivo' sin borrarlo físicamente.
 * Devuelve true si se actualizó, false si no existe o no pertenece al tenant.
 */
export async function deleteClient(tenantId: string, clientId: string): Promise<boolean> {
  const existing = await prisma.clients.findFirst({
    where: {
      id: clientId,
      tenant_id: tenantId,
    },
  });

  if (!existing) {
    return false;
  }

  await prisma.clients.update({
    where: { id: clientId },
    data: { status: 'Inactivo' },
  });

  return true;
}