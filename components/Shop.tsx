import React, { useState } from 'react';
import { Player } from '../types';
import { ShoppingCart, Euro, Package, Zap } from 'lucide-react';
import { SHOP_ITEMS } from '../constants';
import { dataService } from '../services/dataService';

interface ShopProps {
  player: Player;
}

export const Shop: React.FC<ShopProps> = ({ player }) => {
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (itemId: string) => {
    setIsPurchasing(itemId);
    setError(null);
    try {
      await dataService.purchaseShopItem(player.id, itemId);
    } catch (err: any) {
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-amber-400" />
            <span>Spieler-Shop</span>
          </h2>
          <p className="text-slate-400 mt-1">Kaufe Trainingspunkte (TP) und andere Verbesserungen.</p>
        </div>
        <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 flex items-center gap-3">
            <Euro className="w-6 h-6 text-amber-400" />
            <span className="text-xl font-bold text-white">{player.euro ?? 0}</span>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOP_ITEMS.map((item) => (
          <div key={item.id} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 flex flex-col gap-4 hover:border-emerald-500 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="bg-slate-700/50 p-3 rounded-xl">
                    <Package className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{item.name}</h3>
                    <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
            </div>
            
            <div className="flex justify-between items-center bg-slate-900/70 p-4 rounded-xl mt-auto">
                 <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400"/>
                    <span className="text-lg font-bold text-white">+{item.tp} TP</span>
                </div>
                <button 
                  onClick={() => handlePurchase(item.id)}
                  disabled={isPurchasing === item.id || (player.euro ?? 0) < item.price}
                  className="bg-emerald-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-emerald-500 disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <Euro className="w-5 h-5" />
                  <span>{item.price}</span>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};