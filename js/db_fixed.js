/**
 * db.js - Mock Database Service for Cash & Flow
 * Utiliza LocalStorage para simular una base de datos real.
 * Imágenes reales de GTA V de la carpeta multimedia_cash.
 */

const DB_KEY = 'cash_flow_cars';

const defaultCars = [
    {
        id: 'car-1',
        brand: 'Pegassi',
        model: 'Zentorno',
        year: 2024,
        price: '$7,250,000 MXN',
        engine: '6.8L V12 Mid-Engine',
        hp: '750 HP',
        acceleration: '2.8s (0-100 km/h)',
        imageUrl: 'multimedia_cash/car_002.png',
        description: 'La joya de la corona de Pegassi. Agresivo, insensato y absurdamente rápido. El diseño híbrido de fibra de carbono corta el aire como una navaja. Si lo ves llegar al semáforo, ya perdiste.'
    },
    {
        id: 'car-2',
        brand: 'Grotti',
        model: 'Itali RSX',
        year: 2023,
        price: '$9,100,000 MXN',
        engine: '4.0L V8 Twin-Turbo Híbrido',
        hp: '897 HP',
        acceleration: '2.5s (0-100 km/h)',
        imageUrl: 'multimedia_cash/car_004.jpg',
        description: 'Herencia italiana perfeccionada con tecnología híbrida de Fórmula 1. El RSX es el equilibrio perfecto entre elegancia sobre ruedas y potencia brutal. Amarillo que enamora, aceleración que aterra.'
    },
    {
        id: 'car-3',
        brand: 'Pegassi',
        model: 'Oppressor Mk I',
        year: 2022,
        price: '$15,000,000 MXN',
        engine: 'Reacción a Chorro + Motor Eléctrico',
        hp: '1,200 HP',
        acceleration: '1.9s (0-100 km/h)',
        imageUrl: 'multimedia_cash/car_003.jpg',
        description: 'No es una moto. No es un avión. Es ambas cosas. El Oppressor trasciende las leyes del asfalto — y a veces, las de la física. Para el cliente que ya lo tiene todo y quiere algo imposible.'
    },
    {
        id: 'car-4',
        brand: 'Benefactor',
        model: 'Panto',
        year: 2021,
        price: '$650,000 MXN',
        engine: '1.2L Turbo 3 Cilindros',
        hp: '112 HP',
        acceleration: '9.8s (0-100 km/h)',
        imageUrl: 'multimedia_cash/car_001.png',
        description: 'Para quien quiere lo mejor de la marca Benefactor en el formato más compacto y urbano del mercado. Perfecto para Querétaro, perfecto para la ciudad. No tiene cohetes, pero llega a donde otros no caben.'
    }
];

// Inicializar DB
function initDB() {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
        localStorage.setItem(DB_KEY, JSON.stringify(defaultCars));
        return defaultCars;
    }
    return JSON.parse(data);
}

function getAllCars() {
    return initDB();
}

function addCar(car) {
    const cars = getAllCars();
    const newCar = { ...car, id: 'car-' + Date.now() };
    cars.push(newCar);
    localStorage.setItem(DB_KEY, JSON.stringify(cars));
    return newCar;
}

function deleteCar(id) {
    let cars = getAllCars();
    cars = cars.filter(c => c.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(cars));
}

function updateCar(id, updatedData) {
    let cars = getAllCars();
    const idx = cars.findIndex(c => c.id === id);
    if (idx !== -1) {
        cars[idx] = { ...cars[idx], ...updatedData };
        localStorage.setItem(DB_KEY, JSON.stringify(cars));
        return cars[idx];
    }
    return null;
}

function forceResetToGTA() {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultCars));
}

window.CashFlowDB = { getAllCars, addCar, deleteCar, updateCar, forceResetToGTA };
