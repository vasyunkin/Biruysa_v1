// --- Инициализация карты ---
const map = L.map('map', {
    center: [55.87, 92.15],
    zoom: 11,
    zoomControl: false,
    attributionControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
}).addTo(map);

// --- Отрисовка интерактивных узлов графа ---
function renderGraphNodes() {
    for (const [nodeName, coords] of Object.entries(GRAPH_NODES)) {
        const markerElement = document.createElement('div');
        markerElement.className = 'graph-node-marker';
        markerElement.innerHTML = `⬤<div class="node-label">${nodeName}</div>`;

        const marker = L.marker(coords, {
            icon: L.divIcon({
                html: markerElement,
                className: '',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(map);

        marker.on('click', () => handleNodeClick(nodeName));
        state.nodeMarkers[nodeName] = marker;
    }
}

// --- Обновление информации о маршруте (карточка) ---
function updateRouteInfo(data) {
    if (!data) {
        routeSummary.innerHTML = 'Выберите точки на карте';
        return;
    }
    if (data.mode) {
        routeSummary.innerHTML = `
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
        routeSummary.innerHTML = `
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

// --- Отображение маршрута на карте (для mock-данных и ручного выбора) ---
function displayRoute(coordinates) {
    if (state.routeLayers) {
        state.routeLayers.forEach(layer => map.removeLayer(layer));
        state.routeLayers = [];
    }
    const polyline = L.polyline(coordinates, {
        color: '#6fc3ff',
        weight: 5,
        opacity: 0.85
    }).addTo(map);
    state.routeLayers.push(polyline);
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
}