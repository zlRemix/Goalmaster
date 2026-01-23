export type PlayerPosition = 'Stürmer' | 'Mittelfeld' | 'Abwehr' | 'Torwart';

export enum UserRole {
  PLAYER = 'player',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

export type SkillType = 
  | 'pace' | 'shot_power' | 'finishing' | 'passing' | 'dribbling' 
  | 'tackling' | 'vision' | 'stamina' | 'heading' | 'long_shots' 
  | 'marking' | 'interceptions' | 'strength' | 'aggression' 
  | 'handling' | 'reflexes' | 'diving' | 'positioning' | 'communication' | 'kicking';

export interface Reward {
  xp?: number;
  tp?: number;
  budgetGain?: number;
  skills?: Partial<Record<SkillType, number>>;
}

// INDIVIDUAL player activities
export interface Activity {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  reward: Reward;
  requiredRole?: UserRole;
  type: 'training' | 'fitness' | 'tactic' | 'pr' | 'social';
}

export interface ActiveActivity {
  activityId: string;
  startTime: number;
}

// TEAM training sessions
export interface TeamTrainingSession {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  reward: Omit<Reward, 'budgetGain'>; // Team trainings don't give budget
}

export interface ActiveTeamTraining {
  trainingId: string;
  startTime: number;
}

export interface Player {
  id: string;
  name: string;
  position: PlayerPosition;
  level: number;
  experience: number;
  trainingPoints: number;
  clubId: string | null;
  roles: UserRole[];
  skills: { [key in SkillType]?: number };
  activeActivities: ActiveActivity[];
  completedActivityIds: string[];
  nextActivityReset: number;
  pendingClubInvitation?: string | null; // ID of a club that invited the player
}

export enum InfrastructureType {
    STADIUM = 'stadium',
    TRAINING_GROUND = 'training_ground',
    YOUTH_ACADEMY = 'youth_academy',
    SCOUTING_NETWORK = 'scouting_network',
}

export interface InfrastructureItem {
  level: number;
}

export interface PendingUpgrade {
  type: InfrastructureType;
  targetLevel: number;
  startTime: number;
  endTime: number;
}

export interface Club {
  id: string;
  name: string;
  managerId: string;
  players: string[];
  budget: number;
  infrastructure: Partial<Record<InfrastructureType, InfrastructureItem>>;
  pendingUpgrades?: PendingUpgrade[];
  activeTeamTraining?: ActiveTeamTraining | null;
  pendingApplications?: string[]; // IDs of players who applied
}

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: number; // timestamp
  result?: string; // e.g. "2-1"
}

export type View = 'home' | 'skills' | 'club' | 'activities' | 'staff' | 'finances' | 'match' | 'leaderboard' | 'club-search';
