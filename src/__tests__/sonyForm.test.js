import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import MainContainer from '../components/main-container/MainContainer';
import { tabOrder } from '../testUtils';

const openSony = () => {
    render(<SnackbarProvider><MainContainer /></SnackbarProvider>);
    fireEvent.keyDown(window, { keyCode: 13 });          // unlock, as Enter on the padlock
    return (id, value) => fireEvent.change(document.getElementById(id), { target: { value } });
};

const submitEnabled = () => !document.getElementById('submit-2').disabled;

describe('keyboard', () => {
    test('only the padlock is reachable before unlocking', () => {
        render(<SnackbarProvider><MainContainer /></SnackbarProvider>);
        expect(tabOrder()).toEqual(['unlock_icon_container']);
    });

    test('unlocking focuses the first field and opens the form', () => {
        openSony();
        expect(document.activeElement.id).toBe('input-5');
        expect(tabOrder()).toEqual(['input-5', 'input-6', 'input-7', 'input-8']);
    });

    test('the receipt icon never joins another screen\'s tab order', () => {
        openSony();
        expect(tabOrder()).not.toContain('modal_instance');
    });

    test('a full field still lets Tab out, but not another digit', () => {
        const set = openSony();
        set('input-5', '10:00');
        const input = document.getElementById('input-5');
        expect(fireEvent.keyDown(input, { key: 'Tab', keyCode: 9 })).toBe(true);
        expect(fireEvent.keyDown(input, { key: '5', keyCode: 53 })).toBe(false);
    });

    test('Tab wraps inside the form rather than escaping the page', () => {
        const set = openSony();
        set('input-5', '10:00'); set('input-6', '11:00');
        const submit = document.getElementById('submit-2');
        submit.focus();
        fireEvent.keyDown(submit, { keyCode: 9 });
        expect(document.activeElement.id).toBe('input-5');
    });
});

describe('input filtering', () => {
    test('digits and colon only', () => {
        openSony();
        const input = document.getElementById('input-5');
        ['1', '9', ':'].forEach((key) => expect(fireEvent.keyDown(input, { key })).toBe(true));
        ['a', 'Ž', '-', '.', '/', ' '].forEach((key) => expect(fireEvent.keyDown(input, { key })).toBe(false));
    });

    test('navigation keys are never swallowed', () => {
        openSony();
        const input = document.getElementById('input-5');
        ['Tab', 'Backspace', 'ArrowLeft'].forEach((key) => expect(fireEvent.keyDown(input, { key })).toBe(true));
    });

    test('a pasted value is stripped', () => {
        const set = openSony();
        set('input-5', '1a0:b0');
        expect(document.getElementById('input-5').value).toBe('10:0');
    });

    test('a complete start time auto-inserts the colon and hops focus', () => {
        const set = openSony();
        set('input-5', '10');
        expect(document.getElementById('input-5').value).toBe('10:');
        set('input-5', '10:00');
        expect(document.activeElement.id).toBe('input-6');
    });
});

describe('validity', () => {
    // Each case is its own mount: without the teardown they stack up and
    // getElementById keeps answering with the first form on the page.
    const withTimes = (s2, e2, s4, e4) => {
        cleanup();
        const set = openSony();
        [['input-5', s2], ['input-6', e2], ['input-7', s4], ['input-8', e4]]
            .forEach(([id, v]) => v !== null && set(id, v));
        return submitEnabled();
    };

    test('one complete pair is enough', () => {
        expect(withTimes('12:00', '14:00', null, null)).toBe(true);
        expect(withTimes(null, null, '12:00', '14:00')).toBe(true);
    });

    test('malformed or half-entered input is rejected', () => {
        expect(withTimes('14:00', '12:00', null, null)).toBe(false);   // backwards
        expect(withTimes('12:00', '12:00', null, null)).toBe(false);   // zero length
        expect(withTimes('12:00', '14:00', '15:00', null)).toBe(false); // half a pair
        expect(withTimes(null, null, null, null)).toBe(false);
    });

    test('the two sessions may touch but never overlap', () => {
        expect(withTimes('12:00', '14:00', '11:00', '12:00')).toBe(true);  // ends as the other starts
        expect(withTimes('12:00', '14:00', '14:00', '16:00')).toBe(true);  // starts as the other ends
        expect(withTimes('12:00', '14:00', '12:40', '16:40')).toBe(false); // starts inside
        expect(withTimes('12:00', '14:00', '11:00', '12:40')).toBe(false); // ends inside
        expect(withTimes('12:00', '14:00', '12:30', '13:00')).toBe(false); // fully inside
        expect(withTimes('12:00', '14:00', '11:00', '15:00')).toBe(false); // fully around
    });

    test('overlap holds across midnight too', () => {
        expect(withTimes('22:40', '00:10', '00:10', '01:00')).toBe(true);
        expect(withTimes('22:40', '00:10', '23:30', '01:00')).toBe(false);
    });

    test('validity is recomputed, not latched on', () => {
        const set = openSony();
        set('input-5', '12:00'); set('input-6', '14:00');
        expect(submitEnabled()).toBe(true);
        set('input-6', '11:00');
        expect(submitEnabled()).toBe(false);
    });

    test('an overlap says so out loud, once', () => {
        const set = openSony();
        set('input-5', '12:00'); set('input-6', '14:00');
        set('input-7', '12:40'); set('input-8', '16:40');
        expect(screen.queryAllByText(/Termini se preklapaju/)).toHaveLength(1);
        set('input-8', '17:00');
        expect(screen.queryAllByText(/Termini se preklapaju/)).toHaveLength(1);
    });
});

describe('billing end to end', () => {
    const bill = async (set, pairs) => {
        pairs.forEach(([id, v]) => set(id, v));
        fireEvent.click(screen.getByText('Izračunaj'));
        await waitFor(() => expect(screen.getByText('Račun')).toBeTruthy());
        return document.querySelector('.drinks__footer').textContent;
    };

    // react-hook-form's onChange was being overridden, so every value arrived
    // empty and the price came out NaN.
    test('an hour on 2 gamepads bills 540', async () => {
        const set = openSony();
        expect(await bill(set, [['input-5', '10:00'], ['input-6', '11:00']])).toContain('540 DIN');
    });

    test('an hour on 4 gamepads bills 700, not 701', async () => {
        const set = openSony();
        expect(await bill(set, [['input-7', '10:00'], ['input-8', '11:00']])).toContain('700 DIN');
    });

    test('a session running past midnight bills its real length', async () => {
        const set = openSony();
        expect(await bill(set, [['input-7', '22:40'], ['input-8', '00:10']])).toContain('1050 DIN');
    });

    test('both sessions bill together', async () => {
        const set = openSony();
        const footer = await bill(set, [
            ['input-5', '10:00'], ['input-6', '11:00'],
            ['input-7', '11:00'], ['input-8', '12:00'],
        ]);
        expect(footer).toContain('1240 DIN');   // 540 + 700
    });
});
