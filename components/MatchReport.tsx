import React from 'react';
import { MatchResult, Club } from '../types';
import ClubLogo from './ClubLogo';
import { X, Shield, Goal, Zap } from 'lucide-react';

interface MatchReportProps {
    report: MatchResult;
    homeClub: Club;
    awayClub: Club;
    onClose: () => void;
}

// Helper to create a square icon for cards
const CardIcon = ({ color }: { color: string }) => (
    <div className={`w-3.5 h-4 rounded-sm ${color}`} />
);

const MatchReport: React.FC<MatchReportProps> = ({ report, homeClub, awayClub, onClose }) => {

    const parseEvent = (event: string) => {
        const minute = event.match(/^(\d+)'/)?.[1] || '-';
        let icon = <Zap size={14} className="text-slate-400" />;
        let text = event.substring(event.indexOf("'") + 1).trim();

        if (text.startsWith('Tor für')) {
            icon = <Goal size={14} className="text-yellow-400" />;
        } else if (text.startsWith('Gelbe Karte')) {
            icon = <CardIcon color="bg-yellow-400" />;
        } else if (text.startsWith('Rote Karte')) {
            icon = <CardIcon color="bg-red-500" />;
        } else if (text.startsWith('Gelb-Rote Karte')) {
            icon = <div className="flex space-x-1"><CardIcon color="bg-yellow-400" /><CardIcon color="bg-red-500" /></div>;
        } else if (text.startsWith('Spielabbruch')) {
            icon = <Shield size={14} className="text-red-500" />;
        } 

        return { minute, icon, text };
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Spielbericht</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex justify-around items-center mb-6">
                        <div className="flex flex-col items-center text-center w-1/3">
                            <ClubLogo logo={homeClub.logo} size={64} />
                            <span className="font-bold text-white mt-2 text-lg truncate">{homeClub.name}</span>
                        </div>
                        <div className="text-center">
                            <p className="font-black text-yellow-400 text-5xl">
                                {report.homeScore} - {report.awayScore}
                            </p>
                            <p className="text-sm text-slate-400 mt-1">Endergebnis</p>
                        </div>
                        <div className="flex flex-col items-center text-center w-1/3">
                            <ClubLogo logo={awayClub.logo} size={64} />
                            <span className="font-bold text-white mt-2 text-lg truncate">{awayClub.name}</span>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-3">Spielverlauf</h3>
                        <ul className="space-y-2.5">
                            {report.events.map((event, index) => {
                                const { minute, icon, text } = parseEvent(event);
                                return (
                                    <li key={index} className="text-sm text-slate-300 flex items-center">
                                        <span className="font-mono bg-slate-700/50 rounded px-1.5 py-0.5 mr-3 text-slate-400 text-xs w-10 text-center">
                                            {minute}'
                                        </span>
                                        <span className="w-6 mr-2 flex items-center justify-center">{icon}</span>
                                        <span>{text}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchReport;
