import express, { Request, Response, NextFunction } from 'express';
import Ajv from 'ajv';
import createTableSchema from '../../schemas/create-table.request.schema.json' assert { type: 'json' };
import { TokenProxyService } from '../../services/token-proxy.service.js';
import { SupabaseOperation } from '../../types/providers.js';

export type AuthenticatedRequest = Request & {
  user?: { id: string; tenantId: string };
};

function requireAuthHeaders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tenantId = req.header('x-tenant-id') || '';
  const userId = req.header('x-user-id') || '';
  if (!tenantId || !userId) {
    return res.status(401).json({ error: 'missing auth context' });
  }
  req.user = { id: userId, tenantId };
  next();
}

export function buildProvidersRouter(tokenProxy: TokenProxyService) {
  const router = express.Router();
  const ajv = new Ajv({ allErrors: true, removeAdditional: true, useDefaults: true });
  const validateCreateTable = ajv.compile(createTableSchema as any);

  // POST /api/providers/supabase/tables
  router.post('/providers/supabase/tables', requireAuthHeaders, async (req: AuthenticatedRequest, res: Response) => {
    const correlationId = req.header('x-correlation-id') || 'corr-' + Date.now();
    const body = req.body;
    const valid = validateCreateTable(body);
    if (!valid) {
      return res.status(400).json({ error: 'invalid_request', details: validateCreateTable.errors });
    }

    try {
      const operation: SupabaseOperation = { type: 'create_table', payload: body };
      const result = await tokenProxy.executeSupabaseOperation(
        operation,
        req.user!.tenantId,
        req.user!.id,
        correlationId
      );
      return res.status(201).json({ ok: true, result });
    } catch (err: any) {
      // Secure error handling: do not leak secrets
      return res.status(500).json({ error: 'provider_error', message: err?.message || 'unknown error' });
    }
  });

  return router;
}
