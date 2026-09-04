import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import '../../sass/Sony.scss';
import { difference, toMinutes } from '../utility';

const TIME_LENGTH = 5; // "HH:MM"
const BACKSPACE_KEY_CODE = 8;
const TAB_KEY_CODE = 9;

// A full field rejects further typing, but must not swallow the keys used to
// get out of it again: tab, shift, escape, home/end, the arrows and delete.
const NAVIGATION_KEY_CODES = [8, 9, 13, 16, 27, 35, 36, 37, 38, 39, 40, 46];

// The only characters a time field may ever contain.
const ALLOWED_CHARACTER = /^[0-9:]$/;
const DISALLOWED_CHARACTERS = /[^0-9:]/g;
const SUBMIT_FOCUS_DELAY_MS = 50;
const CONSOLE_NAME = 'Sony 5';
const SUBMIT_ID = 'submit-2';
const OVERLAP_MESSAGE = 'Termini se preklapaju - unesi vreme pre ili posle druge sesije';

// Form field name -> DOM id. The ids are load-bearing: focus is moved between
// fields by id, and the markup below is generated from this map.
const FIELDS = {
    startTime_2: 'input-5',
    endTime_2: 'input-6',
    startTime_4: 'input-7',
    endTime_4: 'input-8',
};

// Rates are per hour, and the per-minute figure is derived. Storing a rounded
// per-minute decimal is what made every clean duration overcharge by 1 dinar:
// 11.6666666667 is fractionally above 700/60, so a 60 minute session came to
// 700.000000002 and Math.ceil pushed it to 701.
const MINUTES_PER_HOUR = 60;

const SESSIONS = {
    2: {
        startKey: 'startTime_2',
        endKey: 'endTime_2',
        gamepadsKey: 'gamepads_2',
        gamepadsLabel: '2 Dzojstika',
        pricePerHour: 540,
        snackbarLabel: 'dva dzojstika',
    },
    4: {
        startKey: 'startTime_4',
        endKey: 'endTime_4',
        gamepadsKey: 'gamepads_4',
        gamepadsLabel: '4 Dzojstika',
        pricePerHour: 700,
        snackbarLabel: 'cetiri dzojstika',
    },
};

const fieldEl = (id) => document.getElementById(id);
const valueOf = (id) => fieldEl(id).value;
const isFilled = (id) => valueOf(id).length === TIME_LENGTH;
// Normalised so a small-hours end time sorts after a late-evening start, which
// is what makes the overlap and ordering checks below hold across midnight.
const asMinutes = (id) => toMinutes(valueOf(id));

// 'empty' | 'partial' | 'invalid' | 'valid' for one start/end pair.
const pairState = (startId, endId) => {
    const startFilled = isFilled(startId);
    const endFilled = isFilled(endId);

    if (!startFilled && !endFilled) return 'empty';
    if (!startFilled || !endFilled) return 'partial';

    return asMinutes(startId) < asMinutes(endId) ? 'valid' : 'invalid';
};

// Half-open intervals, so touching endpoints are fine: a 4-gamepad slot may end
// exactly when the 2-gamepad slot begins, but the two may never share a minute.
const overlaps = (aStart, aEnd, bStart, bEnd) => asMinutes(aStart) < asMinutes(bEnd)
    && asMinutes(bStart) < asMinutes(aEnd);

const isNumber = (char) => typeof char === 'string' && char.trim() !== '' && !isNaN(char);

