(/src/app/screens/LoginScreen.tsx)

Crie a tela de login do app Preve (sigla PV), um aplicativo de controle financeiro pessoal. A tela deve ser mobile-first, dark mode nativo, com design fintech moderno e minimalista. As especificações são:

Visual e Background:

Fundo principal #0D1117 com AnimatedBackground contendo 3 orbs gradientes flutuantes (verde rgba(0,217,126,0.12), roxo rgba(168,85,247,0.1) e azul rgba(74,144,217,0.08)) com animação float-orb em tempos diferentes (12s, 15s, 10s) e delays escalonados. Grid sutil com linhas de 40px animando opacidade entre 0.03 e 0.07 (grid-pulse 8s).
Animação de entrada (mounted) com fade-in e translateY de 20px em 1s.
Logo & Branding:

Logo quadrado arredondado (80x80, rounded-3xl) com fundo gradiente verde semitransparente, borda verde 30% e sombra verde difusa. Texto "PV" dentro (28px, weight 800, cor #00D97E, letter-spacing -1).
Indicador de status online: bolinha verde pulsante (12x12 dentro de 20x20) posicionada no canto inferior direito do logo.
Título "Preve" (24px, weight 700, cor #E6EDF3), subtítulo "Controle financeiro inteligente" (13px, cor #7D8590).
Feature Pills:

3 pills com aparição escalonada (300ms, 500ms, 700ms): "Seguro" (Shield), "Análises IA" (TrendingUp), "Multi-cartão" (Wallet).
Fundo rgba(22,27,34,0.8), borda rgba(48,54,61,0.6), ícone verde #00D97E, texto #7D8590 (11px). Animação de fade-in + translateY.
Formulário de Login:

Campo de e-mail com ícone Mail à esquerda, placeholder "seu@email.com", label "E-mail" (12px, #7D8590). Fundo #161B22, borda #30363D, focus com borda verde 50% e shadow verde 8%.
Campo de senha com ícone Lock à esquerda, toggle Eye/EyeOff à direita. Label "Senha" com link "Esqueceu?" alinhado à direita (11px, #00D97E).
Toggle "Manter conectado": checkbox customizado 20x20 com check SVG preto, fundo verde quando ativo, borda #30363D quando inativo.
Botão "Entrar" full-width (py-4, rounded-2xl) com gradiente verde (#00D97E → #00B86B), sombra verde difusa, texto preto 15px weight 700. Ícone ArrowRight. Loading state com spinner circular (border-t-black) e texto "Entrando...". Active scale 0.98.
Mensagem de erro: banner vermelho com bolinha indicadora, fundo rgba(255,71,87,0.08), borda vermelha 20%.
Validação simples: qualquer e-mail/senha funciona (simulação). Salva fc_auth no localStorage e redireciona para /.
Login Biométrico:

Botão full-width com fundo roxo 8%, borda roxa 25%. Ícone Fingerprint (20px, roxo) dentro de container 40x40 com gradiente roxo/azul. Texto "Biometria / Face ID" (14px, weight 600) + subtítulo "Acesso rápido e seguro" (11px). ChevronRight à direita.
Overlay de Biometria (BiometricOverlay):
Backdrop escuro 92% com blur 12px, z-50.
3 anéis orbitais SVG dashed girando em velocidades diferentes (4s, 6s reverso, 8s), tamanhos 220/260/300px, opacidades decrescentes.
3 anéis pulsantes com bio-ring-pulse (2s, delays 0/0.4s/0.8s), tamanhos 180/220/260px.
Área central circular 144x144 com gradiente roxo/azul, borda roxa 25%, animação bio-glow (shadow pulsante roxo).
Animação de fingerprint progressiva: ícone Fingerprint (64px) em duas camadas — base roxa (opacity 0.35, drop-shadow roxo) e sobreposição branca revelada progressivamente de baixo para cima via clipPath: inset(${100 - progress*100}% 0 0 0) ao longo de ~2.8s. O glow branco aumenta conforme o progresso.
Sucesso: check verde animado com bio-success-pop (scale 0→1.15→1) e path do check desenhado com bio-check-draw (strokeDashoffset 30→0). Container muda para verde. Texto "Identidade confirmada!" + "Redirecionando...". Após 800ms, navega para /.
Texto de status: "Lendo biometria..." / "Posicione o dedo no sensor" durante scan.
Modal "Esqueceu a Senha?" (ForgotPasswordModal):

Bottom-sheet modal (z-50) com backdrop blur 8px, animação slide-up + fade-in. Handle bar no topo (mobile). Max-width 400px, fundo #161B22, borda #30363D.
Header com botão voltar (ArrowLeft) condicional, título/subtítulo dinâmicos por etapa, botão fechar (X).
Barra de progresso: 3 segmentos que preenchem com verde #00D97E conforme avança.
4 etapas:
E-mail: Ícone Mail em container verde gradiente. Campo de e-mail. Botão "Enviar código" verde com loading spinner. Simula envio em 1.5s.
Código: Ícone KeyRound em container roxo gradiente. 6 inputs numéricos (48x56px) com foco automático, suporte a paste, backspace para voltar. Estilo ativo com borda roxa e fundo roxo 8%. Timer de reenvio (60s) com contagem regressiva em roxo. Botão "Verificar código" com gradiente roxo (#A855F7 → #7C3AED). Simula verificação em 1.2s.
Nova Senha: Ícone Lock em container azul gradiente. Campo nova senha com toggle visibilidade. Indicador de força (4 barras): vermelho (fraca) → amarelo → azul → verde (forte), baseado em length>=6/8, maiúsculas, números, especiais. Campo confirmar senha com borda dinâmica (vermelha se diferente, verde se igual) + feedback "Senhas coincidem" com CheckCircle2. Botão "Redefinir senha" com gradiente azul (#4A90D9 → #3B7DD8).
Sucesso: Ícone CheckCircle2 (40px) em container verde com animação pop e glow. Texto "Tudo certo!" + "Use sua nova senha para fazer login". Botão "Voltar ao login" verde.
E-mail mascarado na etapa 2 (ex: se****@email.com).
Tratamento de erros inline com banner vermelho em cada etapa.
Botões de login social (Google/Apple) e divider "ou acesse com" — estes devem ser REMOVIDOS.

Footer:

Texto "Protegido com criptografia de ponta a ponta" (10px, #30363D). Ícone Shield + "v2.1.0 · 2026" (9px).
Proteção de rota: O login salva fc_auth: 'true' no localStorage. A rota verifica isso para proteger acesso.

Stack técnica: React com hooks (useState, useEffect, useRef, useCallback), react-router (useNavigate), lucide-react para ícones, CSS-in-JS inline + Tailwind, keyframes via <style> tags nos componentes.