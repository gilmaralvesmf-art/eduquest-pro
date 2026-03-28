import React, { useRef, useState } from 'react';
import { Download, Loader2, ArrowLeft, Printer, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Question } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

interface ExamViewProps {
  subject: string;
  topic: string;
  board: string;
  questions: Question[];
  onBack?: () => void;
}

const GabaritoComentado: React.FC<{ questions: Question[] }> = ({ questions }) => {
  return (
    <div className="mt-12 pt-8 border-t-4 border-slate-900">
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 bg-slate-900 text-white inline-block px-4 py-1">
        Gabarito Comentado (Professor)
      </h2>
      <div className="space-y-8">
        {questions.map((q, i) => (
          <div key={i} className="break-inside-avoid p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-sm">
                {i + 1}
              </span>
              {q.questionType !== 'open' && (
                <span className="font-black text-slate-900 uppercase text-xs tracking-widest">
                  Resposta Correta: {q.options && q.options.findIndex(opt => opt === q.correctAnswer) >= 0 ? String.fromCharCode(65 + q.options.findIndex(opt => opt === q.correctAnswer)) : q.correctAnswer.substring(0, 1)}
                </span>
              )}
            </div>
            {q.questionType === 'open' && (
              <div className="prose prose-sm prose-slate max-w-none mb-4">
                <span className="font-black not-italic text-emerald-600 mr-2 uppercase tracking-widest text-xs">Padrão de Resposta:</span>
                <MarkdownRenderer content={q.correctAnswer} />
              </div>
            )}
            <div className="prose prose-sm prose-slate max-w-none italic">
              <span className="font-black not-italic text-indigo-600 mr-2">Comentário:</span>
              <MarkdownRenderer content={q.commentary || "Sem comentário disponível."} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [isTeacherMode, setIsTeacherMode] = useState(false);

  const handleExportPDF = async (mode: 'student' | 'teacher') => {
    if (!examRef.current) return;
    setExporting(true);
    // Temporarily set mode to render correctly for PDF
    const prevMode = isTeacherMode;
    setIsTeacherMode(mode === 'teacher');
    
    // Wait for state update and re-render
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const element = examRef.current;
      const opt = {
        margin:       10,
        filename:     `${mode === 'teacher' ? 'Professor' : 'Aluno'}_${subject}_${topic.replace(/\s+/g, '_')}.pdf`,
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
      setIsTeacherMode(prevMode);
      setExporting(false);
    }
  };

  const handleExportWord = async (mode: 'student' | 'teacher') => {
    setExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `Avaliação de ${subject}${mode === 'teacher' ? ' (Professor)' : ''}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Tópico: ${topic}`, bold: true }),
                new TextRun({ text: `  •  Banca: ${board}`, bold: true }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "Nome do Aluno: ________________________________________________" })],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Data: ____/____/____" })],
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "Turma: ________________" })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Nota: ________" })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            ...questions.flatMap((q, idx) => {
              const questionElements = [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${idx + 1}. `, bold: true }),
                    new TextRun({ text: q.text.replace(/[*_~`]/g, '') }), // Basic markdown stripping for Word
                  ],
                  spacing: { before: 400 },
                }),
              ];

              if (q.questionType === 'open') {
                if (mode === 'student') {
                  for (let i = 0; i < 5; i++) {
                    questionElements.push(new Paragraph({ text: "____________________________________________________________________________________" }));
                  }
                } else {
                  questionElements.push(new Paragraph({
                    children: [
                      new TextRun({ text: "Padrão de Resposta: ", bold: true, color: "10b981" }),
                      new TextRun({ text: q.correctAnswer.replace(/[*_~`]/g, '') }),
                    ],
                  }));
                }
              } else {
                q.options?.forEach((opt, oIdx) => {
                  const isCorrect = opt === q.correctAnswer;
                  questionElements.push(new Paragraph({
                    children: [
                      new TextRun({ text: `${String.fromCharCode(65 + oIdx)}) `, bold: mode === 'teacher' && isCorrect }),
                      new TextRun({ text: opt.replace(/[*_~`]/g, ''), bold: mode === 'teacher' && isCorrect, color: mode === 'teacher' && isCorrect ? "10b981" : undefined }),
                    ],
                    indent: { left: 720 },
                  }));
                });
              }

              if (mode === 'teacher' && q.commentary) {
                questionElements.push(new Paragraph({
                  children: [
                    new TextRun({ text: "Comentário: ", bold: true, color: "4f46e5" }),
                    new TextRun({ text: q.commentary.replace(/[*_~`]/g, ''), italics: true }),
                  ],
                  indent: { left: 360 },
                  spacing: { before: 200 },
                }));
              }

              return questionElements;
            }),
            ...(mode === 'teacher' ? [
              new Paragraph({ text: "", spacing: { before: 800 } }),
              new Paragraph({
                text: "Gabarito Oficial",
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
              }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: questions.map((q, i) => {
                  const correctIndex = q.options?.findIndex(opt => opt === q.correctAnswer) ?? -1;
                  const letter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : (q.questionType === 'open' ? 'Discursiva' : q.correctAnswer.substring(0, 1));
                  return new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ text: `Questão ${i + 1}` })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: letter, bold: true })] })] }),
                    ],
                  });
                }),
              }),
            ] : []),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${mode === 'teacher' ? 'Professor' : 'Aluno'}_${subject}_${topic.replace(/\s+/g, '_')}.docx`);
    } catch (error) {
      console.error('Erro ao exportar Word:', error);
      alert('Ocorreu um erro ao gerar o arquivo Word.');
    } finally {
      setExporting(false);
    }
  };

  const answerKey = questions.map((q, i) => {
    if (q.questionType === 'open') return `${i + 1}:-`;
    const correctIndex = q.options?.findIndex(opt => opt === q.correctAnswer) ?? -1;
    const letter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : q.correctAnswer.substring(0, 1);
    return `${i + 1}:${letter}`;
  }).join('|');
  const correctionUrl = `${window.location.origin}/#/correct?data=${encodeURIComponent(answerKey)}&title=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex justify-center gap-4 mb-4 print:hidden">
        <button 
          onClick={() => setIsTeacherMode(false)}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${!isTeacherMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Visualizar Aluno
        </button>
        <button 
          onClick={() => setIsTeacherMode(true)}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${isTeacherMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200'}`}
        >
          Visualizar Professor
        </button>
      </div>

      <div className="bg-white p-12 pb-24 shadow-2xl rounded-3xl print:shadow-none print:p-0 print:m-0" ref={examRef}>
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
              Avaliação de {subject} {isTeacherMode && <span className="text-indigo-600">(Professor)</span>}
            </h1>
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
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 print:text-slate-500">
                      {isTeacherMode && `Dificuldade: ${q.difficulty}`}
                    </span>
                  </div>
                  <div className="prose prose-slate max-w-none mb-4 print:text-black">
                    <MarkdownRenderer content={q.text} />
                  </div>

                  {q.visualType && q.visualType !== 'none' && q.visualContent && (
                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl print:bg-white print:border-slate-900">
                      <div className="prose prose-sm prose-slate max-w-none overflow-x-auto print:text-black">
                        <MarkdownRenderer content={q.visualContent} />
                      </div>
                    </div>
                  )}

                  {q.questionType === 'open' ? (
                    <div className="mt-6 space-y-4">
                      {/* Linhas para resposta do aluno */}
                      {!isTeacherMode && (
                        <div className="space-y-4 mt-8">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className="border-b border-slate-300 print:border-slate-400 w-full h-6"></div>
                          ))}
                        </div>
                      )}
                      
                      {/* Padrão de resposta para o professor */}
                      {isTeacherMode && (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl print:bg-white print:border-slate-900">
                          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Padrão de Resposta Esperado:</p>
                          <div className="prose prose-sm prose-slate max-w-none print:text-black">
                            <MarkdownRenderer content={q.correctAnswer} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {q.options?.map((opt, oIdx) => {
                        const isCorrect = opt === q.correctAnswer;
                        return (
                          <div key={oIdx} className="flex items-start gap-4 group">
                            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center text-[10px] font-black transition-colors ${isTeacherMode && isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 group-hover:border-slate-900 print:border-slate-900'}`}>
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <div className={`text-base leading-snug print:text-black prose prose-sm prose-slate max-w-none ${isTeacherMode && isCorrect ? 'text-emerald-700 font-bold' : 'text-slate-700'}`}>
                              <MarkdownRenderer content={opt} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {isTeacherMode && q.commentary && (
                    <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl">
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Comentário do Professor:</p>
                      <div className="prose prose-sm prose-slate max-w-none">
                        <MarkdownRenderer content={q.commentary} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isTeacherMode && questions.some(q => q.questionType !== 'open') && (
          <div className="break-before-page">
            <GabaritoENEM questions={questions.filter(q => q.questionType !== 'open')} correctionUrl={correctionUrl} />
          </div>
        )}

        {isTeacherMode && (
          <div className="break-before-page">
            <GabaritoComentado questions={questions} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 py-8 border-t border-slate-200 print:hidden">
        {onBack && (
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
        )}
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center gap-2"
        >
          <Printer size={20} />
          Imprimir
        </button>
        <button 
          onClick={() => handleExportPDF('student')}
          disabled={exporting}
          className={`px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          PDF Aluno
        </button>
        <button 
          onClick={() => handleExportWord('student')}
          disabled={exporting}
          className={`px-6 py-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
          Word Aluno
        </button>
        <button 
          onClick={() => handleExportPDF('teacher')}
          disabled={exporting}
          className={`px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-xl ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          PDF Professor
        </button>
        <button 
          onClick={() => handleExportWord('teacher')}
          disabled={exporting}
          className={`px-6 py-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl font-bold hover:bg-emerald-100 transition-all flex items-center gap-2 ${exporting ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {exporting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
          Word Professor
        </button>
      </div>
    </motion.div>
  );
};

export default ExamView;
