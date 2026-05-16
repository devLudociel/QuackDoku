export interface DailyCaseSnapshot {
  date: string;
  dayNumber: number;
  caseId: string;
  title: string;
  location: string;
  boardSeed: number;
}

const DAILY_LAUNCH_DATE = '2026-03-22';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DAILY_FLAVORS = [
  { title: 'Sudoku de la Mansion', location: 'Quackwell Manor' },
  { title: 'El Enigma del Salon', location: 'Salon Dorado' },
  { title: 'Cuadricula del Jardin', location: 'Jardin Quackwell' },
  { title: 'Misterio de la Biblioteca', location: 'Biblioteca Vieja' },
  { title: 'El Patron del Comedor', location: 'Comedor Real' },
  { title: 'Logica del Recibidor', location: 'Recibidor Quackwell' },
  { title: 'El Reto del Estudio', location: 'Estudio del Conde' },
];

function parseUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export function getUtcDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function generateDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i += 1) {
    const char = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash &= hash;
  }
  return Math.abs(hash);
}

export function getDailyDayNumber(dateStr: string): number {
  const current = parseUtcDate(dateStr).getTime();
  const launch = parseUtcDate(DAILY_LAUNCH_DATE).getTime();
  return Math.max(1, Math.floor((current - launch) / MS_PER_DAY) + 1);
}

export function getDailyCaseSnapshot(date = getUtcDateKey()): DailyCaseSnapshot {
  const dayNumber = getDailyDayNumber(date);
  const flavor = DAILY_FLAVORS[(dayNumber - 1) % DAILY_FLAVORS.length];
  return {
    date,
    dayNumber,
    caseId: `daily_${date}`,
    title: flavor.title,
    location: flavor.location,
    boardSeed: generateDailySeed(date),
  };
}
