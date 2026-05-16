import test from 'node:test';
import assert from 'node:assert/strict';

import { generatePuzzle, type PuzzleDifficulty } from '../puzzleGenerator.ts';
import { puzzleToBoardData } from '../puzzleToBoardData.ts';
import { validateBoardDefinition } from '../boardValidator.ts';

// Replica makeGeneratedCase: cada caso generado debe producir un BoardData
// valido segun el validator. Verifica los 20 casos generados de un disparo.

const CATALOGUE_DUCK_POOL = [
  'duck_tophat', 'duck_plum', 'duck_chef', 'duck_detective', 'duck_butler', 'duck_cowboy',
  'duck_witch', 'duck_pirate', 'duck_king', 'duck_ninja', 'duck_robot', 'duck_witch2',
];

interface Spec {
  case_id: string;
  seed: string;
  difficulty: PuzzleDifficulty;
  duckOffset: number;
  roomNames: string[];
}

const SPECS: Spec[] = [
  { case_id: 'case_002', seed: 'quackdoku-case-002', difficulty: 'easy',   duckOffset: 1,  roomNames: ['Despensa','Horno','Fregadero','Bodega','Mesón','Trastienda'] },
  { case_id: 'case_003', seed: 'quackdoku-case-003', difficulty: 'medium', duckOffset: 3,  roomNames: ['Archivo','Lectura','Mapas','Reservados','Pasillo','Catálogo'] },
  { case_id: 'case_004', seed: 'quackdoku-case-004', difficulty: 'medium', duckOffset: 5,  roomNames: ['Setos','Fuente','Invernadero','Rosaleda','Estanque','Pérgola'] },
  { case_id: 'case_005', seed: 'quackdoku-case-005', difficulty: 'hard',   duckOffset: 7,  roomNames: ['Ala Norte','Ala Sur','Centro','Galería','Rincón','Vestíbulo'] },
  { case_id: 'case_007', seed: 'quackdoku-case-007', difficulty: 'easy',   duckOffset: 2,  roomNames: ['Carbonera','Bodega','Caldera','Trastero','Túnel','Escalera'] },
  { case_id: 'case_008', seed: 'quackdoku-case-008', difficulty: 'easy',   duckOffset: 4,  roomNames: ['Norte','Sur','Este','Oeste','Centro','Vitrina'] },
  { case_id: 'case_009', seed: 'quackdoku-case-009', difficulty: 'easy',   duckOffset: 6,  roomNames: ['Escritorio','Pizarra','Librería','Archivo','Sillón','Ventanal'] },
  { case_id: 'case_010', seed: 'quackdoku-case-010', difficulty: 'easy',   duckOffset: 0,  roomNames: ['Vitrina A','Vitrina B','Pedestal','Pared Este','Pared Oeste','Mesa'] },
  { case_id: 'case_011', seed: 'quackdoku-case-011', difficulty: 'easy',   duckOffset: 8,  roomNames: ['Entrada','Curva','Recodo','Bóveda','Tramo Largo','Salida'] },
  { case_id: 'case_012', seed: 'quackdoku-case-012', difficulty: 'medium', duckOffset: 1,  roomNames: ['Cúpula','Lente','Cartas','Plataforma','Diario','Escalera'] },
  { case_id: 'case_013', seed: 'quackdoku-case-013', difficulty: 'medium', duckOffset: 3,  roomNames: ['Cava Norte','Cava Sur','Barriles','Catador','Ático Vino','Pasillo Frío'] },
  { case_id: 'case_014', seed: 'quackdoku-case-014', difficulty: 'medium', duckOffset: 5,  roomNames: ['Piano','Cuerdas','Viento','Coro','Atril','Foso'] },
  { case_id: 'case_015', seed: 'quackdoku-case-015', difficulty: 'medium', duckOffset: 7,  roomNames: ['Mesa Alta','Tetera','Bandeja','Cocina Té','Ventana','Diván'] },
  { case_id: 'case_016', seed: 'quackdoku-case-016', difficulty: 'medium', duckOffset: 9,  roomNames: ['Espadas','Lanzas','Armaduras','Escudos','Arquería','Trofeo'] },
  { case_id: 'case_017', seed: 'quackdoku-case-017', difficulty: 'medium', duckOffset: 11, roomNames: ['Baúles','Maniquíes','Ventanuco','Vigas','Cofre','Escalera Ático'] },
  { case_id: 'case_018', seed: 'quackdoku-case-018', difficulty: 'hard',   duckOffset: 2,  roomNames: ['Nave','Altar','Sarcófago','Cripta Honda','Antesala','Escalinata'] },
  { case_id: 'case_019', seed: 'quackdoku-case-019', difficulty: 'hard',   duckOffset: 4,  roomNames: ['Bufete','Archivo Legal','Caja Fuerte','Antesala','Pasillo','Despacho 2'] },
  { case_id: 'case_020', seed: 'quackdoku-case-020', difficulty: 'hard',   duckOffset: 6,  roomNames: ['Palmeras','Orquídeas','Helechos','Cactus','Estanque Cálido','Vivero'] },
  { case_id: 'case_021', seed: 'quackdoku-case-021', difficulty: 'hard',   duckOffset: 8,  roomNames: ['Esfera','Péndulo','Engranajes','Campana','Mirador','Hueco Reloj'] },
];

function buildBoardForSpec(spec: Spec) {
  const duckIds = Array.from(
    { length: 6 },
    (_, i) => CATALOGUE_DUCK_POOL[(spec.duckOffset + i) % CATALOGUE_DUCK_POOL.length],
  );
  const puzzle = generatePuzzle(spec.seed, {
    size: 6,
    playMode: 'latin',
    difficulty: spec.difficulty,
    duckIds,
    roomNames: spec.roomNames,
  });
  return puzzleToBoardData(puzzle, { boardId: `${spec.case_id}_board`, decorations: 3 });
}

test('every generated catalogue case builds a valid board', () => {
  for (const spec of SPECS) {
    const board = buildBoardForSpec(spec);
    const result = validateBoardDefinition(board);
    assert.equal(
      result.isValid,
      true,
      `${spec.case_id} invalid: ${JSON.stringify(result.issues ?? [])}`,
    );
  }
});

test('generated boards are deterministic per seed', () => {
  for (const spec of SPECS) {
    const a = buildBoardForSpec(spec);
    const b = buildBoardForSpec(spec);
    assert.deepEqual(a.solution, b.solution, `${spec.case_id} solution drifted`);
    assert.deepEqual(a.initial_values, b.initial_values, `${spec.case_id} givens drifted`);
  }
});

test('every generated case picks 6 unique ducks', () => {
  for (const spec of SPECS) {
    const duckIds = Array.from(
      { length: 6 },
      (_, i) => CATALOGUE_DUCK_POOL[(spec.duckOffset + i) % CATALOGUE_DUCK_POOL.length],
    );
    assert.equal(new Set(duckIds).size, 6, `${spec.case_id} duplicate ducks`);
  }
});
