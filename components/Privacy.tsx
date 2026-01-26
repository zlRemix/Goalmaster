import React from 'react';

const Privacy: React.FC = () => {
    return (
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 text-slate-300">
            <h2 className="text-2xl font-bold text-white mb-4">Datenschutzerklärung</h2>
            <p className="mb-4">
                Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung
                von personenbezogenen Daten (nachfolgend kurz „Daten“) innerhalb unseres Onlineangebotes und
                der mit ihm verbundenen Webseiten, Funktionen und Inhalte sowie externen Onlinepräsenzen,
                wie z.B. unser Social Media Profile auf (nachfolgend gemeinsam bezeichnet als „Onlineangebot“).
                Im Hinblick auf die verwendeten Begrifflichkeiten, wie z.B. „Verarbeitung“ oder „Verantwortlicher“
                verweisen wir auf die Definitionen im schweizerischen Datenschutzgesetz (nDSG).
            </p>

            <h3 className="text-xl font-bold text-white mb-2">Verantwortlicher</h3>
            <p className="mb-4">
                GoalMaster AG <br />
                Musterstraße 1 <br />
                CH-8000 Zürich <br />
                E-Mail: <a href="mailto:info@goalmaster.com" className="text-emerald-400 hover:underline">info@goalmaster.com</a>
            </p>

            <h3 className="text-xl font-bold text-white mb-2">Arten der verarbeiteten Daten</h3>
            <ul className="list-disc list-inside mb-4">
                <li>Bestandsdaten (z.B., Namen, Adressen).</li>
                <li>Kontaktdaten (z.B., E-Mail, Telefonnummern).</li>
                <li>Inhaltsdaten (z.B., Texteingaben, Fotografien, Videos).</li>
                <li>Nutzungsdaten (z.B., besuchte Webseiten, Interesse an Inhalten, Zugriffszeiten).</li>
                <li>Meta-/Kommunikationsdaten (z.B., Geräte-Informationen, IP-Adressen).</li>
            </ul>

            <h3 className="text-xl font-bold text-white mb-2">Zweck der Verarbeitung</h3>
            <p className="mb-4">
                - Zurverfügungstellung des Onlineangebotes, seiner Funktionen und Inhalte.<br />
                - Beantwortung von Kontaktanfragen und Kommunikation mit Nutzern.<br />
                - Sicherheitsmaßnahmen.<br />
                - Reichweitenmessung/Marketing
            </p>

            <h3 className="text-xl font-bold text-white mb-2">Rechte der betroffenen Personen</h3>
            <p className="mb-4">
                Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten Daten zu erhalten. 
                Zusätzlich haben Sie das Recht auf Berichtigung unrichtiger Daten, sowie das Recht auf 
                Löschung Ihrer Daten. Kontaktieren Sie uns hierfür unter der oben angegebenen E-Mail-Adresse.
            </p>

            <p className="text-sm text-slate-400 mt-6">
                Stand: August 2023
            </p>
        </div>
    );
};

export default Privacy;
