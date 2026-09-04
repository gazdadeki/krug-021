import { difference, toMinutes } from '../components/utility';

// Every one of these is a bug that shipped at some point.
describe('time arithmetic', () => {
    test('a plain daytime session', () => {
        expect(difference('10:00', '11:00')).toBe(60);
        expect(difference('10:00', '10:20')).toBe(20);
    });

    test('past midnight, written either way', () => {
        expect(difference('22:40', '00:10')).toBe(90);
        expect(difference('22:40', '24:10')).toBe(90);
        expect(toMinutes('00:10')).toBe(toMinutes('24:10'));
        expect(difference('23:00', '01:00')).toBe(120);
    });

    test('a backwards range stays negative, which is how the form rejects it', () => {
        expect(difference('14:00', '12:00')).toBeLessThan(0);
    });
});

// Rates are per hour and divided at the point of use. Storing a rounded
// per-minute decimal (11.6666666667) made every exact-dinar duration bill 1 over.
describe('price', () => {
    const price = (minutes, perHour) => Math.ceil((minutes * perHour) / 60);

    test('whole hours are exact', () => {
        expect(price(60, 700)).toBe(700);
        expect(price(180, 700)).toBe(2100);
        expect(price(60, 540)).toBe(540);
    });

    test('partial minutes round up, deliberately', () => {
        expect(price(20, 700)).toBe(234);
        expect(price(22, 700)).toBe(257);
    });
});
