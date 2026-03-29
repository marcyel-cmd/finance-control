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