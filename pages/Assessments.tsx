import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Download, Eye, Calendar, BookOpen, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storageService, Assessment } from '../services/storageService';
import { Link } from 'react-router-dom';
import ExamView from '../components/ExamView';

const Assessments: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    setAssessments(storageService.getAssessments());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      storageService.deleteAssessment(id);
      setAssessments(storageService.getAssessments());
    }
  };

  if (selectedAssessment) {
    return (
      <div className="py-8">
        <ExamView 
          subject={selectedAssessment.subject}
          topic={selectedAssessment.topic}
          board={selectedAssessment.board}
          questions={selectedAssessment.questions}
          onBack={() => setSelectedAssessment(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Minhas Avaliações</h1>
          <p className="text-slate-500 font-medium">Histórico de provas geradas pela IA.</p>
        </div>
        <Link 
          to="/ai-studio" 
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
        >
          <BookOpen size={20} />
          Nova Avaliação
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {assessments.length > 0 ? (
            assessments.map((assessment, idx) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(assessment.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{assessment.subject}: {assessment.topic}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <span>{assessment.board}</span>
                  <span>•</span>
                  <span>{assessment.difficulty}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Layers size={16} className="text-slate-400" />
                    <span>{assessment.questions.length} Questões</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar size={16} className="text-slate-400" />
                    <span>{new Date(assessment.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedAssessment(assessment)}
                    className="flex-1 bg-slate-50 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye size={16} />
                    Visualizar
                  </button>
                  <button 
                    onClick={() => setSelectedAssessment(assessment)}
                    className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={16} />
                    PDF
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-4 border-dashed border-slate-100 rounded-[3rem]">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Nenhuma avaliação encontrada.</p>
              <p className="text-sm">As provas que você gerar aparecerão aqui.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Assessments;
