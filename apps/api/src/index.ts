import 'dotenv/config';
import { env } from './config/env';
import { createApp } from './server';

const app = createApp();

app.listen(env.API_PORT, () => {
  console.log(`Edwix API running on port ${env.API_PORT}`);
  console.log(`Swagger docs: http://localhost:${env.API_PORT}/api/docs`);
});
