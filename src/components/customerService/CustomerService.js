import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import classNames from 'classnames';
import '../../sass/customerService.scss';
import { isConfirmKey, toMinutes } from '../utility';
import fatalityIcon from '../../assets/fatality_icon.png';

const AUTO_RESET_MS = 60000;

// Sessions running past midnight are entered as 24:xx-27:xx; the receipt shows
// them as real clock times.
const PAST_MIDNIGHT_HOURS = { 24: '00', 25: '01', 26: '02', 27: '03' };

const exportUserInfo = (timeData) => {
    const today = new Date();
    const time = `${today.getHours()}:${today.getMinutes()}`;
    const blob = new Blob([JSON.stringify(timeData)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.download = `prethodno-vreme_${time}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
};

const timeExpressionConverter = (time) => {
    if (!time) return time;

    const hours = time.substring(0, 2);

    return PAST_MIDNIGHT_HOURS[hours] ? `${PAST_MIDNIGHT_HOURS[hours]}:${time.substring(3, 5)}` : time;
};

const sessionFields = (start, end, gamepads, suffix = '') => ({
    [`pocetnoVreme${suffix}`]: start,
    [`zavrsnoVreme${suffix}`]: end,
    [`brojDzojstika${suffix}`]: gamepads,
});

const CustomerService = (props) => {
    const { openModal, finalPrice, customerDetails, orderItems = [], drinksTotal = 0 } = props;
    const {
        startTime_2, endTime_2, gamepads_2,
        startTime_4, endTime_4, gamepads_4,
        nameOfConsole,
    } = customerDetails;

    const has2 = Boolean(startTime_2 || endTime_2);
    const has4 = Boolean(startTime_4 || endTime_4);
    const grandTotal = finalPrice + drinksTotal;

    const newInstanceRef = useRef(null);
    const { closeSnackbar } = useSnackbar();

    // The receipt has no z-index of its own; snackbars sit at 1400 and would
    // otherwise cover it. They have served their purpose by this point.
    useEffect(() => {
        if (openModal) closeSnackbar();
    }, [openModal, closeSnackbar]);

    // Auto-reset back to a fresh session one minute after the receipt opens.
    useEffect(() => {
        if (!openModal) return undefined;

        const timer = setTimeout(() => window.location.reload(), AUTO_RESET_MS);
        return () => clearTimeout(timer);
    }, [openModal]);

    // Move focus onto the restart target so the kiosk stays keyboard-drivable.
    useEffect(() => {
        if (openModal && newInstanceRef.current) newInstanceRef.current.focus();
    }, [openModal]);

    // Write the receipt to disk once, when the modal opens.
    useEffect(() => {
        if (!openModal) return;

        const totals = {
            cenaSony: `${finalPrice} DIN`,
            cenaPica: `${drinksTotal} DIN`,
            cenaUkupno: `${grandTotal} DIN`,
            pica: orderItems.map((item) => ({
                naziv: item.name,
                kolicina: item.quantity,
                cena: `${item.price * item.quantity} DIN`,
            })),
            konzola: nameOfConsole,
        };

        if (has2 && has4) {
            exportUserInfo({
                ...sessionFields(startTime_2, endTime_2, gamepads_2, '_2'),
                ...sessionFields(startTime_4, endTime_4, gamepads_4, '_4'),
                ...totals,
            });
        } else if (has4) {
            exportUserInfo({ ...sessionFields(startTime_4, endTime_4, gamepads_4), ...totals });
        } else {
            exportUserInfo({ ...sessionFields(startTime_2, endTime_2, gamepads_2), ...totals });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openModal]);

    const restartApp = () => window.location.reload();

    const restartOnKeyDown = (e) => {
        if (isConfirmKey(e)) restartApp();
    };

    // One row per session, earliest first. Sorted on normalised minutes so a
    // session that ends after midnight still lands below the one before it.
    const sessions = [
        has2 && { key: '2', start: startTime_2, end: endTime_2, gamepads: gamepads_2 },
        has4 && { key: '4', start: startTime_4, end: endTime_4, gamepads: gamepads_4 },
    ]
        .filter(Boolean)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start));

    return (
        <div
            className={classNames('customer-modal', { opened: openModal })}
            id="customer-modal"
        >
            <div className="modal-dialog">
                <div className="modal-body">
                    <p className="modal-intro">
                        Igrali ste na <span className="span-color">{nameOfConsole}</span>
                    </p>

                    <ul className="modal-sessions">
                        {sessions.map((session) => (
                            <li key={session.key}>
                                <span className="modal-sessions__time">
                                    <span className="span-color">{timeExpressionConverter(session.start)}</span>
                                    {' \u2013 '}
                                    <span className="span-color">{timeExpressionConverter(session.end)}</span>
                                </span>
                                <span className="modal-sessions__pads">{session.gamepads}</span>
                            </li>
                        ))}
                    </ul>

                    {orderItems.length > 0 && (
                        <ul className="modal-order">
                            {orderItems.map((item) => (
                                <li key={item.name}>
                                    <span className="order__name">{item.quantity}&times; {item.name}</span>
                                    <span className="span-color">{item.price * item.quantity} DIN</span>
                                </li>
                            ))}
                            <li className="order__subtotals">
                                <span className="order__name">Sony</span>
                                <span className="span-color">{finalPrice} DIN</span>
                            </li>
                        </ul>
                    )}

                    <div className="modal-total">
                        <span className="modal-total__label">Ukupno</span>
                        <span className="modal-total__value">
                            {grandTotal}
                            <em>DIN</em>
                        </span>
                    </div>

                    <p className="modal-outro">
                        Hvala što ste se igrali kod nas
                        <span className="modal-brand">Budi deo kruga</span>
                    </p>
                    <div
                        id="modal_instance"
                        className="modal-new-instance"
                        ref={newInstanceRef}
                        // Closed, this modal is still mounted and only parked
                        // off-screen, so a positive tabIndex would put the
                        // fatality icon in the tab order of every other screen.
                        tabIndex={openModal ? 0 : -1}
                        onClick={restartApp}
                        onKeyDown={restartOnKeyDown}
                    >
                        <img src={fatalityIcon} alt="ps gamepad" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerService;
