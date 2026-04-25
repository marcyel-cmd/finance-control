import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ExtractedTransaction {
  description: string;
  value: number;
  date: string;
  categoryId: string;
  confidence: number;
  originalText: string;
}

export interface AnalysisResult {
  transactions: ExtractedTransaction[];
  summary: {
    total: number;
    count: number;
    dateRange: {
      from: string;
      to: string;
    };
  };
}

// ── Geração de insights financeiros personalizados ────────────────────────────

export async function generateFinancialInsights(
  userName: string,
  data: {
    month: string;
    entradas: number;
    saidas: number;
    previsto: number;
    topCategories: string;   // "Alimentação R$320 (35%), Transporte R$180 (20%)"
    saidaChange: string;     // "+12%" ou "-5%" vs mês anterior
    topExpense: string;      // Maior categoria isolada: "Alimentação R$320"
  }
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const saldoLivre = data.entradas - data.saidas - data.previsto;
  const percentoGasto = data.entradas > 0 ? ((data.saidas / data.entradas) * 100).toFixed(0) : '0';

  const prompt = `Você é o assistente financeiro pessoal de ${userName}.

Dados reais de ${data.month}:
• Entradas: R$${data.entradas.toFixed(2)}
• Saídas realizadas: R$${data.saidas.toFixed(2)} (${percentoGasto}% da renda)
• Gastos ainda pendentes: R$${data.previsto.toFixed(2)}
• Saldo livre estimado: R$${saldoLivre.toFixed(2)}
• Variação nos gastos vs mês anterior: ${data.saidaChange}
• Top categorias: ${data.topCategories}
• Maior gasto: ${data.topExpense}

Gere exatamente 3 insights ESPECÍFICOS e ACIONÁVEIS sobre esses dados reais.
Regras:
- Use valores exatos dos dados acima (ex: "R$320 em Alimentação")
- Seja direto e objetivo, sem enrolação
- Máximo 110 caracteres por insight
- Use o nome ${userName} apenas no 1º insight
- Se gastos > 80% da renda ou saldo negativo: alerte com urgência
- Se variação > +20%: mencione o aumento específico
- Sugira uma ação concreta (ex: "Revise gastos com X")

Responda APENAS em JSON válido: {"insights":["texto1","texto2","texto3"]}`;

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
    });
    const text = response.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [];
  } catch {
    // Fallback sem IA se Gemini falhar
    const msgs: string[] = [];
    if (saldoLivre < 0) {
      msgs.push(`${userName}, atenção: saldo projetado negativo de R$${Math.abs(saldoLivre).toFixed(2)}!`);
    } else {
      msgs.push(`${userName}, saldo livre estimado de R$${saldoLivre.toFixed(2)} em ${data.month}.`);
    }
    if (data.topExpense) msgs.push(`Maior gasto: ${data.topExpense}. Avalie se pode reduzir.`);
    if (data.saidaChange !== 'sem dados') msgs.push(`Gastos variaram ${data.saidaChange} vs mês anterior.`);
    return msgs;
  }
}

// Analisa cupom fiscal de venda, comprovante PIX, recibo, foto de recibo de
// pagamento etc. Diferente de fatura/extrato (várias linhas → várias
// transações), aqui sempre devolve UMA transação só (o total da compra).
//
// Retorno: { description, value, date, categoryId, paymentMethodGuess?, confidence }
export interface ExtractedReceipt {
  description: string;        // estabelecimento ou destinatário (MAIÚSCULAS)
  value: number;              // valor total positivo
  date: string;               // YYYY-MM-DD (hoje se não detectado)
  categoryId: string;         // de uma das categorias passadas
  paymentMethodGuess?: string; // 'credito' | 'debito' | 'pix' | 'dinheiro' | undefined
  confidence: number;
  notes?: string;             // qualquer detalhe útil (ex: "12 itens, 2 categorias")
}

