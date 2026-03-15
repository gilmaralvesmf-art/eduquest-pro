import React from 'react';
import { 
  Users, 
  FileCheck, 
  Sparkles, 
  ArrowUpRight,
  Plus,
  ChevronRight,
  Clock,
  TrendingUp,
  BookOpen,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, icon: Icon, trend, color, limit, usage }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color || 'bg-indigo-50 text-indigo-600'}`}>
        <Icon size={24} />
      </div>
      {trend && (
        <div className="flex items-center text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
          <TrendingUp size={12} className="mr-1.5" />
          {trend}%
        </div>
      )}
    </div>
    <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</h3>
    <div className="flex items-baseline gap-2 mt-2">
      <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
      {limit && (
        <p className="text-sm font-bold text-slate-400">/ {limit}</p>
      )}
    </div>
    
    {limit && usage !== undefined && (
      <div className="mt-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${usage / limit > 0.9 ? 'bg-red-500' : usage / limit > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min((usage / limit) * 100, 100)}%` }}
        />
      </div>
    )}
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-indigo-400">
          {payload[0].value} <span className="text-sm text-slate-500 font-medium">questões</span>
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const stats = storageService.getStats();
  const recentAssessments = storageService.getAssessments().slice(0, 4);

  const chartData = [
    { name: 'Jan', val: Math.floor(Math.random() * 50) + 10 },
    { name: 'Fev', val: Math.floor(Math.random() * 50) + 20 },
    { name: 'Mar', val: Math.floor(Math.random() * 50) + 30 },
    { name: 'Abr', val: Math.floor(Math.random() * 50) + 40 },
    { name: 'Mai', val: Math.floor(Math.random() * 50) + 50 },
    { name: 'Jun', val: stats.totalQuestions > 0 ? stats.totalQuestions : 85 },
  ];

  const getLimits = () => {
    if (!profile) return { assessments: 0, corrections: 0 };
    if (profile.role === 'admin') return { assessments: Infinity, corrections: Infinity };
    switch (profile.subscriptionStatus) {
      case 'monthly': return { assessments: 15, corrections: 150 };
      case 'quarterly': return { assessments: 25, corrections: 300 };
      case 'semiannual': return { assessments: 40, corrections: 500 };
      case 'annual': return { assessments: 60, corrections: 800 };
      default: return { assessments: 0, corrections: 0 }; // Free plan uses freeCredits
    }
  };

  const limits = getLimits();
  const isFree = profile?.subscriptionStatus === 'free';

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Olá, Professor!</h1>
          <p className="text-slate-500 text-lg font-medium">Seu ecossistema de ensino está operando com 100% de eficiência.</p>
        </motion.div>
        
        <Link to="/ai-studio">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-2xl shadow-indigo-200"
          >
            <Plus size={24} />
            Nova Avaliação
          </motion.button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {isFree ? (
           <StatCard 
            title="Créditos Gratuitos" 
            value={profile?.freeCredits || 0} 
            icon={Zap} 
            color="bg-amber-50 text-amber-600" 
          />
        ) : (
          <>
            <StatCard 
              title="Avaliações no Mês" 
              value={profile?.usage?.assessmentsGenerated || 0} 
              limit={limits.assessments === Infinity ? '∞' : limits.assessments}
              usage={profile?.usage?.assessmentsGenerated || 0}
              icon={FileCheck} 
              color="bg-emerald-50 text-emerald-600" 
            />
            <StatCard 
              title="Correções no Mês" 
              value={profile?.usage?.correctionsMade || 0} 
              limit={limits.corrections === Infinity ? '∞' : limits.corrections}
              usage={profile?.usage?.correctionsMade || 0}
              icon={Sparkles} 
              color="bg-violet-50 text-violet-600" 
            />
          </>
        )}
        <StatCard title="Total de Questões" value={stats.totalQuestions.toLocaleString()} icon={BookOpen} trend="12" />
        <StatCard title="Média de Acertos" value={`${stats.avgScore}%`} icon={Users} trend="5" color="bg-blue-50 text-blue-600" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Chart Area */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-8 bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Atividade de Criação</h3>
              <p className="text-slate-400 text-sm font-medium">Volume de questões geradas por mês</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors">
              <option>Últimos 6 meses</option>
              <option>Último ano</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  dy={15}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  dx={-15}
                />
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar 
                  dataKey="val" 
                  radius={[8, 8, 8, 8]}
                  barSize={40}
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : '#c7d2fe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sidebar: Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black tracking-tight">Recentes</h3>
            <Clock size={20} className="text-indigo-400" />
          </div>
          
          <div className="space-y-6 flex-1">
            {recentAssessments.length > 0 ? (
              recentAssessments.map((item, i) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-5 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <FileCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold line-clamp-1">{item.subject}: {item.topic}</p>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">
                      {new Date(item.createdAt).toLocaleDateString()} • {item.difficulty}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/20 py-12">
                <FileCheck size={48} className="mb-4" />
                <p className="text-sm font-bold">Nenhuma atividade</p>
              </div>
            )}
          </div>
          
          <Link to="/assessments" className="mt-10 w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
            Ver Todo Histórico
            <ArrowUpRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
