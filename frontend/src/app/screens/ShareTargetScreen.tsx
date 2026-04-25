import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Loader2, AlertTriangle } from 'lucide-react';
import { ImportInvoiceModal } from '../components/finance/ImportInvoiceModal';
import { AddTransactionModal } from '../components/finance/AddTransactionModal';
import { useApp } from '../context/AppContext';

// Tela de destino do Web Share Target.
// Pode receber:
//   - Arquivo (foto, PDF, CSV) compartilhado de outro app -> abre ImportInvoiceModal
//   - Texto puro (ex: "almoço 35") -> pré-preenche AddTransactionModal
//   - Captura interna via /quick?capture=photo (sessionStorage)

type ShareKind = 'file' | 'text' | 'none';

export function ShareTargetScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast, cards } = useApp();

  const [kind, setKind] = useState<ShareKind>('none');
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const settledRef = useRef(false);
  const settle = () => { settledRef.current = true; setLoading(false); };

  useEffect(() => {
    const id = params.get('id');
    const source = params.get('source');
    const errFlag = params.get('error');

    if (errFlag) {
      setError('Não foi possível receber o arquivo compartilhado.');
      settle();
      return;
    }

    // Caso 1: captura interna via /quick (arquivo guardado no sessionStorage)
    if (source === 'quick') {
      const url = sessionStorage.getItem('fc_pending_capture_url');
      const name = sessionStorage.getItem('fc_pending_capture_name');
      const type = sessionStorage.getItem('fc_pending_capture_type');
      if (url && name && type) {
        sessionStorage.removeItem('fc_pending_capture_url');
        sessionStorage.removeItem('fc_pending_capture_name');
        sessionStorage.removeItem('fc_pending_capture_type');
        fetch(url)
          .then((r) => r.blob())
          .then((blob) => {
            setFile(new File([blob], name, { type }));
            setKind('file');
            settle();
          })
          .catch(() => {
            setError('Falha ao ler arquivo capturado.');
            settle();
          });
        return;
      }
      setError('Nenhum arquivo capturado.');
      settle();
      return;
    }

    // Caso 2: arquivo entregue pelo SW via Web Share Target
    if (id && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          if (settledRef.current) return;
          const data = event.data || {};
          if (!data.ok) {
            setError('Conteúdo compartilhado expirou ou já foi processado.');
            settle();
            return;
          }
          const payload = data.payload;
          const incomingFile = payload.files?.[0];
          if (incomingFile instanceof File) {
            setFile(incomingFile);
            setKind('file');
          } else if (payload.text) {
            setText(payload.text);
            setKind('text');
          } else {
            setError('Nada útil no conteúdo compartilhado.');
          }
          settle();
        };
        reg.active?.postMessage({ type: 'GET_SHARED_PAYLOAD', id }, [channel.port2]);

        // Timeout defensivo
        setTimeout(() => {
          if (settledRef.current) return;
          setError('Timeout ao ler conteúdo compartilhado.');
          settle();
        }, 5000);
      });
      return;
    }

    setError('Acesse pelo botão "Compartilhar" de outro app.');
    settle();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[#00D97E]" />
          <p className="text-[#7D8590]" style={{ fontSize: '13px' }}>
            Lendo conteúdo compartilhado…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertTriangle size={28} className="text-[#FFA502]" />
          <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#00D97E] text-[#0D1117]"
            style={{ fontSize: '13px', fontWeight: 700 }}
          >
            Voltar pra home
          </button>
        </div>
      </div>
    );
  }

  if (kind === 'file' && file) {
    if (cards.length === 0) {
      return (
        <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <AlertTriangle size={28} className="text-[#FFA502]" />
            <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Cadastre um cartão antes de importar arquivos.
            </p>
            <button
              onClick={() => navigate('/cartoes', { replace: true })}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#00D97E] text-[#0D1117]"
              style={{ fontSize: '13px', fontWeight: 700 }}
            >
              Ir pra cartões
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#0D1117]">
        <ImportInvoiceModal
          initialFile={file}
          onClose={() => navigate('/', { replace: true })}
        />
      </div>
    );
  }

  if (kind === 'text') {
    return (
      <div className="min-h-screen bg-[#0D1117]">
        <AddTransactionModal
          initialDescription={text}
          onClose={() => navigate('/', { replace: true })}
        />
      </div>
    );
  }

  return null;
}
