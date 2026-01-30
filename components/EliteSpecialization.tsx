import React, { useState } from 'react';
import { INFRASTRUCTURE_SPECIALIZATIONS, INFRA_SPECIALIZATION_COST } from '../constants';
import { InfrastructureType, SpecializationID } from '../types';
import { functions } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { Trophy, Zap, Check, XCircle } from 'lucide-react';

interface EliteSpecializationProps {
  infrastructureType: InfrastructureType;
  clubId: string;
  clubBudget: number;
  onSpecializationSelected: () => void;
}

const selectSpecializationCallable = httpsCallable<{ clubId: string, infrastructureType: InfrastructureType, specializationId: SpecializationID }, { success: boolean }>(functions, 'selectSpecialization');

export const EliteSpecialization: React.FC<EliteSpecializationProps> = ({ infrastructureType, clubId, clubBudget, onSpecializationSelected }) => {
  const [loading, setLoading] = useState<SpecializationID | null>(null);
  const [error, setError] = useState<string | null>(null);

  const path = INFRASTRUCTURE_SPECIALIZATIONS.find(p => p.type === infrastructureType);
  const hasEnoughBudget = clubBudget >= INFRA_SPECIALIZATION_COST;

  if (!path) {
    return (
      <div className="p-6 text-center bg-slate-900 rounded-[2rem] border border-white/5">
        <p className="text-slate-500 font-black uppercase italic tracking-widest text-xs">
          Keine Spezialisierungen verfügbar.
        </p>
      </div>
    );
  }

  const handleSelect = async (specializationId: SpecializationID) => {
    if (!hasEnoughBudget) return;
    setLoading(specializationId);
    setError(null);
    try {
      const result = await selectSpecializationCallable({ clubId, infrastructureType, specializationId });
      if (!result.data.success) {
        throw new Error('Spezialisierung fehlgeschlagen. Bitte versuche es erneut.');
      }
      onSpecializationSelected();
    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-8 p-8 border-2 border-yellow-500/50 rounded-[3rem] bg-slate-900 shadow-[0_0_40px_rgba(234,179,8,0.15)] animate-in zoom-in-95 duration-500">
      <header className="text-center mb-8">
        <div className="inline-flex p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter">
          Elite-Spezialisierung!
        </h3>
        <p className="text-slate-400 text-sm font-bold mt-2 max-w-md mx-auto">
          Dein <span className="text-yellow-500">{infrastructureType}</span> hat das Maximum erreicht. 
          Wähle einen permanenten Elite-Bonus für deinen Club.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {path.specializations.map(spec => (
          <div 
            key={spec.id} 
            className="flex flex-col bg-slate-950/50 border border-white/5 rounded-[2.5rem] p-6 transition-all hover:border-yellow-500/30 group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
            </div>

            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-2">
              {spec.name}
            </h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 flex-grow">
              {spec.description}
            </p>
            
            <div className="mb-6 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center">
                 {spec.id === 'vip_temple' ? 'Ersetzt Ticketeinnahmen-Bonus durch +100%' : '+15% Defensiv-Bonus bei Heimspielen'}
               </p>
            </div>

            <button
              onClick={() => handleSelect(spec.id)}
              disabled={loading !== null || !hasEnoughBudget}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95
                ${loading === spec.id 
                  ? 'bg-slate-800 text-slate-500' 
                  : !hasEnoughBudget
                  ? 'bg-rose-900/50 text-rose-500/80 cursor-not-allowed'
                  : 'bg-yellow-600 text-white hover:bg-yellow-500 shadow-lg shadow-yellow-900/20'}
              `}
            >
              {loading === spec.id ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : hasEnoughBudget ? (
                <><Check className="w-4 h-4" /> Wähle für {INFRA_SPECIALIZATION_COST.toLocaleString('de-DE')} €</>
              ) : (
                <><XCircle className="w-4 h-4" /> Nicht genügend Budget</>
              )}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-center text-xs font-black uppercase tracking-widest">
          {error}
        </div>
      )}
    </div>
  );
};