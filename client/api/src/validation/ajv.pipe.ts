import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';

@Injectable()
export class AjvValidationPipe implements PipeTransform {
  private ajv = new Ajv({ allErrors: true, coerceTypes: true, useDefaults: true, removeAdditional: 'failing' });
  private validator: ValidateFunction;

  constructor(schema: Record<string, unknown>) {
    this.validator = this.ajv.compile(schema);
  }

  transform(value: unknown): unknown {
    const ok = this.validator(value);
    if (!ok) {
      const msg = this.validator.errors?.map(e => `${e.instancePath || 'body'} ${e.message}`).join('; ');
      throw new BadRequestException(`Invalid payload: ${msg}`);
    }
    return value;
  }
}