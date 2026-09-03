// Cenovnik - sve cene su u dinarima (RSD).
// Izmeni cene ovde; Drinks.js samo iscrtava ono sto je ovde definisano.

export const MENU = [
    {
        title: 'Kafa',
        items: [
            { name: 'Espresso kratka', price: 220 },
            { name: 'Espresso duga', price: 240 },
            { name: 'Cappuccino', price: 240 },
            { name: 'Nesquik', price: 220 },
        ],
    },
    {
        title: 'Piva',
        items: [
            { name: 'Nikšićko 0.5', price: 200 },
            { name: 'Jelen 0.5', price: 200 },
            { name: 'Bavaria 0.25', price: 240 },
            { name: 'Heineken 0.4', price: 240 },
        ],
    },
    {
        title: 'Sokovi',
        items: [
            { name: 'Coca-Cola', price: 180 },
            { name: 'Fanta', price: 180 },
            { name: 'Fuse Breskva', price: 180 },
            { name: 'Fuse Šumsko Voće', price: 180 },
            { name: 'Guarana', price: 240 },
            { name: 'Knjaz Miloš', price: 160 },
            { name: 'Rosa', price: 160 },
        ],
    },
    {
        title: 'Grickalice',
        items: [
            { name: 'Pardon Štapići Kikiriki', price: 140 },
            { name: 'Chipsy', price: 220 },
            { name: 'Clipsy Kokice', price: 140 },
        ],
    },
    {
        title: 'Slatkiši',
        items: [
            { name: 'Snickers', price: 140 },
            { name: 'Kit-Kat', price: 140 },
            { name: 'Jaffa Biskvit', price: 180 },
            { name: 'Munchmallow', price: 180 },
            { name: 'Čoko Bananica', price: 70 },
        ],
    },
];

export default MENU;