export async function analyzeReceiptWithGemini(
  imagePath: string,
  categories: { id: string; label: string }[],
): Promise<ExtractedReceipt> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const catList = categories.map(c => `${c.id}: ${c.label}`).join('\n');

  const systemPrompt = `Você é especialista em ler cupons fiscais brasileiros (NFC-e, SAT, recibos PIX, comprovantes de pagamento, faturas de água/luz/internet).

Sua tarefa: extrair UMA ÚNICA transação representando o total dessa compra/pagamento. Não liste itens individuais.

Identifique:
- Estabelecimento OU destinatário do pagamento (use nome curto em MAIÚSCULAS, ex: "MERCADO HARGER", "PIX JOÃO SILVA", "ENEL DISTRIBUIÇÃO")
- Valor TOTAL da compra (procure "TOTAL", "VALOR PAGO", "VALOR TOTAL R$"). Use número positivo (float, ponto decimal).
- Data da compra/pagamento (formato YYYY-MM-DD). Use a data IMPRESSA no cupom, NÃO a data atual.
- Categoria mais apropriada baseado no estabelecimento ou tipo de pagamento.
- Método de pagamento se conseguir identificar ("FORMA DE PAGAMENTO: Cartão Crédito" → "credito"; PIX → "pix"; etc).

Categorias disponíveis (use EXATAMENTE estes IDs no campo categoryId):
${catList}

Mapeamento típico:
- Mercado/supermercado/padaria/açougue → categoria de alimentação
- Posto de gasolina → transporte
- Farmácia/drogaria → saúde
- Restaurante/lanchonete → alimentação
- Conta de luz/água/internet/telefone → contas/serviços
- PIX para pessoa física → outros (ou inferir pelo contexto)

Responda APENAS com JSON válido. Sem markdown, sem explicações.

Formato exato:
{
  "description": "MERCADO HARGER",
  "value": 138.65,
  "date": "2026-04-23",
  "categoryId": "alimentacao",
  "paymentMethodGuess": "credito",
  "confidence": 0.95,
  "notes": "27 itens"
}`;

  const buf = fs.readFileSync(imagePath);
  const base64 = buf.toString('base64');
  const ext = imagePath.toLowerCase();
  const mime = ext.endsWith('.png')  ? 'image/png'
             : ext.endsWith('.webp') ? 'image/webp'
             : ext.endsWith('.heic') ? 'image/heic'
             : ext.endsWith('.pdf')  ? 'application/pdf'
             : 'image/jpeg';

  const content = [
    { inlineData: { mimeType: mime, data: base64 } },
    { text: 'Extraia o total dessa compra/pagamento como UMA transação única.' },
  ];

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: content }],
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.1 },
    });

    const text = response.response.text();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    // Sanity checks
    if (!parsed.description || typeof parsed.value !== 'number' || parsed.value <= 0) {
      throw new Error('Gemini retornou campos inválidos');
    }

    // Garantir categoria válida (fallback pra primeira disponível)
    const validCat = categories.find(c => c.id === parsed.categoryId);
    if (!validCat) parsed.categoryId = categories[0]?.id || 'outros';

    // Garantir data válida (fallback pra hoje)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      const t = new Date();
      parsed.date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    }

    return parsed as ExtractedReceipt;
  } catch (error: any) {
    throw new Error(`Erro ao processar cupom com Gemini: ${error.message}`);
  }
}

export async function analyzeInvoiceWithGemini(
  textOrImagePath: string,
  isImage: boolean,
  categories: { id: string; label: string }[]
): Promise<AnalysisResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const catList = categories.map(c => `${c.id}: ${c.label}`).join('\n');

  const systemPrompt = `Você é especialista em análise de extratos e faturas bancárias brasileiras.
Extraia TODAS as transações de compra/débito do arquivo.
Responda APENAS com JSON válido. Sem markdown, sem explicações.

Categorias disponíveis (use EXATAMENTE estes IDs no campo categoryId):
${catList}

Ignore: pagamentos de fatura (PGTO, PAG FAT), IOF, encargos, juros, anuidade.
Valores: número positivo (float). Datas: YYYY-MM-DD. Descrições: MAIÚSCULAS.

Resposta exata:
{
  "transactions": [
    {
      "description": "NETFLIX",
      "value": 55.90,
      "date": "2026-03-05",
      "categoryId": "lazer",
      "confidence": 0.95,
      "originalText": "05/03 NETFLIX 55,90"
    }
  ],
  "summary": {
    "total": 1234.56,
    "count": 14,
    "dateRange": { "from": "2026-03-01", "to": "2026-03-31" }
  }
}`;

  let content: any[];

  if (isImage) {
    const buf = fs.readFileSync(textOrImagePath);
    const base64 = buf.toString('base64');
    const mime = textOrImagePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    content = [
      { inlineData: { mimeType: mime, data: base64 } },
      { text: 'Extraia todas as transações desta fatura.' },
    ];
  } else {
    content = [{ text: `Extrato/Fatura:\n\n${textOrImagePath.slice(0, 60000)}` }];
  }

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: content }],
      systemInstruction: systemPrompt,
      generationConfig: { temperature: 0.1 },
    });

    const text = response.response.text();
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (error: any) {
    throw new Error('Erro ao processar fatura com Gemini. Tente novamente.');
  }
}