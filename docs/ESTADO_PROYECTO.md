# Estado del Proyecto QuackDoku

Fecha del checkpoint: 2026-05-17

Este es el documento vivo para que otra persona pueda entrar al proyecto sin depender del historial de chat. El archivo `docs/ESTADO_PROYECTO 07-05-26.md` queda como snapshot historico; para el estado actual usar este archivo.

## Resumen Corto

QuackDoku es una app movil Expo/React Native tipo puzzle premium: mezcla sudoku/logica con misterio y coleccion de patos. La app ya corre en Expo Go y el flujo principal funciona en movil.

Estado actual:

- Rama local actual: `main`.
- Expo SDK 54, React Native 0.81.5, Expo Router.
- Entry real: `index.ts` con `react-native-gesture-handler` y `expo-router/entry`.
- No se usa `App.tsx`; fue eliminado.
- Config Expo viva: `app.config.js`. No debe recrearse `app.json`.
- El juego principal usa interaccion tap-to-place: seleccionar sospechoso y tocar celda.
- Caso Diario existe con fallback local y cliente para backend.
- Backend MVP existe en `server/`.
- PostHog funciona via API HTTP directa, sin SDK nativo.
- Sentry nativo no esta activo; cualquier crash/exception se reporta como evento de telemetria lightweight.
- Push, AdMob y RevenueCat estan cableados, pero requieren build real/dev build para validacion completa.
- PR #3 de assets fue mergeada y los nuevos patos ya estan conectados en `constants/ducks.ts`.

## Como Correr

Instalar dependencias:

```bash
npm install
```

App Expo:

```bash
npx expo start --clear --port 8081
```

Expo Go en movil:

- Usar el enlace `exp://<IP_LOCAL_PC>:8081`.
- El movil y la PC deben estar en la misma red.
- Si hay cambios en Babel, assets o config nativa, arrancar con `--clear`.

Validaciones principales:

```bash
npm run typecheck
npx expo-doctor
npx expo config --type public
npm run server:build
```

Servidor backend local:

```bash
npm run server:dev
```

## Flujo de Juego Actual

Interaccion principal:

- Se selecciona un sospechoso/pato.
- Se toca una celda del tablero para colocarlo.
- No se usa drag and drop.
- Hay `Deshacer`, `Pista` y `Acusar`.
- Si la acusacion es incorrecta, se pierde vida.
- Si la solucion es correcta, se completa el caso.
- Haptics y SFX estan cableados, pero los SFX siguen no-op hasta agregar archivos `.mp3`.

Casos:

- Catalogo extendido a 21 casos.
- `CASE_001` es autoral/murdoku.
- `CASE_006` usa escenario imagen.
- El resto incluye casos generados deterministicos.
- Hay tests para catalogo/generadores/conversion de puzzle.

Caso Diario:

- `app/daily/index.tsx`: entrada diaria.
- `app/daily/result.tsx`: resultado y share/ranking.
- `lib/daily.ts`: seed deterministic por fecha UTC.
- `stores/dailyStore.ts`: resultados diarios persistidos.
- `lib/dailyApi.ts`: cliente backend con fallback local y evento `daily_api_failed`.
- Home solo recalcula caso al cambiar fecha UTC; el contador esta separado para no re-renderizar toda la Home cada segundo.

## Pantallas Principales

- `app/(tabs)/index.tsx`: Home.
- `app/(tabs)/cases.tsx`: lista/mapa de casos.
- `app/(tabs)/characters.tsx`: coleccion de patos.
- `app/(tabs)/shop.tsx`: tienda/monetizacion placeholder.
- `app/(tabs)/profile.tsx`: perfil, idioma, recordatorio diario, toggle de analitica.
- `app/game/[caseId].tsx`: gameplay.
- `app/case/[caseId].tsx`: detalle de caso.
- `app/daily/index.tsx`: daily.
- `app/daily/result.tsx`: resultado daily.

## Assets

Assets globales conectados:

- `assets/logo.png`
- `assets/coin.png`
- `assets/clue.png`
- `assets/heart_full.png`
- `assets/heart_empty.png`
- `assets/icon.png`
- `assets/adaptive-icon.png`
- `assets/splash-icon.png`
- `assets/favicon.png`
- `assets/escenario1.png`

Assets de patos conectados en `constants/ducks.ts`:

- `assets/duck_tophat.png`
- `assets/duck_plum.png`
- `assets/duck_chef.png`
- `assets/duck_detective.png`
- `assets/duck_butler.png`
- `assets/duck_witch.png`
- `assets/duck_pirate.png`
- `assets/duck_king.png`
- `assets/duck_ninja.png`
- `assets/duck_robot.png`
- `assets/duck_cowboy.png`

