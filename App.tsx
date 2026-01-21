
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Club, View, SkillType, MatchResult, PlayerPosition, UserRole, Fixture, PendingUpgrade } from './types';
import { POSITION_SKILLS, INFRA_UPGRADE_COSTS, INFRA_UPGRADE_TIMES } from './constants';
import { dataService } from './services/dataService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TrainingCenter } from './components/TrainingCenter';
import { ClubDashboard } from './components/ClubDashboard';
import { MatchCenter } from './components/MatchCenter';
import { Activities } from './components/Activities';

const App: React.FC = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [lastMatch, setLastMatch] = useState<MatchResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Registration state
  const [regRole, setRegRole] = useState<UserRole[] | null>(null);

  useEffect(() => {
    const savedPlayer = dataService.getPlayer();
    const savedClubs = dataService.getClubs();
    let savedFixtures = dataService.getFixtures();

    setPlayer(savedPlayer);
    setClubs(savedClubs);

    if (savedFixtures.length === 0 && savedClubs.length >= 2) {
      savedFixtures = dataService.generateLeagueSchedule(savedClubs);
      dataService.saveFixtures(savedFixtures);
    }
    setFixtures(savedFixtures);
    setIsInitializing(false);
  }, []);

  // Tick for pending upgrades
  useEffect(() => {
    const upgradeTick = setInterval(() => {
      const now = Date.now();
      let changed = false;
      
      const updatedClubs = clubs.map(club => {
        if (!club.pendingUpgrades || club.pendingUpgrades.length === 0) return club;
        
        const finished = club.pendingUpgrades.filter(u => now >= u.endTime);
        if (finished.length === 0) return club;
        
        changed = true;
        const newInfra = { ...club.infrastructure };
        finished.forEach(u => {
          newInfra[u.type] = (newInfra[u.type] || 1) + 1;
        });
        
        return {
          ...club,
          infrastructure: newInfra,
          pendingUpgrades: club.pendingUpgrades.filter(u => now < u.endTime)
        };
      });

      if (changed) setClubs(updatedClubs);
    }, 5000);
    
    return () => clearInterval(upgradeTick);
  }, [clubs]);

  // Level Up logic
  const getXpForNextLevel = (level: number) => Math.floor(100 * Math.pow(level, 1.5));

  useEffect(() => {
    if (player && player.roles.includes(UserRole.PLAYER)) {
      const xpNeeded = getXpForNextLevel(player.level);
      if (player.experience >= xpNeeded) {
        setPlayer(prev => prev ? ({
          ...prev,
          level: prev.level + 1,
          experience: prev.experience - xpNeeded,
          trainingPoints: prev.trainingPoints + 50 // Level Up Bonus
        }) : null);
        console.log("LEVEL UP!");
      }
    }
  }, [player?.experience]);

  useEffect(() => {
    if (player) {
      dataService.savePlayer(player);
      if (activeView === 'club' && !selectedClubId) {
        setSelectedClubId(player.clubId);
      }
    }
  }, [player, activeView, selectedClubId]);

  useEffect(() => {
    if (clubs.length > 0) dataService.saveClubs(clubs);
  }, [clubs]);

  useEffect(() => {
    if (fixtures.length > 0) dataService.saveFixtures(fixtures);
  }, [fixtures]);

  useEffect(() => {
    const checkFixtures = setInterval(() => {
      const now = Date.now();
      const pendingFixtures = fixtures.filter(f => !f.played && now >= f.date);
      pendingFixtures.forEach(f => runMatchSimulation(f.id));
    }, 5000);
    return () => clearInterval(checkFixtures);
  }, [fixtures]);

  const playerStats = useMemo(() => {
    if (!player || !player.roles.includes(UserRole.PLAYER)) return { overallRating: 0, xpProgress: 0, xpNeeded: 100 };
    const relevantSkills = POSITION_SKILLS[player.position];
    const totalSkill = relevantSkills.reduce((a, s) => a + (player.skills[s] || 0), 0);
    const overallRating = Math.floor(totalSkill / relevantSkills.length);
    const xpNeeded = getXpForNextLevel(player.level);
    const xpProgress = (player.experience / xpNeeded) * 100;
    return { overallRating, xpProgress, xpNeeded };
  }, [player]);

  const handleRegister = (
    name: string, 
    position: PlayerPosition, 
    roles: UserRole[], 
    clubName?: string, 
    clubLogo?: string
  ) => {
    const playerId = dataService.generateId();
    let createdClubId: string | null = null;
    let updatedClubs = [...clubs];

    if (roles.includes(UserRole.MANAGER) && clubName) {
      const dummyIndex = updatedClubs.findIndex(c => c.managerId.startsWith('ai_'));
      const clubId = dummyIndex !== -1 ? updatedClubs[dummyIndex].id : dataService.generateId();
      
      const newClub: Club = {
        id: clubId,
        name: clubName,
        logo: clubLogo || '⚽',
        managerId: playerId,
        managerName: name,
        players: roles.includes(UserRole.PLAYER) ? [playerId] : [],
        budget: 75000,
        trophies: 0,
        pendingUpgrades: [],
        infrastructure: { stadium: 1, trainingGround: 1, medicalCenter: 1, youthAcademy: 1, marketingOffice: 1 }
      };

      if (dummyIndex !== -1) updatedClubs[dummyIndex] = newClub;
      else updatedClubs.push(newClub);
      
      createdClubId = clubId;
      setClubs(updatedClubs);
      const newFixtures = dataService.generateLeagueSchedule(updatedClubs);
      setFixtures(newFixtures);
    } else {
      const targetClub = clubs.find(c => c.players.length < 5);
      createdClubId = targetClub ? targetClub.id : null;
      if (createdClubId) {
        updatedClubs = updatedClubs.map(c => c.id === createdClubId ? { ...c, players: [...c.players, player.id] } : c);
        setClubs(updatedClubs);
      }
    }

    const newPlayer: Player = {
      id: playerId,
      name,
      position,
      roles,
      avatar: `https://picsum.photos/seed/${playerId}/200/200`,
      level: 1,
      experience: 0,
      trainingPoints: 30,
      clubId: createdClubId,
      skills: {}
    };

    if (roles.includes(UserRole.PLAYER)) {
      POSITION_SKILLS[position].forEach(s => newPlayer.skills[s] = 20);
    }
    setPlayer(newPlayer);
  };

  const trainSkill = (skill: SkillType) => {
    if (player && player.trainingPoints > 0) {
      setPlayer({
        ...player,
        trainingPoints: player.trainingPoints - 1,
        skills: { ...player.skills, [skill]: (player.skills[skill] || 0) + 1 },
        experience: player.experience + 5 
      });
    }
  };

  const completeActivity = useCallback((id: string, tp: number) => {
    setPlayer(prev => prev ? ({
      ...prev,
      trainingPoints: prev.trainingPoints + tp,
      experience: prev.experience + (tp * 2),
      lastActivities: { ...(prev.lastActivities || {}), [id]: Date.now() }
    }) : null);
  }, []);

  const upgradeInfra = (clubId: string, type: keyof Club['infrastructure']) => {
    setClubs(prev => prev.map(club => {
      if (club.id === clubId && (club.managerId === player?.id || player?.roles.includes(UserRole.MANAGER))) {
        const currentLevel = club.infrastructure[type];
        const isUpgrading = club.pendingUpgrades?.some(u => u.type === type);
        
        if (isUpgrading) return club;

        const cost = INFRA_UPGRADE_COSTS[currentLevel];
        const duration = INFRA_UPGRADE_TIMES[currentLevel];
        
        if (club.budget >= cost && currentLevel < 10) {
          const newUpgrade: PendingUpgrade = {
            type,
            startTime: Date.now(),
            endTime: Date.now() + duration
          };
          
          return { 
            ...club, 
            budget: club.budget - cost, 
            pendingUpgrades: [...(club.pendingUpgrades || []), newUpgrade]
          };
        }
      }
      return club;
    }));
  };

  const startTeamTraining = (clubId: string) => {
    setClubs(prev => prev.map(club => {
      if (club.id === clubId) {
        return { ...club, lastTeamTraining: Date.now() };
      }
      return club;
    }));
    if (player?.clubId === clubId) {
      setPlayer(p => p ? { ...p, trainingPoints: p.trainingPoints + 25, experience: p.experience + 50 } : null);
    }
  };

  const joinClub = (clubId: string) => {
    if (player) {
      const targetClub = clubs.find(c => c.id === clubId);
      if (targetClub && targetClub.players.length >= 5 && player.roles.includes(UserRole.PLAYER)) {
        alert("Dieser Verein ist bereits voll! (Max. 5 Spieler)");
        return;
      }
      const isManager = player.roles.includes(UserRole.MANAGER);
      setPlayer({ ...player, clubId });
      setSelectedClubId(clubId);
      setClubs(prev => prev.map(c => 
        c.id === clubId ? { 
          ...c, 
          players: player.roles.includes(UserRole.PLAYER) ? [...c.players, player.id] : c.players,
          managerId: isManager ? player.id : c.managerId,
          managerName: isManager ? player.name : c.managerName
        } : c
      ));
    }
  };

  const runMatchSimulation = useCallback(async (fixtureId: string) => {
    setFixtures(currentFixtures => {
      const fixture = currentFixtures.find(f => f.id === fixtureId);
      if (!fixture || fixture.played) return currentFixtures;

      const home = clubs.find(c => c.id === fixture.homeTeamId)!;
      const away = clubs.find(c => c.id === fixture.awayTeamId)!;

      const calculatePower = (club: Club) => {
        let power = 100 + (club.infrastructure.stadium + club.infrastructure.trainingGround) * 15;
        const dummyBasePower = 5 * 15; 
        power += dummyBasePower;
        if (player?.clubId === club.id && player?.roles.includes(UserRole.PLAYER)) {
          power -= 15; 
          power += playerStats.overallRating;
        }
        return power;
      };

      const homePower = calculatePower(home);
      const awayPower = calculatePower(away);
      const homeScore = Math.floor(Math.random() * (homePower / 40));
      const awayScore = Math.floor(Math.random() * (awayPower / 40));

      const updatedFixtures = currentFixtures.map(f => f.id === fixtureId ? { 
        ...f, 
        played: true, 
        homeScore, 
        awayScore,
        events: ["Anpfiff!", homeScore > awayScore ? "Sieg für die Heimmannschaft!" : "Auswärtssieg!", "Abpfiff!"]
      } : f);

      setClubs(prevClubs => prevClubs.map(c => {
        if (c.id === home.id) return { ...c, budget: c.budget + (homeScore > awayScore ? 15000 : 5000) };
        if (c.id === away.id) return { ...c, budget: c.budget + (awayScore > homeScore ? 15000 : 5000) };
        return c;
      }));

      if (player?.clubId === home.id || player?.clubId === away.id) {
        if (player?.roles.includes(UserRole.PLAYER)) {
          const matchXp = homeScore === awayScore ? 40 : (home.id === (homeScore > awayScore ? home.id : away.id) ? 100 : 20);
          setPlayer(p => p ? { ...p, trainingPoints: p.trainingPoints + 15, experience: p.experience + matchXp } : null);
        }
        
        if (activeView === 'match') {
          setLastMatch({
            homeTeam: home, awayTeam: away, homeScore, awayScore,
            events: ["Anpfiff!", homeScore > awayScore ? `${home.name} nutzt die Chancen besser.` : `${away.name} dominiert das Mittelfeld.`, "Abpfiff!"],
            commentary: "Lade Analyse..."
          });
        }
      }
      return updatedFixtures;
    });
  }, [clubs, player, playerStats.overallRating, activeView]);

  const onViewClub = (clubId: string) => {
    setSelectedClubId(clubId);
    setActiveView('club');
  };

  if (isInitializing) return <div className="h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse">LADE DATENBANK...</div>;

  if (!player) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 w-full max-w-lg shadow-2xl my-8">
          <h2 className="text-3xl font-black text-center mb-2">GoalMaster</h2>
          <p className="text-slate-500 text-center mb-8 text-sm uppercase tracking-widest font-bold">Wähle deinen Karrierepfad</p>
          {!regRole ? (
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => setRegRole([UserRole.PLAYER])} className="p-6 bg-slate-800 border border-slate-700 rounded-3xl hover:border-emerald-500 transition-all text-left group">
                <div className="text-3xl mb-2">⚽</div>
                <h4 className="font-bold text-lg group-hover:text-emerald-400">Nur Spieler</h4>
                <p className="text-xs text-slate-500">Fokus auf Training und individuelle Skills.</p>
              </button>
              <button onClick={() => setRegRole([UserRole.MANAGER])} className="p-6 bg-slate-800 border border-slate-700 rounded-3xl hover:border-amber-500 transition-all text-left group">
                <div className="text-3xl mb-2">👔</div>
                <h4 className="font-bold text-lg group-hover:text-amber-400">Nur Manager</h4>
                <p className="text-xs text-slate-500">Fokus auf Vereinsführung und Finanzen.</p>
              </button>
              <button onClick={() => setRegRole([UserRole.PLAYER, UserRole.MANAGER])} className="p-6 bg-slate-800 border border-slate-700 rounded-3xl hover:border-purple-500 transition-all text-left group">
                <div className="text-3xl mb-2">🌟</div>
                <h4 className="font-bold text-lg group-hover:text-purple-400">Spielertrainer (Beides)</h4>
                <p className="text-xs text-slate-500">Die volle Kontrolle über dich und deinen Club.</p>
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleRegister(formData.get('name') as string, formData.get('pos') as PlayerPosition, regRole, formData.get('clubName') as string, formData.get('clubLogo') as string);
            }} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase text-slate-500 border-b border-slate-800 pb-2">Persönliche Daten</h3>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Dein Name</label>
                  <input name="name" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-white font-bold" placeholder="z.B. Lukas Müller" />
                </div>
                {regRole.includes(UserRole.PLAYER) && (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Spieler-Position</label>
                    <select name="pos" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-emerald-500 outline-none text-white font-bold appearance-none">
                      {Object.values(PlayerPosition).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {regRole.includes(UserRole.MANAGER) && (
                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                  <h3 className="text-sm font-black uppercase text-amber-500/80 border-b border-slate-800 pb-2">Verein gründen</h3>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Vereinsname</label>
                    <input name="clubName" required className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-amber-500 outline-none text-white font-bold" placeholder="z.B. FC Nordstern" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Vereinslogo (Emoji)</label>
                    <select name="clubLogo" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl focus:border-amber-500 outline-none text-white font-bold appearance-none">
                      <option value="⚽">⚽ Fußball</option>
                      <option value="⭐">⭐ Stern</option>
                      <option value="🦅">🦅 Adler</option>
                      <option value="🦁">🦁 Löwe</option>
                      <option value="🛡️">🛡️ Schild</option>
                      <option value="⚡">⚡ Blitz</option>
                      <option value="🔥">🔥 Feuer</option>
                      <option value="🏔️">🏔️ Berge</option>
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setRegRole(null)} className="flex-1 bg-slate-800 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-750 transition-colors">ZURÜCK</button>
                <button type="submit" className="flex-[2] bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-900/20">KARRIERE STARTEN</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar activeView={activeView} setView={(v) => { setActiveView(v); if (v === 'club') setSelectedClubId(player.clubId); }} roles={player.roles} />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-950/50">
        <div className="max-w-6xl mx-auto space-y-8">
          {activeView === 'dashboard' && (
            <Dashboard player={player} club={clubs.find(c => c.id === player.clubId) || null} onPositionChange={() => {}} overallRating={playerStats.overallRating} xpProgress={playerStats.xpProgress} xpNeeded={playerStats.xpNeeded} />
          )}
          {activeView === 'training' && <TrainingCenter player={player} onTrain={trainSkill} />}
          {activeView === 'activities' && <Activities player={player} onComplete={completeActivity} />}
          {activeView === 'club' && <ClubDashboard club={clubs.find(c => c.id === selectedClubId) || null} player={player} onUpgrade={upgradeInfra} onTeamTraining={startTeamTraining} onJoin={joinClub} availableClubs={clubs} />}
          {activeView === 'match' && <MatchCenter clubs={clubs} fixtures={fixtures} lastMatch={lastMatch} onSimulate={runMatchSimulation} onReset={() => setLastMatch(null)} onViewClub={onViewClub} />}
        </div>
      </main>
    </div>
  );
};

export default App;
