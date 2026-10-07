export const generateTimeSlots = (intervalMinutes = 30) => {
  const step = Math.max(5, intervalMinutes || 30);
  const slots: string[] = [];
  const startMinute = 6 * 60; // Inicia às 06:00
  const endMinute = 23 * 60;  // Termina às 23:00

  for (let current = startMinute; current <= endMinute; current += step) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00`;
    slots.push(timeString);
  }
  return slots;
};
