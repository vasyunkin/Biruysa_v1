// static/js/main.js

// --- Инициализация карты ---
const map = L.map('map', {
    center: [56.0, 93.0], // Координаты вашего района (Красноярское вдхр.)
    zoom: 10,
    zoomControl: false, // Отключаем стандартные контролы, т.к. используем свои
});

// --- Базовый слой (тёмный стиль, как ночной режим) ---
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19,
}).addTo(map);

// Добавляем контролы масштаба в правый верхний угол
L.control.zoom({
    position: 'topright'
}).addTo(map);

// --- Состояние приложения ---
const state = {
    startPoint: null,   // { lat, lng }
    endPoint: null,     // { lat, lng }
    markers: [],        // Массив для хранения маркеров
    routeLayer: null,   // Слой для отображения маршрута
    isRouteMode: false, // Режим построения маршрута
};

// --- DOM-элементы ---
const sidePanel = document.getElementById('side-panel');
const routeInfo = document.getElementById('route-info');
const bottomBtns = document.querySelectorAll('.bottom-btn');
const toolRouteBtn = document.getElementById('tool-route');

// --- Функции для работы с картой ---

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

// Функция отображения маршрута (полилинии)
function displayRoute(coordinates) {
    if (state.routeLayer) {
        map.removeLayer(state.routeLayer);
    }
    state.routeLayer = L.polyline(coordinates, {
        color: '#6fc3ff',
        weight: 4,
        opacity: 0.9,
        dashArray: null,
    }).addTo(map);
    map.fitBounds(state.routeLayer.getBounds(), { padding: [50, 50] });
}

// Функция обновления информации в боковой панели
function updateRouteInfo(data) {
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
    sidePanel.classList.remove('hidden');
}

// --- Обработчики событий ---

// Клик по карте для выбора точек
map.on('click', function(e) {
    const { lat, lng } = e.latlng;

    if (state.isRouteMode) {
        if (!state.startPoint) {
            // Устанавливаем начальную точку
            state.startPoint = { lat, lng };
            const marker = addMarker(lat, lng, 'A');
            state.markers.push(marker);
            routeInfo.innerHTML = 'Точка A выбрана. Выберите точку B.';
        } else if (!state.endPoint) {
            // Устанавливаем конечную точку
            state.endPoint = { lat, lng };
            const marker = addMarker(lat, lng, 'B');
            state.markers.push(marker);

            // Здесь будет запрос к вашему API для построения маршрута
            // Пока имитируем ответ
            const mockRoute = [
                [state.startPoint.lat, state.startPoint.lng],
                [(state.startPoint.lat + state.endPoint.lat) / 2, (state.startPoint.lng + state.endPoint.lng) / 2],
                [state.endPoint.lat, state.endPoint.lng]
            ];
            displayRoute(mockRoute);
            updateRouteInfo({
                length: '42.5',
                time: '68',
                fuel: '34',
                description: 'Маршрут построен в режиме "Быстрый"'
            });

            // Сбрасываем режим выбора
            state.isRouteMode = false;
            toolRouteBtn.style.color = '#b0c7e0';
        }
    }
});

// Кнопка "Построить маршрут" (📍)
toolRouteBtn.addEventListener('click', function() {
    // Очищаем предыдущие точки и маршруты
    state.markers.forEach(m => map.removeLayer(m));
    state.markers = [];
    if (state.routeLayer) {
        map.removeLayer(state.routeLayer);
        state.routeLayer = null;
    }
    state.startPoint = null;
    state.endPoint = null;
    state.isRouteMode = true;
    this.style.color = '#6fc3ff';
    routeInfo.innerHTML = 'Кликните на карте, чтобы выбрать точку A';
    sidePanel.classList.remove('hidden');
});

// Кнопки нижней панели
bottomBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        bottomBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;

        switch (tab) {
            case 'route':
                // Показать/скрыть панель маршрута
                sidePanel.classList.toggle('hidden');
                break;
            case 'boat':
                // Здесь будет модальное окно с настройками лодки
                alert('Настройки лодки: Raptor 650, загрузка 1.2 т, поддув включён');
                break;
            case 'compare':
                // Здесь будет запрос на сравнение режимов
                alert('Сравнение режимов: Быстрый, Экономичный, Безопасный');
                break;
            case 'log':
                // Журнал маршрутов
                alert('Журнал маршрутов (сохранённые треки)');
                break;
        }
    });
});

// Кнопка "Стиль карты" (верхняя панель)
document.getElementById('layers-btn').addEventListener('click', function() {
    // Переключение между стилями карты (как в Savvy Navvy)
    const currentUrl = map.getTileLayer().getContainer().querySelector('img').src;
    // Здесь можно реализовать переключение слоёв
    alert('Смена стиля карты: Обычный / Ночной / Спутник');
});

// Кнопка "Меню" (верхняя панель)
document.getElementById('menu-btn').addEventListener('click', function() {
    alert('Главное меню: Загрузка карты, Настройки, Офлайн-режим');
});

// --- Инициализация ---
console.log('Цифровой штурман аэролодки готов к работе!');