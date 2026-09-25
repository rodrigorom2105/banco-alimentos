import { supabase } from '@/shared/lib/supabase';

import type { LoginCredentials, RegisterData } from '../types';

// Cada función lanza el AuthError de Supabase si falla; los hooks lo traducen con authErrorMessage.
export const authApi = {
  async login({ email, password }: LoginCredentials) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  },

  // El trigger de la base crea la fila de public.users a partir de estos metadatos.
  // Devuelve true si hay que confirmar el correo antes de iniciar sesión.
  async register({ firstName, lastName, email, phone, password }: RegisterData): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
        },
      },
    });
    if (error) throw error;
    return !data.session;
  },

  // Recuperación de contraseña con código: la plantilla "Reset Password" de Supabase
  // debe incluir {{ .Token }} para que el correo traiga el código.
  async sendResetCode(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  },

  // Si el código es válido, Supabase inicia sesión con una sesión de recuperación.
  async verifyResetCode(email: string, code: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'recovery',
    });
    if (error) throw error;
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },
};
