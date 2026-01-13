# Email Templates Fix: Expiration Time and Unsubscribe Link

## Problemas Identificados

### 1. Discrepancia en Tiempo de Expiración

**Configuración en `server/lib/auth.ts`:**
```typescript
emailVerification: {
  expiresIn: 3600, // ✅ 3600 segundos = 1 hora
}
```

**Estado inicial de templates:**

| Template | Decía en el texto | Configuración real | Estado |
|----------|------------------|-------------------|---------|
| **welcome.hbs** | "24 hours" ❌ | 1 hora (3600s) | ❌ Incorrecto |
| **verify-again.hbs** | "24 hours" ❌ | 1 hora (3600s) | ❌ Incorrecto |
| **reset-password.hbs** | "1 hour" ✅ | 1 hora (3600s) | ✅ Correcto |

### 2. Enlace de Unsubscribe Inapropiado

**Problema en `welcome.hbs`:**
- Tenía enlace "Unsubscribe from marketing emails" ❌
- Este NO es un email de marketing, es un email transaccional de verificación
- Los otros templates NO tenían este enlace ✅

## Solución

### Cambios Realizados

#### 1. Corrección del Tiempo de Expiración

**Archivo: `server/emails/templates/welcome.hbs`**

**Antes (incorrecto):**
```html
<p style="font-size: 12px; margin-top: 10px; color: #999;">
  This link will expire in 24 hours for security reasons.
</p>
```

**Después (correcto):**
```html
<p style="font-size: 12px; margin-top: 10px; color: #999;">
  This link will expire in 1 hour for security reasons.
</p>
```

**Archivo: `server/emails/templates/verify-again.hbs`**

**Antes (incorrecto):**
```html
<div class="verification-notice">
  <h3>⏰ Important:</h3>
  <p>This verification link will expire in 24 hours for security reasons. Please verify your email before then.</p>
</div>
```

**Después (correcto):**
```html
<div class="verification-notice">
  <h3>⏰ Important:</h3>
  <p>This verification link will expire in 1 hour for security reasons. Please verify your email before then.</p>
</div>
```

#### 2. Eliminación de Enlace de Unsubscribe

**Archivo: `server/emails/templates/welcome.hbs`**

**Antes (incorrecto):**
```html
<div class="footer">
  <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
  <p style="margin-top: 5px;">
    You received this email because you created an account with {{appName}}.
  </p>
  <p style="margin-top: 5px;">
    <a href="{{unsubscribeUrl}}" style="color: #999;">Unsubscribe from marketing emails</a>
  </p>
</div>
```

**Después (correcto):**
```html
<div class="footer">
  <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
  <p style="margin-top: 5px;">
    You received this email because you created an account with {{appName}}.
  </p>
</div>
```

**Nota:** La variable `unsubscribeUrl` ya no es necesaria en el contexto del email.

### Actualización de Endpoints

Los endpoints que envían estos emails no necesitan cambios porque:
- La corrección es solo en el texto del template
- No se requiere cambiar la lógica de envío
- La configuración de `expiresIn: 3600` en `server/lib/auth.ts` ya era correcta

**Archivos afectados:**
- `server/api/email/send-welcome.post.ts` - Sin cambios
- `server/api/email/send-verification.post.ts` - Sin cambios
- `server/api/email/send-reset-password.post.ts` - Sin cambios

## Resultado Final

✅ **Todos los templates ahora muestran el tiempo de expiración correcto: 1 hora**
✅ **Eliminado enlace de unsubscribe inapropiado de welcome.hbs**
✅ **Consistencia entre configuración y texto de los emails**
✅ **Mejora de la experiencia del usuario con información precisa**

## Tiempo de Expiración

**Configuración actual:**
```typescript
// server/lib/auth.ts
emailVerification: {
  expiresIn: 3600, // 1 hora en segundos
}
```

Esto significa:
- Los enlaces de verificación expiran en **1 hora**
- Los enlaces de reset de password también expiran en **1 hora**
- El usuario debe verificar su email dentro de ese tiempo

## Testing

### Verificar Tiempo de Expiración

1. Registrar un nuevo usuario
2. Verificar que el email de bienvenida dice "1 hour"
3. Solicitar reenvío de verificación
4. Verificar que el email de reenvío dice "1 hour"
5. Solicitar reset de password
6. Verificar que el email de reset dice "1 hour"

### Verificar Ausencia de Unsubscribe

1. Revisar email de bienvenida
2. Confirmar que NO aparece "Unsubscribe from marketing emails"
3. El footer solo debe mostrar:
   - Copyright
   - Razón por la que se recibió el email

## Archivos Modificados

- ✅ `server/emails/templates/welcome.hbs` - Corregido tiempo + eliminado unsubscribe
- ✅ `server/emails/templates/verify-again.hbs` - Corregido tiempo

## Archivos Sin Cambios

- ✅ `server/emails/templates/reset-password.hbs` - Ya era correcto
- ✅ `server/lib/auth.ts` - La configuración ya era correcta

## Documentación Relacionada

- **DUPLICATE_EMAIL_FIX.md** - Fix para emails duplicados en registro
- **RESEND_VERIFICATION_FIX.md** - Fix para endpoint de reenvío de verificación

## Fecha

Fixed: January 13, 2026
