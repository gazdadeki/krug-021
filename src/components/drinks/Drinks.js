import { useEffect, useRef } from 'react';
import { MENU } from '../../constants/menu';
import '../../sass/Drinks.scss';

const Drinks = (props) => {
    const { active, order, addItem, removeItem, consoleTotal, drinksTotal, openCustomerModal } = props;

    const itemCount = Object.keys(order).reduce((sum, name) => sum + order[name].quantity, 0);

    const racunRef = useRef(null);

    // Arriving from "Izračunaj": park focus on Račun so a second Enter bills the
    // Sony time on its own, without the operator touching the mouse.
    useEffect(() => {
        if (active && racunRef.current) racunRef.current.focus();
    }, [active]);

    return (
        <div className="drinks__screen">
            <header className="drinks__header">
                <h1>Piće i Grickalice</h1>
                <p className="drinks__hint">Dodirni proizvod da ga dodaš na račun</p>
            </header>

            <div className="drinks__content">
                {MENU.map((group) => (
                    <section className="menu__group" key={group.title}>
                        <h2 className="menu__group-title">{group.title}</h2>

                        <div className="menu__grid">
                            {group.items.map((item) => {
                                const quantity = order[item.name] ? order[item.name].quantity : 0;

                                return (
                                    <div
                                        className={quantity ? 'menu__card selected' : 'menu__card'}
                                        key={item.name}
                                    >
                                        <button
                                            type="button"
                                            className="menu__card-add"
                                            onClick={() => addItem(item)}
                                        >
                                            <span className="menu__card-name">{item.name}</span>
                                        </button>

                                        {quantity > 0 && (
                                            <>
                                                <span className="menu__card-badge">{quantity}</span>
                                                <button
                                                    type="button"
                                                    className="menu__card-remove"
                                                    aria-label={`Ukloni ${item.name}`}
                                                    onClick={() => removeItem(item)}
                                                >
                                                    &minus;
                                                </button>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <footer className="drinks__footer">
                <div className="order__summary">
                    <div className="order__row">
                        <span className="order__label">Sony</span>
                        <span className="order__value">{consoleTotal} DIN</span>
                    </div>
                    <div className="order__row">
                        <span className="order__label">
                            Piće i hrana
                            {itemCount > 0 && <em className="order__count">{itemCount}</em>}
                        </span>
                        <span className="order__value">{drinksTotal} DIN</span>
                    </div>
                    <div className="order__row order__row--total">
                        <span className="order__label">Ukupno</span>
                        <span className="order__value">{consoleTotal + drinksTotal} DIN</span>
                    </div>
                </div>

                <button
                    id="open-modal-1"
                    type="button"
                    className="open_modal_button"
                    ref={racunRef}
                    onClick={openCustomerModal}
                >
                    Račun
                </button>
            </footer>
        </div>
    );
};

export default Drinks;
