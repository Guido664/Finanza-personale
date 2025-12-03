
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { WalletIcon } from './Icons';

type AuthView = 'sign_in' | 'sign_up' | 'forgot_password';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<AuthView>('sign_in');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (view === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Registrazione completata! Controlla la tua email per confermare.' });
      } else if (view === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, // Reindirizza all'app corrente
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Se l\'email esiste, riceverai un link per resettare la password.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.error_description || error.message });
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (view) {
      case 'sign_in': return 'Accedi al tuo account';
      case 'sign_up': return 'Crea il tuo account';
      case 'forgot_password': return 'Recupera Password';
    }
  };

  const getButtonText = () => {
     if (loading) return 'Caricamento...';
     switch (view) {
      case 'sign_in': return 'Accedi';
      case 'sign_up': return 'Registrati';
      case 'forgot_password': return 'Invia Link di Reset';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="bg-indigo-600 p-3 rounded-full">
                <WalletIcon className="h-10 w-10 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Gestore Finanziario
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {getTitle()}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Indirizzo Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {view !== 'forgot_password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {view === 'sign_in' && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <button type="button" onClick={() => { setView('forgot_password'); setMessage(null); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                    Password dimenticata?
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {getButtonText()}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  {view === 'forgot_password' ? 'Torna al login' : 'Oppure'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {view === 'forgot_password' ? (
                 <button
                 onClick={() => { setView('sign_in'); setMessage(null); }}
                 className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
               >
                 Torna al login
               </button>
              ) : (
                <button
                  onClick={() => { setView(view === 'sign_in' ? 'sign_up' : 'sign_in'); setMessage(null); }}
                  className="w-full inline-flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm bg-white text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  {view === 'sign_in' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