Pendiente de assets:

- `duck_witch2` sigue usando emoji fallback.
- Faltan 7 SFX `.mp3` en `assets/sfx/`: `place`, `error`, `victory`, `hint`, `undo`, `select`, `tick`.
- Cuando existan los SFX, descomentar `registerSfx(...)` en `app/_layout.tsx`.

Componentes de assets:

- `components/ui/DuckAvatar.tsx`: usa PNG si el pato tiene `asset`; si no, emoji fallback.
- `components/ui/GameAsset.tsx`: logo, moneda, pista y corazones.

## Persistencia y Stores

Persisten con AsyncStorage + zustand persist:

- `stores/userStore.ts`: usuario, nivel, XP, monedas, pistas, racha, casos completados, mejor tiempo, league pass, tutorial visto.
- `stores/dailyStore.ts`: resultados por fecha.
- `stores/collectionStore.ts`: patos desbloqueados y favorito.
- `stores/settingsStore.ts`: `installId`, idioma, push token, recordatorio diario, telemetria habilitada.

No persiste:

- `stores/gameStore.ts`: partida en curso. Por ahora se reinicia al cerrar la app.

Nota importante:

- `app/_layout.tsx` espera hidratacion de `userStore` y `settingsStore` antes de identificar usuario, enviar `app_open` e iniciar RevenueCat. Esto evita datos falsos tipo `Detective` nivel 1 en PostHog.
- `expo-splash-screen` mantiene el splash hasta terminar la hidratacion inicial.

## Telemetria

Implementacion actual:

- Archivo: `lib/telemetry.ts`.
- No usa `posthog-react-native` ni `@sentry/react-native`.
- Envia eventos a PostHog por HTTP directo.
- Usa `/batch/` para agrupar eventos.
- `distinct_id` es `settingsStore.installId`, no username.
- Perfil tiene opt-out de analitica.
- Si faltan keys, los eventos hacen no-op con log en DEV.

Keys:

- `EXPO_PUBLIC_POSTHOG_API_KEY`
- `EXPO_PUBLIC_POSTHOG_HOST`
- `EXPO_PUBLIC_ENV`

Eventos relevantes:

- `app_open`
- `$identify`
- `$screen`
- `case_started`
- `case_completed`
- `accusation_submitted`
- `daily_started`
- `daily_completed`
- `shop_opened`
- `profile_opened`
- `characters_opened`
- `daily_api_failed`
- `telemetry_opt_in`
- `telemetry_opt_out`

Sentry:

- `EXPO_PUBLIC_SENTRY_DSN` puede existir en env, pero el SDK nativo no esta instalado/activo.
- Para Sentry real hay que agregar SDK en dev build/EAS y probar fuera de Expo Go.

## Push Notifications

Archivo: `lib/notifications.ts`.

Estado:

- `expo-notifications` instalado.
- Handler global configurado.
- Perfil puede pedir permiso, guardar token y agendar recordatorio diario.
- Trigger diario usa `SchedulableTriggerInputTypes.DAILY`.

Limitacion:

- Expo Go SDK 53+ muestra warning/error para push remoto con `expo-notifications`.
- Validar push en dev/preview build, no solo Expo Go.

## Audio y Feedback

- `lib/haptics.ts`: feedback haptico.
- `lib/sound.ts`: SFX con `expo-audio`.
- `expo-av` fue eliminado.
- `app.config.js` usa plugin `expo-audio` con `recordAudioAndroid: false` y `microphonePermission: false`.
- La app no debe pedir permiso de microfono.

## Backend

Carpeta: `server/`.

Estado:

- Fastify MVP funcionando.
- Persistencia JSON local para pruebas.
- Prisma schema existe como base para migracion futura.

Endpoints:

- `GET /health`
- `GET /cases/daily?date=YYYY-MM-DD`
- `POST /cases/daily/complete`
- `GET /cases/daily/leaderboard?date=YYYY-MM-DD`

App movil:

- Usa `EXPO_PUBLIC_API_URL`.
- Si no hay backend o falla, mantiene fallback local.
- Fallos se trackean con `daily_api_failed`.

Pendiente:

- Hosting real.
- PostgreSQL/Prisma real antes de escalar.
- Seguridad/rate limit si se publica leaderboard.

## Monetizacion

AdMob:

- Archivo: `lib/ads.ts`.
- Dependencia: `react-native-google-mobile-ads`.
- Placements previstos:
  - `basic_hint`
  - `continue_after_game_over`
