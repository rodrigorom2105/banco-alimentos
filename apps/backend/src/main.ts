import { networkInterfaces } from 'node:os';

import { buildContainer } from './container';
import { loadEnv } from './infrastructure/config/env';
import { createApp } from './interfaces/http/app';

const env = loadEnv();
const app = createApp(buildContainer(env));

// Direcciones de red de esta máquina. Se imprimen porque `localhost` solo sirve desde la PC: un
// celular necesita la IP de la Wi-Fi, y buscarla con `ipconfig` cada vez que cambia de red es la
// causa más común de "no se pudo conectar con el servidor de BAMX".
const lanAddresses = () =>
  Object.values(networkInterfaces())
    .flat()
    .filter((nic) => nic && nic.family === 'IPv4' && !nic.internal)
    .map((nic) => nic!.address)
    // Las 169.254.x.x son de enlace local (interfaces sin red de verdad); no sirven para probar.
    .filter((address) => !address.startsWith('169.254.'));

app.listen(env.PORT, () => {
  console.log(
    `Servidor corriendo en el puerto ${env.PORT}. Pon una de estas en EXPO_PUBLIC_API_URL:`,
  );
  console.log(`  PC (Expo web)      http://localhost:${env.PORT}`);
  console.log(`  emulador Android   http://10.0.2.2:${env.PORT}`);
  for (const address of lanAddresses()) {
    console.log(`  celular (Wi-Fi)    http://${address}:${env.PORT}`);
  }
});
