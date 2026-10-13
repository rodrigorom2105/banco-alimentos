import type { NewNotification } from './Notification';

/**
 * Puerto para avisar a la gente. El dominio decide QUÉ se dice; quien implemente este puerto
 * decide CÓMO se entrega (hoy, una fila en `notifications`; mañana podría ser push o correo).
 */
export interface Notifier {
  notify(userId: string, notification: NewNotification): Promise<void>;

  // Avisa a todos los admins. `except` evita que alguien se notifique a sí mismo (p. ej. un
  // admin que registra su propia campaña).
  notifyAdmins(notification: NewNotification, except?: string | null): Promise<void>;
}
