// static/js/map-init.js

// --- Инициализация карты ---
const map = L.map('map', {
    center: [56.0, 93.0],
    zoom: 10,
    zoomControl: false,
    attributionControl: false, // Отключаем атрибуцию полностью
});

// Светлый тайловый слой (без атрибуции)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '', // Пустая строка, чтобы не было надписи
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);

// Добавляем контролы масштаба
L.control.zoom({
    position: 'topright'
}).addTo(map);

// --- Функции работы с картой ---

// Функция добавления маркера
function addMarker(lat, lng, label) {
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background: ${label === 'A' ? '#4caf50' : '#f44336'}; 
                          width: 20px; height: 20px; border-radius: 50%; 
                          border: 2px solid white; display: flex; 
                          align-items: center; justify-content: center; 
                          color: white; font-weight: bold; font-size: 12px;">
                    ${label}
                   </div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        })
    }).addTo(map);
    return marker;
}

// Отображение маршрута
function displayRoute(coordinates) {
    if (state.routeLayer) {
        map.removeLayer(state.routeLayer);
    }
    state.routeLayer = L.polyline(coordinates, {
        color: '#6fc3ff',
        weight: 4,
        opacity: 0.9,
    }).addTo(map);
    map.fitBounds(state.routeLayer.getBounds(), { padding: [50, 50] });
}

// Обновление информации о маршруте
function updateRouteInfo(data) {
    const routeInfo = document.getElementById('route-info');
    if (!data) {
        routeInfo.innerHTML = 'Выберите точки на карте';
        return;
    }
    routeInfo.innerHTML = `
        <div style="margin-bottom: 12px;">
            <strong>Длина:</strong> ${data.length || '—'} км<br>
            <strong>Время:</strong> ${data.time || '—'} мин<br>
            <strong>Расход топлива:</strong> ${data.fuel || '—'} л
        </div>
        <div style="font-size: 13px; color: #8899b0;">
            ${data.description || 'Маршрут построен'}
        </div>
    `;
}