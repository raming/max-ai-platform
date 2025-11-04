import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import type { IResourceProvider as _IResourceProvider, ITokenStore as _ITokenStore } from 'token-proxy-core';
import { MemoryTokenStore } from '../adapters/token-store.memory';
import { SupabaseProvider } from '../providers/supabase.provider';
import { AuditInterceptor } from '../interceptors/audit.interceptor';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { HealthController } from './health.controller';


@Module({
  imports: [],
  controllers: [AppController, ResourceController, MetricsController, HealthController],
  providers: [
    AppService,
    ResourceService,
    { provide: 'IResourceProvider', useClass: SupabaseProvider },
    { provide: 'ITokenStore', useClass: MemoryTokenStore },
    MetricsService,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
