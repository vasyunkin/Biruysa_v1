// static/js/config.js

// --- Состояние приложения ---
const state = {
    startPoint: null,   // { lat, lng }
    endPoint: null,     // { lat, lng }
    markers: [],        // Массив для хранения маркеров
    routeLayer: null,   // Слой для отображения маршрута
    isRouteMode: false, // Режим построения маршрута
    boatConfig: {
        model: 'raptor650',
        config: 'no',          // 'no' или 'yes'
        load: 1.2,             // тонны
        fuel: 300,             // литры
        reserve: 20,           // процент
    }
};