import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove, runTransaction, serverTimestamp, FieldValue, query, where, getDocs, writeBatch, documentId, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Player, Club, Fixture, PlayerPosition, UserRole, PendingUpgrade, SkillType, ActiveActivity, Reward, InfrastructureType, ActiveTeamTraining, Activity, EquipmentSlot } from '../types';
import { ACTIVITIES, INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES, TEAM_TRAININGS, MAX_CLUB_PLAYERS, XP_PER_SKILL_UPGRADE, SHOP_ITEMS, EQUIPMENT_ITEMS } from '../constants';

const getNextHourlyTimestamp = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now.getTime();
};

const getXpForSkillUpgrade = (currentSkillLevel: number): number => {
    const rank = Math.floor(currentSkillLevel / 100);
    return (1 + rank) * XP_PER_SKILL_UPGRADE;
};

const calculateActivityRewards = (player: Player, activity: Activity, club: Club | null) => {
    const playerUpdates: { [key: string]: any } = {};
    let totalXpGain = activity.reward.xp || 0;

    // --- TP BONUS CALCULATION ---
    let tpGain = activity.reward.tp || 0;
    if (activity.type === 'training' && club?.infrastructure?.training_ground?.level) {
        const trainingGroundLevel = club.infrastructure.training_ground.level;
        const tpBonus = (trainingGroundLevel * 2) / 100; // 2% per level
        tpGain = tpGain * (1 + tpBonus);
    }
    playerUpdates.trainingPoints = (player.trainingPoints || 0) + tpGain;

    // --- BUDGET BONUS CALCULATION ---
    let budgetGain = activity.reward.budgetGain || 0;
    if ((activity.type === 'pr' || activity.type === 'social') && club?.infrastructure?.marketing_department?.level) {
        const marketingDeptLevel = club.infrastructure.marketing_department.level;
        const prBonus = (marketingDeptLevel * 5) / 100; // 5% per level
        budgetGain = budgetGain * (1 + prBonus);
    }


    if (activity.reward.skills && typeof activity.reward.skills === 'object') {
        for (const [skill, value] of Object.entries(activity.reward.skills)) {
            if (typeof value === 'number' && value > 0) {
                const currentSkillLevel = player.skills?.[skill as SkillType] || 0;
                playerUpdates[`skills.${skill as SkillType}`] = currentSkillLevel + value;
                
                for (let i = 0; i < value; i++) {
                    totalXpGain += getXpForSkillUpgrade(currentSkillLevel + i);
                }
            }
        }
    }
    
    playerUpdates.experience = (player.experience || 0) + totalXpGain;

    return { playerUpdates, budgetGain };
};

