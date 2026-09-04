import { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { MENU } from '../../constants/menu';
import '../../sass/Drinks.scss';

const Drinks = ({ order, addItem, removeItem, consoleTotal, drinksTotal, openCustomerModal }) => {
    const itemCount = Object.values(order).reduce((sum, item) => sum + item.quantity, 0);

    const racunRef = useRef(null);

    // This screen only mounts on arrival from "Izračunaj", so mounting is the
    // cue: park focus on Račun and a second Enter bills the Sony time on its
    // own, without the operator touching the mouse.
    useEffect(() => {
        if (racunRef.current) racunRef.current.focus();
    }, []);

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
                                const quantity = order[item.name]?.quantity ?? 0;

                                return (
                                    <div
                                        className={classNames('menu__card', { selected: quantity })}
                                        key={item.name}
                                    >
                                        <button
                                            type="button"
                                            className="menu__card-add"
                                            onClick={() => addItem(item)}
                                        >
                                            <span className="menu__card-name">{item.name}</span>
                                        </button>

                                        {/* Only ever rendered above zero: removeItem drops the
                                            entry at the last unit, so the stepper disappears
                                            rather than sitting there showing 0. */}
                                        {quantity > 0 && (
                                            <div className="menu__card-stepper">
                                                <button
                                                    type="button"
                                                    className="menu__card-step"
                                                    aria-label={`Ukloni ${item.name}`}
                                                    onClick={() => removeItem(item)}
                                                >
                                                    &minus;
                                                </button>
                                                {/* Keyed on the value so React remounts it and the
                                                    pop animation replays on every change. */}
                                                <span className="menu__card-qty" key={quantity}>{quantity}</span>
                                                <button
                                                    type="button"
                                                    className="menu__card-step"
                                                    aria-label={`Dodaj ${item.name}`}
                                                    onClick={() => addItem(item)}
                                                >
                                                    +
                                                </button>
                                            </div>
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
