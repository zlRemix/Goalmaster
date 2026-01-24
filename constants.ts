import { InfrastructureType, PlayerPosition, SkillType, UserRole } from "./types";

export const MAX_CLUB_PLAYERS = 25;
export const XP_PER_SKILL_UPGRADE = 10; // XP gained for each skill point spent

export const POSITIONS: PlayerPosition[] = ['Torwart', 'Abwehr', 'Mittelfeld', 'Stürmer'];

// prettier-ignore
export const getSkillsForPosition = (position: string): SkillType[] => {
    switch (position) {
        case 'TW': return ['handling', 'reflexes', 'diving', 'positioning', 'communication', 'kicking', 'strength'];
        case 'IV': return ['tackling', 'marking', 'interceptions', 'heading', 'strength', 'aggression', 'stamina', 'passing'];
        case 'AV': return ['tackling', 'pace', 'dribbling', 'passing', 'stamina', 'interceptions', 'vision'];
        case 'DM': return ['tackling', 'interceptions', 'passing', 'vision', 'stamina', 'strength', 'long_shots'];
        case 'ZM': return ['passing', 'vision', 'dribbling', 'tackling', 'stamina', 'long_shots', 'finishing', 'pace'];
        case 'OM': return ['dribbling', 'passing', 'vision', 'finishing', 'long_shots', 'pace', 'shot_power'];
        case 'ST': return ['finishing', 'shot_power', 'heading', 'long_shots', 'dribbling', 'pace', 'strength'];
        default: return [];
    }
};

export const ACTIVITIES = [
  { id: 'light_training', name: 'Leichtes Training', type: 'training', description: 'Eine lockere Einheit, um in Form zu bleiben und Routine aufzubauen.', durationSeconds: 60 * 5, reward: { tp: 1, xp: 5 } },
  { id: 'gym_session', name: 'Kraftraum', type: 'training', description: 'Fokus auf Kraft und Kondition, um die physische Präsenz zu stärken.', durationSeconds: 60 * 10, reward: { tp: 2, xp: 10 } },
  { id: 'skill_drill', name: 'Technik-Drill', type: 'training', description: 'Intensive Übungen zur Verbesserung spezifischer technischer Fähigkeiten.', durationSeconds: 60 * 15, reward: { tp: 3, xp: 15 } },
  { id: 'tactic_meeting', name: 'Taktik-Besprechung', type: 'tactic', description: 'Analyse von Gegnern und Entwicklung von Spielstrategien mit dem Team.', durationSeconds: 60 * 8, reward: { tp: 1, xp: 8 } },
  { id: 'video_analysis', name: 'Video-Analyse', type: 'tactic', description: 'Eigenständige Analyse von Spielszenen zur Verbesserung des taktischen Verständnisses.', durationSeconds: 60 * 12, reward: { tp: 2, xp: 12 } },
  { id: 'press_conference', name: 'Pressekonferenz', type: 'pr', description: 'Stelle dich den Fragen der Journalisten und stärke dein Markenimage.', durationSeconds: 60 * 7, reward: { xp: 15, budgetGain: 5000 }, requiredRole: UserRole.MANAGER },
  { id: 'fan_meetup', name: 'Fan-Treffen', type: 'pr', description: 'Interagiere mit den Fans, um die Vereinsbindung zu stärken.', durationSeconds: 60 * 20, reward: { xp: 25, budgetGain: 10000 }, requiredRole: UserRole.MANAGER },
  { id: 'yoga_session', name: 'Yoga-Einheit', type: 'fitness', description: 'Verbessere deine Flexibilität und mentale Stärke.', durationSeconds: 60 * 10, reward: { tp: 1, xp: 5 } },
  { id: 'team_dinner', name: 'Team-Abendessen', type: 'social', description: 'Stärke den Teamgeist bei einem gemeinsamen Abendessen.', durationSeconds: 60 * 25, reward: { xp: 20 } },
];

export const INFRA_UPGRADE_COSTS = [10000, 25000, 50000, 100000, 200000, 400000, 800000, 1500000, 3000000, 5000000];
export const INFRA_UPGRADE_TIMES = [30, 60, 120, 240, 480, 960, 1920, 3840, 7680, 15360]; // in seconds

export const INFRA_LEVEL_BENEFITS: Record<InfrastructureType, string[]> = {
    [InfrastructureType.STADIUM]: [
        "+1% Ticketeinnahmen", "+2% Ticketeinnahmen", "+3% Ticketeinnahmen", "+4% Ticketeinnahmen", "+5% Ticketeinnahmen", 
        "+6% Ticketeinnahmen", "+7% Ticketeinnahmen", "+8% Ticketeinnahmen", "+9% Ticketeinnahmen", "+10% Ticketeinnahmen"
    ],
    [InfrastructureType.TRAINING_GROUND]: [
        "+2% TP-Gewinn", "+4% TP-Gewinn", "+6% TP-Gewinn", "+8% TP-Gewinn", "+10% TP-Gewinn", 
        "+12% TP-Gewinn", "+14% TP-Gewinn", "+16% TP-Gewinn", "+18% TP-Gewinn", "+20% TP-Gewinn"
    ],
    [InfrastructureType.YOUTH_ACADEMY]: [
        "Scoutet alle 3 Tage", "Scoutet alle 2.5 Tage", "Scoutet alle 2 Tage", "Scoutet alle 1.5 Tage", "Scoutet alle 24h", 
        "Bessere Talentqualität (Low)", "Bessere Talentqualität (Mid)", "Bessere Talentqualität (High)", "Scoutet alle 12h", "Maximale Talentqualität"
    ],
    [InfrastructureType.SCOUTING_NETWORK]: [
        "Genauigkeit +5%", "Genauigkeit +10%", "Genauigkeit +15%", "Genauigkeit +20%", "Genauigkeit +25%", 
        "Aufdecken von Potenzial (Low)", "Aufdecken von Potenzial (Mid)", "Aufdecken von Potenzial (High)", "Aufdecken von allen Attributen", "Maximale Genauigkeit & Potenzial"
    ],
};

export const TEAM_TRAININGS = [
    { id: 'match_prep', name: 'Spielvorbereitung', description: 'Intensive taktische Vorbereitung auf den nächsten Gegner.', durationSeconds: 60 * 30, reward: { xp: 50, tp: 5 } },
    { id: 'endurance_camp', name: 'Ausdauer-Camp', description: 'Ein hartes Camp zur Steigerung der Grundlagenausdauer des gesamten Teams.', durationSeconds: 60 * 60 * 2, reward: { xp: 100, tp: 10 } },
    { id: 'finishing_drills', name: 'Abschluss-Drills', description: 'Fokus auf Torschuss- und Abschlusstechniken für alle Offensivspieler.', durationSeconds: 60 * 45, reward: { xp: 75, tp: 8 } },
];
