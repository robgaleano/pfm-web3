# 🔔 Guía de Uso de Sonner - Toasts Persistentes

## ✅ Configuración Actual

- ✅ Toaster configurado en `layout.tsx`
- ✅ Duración por defecto: **5 segundos**
- ✅ Botón de cerrar: **Habilitado**
- ✅ Tema: **Light mode**

## 🔄 Persistencia durante Navegación

### El Problema
Cuando navegas entre páginas usando `window.location.href` o `router.push()`, los toasts pueden desaparecer antes de que el usuario los vea.

### ✨ Soluciones Implementadas

#### 1. **Helpers de Persistencia** (Recomendado)

```tsx
import { toastPersistent, toastInfinite, toastWithAction } from '@/lib/toast-helpers';

// Toast de 8 segundos - persiste durante navegación
toastPersistent.success('Token creado', 'ID: 123');
toastPersistent.error('Error', 'No se pudo procesar');
toastPersistent.info('Cuenta cambiada', 'Verificando...');
toastPersistent.warning('Balance bajo', 'Recarga tu cuenta');

// Toast infinito - el usuario debe cerrarlo manualmente
toastInfinite.error('Error crítico', 'Contacta al administrador');

// Toast con acción de navegación
toastWithAction(
  'success',
  'Usuario aprobado',
  'Ver usuarios',
  () => router.push('/admin/users'),
  'Usuario: 0xABC...'
);
```

#### 2. **Duración Personalizada**

```tsx
import { toast } from 'sonner';

// Navegación rápida (8 segundos)
toast.info('Redirigiendo...', {
  duration: 8000
});

// Toast infinito inline
toast.error('Error crítico', {
  duration: Infinity,
  closeButton: true
});
```

## 🎨 Tipos de Toasts

### Básicos
```tsx
import { toast } from 'sonner';

toast.success('Éxito');
toast.error('Error');
toast.info('Info');
toast.warning('Advertencia');
toast.loading('Cargando...');
```

### Con Descripción
```tsx
toast.success('Token creado', {
  description: 'El token se ha creado correctamente'
});
```

### Con Acción
```tsx
toast.success('Token creado', {
  description: 'ID: 123',
  action: {
    label: 'Ver',
    onClick: () => router.push('/tokens/123')
  }
});
```

### Para Operaciones Asíncronas (Blockchain)
```tsx
toast.promise(
  createToken(name, supply, features, parentId),
  {
    loading: 'Creando token...',
    success: 'Token creado exitosamente',
    error: 'Error al crear token'
  }
);
```

## 📝 Ejemplos por Caso de Uso

### 1. Cambio de Cuenta (ya implementado)
```tsx
// En Web3Context.tsx
toast.info('Cuenta cambiada', {
  description: 'Verificando estado del usuario...',
  duration: 8000 // Persiste durante la redirección
});
```

### 2. Crear Token con Navegación
```tsx
const handleCreateToken = async () => {
  try {
    await toast.promise(
      createToken(name, totalSupply, features, parentId),
      {
        loading: 'Creando token...',
        success: 'Token creado exitosamente',
        error: 'Error al crear token'
      }
    );
    
    // Usar helper persistente antes de navegar
    toastPersistent.success('Token creado', 'Redirigiendo al dashboard...');
    
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  } catch (error) {
    // El error ya se mostró en el promise
  }
};
```

### 3. Aprobar Usuario (Admin)
```tsx
const handleApprove = async (userAddress: string) => {
  try {
    await changeUserStatus(userAddress, 1);
    
    toastPersistent.success('Usuario aprobado', {
      description: `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
    });
    
    await refreshData();
  } catch (error) {
    toastInfinite.error('Error al aprobar', 'Intenta nuevamente');
  }
};
```

### 4. Transferencia con Confirmación
```tsx
const handleTransfer = async () => {
  if (!to || !amount) {
    toast.warning('Campos incompletos', {
      description: 'Completa todos los campos'
    });
    return;
  }

  try {
    await toast.promise(
      transferToken(to, tokenId, amount),
      {
        loading: 'Procesando transferencia...',
        success: 'Transferencia solicitada',
        error: 'Error al transferir'
      }
    );

    toastWithAction(
      'success',
      'Transferencia enviada',
      'Ver transferencias',
      () => router.push('/transfers'),
      'Espera la aceptación del destinatario'
    );
  } catch (error) {
    // Manejado por promise
  }
};
```

## ⏱️ Recomendaciones de Duración

| Caso de Uso | Duración | Helper |
|-------------|----------|--------|
| Info general | 5000ms (default) | `toast.info()` |
| Success con navegación | 8000ms | `toastPersistent.success()` |
| Error con navegación | 10000ms | `toastPersistent.error()` |
| Error crítico | Infinity | `toastInfinite.error()` |
| Advertencia importante | 8000ms | `toastPersistent.warning()` |
| Loading (promise) | Auto | `toast.promise()` |

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)
- Usa `toastPersistent` cuando navegues después del toast
- Usa `toast.promise` para operaciones blockchain
- Agrega descripciones claras
- Usa `closeButton: true` para mensajes importantes
- Usa `toastInfinite` solo para errores críticos

### ❌ DON'T (No hacer)
- No uses `duration: Infinity` para todo (molesto para el usuario)
- No muestres múltiples toasts similares simultáneamente
- No uses toasts para información que debe estar en la UI permanente
- No uses duraciones muy cortas (< 3000ms) para mensajes importantes

## 🔧 Configuración del Toaster

En `layout.tsx`:
```tsx
<Toaster 
  richColors           // Colores más vivos
  position="top-left"  // Posición
  duration={5000}      // Duración por defecto
  closeButton          // Botón de cerrar
/>
```

Posiciones disponibles:
- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

## 📚 Recursos

- [Sonner Docs](https://sonner.emilkowal.ski/)
- [shadcn/ui Sonner](https://ui.shadcn.com/docs/components/sonner)
- Helpers personalizados: `/src/lib/toast-helpers.ts`
