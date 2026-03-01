import React, { useState, useRef } from 'react';
import { BrainCircuit, Sparkles, Send, Loader2, CheckCircle2, Clipboard, FileText, QrCode, Download, Printer, Camera, AlertCircle, ChevronRight, History, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateQuestions } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Question, Difficulty } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import SuperScanner from '../components/SuperScanner';
import ExamView from '../components/ExamView';

const AIStudio: React.FC = () => {
  const [subject, setSubject] = useState('Matemática');
  const [topic, setTopic] = useState('');
  const [board, setBoard] = useState('ENEM');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showExam, setShowExam] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError(null);
    setShowExam(false);
    try {
      const result = await generateQuestions(subject, topic, count, difficulty, board);
      if (result && result.length > 0) {
        setQuestions(result);
        // Save to storage
        storageService.saveAssessment({
          subject,
          topic,
          board,
          difficulty,
          questions: result
        });
        setShowExam(true);
      } else {
        throw new Error("Nenhuma questão foi gerada. Tente mudar o tópico ou a banca.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocorreu um erro inesperado ao gerar as questões.");
    } finally {
      setLoading(false);
    }
  };

  if (showExam && questions.length > 0) {
    return (
      <ExamView 
        subject={subject}
        topic={topic}
        board={board}
        questions={questions}
        onBack={() => setShowExam(false)}
      />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 rotate-3 hover:rotate-0 transition-transform duration-300">
            <BrainCircuit size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Estúdio de IA</h1>
            <p className="text-slate-500 font-medium">Geração inteligente de avaliações e correção instantânea.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowScanner(true)}
            className="group flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-xl"
          >
            <Camera size={20} className="group-hover:scale-110 transition-transform" />
            Super Scanner
          </button>
          <AnimatePresence>
            {questions.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setShowExam(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
              >
                <FileText size={20} />
                Gerar Prova Impressa
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {showScanner && <SuperScanner onClose={() => setShowScanner(false)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm sticky top-8">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" />
              Configuração
            </h2>
            
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Disciplina</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all appearance-none"
                >
                  <option>Matemática</option>
                  <option>Português</option>
                  <option>História</option>
                  <option>Geografia</option>
                  <option>Biologia</option>
                  <option>Física</option>
                  <option>Química</option>
                  <option>Inglês</option>
                  <option>Sociologia</option>
                  <option>Filosofia</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Assunto Detalhado</label>
                <input 
                  type="text"
                  placeholder="Ex: Revolução Industrial na Inglaterra"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Estilo da Banca</label>
                <select 
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all appearance-none"
                >
                  <option>ENEM</option>
                  <option>VUNESP</option>
                  <option>FGV</option>
                  <option>FCC</option>
                  <option>Cebraspe</option>
                  <option>FUVEST</option>
                  <option>Unicamp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Dificuldade</label>
                  <select 
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all appearance-none"
                  >
                    <option value={Difficulty.EASY}>Fácil</option>
                    <option value={Difficulty.MEDIUM}>Médio</option>
                    <option value={Difficulty.HARD}>Difícil</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Questões</label>
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Criando Questões...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Gerar Agora
                  </>
                )}
              </button>
            </form>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex gap-3 items-start"
              >
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <p className="text-xs text-red-700 font-bold leading-relaxed">{error}</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {questions.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    Questões Geradas <span className="text-indigo-600 ml-1">({questions.length})</span>
                  </h3>
                  <button 
                    onClick={() => setQuestions([])}
                    className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                  >
                    <Trash2 size={16} />
                    Limpar Tudo
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {questions.map((q, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white p-8 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-600 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-indigo-50"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{q.difficulty}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{board} • {subject}</span>
                          </div>
                        </div>
                        <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                          <Clipboard size={20} />
                        </button>
                      </div>

                      <p className="text-xl font-bold text-slate-900 mb-8 leading-relaxed tracking-tight">{q.text}</p>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {q.options?.map((opt, oIdx) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div 
                              key={oIdx} 
                              className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-50 text-slate-600 hover:border-slate-200'}`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-white border-2 border-slate-200'}`}>
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="text-base font-medium flex-1">{opt}</span>
                              {isCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-12 text-center"
              >
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-8 animate-bounce">
                  <Sparkles size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">O que vamos criar hoje?</h3>
                <p className="text-slate-400 max-w-sm font-medium text-lg">
                  Configure os parâmetros ao lado e veja a mágica da Inteligência Artificial acontecer.
                </p>
                <div className="mt-12 flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                      <FileText size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provas</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                      <QrCode size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correção</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                      <History size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Histórico</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;
