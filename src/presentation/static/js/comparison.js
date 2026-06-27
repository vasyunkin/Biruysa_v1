// static/js/comparison.js

// --- Вспомогательные функции расчёта (mock) ---

/**
 * Рассчитывает параметры маршрута для заданного режима и конфигурации лодки.
 * Здесь мы имитируем логику, которая позже будет заменена на реальные запросы к бэкенду.
 */
function calculateRoute(mode, boatConfig) {
    // Базовые параметры (заглушка)
    const baseTime = 60; // минут
    const baseFuel = 30; // литров
    const obstacles = ['болото', 'камни', 'трава']; // все возможные препятствия

    // Коэффициенты для разных режимов
    const modeFactors = {
        'быстрый': { time: 0.8, fuel: 1.2, risk: 1.0 },
        'экономичный': { time: 1.3, fuel: 0.7, risk: 1.1 },
        'кратчайший': { time: 1.1, fuel: 1.0, risk: 1.0 },
        'безопасный': { time: 1.4, fuel: 1.1, risk: 0.6 }
    };

    // Влияние поддува
    const configFactor = boatConfig.config === 'yes' ? 0.9 : 1.0;
    // Влияние загрузки (чем больше вес, тем выше расход и время)
    const loadFactor = 1 + (boatConfig.load - 0.5) * 0.3; // от 0.5 до 1.5 -> фактор от 1.0 до 1.3

    const factor = modeFactors[mode] || modeFactors['быстрый'];

    // Рассчитываем время, расход
    const time = Math.round(baseTime * factor.time * loadFactor * configFactor);
    const fuel = Math.round(baseFuel * factor.fuel * loadFactor * configFactor * 10) / 10;

    // Препятствия: для разных режимов некоторые препятствия могут быть исключены
    let activeObstacles = [...obstacles];
    if (mode === 'безопасный') {
        // безопасный режим обходит болота и камни
        activeObstacles = activeObstacles.filter(o => o !== 'болото' && o !== 'камни');
    }
    if (boatConfig.config === 'yes') {
        // с поддувом можно проходить по камням и болоту
        // но всё равно могут остаться травяные участки
        activeObstacles = activeObstacles.filter(o => o !== 'камни' && o !== 'болото');
    }

    // Последствия – оцениваем риск
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

    return {
        time,
        fuel,
        obstacles: activeObstacles,
        consequence,
        consequenceClass
    };
}

/**
 * Генерирует и отображает таблицу сравнения.
 */
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
            <tr>
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
}

/**
 * Обновляет таблицу при изменении веса груза (или при применении настроек).
 */
function updateComparisonTable() {
    // Берём текущие настройки лодки из глобального состояния
    const boatConfig = state.boatConfig;
    // Обновляем значение слайдера и отображение веса
    comparisonLoadSlider.value = boatConfig.load;
    comparisonLoadValue.textContent = boatConfig.load.toFixed(1);
    // Рендерим таблицу
    renderComparisonTable(boatConfig);
    // Показываем секцию сравнения, если она скрыта
    comparisonSection.classList.remove('hidden');
}

// --- Обработчики событий ---

// Слайдер веса под таблицей
comparisonLoadSlider.addEventListener('input', function() {
    const newLoad = parseFloat(this.value);
    comparisonLoadValue.textContent = newLoad.toFixed(1);
    // Обновляем состояние лодки (чтобы расчёты использовали новый вес)
    state.boatConfig.load = newLoad;
    // Перерисовываем таблицу
    renderComparisonTable(state.boatConfig);
});

// Кнопка закрытия таблицы
closeComparisonBtn.addEventListener('click', function() {
    comparisonSection.classList.add('hidden');
});

// (Опционально) Если нужно, чтобы при повторном нажатии "Применить" таблица обновлялась,
// она будет вызываться из boat.js, как мы добавили ранее.

// Инициализация: при загрузке показываем таблицу, если есть сохранённые данные?
// По умолчанию таблица скрыта, показываем только после применения.