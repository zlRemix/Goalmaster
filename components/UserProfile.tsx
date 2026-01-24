import React, { useState, useEffect } from 'react';
import { functions, auth } from '../services/firebase';
import { httpsCallable } from 'firebase/functions';
import { sendPasswordResetEmail } from 'firebase/auth';
import { dataService } from '../services/dataService';
import { Player } from '../types';
import AvatarEditor from './AvatarEditor';

const deleteAccountFunction = httpsCallable(functions, 'deleteAccount');

const UserProfile: React.FC = () => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const unsubscribe = dataService.listenToPlayer(user.uid, (playerData) => {
        if (playerData) {
          setPlayer(playerData);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    setLoading('password');
    setFeedback(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setFeedback({ type: 'success', message: 'Link zum Zurücksetzen des Passworts wurde an deine E-Mail gesendet.' });
    } catch (error: any) {
      console.error("Fehler beim Senden der Passwort-Reset-E-Mail:", error);
      setFeedback({ type: 'error', message: 'Fehler beim Senden der E-Mail zum Zurücksetzen des Passworts.' });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm('Bist du sicher, dass du dein Konto endgültig löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden und löscht alle deine Spieler- und Vereinsdaten.')) {
      return;
    }
    setLoading('delete');
    setFeedback(null);
    try {
      const result = await deleteAccountFunction();
      const data = result.data as { success: boolean; message: string };
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        // User will be signed out automatically after deletion triggers auth changes.
      } else {
        throw new Error(data.message || 'Ein unbekannter Fehler ist aufgetreten.');
      }
    } catch (error: any) {
      console.error("Fehler beim Löschen des Kontos:", error);
      setFeedback({ type: 'error', message: error.message || 'Das Konto konnte nicht gelöscht werden.' });
    } finally {
      setLoading(null);
    }
  };

  if (!player) {
    return <div>Lade Profil...</div>;
  }

  return (
    <div className="space-y-8 mt-8">
        <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">Kontoeinstellungen</h2>
            <p className="text-slate-400 mb-6">Verwalte hier deine Kontoinformationen und -aktionen.</p>

            {feedback && (
                <div className={`p-4 rounded-lg mb-4 text-center font-bold ${feedback.type === 'success' ? 'bg-emerald-800/80 text-emerald-300' : 'bg-red-800/80 text-red-300'}`}>
                {feedback.message}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <h3 className="font-bold text-white">Passwort ändern</h3>
                    <p className="text-slate-400 text-sm mt-1 mb-3">Löst den Versand einer E-Mail zum Zurücksetzen deines Passworts aus.</p>
                    <button
                    onClick={handleChangePassword}
                    disabled={!!loading}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:opacity-90 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                    >
                    {loading === 'password' ? 'Wird gesendet...' : 'Passwort-Reset anfordern'}
                    </button>
                </div>

                <div className="border-t border-slate-700 my-4"></div>

                <div>
                    <h3 className="font-bold text-red-400">Konto löschen</h3>
                    <p className="text-slate-400 text-sm mt-1 mb-3">Dies ist eine endgültige Aktion und kann nicht rückgängig gemacht werden. Alle deine Daten werden gelöscht.</p>
                    <button
                    onClick={handleDeleteAccount}
                    disabled={!!loading}
                    className="w-full bg-gradient-to-r from-red-700 to-rose-800 hover:opacity-90 text-white font-bold py-3 px-5 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                    >
                    {loading === 'delete' ? 'Wird gelöscht...' : 'Konto endgültig löschen'}
                    </button>
                </div>
            </div>
        </div>

        <AvatarEditor player={player} />
    </div>
  );
};

export default UserProfile;