const Sony5 = ({ active, setFinalPrice, setCustomerDetails, goToDrinks }) => {
    const { register, handleSubmit } = useForm();
    const [isValid, setIsValid] = useState(false);
    const overlapWarned = useRef(false);
    const submitFocusTimer = useRef(null);

    const { enqueueSnackbar } = useSnackbar();

    // Sony5 mounts behind the banner, so the cue is the banner opening rather
    // than mount: drop straight into the first "Dva Džojstika" field. Focused by
    // id, the way every other focus move in this file works: react-hook-form's
    // setFocus silently does nothing here.
    useEffect(() => {
        if (active) fieldEl(FIELDS.startTime_2)?.focus();
    }, [active]);

    useEffect(() => () => clearTimeout(submitFocusTimer.current), []);

    // Multiply before dividing so a whole number of hours stays exact.
    const calculatePrice = (startTime, endTime, pricePerHour) => {
        const minutes = difference(startTime, endTime);

        setFinalPrice((prevPrice) => prevPrice + Math.ceil((minutes * pricePerHour) / MINUTES_PER_HOUR));
        document.querySelectorAll('.form_input').forEach((input) => { input.value = ''; });
    };

    const submitSession = (variant, data) => {
        const { startKey, endKey, gamepadsKey, gamepadsLabel, pricePerHour, snackbarLabel } = SESSIONS[variant];
        const startTime = data[startKey];
        const endTime = data[endKey];

        calculatePrice(startTime, endTime, pricePerHour);

        setCustomerDetails((prevState) => ({
            ...prevState,
            [startKey]: startTime,
            [endKey]: endTime,
            [gamepadsKey]: gamepadsLabel,
            nameOfConsole: CONSOLE_NAME,
        }));

        enqueueSnackbar(
            `Uneto vreme za ${snackbarLabel} (SONY 5) od ${startTime} do ${endTime}`,
            { persist: true },
        );
    };

    const onSubmit = (data) => {
        setIsValid(false);

        // Read every field before submitting: calculatePrice blanks the inputs,
        // so a later read would see an already-cleared form.
        const filled = {
            start2: isFilled(FIELDS.startTime_2),
            end2: isFilled(FIELDS.endTime_2),
            start4: isFilled(FIELDS.startTime_4),
            end4: isFilled(FIELDS.endTime_4),
        };

        if (filled.start2 && filled.end2 && !filled.start4) submitSession(2, data);
        if (filled.start4 && filled.end4 && !filled.end2) submitSession(4, data);

        if (filled.start2 && filled.end2 && filled.start4 && filled.end4) {
            submitSession(2, data);
            submitSession(4, data);
        }

        goToDrinks();
    };

    const hasOverlap = () => pairState(FIELDS.startTime_2, FIELDS.endTime_2) === 'valid'
        && pairState(FIELDS.startTime_4, FIELDS.endTime_4) === 'valid'
        && overlaps(FIELDS.startTime_2, FIELDS.endTime_2, FIELDS.startTime_4, FIELDS.endTime_4);

    // Recomputed on every keystroke rather than latched on: a pair that becomes
    // invalid again has to disable the button, or an edited time could be
    // submitted after it stopped making sense.
    const isFormValid = () => {
        const two = pairState(FIELDS.startTime_2, FIELDS.endTime_2);
        const four = pairState(FIELDS.startTime_4, FIELDS.endTime_4);

        // A half-entered pair is not ready, and neither is an empty form.
        if (two === 'partial' || four === 'partial') return false;
        if (two === 'invalid' || four === 'invalid') return false;
        if (two === 'empty' && four === 'empty') return false;

        return !hasOverlap();
    };

    // Say why the button went dead, once per overlap rather than per keystroke.
    const warnOnOverlap = () => {
        const overlapping = hasOverlap();

        if (overlapping && !overlapWarned.current) {
            enqueueSnackbar(OVERLAP_MESSAGE, { variant: 'warning' });
        }

        overlapWarned.current = overlapping;
    };

    // Digits and ':' only. Keys that produce no character report a multi-letter
    // name ('Tab', 'ArrowLeft', 'F5'), and modifier combinations are left alone,
    // so navigation and shortcuts keep working.
    const isCharacterKey = (e) => e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

    const keyPressEvent = (e) => {
        if (isCharacterKey(e) && !ALLOWED_CHARACTER.test(e.key)) {
            e.preventDefault();
            return;
        }

        if (e.target.value.length >= TIME_LENGTH && !NAVIGATION_KEY_CODES.includes(e.keyCode)) {
            e.preventDefault();
        }

        if (e.keyCode === BACKSPACE_KEY_CODE && e.target.value.length === 3) {
            e.target.value = e.target.value.substring(0, 2);
        }
    };

    const addDotToInput = (e) => {
        const { id } = e.target;

        // Catches whatever never passed through keydown - a paste, a drop, an
        // autofill - so the value below is always digits and colons.
        const cleaned = e.target.value.replace(DISALLOWED_CHARACTERS, '');
        if (cleaned !== e.target.value) e.target.value = cleaned;

        // A complete start time hands focus to its own end time.
        if (id === FIELDS.startTime_2 && e.target.value.length === TIME_LENGTH) {
            fieldEl(FIELDS.endTime_2).focus();
        }
        if (id === FIELDS.startTime_4 && e.target.value.length === TIME_LENGTH) {
            fieldEl(FIELDS.endTime_4).focus();
        }

        if ((id === FIELDS.endTime_2 || id === FIELDS.endTime_4) && e.target.value.length === TIME_LENGTH) {
            // Submitting unmounts this screen, so the pending hop has to be
            // cancellable - and defensive even so, in case it lands mid-teardown.
            clearTimeout(submitFocusTimer.current);
            submitFocusTimer.current = setTimeout(
                () => fieldEl(SUBMIT_ID)?.focus(),
                SUBMIT_FOCUS_DELAY_MS,
            );
        }

        if (e.target.value.length === 2 && isNumber(e.target.value.substring(0, 2))) {
            e.target.value = `${e.target.value}:`;
        }

        // Reject a minutes tens-digit above 5 by trimming back to "HH:". This used
        // to read substring(3, e.target.length - 1); an <input> has no .length, so
        // the second argument was NaN and substring swapped the bounds into
        // exactly the call below. Same result, minus the accident.
        if (Number(e.target.value[3]) > 5) {
            e.target.value = e.target.value.substring(0, 3);
        }

        // Last, so they see the value after every rewrite above.
        setIsValid(isFormValid());
        warnOnOverlap();
    };

    // The form is the whole screen, so Tab past the last control should come
    // back to the first field rather than escape into the browser chrome.
    const trapTab = (e) => {
        if (e.keyCode !== TAB_KEY_CODE) return;

        const stops = [...Object.values(FIELDS).map(fieldEl), fieldEl(SUBMIT_ID)]
            .filter((el) => el && !el.disabled);
        if (!stops.length) return;

        const first = stops[0];
        const last = stops[stops.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
    };

    const timeInput = (name) => {
        const field = register(name);

        return (
            <input
                id={FIELDS[name]}
                {...field}
                onKeyDown={keyPressEvent}
                // The form is mounted behind the banner from the start; keep it
                // out of the tab order until the service is actually unlocked.
                tabIndex={active ? 0 : -1}
                // Both handlers have to run. Spreading register() and then
                // setting onChange would drop the one react-hook-form supplies,
                // leaving every submitted value at '' -- and the price at NaN.
                // addDotToInput goes first because it rewrites e.target.value;
                // the form must record the reformatted "HH:MM", not the raw keys.
                onChange={(e) => {
                    addDotToInput(e);
                    field.onChange(e);
                }}
                type="text"
                className="form_input"
                autoComplete="off"
            />
        );
    };

    return (
        <div className="sony__container">
            <div className="sony__header-title">
                <h1>{CONSOLE_NAME}</h1>
            </div>
            <form className="sony__inner-content" onSubmit={handleSubmit(onSubmit)} onKeyDown={trapTab}>
                <div className="gamepads__form two__gamepads">
                    <h1>Dva Džojstika</h1>
                    <div>
                        {timeInput('startTime_2')}
                        {timeInput('endTime_2')}
                    </div>
                </div>
                <div className="gamepads__form four__gamepads">
                    <h1>Četiri Džojstika</h1>
                    <div>
                        {timeInput('startTime_4')}
                        {timeInput('endTime_4')}
                    </div>
                </div>
                <button
                    id={SUBMIT_ID}
                    className="sony__submit"
                    type="submit"
                    disabled={!isValid}
                    tabIndex={active ? 0 : -1}
                >
                    Izračunaj
                </button>
            </form>
        </div>
    );
};

export default Sony5;
