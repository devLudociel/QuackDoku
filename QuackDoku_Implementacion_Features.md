# QuackDoku — Instrucciones de Implementación para Claude Code
## 5 Features Probadas en el Mercado

> **Contexto**: QuackDoku es un juego móvil puzzle (React Native + Expo) que combina
> Sudoku con Cluedo usando personajes pato. El stack es React Native 0.74, Expo SDK 51,
> TypeScript, Zustand, React Query, Fastify + PostgreSQL en backend.
> Este documento define exactamente qué construir, cómo, y en qué orden.
> Lee el GDD completo antes de implementar cualquier feature.

---

## FEATURE 1 — CASO DIARIO GLOBAL (inspirado en Wordle)
**Prioridad: P0 — implementar primero. ROI más alto, UA gratuito.**

### Qué es
Todos los jugadores del mundo resuelven el MISMO tablero el mismo día.
Al terminar, comparten un cuadro de emojis con su resultado (igual que Wordle).

### Resultado visual compartible
```
🦆 QuackDoku — Caso del Día #47
"El robo del Collar Dorado"
⭐⭐⭐ | ⏱ 6:42 | ❤️❤️❤️

🟨🟨⬜🟨
🟩🟨🟨⬜
🟩🟩🟩🟩
✅ ¡Caso resuelto! Jugá en quackdoku.app
```
Cada fila = una habitación. 🟩 = pato correcto primera vez. 🟨 = movido. ⬜ = error.

---

### Backend — Nuevas tablas (añadir a schema.prisma)

```prisma
model DailyCase {
  id          String   @id @default(cuid())
  date        String   @unique  // "2026-05-07" — clave de acceso
  caseId      String
  case        Case     @relation(fields: [caseId], references: [id])
  boardSeed   Int      // semilla para reproducir el tablero exacto
  createdAt   DateTime @default(now())
}

model DailyCaseResult {
  id            String    @id @default(cuid())
  userId        String
  dailyCaseId   String
  user          User      @relation(fields: [userId], references: [id])
  dailyCase     DailyCase @relation(fields: [dailyCaseId], references: [id])
  completedAt   DateTime  @default(now())
  timeSeconds   Int
  errors        Int       @default(0)
  stars         Int       // 1-3
  shareGrid     String    // JSON string con la cuadrícula de emojis
  @@unique([userId, dailyCaseId])
}
```

### Backend — Endpoints nuevos

