import { SkillType } from './types';

// FINAL FIX: All dependencies are removed. The logic is now self-contained in this file.

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
 * This function is now case-insensitive, handles various abbreviations, and has NO EXTERNAL DEPENDENCIES.
 * @param position The player's position string.
 * @returns An array of SkillType relevant to that position.
 */
export const getSkillsForPosition = (position: string): SkillType[] => {
    if (!position) {
        return [];
    }

    const processedPosition = position.trim().toLowerCase();
    const category = POSITION_CATEGORY_MAP[processedPosition];

    if (category) {
        return POSITION_SKILLS[category] || [];
    }

    // If no specific category is found, return a default set of basic skills 
    // instead of an empty array, to ensure the UI never feels broken.
    return ['dribbling', 'passing', 'tackling', 'pace', 'stamina'];
};


// --- RATING AND TIER COLOR UTILS ---

// Defines the color classes for different rating thresholds.
// from-slate-400 (Gewöhnlich) -> to-emerald-400 (Selten) -> to-blue-400 (Episch) -> to-purple-400 (Mythisch) -> to-amber-400 (Legendär)
const RATING_COLORS = [
    { threshold: 500, colorClass: 'text-amber-400' },
    { threshold: 350, colorClass: 'text-purple-400' },
    { threshold: 200, colorClass: 'text-blue-400' },
    { threshold: 100, colorClass: 'text-emerald-400' },
    { threshold: 0, colorClass: 'text-slate-400' },
];

/**
 * Gets the Tailwind CSS color class based on a numerical rating.
 * @param value The rating value (e.g., overall, skill).
 * @returns A string with the Tailwind color class.
 */
export const getRatingColor = (value: number): string => {
    const matchedColor = RATING_COLORS.find(c => value >= c.threshold);
    return matchedColor ? matchedColor.colorClass : 'text-slate-400';
};


// Defines the full tier information, including gradient colors and labels.
const TIERS = [
      { l: 'Amateur', c: 'from-emerald-600 to-emerald-400' }, { l: 'Profi', c: 'from-blue-600 to-blue-400' },
      { l: 'Elite', c: 'from-purple-600 to-purple-400' }, { l: 'Weltklasse', c: 'from-cyan-600 to-cyan-400' },
      { l: 'Star', c: 'from-orange-600 to-orange-400' }, { l: 'Superstar', c: 'from-pink-600 to-pink-400' },
      { l: 'Titan', c: 'from-indigo-600 to-indigo-400' }, { l: 'Phänomen', c: 'from-rose-600 to-rose-400' },
      { l: 'Legende', c: 'from-amber-600 to-amber-400' }, { l: 'Ikone', c: 'from-red-600 to-red-400' },
      { l: 'Gottgleich', c: 'from-slate-400 to-slate-100' }, { l: 'Kosmisch', c: 'from-indigo-600 via-purple-600 to-pink-500' }
];

/**
 * Calculates tier information based on a skill value.
 * @param value The numerical value of the skill.
 * @returns An object with tier level, progress, color class, label, and points to next tier.
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