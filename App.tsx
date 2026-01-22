import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Player, Club, View, SkillType, Fixture, ActiveActivity, InfrastructureType, UserRole } from './types';
import { ACTIVITIES, TEAM_TRAININGS } from './constants';
import { dataService } from './services/dataService';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrainingCenter } from './components/TrainingCenter';
import { ClubDashboard } from './components/ClubDashboard';
import { Activities as ActivitiesComponent } from './components/Activities';
import Login from './components/Login';
import { getSkillsForPosition } from './utils';
import { Menu, X } from 'lucide-react'; // Using icons for the menu button

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeView, setActiveView] = useState<View>('home');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // <-- NEW: State for mobile sidebar

  const selectedClub = useMemo(() => clubs.find(c => c.id === player?.clubId), [clubs, player?.clubId]);

  // --- Core Auth & Data Listening --- //
  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else { setUser(null); setPlayer(null); setClubs([]); setFixtures([]); setIsInitializing(false); }
    });
    return () => authUnsubscribe();
  }, []);

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

  // --- Game Logic Side Effects (Ticks & Updates) --- //
  useEffect(() => {
    if (!player || !user) return;
    const gameTick = setInterval(() => {
      const now = Date.now();
      // Individual activities
      if (player.activeActivities?.length > 0) {
        const active = player.activeActivities[0];
        const def = ACTIVITIES.find(a => a.id === active.activityId);
        if (def && now >= active.startTime + def.durationSeconds * 1000) dataService.completeActivity(player.id, active.activityId);
      }
      // Infrastructure upgrades
      clubs.forEach(club => {
        const finishedUpgrades = club.pendingUpgrades?.filter(upg => now >= upg.endTime);
        if (finishedUpgrades?.length > 0) dataService.completeInfrastructureUpgrades(club.id, finishedUpgrades);
      });
      // Team training
      if (selectedClub?.activeTeamTraining) {
        const def = TEAM_TRAININGS.find(t => t.id === selectedClub.activeTeamTraining!.trainingId);
        if (def) {
          const endTime = selectedClub.activeTeamTraining!.startTime + def.durationSeconds * 1000;
          if (now >= endTime) dataService.completeTeamTraining(selectedClub.id, selectedClub.players, selectedClub.activeTeamTraining!);
        }
      }
      // Activity reset
      if (now >= (player.nextActivityReset || 0)) dataService.resetCompletedActivities(player.id);
    }, 1000);
    return () => clearInterval(gameTick);
  }, [player, user, clubs, selectedClub]);

  // --- Level-Up Logic --- //
  useEffect(() => {
    if (!player || !user || player.experience == null) return;
    let xpNeeded = 100 + ((player.level || 1) - 1) * 50;
    if (player.experience >= xpNeeded) {
      let pAfterLvlUp = { ...player };
      while (pAfterLvlUp.experience >= xpNeeded) {
        pAfterLvlUp.experience -= xpNeeded;
        pAfterLvlUp.level = (pAfterLvlUp.level || 1) + 1;
        pAfterLvlUp.trainingPoints = (pAfterLvlUp.trainingPoints || 0) + 5;
        xpNeeded = 100 + (pAfterLvlUp.level - 1) * 50;
      }
      dataService.updatePlayer(user.uid, pAfterLvlUp);
    }
  }, [player?.experience, player?.level, user?.uid]);

  // --- UI Handlers --- //
  const handleJoinClub = (clubId: string) => {
    if(!user || !player) return;
    dataService.addPlayerToClub(clubId, player.id).then(() => setActiveView('club'));
  };
  const handleUpgrade = (clubId: string, type: InfrastructureType) => dataService.startInfrastructureUpgrade(clubId, type);
  const handleTrainSkill = (skill: SkillType) => { if (player) dataService.upgradeSkill(player.id, skill); };
  const startActivity = (activityId: string) => { if (player && player.activeActivities?.length === 0) dataService.startActivity(player.id, activityId); };

  // --- Derived State (Memoized) --- //
  const { overallRating, xpNeeded, xpProgress } = useMemo(() => {
    if (!player) return { overallRating: 0, xpNeeded: 100, xpProgress: 0 };
    const skills = getSkillsForPosition(player.position);
    const total = skills.reduce((sum, s) => sum + (player.skills?.[s] || 0), 0);
    const overall = skills.length > 0 ? Math.round(total / skills.length) : 0;
    const needed = 100 + ((player.level || 1) - 1) * 50;
    return { overallRating: overall, xpNeeded: needed, xpProgress: (player.experience / needed) * 100 };
  }, [player]);

  // --- Render Logic --- //
  if (isInitializing) return <div className="h-screen bg-slate-950 flex items-center justify-center"><h1 className="text-emerald-500 font-black animate-pulse text-2xl">VERBINDE...</h1></div>;
  if (!user) return <Login />;
  if (!player) return <div className="h-screen bg-slate-950 flex items-center justify-center"><h1 className="text-amber-500 font-black animate-pulse text-2xl">LADE PROFIL...</h1></div>;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar 
        activeView={activeView} 
        setView={setActiveView} 
        roles={player.roles || []} 
        onLogout={() => signOut(auth)} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="md:ml-64 flex flex-col h-full">
        {/* --- Mobile Header --- */}
        <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
           <h1 className="text-xl font-black text-white">Pro<span className="text-emerald-500">Soccer</span></h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/95">
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
    </div>
  );
};

export default App;
