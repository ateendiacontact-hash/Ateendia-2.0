import {
  Client,
  Policy,
  ClientDocument,
  SystemAlert,
  User,
  MessageTemplate,
  TenantBranding
} from '../types';

export class DomainService {
  /**
   * Evaluates all automatic alerts for the current tenant:
   * 1. Today's birthdays (clients & policy members)
   * 2. This week's birthdays
   * 3. Expiring documents (<= 30 days) or expired documents
   * 4. Upcoming payment due dates for active policies (due in <= 7 days)
   */
  static calculateAlerts(
    clients: Client[],
    policies: Policy[],
    documents: ClientDocument[],
    currentDate: Date = new Date()
  ): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentDay = currentDate.getDate(); // 1-31

    // 1 & 2. Birthdays
    clients.forEach((client) => {
      if (!client.birthDate) return;
      const [year, monthStr, dayStr] = client.birthDate.split('-').map(Number);
      if (!monthStr || !dayStr) return;

      const isToday = monthStr === currentMonth && dayStr === currentDay;

      // Check if birthday falls within next 7 days
      const bdayThisYear = new Date(currentDate.getFullYear(), monthStr - 1, dayStr);
      const diffTime = bdayThisYear.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isThisWeek = diffDays >= 0 && diffDays <= 7;

      if (isToday) {
        alerts.push({
          id: `alert-bday-today-${client.id}`,
          type: 'birthday_today',
          title: `¡Cumpleaños hoy! 🎂 ${client.firstName} ${client.lastName}`,
          description: `El cliente ${client.firstName} ${client.lastName} cumple años hoy (${client.birthDate}). ¡Envíale una felicitación personalizada!`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          clientEmail: client.email,
          dueDate: client.birthDate,
          priority: 'high',
          read: false
        });
      } else if (isThisWeek) {
        alerts.push({
          id: `alert-bday-week-${client.id}`,
          type: 'birthday_week',
          title: `Cumpleaños próximo: ${client.firstName} ${client.lastName}`,
          description: `Cumpleaños en ${diffDays} día(s) (${dayStr}/${monthStr}).`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          clientEmail: client.email,
          dueDate: client.birthDate,
          priority: 'medium',
          read: false
        });
      }
    });

