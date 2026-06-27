// static/js/route.js

// Все DOM-элементы теперь в dom.js

// --- Обработчик клика по карте ---
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

// --- Кнопка "Построить маршрут" ---
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