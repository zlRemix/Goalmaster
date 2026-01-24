import React, { ElementType } from 'react';
import { View, UserRole } from '../types';
import { LayoutDashboard, Sparkles, Shield, Activity, Trophy, Swords, UserCog, LogOut } from 'lucide-react';

interface SidebarProps {
  activeView: View;
  setView: (view: View) => void;
  roles: UserRole[];
  onLogout: () => void;
  isOpen: boolean; 
  setIsOpen: (isOpen: boolean) => void; 
}

const NavItem: React.FC<{ 
  label: string; 
  view: View; 
  activeView: View; 
  setView: (view: View) => void; 
  Icon: ElementType;
  onClick: () => void; 
}> = ({ label, view, activeView, setView, Icon, onClick }) => (
  <li className="mb-2">
    <button
      onClick={() => { setView(view); onClick(); }}
      className={`w-full flex items-center p-3 rounded-lg transition-all text-left ${
        activeView === view
          ? 'bg-emerald-600 text-white font-bold shadow-lg'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
      <span className="font-semibold">{label}</span>
    </button>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, roles, onLogout, isOpen, setIsOpen }) => {
  const isAdmin = roles.includes(UserRole.ADMIN);

  const handleNavItemClicked = () => {
      setIsOpen(false);
  }

  const navItems = [
    { label: 'Dashboard', view: 'home', Icon: LayoutDashboard },
    { label: 'Skills', view: 'skills', Icon: Sparkles },
    { label: 'Club', view: 'club', Icon: Shield },
    { label: 'Aktivitäten', view: 'activities', Icon: Activity },
    { label: 'Rangliste', view: 'leaderboard', Icon: Trophy },
    { label: 'Liga', view: 'league', Icon: Swords },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', view: 'admin', Icon: UserCog });
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 p-4 flex flex-col justify-between border-r border-slate-800 z-40 transition-transform transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="text-center mb-10 pt-4">
            <h1 className="text-3xl font-black text-white">Pro<span className="text-emerald-500">Soccer</span></h1>
          </div>
          <nav>
            <ul>
              {navItems.map(item => (
                <NavItem 
                  key={item.view}
                  label={item.label} 
                  view={item.view} 
                  activeView={activeView} 
                  setView={setView} 
                  Icon={item.Icon} 
                  onClick={handleNavItemClicked} 
                />
              ))}
            </ul>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/60">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center text-slate-400 hover:bg-red-900/50 hover:text-red-400 transition-all text-sm font-bold p-3 rounded-lg"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Abmelden
          </button>
        </div>
      </aside>
    </>
  );
};