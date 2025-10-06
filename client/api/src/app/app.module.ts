import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResourceController } from './resource.controller';
import { ResourceService } from './resource.service';
import { IResourceProvider } from 'token-proxy-core';

class NoopProvider implements IResourceProvider {
  async init(): Promise<{ ok: boolean; status: number; error?: string; data?: unknown }> {
    return { ok: true, status: 202 };
  }
}

@Module({
  imports: [],
  controllers: [AppController, ResourceController],
  providers: [AppService, ResourceService, { provide: 'IResourceProvider', useClass: NoopProvider }],
})
export class AppModule {}
