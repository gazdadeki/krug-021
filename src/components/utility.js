const MINUTES_PER_HOUR = 60;

// Enter / Space. The kiosk is driven by a numpad-style keyboard with no mouse,
// so both keys have to activate whatever currently holds focus.
const CONFIRM_KEY_CODES = [13, 32];

export const isConfirmKey = (event) => CONFIRM_KEY_CODES.includes(event.keyCode);

// The shop's day runs past midnight, so anything before this hour belongs to the
// following calendar day. It is what lets 22:40 -> 00:10 read as an hour and a
// half rather than a negative span.
const NEXT_DAY_BEFORE_HOUR = 4;

// "HH:MM" -> minutes on a timeline that continues past 24:00, so the two ways of
// writing a small-hours time agree: 00:10 and 24:10 both come out as 1450.
export const toMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);

    return ((hours < NEXT_DAY_BEFORE_HOUR ? hours + 24 : hours) * MINUTES_PER_HOUR) + minutes;
};

// Whole minutes between two "HH:MM" strings. Stays negative when end is genuinely
// before start, which is how the caller detects an invalid range.
export const difference = (start, end) => toMinutes(end) - toMinutes(start);
