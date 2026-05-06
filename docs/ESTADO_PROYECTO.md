# Estado del Proyecto QuackDoku

Fecha del checkpoint: 2026-05-06

Este documento resume donde va el proyecto para que otro desarrollador, o su Codex, pueda entrar al codigo sin depender del historial de chat.

## Resumen actual

QuackDoku es una app movil hecha con Expo y React Native. El primer caso jugable ya esta montado con una logica tipo Murdoku: el jugador selecciona un sospechoso y luego toca una casilla del tablero para colocarlo.

El flujo actual ya no usa arrastrar y soltar. Esto se cambio porque en movil el arrastre daba problemas: los personajes desaparecian del tablero o se colocaban de forma imprecisa.

## Estado funcional

- La app arranca en Expo Go.
- El usuario estaba probando con `npx expo start --clear --port 8081`.
- La pantalla del caso esta compactada.
- El boton `Jugar caso` queda fijo abajo y separado de los botones del sistema Android.
- La barra inferior de tabs respeta safe area en Android.
- En el tablero, tocar un personaje solo lo selecciona.
- Ya no se marca automaticamente la casilla correcta al seleccionar un sospechoso.
- El jugador debe pensar la posicion y tocar la casilla manualmente.
- Hay modo `Descartar` con marca `X`.
- Hay boton `Acusar` para enviar la solucion cuando todos los sospechosos estan colocados.
- Si la solucion es incorrecta, se pierde una vida.
- Si la solucion es correcta, se completa el caso.

## Assets actuales

Assets reales conectados:

- `assets/duck_tophat.png`
- `assets/duck_plum.png`

Estos assets se muestran usando:

- `components/ui/DuckAvatar.tsx`

`DuckAvatar` pinta una imagen PNG si el pato tiene asset. Si todavia no tiene imagen, usa el emoji como fallback.

Pantallas donde ya se usa `DuckAvatar`:

- Tablero del juego.
- Selector inferior de sospechosos.
- Pantalla de detalle del caso.
- Pantalla de personajes.
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

### Estado del juego

- `stores/gameStore.ts`

Controla:

- tablero actual
- historial para deshacer
- seleccion de celda
- modo notas
- modo descartar
- colocacion de sospechosos
- envio de solucion
- vidas
- pistas
- fase del juego

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
- `feature/logica-juego`: logica de tablero, validaciones, casos y pistas.
- `feature/assets-ui`: assets, personajes, UI visual, iconos y pulido estetico.
- `fix/nombre-del-bug`: arreglos concretos de bugs.

Antes de dividir el trabajo, conviene hacer un commit checkpoint con el estado actual y subirlo al remoto. Asi todos empiezan desde la misma base.

Comandos recomendados:

```bash
git checkout main
git pull
git checkout -b feature/assets-ui
```

Para guardar avances:

```bash
git status
git add .
git commit -m "Describe el avance"
git push -u origin feature/assets-ui
```

Para integrar trabajo:

- Abrir Pull Request.
- Revisar cambios.
- Probar Expo.
- Mezclar a `main` solo si funciona.

## Division de trabajo sugerida

### Persona A: logica

Responsabilidades:

- reglas del juego
- validaciones
- pistas
- nuevos casos
- balance de dificultad
- vidas, recompensas y progreso

Archivos habituales:

- `lib/boardValidator.ts`
- `stores/gameStore.ts`
- `constants/cases.ts`
- `app/game/[caseId].tsx`

### Persona B: assets y UI

Responsabilidades:

- assets de personajes
- iconos
- mejora visual del tablero
- coleccion de personajes
- pantallas de casos
- pantallas de perfil/tienda

Archivos habituales:

- `assets/`
- `constants/ducks.ts`
- `components/ui/DuckAvatar.tsx`
- `components/board/RoomCell.tsx`
- `components/board/DuckSelector.tsx`
- `app/(tabs)/characters.tsx`
- `app/case/[caseId].tsx`

Atencion: `RoomCell.tsx` y `DuckSelector.tsx` los pueden necesitar ambas personas. Si se van a tocar en paralelo, avisar antes.

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
- `constants/ducks.ts`
- `app/(tabs)/characters.tsx`
- `app/case/[caseId].tsx`

No asumir que todos los assets existen. Usar siempre fallback.
