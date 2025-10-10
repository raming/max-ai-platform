import { Body, Controller, Headers, HttpCode, HttpException, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ResourceInitializationPlan } from 'token-proxy-core';
import { AjvValidationPipe } from '../validation/ajv.pipe';
import schema from '../schemas/resource-initialization-plan.schema.json';

@Controller('resource')
export class ResourceController {
  constructor(private readonly svc: ResourceService) {}

  @Post('init')
  @HttpCode(202)
  @UsePipes(new AjvValidationPipe(schema as any))
  async init(
    @Body() plan: ResourceInitializationPlan,
    @Headers('x-correlation-id') correlationId?: string
  ) {
    const cid = correlationId ?? `cid-${Date.now()}`;
    const res = await this.svc.init(plan, { correlationId: cid });
    if (!res.ok) throw new HttpException(res.error ?? 'Upstream error', res.status ?? HttpStatus.BAD_GATEWAY);
    return { ok: true };
  }
}