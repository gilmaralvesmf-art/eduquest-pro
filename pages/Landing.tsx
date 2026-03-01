import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  BrainCircuit, 
  Library, 
  FileCheck, 
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
  Zap,
  Layout,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 rotate-3">
            <GraduationCap className="text-white" size={28} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">EduQuest Pro</span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#recursos" className="text-sm font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Recursos</a>
          <a href="#banco" className="text-sm font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Banco</a>
          <Link to="/dashboard" className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-black transition-all shadow-xl">
            Entrar no Portal
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-24 pb-40 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-50 rounded-full blur-[150px] opacity-70"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-50 rounded-full blur-[150px] opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black mb-10 border-2 border-indigo-100 uppercase tracking-[0.2em]"
          >
            <Zap size={14} className="fill-indigo-700" />
            Potencializado por Inteligência Artificial
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black text-slate-900 mb-10 tracking-tighter leading-[0.9]"
          >
            A revolução na criação de <br />
            <span className="text-indigo-600">avaliações acadêmicas.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-slate-500 max-w-3xl mx-auto mb-14 leading-relaxed font-medium"
          >
            Economize horas de trabalho. Gere questões inéditas com IA, acesse os maiores bancos do Brasil e gerencie o progresso dos seus alunos em um só lugar.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/dashboard" className="w-full sm:w-auto px-12 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center gap-3 group">
              Começar Agora
              <ArrowRight className="group-hover:translate-x-2 transition-transform" size={24} />
            </Link>
            <button className="w-full sm:w-auto px-12 py-6 bg-white text-slate-900 border-2 border-slate-100 rounded-[2rem] font-black text-xl hover:bg-slate-50 transition-all">
              Ver Demonstração
            </button>
          </motion.div>

          {/* Mockup Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-32 relative max-w-6xl mx-auto"
          >
             <div className="absolute -inset-4 bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl -z-10"></div>
             <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl border-8 border-slate-800/50">
                <div className="bg-slate-800 h-10 w-full rounded-t-3xl mb-6 flex items-center px-6 gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                  <div className="flex-1"></div>
                  <div className="w-32 h-2 bg-slate-700 rounded-full"></div>
                </div>
                <div className="aspect-[16/10] bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
                  <div className="text-slate-500 flex flex-col items-center relative z-10">
                    <div className="w-24 h-24 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-indigo-500 mb-6 animate-pulse">
                      <BrainCircuit size={48} />
                    </div>
                    <p className="text-2xl font-black text-white tracking-tight">Interface do Estúdio IA</p>
                    <p className="text-slate-500 mt-2 font-bold uppercase text-xs tracking-widest">Pronto para processar sua solicitação</p>
                  </div>
                </div>
             </div>
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section id="recursos" className="py-40 bg-slate-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Funcionalidades</h2>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                Tudo o que você precisa para ensinar melhor.
              </h3>
            </div>
            <p className="text-xl text-slate-500 font-medium max-w-sm">
              Funcionalidades pensadas por professores para transformar o dia a dia na sala de aula.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={BrainCircuit}
              title="Geração com IA"
              description="Crie questões inéditas e contextualizadas em segundos usando o poder do Gemini Pro."
            />
            <FeatureCard 
              icon={Globe}
              title="Banco Global"
              description="Integração nativa com ENEM, FUVEST e os maiores portais educacionais do mundo."
            />
            <FeatureCard 
              icon={Layout}
              title="Gestão Visual"
              description="Organize suas avaliações em pastas inteligentes e exporte com layout profissional."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40">
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-indigo-600 rounded-[4rem] p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
              <GraduationCap size={300} />
            </div>
            <div className="absolute bottom-0 left-0 p-12 opacity-10 -rotate-12">
              <Sparkles size={200} />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-8 relative z-10 tracking-tighter">Pronto para elevar o nível das suas aulas?</h2>
            <p className="text-indigo-100 text-2xl mb-14 max-w-2xl mx-auto relative z-10 font-medium">
              Junte-se a milhares de professores que já estão usando a IA para transformar a educação.
            </p>
            <Link to="/dashboard" className="inline-flex items-center gap-4 px-14 py-7 bg-white text-indigo-600 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-50 transition-all shadow-2xl relative z-10">
              Acessar Grátis Agora
              <ArrowRight size={32} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">EduQuest Pro</span>
          </div>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">© 2026 EduQuest Pro • Educação do Futuro</p>
          <div className="flex gap-8">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><ShieldCheck size={24}/></a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Users size={24}/></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="bg-white p-12 rounded-[3rem] border-2 border-slate-50 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 group"
  >
    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
      <Icon size={40} />
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-5 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-lg font-medium leading-relaxed">{description}</p>
  </motion.div>
);

export default Landing;
