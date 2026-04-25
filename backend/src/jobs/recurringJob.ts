import cron from 'node-cron';
import { recurringService } from '../services/recurring.service';

let scheduled = false;

// Roda diariamente às 06:00 (horário do servidor) processando templates ativos
// pra todos os usuários. A função é idempotente (checa lastGeneratedAt + existência
// de transação por templateId+date), então rodar várias vezes no mesmo dia é seguro.
//
// Também faz uma execução inicial 5 segundos após o boot pra cobrir casos em que
// o servidor ficou off por algumas horas/dias e perdeu disparos do cron.
export function startRecurringJob() {
  if (scheduled) return;
  scheduled = true;

  const runOnce = async (label: string) => {
    try {
      const result = await recurringService.generateDueTransactions(new Date());
      if (result.transactionsCreated > 0 || result.templates > 0) {
        console.log(`[recurring] ${label}: ${result.transactionsCreated} transações criadas a partir de ${result.templates} templates ativos`);
      }
    } catch (err) {
      console.error(`[recurring] ${label}: erro`, err);
    }
  };

  // Backfill no boot — cobre downtime do servidor
  setTimeout(() => { void runOnce('boot'); }, 5_000);

  // Cron diário 06:00
  cron.schedule('0 6 * * *', () => { void runOnce('cron'); });

  console.log('[recurring] job agendado para 06:00 diariamente');
}
