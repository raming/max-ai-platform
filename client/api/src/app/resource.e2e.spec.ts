import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { MemoryTokenStore } from '../adapters/token-store.memory';

describe('POST /resource/init (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env['resource-init-token-proxy'] = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    delete process.env['resource-init-token-proxy'];
    await app.close();
  });

  it('returns 400 for invalid payload (missing required fields)', async () => {
    const res = await request(app.getHttpServer())
      .post('/resource/init')
      .send({})
      .expect(400);
    expect(res.body.message).toContain('Invalid payload');
    expect(res.headers['x-correlation-id']).toBeTruthy();
  });

  it('returns 401 for missing tokenId', async () => {
    const payload = { tenantId: 't1', provider: 'supabase', operations: [] };
    const res = await request(app.getHttpServer())
      .post('/resource/init')
      .send(payload)
      .expect(401);
    expect(res.headers['x-correlation-id']).toBeTruthy();
  });

  it('returns 202 with valid token and correlation id', async () => {
    // get the DI-provided memory store and create a token
    const store = app.get('ITokenStore') as MemoryTokenStore;
    const token = await store.put({ provider: 'supabase', tenantId: 't1', secret: 'sb-secret' });

    const payload = {
      tenantId: 't1',
      provider: 'supabase',
      operations: [{ op: 'ping', params: {} }],
      tokenId: token.id,
    };

    const res = await request(app.getHttpServer())
      .post('/resource/init')
      .set('x-correlation-id', 'test-cid-123')
      .send(payload)
      .expect(202);

    expect(res.headers['x-correlation-id']).toBe('test-cid-123');
    expect(res.body).toEqual({ ok: true });
  });
});