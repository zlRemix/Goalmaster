import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, runTransaction, serverTimestamp, FieldValue, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Player, Club, Fixture, PlayerPosition, UserRole, PendingUpgrade, SkillType, ActiveActivity, Reward, InfrastructureType, ActiveTeamTraining, TeamTrainingSession } from '../types';
import { ACTIVITIES, INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, TEAM_TRAININGS } from '../constants';

const getNextHourlyTimestamp = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
};

const dataService = {
  // =========================================================================
  // PLAYER DATA
  // =========================================================================

  async createPlayer(uid: string, name: string, position: PlayerPosition): Promise<void> {
    const playerRef = doc(db, 'players', uid);
    const newPlayer: Player = {
      id: uid, name, position, clubId: null,
      level: 1, experience: 0, trainingPoints: 5,
      roles: [UserRole.PLAYER], skills: {},
      activeActivities: [],
      completedActivityIds: [],
      nextActivityReset: getNextHourlyTimestamp(),
    };
    await setDoc(playerRef, newPlayer);
  },

  listenToPlayer(uid: string, callback: (player: Player) => void): () => void {
    const playerRef = doc(db, 'players', uid);
    return onSnapshot(playerRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Player);
      }
    });
  },

  listenToPlayers(playerIds: string[], callback: (players: Player[]) => void): () => void {
    if (playerIds.length === 0) {
        callback([]);
        return () => {};
    }
    const playersRef = collection(db, 'players');
    const q = query(playersRef, where('id', 'in', playerIds));
    
    return onSnapshot(q, (snapshot) => {
        const players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
        callback(players);
    });
  },

  async updatePlayer(uid: string, updates: Partial<Player>): Promise<void> {
    const playerRef = doc(db, 'players', uid);
    await updateDoc(playerRef, updates);
  },

  async upgradeSkill(playerId: string, skill: SkillType): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw new Error("Player not found");

        const player = playerDoc.data() as Player;
        if ((player.trainingPoints || 0) < 1) throw new Error("Not enough training points");

        const currentSkillLevel = (player.skills && player.skills[skill]) || 0;
        transaction.update(playerRef, {
            trainingPoints: (player.trainingPoints || 0) - 1,
            [`skills.${skill}`]: currentSkillLevel + 1
        });
    });
  },

  // =========================================================================
  // ACTIVITIES
  // =========================================================================

   async startActivity(playerId: string, activityId: string): Promise<void> {
    const activity = ACTIVITIES.find(a => a.id === activityId);
    if (!activity) throw new Error("Activity not found");

    const playerRef = doc(db, 'players', playerId);
    const newActivity: ActiveActivity = { activityId, startTime: Date.now() };
    
    await updateDoc(playerRef, { activeActivities: [newActivity] });
  },

  async completeActivity(playerId: string, activityId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) return;

        const player = playerDoc.data() as Player;
        const def = ACTIVITIES.find(a => a.id === activityId);
        if (!def) return;

        const activityInstance = player.activeActivities?.[0];
        if (!activityInstance || activityInstance.activityId !== activityId) return;

        const updates: { [key: string]: any } = {};
        updates.experience = (player.experience || 0) + (def.reward.xp || 0);
        updates.trainingPoints = (player.trainingPoints || 0) + (def.reward.tp || 0);
        if (def.reward.skills) {
            for (const [skill, value] of Object.entries(def.reward.skills)) {
                updates[`skills.${skill}`] = ((player.skills?.[skill as SkillType]) || 0) + value;
            }
        }

        updates.activeActivities = []; 
        updates.completedActivityIds = arrayUnion(activityId);

        transaction.update(playerRef, updates);

        if (def.reward.budgetGain && player.clubId) {
            const clubRef = doc(db, 'clubs', player.clubId);
            transaction.get(clubRef).then(clubDoc => {
                if (clubDoc.exists()) {
                    const currentBudget = clubDoc.data().budget || 0;
                    transaction.update(clubRef, { budget: currentBudget + def.reward.budgetGain });
                }
            });
        }
    });
  },
  
  async resetCompletedActivities(playerId: string): Promise<void> {
      const playerRef = doc(db, 'players', playerId);
      await updateDoc(playerRef, {
          completedActivityIds: [],
          nextActivityReset: getNextHourlyTimestamp(),
      });
  },

  // =========================================================================
  // CLUB & TEAM TRAINING
  // =========================================================================

  listenToClubs(callback: (clubs: Club[]) => void): () => void {
    const clubsRef = collection(db, 'clubs');
    return onSnapshot(clubsRef, (snapshot) => {
      const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club));
      callback(clubs);
    });
  },

  async addPlayerToClub(clubId: string, playerId: string): Promise<void> {
    const clubRef = doc(db, 'clubs', clubId);
    const playerRef = doc(db, 'players', playerId);
    await Promise.all([
      updateDoc(clubRef, { players: arrayUnion(playerId) }),
      updateDoc(playerRef, { clubId: clubId })
    ]);
  },
  
  async startTeamTraining(clubId: string, trainingId: string): Promise<void> {
    const trainingDef = TEAM_TRAININGS.find(t => t.id === trainingId);
    if (!trainingDef) throw new Error("Team training not found");

    const clubRef = doc(db, 'clubs', clubId);
    const newTraining: ActiveTeamTraining = {
        trainingId,
        startTime: Date.now()
    };
    await updateDoc(clubRef, { activeTeamTraining: newTraining });
  },

  async completeTeamTraining(clubId: string, playerIds: string[], training: ActiveTeamTraining): Promise<void> {
      const trainingDef = TEAM_TRAININGS.find(t => t.id === training.trainingId);
      if (!trainingDef) return;
      
      const batch = writeBatch(db);
      
      // 1. Update all players with rewards
      for (const playerId of playerIds) {
          const playerRef = doc(db, 'players', playerId);
          // Note: In a real app, you might want to fetch player data first to avoid overwriting.
          // For this bulk update, we assume incrementing is safe.
          // A more robust way would be to use FieldValue.increment().
           const playerDoc = await getDoc(playerRef); 
            if (playerDoc.exists()) {
                const player = playerDoc.data() as Player;
                batch.update(playerRef, {
                    experience: (player.experience || 0) + (trainingDef.reward.xp || 0),
                    trainingPoints: (player.trainingPoints || 0) + (trainingDef.reward.tp || 0),
                });
            }
      }
      
      // 2. Reset active training on the club
      const clubRef = doc(db, 'clubs', clubId);
      batch.update(clubRef, { activeTeamTraining: null });
      
      // 3. Commit all changes
      await batch.commit();
  },

  // =========================================================================
  // INFRASTRUCTURE & FIXTURES
  // =========================================================================

  listenToFixtures(callback: (fixtures: Fixture[]) => void): () => void {
    const fixturesRef = collection(db, 'fixtures');
    return onSnapshot(fixturesRef, (snapshot) => {
      const fixtures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fixture));
      callback(fixtures);
    });
  },

  async startInfrastructureUpgrade(clubId: string, type: InfrastructureType): Promise<void> {
    const clubRef = doc(db, 'clubs', clubId);
    await runTransaction(db, async (transaction) => {
      const clubDoc = await transaction.get(clubRef);
      if (!clubDoc.exists()) throw new Error("Club not found");

      const club = clubDoc.data() as Club;
      const currentLevel = club.infrastructure?.[type]?.level || 0;
      const cost = INFRA_UPGRADE_COSTS[currentLevel];
      const duration = INFRA_UPGRADE_TIMES[currentLevel];

      if ((club.budget || 0) < cost) throw new Error("Not enough budget");
      if (currentLevel >= 10) throw new Error("Max level reached");

      const newUpgrade: PendingUpgrade = {
        type, targetLevel: currentLevel + 1,
        startTime: Date.now(), endTime: Date.now() + duration * 1000,
      };

      transaction.update(clubRef, {
        budget: (club.budget || 0) - cost,
        pendingUpgrades: arrayUnion(newUpgrade),
      });
    });
  },

  async completeInfrastructureUpgrades(clubId: string, upgrades: PendingUpgrade[]): Promise<void> {
    const clubRef = doc(db, 'clubs', clubId);
    await runTransaction(db, async (transaction) => {
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists()) return;

        const updates: { [key: string]: any } = { pendingUpgrades: arrayRemove(...upgrades) };
        for (const upgrade of upgrades) {
            updates[`infrastructure.${upgrade.type}.level`] = upgrade.targetLevel;
        }
        transaction.update(clubRef, updates);
    });
  },
};

export { dataService };