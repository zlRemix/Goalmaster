import React, { useMemo, useState } from 'react';
import { Player, Club, View, AvatarData, EquipmentSlot, EquipmentItem } from '../types';
import { dataService } from '../services/dataService';
import { getRatingColor } from '../utils';
import { UserCog, Shield, Package, Check, X } from 'lucide-react';
import ClubLogo from './ClubLogo';
import { createAvatar } from '@dicebear/core';
import * as collections from '@dicebear/collection';
import { EQUIPMENT_ITEMS } from '../constants';

const Equipment: React.FC<{ player: Player }> = ({ player }) => {
  const [isUpdating, setIsUpdating] = useState<EquipmentSlot | null>(null);

  const handleEquip = async (item: EquipmentItem) => {
    setIsUpdating(item.slot);
    try {
      await dataService.equipItem(player.id, item.id, item.slot);
    } catch (error) {
      console.error("Failed to equip item:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUnequip = async (slot: EquipmentSlot) => {
    setIsUpdating(slot);
    try {
      await dataService.unequipItem(player.id, slot);
    } catch (error) {
      console.error("Failed to unequip item:", error);
    } finally {
      setIsUpdating(null);
    }
  };

  const renderSlot = (slot: EquipmentSlot, title: string) => {
    const equippedItemId = player.equipped?.[slot];
    const equippedItem = equippedItemId ? EQUIPMENT_ITEMS.find(i => i.id === equippedItemId) : null;
    const availableItems = (player.equipment || [])
      .map(id => EQUIPMENT_ITEMS.find(i => i.id === id))
      .filter(item => item && item.slot === slot) as EquipmentItem[];

    return (
      <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        {equippedItem ? (
          <div className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg">
            <div>
                <p className="font-bold text-emerald-400">{equippedItem.name}</p>
                 <div className="text-xs text-slate-400">
                    {Object.entries(equippedItem.bonus).map(([skill, value]) => (
                        <span key={skill} className="mr-2">{`+${value} ${skill.replace('_', ' ')}`}</span>
                    ))}
                </div>
            </div>
            <button 
                onClick={() => handleUnequip(slot)}
                disabled={isUpdating === slot}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-500 disabled:bg-slate-600 transition-colors">
             <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <p className="text-slate-500 italic">Nichts ausgerüstet</p>
        )}
        
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-slate-300">Verfügbar:</h4>
          {availableItems.length > 0 ? availableItems.map(item => (
            <div key={item.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
              <div>
                  <p className="font-semibold text-slate-200">{item.name}</p>
                  <div className="text-xs text-slate-400">
                    {Object.entries(item.bonus).map(([skill, value]) => (
                        <span key={skill} className="mr-2">{`+${value} ${skill.replace('_', ' ')}`}</span>
                    ))}
                  </div>
              </div>
              {equippedItemId !== item.id && (
                 <button 
                    onClick={() => handleEquip(item)}
                    disabled={isUpdating === slot}
                    className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-500 disabled:bg-slate-600 transition-colors">
                    <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          )) : <p className="text-slate-500 text-sm italic">Keine Gegenstände für diesen Slot.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
       <header>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-sky-400" />
            <span>Ausrüstung verwalten</span>
          </h2>
          <p className="text-slate-400 mt-1">Rüste deine gekauften Gegenstände aus, um Skill-Boni zu erhalten.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSlot(EquipmentSlot.SHOES, 'Schuhe')}
        {player.position === 'Torwart' && renderSlot(EquipmentSlot.GLOVES, 'Handschuhe')}
      </div>
    </div>
  );
};

const PlayerAvatar: React.FC<{ avatar?: AvatarData; size?: number }> = ({ avatar, size = 80 }) => {
    const avatarSvg = useMemo(() => {
        if (!avatar || !avatar.style || !avatar.seed) return null;
        const styleCollection = (collections as any)[avatar.style];
        if (!styleCollection) return null;
        return createAvatar(styleCollection, { seed: avatar.seed, size, radius: 50 }).toString();
    }, [avatar, size]);

    if (avatarSvg) {
        return <div style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: avatarSvg }} />;
    }
    return <div style={{ width: size, height: size }} className="bg-slate-700 rounded-full" />;
};


interface DashboardProps {
  player: Player;
  club: Club | null; 
  allClubs: Club[];
  overallRating: number;
  xpProgress: number;
  xpNeeded: number;
  setView: (view: View) => void;
}

const InvitationBanner: React.FC<{ player: Player; allClubs: Club[] }> = ({ player, allClubs }) => {
    if (!player.pendingClubInvitation) return null;

    const invitingClub = allClubs.find(c => c.id === player.pendingClubInvitation);
    if (!invitingClub) return null;

    const handleAccept = () => {
        dataService.acceptClubInvitation(player.id, invitingClub.id).catch(e => console.error(e));
    };

    const handleReject = () => {
        dataService.rejectClubInvitation(player.id).catch(e => console.error(e));
    };

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 md:p-6 rounded-3xl border-2 border-blue-400/80 shadow-2xl animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h3 className="text-xl md:text-2xl font-black text-white">Einladung erhalten!</h3>
                    <p className="text-blue-200 font-semibold">Der Verein <span className="font-bold">{invitingClub.name}</span> hat dich eingeladen.</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                    <button onClick={handleAccept} className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 px-5 rounded-lg transition-colors shadow-lg active:scale-95">Annehmen</button>
                    <button onClick={handleReject} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-5 rounded-lg transition-colors active:scale-95">Ablehnen</button>
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ player, club, allClubs, overallRating, xpProgress, xpNeeded, setView }) => {

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
        
      {player.pendingClubInvitation && <InvitationBanner player={player} allClubs={allClubs} />}

      <header className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4 md:gap-6">
          <PlayerAvatar avatar={player.avatar} />
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white">{player.name}</h1>
            <p className="text-lg md:text-xl text-slate-400 font-bold">{club ? club.name : 'Vereinslos'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          {club && (
             <button onClick={() => setView('club')} className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                <ClubLogo logo={club.logo} size={40} />
            </button>
          )}
          <button onClick={() => setView('profile')} className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors h-full flex items-center">
             <UserCog className="h-6 w-6" />
          </button>
          <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-slate-700 h-full">
            <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-xl">LEVEL</div>
            <div className="text-white font-black text-2xl px-2">{player.level || 1}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 bg-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center border border-slate-700 shadow-lg">
          <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Gesamt</p>
          <p className={`text-7xl md:text-8xl font-black ${getRatingColor(overallRating)}`}>{overallRating}</p>
        </div>
        <div className="lg:col-span-2 bg-slate-800/80 rounded-3xl p-6 md:p-8 border border-slate-700 shadow-lg">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-base md:text-lg font-bold text-slate-300">Nächstes Level</h3>
            <p className="text-sm text-slate-400 font-mono">{Math.round(player.experience || 0)} / {xpNeeded} XP</p>
          </div>
          <div className="h-5 md:h-6 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-1">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 rounded-full"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">Sammle XP durch Training & Aktivitäten, um aufzusteigen und TP zu erhalten.</p>
        </div>
      </div>

      <div className="bg-slate-800/80 p-6 md:p-8 rounded-3xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Spielerdetails</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Position</p>
            <p className="text-base md:text-xl font-bold text-white">{player.position || 'N/A'}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">TP</p>
            <p className="text-base md:text-xl font-bold text-amber-400">{player.trainingPoints || 0}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Rolle</p>
            <p className="text-base md:text-xl font-bold text-white capitalize">{player.roles.join(', ')}</p>
          </div>
          <div className="text-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
            <p className="text-xs md:text-sm text-slate-400">Moral</p>
            <p className="text-base md:text-xl font-bold text-emerald-400">Hoch</p>
          </div>
        </div>
      </div>
      <Equipment player={player} />
    </div>
  );
};