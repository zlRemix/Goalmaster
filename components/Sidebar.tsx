
import React from 'react';
import { View, UserRole } from '../types';

const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Train: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9l1.4 1.4"/><path d="M10.2 4.4a2 2 0 1 1 2.8 2.8l-1.8 1.7a2 2 0 1 1-2.8-2.8z"/><path d="M4.4 10.2a2 2 0 1 1 2.8 2.8l-1.7 1.8a2 2 0 1 1-2.8-2.8z"/></svg>,
  Club: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  Match: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="22" x2="22" y2="16"/><polyline points="9.5 6.5 21 18 21 21 18 21 6.5 9.5"/><line x1="5" y1="11" x2="11" y2="5"/></svg>,
  Tasks: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
};

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  roles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, roles }) => {
  const isPlayer = roles.includes(UserRole.PLAYER);
  const isManager = roles.includes(UserRole.MANAGER);

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Icons.Home, show: true },
    { id: 'training' as View, label: 'Training', icon: Icons.Train, show: isPlayer },
    { id: 'activities' as View, label: 'Tagesaufgaben', icon: Icons.Tasks, show: isPlayer },
    { id: 'club' as View, label: isManager ? 'Vereinsführung' : 'Mein Verein', icon: Icons.Club, show: true },
    { id: 'match' as View, label: 'Spieltag', icon: Icons.Match, show: true },
  ];

  return (
    <aside className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300">
      <div className="p-6 text-center border-b border-slate-800">
        <h1 className="text-xl font-bold text-emerald-500 hidden md:block tracking-tighter">GOALMASTER</h1>
        <div className="text-2xl md:hidden">⚽</div>
      </div>
      
      <nav className="flex-1 mt-6 px-2 space-y-1">
        {menuItems.filter(item => item.show).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
              activeView === item.id 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <item.icon />
            <span className="ml-3 font-medium hidden md:block">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 hidden md:block uppercase font-bold text-center tracking-widest">
        Multiplayer Ready
      </div>
    </aside>
  );
};
