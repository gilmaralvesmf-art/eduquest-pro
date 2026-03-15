import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2, Award, Calendar, BookOpen, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService, ScanResult } from '../services/storageService';

const History: React.FC = () => {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      storageService.deleteHistoryItem(id);
      setHistory(storageService.getHistory());
    }
  };

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Histórico de Correções</h1>
          <p className="text-slate-500 font-medium">Acompanhe o desempenho das avaliações corrigidas.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar correção..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-medium text-sm w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border-2 border-slate-50 shadow-sm overflow-hidden">
        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b-2 border-slate-50">
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Avaliação</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Data</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Questões</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Acertos</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Aproveitamento</th>
                  <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filteredHistory.map((item, idx) => {
                    const percentage = ((item.score / item.totalQuestions) * 100).toFixed(0);
                    const isGood = Number(percentage) >= 70;
                    
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                              <Award size={24} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                              <p className="text-xs text-slate-500 font-medium">{item.topic}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Calendar size={16} className="text-slate-400" />
                            {new Date(item.scannedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <BookOpen size={16} className="text-slate-400" />
                            {item.totalQuestions}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-lg font-black text-slate-900">{item.score}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-widest ${isGood ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {isGood ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                            {percentage}%
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <HistoryIcon size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Nenhum histórico de correção.</p>
            <p className="text-sm">As provas que você corrigir aparecerão aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