```typescript
// GET /cases/daily
// Devuelve el caso del día. Si no existe para hoy, lo genera y lo guarda.
// El boardSeed garantiza que TODOS los usuarios reciban el mismo tablero.
fastify.get('/cases/daily', async (req, reply) => {
  const today = new Date().toISOString().split('T')[0] // "2026-05-07"
  
  let daily = await prisma.dailyCase.findUnique({ where: { date: today } })
  
  if (!daily) {
    // Rotar entre casos disponibles. Nunca repetir en 30 días.
    const recentDates = getLast30Days() // array de strings de fechas
    const usedCaseIds = await prisma.dailyCase.findMany({
      where: { date: { in: recentDates } },
      select: { caseId: true }
    })
    const usedIds = usedCaseIds.map(d => d.caseId)
    const availableCase = await prisma.case.findFirst({
      where: { id: { notIn: usedIds }, isDaily: true }
    })
    
    daily = await prisma.dailyCase.create({
      data: {
        date: today,
        caseId: availableCase.id,
        boardSeed: generateDailySeed(today) // hash determinístico de la fecha
      }
    })
  }
  
  // Nunca devolver la solución
  const board = generateBoardFromSeed(daily.boardSeed, daily.caseId)
  return { ...daily, board }
})

// POST /cases/daily/complete
// Guarda el resultado y devuelve el string compartible
fastify.post('/cases/daily/complete', { preHandler: [authenticate] }, async (req, reply) => {
  const { timeSeconds, errors, moveHistory } = req.body
  const today = new Date().toISOString().split('T')[0]
  const daily = await prisma.dailyCase.findUnique({ where: { date: today } })
  
  const stars = calculateStars(timeSeconds, errors, daily.caseId)
  const shareGrid = buildShareGrid(moveHistory) // genera el string de emojis
  
  await prisma.dailyCaseResult.create({
    data: {
      userId: req.user.id,
      dailyCaseId: daily.id,
      timeSeconds, errors, stars,
      shareGrid: JSON.stringify(shareGrid)
    }
  })
  
  // Dar recompensas (75 XP + bonus si primero del día)
  await rewardUser(req.user.id, { xp: 75, coins: 150 })
  
  return { stars, shareGrid, shareText: buildShareText(stars, timeSeconds, errors, shareGrid) }
})

// GET /cases/daily/leaderboard
// Top 20 del día con tiempos. Se actualiza cada 5 min (Redis cache).
fastify.get('/cases/daily/leaderboard', async (req, reply) => {
  const cacheKey = `daily_lb_${new Date().toISOString().split('T')[0]}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  const today = new Date().toISOString().split('T')[0]
  const results = await prisma.dailyCaseResult.findMany({
    where: { dailyCase: { date: today } },
    orderBy: [{ stars: 'desc' }, { timeSeconds: 'asc' }],
    take: 20,
    include: { user: { select: { username: true } } }
  })
  
  await redis.setex(cacheKey, 300, JSON.stringify(results)) // cache 5 min
  return results
})
```

### Función generateDailySeed (determinística)

```typescript
// lib/dailySeed.ts
// CRÍTICO: la misma fecha debe producir SIEMPRE el mismo tablero para todos
export function generateDailySeed(dateStr: string): number {
  // Hash simple de la fecha string → número consistente
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // convierte a 32-bit integer
  }
  return Math.abs(hash)
}
```

### Frontend — Componente compartir resultado

```typescript
// components/daily/DailyShareCard.tsx
import { Share } from 'react-native'
import * as Clipboard from 'expo-clipboard'

interface DailyShareCardProps {
  stars: number
  timeSeconds: number
  errors: number
  shareGrid: string[][] // array de filas con emojis
  dayNumber: number
  caseName: string
}

export function DailyShareCard({ stars, timeSeconds, errors, shareGrid, dayNumber, caseName }: DailyShareCardProps) {
  const shareText = buildShareText({ stars, timeSeconds, errors, shareGrid, dayNumber, caseName })
  
  const handleShare = async () => {
    try {
      await Share.share({ message: shareText })
    } catch (e) {
      // fallback: copiar al portapapeles
      await Clipboard.setStringAsync(shareText)
    }
  }
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🦆 QuackDoku — Caso #{dayNumber}</Text>
      <Text style={styles.caseName}>"{caseName}"</Text>
      
      <View style={styles.starsRow}>
        {Array.from({ length: 3 }, (_, i) => (
          <Text key={i} style={styles.star}>{i < stars ? '⭐' : '☆'}</Text>
        ))}
        <Text style={styles.time}> | ⏱ {formatTime(timeSeconds)}</Text>
        <Text style={styles.errors}> | ❤️×{3 - errors}</Text>
      </View>
      
      <View style={styles.grid}>
        {shareGrid.map((row, i) => (
          <Text key={i} style={styles.gridRow}>{row.join('')}</Text>
        ))}
      </View>
      
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Compartir resultado</Text>
      </TouchableOpacity>
    </View>
  )
}

function buildShareText({ stars, timeSeconds, errors, shareGrid, dayNumber, caseName }) {
  const starsStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars)
  const heartsStr = '❤️'.repeat(3 - errors) + '🖤'.repeat(errors)
  const gridStr = shareGrid.map(row => row.join('')).join('\n')
  
  return `🦆 QuackDoku — Caso del Día #${dayNumber}
"${caseName}"
${starsStr} | ⏱ ${formatTime(timeSeconds)} | ${heartsStr}

${gridStr}

¿Podés resolverlo? quackdoku.app`
}
```

### Frontend — Pantalla Daily (nueva ruta)

```
app/
  daily/
    index.tsx    ← pantalla del caso diario con countdown al reset
    result.tsx   ← pantalla de resultado + share + leaderboard
