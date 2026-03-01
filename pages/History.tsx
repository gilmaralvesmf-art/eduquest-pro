import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Trash2, Award, Calendar, BookOpen, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService, ScanResult } from '../services/storageService';

const History: React.FC = () => {
  const [history, setHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    setHistory(storageService.getHistory());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este registro?')) {
      storageService.deleteHistoryItem(id);
      setHistory(storageService.getHistory());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Histórico de Correções</h1>
          <p className="text-slate-500 font-medium">Acompanhe o desempenho das avaliações corrigidas.</p>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {history.length > 0 ? (
            history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Award size={32} />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-2">{item.topic}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(item.scannedAt).toLocaleString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      {item.totalQuestions} Questões
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 px-8 border-x border-slate-100 hidden md:flex">
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-600">{item.score}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acertos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-900">{((item.score / item.totalQuestions) * 100).toFixed(0)}%</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aproveitamento</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-slate-100 rounded-[3rem]">
              <HistoryIcon size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhum histórico de correção.</p>
              <p className="text-sm">As provas que você corrigir aparecerão aqui.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default History;
