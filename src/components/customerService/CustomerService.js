import { useEffect, useRef } from 'react';
import { useSnackbar } from 'notistack';
import '../../sass/customerService.scss';
import classNames from 'classnames';
import fatalityIcon from '../../assets/fatality_icon.png';

const AUTO_RESET_MS = 60000;

const exportUserInfo = (timeData) => {
    const today = new Date();
    const time = `${today.getHours()}:${today.getMinutes()}`;
    const fileData = JSON.stringify(timeData);
    const blob = new Blob([fileData], { type: 'text/plain' });
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
    const pastMidnight = { 24: '00', 25: '01', 26: '02', 27: '03' };

    return pastMidnight[hours] ? `${pastMidnight[hours]}:${time.substring(3, 5)}` : time;
};

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
                pocetnoVreme_2: startTime_2, zavrsnoVreme_2: endTime_2, brojDzojstika_2: gamepads_2,
                pocetnoVreme_4: startTime_4, zavrsnoVreme_4: endTime_4, brojDzojstika_4: gamepads_4,
                ...totals,
            });
        } else if (has4) {
            exportUserInfo({
                pocetnoVreme: startTime_4, zavrsnoVreme: endTime_4, brojDzojstika: gamepads_4, ...totals,
            });
        } else {
            exportUserInfo({
                pocetnoVreme: startTime_2, zavrsnoVreme: endTime_2, brojDzojstika: gamepads_2, ...totals,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openModal]);

    const restartApp = () => window.location.reload();

    const restartOnKeyDown = (e) => {
        if (e.keyCode === 13 || e.keyCode === 32) window.location.reload();
    };

    const segment = (start, end, gamepads) => (
        <>
            od{' '}
            <span className="span-color">{timeExpressionConverter(start)}</span> do{' '}
            <span className="span-color">{timeExpressionConverter(end)}</span> sa{' '}
            <span className="span-color">{timeExpressionConverter(gamepads)}</span>
        </>
    );

    const finalTimeExpression = () => {
        if (has2 && has4) {
            const two = segment(startTime_2, endTime_2, gamepads_2);
            const four = segment(startTime_4, endTime_4, gamepads_4);
            const twoFirst = startTime_2 <= startTime_4;

            return (
                <>
                    {twoFirst ? two : four} i {twoFirst ? four : two}
                </>
            );
        }

        if (has4) return segment(startTime_4, endTime_4, gamepads_4);

        return segment(startTime_2, endTime_2, gamepads_2);
    };

    return (
        <div
            className={classNames('customer-modal', { opened: openModal })}
            id="customer-modal"
        >
            <div className="modal-dialog">
                <div className="modal-body">
                    <p className="modal-desc line-height">
                        Igrali ste na
                        <span className="span-color"> {nameOfConsole}</span> u periodu{' '}
                        <br />
                        {finalTimeExpression()}
                    </p>

                    {orderItems.length > 0 && (
                        <ul className="modal-order">
                            {orderItems.map((item) => (
                                <li key={item.name}>
                                    <span className="order__name">{item.quantity}x {item.name}</span>
                                    <span className="span-color">{item.price * item.quantity} DIN</span>
                                </li>
                            ))}
                            <li className="order__subtotals">
                                <span className="order__name">Sony</span>
                                <span className="span-color">{finalPrice} DIN</span>
                            </li>
                        </ul>
                    )}

                    <p className="modal-desc main-content">
                        Vaš račun iznosi:
                        <span className="span-color"> {grandTotal} </span>
                        dinara
                    </p>
                    <p className="modal-desc">Hvala sto ste se igrali kod nas </p>
                    <p className='modal-desc'>Budi deo kruga</p>
                    <p></p>
                    <div
                        id='modal_instance'
                        className="modal-new-instance"
                        ref={newInstanceRef}
                        tabIndex="2"
                        onClick={restartApp}
                        onKeyDown={restartOnKeyDown}
                    >
                        <img src={fatalityIcon} alt='ps gamepad' />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerService;
