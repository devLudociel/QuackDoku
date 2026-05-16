# Cuentas y Claves Pendientes

Usa este archivo cuando preguntes "que claves me hacen falta".

## Publicacion / Build

- Expo account + EAS project:
  - Necesitas crear/vincular proyecto EAS.
  - Env:
    - `EXPO_PUBLIC_EAS_PROJECT_ID`
- Google Play Console:
  - Necesaria para publicar Android.
  - Confirmar package: `com.quackdoku.app`.
- Apple Developer / App Store Connect:
  - Necesaria para publicar iOS.
  - Confirmar bundle id: `com.quackdoku.app`.
- Privacy policy URL publica:
  - Subir `docs/PRIVACY_POLICY.md` a una URL estable.
  - Necesaria para Play Console/App Store y AdMob.

## Backend

- Hosting backend:
  - Render, Railway, Fly.io, VPS u otro.
  - Env app:
    - `EXPO_PUBLIC_API_URL`
- Base de datos production:
  - PostgreSQL recomendado antes de escalar.
  - Env servidor futuro:
    - `DATABASE_URL`
- Backend actual:
  - `server/` ya funciona con JSON local para MVP/pruebas.

## Analytics / Errores

- PostHog:
  - Ya esta funcionando si `.env` tiene estos valores:
    - `EXPO_PUBLIC_POSTHOG_API_KEY`
    - `EXPO_PUBLIC_POSTHOG_HOST`
- Sentry:
  - Falta confirmar proyecto/DSN para build real.
  - Env:
    - `EXPO_PUBLIC_SENTRY_DSN`

## Push Notifications

- Expo/EAS project id:
  - Env:
    - `EXPO_PUBLIC_EAS_PROJECT_ID`
- Android production push:
  - Configurar credenciales FCM en EAS/Google si se enviaran pushes remotos desde servidor.
- iOS production push:
  - Configurar APNs mediante Apple Developer/EAS.
- Nota:
  - El recordatorio diario local ya esta implementado, pero debe probarse en una dev/preview build, no solo Expo Go.

## AdMob

- Google AdMob account.
- Crear app Android y app iOS en AdMob.
- App IDs:
  - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
  - `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
- Rewarded ad unit IDs:
  - `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_HINT`
  - `EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_CONTINUE`
  - `EXPO_PUBLIC_ADMOB_IOS_REWARDED_HINT`
  - `EXPO_PUBLIC_ADMOB_IOS_REWARDED_CONTINUE`
- Activacion:
  - `EXPO_PUBLIC_ADS_ENABLED=true`
  - `EXPO_PUBLIC_ADS_TEST_MODE=false`

## RevenueCat

- RevenueCat account.
- Conectar proyectos de Google Play y App Store.
- API keys:
  - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
  - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- Producto previsto:
  - `quackdoku.league_pass.weekly`
- Entitlement esperado:
  - `league_pass`

## Store Assets

- Screenshots reales Android/iOS desde build instalada.
- App store copy ES/EN.
- Categoria, rating de edad y declaraciones de privacidad.
