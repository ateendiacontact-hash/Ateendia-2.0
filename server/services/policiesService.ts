// ===========================================
// server/services/policiesService.ts
// Lógica de negocio del módulo de pólizas.
//
// Características:
//   - Aislamiento multi-tenant
//   - Validación dinámica con Zod desde DB
//   - Members embebidos (crear + actualizar)
//   - Versionado automático (policy_versions)
// ===========================================

import { prisma } from '../db.js';
import { getValidatorForType } from './policyValidators.js';

// ─── Tipos ───

export interface ListPoliciesInput {
  tenantId: string;
  page?: number;
  pageSize?: number;
  clientId?: string;
  typeId?: string;
  status?: string;
  search?: string;
}

export interface PolicyMemberInput {
  firstName: string;
  lastName: string;
  relationship: string;
  birthDate?: string;
  gender?: string;
  idNumber?: string;
  tobaccoUser?: boolean;
  status?: string;
}

export interface CreatePolicyInput {
  tenantId: string;
  clientId: string;
  typeId: string;
  carrier: string;
  planName: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate?: string;
  monthlyPremium: number;
  subsidyAptc?: number;
  clientPortion: number;
  paymentDueDay?: number;
  status?: string;
  agentId?: string;
  notes?: string;
  customFields?: Record<string, any>;
  members?: PolicyMemberInput[];
  createdBy: string;   // userId del creador (para version_0)
}

// ─── Helpers ───

function parseJsonField<T>(value: any): T | null {
  if (!value) return null;
  if (typeof value === 'object') return value as T;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatPolicy(policy: any, includeRelations = false) {
  const base = {
    id: policy.id,
    tenantId: policy.tenant_id,
    clientId: policy.client_id,
    typeId: policy.type_id,
    type: policy.type,
    carrier: policy.carrier,
    planName: policy.plan_name,
    policyNumber: policy.policy_number,
    effectiveDate: policy.effective_date,
    expirationDate: policy.expiration_date,
    monthlyPremium: policy.monthly_premium ? Number(policy.monthly_premium) : 0,
    subsidyAptc: policy.subsidy_aptc ? Number(policy.subsidy_aptc) : 0,
    clientPortion: policy.client_portion ? Number(policy.client_portion) : 0,
    paymentDueDay: policy.payment_due_day,
    status: policy.status,
    agentId: policy.agent_id,
    customFields: parseJsonField<Record<string, any>>(policy.custom_fields_json),
    notes: policy.notes,
    createdAt: policy.created_at,
    updatedAt: policy.updated_at,
  };

  if (!includeRelations) return base;

  return {
    ...base,
    client: policy.clients
      ? {
          id: policy.clients.id,
          firstName: policy.clients.first_name,
          lastName: policy.clients.last_name,
          fullName: `${policy.clients.first_name} ${policy.clients.last_name}`.trim(),
          email: policy.clients.email,
          phone: policy.clients.phone,
        }
      : null,
    policyType: policy.policy_types
      ? {
          id: policy.policy_types.id,
          key: policy.policy_types.key,
          name: policy.policy_types.name,
          shortName: policy.policy_types.short_name,
        }
      : null,
    members: policy.policy_members?.map((m: any) => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      relationship: m.relationship,
      birthDate: m.birth_date,
      gender: m.gender,
      idNumber: m.id_number,
      tobaccoUser: Boolean(m.tobacco_user),
      status: m.status,
    })) ?? [],
  };
}

function formatMember(member: any) {
  return {
    id: member.id,
    policyId: member.policy_id,
    firstName: member.first_name,
    lastName: member.last_name,
    relationship: member.relationship,
    birthDate: member.birth_date,
    gender: member.gender,
    idNumber: member.id_number,
    tobaccoUser: Boolean(member.tobacco_user),
    status: member.status,
  };
}

// ─── List ───

