bottomBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        bottomBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;

        routePanel.classList.add('hidden');
        boatPanel.classList.add('hidden');

        switch (tab) {
            case 'route':
                routePanel.classList.remove('hidden');
                break;
            case 'boat':
                boatPanel.classList.remove('hidden');
                updateBoatUI();
                break;
            case 'compare':
                alert('Сравнение: Все 4 режима уже активны на вкладках панели "Маршрут"!');
                break;
            case 'log':
                alert('Журнал сохраненных треков (будет доступен в бортовой версии)');
                break;
        }
    });
});

layersBtn.addEventListener('click', () => alert('Переключение слоев подложки карт ( offline-first )'));
menuBtn.addEventListener('click', () => alert('Системное меню штурмана аэролодки Raptor 650'));