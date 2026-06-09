// Helpers de fatura compartilhados entre transaction.service e notification.service.
// A regra de vencimento espelha getBillStatus/getBillDetail em transaction.service:
// quando dueDay <= closingDay, o vencimento cai no mês SEGUINTE ao fechamento.

function clampDay(year: number, monthIdx: number, day: number) {
  // último dia do mês = new Date(year, monthIdx + 1, 0)
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  return Math.min(day, lastDay);
}

// Determina o período (mês/ano) da fatura atualmente "em vencimento" a partir
// de uma data de referência, usando o closingDay. Se já passou do fechamento
// no mês de referência, a fatura corrente é a do mês seguinte.
function currentBillPeriod(closingDay: number, ref: Date) {
  let month = ref.getMonth(); // 0-based
  let year = ref.getFullYear();
  if (ref.getDate() > closingDay) {
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return { month, year };
}

// Retorna a próxima data de vencimento (>= ref, em horário 00:00) de um cartão,
// considerando closingDay/dueDay. Avança ciclos até encontrar um vencimento futuro.
export function computeCurrentDueDate(closingDay: number, dueDay: number, ref: Date = new Date()): Date {
  const today = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  let { month, year } = currentBillPeriod(closingDay, today);

  for (let i = 0; i < 13; i++) {
    let dueMonthIdx = month;
    let dueYear = year;
    if (dueDay <= closingDay) {
      dueMonthIdx += 1;
      if (dueMonthIdx > 11) { dueMonthIdx = 0; dueYear += 1; }
    }
    const dueDate = new Date(dueYear, dueMonthIdx, clampDay(dueYear, dueMonthIdx, dueDay));
    if (dueDate >= today) return dueDate;

    // avança um ciclo
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }

  // fallback (não deve acontecer)
  return new Date(year, month, clampDay(year, month, dueDay));
}

// Início do ciclo de fatura que contém a data de vencimento dada.
// Usado para deduplicar avisos por ciclo de fatura.
export function billCycleStart(dueDate: Date, closingDay: number): Date {
  // O ciclo fecha em closingDay; o início é ~1 mês antes do vencimento.
  const start = new Date(dueDate);
  start.setMonth(start.getMonth() - 1);
  return start;
}
