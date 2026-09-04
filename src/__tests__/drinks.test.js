import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import MainContainer from '../components/main-container/MainContainer';

// Get to the drinks screen the way the operator does.
const openDrinks = async () => {
    render(<SnackbarProvider><MainContainer /></SnackbarProvider>);
    fireEvent.keyDown(window, { keyCode: 13 });
    fireEvent.change(document.getElementById('input-5'), { target: { value: '10:00' } });
    fireEvent.change(document.getElementById('input-6'), { target: { value: '11:00' } });
    fireEvent.click(screen.getByText('Izračunaj'));
    await waitFor(() => expect(screen.getByText('Račun')).toBeTruthy());
};

const card = (name) => screen.getByText(name).closest('.menu__card');

test('the stepper only exists once an item is on the order', async () => {
    await openDrinks();
    expect(card('Coca-Cola').querySelector('.menu__card-stepper')).toBeNull();

    fireEvent.click(screen.getByText('Coca-Cola'));
    expect(card('Coca-Cola').querySelector('.menu__card-qty').textContent).toBe('1');
});

test('plus and minus both work, and zero removes the stepper entirely', async () => {
    await openDrinks();
    fireEvent.click(screen.getByText('Coca-Cola'));

    const [minus, plus] = card('Coca-Cola').querySelectorAll('.menu__card-step');
    fireEvent.click(plus);
    expect(card('Coca-Cola').querySelector('.menu__card-qty').textContent).toBe('2');

    fireEvent.click(minus);
    fireEvent.click(card('Coca-Cola').querySelectorAll('.menu__card-step')[0]);
    // Back to zero: the row goes away rather than showing 0.
    expect(card('Coca-Cola').querySelector('.menu__card-stepper')).toBeNull();
});

test('the footer totals console time and drinks together', async () => {
    await openDrinks();
    fireEvent.click(screen.getByText('Coca-Cola'));   // 180
    fireEvent.click(screen.getByText('Chipsy'));      // 220

    const footer = document.querySelector('.drinks__footer').textContent;
    expect(footer).toContain('540 DIN');    // console
    expect(footer).toContain('400 DIN');    // drinks
    expect(footer).toContain('940 DIN');    // total
});
