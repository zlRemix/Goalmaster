import React from 'react';
import { View, PlayerRole } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  roles: PlayerRole[];
  onLogout: () => void;
}

const NavItem: React.FC<{ 
  label: string; 
  view: View; 
  activeView: View; 
  setView: (view: View) => void; 
  icon: string;
}> = ({ label, view, activeView, setView, icon }) => (
  <li className="mb-2">
    <button
      onClick={() => setView(view)}
      className={`w-full flex items-center p-3 rounded-lg transition-all text-left ${
        activeView === view
          ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-800/20'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="text-2xl mr-4">{icon}</span>
      <span>{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, roles, onLogout }) => {
  const canManageClub = roles.includes('club_owner');

  return (
    <aside className="w-64 bg-slate-900 p-4 flex-shrink-0 flex flex-col justify-between border-r border-slate-800">
      <div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white">Pro<span className="text-emerald-500">Soccer</span></h1>
          <p className="text-xs text-slate-500">Manager</p>
        </div>
        <nav>
          <ul>
            <NavItem label="Dashboard" view="home" activeView={activeView} setView={setView} icon="🏠" />
            {/* TYPO FIX: Changed 'skllis' to 'skills' */}
            <NavItem label="Skills" view="skills" activeView={activeView} setView={setView} icon="⚡" />
            <NavItem label="Club" view="club" activeView={activeView} setView={setView} icon="🛡️" />
            <NavItem label="Aktivitäten" view="activities" activeView={activeView} setView={setView} icon="🤸" />
            <NavItem label="Transfers" view="transfers" activeView={activeView} setView={setView} icon="🔄" />
            <NavItem label="Liga" view="league" activeView={activeView} setView={setView} icon="🏆" />
            {canManageClub && <NavItem label="Management" view="management" activeView={activeView} setView={setView} icon="💼" />}
          </ul>
        </nav>
      </div>
      <div className="p-4">
        <button
          onClick={onLogout}
          className="w-full text-center text-slate-500 hover:text-red-500 transition-all text-sm font-bold"
        >
          Abmelden
        </button>
      </div>
    </aside>
  );
};