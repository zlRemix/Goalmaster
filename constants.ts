
import { Player, Club, SkillType, PlayerPosition, UserRole } from './types';

export const POSITION_SKILLS: Record<PlayerPosition, SkillType[]> = {
  [PlayerPosition.ST]: [SkillType.Shooting, SkillType.Dribbling, SkillType.Pace, SkillType.Heading, SkillType.Finishing],
  [PlayerPosition.MF]: [SkillType.Passing, SkillType.Vision, SkillType.BallControl, SkillType.Stamina, SkillType.Interception],
  [PlayerPosition.AW]: [SkillType.Tackling, SkillType.Marking, SkillType.Strength, SkillType.Heading, SkillType.Positioning],
  [PlayerPosition.TW]: [SkillType.Reflexes, SkillType.Diving, SkillType.Handling, SkillType.Kicking, SkillType.GkPositioning],
};

const getInitialSkills = (pos: PlayerPosition) => {
  const skills: Partial<Record<SkillType, number>> = {};
  POSITION_SKILLS[pos].forEach(skill => {
    skills[skill] = 20;
  });
  return skills;
};

export const INITIAL_PLAYER: Player = {
  id: 'p1',
  name: 'Lukas Müller',
  avatar: 'https://picsum.photos/seed/p1/200/200',
  position: PlayerPosition.ST,
  roles: [UserRole.PLAYER],
  level: 1,
  experience: 0,
  trainingPoints: 15,
  clubId: 'c1',
  skills: getInitialSkills(PlayerPosition.ST)
};

