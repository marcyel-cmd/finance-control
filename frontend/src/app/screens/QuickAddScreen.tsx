import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { AddTransactionModal } from '../components/finance/AddTransactionModal';

type TabType = 'entrada' | 'saida' | 'previsto';

const VALID_TYPES: TabType[] = ['entrada', 'saida', 'previsto'];

export function QuickAddScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const initialType = useMemo<TabType | undefined>(() => {
    const t = params.get('type');
    return t && (VALID_TYPES as string[]).includes(t) ? (t as TabType) : undefined;
  }, [params]);

  const initialDescription = params.get('description') ?? undefined;
  const initialValue = params.get('amount') ?? undefined;
  const capture = params.get('capture');

  const [showModal, setShowModal] = useState(true);

  // Se vier capture=photo, dispara o input de câmera nativo direto
  useEffect(() => {
    if (capture !== 'photo') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        navigate('/', { replace: true });
        return;
      }
      // Encaminha pro share-target com o arquivo já selecionado
      const url = URL.createObjectURL(file);
      sessionStorage.setItem('fc_pending_capture_url', url);
      sessionStorage.setItem('fc_pending_capture_name', file.name);
      sessionStorage.setItem('fc_pending_capture_type', file.type);
      navigate('/share-target?source=quick', { replace: true });
    };
    input.click();
    // Se o usuário cancelar o picker, mandamos pra home depois de 30s
    const timeout = setTimeout(() => navigate('/', { replace: true }), 30_000);
    return () => clearTimeout(timeout);
  }, [capture, navigate]);

  const handleClose = () => {
    setShowModal(false);
    navigate('/', { replace: true });
  };

  if (capture === 'photo') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-[#E6EDF3] mb-2" style={{ fontSize: '15px', fontWeight: 600 }}>
            Abrindo a câmera…
          </p>
          <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
            Se nada acontecer, toque novamente no atalho.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1117]">
      {showModal && (
        <AddTransactionModal
          onClose={handleClose}
          initialType={initialType}
          initialDescription={initialDescription}
          initialValue={initialValue}
        />
      )}
    </div>
  );
}
