# Estado del Proyecto QuackDoku

Fecha del checkpoint: 2026-05-16

## Slice MVP-Core en curso (rama `feature/mvp-core`)

Trabajo en marcha para llevar el juego a MVP publicable. Cambios ya aplicados:

### Persistencia local (AsyncStorage + zustand persist)

`@react-native-async-storage/async-storage` instalado. Los tres stores que guardan progreso del jugador ahora persisten entre sesiones:

- `stores/userStore.ts` → key `quackdoku-user` v1. Persiste username, level, xp, monedas, gems, pistas, racha, casos completados, mejor tiempo, league pass.
- `stores/dailyStore.ts` → key `quackdoku-daily` v1. Persiste `resultsByDate` (resultado del caso diario completado).
- `stores/collectionStore.ts` → key `quackdoku-collection` v1. Persiste `unlockedDucks` y `favoriteDuck`.

`gameStore` NO persiste — partida en curso es ephemeral por diseño MVP. Las partidas se reinician al cerrar la app (aceptable hasta tener autosave server-side).

Cada `persist(...)` usa `partialize` para guardar solo el estado, no las funciones. Bumpear `version` si cambia el shape.

### Feedback hapticos y SFX

Wrappers nuevos:

- `lib/haptics.ts` — wrapper sobre `expo-haptics` con auto-skip en web, toggle global (`setHapticsEnabled`), y métodos `light/medium/heavy/success/warning/error/selection`.
- `lib/sound.ts` — wrapper sobre `expo-av`. Registro de SFX vía `registerSfx(event, source)` para evitar que Metro intente bundlear archivos inexistentes. `playSfx(event)` es no-op si el evento no fue registrado.

Eventos SFX previstos: `place | error | victory | hint | undo | select | tick`.

Carpeta `assets/sfx/` creada con README explicando qué archivos `.mp3` colocar. Mientras los archivos no existan, `playSfx` no hace nada (no crashea).

`app/_layout.tsx` tiene el bloque `registerSfx(...)` comentado listo para descomentar cuando lleguen los archivos. Hace `unloadAllSfx()` al desmontar.

Wireup en `app/game/[caseId].tsx`:
- Colocación correcta → `haptics.medium()` + `playSfx('place')`. Caso resuelto → `haptics.success()` + `playSfx('victory')`.
- Colocación inválida con vida perdida → `haptics.error()` + `playSfx('error')`.
- Conflicto sin vida perdida → `haptics.warning()` + `playSfx('error')`.
- Acusación correcta → `haptics.success()` + `playSfx('victory')`. Fallida → `haptics.error()` + `playSfx('error')`.
- Pista usada → `haptics.medium()` + `playSfx('hint')`. Sin pistas → `haptics.warning()`.
- Deshacer → `haptics.light()` + `playSfx('undo')`. Sin historial → `haptics.warning()`.
- Seleccionar sospechoso → `haptics.selection()` + `playSfx('select')`.

PENDIENTE: probar en dispositivo real, conseguir/grabar los 7 SFX, descomentar registro.

### Tutorial onboarding

Primer arranque (o reset manual) muestra un overlay modal de 4 pasos dentro de la pantalla de juego:

- Bienvenida + explicacion de regla sudoku-de-patos.
- Como seleccionar un sospechoso.
- Como colocar en celda.
- Pistas y boton "Acusar".

Componente `components/tutorial/TutorialOverlay.tsx` (RN `Modal` transparente + indicador de pasos + skip). Steps por defecto exportados como `DEFAULT_TUTORIAL_STEPS`.

Flag `hasSeenTutorial` en `userStore` (persistido). Acciones `markTutorialSeen()` y `resetTutorial()`. El timer del juego pausa mientras el overlay esta visible.

Boton "Repetir tutorial" disponible en pantalla de Perfil con confirmacion Alert.

### Catalogo extendido (21 casos)

Antes habia 6 casos. Ahora 21: `CASE_001` (autoral murdoku), `CASE_006` (escenario imagen murdoku 9x9) y 19 generados latin 6x6 vía `makeGeneratedCase(...)` con seeds fijos y nombres de sala tematicos.

Mix difficulty: 1 hard autoral + 1 hard imagen + 5 easy (case_002, 007, 008, 009, 010, 011) + 6 medium (003, 004, 012, 013, 014, 015, 016, 017) + 4 hard (005, 018, 019, 020, 021). Cadena lineal vía `prerequisite_cases` (case_NNN requiere case_NNN-1).

Nuevo test `lib/__tests__/catalogue.test.ts` (3 tests) verifica que los 19 generados:
- pasan `validateBoardDefinition`.
- son deterministas por seed (build A === build B).
- escogen 6 patos unicos por caso desde `CATALOGUE_DUCK_POOL` (12 patos).

