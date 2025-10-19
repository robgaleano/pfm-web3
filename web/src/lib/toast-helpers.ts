/**
 * Helpers para toasts persistentes durante navegación
 */

import { toast } from 'sonner';

/**
 * Toast que persiste durante navegación
 * Útil cuando vas a cambiar de página pero quieres que el usuario vea el mensaje
 */
export const toastPersistent = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: 8000, // 8 segundos
      closeButton: true
    });
  },

  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: 10000, // 10 segundos para errores
      closeButton: true
    });
  },

  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: 8000,
      closeButton: true
    });
  },

  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      description,
      duration: 8000,
      closeButton: true
    });
  }
};

/**
 * Toast que NO se cierra automáticamente
 * El usuario debe cerrarlo manualmente
 */
export const toastInfinite = {
  success: (message: string, description?: string) => {
    return toast.success(message, {
      description,
      duration: Infinity,
      closeButton: true
    });
  },

  error: (message: string, description?: string) => {
    return toast.error(message, {
      description,
      duration: Infinity,
      closeButton: true
    });
  },

  info: (message: string, description?: string) => {
    return toast.info(message, {
      description,
      duration: Infinity,
      closeButton: true
    });
  },

  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      description,
      duration: Infinity,
      closeButton: true
    });
  }
};

/**
 * Toast con acción para navegar
 * Útil cuando completas una acción y quieres dar opción de ir a otra página
 */
export const toastWithAction = (
  type: 'success' | 'error' | 'info' | 'warning',
  message: string,
  actionLabel: string,
  actionCallback: () => void,
  description?: string
) => {
  return toast[type](message, {
    description,
    duration: 10000, // 10 segundos
    closeButton: true,
    action: {
      label: actionLabel,
      onClick: actionCallback
    }
  });
};

/**
 * Ejemplo de uso:
 * 
 * // Toast normal (se cierra en 5 segundos por defecto)
 * toast.success('Token creado');
 * 
 * // Toast persistente (se cierra en 8 segundos)
 * toastPersistent.success('Token creado', 'ID: 123');
 * 
 * // Toast infinito (requiere cerrar manualmente)
 * toastInfinite.error('Error crítico', 'Contacta al administrador');
 * 
 * // Toast con acción
 * toastWithAction(
 *   'success',
 *   'Token creado',
 *   'Ver token',
 *   () => router.push('/tokens/123'),
 *   'ID: 123'
 * );
 */
