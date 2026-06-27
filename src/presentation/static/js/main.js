// static/js/main.js

// --- Инициализация карты ---
const map = L.map('map', {
    center: [56.0, 93.0], // Координаты вашего района (Красноярское вдхр.)
    zoom: 10,
    zoomControl: false, // Отключаем стандартные контролы, т.к. используем свои
});

// TODO: Это не локально! Локализовать!
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
    boatConfig: {
        model: 'raptor650',
        config: 'no',          // 'no' или 'yes'
        load: 1.2,             // тонны
        fuel: 300,             // литры
        reserve: 20,           // процент
    }
};

// --- DOM-элементы ---
const routePanel = document.getElementById('route-panel');
const boatPanel = document.getElementById('boat-panel');
const routeInfo = document.getElementById('route-info');
const bottomBtns = document.querySelectorAll('.bottom-btn');
const toolRouteBtn = document.getElementById('tool-route');

// Элементы управления лодкой
const boatModel = document.getElementById('boat-model');
const configNo = document.getElementById('config-no');
const configYes = document.getElementById('config-yes');
const loadSlider = document.getElementById('load-slider');
const loadValue = document.getElementById('load-value');
const fuelSlider = document.getElementById('fuel-slider');
const fuelValue = document.getElementById('fuel-value');
const reserveSlider = document.getElementById('reserve-slider');
const reserveValue = document.getElementById('reserve-value');
const applyBoatBtn = document.getElementById('apply-boat-settings');
const boatStatus = document.getElementById('boat-status');

// --- Функции ---

// Обновление отображения слайдеров
function updateBoatUI() {
    loadValue.textContent = state.boatConfig.load.toFixed(1);
    fuelValue.textContent = state.boatConfig.fuel;
    reserveValue.textContent = state.boatConfig.reserve;
    // Синхронизируем элементы ввода
    loadSlider.value = state.boatConfig.load;
    fuelSlider.value = state.boatConfig.fuel;
    reserveSlider.value = state.boatConfig.reserve;
    if (state.boatConfig.config === 'yes') {
        configYes.checked = true;
    } else {
        configNo.checked = true;
    }
    boatModel.value = state.boatConfig.model;
    // Отображаем статус
    const configLabel = state.boatConfig.config === 'yes' ? 'с поддувом' : 'без поддува';
    boatStatus.textContent = `Конфигурация: ${configLabel}, загрузка: ${state.boatConfig.load} т, топливо: ${state.boatConfig.fuel} л, резерв: ${state.boatConfig.reserve}%`;
}

// Применение настроек лодки из формы
function applyBoatSettings() {
    state.boatConfig.model = boatModel.value;
    state.boatConfig.config = configYes.checked ? 'yes' : 'no';
    state.boatConfig.load = parseFloat(loadSlider.value);
    state.boatConfig.fuel = parseInt(fuelSlider.value, 10);
    state.boatConfig.reserve = parseInt(reserveSlider.value, 10);
    updateBoatUI();
    // Можно добавить уведомление
    boatStatus.textContent += ' ✅ Применено';
    setTimeout(() => {
        boatStatus.textContent = boatStatus.textContent.replace(' ✅ Применено', '');
    }, 2000);
}

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

// --- Обработчики ---

// Клик по карте
map.on('click', function(e) {
    if (!state.isRouteMode) return;
    const { lat, lng } = e.latlng;

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

        // Здесь будет запрос к API с параметрами лодки
        // Пока имитация
        const mockRoute = [
            [state.startPoint.lat, state.startPoint.lng],
            [(state.startPoint.lat + state.endPoint.lat) / 2, (state.startPoint.lng + state.endPoint.lng) / 2],
            [state.endPoint.lat, state.endPoint.lng]
        ];
        displayRoute(mockRoute);
        // Передаём текущие настройки лодки в запрос (в реальности они будут в теле)
        console.log('Параметры лодки:', state.boatConfig);
        updateRouteInfo({
            length: '42.5',
            time: '68',
            fuel: '34',
            description: `Маршрут построен в режиме "Быстрый" (${state.boatConfig.config === 'yes' ? 'с поддувом' : 'без поддува'})`
        });

        state.isRouteMode = false;
        toolRouteBtn.style.color = '#b0c7e0';
    }
});

// Кнопка "Построить маршрут"
toolRouteBtn.addEventListener('click', function() {
    // Очистка предыдущего
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
    // Показываем панель маршрута, если скрыта
    routePanel.classList.remove('hidden');
    boatPanel.classList.add('hidden');
    // Обновляем активную кнопку внизу
    bottomBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('.bottom-btn[data-tab="route"]').classList.add('active');
});

// Нижняя панель – переключение вкладок
bottomBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        bottomBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;

        // Скрываем все панели
        routePanel.classList.add('hidden');
        boatPanel.classList.add('hidden');

        switch (tab) {
            case 'route':
                routePanel.classList.remove('hidden');
                break;
            case 'boat':
                boatPanel.classList.remove('hidden');
                updateBoatUI(); // обновляем актуальные значения
                break;
            case 'compare':
                alert('Сравнение режимов будет доступно после выбора маршрута.');
                break;
            case 'log':
                alert('Журнал маршрутов (сохранённые треки)');
                break;
        }
    });
});

// Обработчики слайдеров (обновление отображения)
loadSlider.addEventListener('input', function() {
    loadValue.textContent = parseFloat(this.value).toFixed(1);
});
fuelSlider.addEventListener('input', function() {
    fuelValue.textContent = this.value;
});
reserveSlider.addEventListener('input', function() {
    reserveValue.textContent = this.value;
});

// Применение настроек лодки
applyBoatBtn.addEventListener('click', applyBoatSettings);

// Дополнительные кнопки
document.getElementById('layers-btn').addEventListener('click', function() {
    alert('Смена стиля карты: Обычный / Ночной / Спутник');
});
document.getElementById('menu-btn').addEventListener('click', function() {
    alert('Главное меню: Загрузка карты, Настройки, Офлайн-режим');
});

// --- Инициализация ---
updateBoatUI();
console.log('Цифровой штурман аэролодки готов!');