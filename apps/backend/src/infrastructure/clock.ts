import type { Clock } from '../application/ports';

// El esquema define las fechas en hora de Guadalajara, no en UTC. 'en-CA' da 'YYYY-MM-DD'.
const guadalajaraDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const systemClock: Clock = {
  today: () => guadalajaraDate.format(new Date()),
};
