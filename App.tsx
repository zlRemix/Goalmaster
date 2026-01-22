import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Player, Club, View, SkillType, Fixture, ActiveActivity, InfrastructureType } from './types';
import { ACTIVITIES, SKILL_UPGRADE_COST } from './constants';
import { dataService } from './services/dataService';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrainingCenter } from './components/TrainingCenter';
import { ClubDashboard } from './components/ClubDashboard';
import { Activities as ActivitiesComponent } from './components/Activities';
import Login from './components/Login';
import { getSkillsForPosition } from './utils';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeView, setActiveView] = useState<View>('home');
  const [isInitializing, setIsInitializing] = useState(true);

  // --- Core Auth Listening --- //
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null); setPlayer(null); setClubs([]); setFixtures([]); setIsInitializing(false);
      }
    });
    return () => authUnsubscribe();
  }, []);

  // --- Data Listening --- //
  useEffect(() => {
    if (!user) return;

    const playerUnsubscribe = dataService.listenToPlayer(user.uid, (p) => {
      setPlayer(p);
      if (isInitializing) setIsInitializing(false);
    });

    const clubsUnsubscribe = dataService.listenToClubs(setClubs);
    const fixturesUnsubscribe = dataService.listenToFixtures(setFixtures);

    return () => { playerUnsubscribe(); clubsUnsubscribe(); fixturesUnsubscribe(); };
  }, [user, isInitializing]);

  // --- Game Logic Side Effects --- //
  useEffect(() => {
    if (!player || !user) return;

    // 1. LEVEL-UP LOGIC
    if (player.experience != null && player.level != null) {
      let xpNeededForLevelUp = 100 + (player.level - 1) * 50;
      if (player.experience >= xpNeededForLevelUp) {
          let playerAfterLevelUp = { ...player };
          while (playerAfterLevelUp.experience >= xpNeededForLevelUp) {
              playerAfterLevelUp.experience -= xpNeededForLevelUp;
              playerAfterLevelUp.level += 1;
              playerAfterLevelUp.trainingPoints = (playerAfterLevelUp.trainingPoints || 0) + 5;
              xpNeededForLevelUp = 100 + (playerAfterLevelUp.level - 1) * 50;
          }
          dataService.updatePlayer(user.uid, playerAfterLevelUp);
      }
    }

    // 2. ACTIVITY COMPLETION
    const activityTick = setInterval(() => {
      const now = Date.now();
      const finishedActivity = player.activeActivities?.find(active => {
          const definition = ACTIVITIES.find(a => a.id === active.activityId);
          return definition && now >= active.startTime + definition.durationSeconds * 1000;
      });
      if (finishedActivity) {
          dataService.completeActivity(player.id, finishedActivity.activityId);
      }
    }, 1000);

    // 3. CLUB UPGRADE COMPLETION
    const upgradeTick = setInterval(() => {
        const now = Date.now();
        clubs.forEach(club => {
            const finishedUpgrades = club.pendingUpgrades?.filter(upg => now >= upg.endTime);
            if (finishedUpgrades && finishedUpgrades.length > 0) {
                dataService.completeInfrastructureUpgrades(club.id, finishedUpgrades);
            }
        });
    }, 5000);


    return () => {
        clearInterval(activityTick);
        clearInterval(upgradeTick);
    }

  }, [player, user, clubs]);


  // --- UI Handlers --- //
  const handleSetView = (view: View) => setActiveView(view);
  const handleLogout = () => signOut(auth);
  
  const handleJoinClub = (clubId: string) => {
    if(!user || !player) return;
    dataService.addPlayerToClub(clubId, player.id);
    setActiveView('club');
  };

  const handleUpgrade = (clubId: string, type: InfrastructureType) => {
     dataService.startInfrastructureUpgrade(clubId, type);
  };
  
  const handleTrainSkill = (skill: SkillType) => {
    if (!player) return;
    dataService.upgradeSkill(player.id, skill);
  };

  const startActivity = (activityId: string) => {
    if (!player) return;
    dataService.startActivity(player.id, activityId);
  };

  // --- Derived State & Calculations (Memoized) --- //
  const selectedClub = useMemo(() => clubs.find(c => c.id === player?.clubId), [clubs, player?.clubId]);

  const { overallRating, xpNeeded, xpProgress } = useMemo(() => {
    if (!player) return { overallRating: 0, xpNeeded: 100, xpProgress: 0 };
    
    const relevantSkills = getSkillsForPosition(player.position as string);
    
    // Safely calculate total skill, ensuring player.skills and individual skills exist
    const totalSkill = relevantSkills.reduce((sum, s) => sum + ((player.skills && player.skills[s]) || 0), 0);
    
    const overall = relevantSkills.length > 0 ? Math.round(totalSkill / relevantSkills.length) : 0;
    
    const level = player.level || 1;
    const experience = player.experience || 0;
    const needed = 100 + (level - 1) * 50;
    const progress = needed > 0 ? (experience / needed) * 100 : 0;

    return { overallRating: overall, xpNeeded: needed, xpProgress: progress };
  }, [player]);

  // --- Render Logic --- //
  if (isInitializing) return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="text-emerald-500 font-black animate-pulse text-2xl">VERBINDE MIT SERVER...</div></div>;
  if (!user) return <Login />;
  if (!player) return <div className="h-screen bg-slate-950 flex items-center justify-center"><div className="text-amber-500 font-black animate-pulse text-2xl">ERSTELLE SPIELERPROFIL...</div></div>;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* CRASH FIX: Provide a default empty array for roles if it's null/undefined */}
      <Sidebar activeView={activeView} setView={handleSetView} roles={player.roles || []} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-8">
          {activeView === 'home' && <Dashboard player={player} club={selectedClub} overallRating={overallRating} xpProgress={xpProgress} xpNeeded={xpNeeded} />}
          {activeView === 'skills' && <TrainingCenter player={player} onTrain={handleTrainSkill} />}
          {activeView === 'club' && 
            <ClubDashboard 
              club={selectedClub || null}
              player={player} 
              onJoin={handleJoinClub}
              availableClubs={clubs.filter(c => !c.players || c.players.length < 25)}
              onUpgrade={handleUpgrade}
            />
          }
          {activeView === 'activities' && <ActivitiesComponent player={player} onStart={startActivity} />}
        </div>
      </main>
    </div>
  );
};

export default App;
