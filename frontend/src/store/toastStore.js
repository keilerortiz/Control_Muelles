import { create } from "zustand";

// Mapa para guardar los timeouts activos por cada toast
const timeouts = new Map();

export const useToastStore = create((set, get) => ({
  toasts: [],
  
  pushToast: (toast, duration = 3000) => {
    // 1. Crear ID único y el toast completo
    const id = crypto.randomUUID();
    const newToast = { id, ...toast };
    
    // 2. Agregar al estado
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // 3. Programar su eliminación automática
    const timeoutId = setTimeout(() => {
      get().removeToast(id); // usa get() para acceder a removeToast
    }, duration);
    
    // 4. Guardar referencia del timeout para poder cancelarlo si se elimina manualmente antes
    timeouts.set(id, timeoutId);
  },
  
  removeToast: (id) => {
    // 1. Cancelar el timeout pendiente (si existe)
    const timeoutId = timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.delete(id);
    }
    
    // 2. Eliminar del estado
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
}));