import React, { ElementType } from 'react';
import { View, UserRole } from '../types';
import { Home, User, Shield, Users, Activity, ShoppingCart, Trophy, Swords, UserCog, LogOut, Settings, Zap } from 'lucide-react';

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
  <li>
    <button
      onClick={() => { setView(view); onClick(); }}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all text-left text-sm ${
        activeView === view
          ? 'bg-emerald-600 text-white font-semibold shadow-md'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </button>
  </li>
);

const NavGroup: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-3">{title}</h3>
    <ul className="space-y-1">
      {children}
    </ul>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, roles, onLogout, isOpen, setIsOpen }) => {
  const isAdmin = roles.includes(UserRole.ADMIN);

  const handleNavItemClicked = () => {
      setIsOpen(false);
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
            <NavGroup title="Spieler">
                <NavItem label="Dashboard" view="home" Icon={Home} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
                <NavItem label="Trainingscenter" view="skills" Icon={Zap} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
                <NavItem label="Aktivitäten" view="activities" Icon={Activity} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
                <NavItem label="Shop" view="shop" Icon={ShoppingCart} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
            </NavGroup>
            
            <NavGroup title="Verein">
                 <NavItem label="Mein Verein" view="club" Icon={Shield} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
                 <NavItem label="Vereinssuche" view="club-search" Icon={Users} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
            </NavGroup>

            <NavGroup title="Community">
                <NavItem label="Rangliste" view="leaderboard" Icon={Trophy} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
                <NavItem label="Liga" view="league" Icon={Swords} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
            </NavGroup>

            {isAdmin && (
              <NavGroup title="System">
                <NavItem label="Admin Panel" view="admin" Icon={UserCog} activeView={activeView} setView={setView} onClick={handleNavItemClicked} />
              </NavGroup>
            )}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800/60">
            <button
                onClick={() => { setView('profile'); handleNavItemClicked(); }}
                className="w-full flex items-center text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm font-bold p-3 rounded-lg mb-2"
              >
                <Settings className="h-5 w-5 mr-3" />
                Profil & Einstellungen
            </button>
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
