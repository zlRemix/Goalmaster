import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../services/firebase';
import { FirebaseError } from 'firebase/app';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const getGermanErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Ungültige E-Mail-Adresse. Bitte überprüfe deine Eingabe.';
      case 'auth/user-disabled':
        return 'Dieses Benutzerkonto wurde deaktiviert.';
      case 'auth/user-not-found':
        return 'Kein Benutzer mit dieser E-Mail gefunden. Bitte registriere dich zuerst.';
      case 'auth/wrong-password':
        return 'Falsches Passwort. Bitte versuche es erneut.';
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits verwendet. Bitte melde dich an.';
      case 'auth/weak-password':
        return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      default:
        return 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es später erneut.';
    }
  }

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
        setError('Bitte gib sowohl E-Mail als auch Passwort ein.');
        return;
    }
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err instanceof FirebaseError) {
        setError(getGermanErrorMessage(err.code));
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
      console.error(err);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleAuthAction} className="bg-slate-900 shadow-2xl rounded-[2.5rem] p-8 pt-6 border border-slate-800">
        <h1 className="text-3xl font-black text-white text-center" >Pro<span className="text-emerald-500">Soccer</span></h1>
          <p className="text-slate-500 text-center mb-8 text-sm uppercase tracking-widest font-bold">{isRegistering ? 'Konto erstellen' : 'Willkommen zurück'}</p>
          
          <div className="mb-4">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border border-slate-800 bg-slate-950 rounded-2xl w-full py-3 px-4 text-slate-100 leading-tight focus:outline-none focus:border-emerald-500"
              id="email"
              type="email"
              placeholder="deine.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wider" htmlFor="password">
              Passwort
            </label>
            <input
              className="shadow appearance-none border border-slate-800 bg-slate-950 rounded-2xl w-full py-3 px-4 text-slate-100 mb-3 leading-tight focus:outline-none focus:border-emerald-500"
              id="password"
              type="password"
              placeholder="Mindestens 6 Zeichen"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="bg-red-900/50 border border-red-700/50 text-red-200 px-4 py-3 rounded-xl mb-4 text-sm text-center font-semibold">{error}</p>}
          <div className="flex flex-col gap-4">
            <button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-2xl focus:outline-none focus:shadow-outline transition-all shadow-lg shadow-emerald-900/20"
              type="submit"
            >
              {isRegistering ? 'Registrieren' : 'Anmelden'}
            </button>
            <button
              type="button"
              onClick={() => {setIsRegistering(!isRegistering); setError('');}}
              className="font-bold text-xs text-slate-500 hover:text-emerald-400 text-center"
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