const dataService = {
  async createPlayerAndClub(uid: string, name: string, position: PlayerPosition, wantsManagerRole: boolean, clubName?: string): Promise<void> {
    const playerQuery = query(collection(db, "players"), where("name", "==", name));
    const playerDocs = await getDocs(playerQuery);
    if (!playerDocs.empty) {
        throw new Error("Spielername ist bereits vergeben.");
    }

    if (wantsManagerRole && clubName) {
        const clubQuery = query(collection(db, "clubs"), where("name", "==", clubName));
        const clubDocs = await getDocs(clubQuery);
        if (!clubDocs.empty) {
            throw new Error("Vereinsname ist bereits vergeben.");
        }
    }
    
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', uid);
        let clubId: string | null = null;
        const roles = [UserRole.PLAYER];

        if (wantsManagerRole && clubName) {
            const clubRef = doc(collection(db, 'clubs'));
            const newClub: Club = {
                id: clubRef.id,
                name: clubName,
                managerId: uid,
                ownerId: uid,
                players: [uid],
                budget: 50000,
                infrastructure: {
                    stadium: { level: 0 },
                    training_ground: { level: 0 },
                    medical_center: { level: 0 },
                    marketing_department: { level: 0 },
                },
                pendingApplications: [],
                pendingUpgrades: [],
                activeTeamTraining: null,
            };
            transaction.set(clubRef, newClub);
            clubId = clubRef.id;
            roles.push(UserRole.MANAGER);
        }

        const newPlayer: Player = {
            id: uid,
            name,
            position,
            clubId,
            level: 1,
            experience: 0,
            trainingPoints: 5,
            euro: 100, // Initial euro for new players
            roles,
            skills: {},
            activeActivities: [],
            completedActivityIds: [],
            nextActivityReset: getNextHourlyTimestamp(),
            equipment: [],
            equipped: {},
        };
        transaction.set(playerRef, newPlayer);
    });
  },

  listenToPlayer(uid: string, callback: (player: Player | null) => void): () => void {
    const playerRef = doc(db, 'players', uid);
    return onSnapshot(playerRef, (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as Player : null);
    });
  },

  listenToPlayers(playerIds: string[], callback: (players: Player[]) => void): () => void {
    if (playerIds.length === 0) {
        callback([]);
        return () => {};
    }
    const q = query(collection(db, 'players'), where(documentId(), 'in', playerIds));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });
  },

  listenToAllPlayers(callback: (players: Player[]) => void): () => void {
    const q = query(collection(db, 'players'));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
    });
  },

  async updatePlayer(uid: string, updates: Partial<Player>): Promise<void> {
    await updateDoc(doc(db, 'players', uid), updates);
  },
  
  async purchaseShopItem(playerId: string, itemId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw new Error("Player not found");

        const player = playerDoc.data() as Player;
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) throw new Error("Item not found");

        if ((player.euro || 0) < item.price) {
            throw new Error("Not enough euro");
        }

        transaction.update(playerRef, {
            euro: (player.euro || 0) - item.price,
            trainingPoints: (player.trainingPoints || 0) + item.tp,
        });
    });
  },

  async purchaseEquipmentItem(playerId: string, itemId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw new Error("Player not found");

        const player = playerDoc.data() as Player;
        const item = EQUIPMENT_ITEMS.find(i => i.id === itemId);
        if (!item) throw new Error("Equipment item not found");

        if ((player.euro || 0) < item.price) {
            throw new Error("Nicht genug Euro");
        }
        if (player.equipment?.includes(itemId)) {
            throw new Error("Gegenstand bereits im Besitz");
        }

        transaction.update(playerRef, {
            euro: (player.euro || 0) - item.price,
            equipment: arrayUnion(itemId),
        });
    });
  },

  async equipItem(playerId: string, itemId: string, slot: EquipmentSlot): Promise<void> {
      await updateDoc(doc(db, 'players', playerId), {
          [`equipped.${slot}`]: itemId
      });
  },

  async unequipItem(playerId: string, slot: EquipmentSlot): Promise<void> {
      await updateDoc(doc(db, 'players', playerId), {
          [`equipped.${slot}`]: null
      });
  },

  async upgradeSkill(playerId: string, skill: SkillType): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const playerRef = doc(db, 'players', playerId);
      const playerDoc = await transaction.get(playerRef);
      if (!playerDoc.exists()) throw new Error("Spieler nicht gefunden");

      const player = playerDoc.data() as Player;
      const currentSkillLevel = player.skills?.[skill] || 0;
      const rank = Math.floor(currentSkillLevel / 100);
      const cost = 1 + rank * 2;

      if ((player.trainingPoints || 0) < cost) {
        throw new Error(`Nicht genügend Trainingspunkte. Benötigt: ${cost}`);
      }

      const xpGained = getXpForSkillUpgrade(currentSkillLevel);
      transaction.update(playerRef, {
        trainingPoints: (player.trainingPoints || 0) - cost,
        experience: (player.experience || 0) + xpGained, 
        [`skills.${skill}`]: currentSkillLevel + 1,
      });
    });
  },

   async startActivity(playerId: string, activityId: string): Promise<void> {
    const activity = ACTIVITIES.find(a => a.id === activityId);
    if (!activity) throw new Error("Activity not found");
    const newActivity: ActiveActivity = { activityId, startTime: Date.now() };
    await updateDoc(doc(db, 'players', playerId), { activeActivities: [newActivity] });
  },

  async completeActivity(playerId: string, activityId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const playerRef = doc(db, 'players', playerId);
        const playerDoc = await transaction.get(playerRef);
        if (!playerDoc.exists()) throw new Error(`Player ${playerId} not found.`);
        
        const player = playerDoc.data() as Player;
        const activityDef = ACTIVITIES.find(a => a.id === activityId);
        if (!activityDef) throw new Error(`Activity definition ${activityId} not found.`);

        const activityInstance = player.activeActivities?.[0];
        if (!activityInstance || activityInstance.activityId !== activityId) return;

        let club: Club | null = null;
        if (player.clubId) {
            const clubRef = doc(db, 'clubs', player.clubId);
            const clubDoc = await transaction.get(clubRef);
            if (clubDoc.exists()) {
                club = clubDoc.data() as Club;
            }
        }
        
        const { playerUpdates, budgetGain } = calculateActivityRewards(player, activityDef as Activity, club);
        playerUpdates.activeActivities = []; 
        playerUpdates.completedActivityIds = arrayUnion(activityId);
        transaction.update(playerRef, playerUpdates);

        if (budgetGain > 0 && club) {
            const clubRef = doc(db, 'clubs', club.id);
            transaction.update(clubRef, { budget: (club.budget || 0) + budgetGain });
        }
    });
  },
  
  async resetCompletedActivities(playerId: string): Promise<void> {
      await updateDoc(doc(db, 'players', playerId), {
          completedActivityIds: [],
          nextActivityReset: getNextHourlyTimestamp(),
      });
  },

  listenToClub(clubId: string, callback: (club: Club | null) => void): () => void {
    return onSnapshot(doc(db, 'clubs', clubId), (doc) => {
        callback(doc.exists() ? { id: doc.id, ...doc.data() } as Club : null);
    });
  },

  listenToClubs(callback: (clubs: Club[]) => void): () => void {
    const q = query(collection(db, 'clubs'), where('ownerId', '!=', 'bot_owner'), orderBy('ownerId'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
    });
  },
  
  listenToAllClubs(callback: (clubs: Club[]) => void): () => void {
    const q = query(collection(db, 'clubs'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
    });
  },

  async updateClub(clubId: string, updates: Partial<Club>): Promise<void> {
    await updateDoc(doc(db, 'clubs', clubId), updates);
  },

  async addPlayerToClub(clubId: string, playerId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const clubRef = doc(db, 'clubs', clubId);
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists()) throw new Error("Club not found");
        const club = clubDoc.data() as Club;
        if ((club.players?.length || 0) >= MAX_CLUB_PLAYERS) throw new Error("Club is full");

        transaction.update(clubRef, { players: arrayUnion(playerId) });
        transaction.update(doc(db, 'players', playerId), { clubId: clubId });
    });
  },
  
  async startTeamTraining(clubId: string, trainingId: string): Promise<void> {
    const trainingDef = TEAM_TRAININGS.find(t => t.id === trainingId);
    if (!trainingDef) throw new Error("Team training not found");
    await updateDoc(doc(db, 'clubs', clubId), { activeTeamTraining: { trainingId, startTime: Date.now() } });
  },

  async completeTeamTraining(clubId: string, uid: string): Promise<void> {
    await httpsCallable(functions, 'completeTeamTraining')({ clubId, uid });
  },

  async applyToClub(playerId: string, clubId: string): Promise<void> {
    await httpsCallable(functions, 'applyToClub')({ clubId });
  },

  async cancelApplication(playerId: string, clubId: string): Promise<void> {
    await updateDoc(doc(db, 'clubs', clubId), { pendingApplications: arrayRemove(playerId) });
  },

  async invitePlayer(clubId: string, playerId: string): Promise<void> {
    await updateDoc(doc(db, 'players', playerId), { pendingClubInvitation: clubId });
  },

  async cancelInvitation(playerId: string): Promise<void> {
    await updateDoc(doc(db, 'players', playerId), { pendingClubInvitation: null });
  },

  async rejectApplication(clubId: string, playerId: string): Promise<void> {
    await this.cancelApplication(playerId, clubId);
  },

  async rejectClubInvitation(playerId: string): Promise<void> {
    await this.cancelInvitation(playerId);
  },

  async acceptApplication(clubId: string, playerId: string): Promise<void> {
    await runTransaction(db, async (transaction) => {
        const clubRef = doc(db, 'clubs', clubId);
        const clubDoc = await transaction.get(clubRef);
        if (!clubDoc.exists()) throw new Error("Club not found");
        if ((clubDoc.data().players?.length || 0) >= MAX_CLUB_PLAYERS) throw new Error("Der Verein ist voll");

        transaction.update(clubRef, { players: arrayUnion(playerId), pendingApplications: arrayRemove(playerId) });
        transaction.update(doc(db, 'players', playerId), { clubId: clubId });
    });
  },

  async acceptClubInvitation(playerId: string, clubId: string): Promise<void> {
     await runTransaction(db, async (transaction) => {
      const clubRef = doc(db, 'clubs', clubId);
      const clubDoc = await transaction.get(clubRef);
      if (!clubDoc.exists()) throw new Error("Club not found");
      if ((clubDoc.data().players?.length || 0) >= MAX_CLUB_PLAYERS) throw new Error("Club is full");

      transaction.update(clubRef, { players: arrayUnion(playerId) });
      transaction.update(doc(db, 'players', playerId), { clubId: clubId, pendingClubInvitation: null });
    });
  },

  listenToFixtures(callback: (fixtures: Fixture[]) => void): () => void {
    return onSnapshot(collection(db, 'fixtures'), (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fixture)));
    });
  },

  async startInfrastructureUpgrade(clubId: string, type: InfrastructureType): Promise<void> {
    await runTransaction(db, async (transaction) => {
      const clubRef = doc(db, 'clubs', clubId);
      const clubDoc = await transaction.get(clubRef);
      if (!clubDoc.exists()) throw new Error("Club not found");

      const club = clubDoc.data() as Club;
      const currentLevel = club.infrastructure?.[type]?.level || 0;
      const cost = INFRA_UPGRADE_COSTS[currentLevel];
      const duration = INFRA_UPGRADE_TIMES[currentLevel];

      if ((club.budget || 0) < cost) throw new Error("Not enough budget");
      if (currentLevel >= 10) throw new Error("Max level reached");

      const newUpgrade: PendingUpgrade = {
        type, 
        targetLevel: currentLevel + 1,
        startTime: Date.now(), 
        endTime: Date.now() + duration * 1000,
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
            if (upgrade.targetLevel !== null && upgrade.targetLevel !== undefined) {
                updates[`infrastructure.${upgrade.type}.level`] = upgrade.targetLevel;
            }
        }
        transaction.update(clubRef, updates);
    });
  },
};

export { dataService };