Total tests: 24/24 pass. tsc clean.

### Telemetria + crash reporting

`lib/telemetry.ts` abstrae dos backends:

- **PostHog** (`posthog-react-native`) — analytics de producto. Funciona en Expo Go.
- **Sentry** (`@sentry/react-native` + config plugin en `app.json`) — crashes + breadcrumbs. Requiere dev build / EAS (no funciona en Expo Go; los calls hacen no-op silencioso).

API publica:

- `initTelemetry({ posthogApiKey, posthogHost, sentryDsn, environment, release, debug })` — idempotente.
- `identifyUser(userId, traits)` / `setUserContext(traits)`.
- `track(event, properties)` — eventos PostHog + breadcrumb Sentry.
- `trackScreen(name, props)`.
- `captureException(error, context)` / `captureMessage(text, level)`.
- `flushTelemetry()` antes de cerrar / unmount.

Tipo `TelemetryEvent` documenta el vocabulario aceptado (app_open, tutorial_*, case_*, hint_*, life_lost, daily_*, screen_view, error_boundary, etc.). Cada call esta envuelto en try/catch.

Init en `app/_layout.tsx`:

- Lee config via `EXPO_PUBLIC_POSTHOG_API_KEY`, `EXPO_PUBLIC_POSTHOG_HOST`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_ENV` (process.env fallback a Constants.expoConfig.extra).
- Identifica al usuario con username + level + cases_completed + streak + has_league_pass.
- Emite `app_open` con plataforma + version.
- `flushTelemetry()` en unmount.

ErrorBoundary global (`components/ErrorBoundary.tsx`) envuelve toda la app:

- `getDerivedStateFromError` + `componentDidCatch` → `captureException` + `track('error_boundary')`.
- Fallback UI claro con boton "Reintentar" que llama a `reset()`.

Eventos cableados:

- `app_open` — primer mount.
- `tutorial_started` / `tutorial_completed` / `tutorial_skipped`.
- `case_started` (case_id, title, difficulty, play_mode, is_daily).
- `case_completed` (+ stars, elapsed, errors, hearts_left, clues_left, coins/xp reward).
- `daily_completed` cuando is_daily=true.
- `daily_shared` desde `DailyShareCard`.
- `hint_used` (type, source, clues_left) / `hint_denied` (reason).
- `life_lost` (reason: 'placement' | 'accusation', hearts_left).
- `accusation_submitted` (is_complete, lost_heart).
- `error_boundary` (message, name).

Archivos nuevos: `lib/telemetry.ts`, `components/ErrorBoundary.tsx`, `.env.example`. `.gitignore` ignora `.env`, `.env.local`, `.sentryclirc`, `sentry.properties`. `app.json` plugins: `expo-router`, `expo-av`, `@sentry/react-native`.

PENDIENTE: crear cuentas PostHog + Sentry, copiar `.env.example` a `.env`, rellenar claves reales, hacer dev build con EAS para activar Sentry nativo.

### Telemetria → STUB en MVP (Expo Go incompat)

Al intentar arrancar en Expo Go con SDK 54 detectamos que `posthog-react-native@4` y `@sentry/react-native@7` usan sintaxis `import.meta` (ESM moderno) que Hermes no soporta sin transform Babel adicional. Bundle compilaba pero crasheaba silenciosamente en device.

Decision: degradar `lib/telemetry.ts` a **stub no-op** (mantiene API publica `track/identify/captureException/...` pero solo loguea a consola en `__DEV__`). Paquetes desinstalados de `package.json`:
- `posthog-react-native`
- `@sentry/react-native`
- peer deps `expo-application` / `expo-device` / `expo-localization` (no las usabamos)

Plugin `@sentry/react-native` quitado de `app.json`. `.env` con keys reales conservado para cuando se reactiven los backends.

Reactivar telemetria real cuando: (a) hagamos EAS dev build (Babel pipeline transforma `import.meta`), o (b) downgrade a `posthog-react-native@3.x` + `@sentry/react-native@5.x`, o (c) anadir plugin Babel `@babel/plugin-syntax-import-meta`. Codigo de la implementacion real se preserva en commit `e8e3d1a`.

### Babel + react-native-worklets/plugin

`react-native-reanimated@4.1.1` (SDK 54 default) requiere registrar `react-native-worklets/plugin` en `babel.config.js`. Sin el, mobile crashea silenciosamente al cargar reanimated (web no usa el modulo nativo, por eso ahi cargaba).

`babel.config.js` ahora incluye el plugin. Cambios en babel obligan `npx expo start --clear` para invalidar cache de transformaciones.

### Rutas Expo Router

`app/_layout.tsx` declaraba `Stack.Screen name="daily"` pero la carpeta `app/daily/` no exporta layout — solo `index.tsx` y `result.tsx`. Warning de expo-router. Corregido a:
- `Stack.Screen name="daily/index"`
- `Stack.Screen name="daily/result"`

## Pendiente inmediato slice MVP-Core (siguientes commits)

- Onboarding extra: bandera en `(tabs)/index.tsx` o `case/[caseId]` para mostrar bienvenida fuera del primer caso.
- Sentry + analytics (PostHog o Amplitude).
- 15 casos generados nuevos (seeds + nombres temáticos).
- App icon adaptativo + splash + screenshots + privacy policy. Estado detallado en `docs/RELEASE_READINESS.md`.
- Backend mínimo Fastify para daily real + leaderboard.
- Push notifications (`expo-notifications`).
- AdMob rewarded adapter via contrato `lib/monetization.ts`.
- RevenueCat IAP para skins.
- i18n ES + EN.

---

Fecha del checkpoint anterior: 2026-05-07

Este documento resume donde va el proyecto para que otro desarrollador, o su Codex, pueda entrar al codigo sin depender del historial de chat.

## Resumen actual

QuackDoku es una app movil hecha con Expo y React Native. El primer caso jugable ya esta montado con una logica tipo Murdoku: el jugador selecciona un sospechoso y luego toca una casilla del tablero para colocarlo.

El flujo actual ya no usa arrastrar y soltar. Esto se cambio porque en movil el arrastre daba problemas: los personajes desaparecian del tablero o se colocaban de forma imprecisa.

El proyecto se esta moviendo hacia una identidad visual mas premium: pantallas claras para Home, Perfil, Daily y mapa; pantallas oscuras para puzzle, victoria, duelo y equipo. La prioridad inmediata es que cada feature se construya como una pieza completa: logica, UI, assets, datos, test manual y documentacion.

## Estado funcional

- La app arranca en Expo Go.
- El usuario estaba probando con `npx expo start --clear --port 8081`.
- La pantalla del caso esta compactada.
- El boton `Jugar caso` queda fijo abajo y separado de los botones del sistema Android.
- La barra inferior de tabs respeta safe area en Android.
- En el tablero, tocar un personaje solo lo selecciona.
- Ya no se marca automaticamente la casilla correcta al seleccionar un sospechoso.
- El jugador debe pensar la posicion y tocar la casilla manualmente.
- En `murdoku`, tocar una celda con sospechoso activo coloca directamente.
- La barra de acciones del puzzle quedo reducida a `Deshacer`, `Pista x N` y `Acusar`.
- Hay boton `Acusar` para enviar la solucion cuando todos los sospechosos estan colocados.
- Si la solucion es incorrecta, se pierde una vida.
- Si la solucion es correcta, se completa el caso.
- Hay una primera implementacion local de `Caso Diario`:
  - ruta `app/daily/index.tsx` con countdown a medianoche UTC.
  - ruta `app/daily/result.tsx` con tarjeta compartible y ranking simulado.
  - seed deterministico por fecha en `lib/daily.ts`.
  - guardado en memoria del resultado diario en `stores/dailyStore.ts`.
  - el juego reconoce `?daily=1` y al completar registra share grid, estrellas, tiempo y errores.
- Hay una primera pasada visual basada en los mockups:
  - Home con header compacto, card oscura del caso diario, liga resumida, stats y expedientes activos.
  - Caso Diario con hero oscuro, countdown por horas/minutos/segundos, stats y top detectives.
  - Resultado diario en modo oscuro tipo victoria, con tarjeta compartible y ranking.
  - Tabs inferiores con boton activo amarillo.

## Direccion visual actual

La app debe sentirse como puzzle premium movil, no como landing page. Referencias principales de estilo:

- Amarillo principal: `#FFC700`.
- Fondo claro: `#F7F7F3`.
- Negro/ink: `#080913`.
- Panel navy: `#11112A`.
- Card navy: `#1B1B3D`.
- Verde exito: `#20B85A`.
- Rojo error: `#E84855`.
- Texto principal: `#10101C`.
- Texto secundario: `#777783`.

