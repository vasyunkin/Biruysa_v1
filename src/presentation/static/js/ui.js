// static/js/ui.js

// --- Нижняя панель – переключение вкладок ---
bottomBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        bottomBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;

        // Скрываем все панели
        routePanel.classList.add('hidden');
        boatPanel.classList.add('hidden');
        comparisonSection.classList.add('hidden');

        switch (tab) {
            case 'route':
                routePanel.classList.remove('hidden');
                break;
            case 'boat':
                boatPanel.classList.remove('hidden');
                if (typeof updateBoatUI === 'function') {
                    updateBoatUI(); // обновляем актуальные значения
                }
                break;
            case 'compare':
                // Показываем таблицу сравнения с текущими настройками лодки
                if (typeof updateComparisonTable === 'function') {
                    updateComparisonTable();
                }
                comparisonSection.classList.remove('hidden');
                break;
            case 'log':
                alert('Журнал маршрутов (сохранённые треки)');
                break;
        }
    });
});

// --- Дополнительные кнопки верхней панели ---
document.getElementById('layers-btn').addEventListener('click', function() {
    alert('Смена стиля карты: Обычный / Ночной / Спутник');
});
document.getElementById('menu-btn').addEventListener('click', function() {
    alert('Главное меню: Загрузка карты, Настройки, Офлайн-режим');
});