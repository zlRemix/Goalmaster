import { Activity, TeamTrainingSession, UserRole, InfrastructureType, PlayerPosition, Tactic, Playstyle, EquipmentItem, EquipmentSlot, PlayerMentality, StadiumSpecializationID, SpecializationID } from './types.js';

// --- Elite Infrastructure Specializations ---

interface Specialization {
    id: SpecializationID;
    name: string;
    description: string;
    bonus: { [key: string]: any }; 
}

interface SpecializationPath {
    type: InfrastructureType;
    specializations: Specialization[];
}

export const INFRASTRUCTURE_SPECIALIZATIONS: SpecializationPath[] = [
    {
        type: InfrastructureType.STADIUM,
        specializations: [
            {
                id: 'vip_temple',
                name: 'VIP-Business-Tempel',
                description: 'Luxuslogen und Kaviar-Service. Dein Stadion wird zur Goldgrube, aber die Stimmung ist eher ruhig.',
                bonus: { income_bonus: 1.0 }, // +100% income, replacing the base bonus.
            },
            {
                id: 'ultra_fortress',
                name: 'Die Gelbe Wand (Ultra-Festung)',
                description: 'Maximale Fan-Präsenz. Der ohrenbetäubende Lärm lässt gegnerische Stürmer zittern.',
                bonus: { defense_bonus: 0.15 }, // +15% defense bonus for home games.
            }
        ]
    }
    // Future specializations for other buildings will be added here
];