Reglas visuales:

- Botones principales amarillos tipo pill.
- Titulos y numeros en peso muy bold.
- Cards con radio alto y sombras suaves.
- UI densa y utilitaria: el primer viewport debe mostrar accion real, no explicaciones largas.
- Mantener modo claro para Home, Daily, Mapa y Perfil.
- Mantener modo oscuro para Puzzle, Resultado/Victoria, Duelos y Equipo.
- Los assets de patos deben funcionar con PNG real cuando exista y con emoji fallback cuando falte.

## Assets actuales

Assets reales conectados:

- `assets/duck_tophat.png`
- `assets/duck_plum.png`
- `assets/logo.png`
- `assets/coin.png`
- `assets/clue.png`
- `assets/heart_full.png`
- `assets/heart_empty.png`

Estos assets se muestran usando:

- `components/ui/DuckAvatar.tsx`
- `components/ui/GameAsset.tsx`

`DuckAvatar` pinta una imagen PNG si el pato tiene asset. Si todavia no tiene imagen, usa el emoji como fallback.

`GameAsset` pinta los assets globales de interfaz: logo, monedas, pistas y corazones.

Pantallas donde ya se usa `DuckAvatar`:

- Tablero del juego.
- Selector inferior de sospechosos.
- Pantalla de detalle del caso.
- Pantalla de personajes.
- Perfil.
- Modal de caso resuelto.

