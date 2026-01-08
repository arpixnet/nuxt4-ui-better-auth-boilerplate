# Sistema de Configuración de Autenticación

Documentación completa para personalizar las páginas de login y registro del proyecto.

---

## 📋 Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Archivos Involucrados](#archivos-involucrados)
- [Configuración del Logo](#configuración-del-logo)
- [Configuración del Panel Decorativo](#configuración-del-panel-decorativo)
- [Configuración de Subtítulos del Formulario](#configuración-de-subtítulos-del-formulario)
- [Gradientes y Colores](#gradientes-y-colores)
- [Imágenes de Fondo](#imágenes-de-fondo)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Flujo de Datos Interno](#flujo-de-datos-interno)

---

## 🏗️ Arquitectura del Sistema

El sistema de configuración permite personalizar completamente las páginas de autenticación sin tocar el código de los componentes. Todo está centralizado en una configuración tipo de fácil mantenimiento.

```
app/config/auth.config.ts    ← Configuración principal
           ↓
app/composables/useAuthConfig.ts  ← Composable de acceso
           ↓
app/pages/auth/login.vue     ← Componentes que usan la config
app/pages/auth/register.vue
```

### Principios de Diseño

- **Centralización:** Toda la configuración en un solo archivo
- **Type-Safe:** TypeScript con interfaces y autocompletado
- **Separación:** Configuración independiente para login y register
- **Modos:** Soporte para tema claro y oscuro
- **Extensibilidad:** Fácil de agregar nuevas opciones

---

## 📁 Archivos Involucrados

### 1. Configuración Principal
**Ruta:** `app/config/auth.config.ts`

Este archivo contiene TODA la configuración personalizable. Define:
- Logo (texto o imagen)
- Panel decorativo (títulos, subtítulos, gradientes, imágenes)
- Subtítulos del formulario (mensajes de bienvenida)
- Configuración separada por página y modo

### 2. Composable de Acceso
**Ruta:** `app/composables/useAuthConfig.ts`

Expone la configuración a los componentes:
- `config`: Objeto completo de configuración
- `getLogo()`: Configuración del logo
- `getDecorativePanel(page)`: Configuración del panel de una página
- `getGradientClasses(page, mode)`: Clases CSS para gradientes

### 3. Componentes de UI
**Rutas:** `app/pages/auth/login.vue` y `app/pages/auth/register.vue`

Importan y usan el composable:
```vue
const { config: authPageConfig, getDecorativePanel } = useAuthConfig()
const panelConfig = getDecorativePanel('login')
```

---

## 🎨 Configuración del Logo

### Estructura

```typescript
logo: {
  text: string,              // Texto del logo
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl',  // Tamaño
  imageUrl?: string,         // Ruta de imagen (opcional)
  imageAlt?: string,        // Alt text para imagen (opcional)
}
```

### Opciones Disponibles

#### 1. **Texto del Logo**
```typescript
logo: {
  text: 'Orineum',  // Cambia esto a tu marca
  size: '2xl',
}
```

#### 2. **Tamaño del Logo**
Usa las clases de tamaño de Tailwind:

| Valor | Equivalente Tailwind | Uso Recomendado |
|-------|---------------------|-------------------|
| `sm` | `text-sm` | Logos muy compactos |
| `md` | `text-md` | Diseños minimalistas |
| `lg` | `text-lg` | Balance estándar |
| `xl` | `text-xl` | Marcas prominentes |
| `2xl` | `text-2xl` | Marcas grandes (por defecto) |

```typescript
logo: {
  text: 'Mi Marca',
  size: 'xl',  // Cambia el tamaño aquí
}
```

#### 3. **Logo como Imagen**
Para usar una imagen en lugar de texto:

```typescript
logo: {
  text: 'Mi Marca',        // Texto fallback
  size: '2xl',
  imageUrl: '/logo.svg',    // Ruta desde public/
  imageAlt: 'Logo de Mi Marca',  // Descripción para accesibilidad
}
```

**Requisitos:**
- La imagen debe estar en `public/`
- Formatos recomendados: SVG, PNG, WebP
- Tamaño recomendado: altura de 40px (2.5rem)

**En los componentes:**
```vue
<!-- Si hay imageUrl, muestra imagen -->
<img
  v-if="authPageConfig.logo.imageUrl"
  :src="authPageConfig.logo.imageUrl"
  :alt="authPageConfig.logo.imageAlt || 'Logo'"
  class="h-10 w-auto"
/>

<!-- Si no hay imageUrl, muestra texto -->
<h2 v-else class="text-2xl font-bold">
  {{ authPageConfig.logo.text }}
</h2>
```

### Ejemplos Completos

#### Logo de Texto Simple
```typescript
logo: {
  text: 'StartupXYZ',
  size: '2xl',
}
```

#### Logo de Imagen
```typescript
logo: {
  text: 'StartupXYZ',
  size: '2xl',
  imageUrl: '/logo.svg',
  imageAlt: 'Logo de StartupXYZ',
}
```

#### Logo Compacto
```typescript
logo: {
  text: 'App',
  size: 'md',
}
```

---

## 🖼️ Configuración del Panel Decorativo

### Estructura

```typescript
decorativePanel: {
  login: {
    title: string,           // Título principal
    subtitle: string,        // Subtítulo/descripción
    gradient: {
      light: {
        from: string,        // Color inicial (modo claro)
        via: string,        // Color intermedio
        to: string,         // Color final
      },
      dark: {
        from: string,        // Color inicial (modo oscuro)
        via: string,        // Color intermedio
        to: string,         // Color final
      },
    },
    backgroundImage?: string, // Imagen de fondo (opcional)
  },
  register: {
    // Misma estructura que login
  },
}
```

### Configuración por Página

Login y register tienen configuraciones independientes. Esto permite:
- Diferentes títulos y mensajes
- Esquemas de color diferentes
- Imágenes de fondo distintas

```typescript
decorativePanel: {
  login: {
    title: 'Welcome to Arpix Solutions',
    subtitle: 'Your trusted partner for innovative solutions',
    gradient: { /* ... */ },
  },
  register: {
    title: 'Join Arpix Solutions Today',
    subtitle: 'Start your journey with us today',
    gradient: { /* ... */ },
  },
}
```

### Títulos y Subtítulos

#### Título (`title`)
- Texto grande y prominente
- Usa `text-4xl font-bold` en el componente
- Máximo 1-2 líneas recomendado

```typescript
login: {
  title: 'Bienvenido de Vuelta',
  // ...
}
```

#### Subtítulo (`subtitle`)
- Texto de apoyo más pequeño
- Usa `text-lg opacity-90` en el componente
- Máximo 2-3 líneas recomendado

```typescript
login: {
  subtitle: 'Continúa tu viaje con nosotros',
  // ...
}
```

---

## 📝 Configuración de Subtítulos del Formulario

### Estructura

```typescript
formSubtitle: {
  login: string,      // Subtítulo de la página de login
  register: string,   // Subtítulo de la página de registro
}
```

### Propósito

Los subtítulos del formulario son los mensajes que aparecen debajo de los títulos principales ("Welcome Back", "Create Account") en el lado izquierdo de la página, donde se encuentra el formulario.

### Ubicación

Estos subtítulos se muestran en el área del formulario, justo debajo del título principal:

```vue
<!-- Login.vue -->
<div class="mb-4">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
    Welcome Back
  </h1>
  <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
    {{ authPageConfig.formSubtitle.login }}
  </p>
  <!-- → "Log in to continue your application journey" -->
</div>

<!-- Register.vue -->
<div class="mb-4">
  <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
    Create Account
  </h1>
  <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
    {{ authPageConfig.formSubtitle.register }}
  </p>
  <!-- → "Join us to get started with your application" -->
</div>
```

### Ejemplos de Subtítulos

#### Subtítulos Genéricos (Boilerplate)
```typescript
formSubtitle: {
  login: 'Log in to continue your application journey',
  register: 'Join us to get started with your application',
}
```

#### Subtítulos para E-commerce
```typescript
formSubtitle: {
  login: 'Access your orders, wishlist, and more',
  register: 'Create an account to start shopping',
}
```

#### Subtítulos para SaaS
```typescript
formSubtitle: {
  login: 'Sign in to access your workspace',
  register: 'Start your free trial today',
}
```

#### Subtítulos para Redes Sociales
```typescript
formSubtitle: {
  login: 'Connect with friends and share your moments',
  register: 'Join our community of millions',
}
```

#### Subtítulos para Dashboard Administrativo
```typescript
formSubtitle: {
  login: 'Access your admin dashboard',
  register: 'Create your admin account',
}
```

#### Subtítulos en Español
```typescript
formSubtitle: {
  login: 'Inicia sesión para continuar',
  register: 'Únete a nosotros para comenzar',
}
```

#### Subtítulos Multilenguaje (con i18n)
```typescript
formSubtitle: {
  login: $t('auth.login.subtitle'),
  register: $t('auth.register.subtitle'),
}
```

### Mejores Prácticas

1. **Sé Conciso:** Mantén los subtítulos cortos (máximo 1-2 líneas)
2. **Contexto Claro:** El usuario debe entender qué hará después de la acción
3. **Tono Apropiado:** Usa un tono que coincida con tu marca
4. **Action-Oriented:** Enfócate en el valor que el usuario obtendrá

### Ejemplos de Malos vs Buenos Subtítulos

❌ **Malos:**
```typescript
formSubtitle: {
  login: 'Please enter your email and password in === fields below to access your account on our website',
  // ← Demasiado largo, demasiado técnico
}
```

✅ **Buenos:**
```typescript
formSubtitle: {
  login: 'Access your account in seconds',
  // ← Corto, claro, orientado al beneficio
}
```

---

## 🎨 Gradientes y Colores

### Estructura del Gradiente

```typescript
gradient: {
  light: {
    from: 'color-nombre-shade',
    via: 'color-nombre-shade',
    to: 'color-nombre-shade',
  },
  dark: {
    from: 'color-nombre-shade',
    via: 'color-nombre-shade',
    to: 'color-nombre-shade',
  },
}
```

### Cómo Funciona

El sistema genera automáticamente las clases de Tailwind:

```vue
<!-- Entrada en config.ts -->
gradient: {
  light: {
    from: 'blue-500',
    via: 'purple-500',
    to: 'pink-500',
  },
}

<!-- Clases generadas -->
bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500
dark:from-blue-900 dark:via-purple-900 dark:to-pink-900
```

### Colores Disponibles

#### Paleta de Colores Tailwind

**Colores Calientes:**
- `red`, `orange`, `amber`, `yellow`, `lime`

**Colores Fríos:**
- `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`

**Colores Neutros/Púrpuras:**
- `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`

**Escala de Saturación/Brightness:**
`50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`

### Recomendaciones de Uso

#### Modo Claro (`light`)
Usa tonos medios para buen contraste con texto blanco:
- **Rango recomendado:** `400-600`
- **Ejemplo:** `from-blue-400 via-blue-500 to-indigo-600`

#### Modo Oscuro (`dark`)
Usa tonos oscuros para mantener consistencia:
- **Rango recomendado:** `800-950`
- **Ejemplo:** `from-blue-800 via-blue-900 to-indigo-950`

### Ejemplos de Gradientes

#### Gradiente Azul (Profesional)
```typescript
gradient: {
  light: {
    from: 'blue-500',
    via: 'indigo-500',
    to: 'violet-500',
  },
  dark: {
    from: 'blue-900',
    via: 'indigo-900',
    to: 'violet-950',
  },
}
```

#### Gradiente Verde (Fresco)
```typescript
gradient: {
  light: {
    from: 'emerald-400',
    via: 'teal-500',
    to: 'cyan-600',
  },
  dark: {
    from: 'emerald-800',
    via: 'teal-900',
    to: 'cyan-950',
  },
}
```

#### Gradiente Cálido (Dinámico)
```typescript
gradient: {
  light: {
    from: 'orange-400',
    via: 'red-500',
    to: 'pink-600',
  },
  dark: {
    from: 'orange-800',
    via: 'red-900',
    to: 'pink-950',
  },
}
```

#### Gradiente Monocromático (Minimalista)
```typescript
gradient: {
  light: {
    from: 'slate-400',
    via: 'slate-500',
    to: 'slate-600',
  },
  dark: {
    from: 'slate-800',
    via: 'slate-900',
    to: 'slate-950',
  },
}
```

#### Gradiente Aurora (Creativo)
```typescript
gradient: {
  light: {
    from: 'violet-500',
    via: 'fuchsia-500',
    to: 'rose-500',
  },
  dark: {
    from: 'violet-900',
    via: 'fuchsia-900',
    to: 'rose-950',
  },
}
```

---

## 🖼️ Imágenes de Fondo

### Configuración

```typescript
backgroundImage: '/images/login-bg.jpg',
```

### Requisitos

1. **Ubicación:** La imagen debe estar en el directorio `public/`
   ```
   public/
   └── images/
       ├── login-bg.jpg
       └── register-bg.jpg
   ```

2. **Formatos recomendados:**
   - **JPG/PNG:** Para fotos realistas
   - **WebP:** Para mejor rendimiento
   - **SVG:** Para patrones o gráficos vectoriales

3. **Dimensiones:**
   - **Desktop:** Mínimo 1920x1080px
   - **Optimización:** Usa herramientas como ImageMagick o Squoosh

### Comportamiento

Cuando se usa una imagen de fondo:
- La imagen cubre todo el panel (`background-size: cover`)
- Se aplica un overlay negro de 40% opacidad
- El gradiente se desactiva
- El texto se mantiene legible

### Ejemplo Completo

```typescript
decorativePanel: {
  login: {
    title: 'Bienvenido',
    subtitle: 'Tu viaje comienza aquí',
    backgroundImage: '/images/welcome-bg.jpg',
  },
}
```

### Alternar entre Gradiente e Imagen

Puedes usar una imagen en una página y gradiente en otra:

```typescript
decorativePanel: {
  login: {
    title: 'Iniciar Sesión',
    subtitle: 'Ya eres parte de nuestra comunidad',
    backgroundImage: '/images/login-bg.jpg',  // Imagen
  },
  register: {
    title: 'Crear Cuenta',
    subtitle: 'Únete hoy mismo',
    gradient: {
      light: { from: 'green-500', via: 'emerald-500', to: 'teal-500' },
      dark: { from: 'green-900', via: 'emerald-900', to: 'teal-900' },
    },
    // Sin backgroundImage → usa gradiente
  },
}
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Cambiar el Nombre de la Marca

**Antes:**
```typescript
logo: {
  text: 'Orineum',
  size: '2xl',
}
```

**Después:**
```typescript
logo: {
  text: 'VisaExpress Pro',
  size: '2xl',
}
```

---

### Ejemplo 2: Cambiar los Colores del Login

**Antes:**
```typescript
decorativePanel: {
  login: {
    title: 'Welcome to Orineum',
    subtitle: 'Your trusted partner for innovative solutions',
    gradient: {
      light: {
        from: 'blue-500',
        via: 'purple-500',
        to: 'pink-500',
      },
      dark: {
        from: 'blue-900',
        via: 'purple-900',
        to: 'pink-900',
      },
    },
  },
}
```

**Después:**
```typescript
decorativePanel: {
  login: {
    title: 'Bienvenido a Mi Aplicación',
    subtitle: 'Tu socio confiable para soluciones innovadoras',
    gradient: {
      light: {
        from: 'indigo-500',
        via: 'violet-500',
        to: 'purple-500',
      },
      dark: {
        from: 'indigo-900',
        via: 'violet-900',
        to: 'purple-950',
      },
    },
  },
}
```

---

### Ejemplo 3: Usar Imagen de Fondo

**Paso 1:** Coloca la imagen en `public/`
```
public/
└── images/
    └── login-hero.jpg
```

**Paso 2:** Configura en `auth.config.ts`
```typescript
decorativePanel: {
  login: {
    title: 'Bienvenido de Vuelta',
    subtitle: 'Continúa tu viaje con nosotros',
    // ...
  },
}
```

---

### Ejemplo 4: Diferenciar Login y Register

```typescript
decorativePanel: {
  login: {
    title: 'Iniciar Sesión',
    subtitle: 'Bienvenido de vuelta a nuestra comunidad',
    gradient: {
      light: {
        from: 'blue-500',
        via: 'indigo-500',
        to: 'violet-500',
      },
      dark: {
        from: 'blue-900',
        via: 'indigo-900',
        to: 'violet-950',
      },
    },
  },
  register: {
    title: 'Crear Cuenta',
    subtitle: 'Únete a nuestra comunidad hoy mismo',
    gradient: {
      light: {
        from: 'green-500',
        via: 'emerald-500',
        to: 'teal-500',
      },
      dark: {
        from: 'green-900',
        via: 'emerald-900',
        to: 'teal-950',
      },
    },
  },
}
```

**Resultado:**
- Login: Tono azul/violeta (profesional)
- Register: Tono verde/teal (fresco, amigable)

---

### Ejemplo 5: Tema Corporativo Completo

```typescript
export const authConfig: AuthPageConfig = {
  logo: {
    text: 'TechCorp',
    size: '2xl',
    imageUrl: '/techcorp-logo.svg',
    imageAlt: 'TechCorp - Soluciones Tecnológicas',
  },
  
  decorativePanel: {
    login: {
      title: 'Acceso al Portal',
      subtitle: 'Inicia sesión para acceder a tu cuenta empresarial',
      gradient: {
        light: {
          from: 'slate-600',
          via: 'slate-700',
          to: 'slate-800',
        },
        dark: {
          from: 'slate-800',
          via: 'slate-900',
          to: 'slate-950',
        },
      },
    },
    
    register: {
      title: 'Crear Cuenta',
      subtitle: 'Únete a nuestra red de partners',
      gradient: {
        light: {
          from: 'slate-600',
          via: 'slate-700',
          to: 'slate-800',
        },
        dark: {
          from: 'slate-800',
          via: 'slate-900',
          to: 'slate-950',
        },
      },
    },
  },
  
  formSubtitle: {
    login: 'Sign in to access your workspace',
    register: 'Create your account to get started',
  },
}
```

---

## 🔍 Flujo de Datos Interno

### Diagrama de Flujo

```
1. auth.config.ts
   └── authConfig (objeto de configuración)
           ↓
2. useAuthConfig() (composable)
   ├── config: authConfig
   ├── getLogo()
   ├── getDecorativePanel(page)
   └── getGradientClasses(page, mode)
           ↓
3. Componentes (login.vue / register.vue)
   ├── { config: authPageConfig, getDecorativePanel }
   ├── const panelConfig = getDecorativePanel('login')
   └── Renderizado con datos de configuración
           ↓
4. Página renderizada con personalización
```

### En los Componentes

```vue
<script setup>
// Importar composable
const { config: authPageConfig, getDecorativePanel } = useAuthConfig()

// Obtener configuración específica
const panelConfig = getDecorativePanel('login')
</script>

<template>
  <!-- Logo -->
  <div class="mb-6">
    <img
      v-if="authPageConfig.logo.imageUrl"
      :src="authPageConfig.logo.imageUrl"
      :alt="authPageConfig.logo.imageAlt"
      class="h-10 w-auto"
    />
    <h2
      v-else
      :class="`text-${authPageConfig.logo.size}`"
    >
      {{ authPageConfig.logo.text }}
    </h2>
  </div>

  <!-- Panel Decorativo -->
  <div
    :class="[
      'bg-gradient-to-br',
      `from-${panelConfig.gradient.light.from}`,
      `via-${panelConfig.gradient.light.via}`,
      `to-${panelConfig.gradient.light.to}`,
      'dark:from-' + panelConfig.gradient.dark.from,
      'dark:via-' + panelConfig.gradient.dark.via,
      'dark:to-' + panelConfig.gradient.dark.to
    ]"
    :style="panelConfig.backgroundImage ? 
      `background-image: url('${panelConfig.backgroundImage}')` : 
      undefined
    "
  >
    <h2>{{ panelConfig.title }}</h2>
    <p>{{ panelConfig.subtitle }}</p>
  </div>
</template>
```

### Composable useAuthConfig

```typescript
import { authConfig, type AuthPageConfig } from '~/config/auth.config'

export const useAuthConfig = () => {
  return {
    // Objeto completo de configuración
    config: authConfig,
    
    // Obtener configuración del logo
    getLogo: () => authConfig.logo,
    
    // Obtener configuración del panel de una página
    getDecorativePanel: (page: 'login' | 'register') => {
      return authConfig.decorativePanel[page]
    },
    
    // Generar clases de gradiente para Tailwind
    getGradientClasses: (page: 'login' | 'register', mode: 'light' | 'dark' = 'light') => {
      const panel = authConfig.decorativePanel[page]
      const gradient = panel.gradient[mode]
      
      return `from-${gradient.from} via-${gradient.via} to-${gradient.to}`
    },
  }
}
```

---

## ✅ Checklist de Personalización

Para personalizar tu sistema de autenticación:

- [ ] **Logo**
  - [ ] Cambiar texto de la marca
  - [ ] Ajustar tamaño del logo
  - [ ] (Opcional) Agregar imagen del logo

- [ ] **Subtítulos del Formulario**
  - [ ] Personalizar subtítulo de login
  - [ ] Personalizar subtítulo de register

- [ ] **Login**
  - [ ] Cambiar título del panel
  - [ ] Cambiar subtítulo del panel
  - [ ] Personalizar gradiente (modo claro)
  - [ ] Personalizar gradiente (modo oscuro)
  - [ ] (Opcional) Agregar imagen de fondo

- [ ] **Register**
  - [ ] Cambiar título del panel
  - [ ] Cambiar subtítulo del panel
  - [ ] Personalizar gradiente (modo claro)
  - [ ] Personalizar gradiente (modo oscuro)
  - [ ] (Opcional) Agregar imagen de fondo

- [ ] **Testing**
  - [ ] Verificar en modo claro
  - [ ] Verificar en modo oscuro
  - [ ] Verificar en móvil
  - [ ] Verificar en desktop

---

## 🚀 Mejores Prácticas

### 1. Consistencia de Marca
- Usa los mismos colores de tu marca
- Mantén consistencia entre login y register
- Considera la psicología del color para tu industria

### 2. Accesibilidad
- Los subtítulos deben ser claros y concisos
- Los gradientes deben tener suficiente contraste con el texto blanco
- Las imágenes de fondo incluyen overlay automático de 40%

### 3. Performance
- Optimiza las imágenes de fondo
- Usa WebP para mejor rendimiento
- Mantén las imágenes SVG ligeras para logos

### 4. Responsive
- El sistema es responsive por diseño
- Los gradientes funcionan en todos los tamaños
- El logo se ajusta automáticamente

### 5. Mantenimiento
- Modifica solo `auth.config.ts` para cambios visuales
- No necesitas tocar los componentes
- La configuración es type-safe con TypeScript

---

## 🔧 Solución de Problemas

### Problema: El gradiente no se muestra

**Causa posible:** Estás usando `backgroundImage` simultáneamente.

**Solución:**
```typescript
// ❌ Incorrecto - backgroundImage tiene prioridad
gradient: { /* ... */ },
backgroundImage: '/image.jpg',  // Esto desactiva el gradiente

// ✅ Correcto - Usa solo uno
gradient: { /* ... */ },
// backgroundImage: '/image.jpg',  // Comenta esto para usar gradiente
```

---

### Problema: Los colores en modo oscuro no se ven bien

**Causa posible:** Usas tonos muy claros en modo oscuro.

**Solución:**
```typescript
// ❌ Incorrecto - demasiado claro para modo oscuro
dark: {
  from: 'blue-400',  // No hay suficiente contraste
  via: 'blue-500',
  to: 'indigo-600',
}

// ✅ Correcto - tonos oscuros apropiados
dark: {
  from: 'blue-800',
  via: 'blue-900',
  to: 'indigo-950',
}
```

---

### Problema: El logo se ve muy grande/pequeño

**Causa posible:** El tamaño del logo no es el adecuado para tu diseño.

**Solución:**
```typescript
// Prueba diferentes tamaños
logo: {
  text: 'Mi Marca',
  size: 'xl',  // Cambia: 'sm', 'md', 'lg', 'xl', '2xl'
}
```

---

### Problema: La imagen de fondo no se carga

**Causa posible:** La ruta no es correcta.

**Solución:**
```typescript
// ❌ Incorrecto - no incluye public/
backgroundImage: 'public/images/bg.jpg'

// ✅ Correcto - la ruta es desde public/
backgroundImage: '/images/bg.jpg'

// Verifica que la imagen existe en:
// public/images/bg.jpg
```

---

## 📚 Recursos Adicionales

- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Nuxt UI](https://ui.nuxt.com/)
- [Documentación de Better Auth](./BETTER_AUTH.md)

---

## 📝 Changelog

### v1.0.0 (2026)
- Sistema de configuración inicial
- Soporte para logo (texto e imagen)
- Panel decorativo configurable
- Gradientes para modo claro y oscuro
- Imágenes de fondo opcionales
- Separación de configuración por página

### v1.1.0 (2026)
- Agregados subtítulos del formulario configurables
- Separación de subtítulos de panel y formulario
- Ejemplos ampliados para diferentes casos de uso

---

**Última actualización:** Enero 2026  
**Versión:** 1.1.0