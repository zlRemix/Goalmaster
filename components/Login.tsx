
import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../services/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleAuthAction} className="bg-slate-800 shadow-2xl rounded-2xl p-8 pt-6 border border-slate-700">
        <h1 className="text-3xl font-black text-white text-center" >Pro<span className="text-blue-500">Soccer</span></h1>
          <p className="text-slate-400 text-center mb-8 text-sm uppercase tracking-widest font-bold">{isRegistering ? 'Konto erstellen' : 'Willkommen zurück'}</p>
          
          <div className="mb-4">
            <label className="block text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border border-slate-700 bg-slate-900 rounded-lg w-full py-3 px-4 text-slate-100 leading-tight focus:outline-none focus:border-blue-500"
              id="email"
              type="email"
              placeholder="deine.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider" htmlFor="password">
              Passwort
            </label>
            <input
              className="shadow appearance-none border border-slate-700 bg-slate-900 rounded-lg w-full py-3 px-4 text-slate-100 mb-3 leading-tight focus:outline-none focus:border-blue-500"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-4 text-xs">{error}</p>}
          <div className="flex flex-col gap-4">
            <button
              className="bg-blue-600 hover:bg-blue-500 text-white font-black py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all shadow-lg shadow-blue-900/20"
              type="submit"
            >
              {isRegistering ? 'Registrieren' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={() => {setIsRegistering(!isRegistering); setError('');}}
              className="font-bold text-xs text-slate-400 hover:text-blue-400 text-center"
            >
              {isRegistering ? 'Bereits ein Konto? Jetzt anmelden' : 'Noch kein Konto? Jetzt registrieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
