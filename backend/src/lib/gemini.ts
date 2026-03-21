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