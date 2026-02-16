export const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

/**
 * Calculates a list of upcoming payout dates based on configured day of week.
 * @param startFrom Date to start calculating from (usually today)
 * @param payoutDayOfWeek 0 (Sun) - 6 (Sat)
 * @param count Number of future dates to generate
 * @returns Array of Date objects representing payout dates
 */
export function getNextPayoutDates(startFrom: Date, payoutDayOfWeek: number, count: number = 4): Date[] {
    const dates: Date[] = [];
    const current = new Date(startFrom);

    // Reset time to start of day for comparison stability
    current.setHours(0, 0, 0, 0);

    // Find the next occurrence of the payout day
    // If today is the payout day, logic depends on if we want to include today. 
    // Assuming "today" is valid if not past deadline (handled separately).
    // Let's find the first one >= today.
    let diff = payoutDayOfWeek - current.getDay();
    if (diff < 0) {
        diff += 7; // Next week
    }

    current.setDate(current.getDate() + diff);

    for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7); // Add a week
    }

    return dates;
}

/**
 * Calculates the deadline date for a given payout date.
 * @param payoutDate The scheduled payout date
 * @param daysBefore Number of days before payout
 * @returns Date object representing the deadline (end of day 23:59:59 usually implies deadline is END of that day)
 */
export function getDeadline(payoutDate: Date, daysBefore: number): Date {
    const deadline = new Date(payoutDate);
    deadline.setDate(deadline.getDate() - daysBefore);
    // Deadline is typically "until the end of that day" or "until a specific time".
    // Let's assume deadline is 23:59:59 of that calculated day.
    deadline.setHours(23, 59, 59, 999);
    return deadline;
}

/**
 * Checks if the deadline has passed for a payout date using current time.
 */
export function isDeadlinePassed(payoutDate: Date, daysBefore: number, now: Date = new Date()): boolean {
    const deadline = getDeadline(payoutDate, daysBefore);
    return now > deadline;
}

/**
 * Formats date as YYYY/MM/DD (Day)
 */
export function formatDate(date: Date): string {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${DAY_NAMES[date.getDay()]})`;
}

/**
 * Returns YYYY-MM-DD string using LOCAL time of the date object.
 * Avoids UTC conversion shifts unless intended.
 */
export function toLocalISOString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
