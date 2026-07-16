# Sport Tracker — Frontend (Expo / Expo Go SDK 54)

Frontend móvil completo para una API de deporte, construido con **Expo Router + TypeScript**.
Cubre: registro/login, feed social, gestión de rutas (CRUD), grabación GPS en vivo,
cámara, mapa, notificaciones push/en tiempo real, mensajería (chat) y perfil.

## 1. Modelo de datos (`SportRoute`)

```ts
{
  id, user_id,
  title: string,
  description: string,
  sport: "running" | "cycling" | "walking" | "hiking" | "swimming",
  distance: number,        // metros
  duration: number,        // segundos
  average_speed: number,   // metros/segundo
  route_points: [{ latitude, longitude, timestamp, altitude?, speed? }],
  photos: string[],
  created_at, updated_at
}
```

## 2. Requisitos previos

- Node.js 18 o superior
- La app **Expo Go** instalada en tu celular (App Store / Play Store) — soporta SDK 54
- Tu backend (API REST) corriendo y accesible desde tu celular (misma red WiFi o desplegado en Render, etc.)

## 3. Instalación — comandos exactos

```bash
# 1. Entra a la carpeta del proyecto
cd sport-tracker-app

# 2. Instala dependencias
npm install

# 3. Alinea las versiones exactas con Expo SDK 54 (importante)
npx expo install --fix

# 4. Configura la URL de tu API
#    Edita src/services/api.ts y cambia API_BASE_URL por la URL real de tu backend
```

## 4. Ejecutar en Expo Go

```bash
npx expo start
```

Escanea el código QR con la app **Expo Go** (Android) o con la cámara del iPhone (iOS).
Si tu celular y tu computadora no están en la misma red, usa:

```bash
npx expo start --tunnel
```

> ⚠️ `react-native-maps` funciona en Expo Go, pero si luego generas un build nativo
> (EAS Build) para producción, revisa la configuración de la API Key de Google Maps
> en `app.json` (Android) e iOS.

## 5. Endpoints que tu API debe exponer

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | Usuario autenticado (Bearer token) |
| GET | `/api/routes?user_id=` | Lista de rutas |
| GET | `/api/routes/:id` | Detalle de ruta |
| POST | `/api/routes` | Crea ruta (ver modelo arriba) |
| PUT | `/api/routes/:id` | Actualiza ruta |
| DELETE | `/api/routes/:id` | Elimina ruta |
| GET | `/api/feed` | Feed de publicaciones (`{ posts: FeedPost[] }`) |
| POST | `/api/feed/:id/like` / `DELETE /api/feed/:id/like` | Dar/quitar like |
| GET | `/api/notifications` | Lista de notificaciones |
| PATCH | `/api/notifications/:id/read` | Marca como leída |
| POST | `/api/notifications/push-token` | Registra token push de Expo |
| GET | `/api/messages/conversations` | Lista de chats |
| GET | `/api/messages/:conversationId` | Historial de mensajes |
| POST | `/api/messages/:conversationId` | Envía mensaje |
| POST | `/api/upload` | Sube foto (multipart/form-data) → `{ url }` |

## 6. Tiempo real (Socket.io)

El backend debe exponer un servidor **Socket.io** en la misma URL base (sin `/api`)
y emitir estos eventos:

- `route:new` → cuando alguien publica una ruta nueva (feed en vivo)
- `notification:new` → nueva notificación in-app
- `message:new` → nuevo mensaje de chat
- Debe aceptar autenticación vía `auth: { token }` en el handshake

## 7. Estructura del proyecto

```
app/                  → pantallas (Expo Router, navegación por archivos)
  (auth)/login.tsx, register.tsx
  (tabs)/feed.tsx, routes.tsx, create.tsx, messages.tsx, notifications.tsx, profile.tsx
  route/[id].tsx       → detalle de ruta
  chat/[id].tsx        → chat individual
src/
  types/               → tipos TypeScript (SportRoute, User, etc.)
  services/             → api.ts (axios) y socket.ts (tiempo real)
  context/              → AuthContext, NotificationsContext
  hooks/                → useLocationTracking (GPS)
  components/           → RouteCard, PostCard
```

## 8. Notas

- Las notificaciones push solo funcionan en **dispositivo físico** (no en simulador).
- El seguimiento GPS pide permiso de ubicación en primer plano; para tracking en
  segundo plano (app minimizada) se necesitaría `expo-task-manager` + permiso
  "always" y ya no funciona 100% dentro de Expo Go (requeriría un build de desarrollo).
- La cámara y el mapa sí funcionan completos dentro de Expo Go.
