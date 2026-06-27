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

// Обновление информации о маршруте (расширенная версия)
function updateRouteInfo(data) {
    if (!data) {
        routeInfo.innerHTML = 'Выберите точки на карте';
        return;
    }
    // Если передан объект с полными деталями (режим, конфигурация и т.д.)
    if (data.mode) {
        routeInfo.innerHTML = `
            <div style="margin-bottom: 8px;"><strong>Режим:</strong> ${data.mode}</div>
            <div style="margin-bottom: 8px;"><strong>Длина:</strong> ${data.length || '—'} км</div>
            <div style="margin-bottom: 8px;"><strong>Время:</strong> ${data.time || '—'} мин</div>
            <div style="margin-bottom: 8px;"><strong>Расход топлива:</strong> ${data.fuel || '—'} л</div>
            <div style="margin-bottom: 8px;"><strong>Конфигурация:</strong> ${data.config || '—'}</div>
            <div style="margin-bottom: 8px;"><strong>Препятствия:</strong> ${data.obstacles ? data.obstacles.join(', ') : '—'}</div>
            <div style="margin-bottom: 8px;"><strong>Последствия:</strong> <span style="color: ${data.consequenceColor || 'inherit'}">${data.consequence || '—'}</span></div>
            <div style="margin-bottom: 8px;"><strong>Остаток топлива:</strong> ${data.remainder || '—'} л</div>
            <div style="margin-bottom: 8px;"><strong>Запас хода:</strong> ${data.range || '—'} км</div>
        `;
    } else {
        // Старый формат (для mock-клика по карте)
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
}