export async function listPolicies(input: ListPoliciesInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: any = {
    tenant_id: input.tenantId,   // ⬅️ AISLAMIENTO
  };

  if (input.clientId) where.client_id = input.clientId;
  if (input.typeId) where.type_id = input.typeId;
  if (input.status) where.status = input.status;

  if (input.search && input.search.trim().length > 0) {
    const term = input.search.trim();
    where.OR = [
      { policy_number: { contains: term } },
      { carrier: { contains: term } },
      { plan_name: { contains: term } },
    ];
  }

  const [total, policies] = await Promise.all([
    prisma.policies.count({ where }),
    prisma.policies.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
      include: {
        clients: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
        policy_types: { select: { id: true, key: true, name: true, short_name: true } },
      },
    }),
  ]);

  return {
    data: policies.map((p) => formatPolicy(p, true)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Get by ID ───

export async function getPolicyById(tenantId: string, policyId: string) {
  const policy = await prisma.policies.findFirst({
    where: {
      id: policyId,
      tenant_id: tenantId,   // ⬅️ AISLAMIENTO
    },
    include: {
      clients: { select: { id: true, first_name: true, last_name: true, email: true, phone: true } },
      policy_types: { select: { id: true, key: true, name: true, short_name: true } },
      policy_members: true,
    },
  });

  if (!policy) return null;

  return formatPolicy(policy, true);
}

// ─── Create ───

export async function createPolicy(input: CreatePolicyInput) {
  // 1. Verificar que el tipo existe
  const policyType = await prisma.policy_types.findUnique({
    where: { id: input.typeId },
    select: { id: true, key: true, name: true },
  });

  if (!policyType) {
    throw new Error('POLICY_TYPE_NOT_FOUND');
  }

  // 2. Validar campos específicos dinámicamente
  const validator = await getValidatorForType(input.typeId);
  const customFields = input.customFields ?? {};
  const validationResult = validator.safeParse(customFields);

  if (!validationResult.success) {
    const err = new Error('CUSTOM_FIELDS_INVALID');
    (err as any).details = validationResult.error.flatten().fieldErrors;
    throw err;
  }

  const id = `pol-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 3. Crear póliza + members + versión inicial en transacción
  const result = await prisma.$transaction(async (tx) => {
    const policy = await tx.policies.create({
      data: {
        id,
        tenant_id: input.tenantId,
        client_id: input.clientId,
        type_id: input.typeId,
        type: policyType.name,
        carrier: input.carrier,
        plan_name: input.planName,
        policy_number: input.policyNumber,
        effective_date: new Date(input.effectiveDate),
        expiration_date: input.expirationDate ? new Date(input.expirationDate) : null,
        monthly_premium: input.monthlyPremium,
        subsidy_aptc: input.subsidyAptc ?? 0,
        client_portion: input.clientPortion,
        payment_due_day: input.paymentDueDay ?? 1,
        status: input.status ?? 'En Proceso',
        agent_id: input.agentId ?? null,
        notes: input.notes ?? null,
        custom_fields_json: JSON.stringify(validationResult.data),
      },
    });

    // Crear members si los hay
    let members: any[] = [];
    if (input.members && input.members.length > 0) {
      for (const m of input.members) {
        const member = await tx.policy_members.create({
          data: {
            id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            policy_id: id,
            first_name: m.firstName,
            last_name: m.lastName,
            relationship: m.relationship,
            birth_date: m.birthDate ? new Date(m.birthDate) : null,
            gender: m.gender ?? null,
            id_number: m.idNumber ?? null,
            tobacco_user: m.tobaccoUser ?? false,
            status: m.status ?? 'Activo',
          },
        });
        members.push(member);
      }
    }

    // Crear versión inicial
    await tx.policy_versions.create({
      data: {
        id: `pver-${Date.now()}-v1`,
        policy_id: id,
        version: 1,
        changed_by: input.createdBy,
        change_reason: 'Creación inicial de la póliza',
        snapshot_json: JSON.stringify({
          ...policy,
          members: members.map(formatMember),
        }),
      },
    });

    return { policy, members };
  });

  return formatPolicy({ ...result.policy, policy_members: result.members }, true);
}


// ─── Update ───

export interface UpdatePolicyInput {
  tenantId: string;
  policyId: string;
  changedBy: string;      // userId del que edita
  changeReason?: string;
  // Campos editables
  carrier?: string;
  planName?: string;
  policyNumber?: string;
  effectiveDate?: string;
  expirationDate?: string;
  monthlyPremium?: number;
  subsidyAptc?: number;
  clientPortion?: number;
  paymentDueDay?: number;
  status?: string;
  agentId?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

export async function updatePolicy(input: UpdatePolicyInput) {
  // 1. Verificar que la póliza existe y pertenece al tenant
  const existing = await prisma.policies.findFirst({
    where: {
      id: input.policyId,
      tenant_id: input.tenantId,
    },
    include: {
      policy_members: true,
    },
  });

  if (!existing) {
    return null;
  }

  // 2. Si hay customFields, validar contra el tipo de póliza
  let validatedCustomFields: Record<string, any> | undefined;
  if (input.customFields) {
    const validator = await getValidatorForType(existing.type_id!);
    const validationResult = validator.safeParse(input.customFields);

    if (!validationResult.success) {
      const err = new Error('CUSTOM_FIELDS_INVALID');
      (err as any).details = validationResult.error.flatten().fieldErrors;
      throw err;
    }
    validatedCustomFields = validationResult.data;
  }

  // 3. Determinar el próximo número de versión
  const lastVersion = await prisma.policy_versions.findFirst({
    where: { policy_id: input.policyId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  // 4. Actualizar en transacción + guardar snapshot
  const result = await prisma.$transaction(async (tx) => {
    const data: any = {};

    if (input.carrier !== undefined) data.carrier = input.carrier;
    if (input.planName !== undefined) data.plan_name = input.planName;
    if (input.policyNumber !== undefined) data.policy_number = input.policyNumber;
    if (input.effectiveDate !== undefined) data.effective_date = new Date(input.effectiveDate);
    if (input.expirationDate !== undefined) {
      data.expiration_date = input.expirationDate ? new Date(input.expirationDate) : null;
    }
    if (input.monthlyPremium !== undefined) data.monthly_premium = input.monthlyPremium;
    if (input.subsidyAptc !== undefined) data.subsidy_aptc = input.subsidyAptc;
    if (input.clientPortion !== undefined) data.client_portion = input.clientPortion;
    if (input.paymentDueDay !== undefined) data.payment_due_day = input.paymentDueDay;
    if (input.status !== undefined) data.status = input.status;
    if (input.agentId !== undefined) data.agent_id = input.agentId;
    if (input.notes !== undefined) data.notes = input.notes;
    if (validatedCustomFields !== undefined) {
      data.custom_fields_json = JSON.stringify(validatedCustomFields);
    }

    const updated = await tx.policies.update({
      where: { id: input.policyId },
      data,
    });

    // Guardar versión con snapshot del estado anterior
    await tx.policy_versions.create({
      data: {
        id: `pver-${Date.now()}-v${nextVersion}`,
        policy_id: input.policyId,
        version: nextVersion,
        changed_by: input.changedBy,
        change_reason: input.changeReason ?? 'Actualización de póliza',
        snapshot_json: JSON.stringify({
          ...updated,
          members: existing.policy_members.map(formatMember),
        }),
      },
    });

    return updated;
  });

  return formatPolicy(result, true);
}

// ─── Delete (soft) ───

export async function deletePolicy(
  tenantId: string,
  policyId: string
): Promise<boolean> {
  const existing = await prisma.policies.findFirst({
    where: {
      id: policyId,
      tenant_id: tenantId,
    },
  });

  if (!existing) return false;

  await prisma.policies.update({
    where: { id: policyId },
    data: { status: 'Cancelada' },
  });

  return true;
}

// ─── Members (add, update, delete) ───

export async function addPolicyMember(
  tenantId: string,
  policyId: string,
  member: PolicyMemberInput
) {
  // Verificar que la póliza existe y pertenece al tenant
  const policy = await prisma.policies.findFirst({
    where: { id: policyId, tenant_id: tenantId },
    select: { id: true },
  });

  if (!policy) return null;

  const created = await prisma.policy_members.create({
    data: {
      id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      policy_id: policyId,
      first_name: member.firstName,
      last_name: member.lastName,
      relationship: member.relationship,
      birth_date: member.birthDate ? new Date(member.birthDate) : null,
      gender: member.gender ?? null,
      id_number: member.idNumber ?? null,
      tobacco_user: member.tobaccoUser ?? false,
      status: member.status ?? 'Activo',
    },
  });

  return formatMember(created);
}

export async function updatePolicyMember(
  tenantId: string,
  policyId: string,
  memberId: string,
  updates: Partial<PolicyMemberInput>
) {
  // Verificar aislamiento por tenant
  const policy = await prisma.policies.findFirst({
    where: { id: policyId, tenant_id: tenantId },
    select: { id: true },
  });

  if (!policy) return null;

  const member = await prisma.policy_members.findFirst({
    where: { id: memberId, policy_id: policyId },
  });

  if (!member) return null;

  const data: any = {};
  if (updates.firstName !== undefined) data.first_name = updates.firstName;
  if (updates.lastName !== undefined) data.last_name = updates.lastName;
  if (updates.relationship !== undefined) data.relationship = updates.relationship;
  if (updates.birthDate !== undefined) data.birth_date = updates.birthDate ? new Date(updates.birthDate) : null;
  if (updates.gender !== undefined) data.gender = updates.gender;
  if (updates.idNumber !== undefined) data.id_number = updates.idNumber;
  if (updates.tobaccoUser !== undefined) data.tobacco_user = updates.tobaccoUser;
  if (updates.status !== undefined) data.status = updates.status;

  const updated = await prisma.policy_members.update({
    where: { id: memberId },
    data,
  });

  return formatMember(updated);
}

export async function deletePolicyMember(
  tenantId: string,
  policyId: string,
  memberId: string
): Promise<boolean> {
  const policy = await prisma.policies.findFirst({
    where: { id: policyId, tenant_id: tenantId },
    select: { id: true },
  });

  if (!policy) return false;

  const member = await prisma.policy_members.findFirst({
    where: { id: memberId, policy_id: policyId },
  });

  if (!member) return false;

  await prisma.policy_members.delete({
    where: { id: memberId },
  });

  return true;
}

// ─── Version history ───

export async function getPolicyVersions(
  tenantId: string,
  policyId: string
) {
  // Verificar aislamiento
  const policy = await prisma.policies.findFirst({
    where: { id: policyId, tenant_id: tenantId },
    select: { id: true },
  });

  if (!policy) return null;

  const versions = await prisma.policy_versions.findMany({
    where: { policy_id: policyId },
    orderBy: { version: 'desc' },
  });

  return versions.map((v) => ({
    id: v.id,
    version: v.version,
    changedBy: v.changed_by,
    changeReason: v.change_reason,
    snapshot: parseJsonField<Record<string, any>>(v.snapshot_json),
    createdAt: v.created_at,
  }));
}