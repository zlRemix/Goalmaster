
import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Player, Club, View, SkillType, Fixture, InfrastructureType, PlayerPosition } from './types';
import { TEAM_TRAININGS } from './constants';
import { dataService } from './services/dataService';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrainingCenter } from './components/TrainingCenter';
import { ClubDashboard } from './components/ClubDashboard';
import { Activities as ActivitiesComponent } from './components/Activities';
import { Leaderboard } from './components/Leaderboard';
import { ClubSearch } from './components/ClubSearch';
import Login from './components/Login';
import ProfileSetup from './components/ProfileSetup';
import { getSkillsForPosition } from './utils';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeView, setActiveView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const selectedClub = useMemo(() => clubs.find(c => c.id === player?.clubId), [clubs, player?.clubId]);

  useEffect(() => {
    let playerUnsubscribe: (() => void) | null = null;
    let clubsUnsubscribe: (() => void) | null = null;
    let fixturesUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (playerUnsubscribe) playerUnsubscribe();
      if (clubsUnsubscribe) clubsUnsubscribe();
      if (fixturesUnsubscribe) fixturesUnsubscribe();

      setUser(firebaseUser);

      if (firebaseUser) {
        if (!clubsUnsubscribe) {
            clubsUnsubscribe = dataService.listenToClubs(setClubs);
        }
        if (!fixturesUnsubscribe) {
            fixturesUnsubscribe = dataService.listenToFixtures(setFixtures);
        }
        playerUnsubscribe = dataService.listenToPlayer(firebaseUser.uid, (p) => {
            setPlayer(p ? { ...p, id: firebaseUser.uid } : null);
            setLoading(false);
        });
      } else {
        setUser(null);
        setPlayer(null);
        setClubs([]);
        setFixtures([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (playerUnsubscribe) playerUnsubscribe();
      if (clubsUnsubscribe) clubsUnsubscribe();
      if (fixturesUnsubscribe) fixturesUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!player || !user) return;
    const gameTick = setInterval(() => {
        const now = Date.now();
        clubs.forEach(club => {
            const finishedUpgrades = club.pendingUpgrades?.filter(upg => now >= upg.endTime);
            if (finishedUpgrades?.length > 0) dataService.completeInfrastructureUpgrades(club.id, finishedUpgrades);
        });
        if (selectedClub?.activeTeamTraining && selectedClub.players) {
            const def = TEAM_TRAININGS.find(t => t.id === selectedClub.activeTeamTraining!.trainingId);
            if (def) {
                const endTime = selectedClub.activeTeamTraining!.startTime + def.durationSeconds * 1000;
                if (now >= endTime) {
                    dataService.completeTeamTraining(selectedClub.id, user.uid);
                }
            }
        }
    }, 1000);
    return () => clearInterval(gameTick);
  }, [player, user, clubs, selectedClub]);

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

  const handleProfileCreate = async (userId: string, name: string, position: PlayerPosition, wantsManagerRole: boolean, clubName?: string) => {
    await dataService.createPlayerAndClub(userId, name, position, wantsManagerRole, clubName);
  };

  const handleLogout = () => {
    signOut(auth);
  }

  const handleUpgrade = (clubId: string, type: InfrastructureType) => dataService.startInfrastructureUpgrade(clubId, type);
  const handleTrainSkill = (skill: SkillType) => { if (player) dataService.upgradeSkill(player.id, skill); };
  const handleStartActivity = (activityId: string) => { if(player) dataService.startActivity(player.id, activityId); };
  const handleCompleteActivity = (activityId: string) => { if(player) dataService.completeActivity(player.id, activityId); };
  const handleResetActivities = () => { if(player) dataService.resetCompletedActivities(player.id); };

  const { overallRating, xpNeeded, xpProgress } = useMemo(() => {
    if (!player) return { overallRating: 0, xpNeeded: 100, xpProgress: 0 };
    const skills = getSkillsForPosition(player.position);
    const total = skills.reduce((sum, s) => sum + (player.skills?.[s] || 0), 0);
    const overall = skills.length > 0 ? Math.round(total / skills.length) : 0;
    const needed = 100 + ((player.level || 1) - 1) * 50;
    return { overallRating: overall, xpNeeded: needed, xpProgress: (player.experience / needed) * 100 };
  }, [player]);

  const renderContent = () => {
    if (activeView === 'home') return <Dashboard player={player!} club={selectedClub} allClubs={clubs} overallRating={overallRating} xpProgress={xpProgress} xpNeeded={xpNeeded} />;
    if (activeView === 'skills') return <TrainingCenter player={player!} onTrain={handleTrainSkill} />;
    if (activeView === 'activities') return <ActivitiesComponent player={player!} onStart={handleStartActivity} onComplete={handleCompleteActivity} onReset={handleResetActivities} />;
    if (activeView === 'leaderboard') return <Leaderboard />;
    if (activeView === 'club-search') return <ClubSearch player={player!} />;
    if (activeView === 'club') {
      if (player?.clubId && !selectedClub) {
        return <div className="h-full flex items-center justify-center"><h1 className="text-emerald-500 font-black animate-pulse text-2xl">LADE VEREINSDATEN...</h1></div>;
      }
      return <ClubDashboard club={selectedClub || null} player={player!} setView={setActiveView} onUpgrade={handleUpgrade} />;
    }
    return null;
  };

  if (loading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center"><h1 className="text-emerald-500 font-black animate-pulse text-2xl">VERBINDE...</h1></div>;
  }

  if (!user) {
    return <Login />;
  }

  if (!player) {
    return <ProfileSetup userId={user.uid} onProfileCreate={handleProfileCreate} onLogout={handleLogout} />;
  }
  
  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans">
      <Sidebar 
        activeView={activeView} 
        setView={setActiveView} 
        roles={player.roles || []} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
      />
      <div className="md:ml-64 flex flex-col h-full">
        <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center">
          <h1 className="text-xl font-black text-white">Pro<span className="text-emerald-500">Soccer</span></h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/95">
          <div className="max-w-7xl mx-auto space-y-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
