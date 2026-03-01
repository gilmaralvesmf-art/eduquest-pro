import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { Camera, Loader2, X, CheckCircle2, Award, RotateCcw, AlertCircle } from 'lucide-react';
import { autoGradeWithKey } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface SuperScannerProps {
  onClose: () => void;
}

const SuperScanner: React.FC<SuperScannerProps> = ({ onClose }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState<{ data: string; title: string; topic: string } | null>(null);
  const [result, setResult] = useState<{ studentAnswers: string[], score: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const captureAndGrade = useCallback(async (answerKey: string, title: string, topic: string) => {
    if (!webcamRef.current) return;
    setLoading(true);
    setError(null);
    setScanning(false);
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Não foi possível capturar a imagem.");
      setLoading(false);
      setScanning(true);
      return;
    }

    try {
      const gradingResult = await autoGradeWithKey(imageSrc, answerKey);
      setExamData({ data: answerKey, title, topic });
      setResult(gradingResult);
      
      // Save to storage history
      storageService.saveScanResult({
        title,
        topic,
        score: gradingResult.score,
        totalQuestions: gradingResult.studentAnswers.length,
        studentAnswers: gradingResult.studentAnswers
      });
    } catch (err: any) {
      console.error(err);
      setError("Erro ao processar correção. Tente novamente.");
      setScanning(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;

    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video?.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          try {
            const url = new URL(code.data);
            const data = url.searchParams.get('data');
            const title = url.searchParams.get('title') || 'Avaliação';
            const topic = url.searchParams.get('topic') || '';

            if (data) {
              // Automatically trigger grading once QR is found
              captureAndGrade(data, title, topic);
            }
          } catch (e) {
            // Not a valid URL or our QR code
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [scanning, captureAndGrade]);

  const reset = () => {
    setExamData(null);
    setResult(null);
    setScanning(true);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[90vh] sm:h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Camera size={20} />
            </div>
            <h2 className="font-bold text-slate-800">Super Scanner EduQuest</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 relative bg-black overflow-hidden">
          {scanning && (
            <>
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
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-3xl relative">
                  <div className="absolute inset-0 border-2 border-indigo-500 rounded-3xl animate-pulse"></div>
                  <div className="absolute -top-10 left-0 right-0 text-center">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      Aponte para o QR Code e Gabarito
                    </span>
                  </div>
                </div>
                <p className="mt-8 text-white/70 text-xs font-medium px-8 text-center">
                  Posicione o QR Code e o gabarito dentro da área demarcada para correção automática.
                </p>
              </div>
            </>
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
              <Loader2 className="animate-spin mb-4" size={48} />
              <p className="font-bold">Processando Correção...</p>
              <p className="text-xs opacity-70 mt-2">Nossa IA está analisando o cartão-resposta</p>
            </div>
          )}

          {result && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20 animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Award size={40} />
              </div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Resultado Final</h3>
              <h2 className="text-xl font-black text-slate-900 mb-2">{examData?.title}</h2>
              <p className="text-slate-500 text-sm mb-6">{examData?.topic}</p>
              
              <div className="text-7xl font-black text-emerald-600 mb-8">
                {result.score}
                <span className="text-2xl text-slate-300 ml-2">/ {result.studentAnswers.length}</span>
              </div>

              <div className="grid grid-cols-5 gap-2 w-full mb-8">
                {result.studentAnswers.map((ans, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    <div className="text-[8px] font-bold text-slate-400 uppercase">Q{i+1}</div>
                    <div className="font-bold text-slate-700">{ans}</div>
                  </div>
                ))}
              </div>

              <button 
                onClick={reset}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <RotateCcw size={20} />
                Escanear Próxima
              </button>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-8 text-center z-20">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Ops! Algo deu errado</h3>
              <p className="text-slate-500 text-sm mb-8">{error}</p>
              <button 
                onClick={reset}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl font-bold hover:bg-slate-900 transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperScanner;