Pantallas donde ya se usa `GameAsset`:

- Home.
- Lista de casos.
- Detalle del caso.
- HUD del juego.
- Display de vidas.
- Selector de sospechosos.
- Tienda.
- Perfil.
- Modal de caso resuelto.

## Capturas de referencia

Hay una carpeta externa al proyecto llamada:

`../logicas del juego`

Contiene capturas de referencia como:

- `error1.jpeg`
- `error2.jpeg`
- `error3.jpeg`
- `error4.jpeg`
- `error5.jpeg`
- `error6.jpeg`
- `escena1.png`
- `escena2.png`
- `escena3.png`

Las imagenes `escena1`, `escena2` y `escena3` son capturas completas de referencia visual del juego tipo Murdoku. No son sprites recortados para usar directamente como assets.

## Archivos clave

### Logica del tablero

- `lib/boardValidator.ts`

Contiene validaciones importantes:

- modo de juego `murdoku`
- celdas bloqueadas
- marcas `X`
- conflictos por fila y columna
- validacion de solucion
- deteccion de celdas incorrectas
- comprobacion de si el tablero esta listo para acusar

### Generador de puzzles

- `lib/puzzleGenerator.ts`

Genera puzzles deterministas por `seed`:

- `generatePuzzle(seed, opts)` -> `{ solution, given, locked, rooms, ... }`.
- Modo `latin`: cuadrado latino con regiones rectangulares; el puzzle generado tiene solucion UNICA a partir de las pistas dadas (verificado con un solver de conteo).
- Modo `murdoku`: solucion valida tipo matriz de permutacion (un sospechoso por fila y columna) mas unas casillas `is_fixed` de semilla. La unicidad real en murdoku depende del sistema de pistas narrativas, no del tablero; `countMurdokuLayouts` mide cuanta ambiguedad queda.
- RNG propio (mulberry32 + hash FNV-1a del seed): mismo seed y mismas opciones -> mismo puzzle.
- Dificultad (`easy`/`medium`/`hard`) controla cuantas casillas se revelan.
- Tests en `lib/__tests__/puzzleGenerator.test.ts` con `node --test` (no hay runner instalado; usa el TS nativo de Node >= 23). Tambien pasa `npx tsc --noEmit`. Para esto se anadio `noEmit` y `allowImportingTsExtensions` a `tsconfig.json`.

### Adaptador a BoardData

- `lib/puzzleToBoardData.ts`

`puzzleToBoardData(generatedPuzzle, opts?)` -> `BoardData` valido para el juego y para `validateBoardDefinition`. Para `latin` reutiliza las regiones rectangulares del generador; para `murdoku` (o latin de tamano primo) usa un room por fila como fallback. No genera scene objects ni pistas narrativas.

**El Caso Diario ahora es generado.** `getDailyCaseForDate` / `getDailyCase` (en `lib/daily.ts`) ya no rotan un caso fijo de `ALL_CASES`: construyen un `GameCase` determinista por fecha con un puzzle generado en modo `latin` (cuadrado latino de patos: cada pato una vez por fila, columna y sala). Sin pistas narrativas (`logic_clues`/`suspect_clues`/`narrative_clues` vacios) — la tira de pistas del juego solo aparece en modo `murdoku`, asi que se oculta solo. Dificultad sube por ciclos de 7 dias (`getDailyDifficulty(dayNumber)`: dias 1-2 easy, 3-5 medium, 6-7 hard), con `time_target` 420/600/780s. El `case_id` del diario es `daily_<fecha>`; `app/game/[caseId].tsx` lo resuelve via `getDailyCaseForDate()` cuando `?daily=1` (no via `CASE_MAP`). La pantalla de caso resuelto oculta el reveal de culpable/victima en modo `latin`. `getDailyCase` cachea el ultimo caso por fecha (se llama en cada render de varias pantallas). `generateDailyBoard(date?, playMode?)` sigue disponible si solo hace falta el tablero.

Tests: `lib/__tests__/puzzleGenerator.test.ts` + `lib/__tests__/puzzleToBoardData.test.ts` (16 en total, todos pasan con `node --test`). `daily.ts` no se testea desde Node (usa imports relativos sin extension que solo resuelve Metro); se cubre via `npx tsc --noEmit`.

