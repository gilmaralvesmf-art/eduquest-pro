import React, { useRef, useState } from 'react';
import { Download, Loader2, ArrowLeft, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { Question } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';

interface ExamViewProps {
  subject: string;
  topic: string;
  board: string;
  questions: Question[];
  onBack?: () => void;
}

const GabaritoENEM: React.FC<{ questions: Question[], correctionUrl: string }> = ({ questions, correctionUrl }) => {
  return (
    <div className="mt-16 pt-12 border-t-4 border-double border-slate-900">
      <div className="flex justify-between items-start mb-8">
        <div className="text-left">
          <h2 className="text-xl font-black uppercase tracking-widest border-2 border-slate-900 inline-block px-6 py-2">
            Cartão-Resposta / Folha de Rosto
          </h2>
          <p className="text-[10px] font-bold mt-2 text-slate-500 uppercase tracking-widest">Exame Nacional do Ensino Médio • Modelo EduQuest Pro</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="p-2 border-2 border-slate-900 rounded-xl bg-white">
            <QRCodeSVG value={correctionUrl} size={80} />
          </div>
          <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">Gabarito Digital</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div className="border-2 border-slate-900 p-3">
            <span className="text-[10px] font-bold block mb-1 uppercase">Nome do Candidato</span>
            <div className="h-6 border-b border-slate-300"></div>
          </div>
          <div className="border-2 border-slate-900 p-3">
            <span className="text-[10px] font-bold block mb-1 uppercase">Assinatura do Candidato</span>
            <div className="h-6 border-b border-slate-300"></div>
          </div>
        </div>
        <div className="border-2 border-slate-900 p-3 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold block mb-1 uppercase">Instruções</span>
            <ul className="text-[9px] list-disc ml-4 space-y-1">
              <li>Preencha todo o círculo com caneta esferográfica preta.</li>
              <li>Não rasure, não dobre e não amasse esta folha.</li>
              <li>Marque apenas uma alternativa por questão.</li>
            </ul>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div className="text-[10px] font-bold">DATA: ____/____/____</div>
            <div className="w-12 h-12 border-2 border-slate-900 flex items-center justify-center font-black text-xl">
              {questions.length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-3 max-w-md mx-auto">
        {questions.map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-slate-200 pb-2">
            <span className="w-8 h-8 bg-slate-900 text-white rounded flex items-center justify-center text-xs font-black">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex gap-4">
              {['A', 'B', 'C', 'D', 'E'].map(letter => (
                <div key={letter} className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold">
                  {letter}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExamView: React.FC<ExamViewProps> = ({ subject, topic, board, questions, onBack }) => {
  const examRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!examRef.current) return;
    setExporting(true);
    try {
      const element = examRef.current;
      const opt = {
        margin:       10,
        filename:     `Avaliacao_${subject}_${topic.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, windowWidth: element.scrollWidth },
        jsPDF:        { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF.');
    } finally {
      setExporting(false);
    }
  };

  const answerKey = questions.map((q, i) => `${i + 1}:${q.correctAnswer.substring(0, 1)}`).join('|');
  const correctionUrl = `${window.location.origin}/#/correct?data=${encodeURIComponent(answerKey)}&title=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-white p-12 pb-24 shadow-2xl rounded-3xl print:shadow-none print:p-0 print:m-0" ref={examRef}>
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Avaliação de {subject}</h1>
            <p className="text-slate-500 font-bold mt-1 uppercase text-xs tracking-widest">Tópico: {topic} • Banca: {board}</p>
            <div className="mt-6 space-y-3">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Nome do Aluno</span>
                  <div className="border-b-2 border-slate-200 w-80 h-6"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Data</span>
                  <div className="border-b-2 border-slate-200 w-32 h-6"></div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Turma</span>
                  <div className="border-b-2 border-slate-200 w-32 h-6"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400">Nota</span>
                  <div className="border-b-2 border-slate-200 w-32 h-6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          {questions.map((q, idx) => (
            <div key={idx} className="break-inside-avoid mb-8">
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-sm print:bg-slate-200 print:text-slate-900 print:border print:border-slate-900">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 mb-4 leading-relaxed text-lg">{q.text}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {q.options?.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-start gap-4 group">
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-black group-hover:border-slate-900 transition-colors print:border-slate-900">
                          {String.fromCharCode(65 + oIdx)}
                        </div>
                        <span className="text-base text-slate-700 leading-snug print:text-black">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="break-before-page">
          <GabaritoENEM questions={questions} correctionUrl={correctionUrl} />
        </div>
      </div>

      <div className="flex justify-center gap-4 py-8 border-t border-slate-200 print:hidden">
        {onBack && (
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        )}
        <button 
          onClick={() => window.print()}
          className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-2"
        >
          <Printer size={20} />
          Imprimir
        </button>
        <button 
          onClick={handleExportPDF}
          disabled={exporting}
          className={`px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          {exporting ? 'Gerando PDF...' : 'Baixar PDF'}
        </button>
      </div>
    </motion.div>
  );
};

export default ExamView;
