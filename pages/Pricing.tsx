import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const plans = [
  {
    name: 'Mensal',
    description: 'Para experimentar a liberdade.',
    price: '39,90',
    period: '/mês',
    icon: <Zap className="text-indigo-500" size={24} />,
    features: [
      'Até 15 avaliações geradas por mês',
      'Até 150 correções automáticas com IA',
      'Alinhamento total à BNCC',
    ],
    buttonText: 'Assinar Mensal',
    link: 'https://pay.kiwify.com.br/fdFvEXg',
    popular: false,
    color: 'indigo'
  },
  {
    name: 'Trimestral',
    description: 'O equilíbrio perfeito.',
    price: '29,90',
    period: '/mês',
    total: 'R$ 89,70 cobrados a cada 3 meses',
    icon: <Shield className="text-emerald-500" size={24} />,
    features: [
      'Até 25 avaliações geradas por mês',
      'Até 300 correções automáticas com IA',
      'Banco de questões premium',
      'Exportação em PDF e Word',
    ],
    buttonText: 'Assinar Trimestral',
    link: 'https://pay.kiwify.com.br/Lvgz53F',
    popular: true,
    color: 'emerald'
  },
  {
    name: 'Semestral',
    description: 'Foco no semestre letivo.',
    price: '24,90',
    period: '/mês',
    total: 'R$ 149,40 cobrados a cada 6 meses',
    icon: <Sparkles className="text-amber-500" size={24} />,
    features: [
      'Até 40 avaliações geradas por mês',
      'Até 500 correções automáticas com IA',
      'Análise de desempenho da turma',
      'Suporte prioritário',
    ],
    buttonText: 'Assinar Semestral',
    link: 'https://pay.kiwify.com.br/eQCOOE0',
    popular: false,
    color: 'amber'
  },
  {
    name: 'Anual',
    description: 'Paz de espírito o ano todo.',
    price: '19,90',
    period: '/mês',
    total: 'R$ 238,80 cobrados anualmente',
    icon: <Crown className="text-violet-500" size={24} />,
    features: [
      'Até 60 avaliações geradas por mês',
      'Até 800 correções automáticas com IA',
      'Acesso antecipado a novos recursos',
      'Treinamento exclusivo ao vivo',
    ],
    buttonText: 'Assinar Anual',
    link: 'https://pay.kiwify.com.br/iXyou3r',
    popular: false,
    color: 'violet'
  }
];

export const Pricing: React.FC = () => {
  const { profile } = useAuth();
  const isLifetime = profile?.subscriptionStatus === 'lifetime' || profile?.isLifetime;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-extrabold text-slate-900 sm:text-4xl"
          >
            {isLifetime ? 'Você possui Acesso Vitalício!' : 'Seus créditos gratuitos acabaram!'}
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-xl text-slate-600"
          >
            {isLifetime 
              ? 'Aproveite todos os recursos ilimitados para sempre. Sua conta está configurada com créditos infinitos.'
              : 'Escolha o plano ideal para continuar transformando sua rotina como professor e economizar horas de trabalho toda semana.'}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className={`relative bg-white rounded-3xl shadow-xl shadow-slate-200/50 border flex flex-col ${
                plan.popular ? 'border-emerald-500 ring-2 ring-emerald-500 ring-offset-2' : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <div className={`p-2 rounded-xl bg-${plan.color}-50`}>
                    {plan.icon}
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-6 h-10">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">R$ {plan.price}</span>
                  <span className="text-slate-500 font-medium">{plan.period}</span>
                  {plan.total && (
                    <p className="text-xs text-slate-400 mt-1">{plan.total}</p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className={`h-5 w-5 text-${plan.color}-500 shrink-0 mr-3`} />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <a
                  href={`${plan.link}${profile?.email ? `?email=${encodeURIComponent(profile.email)}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    plan.popular 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200' 
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {plan.buttonText}
                </a>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Pagamento seguro via Kiwify
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