export const INFRA_SPECIALIZATION_COST = 2500000;
export const INFRA_SPECIALIZATION_TIME = 604800; // 7 days in seconds

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
        id: 'daily_quiz_1',
        name: 'Tägliches Fußball-Quiz',
        description: 'Teste dein Wissen und verdiene Belohnungen. Nur einmal alle 24 Stunden verfügbar.',
        durationSeconds: 60,
        reward: { xp: 100, tp: 20 },
        type: 'quiz',
    },
    {
        id: 'training_1',
        name: 'Passspiel-Drills',
        description: 'Eine intensive Einheit, um deine Passgenauigkeit und dein Stellungsspiel zu verbessern.',
        durationSeconds: 480, // 8 minutes
        reward: { xp: 50, tp: 15 },
        type: 'training',
        maxCharges: 3,
        chargeRegenerationSeconds: 14400, // 4 hours
    },
    {
        id: 'training_2',
        name: 'Torschusstraining',
        description: 'Perfektioniere deinen Abschluss vor dem Tor. Eine halbe Stunde konzentriertes Schusstraining.',
        durationSeconds: 480, // 8 minutes
        reward: { xp: 60, tp: 15 },
        type: 'training',
        maxCharges: 3,
        chargeRegenerationSeconds: 14400, // 4 hours
    },
    {
        id: 'fitness_1',
        name: 'Ausdauerlauf',
        description: 'Ein langer Lauf durch den Wald, um deine grundlegende Ausdauer zu stärken.',
        durationSeconds: 360, // 6 minutes
        reward: { xp: 50, tp: 10 },
        type: 'fitness',
        maxCharges: 4,
        chargeRegenerationSeconds: 10800, // 3 hours
    },
    {
        id: 'fitness_2',
        name: 'Krafttraining',
        description: 'Baue im Fitnessstudio gezielt Muskeln und Stärke auf, um in Zweikämpfen robuster zu sein.',
        durationSeconds: 360, // 6 minutes
        reward: { xp: 50, tp: 10 },
        type: 'fitness',
        maxCharges: 4,
        chargeRegenerationSeconds: 10800, // 3 hours
    },
    {
        id: 'tactic_1',
        name: 'Videoanalyse',
        description: 'Studiere die Taktiken deines nächsten Gegners, um besser auf ihre Spielweise vorbereitet zu sein.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 40, tp: 8 },
        type: 'tactic',
        maxCharges: 5,
        chargeRegenerationSeconds: 7200, // 2 hours
    },
    {
        id: 'tactic_2',
        name: 'Freistoßvarianten',
        description: 'Übe mit deinen Teamkollegen einstudierte Freistoßtricks, um den Gegner zu überraschen.',
        durationSeconds: 300, // 5 minutes
        reward: { xp: 40, tp: 8 },
        type: 'tactic',
        maxCharges: 5,
        chargeRegenerationSeconds: 7200, // 2 hours
    },
    {
        id: 'pr_1',
        name: 'Pressekonferenz',
        description: 'Stelle dich den Fragen der Journalisten und stärke dein Markenimage.',
        durationSeconds: 180, // 3 minutes
        reward: { xp: 20, tp: 3 },
        type: 'pr',
        maxCharges: 6,
        chargeRegenerationSeconds: 3600, // 1 hour
    },
    {
        id: 'social_1',
        name: 'Team-Abendessen',
        description: 'Ein entspanntes Abendessen mit deinen Teamkollegen, um den Teamgeist zu fördern.',
        durationSeconds: 120, // 2 minutes
        reward: { xp: 20, tp: 3 },
        type: 'social',
        maxCharges: 6,
        chargeRegenerationSeconds: 3600, // 1 hour
    },
    {
        id: 'social_2',
        name: 'Fantreffen & Autogramme',
        description: 'Nimm dir Zeit für die Fans. Ein positives Image ist auch für die Sponsoren wichtig.',
        durationSeconds: 120, // 2 minutes
        reward: { xp: 20, tp: 3 },
        type: 'social',
        maxCharges: 6,
        chargeRegenerationSeconds: 3600, // 1 hour
    },
    {
        id: 'work_1',
        name: 'Jobben (1h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 3600,
        reward: { euro: 20 },
        type: 'work',
    },
    {
        id: 'work_2',
        name: 'Jobben (4h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 14400,
        reward: { euro: 80 },
        type: 'work',
    },
    {
        id: 'work_3',
        name: 'Jobben (8h)',
        description: 'Verdiene etwas Geld nebenbei. Jede Stunde zählt.',
        durationSeconds: 28800,
        reward: { euro: 160 },
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

export const PLAYSTYLES: Playstyle[] = [
    {
        id: 'balanced',
        name: 'Ausgewogen',
        description: 'Ein ausbalancierter Spielstil ohne klare Stärken.',
        attackBonus: 0,
        defenseBonus: 0
    },
    {
        id: 'short_passes',
        name: 'Kurzpassspiel',
        description: 'Geduldiger Spielaufbau mit sicheren Pässen.',
        attackBonus: 0.05,
        defenseBonus: 0.05
    },
    {
        id: 'long_balls',
        name: 'Lange Bälle',
        description: 'Das Mittelfeld schnell mit hohen Bällen überbrücken.',
        attackBonus: 0.1,
        defenseBonus: -0.05
    },
    {
        id: 'wing_play',
        name: 'Flügelspiel',
        description: 'Das Spiel auf die Außenbahnen verlagern und flanken.',
        attackBonus: 0.1,
        defenseBonus: -0.05
    }
];

export const PLAYER_MENTALITIES: PlayerMentality[] = [
    {
        id: 'aggressive',
        name: 'Aggressiv',
        description: 'Fokussiert auf Offensive, riskante Pässe und Torabschlüsse.',
        attackBonus: 0.1,
        defenseBonus: -0.05,
        workRateBonus: 0.05,
    },
    {
        id: 'balanced',
        name: 'Ausgewogen',
        description: 'Eine ausbalancierte Mischung aus Offensive und Defensive.',
        attackBonus: 0,
        defenseBonus: 0,
        workRateBonus: 0,
    },
    {
        id: 'cautious',
        name: 'Vorsichtig',
        description: 'Fokussiert auf sicheres Passspiel und defensive Stabilität.',
        attackBonus: -0.05,
        defenseBonus: 0.1,
        workRateBonus: -0.05,
    },
    {
        id: 'playmaker',
        name: 'Spielmacher',
        description: 'Konzentriert sich darauf, Chancen für Mitspieler zu kreieren.',
        attackBonus: 0.05,
        defenseBonus: -0.05,
        workRateBonus: 0.05,
    },
    {
        id: 'workhorse',
        name: 'Arbeitstier',
        description: 'Hohe Laufbereitschaft und Einsatz in alle Richtungen.',
        attackBonus: 0,
        defenseBonus: 0.05,
        workRateBonus: 0.1,
    }
]

export const SHOP_ITEMS = [
    { id: 'tp_pack_1', name: 'Kleines TP-Paket', description: 'Ein guter Start für dein Training.', tp: 10, price: 50 },
    { id: 'tp_pack_2', name: 'Mittleres TP-Paket', description: 'Beschleunige deinen Fortschritt.', tp: 25, price: 110 },
    { id: 'tp_pack_3', name: 'Großes TP-Paket', description: 'Für ambitionierte Spieler, die es wissen wollen.', tp: 50, price: 200 },
];

export const GK_TIER1_SETS: EquipmentItem[] = [
  // --- SET 1: SAFE-GRIP (Der Ruhepol) ---
  {
    id: 'gk_std_safe_gloves',
    name: 'Safe-Grip Gloves',
    slot: EquipmentSlot.GLOVES,
    rarity: 'STANDARD',
    price: 55,
    allowedPositions: ['Torwart'],
    bonus: { handling: 5, positioning: 2 }
  },
  {
    id: 'gk_std_safe_jersey',
    name: 'Safe-Grip Jersey',
    slot: EquipmentSlot.JERSEY,
    rarity: 'STANDARD',
    price: 45,
    allowedPositions: ['Torwart'],
    bonus: { positioning: 4, handling: 1 }
  },
  {
    id: 'gk_std_safe_shorts',
    name: 'Safe-Grip Pants',
    slot: EquipmentSlot.SHORTS,
    rarity: 'STANDARD',
    price: 40,
    allowedPositions: ['Torwart'],
    bonus: { handling: 3, communication: 1 }
  },

  // --- SET 2: QUICK-REFLEX (Die Katze) ---
  {
    id: 'gk_std_reflex_gloves',
    name: 'Quick-Reflex Gloves',
    slot: EquipmentSlot.GLOVES,
    rarity: 'STANDARD',
    price: 55,
    allowedPositions: ['Torwart'],
    bonus: { reflexes: 5, diving: 2 }
  },
  {
    id: 'gk_std_reflex_jersey',
    name: 'Quick-Reflex Jersey',
    slot: EquipmentSlot.JERSEY,
    rarity: 'STANDARD',
    price: 45,
    allowedPositions: ['Torwart'],
    bonus: { diving: 4, reflexes: 1 }
  },
  {
    id: 'gk_std_reflex_shorts',
    name: 'Quick-Reflex Pants',
    slot: EquipmentSlot.SHORTS,
    rarity: 'STANDARD',
    price: 40,
    allowedPositions: ['Torwart'],
    bonus: { reflexes: 3, positioning: 1 }
  },

  // --- SET 3: MODERN-GOALIE (Der Spielmacher) ---
  {
    id: 'gk_std_modern_gloves',
    name: 'Modern-Goalie Gloves',
    slot: EquipmentSlot.GLOVES,
    rarity: 'STANDARD',
    price: 55,
    allowedPositions: ['Torwart'],
    bonus: { kicking: 5, communication: 2 }
  },
  {
    id: 'gk_std_modern_jersey',
    name: 'Modern-Goalie Jersey',
    slot: EquipmentSlot.JERSEY,
    rarity: 'STANDARD',
    price: 45,
    allowedPositions: ['Torwart'],
    bonus: { communication: 4, kicking: 1 }
  },
  {
    id: 'gk_std_modern_shorts',
    name: 'Modern-Goalie Pants',
    slot: EquipmentSlot.SHORTS,
    rarity: 'STANDARD',
    price: 40,
    allowedPositions: ['Torwart'],
    bonus: { kicking: 3, handling: 1 }
  }
];

export const GK_RARE_SETS: EquipmentItem[] = [
  // --- SET 1: TITAN-GRIP (Der unerschütterliche Fels) ---
  {
    id: 'gk_rare_titan_gloves',
    name: 'Titan-Grip Pro-Latex',
    slot: EquipmentSlot.GLOVES,
    rarity: 'RARE',
    price: 650,
    allowedPositions: ['Torwart'],
    bonus: { handling: 12, positioning: 4 }
  },
  {
    id: 'gk_rare_titan_jersey',
    name: 'Titan-Grip Bio-Armor',
    slot: EquipmentSlot.JERSEY,
    rarity: 'RARE',
    price: 550,
    allowedPositions: ['Torwart'],
    bonus: { positioning: 10, handling: 4 }
  },
  {
    id: 'gk_rare_titan_shorts',
    name: 'Titan-Grip Padded',
    slot: EquipmentSlot.SHORTS,
    rarity: 'RARE',
    price: 450,
    allowedPositions: ['Torwart'],
    bonus: { handling: 6, strength: 5 }
  },

  // --- SET 2: FALCON-REFLEX (Der Linien-Blitz) ---
  {
    id: 'gk_rare_falcon_gloves',
    name: 'Falcon-Reflex Aero',
    slot: EquipmentSlot.GLOVES,
    rarity: 'RARE',
    price: 650,
    allowedPositions: ['Torwart'],
    bonus: { reflexes: 12, diving: 4 }
  },
  {
    id: 'gk_rare_falcon_jersey',
    name: 'Falcon-Reflex Kinetic',
    slot: EquipmentSlot.JERSEY,
    rarity: 'RARE',
    price: 550,
    allowedPositions: ['Torwart'],
    bonus: { diving: 10, reflexes: 4 }
  },
  {
    id: 'gk_rare_falcon_shorts',
    name: 'Falcon-Reflex Glide',
    slot: EquipmentSlot.SHORTS,
    rarity: 'RARE',
    price: 450,
    allowedPositions: ['Torwart'],
    bonus: { reflexes: 6, pace: 5 }
  },

  // --- SET 3: DIRECT-PLAY (Der moderne Libero-Goalie) ---
  {
    id: 'gk_rare_direct_gloves',
    name: 'Direct-Play Hybrid',
    slot: EquipmentSlot.GLOVES,
    rarity: 'RARE',
    price: 650,
    allowedPositions: ['Torwart'],
    bonus: { kicking: 12, communication: 4 }
  },
  {
    id: 'gk_rare_direct_jersey',
    name: 'Direct-Play Signal',
    slot: EquipmentSlot.JERSEY,
    rarity: 'RARE',
    price: 550,
    allowedPositions: ['Torwart'],
    bonus: { communication: 10, kicking: 4 }
  },
  {
    id: 'gk_rare_direct_shorts',
    name: 'Direct-Play Speed',
    slot: EquipmentSlot.SHORTS,
    rarity: 'RARE',
    price: 450,
    allowedPositions: ['Torwart'],
    bonus: { kicking: 6, vision: 5 }
  }
];

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
    ...GK_TIER1_SETS,
    ...GK_RARE_SETS,
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
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
        },
        rarity: 'STANDARD',
    }
];