```

```typescript
// app/daily/index.tsx — estructura mínima
// 1. Fetch GET /cases/daily al montar
// 2. Mostrar countdown hasta medianoche (reset del caso)
// 3. Si el usuario ya completó hoy → mostrar su resultado + leaderboard
// 4. Si no → botón "Investigar el caso de hoy" → abre el tablero

// Countdown hasta medianoche UTC
function useCountdownToMidnight() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setUTCHours(24, 0, 0, 0)
      setSecondsLeft(Math.floor((midnight.getTime() - now.getTime()) / 1000))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])
  
  return secondsLeft
}
```

### Push notification para el caso diario

```typescript
// jobs/dailyNotification.ts — ejecutar a las 8am UTC con BullMQ
// Mensaje: "🦆 ¡El nuevo caso ya está disponible! ¿Puedes resolverlo antes que los demás?"
// Enviar a TODOS los usuarios con streaks activas primero, luego al resto.
```

---

## FEATURE 2 — LIGA SEMANAL DE DETECTIVES (inspirado en Duolingo)
**Prioridad: P0. La feature de retención más poderosa después de la racha.**

### Qué es
Cada semana, el jugador compite contra otros 29 detectives de nivel similar.
Los top 10 suben de liga. Los últimos 5 bajan. Todos compiten por XP semanal.

### Ligas (de menor a mayor)
```
🥉 Bronze     → starter, todos los nuevos
🥈 Plata      → top 10 de Bronze
🥇 Oro        → top 10 de Plata
💎 Diamante   → top 10 de Oro
🦆 Detective  → top 10 de Diamante
🔥 Legendario → top 10 de Detective (máximo)
```

### Backend — Tablas nuevas

```prisma
model League {
  id        String   @id @default(cuid())
  tier      String   // "bronze" | "silver" | "gold" | "diamond" | "detective" | "legendary"
  weekStart DateTime // lunes 00:00 UTC de esa semana
  weekEnd   DateTime // domingo 23:59 UTC

  members   LeagueMember[]
}

model LeagueMember {
  id        String  @id @default(cuid())
  leagueId  String
  userId    String
  weeklyXp  Int     @default(0)
  rank      Int?    // se calcula al cerrar la liga
  promoted  Boolean @default(false)
  relegated Boolean @default(false)

  league    League  @relation(fields: [leagueId], references: [id])
  user      User    @relation(fields: [userId], references: [id])

  @@unique([leagueId, userId])
}
```

### Backend — Lógica de asignación semanal

```typescript
// jobs/weeklyLeague.ts — ejecutar cada lunes 00:05 UTC con BullMQ

export async function assignWeeklyLeagues() {
  const weekStart = getMonday(new Date())
  const weekEnd   = getSunday(new Date())

  // 1. Cerrar ligas de la semana anterior → calcular rankings → promover/relegar
  await closeLastWeekLeagues()

  // 2. Agrupar usuarios por tier actual
  const tiers = ['bronze','silver','gold','diamond','detective','legendary']
  
  for (const tier of tiers) {
    // Obtener usuarios de ese tier (hasta 5000 usuarios activos)
    const users = await getUsersByTier(tier, { activeLastDays: 14 })
    
    // Repartir en grupos de 30 (mezclar usuarios nuevos con veteranos dentro del mismo tier)
    const groups = chunkArray(shuffleArray(users), 30)
    
    for (const group of groups) {
      // Crear liga de la semana para este grupo
      const league = await prisma.league.create({
        data: { tier, weekStart, weekEnd }
      })
      
      // Añadir miembros
      await prisma.leagueMember.createMany({
        data: group.map(user => ({
          leagueId: league.id,
          userId: user.id,
          weeklyXp: 0
        }))
      })
    }
  }
}

