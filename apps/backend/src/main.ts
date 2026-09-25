import { buildContainer } from './container';
import { loadEnv } from './infrastructure/config/env';
import { createApp } from './interfaces/http/app';

const env = loadEnv();
const app = createApp(buildContainer(env));

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
});
