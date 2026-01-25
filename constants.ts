import { Activity, TeamTrainingSession, UserRole, InfrastructureType, PlayerPosition, Tactic } from './types.js';

export const MAX_CLUB_PLAYERS = 5;
export const XP_PER_SKILL_UPGRADE = 10;

export const POSITIONS: PlayerPosition[] = ['Stürmer', 'Mittelfeld', 'Abwehr', 'Torwart'];

export const INFRA_UPGRADE_COSTS = [50000, 75000, 100000, 150000, 250000, 400000, 600000, 850000, 1200000, 2000000];
export const INFRA_UPGRADE_TIMES = [3600, 7200, 14400, 28800, 57600, 86400, 172800, 345600, 604800, 1209600]; // in seconds

export const INFRA_LEVEL_BENEFITS: Record<InfrastructureType, string[]> = {
    [InfrastructureType.STADIUM]: [...Array(10)].map((_, i) => `+${(i + 1) * 5}% Ticketeinnahmen`),
    [InfrastructureType.TRAINING_GROUND]: [...Array(10)].map((_, i) => `+${(i + 1) * 2}% TP-Gewinn`),
    [InfrastructureType.MEDICAL_CENTER]: [...Array(10)].map((_, i) => `-${(i + 1) * 3}% Aktivitätsdauer`),
    [InfrastructureType.MARKETING_DEPARTMENT]: [...Array(10)].map((_, i) => `+${(i + 1) * 5}% PR-Einnahmen`),
};

export const ACTIVITIES: Activity[] = [
    {
        id: 'training_1',
        name: 'Passspiel-Drills',
        description: 'Eine intensive Einheit, um deine Passgenauigkeit und dein Stellungsspiel zu verbessern.',
        durationSeconds: 420, // 7 minutes
        reward: { xp: 50, tp: 8 },
        type: 'training',
    },
    {
        id: 'training_2',
        name: 'Torschusstraining',
        description: 'Perfektioniere deinen Abschluss vor dem Tor. Eine halbe Stunde konzentriertes Schusstraining.',
        durationSeconds: 420, // 7 minutes
        reward: { xp: 60, tp: 8 },
        type: 'training',
    },
    {
        id: 'fitness_1',
        name: 'Ausdauerlauf',
        description: 'Ein langer Lauf durch den Wald, um deine grundlegende Ausdauer zu stärken.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 40, tp: 3 },
        type: 'fitness',
    },
    {
        id: 'fitness_2',
        name: 'Krafttraining',
        description: 'Baue im Fitnessstudio gezielt Muskeln und Stärke auf, um in Zweikämpfen robuster zu sein.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 45, tp: 3 },
        type: 'fitness',
    },
    {
        id: 'tactic_1',
        name: 'Videoanalyse',
        description: 'Studiere die Taktiken deines nächsten Gegners, um besser auf ihre Spielweise vorbereitet zu sein.',
        durationSeconds: 240, // 4 minutes
        reward: { xp: 30, tp: 4,  },
        type: 'tactic',
    },
    {
        id: 'tactic_2',
        name: 'Freistoßvarianten',
        description: 'Übe mit deinen Teamkollegen einstudierte Freistoßtricks, um den Gegner zu überraschen.',
        durationSeconds: 240, // 4 minutes
        reward: { xp: 30, tp: 5 },
        type: 'tactic',
    },
    {
        id: 'pr_1',
        name: 'Pressekonferenz',
        description: 'Stelle dich den Fragen der Journalisten und stärke dein Markenimage.',
        durationSeconds: 120, // 2 minutes
        reward: { xp: 25, tp: 1 },
        type: 'pr',
    },
    {
        id: 'social_1',
        name: 'Team-Abendessen',
        description: 'Ein entspanntes Abendessen mit deinen Teamkollegen, um den Teamgeist zu fördern.',
        durationSeconds: 120, // 2 minutes
        reward: { xp: 20, tp: 1 },
        type: 'social',
    },
    {
        id: 'social_2',
        name: 'Fantreffen & Autogramme',
        description: 'Nimm dir Zeit für die Fans. Ein positives Image ist auch für die Sponsoren wichtig.',
        durationSeconds: 120, // 2 minutes
        reward: { xp: 25, tp: 1},
        type: 'social',
    }
];

export const TEAM_TRAININGS: TeamTrainingSession[] = [
    {
        id: 't_passing_1',
        name: 'Passspiel-Grundlagen',
        description: 'Verbessert das Passspiel aller Spieler im Team.',
        durationSeconds: 3600, // 1 hour
        reward: { xp: 50, skills: { passing: 1 } }
    },
    {
        id: 't_defensive_drills_1',
        name: 'Abwehrübungen',
        description: 'Verbessert die Verteidigungsfähigkeiten des gesamten Teams.',
        durationSeconds: 7200, // 2 hours
        reward: { xp: 100, skills: { tackling: 1, marking: 1 } }
    }
];

export const TACTICS: Tactic[] = [
    {
        id: 'balanced',
        name: 'Ausgewogen',
        description: 'Eine neutrale Grundformation ohne spezielle Boni.',
        attackBonus: 0,
        defenseBonus: 0
    },
    {
        id: 'offensive',
        name: 'Offensiv',
        description: 'Hohes Pressing und schnelles Spiel nach vorne.',
        attackBonus: 0.15,
        defenseBonus: -0.10
    },
    {
        id: 'defensive',
        name: 'Defensiv',
        description: 'Das Team steht tief und sichert das eigene Tor ab.',
        attackBonus: -0.10,
        defenseBonus: 0.15
    },
    {
        id: 'counter',
        name: 'Konter',
        description: 'Aus einer sicheren Abwehr schnell umschalten.',
        attackBonus: -0.05,
        defenseBonus: 0.10
    },
    {
        id: 'gegenpressing',
        name: 'Gegenpressing',
        description: 'Sofortiges Jagen des Balls nach Ballverlust.',
        attackBonus: 0.10,
        defenseBonus: -0.05
    }
];

export const SHOP_ITEMS = [
    { id: 'tp_pack_1', name: 'Kleines TP-Paket', description: 'Ein guter Start für dein Training.', tp: 10, price: 50 },
    { id: 'tp_pack_2', name: 'Mittleres TP-Paket', description: 'Beschleunige deinen Fortschritt.', tp: 25, price: 110 },
    { id: 'tp_pack_3', name: 'Großes TP-Paket', description: 'Für ambitionierte Spieler, die es wissen wollen.', tp: 50, price: 200 },
];