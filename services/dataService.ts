import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import { Player, Club, Fixture, PlayerPosition, UserRole, PendingUpgrade, SkillType, ActiveActivity, Reward, InfrastructureType } from '../types';
import { ACTIVITIES, INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES } from '../constants';

const dataService = {
  // =========================================================================
  // PLAYER DATA
  // =========================================================================

  async createPlayer(uid: string, name: string, position: PlayerPosition): Promise<void> {
    const initialSkills: { [key in SkillType]?: number } = {};

    const playerRef = doc(db, 'players', uid);
    const newPlayer: Player = {
      id: uid,
      name,
      position,
      level: 1,
      experience: 0,
      trainingPoints: 5,
      clubId: null,
      roles: [UserRole.PLAYER],
      skills: initialSkills, // Start with an empty (but defined) skills object
      activeActivities: [],
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
        const cost = 1;

        if ((player.trainingPoints || 0) < cost) throw new Error("Not enough training points");

        const currentSkillLevel = (player.skills && player.skills[skill]) || 0;

        transaction.update(playerRef, {
            trainingPoints: player.trainingPoints - cost,
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
    const newActivity: ActiveActivity = {
      activityId,
      startTime: Date.now(),
    };

    await updateDoc(playerRef, {
      activeActivities: arrayUnion(newActivity)
    });
  },

  async completeActivity(playerId: string, activityId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw new Error("Player not found!");

        const player = playerDoc.data() as Player;
        const activityDefinition = ACTIVITIES.find(a => a.id === activityId);
        if (!activityDefinition) return;

        const activityToRemove = player.activeActivities?.find(a => a.activityId === activityId);
        if (!activityToRemove) return;

        // Prepare updates
        const updates: { [key: string]: any } = {};
        const reward = activityDefinition.reward;

        updates.experience = (player.experience || 0) + (reward.xp || 0);
        updates.trainingPoints = (player.trainingPoints || 0) + (reward.tp || 0);

        // If there are skill rewards, update them safely
        if (reward.skills) {
            for (const [skill, value] of Object.entries(reward.skills)) {
                const currentLevel = (player.skills && player.skills[skill as SkillType]) || 0;
                updates[`skills.${skill}`] = currentLevel + value;
            }
        }

        // Remove the completed activity
        updates.activeActivities = arrayRemove(activityToRemove);

        // Atomically apply all updates
        transaction.update(playerRef, updates);

        // Also update club budget if applicable
        if (reward.budgetGain && player.clubId) {
            const clubRef = doc(db, 'clubs', player.clubId);
            const clubDoc = await transaction.get(clubRef);
            if (clubDoc.exists()) {
                const currentBudget = clubDoc.data().budget || 0;
                transaction.update(clubRef, { budget: currentBudget + reward.budgetGain });
            }
        }
    });
},


  // =========================================================================
  // CLUB / INFRASTRUCTURE / FIXTURES
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

      if (club.budget < cost) throw new Error("Not enough budget");
      if (currentLevel >= 10) throw new Error("Max level reached");

      const newUpgrade: PendingUpgrade = {
        type,
        targetLevel: currentLevel + 1,
        startTime: Date.now(),
        endTime: Date.now() + duration * 1000,
      };

      transaction.update(clubRef, {
        budget: club.budget - cost,
        pendingUpgrades: arrayUnion(newUpgrade),
      });
    });
  },

  async completeInfrastructureUpgrades(clubId: string, upgrades: PendingUpgrade[]): Promise<void> {
    const clubRef = doc(db, 'clubs', clubId);
    await runTransaction(db, async (transaction) => {
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists()) return;
        const club = clubDoc.data() as Club;

        const updates: { [key: string]: any } = {
            pendingUpgrades: arrayRemove(...upgrades)
        };

        for (const upgrade of upgrades) {
            const currentLevel = club.infrastructure?.[upgrade.type]?.level || 0;
            updates[`infrastructure.${upgrade.type}.level`] = Math.max(currentLevel, upgrade.targetLevel);
        }

        transaction.update(clubRef, updates);
    });
  },

};

export { dataService };