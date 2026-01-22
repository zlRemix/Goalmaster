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
