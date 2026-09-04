import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import '../../sass/Sony.scss';
import { difference } from '../utility';

const TIME_LENGTH = 5; // "HH:MM"
const BACKSPACE_KEY_CODE = 8;
const SUBMIT_FOCUS_DELAY_MS = 50;
const CONSOLE_NAME = 'Sony 5';
const SUBMIT_ID = 'submit-2';

// Form field name -> DOM id. The ids are load-bearing: focus is moved between
// fields by id, and the markup below is generated from this map.
const FIELDS = {
    startTime_2: 'input-5',
    endTime_2: 'input-6',
    startTime_4: 'input-7',
    endTime_4: 'input-8',
};

// Per-minute rates. 11.6666666667 is kept as the literal it has always been:
// 35/3 is a different float and would round differently through Math.ceil.
const SESSIONS = {
    2: {
        startKey: 'startTime_2',
        endKey: 'endTime_2',
        gamepadsKey: 'gamepads_2',
        gamepadsLabel: '2 Dzojstika',
        pricePerMinute: 9,
        snackbarLabel: 'dva dzojstika',
    },
    4: {
        startKey: 'startTime_4',
        endKey: 'endTime_4',
        gamepadsKey: 'gamepads_4',
        gamepadsLabel: '4 Dzojstika',
        pricePerMinute: 11.6666666667,
        snackbarLabel: 'cetiri dzojstika',
    },
};

const fieldEl = (id) => document.getElementById(id);
const valueOf = (id) => fieldEl(id).value;
const isFilled = (id) => valueOf(id).length === TIME_LENGTH;
const asMinutes = (id) => Number(valueOf(id).replace(':', ''));

const isNumber = (char) => typeof char === 'string' && char.trim() !== '' && !isNaN(char);

const Sony5 = ({ active, setFinalPrice, setCustomerDetails, goToDrinks }) => {
    const { register, handleSubmit, setFocus } = useForm();
    const [isValid, setIsValid] = useState(false);
    const [canSubmit, setCanSubmit] = useState({ 2: true, 4: true });

    const { enqueueSnackbar } = useSnackbar();

    // Sony5 mounts behind the banner, so the cue is the banner opening rather
    // than mount: drop straight into the first "Dva Džojstika" field.
    useEffect(() => {
        if (active) setFocus('startTime_2');
    }, [active, setFocus]);

    const calculatePrice = (startTime, endTime, pricePerMinute) => {
        setFinalPrice((prevPrice) => prevPrice + Math.ceil(difference(startTime, endTime) * pricePerMinute));
        document.querySelectorAll('.form_input').forEach((input) => { input.value = ''; });
    };

    const submitSession = (variant, data) => {
        if (!canSubmit[variant]) return;

        const { startKey, endKey, gamepadsKey, gamepadsLabel, pricePerMinute, snackbarLabel } = SESSIONS[variant];
        const startTime = data[startKey];
        const endTime = data[endKey];

        calculatePrice(startTime, endTime, pricePerMinute);

        setCustomerDetails((prevState) => ({
            ...prevState,
            [startKey]: startTime,
            [endKey]: endTime,
            [gamepadsKey]: gamepadsLabel,
            nameOfConsole: CONSOLE_NAME,
        }));

        setCanSubmit((prevState) => ({ ...prevState, [variant]: false }));
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

    const isAscending = (startId, endId) => isFilled(startId) && isFilled(endId)
        && asMinutes(startId) < asMinutes(endId);

    const keyPressEvent = (e) => {
        if (e.target.value.length >= TIME_LENGTH && e.keyCode !== BACKSPACE_KEY_CODE) {
            e.preventDefault();
        }

        if (e.keyCode === BACKSPACE_KEY_CODE && e.target.value.length === 3) {
            e.target.value = e.target.value.substring(0, 2);
        }
    };

    const addDotToInput = (e) => {
        const { id } = e.target;

        // A complete start time hands focus to its own end time.
        if (id === FIELDS.startTime_2 && e.target.value.length === TIME_LENGTH) {
            fieldEl(FIELDS.endTime_2).focus();
        }
        if (id === FIELDS.startTime_4 && e.target.value.length === TIME_LENGTH) {
            fieldEl(FIELDS.endTime_4).focus();
        }

        // Enable "Izračunaj" for either pair on its own, or for both pairs when
        // the 2-gamepad slot ends no later than the 4-gamepad slot begins.
        const bothPairsFilled = Object.values(FIELDS).every(isFilled);

        if (
            isAscending(FIELDS.startTime_2, FIELDS.endTime_2)
            || isAscending(FIELDS.startTime_4, FIELDS.endTime_4)
            || (bothPairsFilled && asMinutes(FIELDS.endTime_2) <= asMinutes(FIELDS.startTime_4))
        ) {
            setIsValid(true);
        }

        if ((id === FIELDS.endTime_2 || id === FIELDS.endTime_4) && e.target.value.length === TIME_LENGTH) {
            setTimeout(() => fieldEl(SUBMIT_ID).focus(), SUBMIT_FOCUS_DELAY_MS);
        }

        if (e.target.value.length === 2 && isNumber(e.target.value.substring(0, 2))) {
            e.target.value = `${e.target.value}:`;
        }

        // Reject a minutes tens-digit above 5. Kept verbatim: an <input> has no
        // .length, so the second argument is NaN and this is substring(0, 3) --
        // i.e. it trims the value back to "HH:".
        if (Number(e.target.value[3]) > 5) {
            e.target.value = e.target.value.substring(3, e.target.length - 1);
        }
    };

    const timeInput = (name) => {
        const field = register(name);

        return (
            <input
                id={FIELDS[name]}
                {...field}
                onKeyDown={keyPressEvent}
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
            <form className="sony__inner-content" onSubmit={handleSubmit(onSubmit)}>
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
                <button id={SUBMIT_ID} type="submit" disabled={!isValid} tabIndex="2">Izračunaj</button>
            </form>
        </div>
    );
};

export default Sony5;
