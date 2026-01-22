import { SkillType, Activity, InfrastructureType, PlayerPosition, UserRole } from './types';

export const SKILL_UPGRADE_COST = 1;

export const POSITION_SKILLS: Record<string, SkillType[]> = {
  'Stürmer': ['finishing', 'shot_power', 'heading', 'long_shots', 'dribbling', 'pace'],
  'Mittelfeld': ['passing', 'dribbling', 'vision', 'tackling', 'stamina', 'long_shots'],
  'Abwehr': ['tackling', 'marking', 'interceptions', 'strength', 'heading', 'aggression'],
  'Torwart': ['handling', 'reflexes', 'diving', 'positioning', 'communication', 'kicking'],
};

export const INFRA_UPGRADE_COSTS = [
  50000, 150000, 300000, 500000, 800000, 1200000, 2000000, 3500000, 6000000, 10000000
];

export const INFRA_UPGRADE_TIMES = [
  3600, 7200, 14400, 28800, 57600, 115200, 230400, 460800, 921600, 1843200
];

export const INFRA_LEVEL_BENEFITS: Record<InfrastructureType, string[]> = {
  stadium: ['Erhöht die Ticketeinnahmen pro Spiel.', 'Schaltet neue Sponsoren-Deals frei.', 'Verbessert das Fan-Engagement.'],
  training_ground: ['Erhöht die Effektivität des Trainings.', 'Schaltet neue Trainingsmethoden frei.', 'Verringert die Verletzungsgefahr.'],
  youth_academy: ['Zieht talentiertere Jugendspieler an.', 'Verbessert die Entwicklung der Jugendspieler.', 'Erhöht die Erfolgsquote beim Scouting.'],
  scouting_department: ['Vergrößert den Scouting-Radius.', 'Liefert detailliertere Spielerberichte.', 'Erhöht die Chance, Top-Talente zu entdecken.'],
  medical_center: ['Verkürzt die Regenerationszeit nach Verletzungen.', 'Schaltet fortschrittliche medizinische Behandlungen frei.', 'Reduziert die Ausfallzeit von Spielern.'],
};

export const ACTIVITIES: Activity[] = [
  {
    id: 'sprint_training',
    name: 'Sprint-Training',
    description: 'Verbessere deine Grundschnelligkeit und Ausdauer auf dem Platz.',
    durationSeconds: 120,
    reward: { tp: 10, xp: 20 },
    type: 'training'
  },
  {
    id: 'technique_drill',
    name: 'Technik-Drill',
    description: 'Feile an deiner Ballkontrolle, deinem Dribbling und Passspiel.',
    durationSeconds: 180,
    reward: { tp: 15, xp: 30 },
    type: 'training'
  },
  {
    id: 'physio_session',
    name: 'Physio-Behandlung',
    description: 'Regeneration und Verletzungsprävention mit dem medizinischen Team.',
    durationSeconds: 240, 
    reward: { tp: 5, xp: 15 },
    type: 'fitness'
  },
  {
    id: 'tactic_meeting',
    name: 'Taktik-Besprechung',
    description: 'Analyse des nächsten Gegners und Planung der Spielstrategie.',
    durationSeconds: 300,
    reward: { tp: 20, xp: 50 },
    type: 'tactic'
  },
  {
    id: 'video_analysis',
    name: 'Video-Analyse',
    description: 'Studiere deine eigene Leistung und die von Top-Spielern.',
    durationSeconds: 400,
    reward: { tp: 25, xp: 60 },
    type: 'tactic'
  },
  {
    id: 'press_conference',
    name: 'Pressekonferenz',
    description: 'Stelle dich den Fragen der Journalisten und baue dein Image auf.',
    durationSeconds: 150,
    reward: { tp: 30, xp: 70, budgetGain: 5000 },
    type: 'pr'
  },
  {
    id: 'sponsor_meeting',
    name: 'Sponsoren-Termin',
    description: 'Triff potenzielle Sponsoren, um die Finanzen des Clubs zu stärken.',
    durationSeconds: 600,
    reward: { tp: 50, xp: 100, budgetGain: 25000 },
    requiredRole: UserRole.MANAGER,
    type: 'pr'
  },
  {
    id: 'autograph_signing',
    name: 'Autogrammstunde',
    description: 'Interagiere mit den Fans und stärke die Bindung zum Verein.',
    durationSeconds: 200,
    reward: { tp: 40, xp: 80, budgetGain: 10000 },
    type: 'pr'
  },
  {
    id: 'ice_bath',
    name: 'Eisbad',
    description: 'Reduziere Muskelkater und beschleunige die Regeneration.',
    durationSeconds: 90,
    reward: { tp: 8, xp: 25 },
    type: 'fitness'
  },
  {
    id: 'team_dinner',
    name: 'Team-Abend',
    description: 'Gemeinsames Abendessen zur Stärkung des Teamgeists.',
    durationSeconds: 600,
    reward: { tp: 20, xp: 40 },
    type: 'social'
  }
];