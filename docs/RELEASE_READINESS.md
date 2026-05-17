# QuackDoku Release Readiness

Estado: pre-publicacion MVP.

Referencia de cuentas/env vars pendientes: `docs/REQUIRED_ACCOUNTS_AND_KEYS.md`.

## P0 - Bloquea Publicar

- Store assets:
  - Hecho: `assets/icon.png` 1024x1024.
  - Hecho: `assets/adaptive-icon.png` 1024x1024 configurado en `app.config.js`.
  - Hecho: `assets/splash-icon.png` configurado en `app.config.js`.
  - Falta: screenshots finales de Android/iOS desde build real, no desde web.
  - Falta: copy de store, categoria, rating de edad y notas de privacidad en Play Console/App Store Connect.
- Privacy policy:
  - Borrador local: `docs/PRIVACY_POLICY.md`.
  - Falta: publicarla en una URL estable antes de mandar review.
  - Actualizar cuando se active AdMob, RevenueCat, push o backend con leaderboard real.
- Build de release:
  - Hecho: `eas.json` con profiles `development`, `preview` y `production`.
  - Hecho: `app.config.js` inyecta config por env para API, push, AdMob y RevenueCat.
  - Falta: probar una build instalada fuera de Expo Go.

## P1 - MVP Online

- Backend Fastify daily + leaderboard:
  - Hecho: backend MVP en `server/` con Fastify y persistencia JSON local.
  - Hecho:
    - `GET /health`.
    - `GET /cases/daily?date=YYYY-MM-DD`.
    - `POST /cases/daily/complete`.
    - `GET /cases/daily/leaderboard?date=YYYY-MM-DD`.
  - Hecho: cliente movil usa `EXPO_PUBLIC_API_URL` y mantiene fallback local si el backend falla.
  - Falta: reemplazar JSON local por PostgreSQL/Prisma antes de escalar.
- Push notifications:
  - Hecho: `expo-notifications` instalado.
  - Hecho: permiso, token Expo, recordatorio diario y toggle en Perfil.
  - Requiere configurar proyecto Expo/EAS y probar en build real.

## P2 - Monetizacion

- AdMob:
  - Hecho: adaptador `lib/ads.ts` para rewarded placements:
    - `basic_hint`.
    - `continue_after_game_over`.
  - Hecho: queda desactivado por `EXPO_PUBLIC_ADS_ENABLED=false` hasta tener ad unit IDs reales.
- RevenueCat:
  - Hecho: adaptador `lib/revenueCat.ts` para init, entitlements y compra.
  - Producto previsto: `quackdoku.league_pass.weekly`.
  - Skins siguen siendo placeholder de UI; falta ownership/equip real.

## P2 - Localizacion

- i18n ES/EN:
  - Hecho: helper local simple en `lib/i18n.ts`, catalogos `locales/es.ts` y `locales/en.ts`.
  - Hecho: selector ES/EN en Perfil.
  - Hecho: tabs, Cases, Daily, Shop y Profile cableados parcialmente.
  - Falta: traducir textos profundos de juego/casos narrativos si se quiere EN completo.

## Orden Recomendado

1. Crear build `development` o `preview` con EAS y probar push/SDKs nativos fuera de Expo Go.
2. Subir privacy policy a URL estable.
3. Crear screenshots reales de Android/iOS.
4. Configurar IDs reales de AdMob y API keys de RevenueCat.
5. Migrar backend de JSON local a PostgreSQL/Prisma si se espera trafico real.
