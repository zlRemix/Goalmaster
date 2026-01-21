
import { Player, Club, Fixture } from '../types';
import { INITIAL_CLUBS } from '../constants';

const STORAGE_KEYS = {
  PLAYER: 'gm_player_data',
  CLUBS: 'gm_clubs_data',
  FIXTURES: 'gm_fixtures_data'
};

export const dataService = {
  generateId: () => Math.random().toString(36).substr(2, 9),

  getPlayer: (): Player | null => {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYER);
    return data ? JSON.parse(data) : null;
  },

  savePlayer: (player: Player) => {
    localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  },

  getClubs: (): Club[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLUBS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(INITIAL_CLUBS));
      return INITIAL_CLUBS;
    }
    return JSON.parse(data);
  },

  saveClubs: (clubs: Club[]) => {
    localStorage.setItem(STORAGE_KEYS.CLUBS, JSON.stringify(clubs));
  },

  getFixtures: (): Fixture[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FIXTURES);
    return data ? JSON.parse(data) : [];
  },

  saveFixtures: (fixtures: Fixture[]) => {
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(fixtures));
  },

  generateLeagueSchedule: (clubs: Club[]): Fixture[] => {
    const fixtures: Fixture[] = [];
    const teamCount = clubs.length;
    const rounds = teamCount - 1;
    const matchesPerRound = teamCount / 2;
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12, 0, 0);

    // Round Robin Circle Method
    const teamIndices = clubs.map((_, i) => i);
    
    const generateLeg = (isReturn: boolean) => {
      for (let r = 0; r < rounds; r++) {
        const roundDate = startDate.getTime() + (isReturn ? (r + rounds) : r) * 86400000;
        
        for (let m = 0; m < matchesPerRound; m++) {
          const homeIdx = teamIndices[m];
          const awayIdx = teamIndices[teamCount - 1 - m];
          
          fixtures.push({
            id: dataService.generateId(),
            homeTeamId: isReturn ? clubs[awayIdx].id : clubs[homeIdx].id,
            awayTeamId: isReturn ? clubs[homeIdx].id : clubs[awayIdx].id,
            date: roundDate,
            played: false
          });
        }
        
        // Rotate indices (keeping first one fixed)
        const last = teamIndices.pop()!;
        teamIndices.splice(1, 0, last);
      }
    };

    generateLeg(false); // Hinrunde
    generateLeg(true);  // Rückrunde
    
    return fixtures.sort((a, b) => a.date - b.date);
  }
};
