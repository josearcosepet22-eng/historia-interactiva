# Guía de Despliegue en Vercel (Chronoverse Engine)

Este proyecto está configurado para desplegarse en **Vercel** de forma directa como una aplicación Full-Stack (Frontend en Vite SPA + Backend Serverless en Express).

---

## 🚀 Pasos para Desplegar en Vercel

### 1. Subir a GitHub / GitLab / Bitbucket
Sube el repositorio con todos los archivos actuales (incluyendo `vercel.json` y la carpeta `api/`).

### 2. Importar en Vercel
1. Ve a [vercel.com](https://vercel.com/) e inicia sesión.
2. Haz clic en **"Add New..."** > **"Project"**.
3. Selecciona tu repositorio.

### 3. Configuración de Build y Salida (Automática)
Vercel detectará la configuración gracias al archivo `vercel.json`:
- **Framework Preset**: `Vite` (o `Other`)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Variables de Entorno (Environment Variables)
En la sección **"Environment Variables"** de Vercel antes de desplegar, agrega:
- **`GEMINI_API_KEY`**: Tu clave API de Google Gemini (obtenida en Google AI Studio o GCP).

*(Nota: Si no configuras la clave de inmediato, el motor incluye prólogos y simulaciones de contingencia para que la app no colapse).*

### 5. Desplegar
Haz clic en **"Deploy"**. Vercel compilará el frontend estático y desplegará la función Serverless en `/api/` en menos de 1 minuto.

---

## 🛠️ ¿Qué problemas de compatibilidad se solucionaron?

1. **Adaptación Serverless (`api/index.ts`)**:
   - Vercel no ejecuta servidores persistentes continuos (`app.listen()`) en su plan estándar; en su lugar, utiliza **Serverless Functions**.
   - Se modularizó la API en `api/index.ts` exportando la aplicación Express directamente como función sin dependencias pesadas de desarrollo.

2. **Desacoplamiento de Vite en Producción**:
   - Se eliminó la importación estática de Vite dentro del entorno de la API para evitar errores de módulos no encontrados (`ERR_MODULE_NOT_FOUND`) y límites de tamaño de paquete en Vercel.
   - En desarrollo local (`npm run dev`), `server.ts` sigue integrando Vite fluidamente.

3. **Configuración de Enrutamiento (`vercel.json`)**:
   - Se añadió `vercel.json` con reglas de reescritura (`rewrites`) para redirigir cualquier llamada a `/api/*` hacia la función serverless y el resto de rutas al `index.html` (para el soporte de SPA).

4. **Soporte de Tipos en TypeScript**:
   - Se actualizaron las referencias de tipos en `tsconfig.json` para incluir `"node"` además de `"vite/client"`, permitiendo que el compilador de Vercel valide el backend sin errores.
