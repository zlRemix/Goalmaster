import React, { useState } from 'react';
import { Player } from '../types';
import { ShoppingCart, Euro } from 'lucide-react';
import { SHOP_ITEMS, EQUIPMENT_ITEMS } from '../constants';
import { dataService } from '../services/dataService';
import { Packet } from './Packet'; 
import { EquipmentCard } from './EquipmentCard'; 

interface ShopProps {
  player: Player;
}

export const Shop: React.FC<ShopProps> = ({ player }) => {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('boosts');

  const playerEuro = player.euro ?? 0;

  const handlePurchase = async (item: any, type: 'boost' | 'equipment') => {
    setIsPurchasing(item.id);
    setError(null);
    try {
      if (type === 'boost') {
        await dataService.purchaseShopItem(player.id, item.id);
      } else {
        await dataService.purchaseEquipmentItem(player.id, item.id);
      }
    } catch (err: any) {
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Header Bereich */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-400" />
            <span className="uppercase italic tracking-tighter">Spieler-Shop</span>
          </h2>
          <p className="text-slate-400 mt-1">Verbessere deine Attribute durch Packs und Ausrüstung.</p>
        </div>
        
        {/* Kontostand */}
        <div className="bg-slate-900/80 px-6 py-3 rounded-2xl border border-slate-700 shadow-xl flex items-center gap-3">
          <Euro className="w-6 h-6 text-emerald-400" />
          <span className="text-2xl font-black text-white">{playerEuro.toLocaleString()}</span>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-center animate-shake">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-950/50 rounded-2xl border border-slate-800 w-fit">
        <button 
          onClick={() => setActiveTab('boosts')} 
          className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
            activeTab === 'boosts' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Trainings-Boosts
        </button>
        <button 
          onClick={() => setActiveTab('equipment')} 
          className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
            activeTab === 'equipment' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Ausrüstung
        </button>
      </div>

      {/* Boosts Tab */}
      {activeTab === 'boosts' && (
        <div className="flex justify-center flex-wrap gap-6 py-4">
          {SHOP_ITEMS.map((item, index) => (
            <div key={item.id} className="flex flex-col items-center gap-4">
              <Packet 
                name={item.name} 
                tp={item.tp} 
                price={item.price} 
                size={index === 0 ? 'small' : index === 1 ? 'medium' : 'large'}
              />
              <button 
                onClick={() => handlePurchase(item, 'boost')}
                disabled={isPurchasing === item.id || playerEuro < item.price}
                className="bg-blue-600 w-full text-white font-black uppercase italic tracking-widest py-3 px-6 rounded-xl hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
              >
                <Euro className="w-5 h-5" />
                <span>{item.price.toLocaleString()}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Equipment Tab - Kompaktes Nebeneinander-Layout */}
      {activeTab === 'equipment' && (
        <div className="flex flex-wrap gap-4 justify-center items-start py-4">
          {EQUIPMENT_ITEMS.map((item) => (
            <EquipmentCard
              key={item.id}
              item={item}
              onPurchase={(item) => handlePurchase(item, 'equipment')}
              isPurchasing={isPurchasing === item.id}
              isOwned={player.equipment?.includes(item.id) ?? false}
              playerEuro={playerEuro}
            />
          ))}
        </div>
      )}
    </div>
  );
};