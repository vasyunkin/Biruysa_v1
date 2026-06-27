function updateBoatUI() {
    loadValue.textContent = state.boatConfig.load.toFixed(1);
    fuelValue.textContent = state.boatConfig.fuel;
    reserveValue.textContent = state.boatConfig.reserve;
    loadSlider.value = state.boatConfig.load;
    fuelSlider.value = state.boatConfig.fuel;
    reserveSlider.value = state.boatConfig.reserve;

    if (state.boatConfig.config === 'с поддувом') {
        configYes.checked = true;
    } else {
        configNo.checked = true;
    }
    boatModel.value = state.boatConfig.model;

    boatStatus.textContent = `Конфигурация: ${state.boatConfig.config}, загрузка: ${state.boatConfig.load} т, бак: ${state.boatConfig.fuel} л`;
}

function applyBoatSettings() {
    state.boatConfig.model = boatModel.value;
    state.boatConfig.config = configYes.checked ? 'с поддувом' : 'без поддува';
    state.boatConfig.load = parseFloat(loadSlider.value);
    state.boatConfig.fuel = parseInt(fuelSlider.value, 10);
    state.boatConfig.reserve = parseInt(reserveSlider.value, 10);
    updateBoatUI();

    boatStatus.textContent += ' ✅ Применено';
    setTimeout(() => {
        updateBoatUI();
    }, 2000);

    // Если точки уже выбраны, при изменении параметров лодки пересчитываем маршруты автоматически
    if (state.startNode && state.finishNode) {
        fetchRouteData();
    }
}

loadSlider.addEventListener('input', function() { loadValue.textContent = parseFloat(this.value).toFixed(1); });
fuelSlider.addEventListener('input', function() { fuelValue.textContent = this.value; });
reserveSlider.addEventListener('input', function() { reserveValue.textContent = this.value; });
applyBoatBtn.addEventListener('click', applyBoatSettings);