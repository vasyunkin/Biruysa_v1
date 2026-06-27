// static/js/comparison.js

// --- Генерация таблицы сравнения на основе данных от бэкенда ---
function renderComparisonTable(boatConfig) {
    // Проверяем, выбран ли маршрут и загружены ли данные
    if (!state.startNode || !state.finishNode) {
        comparisonTableContainer.innerHTML = '<p style="color: var(--text-muted);">Сначала выберите начальную и конечную точки на карте.</p>';
        return;
    }
    if (!state.calculatedModes) {
        comparisonTableContainer.innerHTML = '<p style="color: var(--text-muted);">Данные маршрутов ещё не загружены. Выберите точки на карте.</p>';
        return;
    }

    const modes = ['быстрый', 'экономичный', 'кратчайший', 'безопасный'];
    const configLabel = boatConfig.config === 'с поддувом' ? 'с поддувом' : 'без поддува';

    let html = `<table class="comparison-table">
        <thead>
            <tr>
                <th>Режим</th>
                <th>Время (ч)</th>
                <th>Расстояние (км)</th>
                <th>Расход (л)</th>
                <th>Остаток (л)</th>
                <th>Препятствия / предупреждения</th>
                <th>Конфигурация</th>
                <th>Последствия</th>
            </tr>
        </thead>
        <tbody>`;

    modes.forEach(mode => {
        const routeData = state.calculatedModes[mode];
        if (!routeData || routeData.error) {
            // Если режим недоступен, показываем прочерки
            html += `
                <tr data-mode="${mode}" style="cursor:pointer; opacity:0.6;">
                    <td><strong>${mode}</strong></td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>${configLabel}</td>
                    <td>❌ Недоступен</td>
                </tr>
            `;
            return;
        }

        // Извлекаем данные из ответа бэкенда
        const time = routeData.time_h ?? '—';
        const distance = routeData.total_km ?? '—';
        const fuel = routeData.fuel_l ?? '—';
        const remainder = routeData.remainder_l ?? '—';
        const warnings = routeData.warnings || [];
        const maxRisk = routeData.max_risk || 0;

        // Формируем строку с предупреждениями (вместо препятствий)
        let warningsHtml = warnings.length
            ? warnings.map(w => `<span class="obstacle-tag">⚠️ ${w}</span>`).join(' ')
            : '—';

        // Определяем последствия на основе риска и предупреждений
        let consequence = '✅ Рекомендуется';
        let consequenceClass = 'consequence-ok';
        if (maxRisk >= 6) {
            consequence = '⚠️ Высокий риск';
            consequenceClass = 'consequence-warn';
        } else if (maxRisk >= 4) {
            consequence = '⚠️ Средний риск';
            consequenceClass = 'consequence-warn';
        } else if (warnings.length > 0) {
            consequence = '⚠️ Есть предупреждения';
            consequenceClass = 'consequence-warn';
        }

        html += `
            <tr data-mode="${mode}" style="cursor:pointer;">
                <td><strong>${mode}</strong></td>
                <td>${time}</td>
                <td>${distance}</td>
                <td>${fuel}</td>
                <td>${remainder}</td>
                <td>${warningsHtml}</td>
                <td>${configLabel}</td>
                <td class="${consequenceClass}">${consequence}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    comparisonTableContainer.innerHTML = html;

    // --- Обработчики клика на строки таблицы ---
    document.querySelectorAll('.comparison-table tbody tr[data-mode]').forEach(row => {
        row.addEventListener('click', function() {
            const mode = this.dataset.mode;
            if (!state.calculatedModes || !state.calculatedModes[mode] || state.calculatedModes[mode].error) {
                alert('Данные для этого режима недоступны.');
                return;
            }

            // Устанавливаем активный режим и перерисовываем маршрут через существующую функцию
            state.activeMode = mode;
            renderActiveModeRoute(); // функция из route.js (глобальная)

            // Переключаем интерфейс: скрываем сравнение, показываем маршрут
            comparisonSection.classList.add('hidden');
            routePanel.classList.remove('hidden');
            boatPanel.classList.add('hidden');
            bottomBtns.forEach(b => b.classList.remove('active'));
            document.querySelector('.bottom-btn[data-tab="route"]').classList.add('active');
        });
    });
}

// --- Обновление таблицы (вызывается при открытии вкладки "Сравнение" и после пересчёта) ---
function updateComparisonTable() {
    const boatConfig = state.boatConfig;
    comparisonLoadSlider.value = boatConfig.load;
    comparisonLoadValue.textContent = boatConfig.load.toFixed(1);

    // Если маршрут выбран и данные загружены, показываем таблицу
    if (state.startNode && state.finishNode && state.calculatedModes) {
        renderComparisonTable(boatConfig);
        comparisonSection.classList.remove('hidden');
    } else {
        // Иначе показываем сообщение
        comparisonTableContainer.innerHTML = '<p style="color: var(--text-muted);">Для сравнения режимов сначала выберите начальную и конечную точки на карте.</p>';
        comparisonSection.classList.remove('hidden');
    }
}

// --- Обработчик изменения веса груза в таблице сравнения ---
comparisonLoadSlider.addEventListener('input', function() {
    const newLoad = parseFloat(this.value);
    comparisonLoadValue.textContent = newLoad.toFixed(1);
    state.boatConfig.load = newLoad;

    // Если маршрут выбран, пересчитываем все режимы с новым весом
    if (state.startNode && state.finishNode) {
        fetchRouteData(); // после получения данных таблица обновится автоматически (см. изменения в route.js)
    }
});

// --- Закрытие панели сравнения ---
closeComparisonBtn.addEventListener('click', function() {
    comparisonSection.classList.add('hidden');
});