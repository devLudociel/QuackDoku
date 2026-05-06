import type { ImageSourcePropType } from 'react-native';

export type DuckRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockMethod = 'default' | 'level' | 'event' | 'purchase' | 'gacha';

const duckTophatAsset = require('../assets/duck_tophat.png') as ImageSourcePropType;
const duckPlumAsset = require('../assets/duck_plum.png') as ImageSourcePropType;

export interface Duck {
  duck_id: string;
  name: string;
  rarity: DuckRarity;
  hat_type: string;
  hat_color: string;
  body_color: string;
  unlock_method: UnlockMethod;
  unlock_level: number | null;
  lore: string;
  emoji: string;
  asset?: ImageSourcePropType;
}

export const DUCKS: Duck[] = [
  {
    duck_id: 'duck_tophat',
    name: 'Lord Quackson',
    rarity: 'common',
    hat_type: 'top_hat',
    hat_color: '#1A1A1A',
    body_color: '#F5DEB3',
    unlock_method: 'default',
    unlock_level: null,
    lore: 'El aristócrata más sospechoso de Quackwell Manor...',
    emoji: '🎩',
    asset: duckTophatAsset,
  },
  {
    duck_id: 'duck_plum',
    name: 'Dama Plumetta',
    rarity: 'rare',
    hat_type: 'pamela',
    hat_color: '#800080',
    body_color: '#DDA0DD',
    unlock_method: 'default',
    unlock_level: null,
    lore: 'Elegante y misteriosa, siempre tiene una coartada perfecta.',
    emoji: '👒',
    asset: duckPlumAsset,
  },
  {
    duck_id: 'duck_chef',
    name: 'Chef Gustó',
    rarity: 'common',
    hat_type: 'chef_hat',
    hat_color: '#FFFFFF',
    body_color: '#FFFAF0',
    unlock_method: 'default',
    unlock_level: null,
    lore: 'Cocinero de renombre, pero sus deudas de juego son peligrosas.',
    emoji: '👨‍🍳',
  },
  {
    duck_id: 'duck_detective',
    name: 'Detective Waddles',
    rarity: 'rare',
    hat_type: 'deerstalker',
    hat_color: '#8B6914',
    body_color: '#D2B48C',
    unlock_method: 'level',
    unlock_level: 3,
    lore: 'El mejor detective de Quackwell. O eso dice él.',
    emoji: '🔍',
  },
  {
    duck_id: 'duck_butler',
    name: 'Sr. Billington',
    rarity: 'rare',
    hat_type: 'monocle',
    hat_color: '#1A1A1A',
    body_color: '#2F2F2F',
    unlock_method: 'level',
    unlock_level: 5,
    lore: 'El mayordomo sabe todos los secretos de la mansión.',
    emoji: '🧐',
  },
  {
    duck_id: 'duck_witch',
    name: 'Madame Quackley',
    rarity: 'epic',
    hat_type: 'witch_hat',
    hat_color: '#4B0082',
    body_color: '#9370DB',
    unlock_method: 'level',
    unlock_level: 10,
    lore: 'Sus pociones son legendarias... y sus maldiciones también.',
    emoji: '🧙‍♀️',
  },
  {
    duck_id: 'duck_pirate',
    name: 'Capitán Quack',
    rarity: 'epic',
    hat_type: 'pirate_hat',
    hat_color: '#000000',
    body_color: '#8B4513',
    unlock_method: 'level',
    unlock_level: 15,
    lore: 'Surcó los mares de Quacklandia antes de retirarse al crimen.',
    emoji: '🏴‍☠️',
  },
  {
    duck_id: 'duck_king',
    name: 'Rey Patoleon',
    rarity: 'epic',
    hat_type: 'crown',
    hat_color: '#FFD700',
    body_color: '#FFEAA7',
    unlock_method: 'level',
    unlock_level: 20,
    lore: 'Monarca de los patos. Absolutamente nadie le cuestiona.',
    emoji: '👑',
  },
  {
    duck_id: 'duck_ninja',
    name: 'Shinobi Plum',
    rarity: 'legendary',
    hat_type: 'hood',
    hat_color: '#111111',
    body_color: '#2D2D2D',
    unlock_method: 'event',
    unlock_level: null,
    lore: 'Nadie sabe su nombre real. Aparece y desaparece sin dejar rastro.',
    emoji: '🥷',
  },
  {
    duck_id: 'duck_robot',
    name: 'Quack-3000',
    rarity: 'legendary',
    hat_type: 'antenna',
    hat_color: '#C0C0C0',
    body_color: '#808080',
    unlock_method: 'purchase',
    unlock_level: null,
    lore: 'Inteligencia artificial. Dice que no tiene emociones. Miente.',
    emoji: '🤖',
  },
  {
    duck_id: 'duck_cowboy',
    name: 'Sheriff Plumas',
    rarity: 'common',
    hat_type: 'cowboy_hat',
    hat_color: '#8B6914',
    body_color: '#DEB887',
    unlock_method: 'level',
    unlock_level: 2,
    lore: 'La ley del Lejano Quackeste. Siempre atrapa a su pato.',
    emoji: '🤠',
  },
  {
    duck_id: 'duck_witch2',
    name: 'Brujo Quacko',
    rarity: 'rare',
    hat_type: 'wizard_cape',
    hat_color: '#00008B',
    body_color: '#4169E1',
    unlock_method: 'level',
    unlock_level: 8,
    lore: 'Estudió magia en la Academia de Patos Arcanos.',
    emoji: '🧙',
  },
];

export const DUCK_MAP: Record<string, Duck> = Object.fromEntries(
  DUCKS.map((d) => [d.duck_id, d])
);

export const DEFAULT_DUCKS = DUCKS.filter((d) => d.unlock_method === 'default').map(
  (d) => d.duck_id
);
