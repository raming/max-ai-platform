import { createApp } from './api/server.js';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`api-gateway listening on :${port}`);
  });
}

export { createApp };
