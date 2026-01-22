import React from 'react';
import { View, UserRole } from '../types';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  roles: UserRole[];
  onLogout: () => void;
  isOpen: boolean; // <-- NEW
  setIsOpen: (isOpen: boolean) => void; // <-- NEW
}

const NavItem: React.FC<{ 
  label: string; 
  view: View; 
  activeView: View; 
  setView: (view: View) => void; 
  icon: string;
  onClick: () => void; // <-- NEW: To close sidebar on mobile after click
}> = ({ label, view, activeView, setView, icon, onClick }) => (
  <li className="mb-2">
    <button
      onClick={() => { setView(view); onClick(); }}
      className={`w-full flex items-center p-3 rounded-lg transition-all text-left ${
        activeView === view
          ? 'bg-emerald-600 text-white font-bold shadow-lg'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="text-2xl mr-4">{icon}</span>
      <span className="font-semibold">{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, roles, onLogout, isOpen, setIsOpen }) => {
  const canManageClub = roles.includes(UserRole.MANAGER);

  const handleNavItemClicked = () => {
      setIsOpen(false);
  }

  return (
    <>
      {/* --- Overlay for Mobile --- */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* --- Sidebar --- */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 p-4 flex flex-col justify-between border-r border-slate-800 z-40 transition-transform transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="text-center mb-10 pt-4">
            <h1 className="text-3xl font-black text-white">Pro<span className="text-emerald-500">Soccer</span></h1>
            <p className="text-xs text-slate-500">Manager</p>
          </div>
          <nav>
            <ul>
              <NavItem label="Dashboard" view="home" activeView={activeView} setView={setView} icon="🏠" onClick={handleNavItemClicked} />
              <NavItem label="Skills" view="skills" activeView={activeView} setView={setView} icon="⚡" onClick={handleNavItemClicked} />
              <NavItem label="Club" view="club" activeView={activeView} setView={setView} icon="🛡️" onClick={handleNavItemClicked} />
              <NavItem label="Aktivitäten" view="activities" activeView={activeView} setView={setView} icon="🤸" onClick={handleNavItemClicked} />
              {/* <NavItem label="Transfers" view="transfers" activeView={activeView} setView={setView} icon="🔄" onClick={handleNavItemClicked} />
              <NavItem label="Liga" view="league" activeView={activeView} setView={setView} icon="🏆" onClick={handleNavItemClicked} /> */}
              {/* {canManageClub && <NavItem label="Management" view="management" activeView={activeView} setView={setView} icon="💼" onClick={handleNavItemClicked} />} */}
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
    </>
  );
};