// Cada vez que un usuario gana XP → actualizar su weeklyXp en la liga activa
export async function addXpToLeague(userId: string, xpAmount: number) {
  const activeLeague = await prisma.leagueMember.findFirst({
    where: {
      userId,
      league: { weekStart: { lte: new Date() }, weekEnd: { gte: new Date() } }
    }
  })
  
  if (activeLeague) {
    await prisma.leagueMember.update({
      where: { id: activeLeague.id },
      data: { weeklyXp: { increment: xpAmount } }
    })
  }
}
```

### Backend — Endpoints

```typescript
// GET /league/me — liga activa del usuario con ranking en tiempo real
fastify.get('/league/me', { preHandler: [authenticate] }, async (req, reply) => {
  const cacheKey = `league_${req.user.id}`
  // Cache 60 segundos para no sobrecargar con cada XP ganado
  
  const member = await prisma.leagueMember.findFirst({
    where: {
      userId: req.user.id,
      league: { weekStart: { lte: new Date() }, weekEnd: { gte: new Date() } }
    },
    include: {
      league: {
        include: {
          members: {
            orderBy: { weeklyXp: 'desc' },
            include: { user: { select: { username: true } } }
          }
        }
      }
    }
  })
  
  // Calcular rank actual del usuario en tiempo real
  const rank = member.league.members.findIndex(m => m.userId === req.user.id) + 1
  const daysLeft = getDaysUntilSunday()
  
  return {
    tier: member.league.tier,
    weeklyXp: member.weeklyXp,
    rank,
    totalMembers: member.league.members.length,
    members: member.league.members.slice(0, 30),
    daysLeft,
    promotionZone: 10,   // top 10 suben
    relegationZone: 25,  // últimos 5 bajan
    userInPromotion: rank <= 10,
    userInRelegation: rank >= 26,
  }
})
```

### Frontend — Pantalla de liga

```typescript
// app/(tabs)/league.tsx
// Layout:
// 1. Header: tu tier actual con icono + días que quedan (ej: "3 días restantes")
// 2. Tu posición destacada: XP semanal + rank + flecha arriba/abajo
// 3. Lista de 30 miembros con rank, username, XP semanal
//    - Línea verde divisora después del puesto 10 (zona de promoción)
//    - Línea roja divisora después del puesto 25 (zona de relegación)
//    - Tu fila siempre visible aunque hagas scroll (sticky o highlight)
// 4. Rewards por terminar en cada zona:
//    Promoción: +300 monedas + badge del tier siguiente
//    Mitad: +100 monedas
//    Relegación: sin recompensa extra

// Actualizar ranking cada 60 segundos con React Query refetchInterval
const { data: league } = useQuery({
  queryKey: ['league', 'me'],
  queryFn: () => api.get('/league/me'),
  refetchInterval: 60_000 // cada minuto
})
```

### Notificaciones push de liga

```typescript
// Enviar en estos momentos:
// 1. Lunes 00:10 UTC: "¡Tu nueva liga empieza! Tienes X competidores esta semana 🦆"
// 2. Miércoles si estás en zona de relegación: "⚠️ Estás en los últimos puestos. ¡Juega hoy!"
// 3. Domingo 18:00 UTC: "Quedan 6 horas. Estás en el puesto X de 30."
// 4. Domingo 23:50 UTC: "¡10 minutos para el cierre de liga!"
```

---

## FEATURE 3 — MAPA DE PROGRESIÓN VISUAL (inspirado en Candy Crush)
**Prioridad: P1. Mejora retención y comprensión del juego.**

### Qué es
Los casos ya no son una lista vertical. Son nodos en un camino que recorre
visualmente toda la mansión. El jugador ve hasta dónde llegó y qué le queda.

### Estructura visual del mapa

```
Planta baja de la mansión (casos 1-8):
  [🔓 CASO 1] ─── [🔓 CASO 2] ─── [🔒 CASO 3]
                              │
                         [🔒 CASO 4] ─── [🔒 CASO 5]

Planta alta (casos 9-16):  (se desbloquea al completar caso 8)
  ...

Formato de cada nodo:
  ✅ Completado: color sólido + estrellas ganadas
  🔓 Disponible: color brillante + animación de pulso
  🔒 Bloqueado: gris + candado + condición visible
```

### Frontend — Componente MapNode

```typescript
// components/map/CaseMapNode.tsx
interface MapNodeProps {
  caseData: Case
  userProgress: CaseProgress | null
  position: { x: number; y: number }
  isUnlocked: boolean
}

