import React from 'react';

const Impressum: React.FC = () => {
    return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-4">Impressum</h2>
            <p className="mb-2">Angaben gemäß § 5 TMG</p>
            <p className="mb-2">
                GoalMaster AG <br />
                Musterstraße 1 <br />
                CH-8000 Zürich
            </p>
            <p className="mb-2">
                <strong>Kontakt:</strong> <br />
                E-Mail: <a href="mailto:info@goalmaster.com" className="text-emerald-400 hover:underline">info@goalmaster.com</a>
            </p>
             <p className="mb-2">
                <strong>Vertreten durch:</strong> <br />
                Max Mustermann (CEO)
            </p>
        </div>
    );
};

export default Impressum;
