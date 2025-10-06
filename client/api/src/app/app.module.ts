import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { IResourceProvider, ITokenStore } from 'token-proxy-core';
import { MemoryTokenStore } from '../adapters/token-store.memory';
import { SupabaseProvider } from '../providers/supabase.provider';
import { AuditInterceptor } from '../interceptors/audit.interceptor';


@Module({
  imports: [],
  controllers: [AppController, ResourceController],
  providers: [
    AppService,
    ResourceService,
    { provide: 'IResourceProvider', useClass: SupabaseProvider },
    { provide: 'ITokenStore', useClass: MemoryTokenStore },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
