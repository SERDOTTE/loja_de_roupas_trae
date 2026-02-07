/**
 * Formata uma data do formato ISO (yyyy-mm-dd) para o formato brasileiro (dd/mm/yyyy)
 * @param dateStr - Data no formato yyyy-mm-dd
 * @returns Data no formato dd/mm/yyyy
 */
export function formatDateToBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  
  // Se já estiver no formato dd/mm/yyyy, retorna como está
  if (dateStr.includes("/")) return dateStr;
  
  try {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Converte uma data do formato brasileiro (dd/mm/yyyy) para ISO (yyyy-mm-dd)
 * @param dateStr - Data no formato dd/mm/yyyy
 * @returns Data no formato yyyy-mm-dd
 */
export function formatDateToISO(dateStr: string): string {
  if (!dateStr) return "";
  
  // Se já estiver no formato yyyy-mm-dd, retorna como está
  if (dateStr.includes("-") && dateStr.indexOf("-") === 4) return dateStr;
  
  try {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata uma data usando toLocaleDateString
 * @param dateStr - Data no formato yyyy-mm-dd
 * @returns Data formatada no padrão brasileiro
 */
export function formatDateLocale(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  
  try {
    // Adiciona 'T00:00:00' para evitar problemas de timezone
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}
