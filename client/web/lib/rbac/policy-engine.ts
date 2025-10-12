// RBAC policy engine using Casbin

import { newEnforcer, Enforcer } from 'casbin';
import * as path from 'path';

export interface PolicyCheckRequest {
  subject: {
    id: string;
    tenant: string;
    roles?: string[];
    groups?: string[];
    scopes?: string[];
  };
  resource: {
    type: string;
    id: string;
    ownerTenant?: string;
  };
  action: string;
  context?: Record<string, any>;
}

export interface PolicyCheckResponse {
  decision: 'allow' | 'deny';
  reason?: string;
  policyRef?: string;
}

export class RBACPolicyEngine {
  private enforcer: Enforcer | null = null;

  async initialize(): Promise<void> {
    const modelPath = path.join(__dirname, 'model.conf');
    const policyPath = path.join(__dirname, 'policy.csv');

    this.enforcer = await newEnforcer(modelPath, policyPath);
  }

  async check(request: PolicyCheckRequest, correlationId: string): Promise<PolicyCheckResponse> {
    if (!this.enforcer) {
      throw new Error('RBAC enforcer not initialized');
    }

    const { subject, resource, action } = request;

    // Deny by default
    let decision: 'allow' | 'deny' = 'deny';
    let reason = 'No matching policy';

    try {
      // Check if subject has permission for resource and action
      // Use subject.id (email) as the subject identifier
      const allowed = await this.enforcer.enforce(subject.id, resource.type, action);

      if (allowed) {
        decision = 'allow';
        reason = 'Policy matched';
      } else {
        reason = 'Policy denied';
      }

      // Audit log
      const auditEntry = {
        level: decision === 'allow' ? 'info' : 'warn',
        component: 'rbac-policy',
        event: decision === 'allow' ? 'rbac.policy_allow' : 'rbac.policy_deny',
        correlationId,
        tenantId: subject.tenant,
        userId: subject.id,
        resource: resource.type,
        resourceId: resource.id,
        action,
        decision,
        reason,
        policyRef: `${resource.type}:${action}`,
        timestamp: new Date().toISOString()
      };

      console.log('[RBAC-POLICY]', JSON.stringify(auditEntry));

      return {
        decision,
        reason,
        policyRef: `${resource.type}:${action}`
      };
    } catch (error) {
      console.error('Policy check error', { error, correlationId });
      return {
        decision: 'deny',
        reason: 'Policy check failed'
      };
    }
  }

  async addPolicy(role: string, resource: string, action: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error('RBAC enforcer not initialized');
    }

    return await this.enforcer.addPolicy(role, resource, action);
  }

  async addRoleForUser(user: string, role: string): Promise<boolean> {
    if (!this.enforcer) {
      throw new Error('RBAC enforcer not initialized');
    }

    return await this.enforcer.addRoleForUser(user, role);
  }

  async getRolesForUser(user: string): Promise<string[]> {
    if (!this.enforcer) {
      throw new Error('RBAC enforcer not initialized');
    }

    return await this.enforcer.getRolesForUser(user);
  }
}