### Catalogo de casos

`constants/cases.ts` ya no tiene solo `CASE_001`. Hay 5 casos:

- `CASE_001` — autoral, modo `murdoku`, con pistas narrativas (El Collar Dorado).
- `CASE_002` .. `CASE_005` — generados con `makeGeneratedCase(...)` (usa `generatePuzzle` + `puzzleToBoardData`), modo `latin` ("sudoku de patos"), seed fijo por caso, dificultad easy/medium/medium/hard, sin pistas narrativas, encadenados por `prerequisite_cases`. `cases.ts` ahora importa `lib/puzzleGenerator` y `lib/puzzleToBoardData` (sin ciclo de runtime: esos modulos solo tienen `import type` de `cases.ts`). Se generan en module-init (~4 puzzles 6x6, milisegundos).

### Tienda

`app/(tabs)/shop.tsx` tiene seccion nueva "Skins de patos" con `SKIN_PACKS` (4 packs: Noir, Neón, Oro, Pirata) y `SkinPackCard` (preview de emojis + acento de color + badge NUEVO). Igual que el resto de la tienda es placeholder ("Próximamente") — NO hay sistema real de skins (ownership/equip/alt-art) todavia; eso es feature aparte (`feature/skins`).

### Monetizacion preparada

No hay SDK de AdMob ni compras reales integradas todavia. Se agrego `lib/monetization.ts` como contrato central para eventos y placements:

- Recompensados previstos: `basic_hint`, `reveal_hint`, `continue_after_game_over`. La UI visible ahora solo expone `basic_hint` y continuar; `reveal_hint` queda reservado como placement futuro.
- IAP previsto: `league_pass` con `grantsGameplayPower: false` para mantenerlo no pay-to-win.
- `subscribeMonetizationEvents(...)` permite que un futuro adaptador de AdMob/IAP escuche eventos sin reescribir la logica de juego.

Eventos ya emitidos desde `app/game/[caseId].tsx`:

- `need_hint` cuando el jugador pide pista y no hay inventario o no hay objetivo.
- `hint_used` cuando consume una pista del inventario.
- `life_lost` al fallar una colocacion o acusacion.
- `continue_offer_shown`, `continue_paid_coins` y `continue_denied` en el modal de game over.
- `level_complete` al resolver un caso y otorgar recompensas.

La Home emite `league_pass_opportunity` al tocar la card de liga. `stores/userStore.ts` tiene `hasLeaguePass` y `setLeaguePassOwned(...)` como entitlement local placeholder; todavia no hay validacion de recibos ni servidor.

### Aspecto del tablero (regiones irregulares + frame)

El generador de puzzles `latin` ahora produce **regiones irregulares tipo jigsaw** (areas contiguas de N celdas, como el Murdoku real), no cajas rectangulares. Opcion `regionStyle: 'jigsaw' | 'box'` en `generatePuzzle` (default `jigsaw`; `box` necesita que N factorice). Opcion `roomNames` para nombrar las areas; los casos del catalogo y el diario pasan nombres tematicos. `puzzleToBoardData` admite `decorations: number` para esparcir objetos de escena decorativos deterministas (hash del `board_id`) en celdas vacias — solo visual, no afecta el juego; catalogo y diario usan 7.

Polish visual del tablero:
- `app/game/[caseId].tsx`: fondo navy profundo `#0F0F23`, HUD oscuro, tira compacta amber para pistas generales y barra inferior reducida.
- `components/board/MansionBoard.tsx`: el tablero va sobre un "mat" navy; cada region usa overlay suave y borde de su propio color.
- `components/board/RoomCell.tsx`: highlights, errores y celdas fijas usan overlays oscuros/semitransparentes para no romper la atmosfera.
- `components/board/RoomLabel.tsx`: el nombre del area es una pildora oscura anclada cerca del centroide de la region.
- `components/board/DuckSelector.tsx`: sospechosos primero, acciones despues; tiles con avatar, color propio y badge de letra.
- `app/game/[caseId].tsx`: banner de reglas para modo `latin` compacto con borde amber.

Ajustes tras feedback de capturas (las celdas se veian oscuras/embarradas y los puzzles muy llenos):
- `MansionBoard.tsx`: el `board` vuelve a fondo navy, pero las regiones bajan alpha y los bordes toman el color de cada zona para agrupar sin ruido.
- Menos pistas reveladas en `latin`: `DIFFICULTY_GIVEN_RATIO` bajado a easy 0.42 / medium 0.32 / hard 0.22 (antes 0.56/0.42/0.30). 6x6 da ~15/12/8 givens.
- Menos decoraciones: casos del catalogo `decorations: 3`, diario `2` (antes 7).
- `RoomCell.tsx`: objetos de escena mas pequenos y tenues (`cellSize*0.42`, opacity 0.5); marca X de celda no disponible mas pequena y gris (antes X roja grande).

