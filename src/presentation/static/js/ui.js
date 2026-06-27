// static/js/ui.js

// --- Нижняя панель – переключение вкладок ---
bottomBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        bottomBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;

        routePanel.classList.add('hidden');
        boatPanel.classList.add('hidden');
        comparisonSection.classList.add('hidden');

        switch (tab) {
            case 'route':
                routePanel.classList.remove('hidden');
                break;
            case 'boat':
                boatPanel.classList.remove('hidden');
                updateBoatUI();
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
                alert('Журнал сохраненных треков (будет доступен в бортовой версии)');
                break;
        }
    });
});

layersBtn.addEventListener('click', () => alert('Переключение слоев подложки карт ( offline-first )'));
menuBtn.addEventListener('click', () => alert('Системное меню штурмана аэролодки Raptor 650'));