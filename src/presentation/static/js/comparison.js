// static/js/comparison.js

// --- Вспомогательные функции расчёта (mock) ---

function calculateRoute(mode, boatConfig) {
    const baseTime = 60;
    const baseFuel = 30;
    const obstacles = ['болото', 'камни', 'трава'];

    const modeFactors = {
        'быстрый': { time: 0.8, fuel: 1.2, risk: 1.0 },
        'экономичный': { time: 1.3, fuel: 0.7, risk: 1.1 },
        'кратчайший': { time: 1.1, fuel: 1.0, risk: 1.0 },
        'безопасный': { time: 1.4, fuel: 1.1, risk: 0.6 }
    };

    const configFactor = boatConfig.config === 'yes' ? 0.9 : 1.0;
    const loadFactor = 1 + (boatConfig.load - 0.5) * 0.3;

    const factor = modeFactors[mode] || modeFactors['быстрый'];

    const time = Math.round(baseTime * factor.time * loadFactor * configFactor);
    const fuel = Math.round(baseFuel * factor.fuel * loadFactor * configFactor * 10) / 10;

    let activeObstacles = [...obstacles];
    if (mode === 'безопасный') {
        activeObstacles = activeObstacles.filter(o => o !== 'болото' && o !== 'камни');
    }
    if (boatConfig.config === 'yes') {
        activeObstacles = activeObstacles.filter(o => o !== 'камни' && o !== 'болото');
    }

    let consequence = '✅ Рекомендуется';
    let consequenceClass = 'consequence-ok';
    if (mode === 'быстрый' && fuel > 35) {
        consequence = '⚠️ Высокий расход';
        consequenceClass = 'consequence-warn';
    } else if (mode === 'экономичный' && time > 90) {
        consequence = '⚠️ Долго';
        consequenceClass = 'consequence-warn';
    } else if (mode === 'безопасный' && activeObstacles.length > 0) {
        consequence = '⚠️ Есть препятствия';
        consequenceClass = 'consequence-warn';
    } else if (boatConfig.config === 'no' && activeObstacles.includes('камни')) {
        consequence = '❌ Непроходимо (камни)';
        consequenceClass = 'consequence-danger';
    } else if (boatConfig.config === 'no' && activeObstacles.includes('болото')) {
        consequence = '❌ Непроходимо (болото)';
        consequenceClass = 'consequence-danger';
    }

    return { time, fuel, obstacles: activeObstacles, consequence, consequenceClass };
}

// --- Генерация таблицы ---

function renderComparisonTable(boatConfig) {
    const modes = ['быстрый', 'экономичный', 'кратчайший', 'безопасный'];
    const configLabel = boatConfig.config === 'yes' ? 'с поддувом' : 'без поддува';

    let html = `<table class="comparison-table">
        <thead>
            <tr>
                <th>Режим</th>
                <th>Время (мин)</th>
                <th>Препятствия</th>
                <th>Расход (л)</th>
                <th>Конфигурация</th>
                <th>Последствия</th>
            </tr>
        </thead>
        <tbody>`;

    modes.forEach(mode => {
        const data = calculateRoute(mode, boatConfig);
        const obstacleTags = data.obstacles.length
            ? data.obstacles.map(o => `<span class="obstacle-tag">${o}</span>`).join(' ')
            : '—';
        html += `
            <tr data-mode="${mode}" style="cursor:pointer;">
                <td><strong>${mode}</strong></td>
                <td>${data.time}</td>
                <td>${obstacleTags}</td>
                <td>${data.fuel}</td>
                <td>${configLabel}</td>
                <td class="${data.consequenceClass}">${data.consequence}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    comparisonTableContainer.innerHTML = html;

    // --- Обработчики клика на строки ---
    document.querySelectorAll('.comparison-table tbody tr').forEach(row => {
        row.addEventListener('click', function() {
            const mode = this.dataset.mode;
            const boatConfig = state.boatConfig;
            const routeData = calculateRoute(mode, boatConfig);

            // Формируем полный объект для отображения
            const fullRoute = {
                mode: mode,
                length: '42.5', // mock – позже заменим на реальные данные
                time: routeData.time,
                fuel: routeData.fuel,
                config: boatConfig.config === 'yes' ? 'с поддувом' : 'без поддува',
                obstacles: routeData.obstacles,
                consequence: routeData.consequence,
                consequenceColor: routeData.consequenceClass === 'consequence-ok' ? '#4caf50' : (routeData.consequenceClass === 'consequence-warn' ? '#ff9800' : '#f44336'),
                remainder: (boatConfig.fuel - routeData.fuel).toFixed(1),
                range: ((boatConfig.fuel - routeData.fuel) / (routeData.fuel / 42.5)).toFixed(1)
            };

            // Mock-координаты маршрута (позже заменим на реальные)
            const mockCoords = [
                [56.0, 93.0],
                [56.05, 93.1],
                [56.1, 93.2]
            ];

            // Отображаем маршрут на карте
            displayRoute(mockCoords);
            // Обновляем панель маршрута
            updateRouteInfo(fullRoute);

            // Переключаем интерфейс: скрываем сравнение, показываем маршрут
            comparisonSection.classList.add('hidden');
            routePanel.classList.remove('hidden');
            boatPanel.classList.add('hidden');
            bottomBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('.bottom-btn[data-tab="route"]').classList.add('active');
        });
    });
}

// --- Обновление таблицы (вызывается при изменении веса груза или после "Применить") ---

function updateComparisonTable() {
    const boatConfig = state.boatConfig;
    comparisonLoadSlider.value = boatConfig.load;
    comparisonLoadValue.textContent = boatConfig.load.toFixed(1);
    renderComparisonTable(boatConfig);
    comparisonSection.classList.remove('hidden');
}

// --- Обработчики событий ---

comparisonLoadSlider.addEventListener('input', function() {
    const newLoad = parseFloat(this.value);
    comparisonLoadValue.textContent = newLoad.toFixed(1);
    state.boatConfig.load = newLoad;
    renderComparisonTable(state.boatConfig);
});

closeComparisonBtn.addEventListener('click', function() {
    comparisonSection.classList.add('hidden');
});

// (Вызов updateComparisonTable из boat.js уже добавлен ранее)