import React, { useState, useEffect } from 'react';

const ConsentNotice: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // This check ensures the code runs only on the client-side,
        // after the initial render is complete.
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    // By not rendering anything until the useEffect has run and set the state,
    // we avoid the hydration mismatch between server and client.
    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 p-4 z-50">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                <p className="text-slate-300 text-sm mb-3 md:mb-0">
                    Wir verwenden Cookies, um Ihr Erlebnis auf unserer Website zu verbessern. 
                    Durch die weitere Nutzung dieser Website stimmen Sie der Verwendung von Cookies zu.
                </p>
                <button 
                    onClick={handleAccept}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Akzeptieren
                </button>
            </div>
        </div>
    );
};

export default ConsentNotice;