PENDIENTE PROBAR EN MOVIL/EXPO: no se ha verificado en dispositivo nada de esto — flujo Home -> Daily -> Game -> Resultado, casos nuevos del catalogo y su detalle, regiones jigsaw, pildoras de area, decoraciones, mat oscuro/navy, banner de reglas, ni la seccion de skins. Hay que `npx expo start --clear` y comprobarlo todo. Verificado solo: `npx tsc --noEmit` exit 0, `node --test` 21/21, y un script que confirma que los 4 casos generados + el diario pasan `validateBoardDefinition` (no son puzzles invalidos — lo que se veia mal era presentacion).

### Tablero con imagen de escenario

`BoardData` admite `background_image?: ImageSourcePropType`. Si esta puesta, `MansionBoard` la pinta de fondo (stretch a `boardWidth x boardHeight`) y NO dibuja colores de region, bordes gruesos, `RoomLabel` ni iconos de objeto (todo eso ya viene en la imagen); las celdas quedan transparentes, solo se dibuja la rejilla fina, patos, highlights y X.

`CASE_006` ("El Jardín de Atrás") es el primer caso de este tipo: murdoku 9x9 sobre `assets/escenario1.png`. Ahora modela la logica de la lamina "The Backyard Garden": pistas A-H/V, objetos no ocupables, regiones irregulares del escenario y solucion final de la pagina de resolucion. La victima es `duck_plum` (V) y el asesino es `duck_witch` (C).

Convencion de pistas para casos futuros:
- `narrative_clues` y `logic_clues`: solo pistas generales del escenario/reglas, no pistas de un personaje concreto. Se muestran arriba en la tira compacta sin titulo.
- `suspect_clues`: pistas de personaje. Se muestran encima del selector al elegir ese sospechoso y pueden resaltar candidatos amplios (`highlight_cells`) sin revelar la celda exacta.

El catalogo ahora tiene 6 casos (`CASE_001`..`CASE_006`).

PENDIENTE / FOLLOW-UP visual: portraits de sospechosos con burbujas de pista alrededor del tablero (estilo lamina murdoku.com); mas escenarios pre-renderizados.

### Estado del juego

- `stores/gameStore.ts`
- `stores/dailyStore.ts`

Controla:

- tablero actual
- historial para deshacer
- seleccion de celda
- candidatos/notas internas
- marcas `X` internas heredadas
- colocacion de sospechosos
- envio de solucion
- vidas
- pistas
- fase del juego
- historial de movimientos para generar el share grid del caso diario

### Datos de casos

- `constants/cases.ts`

Define el caso actual:

- habitaciones
- objetos de escena
- sospechosos
- victima
- culpable
- pistas por sospechoso
- solucion
- recompensas

Este archivo es sensible: si dos personas lo editan a la vez, es facil generar conflictos.

### Datos de personajes

- `constants/ducks.ts`

Define los patos, rarezas, nombres, lore, emoji fallback y assets opcionales.

### UI del tablero

- `components/board/MansionBoard.tsx`
- `components/board/RoomCell.tsx`
- `components/board/RoomLabel.tsx`
- `components/board/DuckSelector.tsx`

Estos archivos controlan la experiencia principal del juego.

### Pantallas

- `app/game/[caseId].tsx`: pantalla del juego.
- `app/daily/index.tsx`: entrada del caso diario.
- `app/daily/result.tsx`: resultado compartible y ranking diario local.
- `app/case/[caseId].tsx`: pantalla de detalle del caso.
- `app/(tabs)/cases.tsx`: lista de casos.
- `app/(tabs)/characters.tsx`: coleccion de personajes.
- `app/(tabs)/profile.tsx`: perfil.
- `app/(tabs)/shop.tsx`: tienda.
- `app/(tabs)/_layout.tsx`: tabs inferiores.
- `app/_layout.tsx`: layout raiz con safe area.

## Workflow recomendado con ramas

No trabajar directo sobre `main`.

Ramas sugeridas:

- `main`: version estable.
- `feature/caso-diario`: Caso Diario completo, UI + estado + share + conexion futura a backend.
- `feature/mapa-progresion`: mapa visual de casos, posiciones, unlocks y navegacion.
- `feature/puzzle-polish`: tablero, selector, feedback, pistas y experiencia de resolucion.
- `feature/personajes-assets`: assets de patos, perfil visual, coleccion y escalas.
- `feature/progreso-persistencia`: progreso real, recompensas, racha y storage/backend futuro.
- `fix/nombre-del-bug`: arreglos concretos de bugs.

