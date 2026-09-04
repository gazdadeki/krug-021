import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import Sony5 from '../sony/Sony5';
import Drinks from '../drinks/Drinks';
import CustomerService from '../customerService/CustomerService';
import { isConfirmKey } from '../utility';
import unlock from '../../assets/padlock-unlock.png';
import '../../sass/app.scss';

const EMPTY_CUSTOMER_DETAILS = {
    startTime_2: null,
    endTime_2: null,
    startTime_4: null,
    endTime_4: null,
    gamepads_2: null,
    gamepads_4: null,
    nameOfConsole: '',
};

const MainContainer = () => {
    const [finalPrice, setFinalPrice] = useState(0);
    const [openModal, setOpenModal] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(EMPTY_CUSTOMER_DETAILS);
    const [openService, setOpenService] = useState(false);
    const [screen, setScreen] = useState('sony');
    const [order, setOrder] = useState({});

    const orderItems = Object.values(order);
    const drinksTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const unlockRef = useRef(null);

    useEffect(() => {
        if (unlockRef.current) unlockRef.current.focus();
    }, []);

    const openFullscreen = () => {
        const elem = document.body;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    };

    const unlockService = () => {
        openFullscreen();
        setOpenService(true);
    };

    // Listen on the window rather than the padlock itself: a stray click on the
    // banner drops focus to <body> and Space would otherwise stop working.
    useEffect(() => {
        if (openService) return undefined;

        const onKeyDown = (e) => {
            if (isConfirmKey(e)) {
                e.preventDefault();
                unlockService();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openService]);

    const addItem = (item) => {
        setOrder((prevOrder) => ({
            ...prevOrder,
            [item.name]: {
                ...item,
                quantity: (prevOrder[item.name]?.quantity ?? 0) + 1,
            },
        }));
    };

    const removeItem = (item) => {
        setOrder((prevOrder) => {
            const current = prevOrder[item.name];
            if (!current) return prevOrder;

            const nextOrder = { ...prevOrder };

            if (current.quantity <= 1) {
                delete nextOrder[item.name];
            } else {
                nextOrder[item.name] = { ...current, quantity: current.quantity - 1 };
            }

            return nextOrder;
        });
    };

    const openCustomerModal = () => {
        if (finalPrice + drinksTotal > 0) setOpenModal(true);
    };

    return (
        <div className="main__app-wrapper">
            <div className={classNames('banner_wrapper', { open: !openService })}>
                <span
                    className="toggle_dropdown"
                    onClick={unlockService}
                    ref={unlockRef}
                    id="unlock_icon_container"
                    tabIndex="0"
                >
                    <img src={unlock} alt="unlock icon" />
                </span>
            </div>

            {screen === 'sony' ? (
                <div className="sony_wrapper">
                    <Sony5
                        active={openService}
                        setFinalPrice={setFinalPrice}
                        setCustomerDetails={setCustomerDetails}
                        goToDrinks={() => setScreen('drinks')}
                    />
                </div>
            ) : (
                <Drinks
                    active
                    order={order}
                    addItem={addItem}
                    removeItem={removeItem}
                    consoleTotal={finalPrice}
                    drinksTotal={drinksTotal}
                    openCustomerModal={openCustomerModal}
                />
            )}

            <CustomerService
                finalPrice={finalPrice}
                openModal={openModal}
                customerDetails={customerDetails}
                orderItems={orderItems}
                drinksTotal={drinksTotal}
            />
        </div>
    );
};

export default MainContainer;