- Desactivado hasta configurar `EXPO_PUBLIC_ADS_ENABLED=true` e IDs reales.
- Requiere probar en dev build, especialmente con New Architecture.

RevenueCat:

- Archivo: `lib/revenueCat.ts`.
- Dependencia: `react-native-purchases`.
- Producto previsto: `quackdoku.league_pass.weekly`.
- Entitlement esperado: `league_pass`.
- Se inicializa con `settingsStore.installId`.
- Requiere API keys reales y build instalada.

## i18n

Archivos:

- `lib/i18n.ts`
- `locales/es.ts`
- `locales/en.ts`

Estado:

- Selector ES/EN en Perfil.
- Tabs, Cases, Daily, Shop y Profile parcialmente cableados.

Pendiente:

- Textos profundos de gameplay y narrativa de casos si se quiere EN completo.

## Configuracion de Release

Archivos:

- `app.config.js`
- `eas.json`
- `docs/RELEASE_READINESS.md`
- `docs/REQUIRED_ACCOUNTS_AND_KEYS.md`
- `docs/PRIVACY_POLICY.md`

Estado:

- `app.config.js` es la fuente de configuracion Expo.
- `app.json` no debe volver.
- Icono, adaptive icon y splash estan configurados.
- EAS profiles existen.

Pendiente bloqueante para publicar:

- Crear/vincular proyecto EAS y `EXPO_PUBLIC_EAS_PROJECT_ID`.
- Subir privacy policy a URL publica.
- Screenshots reales Android/iOS desde build instalada.
- Crear cuentas/keys de AdMob y RevenueCat.
- Probar build `development` o `preview` fuera de Expo Go.

Para claves pendientes, leer `docs/REQUIRED_ACCOUNTS_AND_KEYS.md`.

## Archivos Sensibles

Evitar que dos personas editen a la vez:

- `constants/cases.ts`
- `constants/ducks.ts`
- `stores/gameStore.ts`
- `app/game/[caseId].tsx`
- `components/board/RoomCell.tsx`
- `components/board/DuckSelector.tsx`
- `components/board/MansionBoard.tsx`
- `constants/theme.ts`
- `app.config.js`
- `package.json`

Regla practica:

- Antes de tocar uno de esos archivos, avisar en el chat/equipo.
- No reformatear archivos completos.
- Commits pequenos por feature.

## Workflow Recomendado

No trabajar dos personas directo sobre el mismo archivo en `main`.

Flujo sugerido:

```bash
git checkout main
git pull
git checkout -b feature/nombre-corto
```

Antes de PR:

```bash
npm run typecheck
npx expo-doctor
```

Para cambios nativos/config:

```bash
npx expo config --type public
```

Cada PR debe decir:

- Que pantallas se probaron.
- Si se probo en Expo Go o dev build.
- Si toca archivos sensibles.
- Si agrega assets nuevos.

## Pendientes Prioritarios

P0:

- Crear build `development` o `preview` con EAS y probar fuera de Expo Go.
- Publicar privacy policy.
- Screenshots reales de store.
- Validar push, RevenueCat y AdMob en build real.

P1:

- Conseguir/agregar SFX `.mp3`.
- Terminar i18n EN completo.
- Migrar backend JSON local a PostgreSQL/Prisma si se espera uso real.
- Agregar tests para `gameStore` y flujo submit/undo/continue.
- Optimizar re-renders de `app/game/[caseId].tsx` con selectors granulares.

P2:

- Mapa visual de progreso de casos.
- Skins/equipo real para patos.
- Balance de economia y recompensas.
- Mejorar mock leaderboard para que se sienta menos plano si no hay backend.

## Notas de Expo Go

- Expo Go sirve para revisar UI, gameplay, assets y PostHog lightweight.
- Push remoto, AdMob, RevenueCat y cualquier SDK nativo deben validarse en dev/preview build.
- El warning de `expo-notifications` en Expo Go es esperado con SDK 54.
- Si la app queda pegada despues de cambios Babel/config/assets, reiniciar con `npx expo start --clear --port 8081`.

## Ultimas Decisiones Importantes

- Mantener telemetria sin SDK nativo para no romper Expo Go.
- Usar `installId` persistido como identidad anonima estable.
- Mantener `app.config.js` como unica config Expo.
- Usar `expo-audio`, no `expo-av`.
- No pedir permiso de microfono.
- No bloquear pantallas por falta de PNG: siempre hay emoji fallback.
- Integrar assets por `constants/ducks.ts`, no hardcodearlos en pantallas.
