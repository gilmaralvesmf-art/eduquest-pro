import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Printer, Info, Camera, Loader2, RotateCcw, Award } from 'lucide-react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { gradeAnswerSheet } from '../services/geminiService';
import { storageService } from '../services/storageService';

const Correction: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const data = queryParams.get('data') || '';
  const title = queryParams.get('title') || 'Avaliação';
  const topic = queryParams.get('topic') || '';

  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ studentAnswers: string[], score: number } | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const answers = data.split('|').map(item => {
    const [num, ans] = item.split(':');
    return { num, ans };
  });

  const toggleTorch = useCallback(async () => {
    if (!webcamRef.current || !webcamRef.current.video) return;
    
    const stream = (webcamRef.current.video as any).srcObject as MediaStream;
    if (!stream) return;

    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities() as any;
    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }]
        } as any);
        setTorchOn(!torchOn);
      } catch (err) {
        console.error("Erro ao alternar lanterna:", err);
      }
    } else {
      alert("Lanterna não suportada neste dispositivo/navegador.");
    }
  }, [torchOn]);

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

      // Resize image to improve speed and quality
      const img = new Image();
      img.src = imageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Erro ao carregar imagem para processamento."));
      });
      
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024; // Increased for better detail
      const scale = MAX_WIDTH / img.width;
      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Erro ao processar imagem");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const resizedImageSrc = canvas.toDataURL('image/jpeg', 0.7);

      const gradingResult = await Promise.race([
        gradeAnswerSheet(resizedImageSrc, data),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Tempo limite de processamento atingido. Tente novamente.")), 30000))
      ]) as { studentAnswers: string[], score: number };
      
      setResult(gradingResult);
      setIsScanning(false);

      // Save to history
      storageService.saveScanResult({
        title: title || 'Correção Manual',
        topic: topic || 'Geral',
        score: gradingResult.score,
        totalQuestions: answers.length,
        studentAnswers: gradingResult.studentAnswers
      });
    } catch (error: any) {
      console.error("Erro ao corrigir:", error);
      let userMessage = error.message || "Ocorreu um problema ao processar a imagem. Tente novamente.";
      
      if (userMessage.includes('{"error":')) {
        try {
          const jsonStr = userMessage.split('Falha na correção: ')[1] || userMessage;
          const parsed = JSON.parse(jsonStr);
          if (parsed.error && parsed.error.message) {
            userMessage = `Erro na correção: ${parsed.error.message}`;
          }
        } catch (e) {}
      }
      
      alert(`Erro: ${userMessage}`);
    } finally {
      setLoading(false);
    }
  }, [data, title, topic, answers.length]);

  const resetScanner = () => {
    setResult(null);
    setIsScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link to="/ai-studio" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-medium">
          <ArrowLeft size={20} />
          Voltar ao Estúdio
        </Link>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {!isScanning && !result && (
            <button 
              onClick={() => setIsScanning(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 sm:py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
            >
              <Camera size={18} />
              Corrigir com Câmera
            </button>
          )}
          <button 
            onClick={() => window.print()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-600 px-4 py-3 sm:py-2 rounded-xl font-bold hover:bg-slate-200 transition-all"
          >
            <Printer size={18} />
            Imprimir Gabarito
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="bg-slate-900 rounded-3xl overflow-hidden relative aspect-[3/4] shadow-2xl border-4 border-indigo-500 w-full max-w-md mx-auto">
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
          
          {/* Scanning Line Animation */}
          {!loading && (
            <motion.div 
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] z-10"
            />
          )}

          {/* Alignment Guides */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none z-0">
            <div className="w-full h-full border-2 border-dashed border-white/50 rounded-xl relative">
              {/* Corner Brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500"></div>
            </div>
          </div>

          {/* Flashlight Button */}
          <button 
            onClick={toggleTorch}
            className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md transition-all z-20 ${torchOn ? 'bg-amber-500 text-white' : 'bg-white/20 text-white'}`}
          >
            <Camera size={20} className={torchOn ? 'fill-current' : ''} />
          </button>

          {/* Instructions Overlay */}
          <div className="absolute top-6 left-6 right-16 z-20">
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg inline-block">
              Centralize a folha e evite sombras
            </div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex flex-col sm:flex-row justify-center gap-3 px-6 z-20">
            <button 
              onClick={() => setIsScanning(false)}
              className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/30 transition-all text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={handleScan}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
              {loading ? 'Otimizando e analisando...' : 'Capturar e Corrigir'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-white p-8 rounded-3xl border-4 border-emerald-500 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-full">
            <Award size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900">Nota do Aluno</h2>
            <div className="text-7xl font-black text-emerald-600 mt-2">
              {result.score} <span className="text-2xl text-slate-400">/ {answers.length}</span>
            </div>
            <div className="text-xl font-bold text-slate-500 mt-2">
              {Math.round((result.score / answers.length) * 100)}% de acerto
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 pt-4">
            {answers.map((a, i) => {
              const studentAns = result.studentAnswers[i];
              const isCorrect = studentAns === a.ans;
              return (
                <div key={i} className={`p-2 rounded-lg border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Q{i+1}</div>
                  <div className={`font-black ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {studentAns || '-'}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={resetScanner}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            <RotateCcw size={20} />
            Corrigir Outra Prova
          </button>
        </div>
      )}

      {!isScanning && !result && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Gabarito Digital</h1>
            <p className="text-slate-500">{title} • {topic}</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {answers.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-bold text-sm">
                      {a.num}
                    </span>
                    <span className="font-bold text-slate-700">Questão</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 uppercase font-bold">Gabarito:</span>
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shadow-lg text-lg">
                      {a.ans}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <Info className="text-amber-500 flex-shrink-0" size={20} />
            <p className="text-xs text-amber-700 leading-relaxed">
              Este gabarito foi gerado automaticamente. Use o botão <strong>"Corrigir com Câmera"</strong> no topo para escanear o cartão-resposta do aluno e obter a nota instantaneamente.
            </p>
          </div>
        </div>
      )}
      
      <div className="text-center text-slate-400 text-xs">
        EduQuest Pro • Sistema de Correção Instantânea
      </div>
    </div>
  );
};

export default Correction;
