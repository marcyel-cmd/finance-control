
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(<App />);

  // Service Worker — registra em produção e em dev (necessário pra Web Push).
  // Em dev o cache do SW só guarda shell mínimo (não os assets do Vite),
  // então HMR continua funcionando. Se quiser zerar manualmente:
  // DevTools → Application → Service Workers → Unregister.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  }
