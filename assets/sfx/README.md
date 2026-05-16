# SFX assets

Coloca aqui los siguientes archivos `.mp3` (mono, 16-bit, ~44kHz, <80KB cada uno):

- `place.mp3` — colocar pato en celda correcta.
- `error.mp3` — colocacion invalida, acusacion fallida, vida perdida.
- `victory.mp3` — caso resuelto.
- `hint.mp3` — pista usada.
- `undo.mp3` — deshacer movimiento.
- `select.mp3` — seleccionar sospechoso.
- `tick.mp3` — countdown del caso diario (opcional).

Cuando todos esten en su sitio, descomenta las llamadas `registerSfx(...)` en `app/_layout.tsx`.

Mientras falten, `playSfx()` no hace nada (no crashea, solo silencio).

Fuentes recomendadas libres de regalias: freesound.org, zapsplat (login gratis), kenney.nl/assets/interface-sounds.

Despues de copiar los archivos, abrir `app/_layout.tsx` y descomentar el bloque `// registerSfx(...)`.
