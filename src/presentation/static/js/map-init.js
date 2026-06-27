// --- Инициализация карты ---
const map = L.map('map', {
    center: [55.87, 92.15], // Центрирование на цепочку Дивногорск -> Бирюса
    zoom: 11,
    zoomControl: false,
    attributionControl: false,
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

// Отрисовка интерактивных узлов графа
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

        // Вешаем событие клика на вершину графа через модуль route.js
        marker.on('click', () => handleNodeClick(nodeName));
        state.nodeMarkers[nodeName] = marker;
    }
}