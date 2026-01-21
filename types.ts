
export enum PlayerPosition {
  ST = 'Stürmer',
  MF = 'Mittelfeld',
  AW = 'Abwehr',
  TW = 'Torwart'
}

export enum UserRole {
  PLAYER = 'player',
  MANAGER = 'manager'
}

export enum SkillType {
  Shooting = 'Abschluss',
  Dribbling = 'Dribbling',
  Pace = 'Schnelligkeit',
  Heading = 'Kopfball',
  Finishing = 'Torinstinkt',
  Passing = 'Passspiel',
  Vision = 'Übersicht',
  BallControl = 'Ballkontrolle',
  Stamina = 'Ausdauer',
  Interception = 'Abfangen',
  Tackling = 'Zweikampf',
  Marking = 'Manndeckung',
  Strength = 'Kraft',
  SlideTackle = 'Grätsche',
  Positioning = 'Stellungsspiel',
  Reflexes = 'Reflexe',
  Diving = 'Hechten',
  Handling = 'Fangsicherheit',
  Kicking = 'Abschlag',
  GkPositioning = 'TW-Stellungsspiel'
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  position: PlayerPosition;
  roles: UserRole[];
  level: number;
  experience: number;
  skills: Partial<Record<SkillType, number>>;
  trainingPoints: number;
  clubId: string | null;
  lastActivities?: Record<string, number>;
}

export interface Infrastructure {
  stadium: number;
  trainingGround: number;
  medicalCenter: number;
  youthAcademy: number;
  marketingOffice: number;
}

export interface PendingUpgrade {
  type: keyof Infrastructure;
  startTime: number;
  endTime: number;
}

export interface Club {
  id: string;
  name: string;
  managerName: string;
  managerId: string;
  logo: string;
  players: string[];
  infrastructure: Infrastructure;
  pendingUpgrades: PendingUpgrade[];
  budget: number;
  trophies: number;
  lastTeamTraining?: number; // Timestamp
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: number; // Timestamp
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  commentary?: string;
  events?: string[];
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
}

export interface MatchResult {
  homeTeam: Club;
  awayTeam: Club;
  homeScore: number;
  awayScore: number;
  events: string[];
  commentary: string;
}

export type View = 'dashboard' | 'training' | 'club' | 'match' | 'activities' | 'management';