export const INITIAL_CLUBS: Club[] = [
  { id: 'c1', name: 'FC Nordstern', managerName: 'Du', managerId: 'p1', logo: '⭐', players: ['p1'], budget: 50000, trophies: 0, pendingUpgrades: [], infrastructure: { stadium: 1, trainingGround: 1, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c2', name: 'Eintracht Süd', managerName: 'Karsten K.', managerId: 'ai_1', logo: '🦅', players: [], budget: 120000, trophies: 2, pendingUpgrades: [], infrastructure: { stadium: 2, trainingGround: 2, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c3', name: 'Borussia West', managerName: 'Thomas M.', managerId: 'ai_2', logo: '🛡️', players: [], budget: 90000, trophies: 1, pendingUpgrades: [], infrastructure: { stadium: 1, trainingGround: 2, medicalCenter: 2, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c4', name: 'Hansa Ost', managerName: 'Olaf S.', managerId: 'ai_3', logo: '⚓', players: [], budget: 45000, trophies: 0, pendingUpgrades: [], infrastructure: { stadium: 1, trainingGround: 1, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c5', name: 'Kickers City', managerName: 'Sven V.', managerId: 'ai_4', logo: '⚡', players: [], budget: 250000, trophies: 5, pendingUpgrades: [], infrastructure: { stadium: 3, trainingGround: 3, medicalCenter: 2, youthAcademy: 2, marketingOffice: 2 } },
  { id: 'c6', name: 'Real Alster', managerName: 'Felix W.', managerId: 'ai_5', logo: '🏰', players: [], budget: 150000, trophies: 3, pendingUpgrades: [], infrastructure: { stadium: 2, trainingGround: 1, medicalCenter: 3, youthAcademy: 1, marketingOffice: 2 } },
  { id: 'c7', name: 'Rapid Isar', managerName: 'Markus B.', managerId: 'ai_6', logo: '🔥', players: [], budget: 85000, trophies: 0, pendingUpgrades: [], infrastructure: { stadium: 1, trainingGround: 2, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c8', name: 'Dynamo Rhein', managerName: 'Erik T.', managerId: 'ai_7', logo: '🦁', players: [], budget: 60000, trophies: 0, pendingUpgrades: [], infrastructure: { stadium: 2, trainingGround: 1, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c9', name: 'Union Alpen', managerName: 'Sepp H.', managerId: 'ai_8', logo: '🏔️', players: [], budget: 110000, trophies: 1, pendingUpgrades: [], infrastructure: { stadium: 2, trainingGround: 2, medicalCenter: 2, youthAcademy: 1, marketingOffice: 1 } },
  { id: 'c10', name: 'SC Küste', managerName: 'Marten P.', managerId: 'ai_9', logo: '🌊', players: [], budget: 70000, trophies: 0, pendingUpgrades: [], infrastructure: { stadium: 1, trainingGround: 1, medicalCenter: 2, youthAcademy: 1, marketingOffice: 1 } }
];

export const SKILL_UPGRADE_COST = 1;

export const INFRA_UPGRADE_COSTS = [
  0, 
  10000, 25000, 50000, 100000, 250000, 600000, 1500000, 4000000, 10000000
];

// Upgrade times in milliseconds. 
// Scaling representing "months" of simulated time (based on 1 match per real day in dataService)
// Level 1->2: 24h, Level 4->5: 1 Woche, Level 9->10: 1 Monat
export const INFRA_UPGRADE_TIMES = [
  0,
  86400000,        // L1 -> L2 (1 Tag)
  172800000,       // L2 -> L3 (2 Tage)
  345600000,       // L3 -> L4 (4 Tage)
  604800000,       // L4 -> L5 (1 Woche)
  1209600000,      // L5 -> L6 (2 Wochen)
  1814400000,      // L6 -> L7 (3 Wochen)
  2592000000,      // L7 -> L8 (1 Monat / 4 Wochen)
  5184000000,      // L8 -> L9 (2 Monate)
  7776000000       // L9 -> L10 (3 Monate)
];

export const INFRA_LEVEL_BENEFITS = {
  stadium: [
    { level: 1, benefit: "Basis-Einnahmen: 5.000 € pro Spiel" },
    { level: 2, benefit: "VIP-Logen: 12.000 € pro Spiel" },
    { level: 3, benefit: "Sponsoren-Wand: 25.000 € pro Spiel" },
    { level: 4, benefit: "Flutlicht-Anlage: 50.000 € pro Spiel" },
    { level: 5, benefit: "Mega-Arena: 100.000 € pro Spiel" },
    { level: 6, benefit: "Business-Plätze: 175.000 € pro Spiel" },
    { level: 7, benefit: "Dach-Konstruktion: 300.000 € pro Spiel" },
    { level: 8, benefit: "High-Tech Rasen: 550.000 € pro Spiel" },
    { level: 9, benefit: "Entertainment-Dome: 900.000 € pro Spiel" },
    { level: 10, benefit: "Weltstadion-Status: 1.500.000 € pro Spiel" }
  ],
  trainingGround: [
    { level: 1, benefit: "Standard-Training: 0% TP Bonus" },
    { level: 2, benefit: "Hütchen & Hürden: +10% TP Bonus" },
    { level: 3, benefit: "Video-Raum: +25% TP Bonus" },
    { level: 4, benefit: "KI-Sensoren: +50% TP Bonus" },
    { level: 5, benefit: "Leistungszentrum: +100% TP Bonus" },
    { level: 6, benefit: "Smart-Ball-System: +150% TP Bonus" },
    { level: 7, benefit: "VR-Taktik-Sim: +200% TP Bonus" },
    { level: 8, benefit: "DNA-Optimierung: +300% TP Bonus" },
    { level: 9, benefit: "Neuro-Coaching: +450% TP Bonus" },
    { level: 10, benefit: "Götterschmiede: +600% TP Bonus" }
  ],
  medicalCenter: [
    { level: 1, benefit: "Eisbeutel: 0% Cooldown-Bonus" },
    { level: 2, benefit: "Massage-Bänke: -5% Cooldown" },
    { level: 3, benefit: "Sauna-Landschaft: -10% Cooldown" },
    { level: 4, benefit: "Kältekammer: -15% Cooldown" },
    { level: 5, benefit: "High-Tech Physio: -20% Cooldown" },
    { level: 6, benefit: "Hyperbar-Kammern: -25% Cooldown" },
    { level: 7, benefit: "Nährstoff-Management: -30% Cooldown" },
    { level: 8, benefit: "Laser-Therapie: -40% Cooldown" },
    { level: 9, benefit: "Bio-Regenerator: -45% Cooldown" },
    { level: 10, benefit: "Elite-Reha: Maximal -50% Cooldown" }
  ],
  youthAcademy: [
    { level: 1, benefit: "Basis-Sichtung: +5 XP pro Training" },
    { level: 2, benefit: "Talent-Scouts: +15 XP pro Training" },
    { level: 3, benefit: "Internat: +35 XP pro Training" },
    { level: 4, benefit: "Elite-Akademie: +75 XP pro Training" },
    { level: 5, benefit: "Weltklasse-Schmiede: +150 XP pro Training" },
    { level: 6, benefit: "Daten-Analyse-Lab: +300 XP pro Training" },
    { level: 7, benefit: "Internationale Kooperation: +600 XP pro Training" },
    { level: 8, benefit: "Genscan-Talente: +1.200 XP pro Training" },
    { level: 9, benefit: "Zukunfts-Fabrik: +2.500 XP pro Training" },
    { level: 10, benefit: "Legenden-Brutstätte: +5.000 XP pro Training" }
  ],
  marketingOffice: [
    { level: 1, benefit: "Social Media: +2.000 € täglich" },
    { level: 2, benefit: "Merchandising-Shop: +6.000 € täglich" },
    { level: 3, benefit: "TV-Verträge: +15.000 € täglich" },
    { level: 4, benefit: "Globaler Sponsor: +35.000 € täglich" },
    { level: 5, benefit: "Weltmarke: +80.000 € täglich" },
    { level: 6, benefit: "Fan-Token System: +150.000 € täglich" },
    { level: 7, benefit: "Metaverse-Partner: +300.000 € täglich" },
    { level: 8, benefit: "Streaming-Gigant: +600.000 € täglich" },
    { level: 9, benefit: "Kontinental-Imperium: +1.200.000 € täglich" },
    { level: 10, benefit: "Fußball-Hegemonie: +2.500.000 € täglich" }
  ]
};
