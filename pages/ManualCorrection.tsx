import React, { useState, useRef, useCallback } from 'react';
import { Camera, Loader2, CheckCircle2, RotateCcw, Award, Save, AlertCircle } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'motion/react';
import { gradeAnswerSheet } from '../services/geminiService';
import { storageService } from '../services/storageService';

const ManualCorrection: React.FC = () => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [answerKey, setAnswerKey] = useState<string[]>(Array(10).fill(''));
  
  const [step, setStep] = useState<'setup' | 'scan' | 'result'>('setup');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ studentAnswers: string[], score: number } | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(e.target.value);
    setNumQuestions(num);
    setAnswerKey(prev => {
      const newKey = [...prev];
      if (num > newKey.length) {
        return [...newKey, ...Array(num - newKey.length).fill('')];
      }
      return newKey.slice(0, num);
    });
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newKey = [...answerKey];
    newKey[index] = value.toUpperCase();
    setAnswerKey(newKey);
  };

  const isSetupComplete = title.trim() !== '' && answerKey.every(ans => ['A', 'B', 'C', 'D', 'E'].includes(ans));

  const startScanning = () => {
    if (!isSetupComplete) {
      alert('Por favor, preencha o título e todas as respostas do gabarito (A, B, C, D ou E).');
      return;
    }
    setStep('scan');
  };

  const handleScan = useCallback(async () => {
    if (!webcamRef.current) {
      alert("Câmera não inicializada.");
      return;
    }
    
    setLoading(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        throw new Error("Não foi possível capturar a imagem da câmera. Verifique as permissões.");
      }

      // Format answer key for Gemini service
      const formattedKey = answerKey.map((ans, i) => `${i + 1}:${ans}`).join('|');
      
      const gradingResult = await gradeAnswerSheet(imageSrc, formattedKey);
      setResult(gradingResult);
      setStep('result');

      // Save to history
      storageService.saveScanResult({
        title: title || 'Correção Manual',
        topic: topic || 'Geral',
        score: gradingResult.score,
        totalQuestions: numQuestions,
        studentAnswers: gradingResult.studentAnswers
      });
    } catch (error: any) {
      console.error("Erro ao corrigir:", error);
      alert(`Erro: ${error.message || "Ocorreu um problema ao processar a imagem. Tente novamente."}`);
    } finally {
      setLoading(false);
    }
  }, [answerKey, title, topic, numQuestions]);

  const resetScanner = () => {
    setResult(null);
    setStep('scan');
  };

  const startNew = () => {
    setResult(null);
    setStep('setup');
    setTitle('');
    setTopic('');
    setAnswerKey(Array(numQuestions).fill(''));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Correção Rápida</h1>
          <p className="text-slate-500 font-medium">Crie um gabarito e corrija provas instantaneamente com a câmera.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Título da Avaliação</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Prova de Matemática - 1º Bimestre"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Disciplina / Tópico (Opcional)</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Frações e Decimais"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium focus:border-indigo-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900">Gabarito Oficial</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-bold text-slate-500">Número de Questões:</label>
                  <select 
                    value={numQuestions}
                    onChange={handleNumQuestionsChange}
                    className="bg-slate-100 border-none rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[5, 10, 15, 20, 25, 30, 40, 50].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {answerKey.map((ans, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-indigo-500 focus-within:bg-indigo-50/30 transition-all">
                    <span className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-600 rounded-lg font-black text-sm shrink-0">
                      {idx + 1}
                    </span>
                    <input 
                      type="text" 
                      maxLength={1}
                      value={ans}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      placeholder="A-E"
                      className="w-full bg-transparent border-none text-center font-black text-xl text-slate-900 uppercase placeholder:text-slate-300 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                onClick={startScanning}
                disabled={!isSetupComplete}
                className={`px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl ${
                  isSetupComplete 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Camera size={20} />
                Iniciar Correção
              </button>
            </div>
            {!isSetupComplete && (
              <p className="text-right text-xs text-amber-500 font-bold mt-2 flex items-center justify-end gap-1">
                <AlertCircle size={14} />
                Preencha o título e todas as alternativas (A, B, C, D ou E) para continuar.
              </p>
            )}
          </motion.div>
        )}

        {step === 'scan' && (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 rounded-[3rem] overflow-hidden relative aspect-[3/4] md:aspect-video shadow-2xl border-4 border-indigo-500 w-full max-w-3xl mx-auto"
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              videoConstraints={{ 
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[20px] sm:border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-white/50 rounded-2xl flex items-center justify-center">
                <div className="bg-black/50 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold text-sm tracking-widest uppercase">
                  Alinhe o cartão-resposta aqui
                </div>
              </div>
            </div>
            <div className="absolute bottom-8 left-0 right-0 flex flex-col sm:flex-row justify-center gap-4 px-8">
              <button 
                onClick={() => setStep('setup')}
                className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-all text-sm"
              >
                Voltar
              </button>
              <button 
                onClick={handleScan}
                disabled={loading}
                className="flex-1 max-w-xs bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3 text-lg"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                {loading ? 'Analisando...' : 'Capturar'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] border-4 border-emerald-500 shadow-2xl text-center space-y-8 max-w-3xl mx-auto"
          >
            <div className="inline-flex p-6 bg-emerald-100 text-emerald-600 rounded-[2rem] shadow-inner">
              <Award size={64} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nota do Aluno</h2>
              <p className="text-slate-500 font-bold mt-2">{title}</p>
              <div className="text-[8rem] leading-none font-black text-emerald-600 mt-4 tracking-tighter">
                {result.score} <span className="text-4xl text-slate-300">/ {numQuestions}</span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-full text-slate-600 font-bold text-sm">
                Aproveitamento: {((result.score / numQuestions) * 100).toFixed(0)}%
              </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 pt-8 border-t-2 border-slate-100">
              {answerKey.map((correctAns, i) => {
                const studentAns = result.studentAnswers[i];
                const isCorrect = studentAns === correctAns;
                return (
                  <div key={i} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Q{i+1}</div>
                    <div className={`font-black text-lg ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                      {studentAns || '-'}
                    </div>
                    <div className="text-[8px] font-bold text-slate-400">
                      Gabarito: {correctAns}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
              <button 
                onClick={resetScanner}
                className="flex-1 flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
              >
                <Camera size={20} />
                Corrigir Próxima Prova
              </button>
              <button 
                onClick={startNew}
                className="flex-1 flex items-center justify-center gap-3 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                <RotateCcw size={20} />
                Novo Gabarito
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManualCorrection;
