import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Player, Club, View, SkillType, Fixture, InfrastructureType, PlayerPosition, UserRole } from './types';
import { TEAM_TRAININGS, EQUIPMENT_ITEMS } from './constants';
import { dataService } from './services/dataService';
import { auth } from './services/firebase';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrainingCenter } from './components/TrainingCenter';
import { ClubDashboard } from './components/ClubDashboard';
import { Activities as ActivitiesComponent } from './components/Activities';
import { Leaderboard } from './components/Leaderboard';
import { ClubSearch } from './components/ClubSearch';
import { Shop } from './components/Shop';
import Login from './components/Login';
import ProfileSetup from './components/ProfileSetup';
import { getSkillsForPosition } from './utils';
import { Menu } from 'lucide-react';
import LeagueManagement from './components/LeagueManagement';
import LeagueView from './components/LeagueView';
import UserProfile from './components/UserProfile';
import { ClubManagement } from './components/ClubManagement';
import Impressum from './components/Impressum';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import ConsentNotice from './components/ConsentNotice';
import Footer from './components/Footer';

const calculateXpNeeded = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeView, setActiveView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let playerUnsubscribe: (() => void) | null = null;
    let clubUnsubscribe: (() => void) | null = null;
    let allClubsUnsubscribe: (() => void) | null = null;
    let allPlayersUnsubscribe: (() => void) | null = null;
    let fixturesUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      playerUnsubscribe?.();
      clubUnsubscribe?.();
      allClubsUnsubscribe?.();
      allPlayersUnsubscribe?.();
      fixturesUnsubscribe?.();

      setUser(firebaseUser);

      if (firebaseUser) {
        allClubsUnsubscribe = dataService.listenToAllClubs(setAllClubs);
        allPlayersUnsubscribe = dataService.listenToAllPlayers(setAllPlayers);
        fixturesUnsubscribe = dataService.listenToFixtures(setFixtures);

        playerUnsubscribe = dataService.listenToPlayer(firebaseUser.uid, (p) => {
          setPlayer(p ? { ...p, id: firebaseUser.uid } : null);

          if (p?.clubId) {
            clubUnsubscribe = dataService.listenToClub(p.clubId, setSelectedClub);
          } else {
            setSelectedClub(null);
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setPlayer(null);
        setSelectedClub(null);
        setAllClubs([]);
        setAllPlayers([]);
        setFixtures([]);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      playerUnsubscribe?.();
      clubUnsubscribe?.();
      allClubsUnsubscribe?.();
      allPlayersUnsubscribe?.();
      fixturesUnsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!player || !user || !selectedClub || !selectedClub.pendingUpgrades) return;
    const gameTick = setInterval(() => {
        const now = Date.now();
        const finishedUpgrades = selectedClub.pendingUpgrades!.filter(upg => now >= upg.endTime);
        if (finishedUpgrades?.length > 0) {
            // dataService.completeInfrastructureUpgrades(selectedClub.id, finishedUpgrades);
        }

        if (selectedClub.activeTeamTraining && selectedClub.players) {
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
  }, [player, user, selectedClub]);

  useEffect(() => {
    if (!player || !user || typeof player.experience !== 'number') return;

    let xpNeeded = calculateXpNeeded(player.level || 1);
    
    if (player.experience >= xpNeeded) {
      let playerAfterLvlUp = { ...player };

      while (playerAfterLvlUp.experience >= xpNeeded) {
        playerAfterLvlUp.experience -= xpNeeded;
        playerAfterLvlUp.level = (playerAfterLvlUp.level || 1) + 1;
        playerAfterLvlUp.trainingPoints = (playerAfterLvlUp.trainingPoints || 0) + 5;
        xpNeeded = calculateXpNeeded(playerAfterLvlUp.level);
      }

      dataService.updatePlayer(user.uid, playerAfterLvlUp);
    }
  }, [player?.experience, player?.level, user?.uid]);

  const playerSkillsWithBonuses = useMemo(() => {
      if (!player) return {};
      const finalSkills = { ...(player.skills || {}) };
      if (player.equipped) {
          for (const slot in player.equipped) {
              const itemId = player.equipped[slot as keyof typeof player.equipped];
              if (itemId) {
                  const item = EQUIPMENT_ITEMS.find(i => i.id === itemId);
                  if (item) {
                      for (const skill in item.bonus) {
                          const s = skill as SkillType;
                          const currentSkill = finalSkills[s] || 0;
                          const bonus = item.bonus[s] || 0;
                          finalSkills[s] = currentSkill + bonus;
                      }
                  }
              }
          }
      }
      return finalSkills;
  }, [player]);

  const playersInClub = useMemo(() => {
      if (!selectedClub) return [];
      return allPlayers.filter(p => p.clubId === selectedClub.id);
  }, [allPlayers, selectedClub]);

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
    const skillsForPosition = getSkillsForPosition(player.position);
    const total = skillsForPosition.reduce((sum, s) => sum + (playerSkillsWithBonuses[s] || 0), 0);
    const overall = skillsForPosition.length > 0 ? Math.round(total / skillsForPosition.length) : 0;
    const needed = calculateXpNeeded(player.level || 1);
    const progress = player.experience > 0 ? (player.experience / needed) * 100 : 0;
    return { 
      overallRating: overall, 
      xpNeeded: needed, 
      xpProgress: Math.min(100, progress)
    };
  }, [player, playerSkillsWithBonuses]);

  const renderContent = () => {
    if (activeView === 'home') return <Dashboard player={player!} club={selectedClub} allClubs={allClubs} overallRating={overallRating} xpProgress={xpProgress} xpNeeded={xpNeeded} setView={setActiveView} />;
    if (activeView === 'profile') return <UserProfile />;
    if (activeView === 'skills') return <TrainingCenter player={{...player!, skills: playerSkillsWithBonuses}} onTrain={handleTrainSkill} />;
    if (activeView === 'activities') return <ActivitiesComponent player={player!} onStart={handleStartActivity} onComplete={handleCompleteActivity} onReset={handleResetActivities} />;
    if (activeView === 'leaderboard') return <Leaderboard />;
    if (activeView === 'club-search') return <ClubSearch player={player!} />;
    if (activeView === 'league') return <LeagueView />;
    if (activeView === 'shop') return <Shop player={player!} />;
    if (activeView === 'club-management') return <ClubManagement club={selectedClub!} />;
    if (activeView === 'impressum') return <Impressum />;
    if (activeView === 'privacy') return <Privacy />;
    if (activeView === 'terms') return <Terms />;

    if (activeView === 'admin') {
      return (
        <div className="space-y-12">
          <LeagueManagement />
        </div>
      );
    }

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
        <Footer setView={setActiveView} />
      </div>
      <ConsentNotice />
    </div>
  );
};

export default App;
