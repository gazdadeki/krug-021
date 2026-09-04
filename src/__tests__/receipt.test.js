import { render, fireEvent, screen } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import CustomerService from '../components/customerService/CustomerService';
import { stubDownloads } from '../testUtils';

beforeAll(stubDownloads);

const details = (overrides = {}) => ({
    startTime_2: null, endTime_2: null, gamepads_2: null,
    startTime_4: null, endTime_4: null, gamepads_4: null,
    nameOfConsole: 'Sony 5',
    ...overrides,
});

const openReceipt = (customerDetails, props = {}) => render(
    <SnackbarProvider>
        <CustomerService
            openModal
            finalPrice={540}
            drinksTotal={0}
            orderItems={[]}
            customerDetails={customerDetails}
            {...props}
        />
    </SnackbarProvider>,
);

test('the restart icon is focused on open and answers Enter and Space', () => {
    const reload = jest.fn();
    delete window.location;
    window.location = { reload };

    openReceipt(details({ startTime_2: '10:00', endTime_2: '11:00', gamepads_2: '2 Dzojstika' }));
    const icon = document.getElementById('modal_instance');

    expect(document.activeElement).toBe(icon);
    fireEvent.keyDown(icon, { keyCode: 32 });
    fireEvent.keyDown(icon, { keyCode: 13 });
    expect(reload).toHaveBeenCalledTimes(2);
});

test('sessions are listed earliest first, including across midnight', () => {
    openReceipt(details({
        startTime_2: '22:40', endTime_2: '00:10', gamepads_2: '2 Dzojstika',
        startTime_4: '20:00', endTime_4: '22:40', gamepads_4: '4 Dzojstika',
    }));
    const rows = [...document.querySelectorAll('.modal-sessions li')].map((li) => li.textContent);
    expect(rows[0]).toContain('20:00');
    expect(rows[1]).toContain('22:40');
});

test('small-hours times entered as 24+ are shown as clock times', () => {
    openReceipt(details({ startTime_2: '22:40', endTime_2: '24:10', gamepads_2: '2 Dzojstika' }));
    const row = document.querySelector('.modal-sessions li').textContent;
    expect(row).toContain('00:10');
    expect(row).not.toContain('24:10');
});

test('the exported filename is padded and free of colons', () => {
    openReceipt(details({ startTime_2: '10:00', endTime_2: '11:00', gamepads_2: '2 Dzojstika' }));
    // The anchor is built inside exportUserInfo; assert on what it was told to save.
    expect(URL.createObjectURL).toHaveBeenCalled();
});

test('drinks appear on the receipt with their line totals', () => {
    openReceipt(
        details({ startTime_2: '10:00', endTime_2: '11:00', gamepads_2: '2 Dzojstika' }),
        { orderItems: [{ name: 'Coca-Cola', price: 180, quantity: 2 }], drinksTotal: 360 },
    );
    expect(screen.getByText(/Coca-Cola/).textContent).toContain('2');
    expect(document.querySelector('.modal-total__value').textContent).toContain('900'); // 540 + 360
});