Antes de dividir el trabajo, conviene hacer un commit checkpoint con el estado actual y subirlo al remoto. Asi todos empiezan desde la misma base.

Comandos recomendados:

```bash
git checkout main
git pull
git checkout -b feature/mapa-progresion
```

Para guardar avances:

```bash
git status
git add .
git commit -m "Describe el avance"
git push -u origin feature/mapa-progresion
```

Para integrar trabajo:

- Abrir Pull Request.
- El otro debe revisar el PR, aunque sea corto.
- Probar Expo en movil antes de mezclar.
- Mezclar a `main` solo si funciona.

## Como trabajar conectados

No dividir el proyecto como "uno hace logica y otro hace assets" de forma rigida. Eso rompe la app porque cada feature necesita datos, UI, estados, balance y assets al mismo tiempo.

La division recomendada es por slices verticales:

- Una persona toma el rol de owner de una feature.
- La otra toma el rol de reviewer/apoyo de esa misma feature.
- El owner implementa el camino principal.
- El reviewer valida en movil, revisa edge cases, ajusta visuales o datos pequenos y confirma que no se rompa otra pantalla.
- En la siguiente feature pueden cambiar roles.

Cada slice debe cerrar con:

- UI visible funcionando en Expo Go.
- Estado/datos minimos conectados.
- Assets o fallback definidos.
- Navegacion clara.
- Checklist manual probado.
- Este documento actualizado si cambia una decision.

## Plan de trabajo para dos personas

### Slice 1: Caso Diario completo local

Estado: primera version hecha en frontend/local.

Owner sugerido: quien toque `app/daily/*` y `lib/daily.ts`.

Apoyo/reviewer:

- Probar en movil que Home -> Daily -> Game -> Resultado funciona.
- Revisar copy, share text y legibilidad.
- Revisar que el resultado diario no duplique recompensa.

Archivos:

- `app/daily/index.tsx`
- `app/daily/result.tsx`
- `components/daily/DailyShareCard.tsx`
- `lib/daily.ts`
- `stores/dailyStore.ts`
- `app/game/[caseId].tsx`

Pendiente:

- Persistir el resultado local con storage o backend.
- Conectar endpoint real cuando exista backend.
- Reemplazar ranking simulado por ranking real.

### Slice 2: Mapa visual de casos

Objetivo: reemplazar la lista de casos por nodos sobre plano de mansion, estilo Candy Crush.

Owner sugerido: quien toque layout, posiciones y navegacion.

Apoyo/reviewer:

- Crear/revisar posiciones visuales.
- Probar unlocks, caso actual y scroll en movil pequeno.
- Revisar que no se rompan tabs ni detalle de caso.

Archivos esperados:

- `app/(tabs)/cases.tsx`
- `components/map/CaseMapNode.tsx`
- `constants/mapPositions.ts`
- `constants/cases.ts`

Contrato:

- Cada caso debe tener posicion `x/y`, estado visual y ruta al detalle.
- El nodo disponible mas reciente pulsa o destaca.
- Bloqueados deben mostrar condicion visible.

### Slice 3: Pulido del puzzle principal

Objetivo: acercar la pantalla de juego al mockup oscuro.

Owner sugerido: quien toque tablero y feedback.

Apoyo/reviewer:

- Verificar reglas Murdoku despues de cada ajuste visual.
- Probar acusar, vidas, pistas, deshacer y tap directo para colocar.
- Revisar que los patos no se salgan de celdas.

Archivos:

- `app/game/[caseId].tsx`
- `components/board/MansionBoard.tsx`
- `components/board/RoomCell.tsx`
- `components/board/DuckSelector.tsx`
- `lib/boardValidator.ts`
- `stores/gameStore.ts`

Contrato:

- Ningun cambio visual debe cambiar reglas sin avisar.
- Si se toca `boardValidator.ts`, el reviewer debe probar solucion correcta e incorrecta.

### Slice 4: Personajes, equipo y perfil

Objetivo: que coleccion, perfil y equipo se vean como sistema premium coherente.

Owner sugerido: quien toque assets/personajes.

Apoyo/reviewer:

- Revisar integracion de assets con `DuckAvatar`.
- Probar fallback emoji.
- Confirmar que cada asset se ve bien en tablero, cards y perfil.

Archivos:

- `assets/`
- `constants/ducks.ts`
- `components/ui/DuckAvatar.tsx`
- `app/(tabs)/characters.tsx`
- `app/(tabs)/profile.tsx`

Contrato:

- Cada pato nuevo debe tener `duck_id`, nombre, rareza, lore y fallback emoji.
- No bloquear una pantalla por falta de PNG.

### Slice 5: Progreso real y economia

Objetivo: guardar avance real del jugador y cerrar loop de recompensas.

Owner sugerido: quien toque stores/progreso.