export function CaseMapNode({ caseData, userProgress, position, isUnlocked }: MapNodeProps) {
  const isCompleted = userProgress?.status === 'completed'
  const stars = userProgress?.stars ?? 0
  const isAvailable = isUnlocked && !isCompleted
  
  // Animación de pulso solo en el nodo disponible más reciente
  const pulseAnim = useRef(new Animated.Value(1)).current
  useEffect(() => {
    if (isAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 800, useNativeDriver: true }),
        ])
      ).start()
    }
  }, [isAvailable])
  
  return (
    <Animated.View style={[styles.node, { left: position.x, top: position.y },
      isAvailable && { transform: [{ scale: pulseAnim }] }
    ]}>
      <TouchableOpacity
        onPress={() => isUnlocked && router.push(`/case/${caseData.id}`)}
        disabled={!isUnlocked}
      >
        {/* Imagen de la localización como fondo del nodo */}
        <Image source={{ uri: caseData.locationImage }} style={styles.nodeImage} />
        
        {/* Overlay de estado */}
        {!isUnlocked && <View style={styles.lockedOverlay}><Text>🔒</Text></View>}
        {isCompleted && (
          <View style={styles.starsRow}>
            {[1,2,3].map(s => <Text key={s}>{s <= stars ? '⭐' : '☆'}</Text>)}
          </View>
        )}
        
        {/* Número del caso */}
        <View style={styles.caseNumber}>
          <Text style={styles.caseNumberText}>{caseData.order}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
```

### Frontend — Pantalla del mapa completo

```typescript
// app/(tabs)/cases.tsx — reemplazar la lista actual por el mapa
// Usar ScrollView con contentSize calculado para toda la mansión
// Los nodos se posicionan con position: 'absolute' sobre una imagen de fondo del plano

// Datos de posición de cada caso (hardcodeados en constants/mapPositions.ts)
export const MAP_POSITIONS: Record<string, { x: number; y: number; floor: number }> = {
  case_001: { x: 80,  y: 120, floor: 0 },
  case_002: { x: 220, y: 120, floor: 0 },
  case_003: { x: 360, y: 120, floor: 0 },
  case_004: { x: 280, y: 250, floor: 0 },
  // ... todos los casos
}

// Línea de conexión SVG entre nodos consecutivos
// Usar react-native-svg para dibujar el camino
```

---

## FEATURE 4 — MODO MULTIJUGADOR ASÍNCRONO (inspirado en Among Us)
**Prioridad: P2. Implementar después de tener 10K+ usuarios activos.**

### Qué es
Un jugador reta a otro. Ambos resuelven el MISMO tablero por separado
(sin verse). Al terminar ambos, se comparan resultados y se vota al culpable.

### Flujo completo

```
1. Jugador A toca "Retar a un detective" en la pantalla de un caso
2. Se genera un código de sala (6 chars) o se elige un amigo
3. Jugador B recibe notificación push: "¡Te han retado a resolver El robo del Collar Dorado!"
4. Ambos resuelven el mismo tablero de forma independiente (sin verse)
5. Cuando ambos terminan → pantalla de "Duelo completado"
6. Se muestra: tiempo de A vs tiempo de B, errores de A vs B, estrellas
7. Ambos votan: ¿quién crees que es el culpable? (los sospechosos del caso)
8. Resultado: ganador por tiempo + bonus si aciertan el culpable
9. El ganador recibe monedas. El perdedor recibe consolación.
```

### Backend — Tablas

```prisma
model Duel {
  id          String   @id @default(cuid())
  caseId      String
  challengerId String
  challengedId String
  roomCode    String   @unique // ej: "QK7X2P"
  status      String   // "pending" | "in_progress" | "completed"
  
  challengerResult DuelResult? @relation("challenger")
  challengedResult DuelResult? @relation("challenged")
  
  winnerId    String?
  createdAt   DateTime @default(now())
  expiresAt   DateTime // 24h para aceptar el reto
}

model DuelResult {
  id          String   @id @default(cuid())
  duelId      String
  userId      String
  timeSeconds Int
  errors      Int
  stars       Int
  culpritVote String   // duck_id votado como culpable
  isCorrect   Boolean  // si acertó el culpable
  completedAt DateTime @default(now())
}
```

### Backend — Endpoints

```typescript
// POST /duels/challenge
// Crea el duelo y notifica al rival
fastify.post('/duels/challenge', { preHandler: [authenticate] }, async (req, reply) => {
  const { caseId, challengedUserId } = req.body
  const roomCode = generateRoomCode() // "QK7X2P"
  
  const duel = await prisma.duel.create({
    data: {
      caseId, challengerId: req.user.id,
      challengedId: challengedUserId,
      roomCode, status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  })
  
  // Push notification al retado
  await sendPushNotification(challengedUserId, {
    title: '🦆 ¡Nuevo duelo!',
    body: `${req.user.username} te reta a resolver "${caseName}". ¿Aceptas?`,
    data: { type: 'duel_challenge', roomCode, duelId: duel.id }
  })
  
  return { roomCode, duelId: duel.id }
})

// POST /duels/:roomCode/complete — guardar resultado del jugador
// GET  /duels/:roomCode/status  — ver si el rival ya terminó
// POST /duels/:roomCode/vote    — votar culpable
```

### Cálculo de recompensas del duelo

```typescript
function calculateDuelRewards(challengerResult, challengedResult) {
  // Ganador: menos tiempo + menos errores (weighted)
  const challengerScore = challengerResult.stars * 1000 - challengerResult.timeSeconds
  const challengedScore  = challengedResult.stars  * 1000 - challengedResult.timeSeconds
  
  const winnerId = challengerScore >= challengedScore
    ? challengerResult.userId
    : challengedResult.userId
  
  return {
    winner: { coins: 100, xp: 50 },
    loser:  { coins: 25,  xp: 20 },  // siempre algo para no frustrar
    bonusCulprit: { coins: 30, xp: 15 } // si acertaron el culpable
  }
}
```

---

## FEATURE 5 — RAID DE CASOS (inspirado en Hole.io 2025)
**Prioridad: P2. Feature social barata de implementar.**

### Qué es
Puedes "atacar" el caso completado de otro jugador.
Si lo resuelves más rápido que su tiempo registrado, le robas monedas.
Mecánica de engagement sin cambiar nada del core del puzzle.

### Flujo

```
1. En la pantalla de perfil de otro jugador ves sus casos completados
2. Botón "Atacar" en cualquier caso que el rival haya completado
3. Resuelves el mismo tablero contra reloj (vs su tiempo)
4. Si terminas en MENOS tiempo → robas 20 monedas al rival
5. Si terminas en MÁS tiempo → pierdes 10 monedas (arriesgaste y fallaste)
6. El rival recibe notificación: "¡[username] atacó tu caso X!"
7. Puede contraatacar inmediatamente
```

### Backend — Tablas

```prisma
model Raid {
  id          String   @id @default(cuid())
  attackerId  String
  defenderId  String
  caseId      String
  targetTime  Int      // tiempo a batir del defensor en segundos
  attackerTime Int?    // tiempo conseguido por el atacante
  result      String?  // "win" | "loss"
  coinsStolen Int      @default(0)
  createdAt   DateTime @default(now())
}
```

### Reglas de equilibrio importantes

```typescript
// CRÍTICO para evitar abuso:
const RAID_RULES = {
  maxRaidsPerDay: 5,           // máx 5 raids como atacante por día
  maxRaidsDefendedPerDay: 3,   // tu caso solo puede ser atacado 3 veces/día
  minCoinsToRaid: 50,          // necesitas 50 monedas para atacar (skin in the game)
  coinsStolen: 20,             // siempre fijo, no escala
  coinsLostOnFail: 10,
  cooldownAfterRaid: 3600,     // 1h de cooldown entre raids al mismo usuario
}
```

### Frontend — Integración en perfil

```typescript
// En app/profile/[userId].tsx — añadir sección "Casos completados"
// Cada caso muestra: nombre, tiempo del dueño, botón "Atacar ⚔️"
// Al tocar "Atacar" → modal de confirmación con las reglas → lanza el tablero
// Al terminar → resultado animado "¡Robaste 20 monedas!" o "¡Perdiste 10 monedas!"
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

```
Sprint 1 (semana 1-2):   Feature 1 — Caso Diario Global
  → backend DailyCase + endpoint + seed determinístico
  → frontend pantalla daily + countdown + share card
  → push notification diario a las 8am

Sprint 2 (semana 3-4):   Feature 2 — Liga Semanal
  → backend tablas League + cron job lunes
  → endpoint /league/me con ranking en tiempo real
  → frontend pantalla liga con lista de 30 + colores de zona
  → notificaciones de liga (miércoles + domingo)

Sprint 3 (semana 5-6):   Feature 3 — Mapa de Progresión
  → reemplazar lista de casos por mapa SVG/Animated
  → MAP_POSITIONS para los 24 casos de lanzamiento
  → animación de pulso en nodo disponible
  → líneas de conexión entre nodos

Sprint 4 (semana 7-9):   Feature 4 — Duelos (requiere 10K+ usuarios)
  → sistema de salas + notificaciones push de reto
  → pantalla de resultado comparado
  → votación de culpable + recompensas

Sprint 5 (semana 10-11): Feature 5 — Raids
  → tabla Raid + reglas de equilibrio
  → sección raids en perfil de otros usuarios
  → animaciones de robo/pérdida de monedas
```

---

## VARIABLES DE ENTORNO NUEVAS NECESARIAS

```bash
# .env (añadir a las variables ya existentes del GDD)

# BullMQ (jobs) — ya debería existir
REDIS_URL=redis://...

# Para el caso diario — zona horaria de reset
DAILY_RESET_HOUR=0        # hora UTC del reset (0 = medianoche UTC)
DAILY_RESET_TIMEZONE=UTC

# Liga semanal
LEAGUE_RESET_DAY=1        # 1 = lunes
LEAGUE_GROUP_SIZE=30
LEAGUE_PROMOTION_SPOTS=10
LEAGUE_RELEGATION_SPOTS=5

# Raids
RAID_MAX_PER_DAY=5
RAID_COINS_WIN=20
RAID_COINS_LOSE=10
```

---

## TESTS MÍNIMOS REQUERIDOS ANTES DE DEPLOY

```typescript
// Feature 1 — Caso Diario
test('mismo seed produce mismo tablero en 2 usuarios distintos')
test('el seed cambia cada día a medianoche UTC')
test('un usuario no puede completar el mismo caso diario dos veces')
test('shareGrid genera emojis correctos según el historial de movimientos')

// Feature 2 — Liga
test('usuario nuevo se asigna a Bronze')
test('top 10 de la semana sube de tier')
test('últimos 5 bajan de tier')
test('weeklyXp se resetea a 0 cada lunes')
test('usuarios inactivos >14 días no se asignan a liga (evitar grupos fantasma)')

// Feature 4 — Duelos
test('roomCode es único')
test('duelo expira en 24h si el rival no acepta')
test('no se puede ver el tiempo del rival hasta que ambos terminen')

// Feature 5 — Raids
test('no puedes hacer más de 5 raids como atacante en un día')
test('si ganas el raid, las monedas se transfieren atómicamente (transaction)')
test('cooldown de 1h entre raids al mismo usuario')
```

---

## NOTAS CRÍTICAS PARA CLAUDE CODE

1. **El seed del caso diario es sagrado.** La función `generateDailySeed` debe
   producir el mismo número para la misma fecha en cualquier instancia del servidor.
   NO usar `Date.now()` ni nada no determinístico.

2. **La liga NO debe crear grupos con usuarios inactivos.** Un grupo de 30 personas
   donde 20 no juegan mata la motivación. Filtrar siempre por `activeLastDays: 14`.

3. **Los raids son transacciones atómicas.** Usar `prisma.$transaction` para
   transferir monedas entre usuarios. Nunca dos operaciones separadas.

4. **El share card de Wordle es el único mecanismo de UA orgánico real.**
   El texto compartido debe funcionar perfectamente sin la app instalada
   (incluye link directo al caso para deep link).

5. **Todas las notificaciones push son opcionales para el usuario.**
   En onboarding preguntar qué notificaciones quiere activar.
   Guardar preferencias en `User.notificationPreferences JSON`.
```
