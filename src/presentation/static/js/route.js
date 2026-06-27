// --- Обработка выбора вершин графа ---
function handleNodeClick(nodeName) {
    if (!state.startNode) {
        state.startNode = nodeName;
        badgeStart.textContent = `🟢 Из: ${nodeName}`;
        badgeStart.classList.add('filled');
        state.nodeMarkers[nodeName]._icon.querySelector('.graph-node-marker').classList.add('node-start');
    } else if (!state.finishNode && nodeName !== state.startNode) {
        state.finishNode = nodeName;
        badgeFinish.textContent = `🔴 В: ${nodeName}`;
        badgeFinish.classList.add('filled');
        state.nodeMarkers[nodeName]._icon.querySelector('.graph-node-marker').classList.add('node-finish');

        // Точки выбраны — запрашиваем у бэкенда расчет сразу всех режимов
        fetchRouteData();
    }
}

// --- Запрос к универсальному бэкенд-сервису ---
async function fetchRouteData() {
    routeSummary.innerHTML = "⏳ Просчет вариантов штурманом...";
    routeResultsBox.classList.remove('hidden');

    const requestBody = {
        start: state.startNode,
        finish: state.finishNode,
        config_name: state.boatConfig.config
    };

    try {
        // Запрос к эндпоинту бэкенда FastAPI
        const response = await fetch('/api/route/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error("Ошибка бэкенда");

        const data = await response.json();
        state.calculatedModes = data.modes; // Сохраняем расчеты всех 4-х режимов

        // Рендерим активный в данный момент режим на вкладке
        renderActiveModeRoute();

    } catch (error) {
        console.error(error);
        routeSummary.innerHTML = "❌ Ошибка соединения с бэкенд-сервисом.";
    }
}

// --- Рендеринг пути на карте и вывод карточки метрик ---
function renderActiveModeRoute() {
    if (!state.calculatedModes || !state.calculatedModes[state.activeMode]) return;

    const routeData = state.calculatedModes[state.activeMode];

    // 1. Очищаем старые треки с карты
    state.routeLayers.forEach(layer => map.removeLayer(layer));
    state.routeLayers = [];

    if (routeData.error) {
        routeSummary.innerHTML = `<b style="color:#e74c3c;">${routeData.error}</b>`;
        return;
    }

    // 2. Строим визуальную линию пути по координатам вершин из config.js
    const coordinates = routeData.path.map(nodeName => GRAPH_NODES[nodeName]);

    const polyline = L.polyline(coordinates, {
        color: '#6fc3ff',
        weight: 5,
        opacity: 0.85,
        dashArray: state.activeMode === 'экономичный' ? '8, 8' : null // Выделяем эконом-режим пунктиром
    }).addTo(map);

    state.routeLayers.push(polyline);
    map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    // 3. Заполняем информационную карточку маршрута (Метрики ТЗ)
    let warningsHtml = routeData.warnings.map(w => `<li style="margin-top:4px; color:#e67e22;">⚠️ ${w}</li>`).join('');

    routeSummary.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 13px; line-height: 1.5;">
            <b>📍 Маршрут:</b> <span style="color:var(--accent);">${routeData.route_str}</span><br>
            📏 <b>Дистанция:</b> ${routeData.total_km} км<br>
            ⏱️ <b>Время хода:</b> ${routeData.time_h} ч<br>
            ⛽ <b>Расход топлива:</b> ${routeData.fuel_l} л<br>
            🔋 <b>Остаток в баке:</b> ${routeData.remainder_l} л<br>
            🛡️ <b>Макс. риск на треке:</b> ${routeData.max_risk}/7<br>
            ⚙️ <b>Включений поддува:</b> ${routeData.air_blow_count}
        </div>
        ${warningsHtml ? `<hr style="border-color:var(--border-glass); margin:8px 0;"><ul>${warningsHtml}</ul>` : ''}
    `;
}

// --- Переключение вкладок режимов ---
modeTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        modeTabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = '#7f8c8d'; // Выключенная вкладка
        });
        this.classList.add('active');
        this.style.background = 'var(--accent)'; // Активная вкладка

        state.activeMode = this.dataset.mode;
        renderActiveModeRoute();
    });
});

// --- Полный сброс параметров построения ---
clearRouteBtn.addEventListener('click', () => {
    // Чистим классы у маркеров
    for (const [name, marker] of Object.entries(state.nodeMarkers)) {
        const el = marker._icon.querySelector('.graph-node-marker');
        el.classList.remove('node-start', 'node-finish');
    }
    state.routeLayers.forEach(layer => map.removeLayer(layer));
    state.routeLayers = [];
    state.startNode = null;
    state.finishNode = null;
    state.calculatedModes = null;

    badgeStart.textContent = "🟢 Откуда: кликните точку";
    badgeStart.classList.remove('filled');
    badgeFinish.textContent = "🔴 Куда: кликните точку";
    badgeFinish.classList.remove('filled');
    routeResultsBox.classList.add('hidden');
});