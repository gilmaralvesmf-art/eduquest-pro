import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Sparkles, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  auth
} from '../firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      // Context will handle redirect
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Este email já está em uso.");
      } else if (err.code === 'auth/weak-password') {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Preencha email e senha.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex justify-center"
        >
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <BrainCircuit className="text-white" size={32} />
          </div>
        </motion.div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          EduQuest Pro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          A inteligência artificial a favor do professor.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles size={16} className="mr-2" />
              Ganhe 3 provas gratuitas
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailLogin} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
                </button>
              </motion.form>
            )}

            {mode === 'register' && (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailRegister} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Prof. João Silva"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Criar Conta'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-slate-600">
                Não tem uma conta?{' '}
                <button onClick={() => setMode('register')} className="font-bold text-indigo-600 hover:text-indigo-500">
                  Cadastre-se grátis
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Já tem uma conta?{' '}
                <button onClick={() => setMode('login')} className="font-bold text-indigo-600 hover:text-indigo-500">
                  Faça login
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
