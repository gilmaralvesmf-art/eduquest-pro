import React, { useState, useEffect } from 'react';
import { Library, BookOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService } from '../services/storageService';
import { Question } from '../types';

const QuestionBank: React.FC = () => {
  const [results, setResults] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const saved = storageService.getSavedQuestions();
    setResults(saved);
    setLoading(false);
  }, []);

  const handleDelete = (text: string) => {
    if (window.confirm('Remover esta questão do seu banco?')) {
      storageService.deleteSavedQuestion(text);
      setResults(storageService.getSavedQuestions());
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-amber-100 rotate-3">
            <Library size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Meu Banco de Questões</h1>
            <p className="text-slate-500 font-medium">Questões que você salvou para usar em suas avaliações.</p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-32 flex flex-col items-center justify-center space-y-6"
            >
              <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">Carregando seu acervo...</p>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-8"
            >
              {results.map((q, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all duration-300 group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                      <div className="px-5 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
                        {q.source || 'Banca Oficial'}
                      </div>
                      <div className="px-5 py-2 bg-slate-50 text-slate-500 text-[10px] font-black rounded-full uppercase tracking-widest">
                        {q.year || '2024'}
                      </div>
                    </div>
                  </div>

                  <div className="mb-10">
                    <p className="text-slate-900 text-2xl font-bold leading-relaxed tracking-tight whitespace-pre-wrap">{q.text}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {q.options?.map((opt, oIdx) => {
                      const isCorrect = opt === q.correctAnswer;
                      return (
                        <div 
                          key={oIdx}
                          className={`p-6 rounded-[2rem] border-2 flex items-center gap-5 transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-slate-200'}`}
                        >
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-2 border-slate-200'}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </div>
                          <span className="text-base font-bold">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-10 border-t-2 border-slate-50 gap-6">
                    <div className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest">
                      <BookOpen size={18} className="text-indigo-600" />
                      Assunto: {q.topic || q.subject}
                    </div>
                    <button 
                      onClick={() => handleDelete(q.text)}
                      className="w-full sm:w-auto px-10 py-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 size={18} />
                      Remover do Banco
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 bg-white rounded-[4rem] border-4 border-dashed border-slate-50 text-center"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8">
                <Library size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Seu banco está vazio</h3>
              <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">As questões que você salvar aparecerão aqui para consulta futura.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default QuestionBank;
