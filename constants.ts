import { Activity, TeamTrainingSession, UserRole, InfrastructureType, PlayerPosition, Tactic, EquipmentItem, EquipmentSlot } from './types.js';

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
        durationSeconds: 480, // 8 minutes
        reward: { xp: 50, tp: 8 },
        type: 'training',
    },
    {
        id: 'training_2',
        name: 'Torschusstraining',
        description: 'Perfektioniere deinen Abschluss vor dem Tor. Eine halbe Stunde konzentriertes Schusstraining.',
        durationSeconds: 480, // 8 minutes
        reward: { xp: 60, tp: 8 },
        type: 'training',
    },
    {
        id: 'fitness_1',
        name: 'Ausdauerlauf',
        description: 'Ein langer Lauf durch den Wald, um deine grundlegende Ausdauer zu stärken.',
        durationSeconds: 360, // 6 minutes
        reward: { xp: 40, tp: 3 },
        type: 'fitness',
    },
    {
        id: 'fitness_2',
        name: 'Krafttraining',
        description: 'Baue im Fitnessstudio gezielt Muskeln und Stärke auf, um in Zweikämpfen robuster zu sein.',
        durationSeconds: 360, // 6 minutes
        reward: { xp: 45, tp: 3 },
        type: 'fitness',
    },
    {
        id: 'tactic_1',
        name: 'Videoanalyse',
        description: 'Studiere die Taktiken deines nächsten Gegners, um besser auf ihre Spielweise vorbereitet zu sein.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 30, tp: 4,  },
        type: 'tactic',
    },
    {
        id: 'tactic_2',
        name: 'Freistoßvarianten',
        description: 'Übe mit deinen Teamkollegen einstudierte Freistoßtricks, um den Gegner zu überraschen.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 30, tp: 5 },
        type: 'tactic',
    },
    {
        id: 'pr_1',
        name: 'Pressekonferenz',
        description: 'Stelle dich den Fragen der Journalisten und stärke dein Markenimage.',
        durationSeconds: 180, // 3 minutes
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
    },
    // Work Activities
    {
        id: 'work_1',
        name: 'Teilzeitjob (1h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 3600, // 1 hour
        reward: { xp: 10, euro: 20 },
        type: 'work',
    },
    {
        id: 'work_2',
        name: 'Teilzeitjob (2h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 7200, // 2 hours
        reward: { xp: 20, euro: 40 },
        type: 'work',
    },
    {
        id: 'work_3',
        name: 'Teilzeitjob (3h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 10800, // 3 hours
        reward: { xp: 30, euro: 60 },
        type: 'work',
    },
    {
        id: 'work_4',
        name: 'Teilzeitjob (4h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 14400, // 4 hours
        reward: { xp: 40, euro: 80 },
        type: 'work',
    },
    {
        id: 'work_5',
        name: 'Teilzeitjob (5h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 18000, // 5 hours
        reward: { xp: 50, euro: 100 },
        type: 'work',
    },
    {
        id: 'work_6',
        name: 'Teilzeitjob (6h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 21600, // 6 hours
        reward: { xp: 60, euro: 120 },
        type: 'work',
    },
    {
        id: 'work_7',
        name: 'Teilzeitjob (7h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 25200, // 7 hours
        reward: { xp: 70, euro: 140 },
        type: 'work',
    },
    {
        id: 'work_8',
        name: 'Teilzeitjob (8h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 28800, // 8 hours
        reward: { xp: 80, euro: 160 },
        type: 'work',
    },
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

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
    // --- Schuhe (Stürmer) ---
    {
        id: 'shoe_st_01',
        name: 'Stürmer-Schuh Alpha',
        description: 'Verbessert Schusskraft und Abschluss.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Stürmer'],
        bonus: { 
            'shot_power': 2,
            'finishing': 3,
        }
    },
    // --- Schuhe (Mittelfeld) ---
    {
        id: 'shoe_mf_01',
        name: 'Mittelfeld-Schuh Beta',
        description: 'Verbessert Passen und Dribbling.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Mittelfeld'],
        bonus: {
            'passing': 3,
            'dribbling': 2,
        }
    },
    // --- Schuhe (Abwehr) ---
    {
        id: 'shoe_aw_01',
        name: 'Abwehr-Schuh Gamma',
        description: 'Verbessert Zweikampf und Stärke.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Abwehr'],
        bonus: {
            'tackling': 3,
            'strength': 2,
        }
    },
    // --- Torwart-Schuhe ---
    {
        id: 'shoe_tw_01',
        name: 'Torwart-Schuh Alpha',
        description: 'Verbessert Abschlag und Reflexe.',
        price: 55,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Torwart'],
        bonus: {
            'kicking': 3,
            'reflexes': 2,
        }
    },
    // --- Trikots ---
    {
        id: 'jersey_st_01',
        name: 'Stürmer-Trikot Alpha',
        description: 'Verbessert Abschluss und Schusskraft.',
        price: 40,
        slot: EquipmentSlot.JERSEY,
        allowedPositions: ['Stürmer'],
        bonus: {
            'finishing': 3,
            'shot_power': 2,
        }
    },
    {
        id: 'jersey_mf_01',
        name: 'Mittelfeld-Trikot Beta',
        description: 'Verbessert Übersicht und Passspiel.',
        price: 40,
        slot: EquipmentSlot.JERSEY,
        allowedPositions: ['Mittelfeld'],
        bonus: {
            'vision': 3,
            'passing': 2,
        }
    },
    {
        id: 'jersey_aw_01',
        name: 'Abwehr-Trikot Gamma',
        description: 'Verbessert Manndeckung und Abfangen.',
        price: 40,
        slot: EquipmentSlot.JERSEY,
        allowedPositions: ['Abwehr'],
        bonus: {
            'marking': 3,
            'interceptions': 2,
        }
    },
    {
        id: 'jersey_tw_01',
        name: 'Torwart-Trikot Alpha',
        description: 'Verbessert Kommunikation und Positionierung.',
        price: 40,
        slot: EquipmentSlot.JERSEY,
        allowedPositions: ['Torwart'],
        bonus: {
            'communication': 2,
            'positioning': 3,
        }
    },
    // --- Hosen ---
    {
        id: 'shorts_st_01',
        name: 'Stürmer-Hose Alpha',
        description: 'Verbessert Antritt und Dribbling.',
        price: 35,
        slot: EquipmentSlot.SHORTS,
        allowedPositions: ['Stürmer'],
        bonus: {
            'pace': 3,
            'dribbling': 2,
        }
    },
    {
        id: 'shorts_mf_01',
        name: 'Mittelfeld-Hose Beta',
        description: 'Verbessert Ausdauer und Dribbling.',
        price: 35,
        slot: EquipmentSlot.SHORTS,
        allowedPositions: ['Mittelfeld'],
        bonus: {
            'stamina': 3,
            'dribbling': 2,
        }
    },
    {
        id: 'shorts_aw_01',
        name: 'Abwehr-Hose Gamma',
        description: 'Verbessert Zweikampf und Stärke.',
        price: 35,
        slot: EquipmentSlot.SHORTS,
        allowedPositions: ['Abwehr'],
        bonus: {
            'tackling': 3,
            'strength': 2,
        }
    },
    {
        id: 'shorts_tw_01',
        name: 'Torwart-Hose Alpha',
        description: 'Verbessert Hechten und Stärke.',
        price: 35,
        slot: EquipmentSlot.SHORTS,
        allowedPositions: ['Torwart'],
        bonus: {
            'diving': 3,
            'strength': 2,
        }
    }
];