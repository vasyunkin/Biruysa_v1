// static/js/boat.js

// Все DOM-элементы теперь в dom.js

// --- Функции ---

// Обновление отображения слайдеров
function updateBoatUI() {
    loadValue.textContent = state.boatConfig.load.toFixed(1);
    fuelValue.textContent = state.boatConfig.fuel;
    reserveValue.textContent = state.boatConfig.reserve;
    // Синхронизируем элементы ввода
    loadSlider.value = state.boatConfig.load;
    fuelSlider.value = state.boatConfig.fuel;
    reserveSlider.value = state.boatConfig.reserve;
    if (state.boatConfig.config === 'yes') {
        configYes.checked = true;
    } else {
        configNo.checked = true;
    }
    boatModel.value = state.boatConfig.model;
    // Отображаем статус
    const configLabel = state.boatConfig.config === 'yes' ? 'с поддувом' : 'без поддува';
    boatStatus.textContent = `Конфигурация: ${configLabel}, загрузка: ${state.boatConfig.load} т, топливо: ${state.boatConfig.fuel} л, резерв: ${state.boatConfig.reserve}%`;
}

// Применение настроек лодки из формы
function applyBoatSettings() {
    state.boatConfig.model = boatModel.value;
    state.boatConfig.config = configYes.checked ? 'yes' : 'no';
    state.boatConfig.load = parseFloat(loadSlider.value);
    state.boatConfig.fuel = parseInt(fuelSlider.value, 10);
    state.boatConfig.reserve = parseInt(reserveSlider.value, 10);
    updateBoatUI();
    // Можно добавить уведомление
    boatStatus.textContent += ' ✅ Применено';
    setTimeout(() => {
        boatStatus.textContent = boatStatus.textContent.replace(' ✅ Применено', '');
    }, 2000);
    // После применения настроек обновляем таблицу сравнения, если она видна
    // if (typeof updateComparisonTable === 'function') {
    //     updateComparisonTable();
    // }
}

// --- Обработчики слайдеров (обновление отображения) ---
loadSlider.addEventListener('input', function() {
    loadValue.textContent = parseFloat(this.value).toFixed(1);
});
fuelSlider.addEventListener('input', function() {
    fuelValue.textContent = this.value;
});
reserveSlider.addEventListener('input', function() {
    reserveValue.textContent = this.value;
});

// Применение настроек лодки
applyBoatBtn.addEventListener('click', applyBoatSettings);