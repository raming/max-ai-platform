import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { IResourceProvider, ITokenStore } from 'token-proxy-core';
import { MemoryTokenStore } from '../adapters/token-store.memory';
import { SupabaseProvider } from '../providers/supabase.provider';


@Module({
  imports: [],
  controllers: [AppController, ResourceController],
  providers: [
    AppService,
    ResourceService,
    { provide: 'IResourceProvider', useClass: SupabaseProvider },
    { provide: 'ITokenStore', useClass: MemoryTokenStore },
  ],
})
export class AppModule {}
