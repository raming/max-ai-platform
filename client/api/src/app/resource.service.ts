import { Inject, Injectable, Logger } from '@nestjs/common';
import { IResourceProvider, ProviderResult, ResourceInitializationPlan, FLAGS, isEnabled, redactSecret } from 'token-proxy-core';

@Injectable()
export class ResourceService {
  private readonly logger = new Logger(ResourceService.name);
  constructor(@Inject('IResourceProvider') private readonly provider: IResourceProvider) {}

  async init(plan: ResourceInitializationPlan, opts: { correlationId: string }): Promise<ProviderResult> {
    if (!isEnabled(FLAGS.RESOURCE_INIT_TOKEN_PROXY)) {
      return { ok: false, status: 503, error: 'resource-init-token-proxy disabled' };
    }
    this.logger.log(JSON.stringify({ msg: 'init.start', correlationId: opts.correlationId, tenantId: plan.tenantId, provider: plan.provider }));
    const result = await this.provider.init(plan, opts);
    if (!result.ok) {
      this.logger.warn(JSON.stringify({ msg: 'init.failed', correlationId: opts.correlationId, status: result.status, error: result.error }));
    } else {
      this.logger.log(JSON.stringify({ msg: 'init.ok', correlationId: opts.correlationId }));
    }
    return result;
  }
}