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

export type TacticID = 'balanced' | 'offensive' | 'defensive' | 'counter' | 'gegenpressing';

export interface Tactic {
    id: TacticID;
    name: string;
    description: string;
    attackBonus: number; 
    defenseBonus: number; 
}

export interface AvatarData {
    style: string;
    seed: string;
}

// --- Equipment --- //
export enum EquipmentSlot {
    SHOES = 'shoes',
    GLOVES = 'gloves',
    SHIN_GUARDS = 'shin_guards',
    TAPE = 'tape',
}

export interface EquipmentItem {
    id: string;
    name: string;
    description: string;
    price: number;
    slot: EquipmentSlot;
    bonus: Partial<Record<SkillType, number>>;
    allowedPositions: PlayerPosition[];
}
// ----------------- //

export interface Player {
    id: string;
    name: string;
    position: PlayerPosition;
    level: number;
    experience: number;
    trainingPoints: number;
    euro: number; 
    clubId: string | null;
    roles: UserRole[];
    skills: { [key in SkillType]?: number };
    activeActivities: ActiveActivity[];
    completedActivityIds: string[];
    nextActivityReset: number;
    pendingClubInvitation?: string | null; 
    avatar?: AvatarData;
    equipment?: string[]; // IDs of owned equipment items
    equipped?: Partial<Record<EquipmentSlot, string>>; // ID of equipped item per slot
}

export enum InfrastructureType {
    STADIUM = 'stadium',
    TRAINING_GROUND = 'training_ground',
    MEDICAL_CENTER = 'medical_center',
    MARKETING_DEPARTMENT = 'marketing_department',
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

export interface ClubLogoData {
    shape: 'shield' | 'circle' | 'square';
    icon: string; // Name of the lucide-react icon
    primaryColor: string;
    secondaryColor: string;
}

export interface Club {
    id: string;
    name: string;
    managerId: string;
    ownerId: string; 
    players: string[];
    budget: number;
    infrastructure: Partial<Record<InfrastructureType, InfrastructureItem>>;
    pendingUpgrades?: PendingUpgrade[];
    activeTeamTraining?: ActiveTeamTraining | null;
    pendingApplications?: string[]; 
    isAcceptingApplications?: boolean;
    activeTacticId?: TacticID;
    logo?: ClubLogoData; 
}

export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: number; 
  result?: string; 
  status: 'scheduled' | 'played';
  leagueId: string;
  season: number;
}

export interface MatchResult {
    fixtureId: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    events: string[];
}

export interface League {
    id: string;
    name: string;
    clubIds: string[];
    season: number;
}

export interface LeagueStanding {
    clubId: string;
    clubName: string;
    clubLogo: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    season: number;
}

export type View = 'home' | 'skills' | 'club' | 'activities' | 'staff' | 'finances' | 'match' | 'leaderboard' | 'club-search' | 'admin' | 'league' | 'profile' | 'shop' | 'equipment';