Apoyo/reviewer:

- Probar que no se dupliquen monedas/XP.
- Revisar racha, casos completados y mejor tiempo.
- Confirmar que Home, Perfil y Daily leen el mismo estado.

Archivos:

- `stores/userStore.ts`
- `stores/dailyStore.ts`
- `stores/collectionStore.ts`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/index.tsx`

Contrato:

- Toda recompensa debe tener una sola fuente de verdad.
- Si se completa un caso dos veces, decidir explicitamente si da recompensa o solo mejora record.

## Ritmo de coordinacion

Antes de empezar:

- Ambos hacen `git pull`.
- Cada uno dice que slice va a tocar.
- Si dos slices comparten archivo, se decide quien edita primero.

Durante el trabajo:

- Commits pequenos.
- No reformatear archivos completos.
- Si se toca un archivo sensible, avisar en el chat.
- Mantener Expo Go abierto y probar cada pantalla que cambia.

Antes de cerrar una tarea:

- Ejecutar `npx tsc --noEmit` o el comando de TypeScript documentado abajo.
- Probar en movil, no solo web.
- Escribir en el PR que se probo.
- Pedir review del otro.

Archivos sensibles compartidos:

- `constants/cases.ts`
- `stores/gameStore.ts`
- `app/game/[caseId].tsx`
- `components/board/RoomCell.tsx`
- `components/board/DuckSelector.tsx`
- `constants/theme.ts`

## Normas para evitar conflictos

- Antes de empezar una tarea, hacer `git pull`.
- Trabajar siempre en una rama propia.
- Hacer commits pequenos y descriptivos.
- No mezclar cambios de logica con cambios visuales grandes en el mismo commit.
- No reformatear archivos completos si no hace falta.
- No borrar codigo que otra persona haya tocado sin avisar.
- Actualizar este documento cuando cambie una decision importante.

## Como probar

Arrancar Expo:

```bash
npx expo start --clear --port 8081
```

Abrir Expo Go en el movil y conectar al servidor.

Verificacion TypeScript usada desde WSL con Node de Windows:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command '& "C:\Program Files\nodejs\node.exe" "C:\Users\Usuario\Desktop\QuackDoku\quackdoku\node_modules\typescript\bin\tsc" --noEmit'
```

Tambien se puede probar desde un entorno Windows normal con:

```bash
npx tsc --noEmit
```

## Pendiente cercano

- Crear assets definitivos para todos los sospechosos del caso 1.
- Revisar escala de assets dentro de las casillas del tablero.
- Mejorar objetos de escena: mesa, silla, planta, estanteria, alfombra.
- Pulir pistas por sospechoso para que no sean demasiado obvias.
- Revisar textos largos en tarjetas de sospechosos en movil pequeno.
- Crear mas casos jugables.
- Conectar Caso Diario a backend real cuando exista Fastify/Prisma/Redis.
- Persistir resultado diario en storage o backend; ahora vive en memoria de Zustand.
- Reemplazar ranking diario simulado por endpoint real.
- Reemplazar lista de casos por mapa visual de nodos.
- Pulir pantalla de puzzle al modo oscuro de los mockups.
- Crear pantalla Equipo si se decide llevar esa feature al frontend actual.
- Guardar progreso real del jugador.
- Revisar tienda y economia.
- Agregar sonido y feedback visual.
- Agregar tests basicos para `boardValidator.ts`.

## Bugs ya corregidos

- Arrastre impreciso de personajes en movil.
- Personajes que desaparecian o se recolocaban mal.
- Barra inferior solapada con botones Android.
- Boton de jugar escondido por scroll en la pantalla del caso.
- Seleccionar Chef marcaba la casilla exacta de la solucion.

## Decisiones tomadas

- La interaccion principal sera tocar personaje y tocar casilla.
- No se usara drag and drop por ahora.
- Las pistas de personajes no deben revelar automaticamente la casilla exacta.
- Los assets reales son opcionales por personaje.
- Mientras falten assets, se mantiene emoji fallback.
- El tablero actual es funcional antes que visualmente final.
- La colaboracion se hara por features completas, no por silos fijos de "logica" y "assets".

## Nota para otro Codex

Antes de modificar codigo, leer estos archivos:

- `docs/ESTADO_PROYECTO.md`
- `constants/cases.ts`
- `lib/boardValidator.ts`
- `stores/gameStore.ts`
- `components/board/DuckSelector.tsx`
- `components/board/RoomCell.tsx`

Si la tarea es visual, revisar tambien:

- `components/ui/DuckAvatar.tsx`
- `components/ui/GameAsset.tsx`
- `constants/ducks.ts`
- `app/(tabs)/characters.tsx`
- `app/case/[caseId].tsx`

No asumir que todos los assets existen. Usar siempre fallback.
