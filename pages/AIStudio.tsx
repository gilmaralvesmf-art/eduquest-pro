import React, { useState, useRef } from 'react';
import { BrainCircuit, Sparkles, Send, Loader2, CheckCircle2, Clipboard, FileText, QrCode, Download, Printer, Camera, AlertCircle, ChevronRight, History, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import remarkGfm from 'remark-gfm';
import { generateQuestions } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { Question, Difficulty } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2pdf from 'html2pdf.js';
import SuperScanner from '../components/SuperScanner';
import ExamView from '../components/ExamView';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const AIStudio: React.FC = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('Matemática');
  const [topic, setTopic] = useState('');
  const [board, setBoard] = useState('ENEM');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = useState(5);
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'open' | 'mixed'>('multiple_choice');
  const [loading, setLoading] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showExam, setShowExam] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    // Verificar limites de uso
    if (profile) {
      const { subscriptionStatus, freeCredits, usage } = profile;
      
      if (subscriptionStatus === 'free' && freeCredits <= 0) {
        navigate('/pricing');
        return;
      }

      if (subscriptionStatus === 'lifetime' || profile.role === 'admin') {
        // Unlimited access
      } else {
        const limits = {
          monthly: 15,
          quarterly: 25,
          semiannual: 40,
          annual: 60
        };

        const limit = limits[subscriptionStatus as keyof typeof limits] || 0;
        if (usage?.assessmentsGenerated >= limit) {
           setError(`Você atingiu o limite de ${limit} avaliações do seu plano ${subscriptionStatus}.`);
           return;
        }
      }
    }

    setLoading(true);
    setError(null);
    setShowExam(false);
    try {
      const result = await generateQuestions(subject, topic, count, difficulty, board, questionType);
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
        
        // Decrement credits if free user or increment usage if paid
        if (user && profile) {
          const userRef = doc(db, 'users', user.uid);
          if (profile.subscriptionStatus === 'free') {
            await updateDoc(userRef, {
              freeCredits: profile.freeCredits - 1
            });
          } else if (profile.role !== 'admin') {
             await updateDoc(userRef, {
              'usage.assessmentsGenerated': (profile.usage?.assessmentsGenerated || 0) + 1
            });
          }
        }

        setShowExam(true);
      } else {
        throw new Error("Nenhuma questão foi gerada. Tente mudar o tópico ou a banca.");
      }
    } catch (err: any) {
      console.error(err);
      let userMessage = "Ocorreu um erro inesperado ao gerar as questões.";
      const errorStr = JSON.stringify(err);
      
      if (errorStr.includes('503') || errorStr.includes('UNAVAILABLE')) {
        userMessage = "O servidor de IA está com altíssima demanda no momento. Já estamos tentando novamente de forma automática, mas se o erro persistir, por favor aguarde 1 minuto e tente novamente.";
      } else if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        userMessage = "Limite de requisições da IA atingido. Por favor, aguarde um instante e tente novamente.";
      } else if (err.message) {
        userMessage = err.message;
      }
      
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceQuestion = async (index: number) => {
    setReplacingIndex(index);
    setError(null);
    try {
      // Generate just one new question
      // Use the same parameters but count = 1
      // If questionType is mixed, we'll just get one of either
      const result = await generateQuestions(subject, topic, 1, difficulty, board, questionType);
      if (result && result.length > 0) {
        const newQuestions = [...questions];
        newQuestions[index] = result[0];
        setQuestions(newQuestions);
      }
    } catch (err: any) {
      console.error(err);
      let userMessage = "Falha ao substituir a questão. Tente novamente.";
      const errorStr = JSON.stringify(err);
      
      if (errorStr.includes('503') || errorStr.includes('UNAVAILABLE')) {
        userMessage = "O servidor de IA está ocupado. Por favor, tente substituir novamente em alguns segundos.";
      }
      
      setError(userMessage);
    } finally {
      setReplacingIndex(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditedQuestion({ ...questions[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editedQuestion) {
      const newQuestions = [...questions];
      newQuestions[editingIndex] = editedQuestion;
      setQuestions(newQuestions);
      setEditingIndex(null);
      setEditedQuestion(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedQuestion(null);
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
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setQuestionType('multiple_choice')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${questionType === 'multiple_choice' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Múltipla Escolha
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('open')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${questionType === 'open' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Discursiva
              </button>
              <button
                type="button"
                onClick={() => setQuestionType('mixed')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${questionType === 'mixed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mesclada
              </button>
            </div>

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
                  <option>Artes</option>
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
                  <optgroup label="Militares">
                    <option>ITA</option>
                    <option>IME</option>
                    <option>EsPCEx</option>
                    <option>ESA</option>
                    <option>Colégio Naval</option>
                    <option>EPCAR</option>
                    <option>AFA</option>
                    <option>EFOMM</option>
                    <option>EAM</option>
                  </optgroup>
                  <optgroup label="Vestibulares">
                    <option>ENEM</option>
                    <option>FUVEST</option>
                    <option>UNICAMP</option>
                    <option>UNESP (VUNESP)</option>
                    <option>UERJ</option>
                    <option>UFRGS</option>
                    <option>UFSC</option>
                    <option>URCA</option>
                    <option>UECE</option>
                    <option>UPE</option>
                    <option>UFPE</option>
                  </optgroup>
                  <optgroup label="Concursos">
                    <option>FGV</option>
                    <option>FCC</option>
                    <option>Cebraspe</option>
                  </optgroup>
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
                    <option value={Difficulty.MIXED}>Mesclada (Fácil, Médio e Difícil)</option>
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
                disabled={loading || (profile?.subscriptionStatus === 'free' && profile.freeCredits <= 0)}
                className={`w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] ${(loading || (profile?.subscriptionStatus === 'free' && profile.freeCredits <= 0)) ? 'opacity-70 cursor-not-allowed' : ''}`}
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
              
              {profile?.subscriptionStatus === 'lifetime' ? (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Você tem <span className="font-bold text-indigo-600">Créditos Ilimitados Vitalícios</span>.
                </p>
              ) : profile?.subscriptionStatus === 'free' && (
                <p className="text-center text-sm text-slate-500 mt-4">
                  Você tem <span className="font-bold text-indigo-600">{profile.freeCredits}</span> {profile.freeCredits === 1 ? 'prova gratuita restante' : 'provas gratuitas restantes'}.
                </p>
              )}
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
                      className={`group bg-white p-8 rounded-[2rem] border-2 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 ${replacingIndex === idx ? 'opacity-50 pointer-events-none' : 'border-slate-100 hover:border-indigo-600'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{q.difficulty}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{board} • {subject} • {q.questionType === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {replacingIndex === idx ? (
                            <Loader2 className="animate-spin text-indigo-600" size={20} />
                          ) : (
                            <>
                              <button 
                                onClick={() => handleReplaceQuestion(idx)}
                                title="Refazer esta questão com IA"
                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <History size={20} />
                              </button>
                              <button 
                                onClick={() => handleStartEdit(idx)}
                                title="Editar manualmente"
                                className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              >
                                <Send size={20} className="rotate-90" />
                              </button>
                              <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                <Clipboard size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingIndex === idx && editedQuestion ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enunciado</label>
                            <textarea 
                              value={editedQuestion.text}
                              onChange={(e) => setEditedQuestion({ ...editedQuestion, text: e.target.value })}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[150px]"
                            />
                          </div>
                          
                          {editedQuestion.questionType === 'multiple_choice' && editedQuestion.options && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alternativas</label>
                              {editedQuestion.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs">{String.fromCharCode(65 + oIdx)}</span>
                                  <input 
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...editedQuestion.options!];
                                      newOpts[oIdx] = e.target.value;
                                      setEditedQuestion({ ...editedQuestion, options: newOpts });
                                    }}
                                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all"
                                  />
                                  <input 
                                    type="radio"
                                    name={`correct-${idx}`}
                                    checked={opt === editedQuestion.correctAnswer}
                                    onChange={() => setEditedQuestion({ ...editedQuestion, correctAnswer: opt })}
                                    className="w-4 h-4 text-indigo-600"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {editedQuestion.questionType === 'open' && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Padrão de Resposta</label>
                              <textarea 
                                value={editedQuestion.correctAnswer}
                                onChange={(e) => setEditedQuestion({ ...editedQuestion, correctAnswer: e.target.value })}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700 focus:border-indigo-600 focus:bg-white outline-none transition-all min-h-[100px]"
                              />
                            </div>
                          )}

                          <div className="flex gap-2 pt-4">
                            <button 
                              onClick={handleSaveEdit}
                              className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                              Salvar Alterações
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="bg-slate-100 text-slate-600 px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="prose prose-slate max-w-none mb-8">
                            <MarkdownRenderer content={q.text} />
                          </div>
                          
                          {q.visualType && q.visualType !== 'none' && q.visualContent && (
                            <div className="mb-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                  {q.visualType === 'table' ? 'Tabela' : 
                                  q.visualType === 'graph' ? 'Gráfico' : 
                                  q.visualType === 'infographic' ? 'Infográfico' : 'Charge'}
                                </span>
                              </div>
                              <div className="prose prose-sm prose-slate max-w-none overflow-x-auto">
                                <MarkdownRenderer content={q.visualContent} />
                              </div>
                            </div>
                          )}
                          
                          {q.questionType === 'open' ? (
                            <div className="mt-6">
                              <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle2 size={20} className="text-emerald-500" />
                                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Padrão de Resposta Esperado</span>
                                </div>
                                <div className="text-base font-medium prose prose-sm prose-slate max-w-none">
                                  <MarkdownRenderer content={q.correctAnswer} />
                                </div>
                              </div>
                            </div>
                          ) : (
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
                                    <div className="text-base font-medium flex-1 prose prose-sm prose-slate max-w-none">
                                      <MarkdownRenderer content={opt} />
                                    </div>
                                    {isCorrect && <CheckCircle2 size={20} className="text-emerald-500" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
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
