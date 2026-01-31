import { Rarity, SkillType } from './types';

// Directly defining the skills here to prevent any import/export or module resolution issues.
const POSITION_SKILLS: Record<string, SkillType[]> = {
  'Stürmer': ['finishing', 'shot_power', 'heading', 'long_shots', 'dribbling', 'pace'],
  'Mittelfeld': ['passing', 'dribbling', 'vision', 'tackling', 'stamina', 'long_shots'],
  'Abwehr': ['tackling', 'marking', 'interceptions', 'strength', 'heading', 'aggression'],
  'Torwart': ['handling', 'reflexes', 'diving', 'positioning', 'communication', 'kicking'],
};

// Maps various possible position inputs (lowercase) to a standardized category.
const POSITION_CATEGORY_MAP: { [key: string]: keyof typeof POSITION_SKILLS } = {
    // German
    'stürmer': 'Stürmer', 'st': 'Stürmer',
    'mittelfeld': 'Mittelfeld', 'mf': 'Mittelfeld',
    'verteidiger': 'Abwehr', 'abwehr': 'Abwehr', 'def': 'Abwehr',
    'torwart': 'Torwart', 'tw': 'Torwart',
    // English
    'striker': 'Stürmer', 'forward': 'Stürmer',
    'midfielder': 'Mittelfeld', 'mid': 'Mittelfeld',
    'defender': 'Abwehr',
    'goalkeeper': 'Torwart', 'gk': 'Torwart',
    // Specific roles
    'lm': 'Mittelfeld', 'rm': 'Mittelfeld', 'cam': 'Mittelfeld', 'cdm': 'Mittelfeld',
    'lw': 'Stürmer', 'rw': 'Stürmer', 'cf': 'Stürmer',
    'lb': 'Abwehr', 'rb': 'Abwehr', 'cb': 'Abwehr',
};

/**
 * Gets the relevant skills for a given player position.
 */
export const getSkillsForPosition = (position: string): SkillType[] => {
    if (!position) return [];
    const processedPosition = position.trim().toLowerCase();
    const category = POSITION_CATEGORY_MAP[processedPosition];
    if (category) return POSITION_SKILLS[category] || [];
    return ['dribbling', 'passing', 'tackling', 'pace', 'stamina'];
};


// --- RATING AND TIER COLOR UTILS ---

export const getRarityColorClass = (rarity: Rarity): string => {
    switch (rarity) {
        case 'RARE': return 'text-green-400';
        case 'EPIC': return 'text-purple-500';
        case 'LEGENDARY': return 'text-yellow-400';
        default: return 'text-gray-400';
    }
};

export const getRarityHexColor = (rarity: Rarity): string => {
    switch (rarity) {
        case 'RARE': return '#4ADE80'; // green-400
        case 'EPIC': return '#A855F7'; // purple-500
        case 'LEGENDARY': return '#FACC15'; // yellow-400
        default: return '#9CA3AF'; // gray-400
    }
};

const RATING_COLORS = [
    { threshold: 500, colorClass: 'text-yellow-400' },
    { threshold: 350, colorClass: 'text-pink-500' },
    { threshold: 200, colorClass: 'text-purple-500' },
    { threshold: 100, colorClass: 'text-blue-500' },
    { threshold: 0, colorClass: 'text-gray-400' },
];

/**
 * Gets the Tailwind CSS color class based on a numerical rating.
 */
export const getSkillRatingColor = (value: number): string => {
    const matchedColor = RATING_COLORS.find(c => value >= c.threshold);
    return matchedColor ? matchedColor.colorClass : 'text-gray-400';
};

export const getRatingColor = getSkillRatingColor;


const TIERS = [
    { l: 'Amateur', c: 'from-gray-500 to-gray-400' },
    { l: 'Profi', c: 'from-green-500 to-teal-400' },
    { l: 'Elite', c: 'from-blue-500 to-cyan-400' },
    { l: 'Weltklasse', c: 'from-indigo-500 to-purple-400' },
    { l: 'Star', c: 'from-purple-500 to-pink-500' },
    { l: 'Superstar', c: 'from-pink-500 to-rose-500' },
    { l: 'Titan', c: 'from-red-500 to-orange-500' },
    { l: 'Phänomen', c: 'from-orange-500 to-yellow-400' },
    { l: 'Legende', c: 'from-yellow-400 to-lime-400' },
    { l: 'Ikone', c: 'from-lime-400 to-emerald-400' },
    { l: 'Gottgleich', c: 'from-white to-gray-300' },
];

/**
 * Calculates tier information based on a skill value.
 */
export const getTierInfo = (value: number) => {
    const tier = Math.floor(value / 100);
    const progress = (value % 100);
    const current = TIERS[Math.min(tier, TIERS.length - 1)];
    return {
        tier,
        progress,
        colorClass: current.c,
        tierLabel: current.l,
        pointsToNext: 100 - (value % 100)
    };
};
