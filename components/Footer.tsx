import React from 'react';
import { View } from '../types';

interface FooterProps {
    setView: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ setView }) => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 p-4 mt-8">
            <div className="max-w-7xl mx-auto flex justify-center items-center space-x-6 text-sm">
                <button onClick={() => setView('impressum')} className="text-slate-400 hover:text-emerald-400 transition-colors">Impressum</button>
                <button onClick={() => setView('privacy')} className="text-slate-400 hover:text-emerald-400 transition-colors">Datenschutz</button>
                <button onClick={() => setView('terms')} className="text-slate-400 hover:text-emerald-400 transition-colors">AGB</button>
            </div>
        </footer>
    );
};

export default Footer;
