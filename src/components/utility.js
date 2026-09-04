const MS_PER_MINUTE = 60 * 1000;

// Enter / Space. The kiosk is driven by a numpad-style keyboard with no mouse,
// so both keys have to activate whatever currently holds focus.
const CONFIRM_KEY_CODES = [13, 32];

export const isConfirmKey = (event) => CONFIRM_KEY_CODES.includes(event.keyCode);

// Whole minutes between two "HH:MM" strings. Stays negative when end < start,
// which is how the caller detects an invalid range.
export const difference = (start, end) => {
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');

    const startDate = new Date(0, 0, 0, startHours, startMinutes, 0);
    const endDate = new Date(0, 0, 0, endHours, endMinutes, 0);

    return Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_MINUTE);
};
