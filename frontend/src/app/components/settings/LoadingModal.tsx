import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Download, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'export' | 'report';
  format?: string;
  title?: string;
}

export function LoadingModal({ isOpen, onClose, type, format, title }: LoadingModalProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const exportSteps = [
    { id: 0, text: 'Preparando dados...', duration: 800 },
    { id: 1, text: 'Coletando transações...', duration: 1000 },
    { id: 2, text: 'Organizando categorias...', duration: 700 },
    { id: 3, text: `Gerando arquivo ${format}...`, duration: 1200 },
    { id: 4, text: 'Finalizando...', duration: 500 },
  ];

  const reportSteps = [
    { id: 0, text: 'Iniciando análise...', duration: 700 },
    { id: 1, text: 'Calculando estatísticas...', duration: 1000 },
    { id: 2, text: 'Gerando gráficos...', duration: 1200 },
    { id: 3, text: 'Criando visualizações...', duration: 900 },
    { id: 4, text: 'Compilando relatório...', duration: 800 },
  ];

  const steps = type === 'export' ? exportSteps : reportSteps;

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Step animation
    let currentStep = 0;
    const stepTimeout = setTimeout(function nextStep() {
      if (currentStep < steps.length) {
        setStep(currentStep);
        currentStep++;
        setTimeout(nextStep, steps[currentStep - 1]?.duration || 800);
      } else {
        setIsComplete(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
    };
  }, [isOpen, onClose, steps]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center px-4 z-[100]"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#161B22] border border-[#30363D] rounded-3xl w-full overflow-hidden"
          style={{ 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            maxWidth: '520px',
          }}
        >
          {!isComplete ? (
            <>
              {/* Header */}
              <div
                className="px-8 py-6 border-b border-[#30363D]"
                style={{
                  background: type === 'export'
                    ? 'linear-gradient(135deg, rgba(0,217,126,0.15), rgba(74,144,217,0.1))'
                    : 'linear-gradient(135deg, rgba(74,144,217,0.15), rgba(168,85,247,0.1))',
                }}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: type === 'export' ? 'rgba(0,217,126,0.2)' : 'rgba(74,144,217,0.2)',
                      border: type === 'export' ? '1px solid rgba(0,217,126,0.3)' : '1px solid rgba(74,144,217,0.3)',
                    }}
                  >
                    {type === 'export' ? (
                      <Download size={28} color="#00D97E" />
                    ) : (
                      <FileText size={28} color="#4A90D9" />
                    )}
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {type === 'export' ? `Exportando ${format}` : title || 'Gerando Relatório'}
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '13px', marginTop: '2px' }}>
                      Aguarde enquanto processamos...
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[#7D8590]" style={{ fontSize: '12px', fontWeight: 600 }}>
                      Progresso
                    </span>
                    <span className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 700 }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#21262D] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: type === 'export'
                          ? 'linear-gradient(90deg, #00D97E, #4A90D9)'
                          : 'linear-gradient(90deg, #4A90D9, #A855F7)',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {steps.map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: i <= step ? 1 : 0.3,
                        x: i <= step ? 0 : -20,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-4"
                    >
                      {i < step ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: type === 'export' ? '#00D97E' : '#4A90D9',
                          }}
                        >
                          <CheckCircle2 size={16} color="#FFF" />
                        </motion.div>
                      ) : i === step ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            background: type === 'export' ? 'rgba(0,217,126,0.2)' : 'rgba(74,144,217,0.2)',
                            border: type === 'export' ? '2px solid #00D97E' : '2px solid #4A90D9',
                          }}
                        >
                          <Loader2 size={14} color={type === 'export' ? '#00D97E' : '#4A90D9'} />
                        </motion.div>
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex-shrink-0"
                          style={{
                            background: '#21262D',
                            border: '2px solid #30363D',
                          }}
                        />
                      )}
                      <span
                        className="text-[#E6EDF3]"
                        style={{
                          fontSize: '14px',
                          fontWeight: i === step ? 600 : 400,
                          opacity: i <= step ? 1 : 0.5,
                        }}
                      >
                        {s.text}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Loading Dots */}
                <div className="flex items-center justify-center gap-2.5 pt-3">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: type === 'export' ? '#00D97E' : '#4A90D9',
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 1, 0.3],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Success State */
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: type === 'export'
                    ? 'linear-gradient(135deg, #00D97E, #4A90D9)'
                    : 'linear-gradient(135deg, #4A90D9, #A855F7)',
                }}
              >
                <CheckCircle2 size={48} color="#FFF" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[#E6EDF3] mb-3"
                style={{ fontSize: '20px', fontWeight: 700 }}
              >
                {type === 'export' ? 'Exportação Concluída!' : 'Relatório Gerado!'}
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[#7D8590]"
                style={{ fontSize: '14px' }}
              >
                {type === 'export'
                  ? `Seu arquivo ${format} está pronto para download`
                  : 'Seu relatório foi gerado com sucesso'}
              </motion.p>

              {/* Success confetti effect */}
              <div className="mt-8 flex justify-center gap-3">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      background: ['#00D97E', '#4A90D9', '#A855F7', '#FFA502', '#FF4757'][i],
                    }}
                    animate={{
                      y: [0, -40, 0],
                      opacity: [1, 0],
                      scale: [1, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: 0,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}