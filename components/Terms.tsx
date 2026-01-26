import React from 'react';

const Terms: React.FC = () => {
    return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-4">Allgemeine Geschäftsbedingungen (AGB)</h2>
            
            <h3 className="text-xl font-bold text-white mb-2">1. Geltungsbereich</h3>
            <p className="mb-4">
                Diese Allgemeinen Geschäftsbedingungen (AGB) regeln das Vertragsverhältnis zwischen der GoalMaster AG 
                (nachfolgend "Anbieter") und den Nutzern (nachfolgend "Nutzer") der GoalMaster-Plattform.
            </p>

            <h3 className="text-xl font-bold text-white mb-2">2. Vertragsgegenstand</h3>
            <p className="mb-4">
                Der Anbieter stellt eine Online-Plattform zur Verfügung, auf der Nutzer als virtuelle Fussballmanager 
                agieren können. Der genaue Umfang der Leistungen ist auf der Webseite des Anbieters beschrieben.
            </p>

            <h3 className="text-xl font-bold text-white mb-2">3. Nutzerkonto</h3>
            <p className="mb-4">
                Die Nutzung der Plattform erfordert die Erstellung eines Nutzerkontos. Der Nutzer ist für die 
                Sicherheit seiner Zugangsdaten selbst verantwortlich. Pro Person ist nur ein Nutzerkonto gestattet.
            </p>

            <h3 className="text-xl font-bold text-white mb-2">4. Haftung</h3>
            <p className="mb-4">
                Der Anbieter haftet nur für Schäden, die auf grobe Fahrlässigkeit oder Vorsatz zurückzuführen sind. 
                Die Haftung für leichte Fahrlässigkeit ist, soweit gesetzlich zulässig, ausgeschlossen.
            </p>

            <h3 className="text-xl font-bold text-white mb-2">5. Änderungen der AGB</h3>
            <p className="mb-4">
                Der Anbieter behält sich das Recht vor, diese AGB jederzeit zu ändern. Die Nutzer werden über 
                Änderungen rechtzeitig informiert.
            </p>

            <p className="text-sm text-slate-400 mt-6">
                Stand: August 2023
            </p>
        </div>
    );
};

export default Terms;