    // Check policy members birthdays too
    policies.forEach((policy) => {
      const client = clients.find((c) => c.id === policy.clientId);
      if (!client) return;

      policy.members.forEach((member) => {
        if (member.relationship === 'Titular' || !member.birthDate) return; // titular handled above
        const [year, monthStr, dayStr] = member.birthDate.split('-').map(Number);
        if (monthStr === currentMonth && dayStr === currentDay) {
          alerts.push({
            id: `alert-bday-mem-${member.id}`,
            type: 'birthday_today',
            title: `Cumpleaños de Miembro: ${member.firstName} ${member.lastName} (${member.relationship})`,
            description: `Dependiente de ${client.firstName} ${client.lastName} en póliza ${policy.carrier}.`,
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName}`,
            clientPhone: client.phone,
            clientEmail: client.email,
            policyId: policy.id,
            dueDate: member.birthDate,
            priority: 'medium',
            read: false
          });
        }
      });
    });

    // 3. Expiring or expired documents
    documents.forEach((doc) => {
      if (!doc.expirationDate) return;
      const client = clients.find((c) => c.id === doc.clientId);
      if (!client) return;

      const expDate = new Date(doc.expirationDate);
      const diffTime = expDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        alerts.push({
          id: `alert-doc-exp-${doc.id}`,
          type: 'expiring_document',
          title: `Documento Vencido: ${doc.name}`,
          description: `El documento "${doc.type}" de ${client.firstName} ${client.lastName} venció el ${doc.expirationDate}.`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          clientEmail: client.email,
          dueDate: doc.expirationDate,
          priority: 'high',
          read: false
        });
      } else if (diffDays <= 30) {
        alerts.push({
          id: `alert-doc-exp-${doc.id}`,
          type: 'expiring_document',
          title: `Documento por Vencer (${diffDays}d): ${doc.type}`,
          description: `El documento "${doc.name}" de ${client.firstName} vence el ${doc.expirationDate}.`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          clientEmail: client.email,
          dueDate: doc.expirationDate,
          priority: 'medium',
          read: false
        });
      }
    });

    // 4. Upcoming payment dates for policies
    policies.forEach((policy) => {
      if (policy.status === 'Cancelada' || policy.status === 'Vencida') return;
      const client = clients.find((c) => c.id === policy.clientId);
      if (!client) return;

      const dueDay = policy.paymentDueDay || 1;
      let daysUntilDue = dueDay - currentDay;

      // If currentDay has passed this month's due day and payment is pending
      if (policy.status === 'Pendiente de Pago' || (daysUntilDue >= 0 && daysUntilDue <= 5)) {
        alerts.push({
          id: `alert-pay-${policy.id}`,
          type: 'upcoming_payment',
          title: `Pago Próximo/Pendiente: Póliza ${policy.carrier} (${policy.policyNumber})`,
          description: `Cuota de $${policy.clientPortion} de ${client.firstName} ${client.lastName} (Día de cobro: ${dueDay} de cada mes).`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          clientPhone: client.phone,
          clientEmail: client.email,
          policyId: policy.id,
          dueDate: `Día ${dueDay}`,
          priority: policy.status === 'Pendiente de Pago' ? 'high' : 'medium',
          read: false
        });
      }
    });

    return alerts;
  }

  /**
   * Dynamic template variable replacement:
   * {{nombre}}, {{apellido}}, {{poliza}}, {{compania}}, {{fecha_pago}}, {{prima}}, {{agente}}, {{empresa}}, {{telefono}}
   */
  static interpolateTemplate(
    templateText: string,
    context: {
      client?: Partial<Client>;
      policy?: Partial<Policy>;
      agent?: Partial<User>;
      tenant?: Partial<TenantBranding>;
    }
  ): string {
    let result = templateText;
    const { client, policy, agent, tenant } = context;

    const replacements: Record<string, string> = {
      '{{nombre}}': client?.firstName || 'Cliente',
      '{{apellido}}': client?.lastName || '',
      '{{nombre_completo}}': `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Estimado Cliente',
      '{{telefono}}': client?.phone || '',
      '{{email}}': client?.email || '',
      '{{poliza}}': policy?.policyNumber || 'N/A',
      '{{compania}}': policy?.carrier || 'su aseguradora',
      '{{plan}}': policy?.planName || '',
      '{{prima}}': policy?.clientPortion !== undefined ? String(policy.clientPortion) : (policy?.monthlyPremium ? String(policy.monthlyPremium) : '0'),
      '{{fecha_pago}}': policy?.paymentDueDay ? `día ${policy.paymentDueDay} del mes` : 'próximamente',
      '{{fecha_efectiva}}': policy?.effectiveDate || '',
      '{{agente}}': agent?.name || 'su agente asesor',
      '{{agente_telefono}}': agent?.phone || '',
      '{{empresa}}': tenant?.name || 'Atoms Cloud CRM'
    };

    for (const [key, val] of Object.entries(replacements)) {
      result = result.split(key).join(val);
    }

    return result;
  }

  /**
   * Round-Robin lead distributor
   */
  static distributeLeadsRoundRobin<T extends Record<string, any>>(
    leads: T[],
    agentIds: string[]
  ): (T & { assignedAgentId: string })[] {
    if (!agentIds || agentIds.length === 0) return leads.map(l => ({ ...l, assignedAgentId: '' }));

    return leads.map((lead, index) => {
      const assignedAgentId = agentIds[index % agentIds.length];
      return {
        ...lead,
        assignedAgentId
      };
    });
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number = 0, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format phone for wa.me / WhatsApp link
   */
  static cleanPhoneForWhatsApp(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }
}
