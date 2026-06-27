// static/js/attribution.js

// --- Управление атрибуцией карты ---

// Определяем три режима атрибуции
const attributionModes = [
    {
        label: 'Полная',
        text: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
    },
    {
        label: 'Минимальная',
        text: '© OSM'
    },
    {
        label: 'Отключена',
        text: ''
    }
];

let currentAttributionIndex = 0; // Начинаем с полной

// Функция обновления атрибуции
function updateAttribution(index) {
    const mode = attributionModes[index];
    // Устанавливаем текст атрибуции через контрол Leaflet
    if (map.attributionControl) {
        map.attributionControl.setAttribution(mode.text);
    }
    // Обновляем подсказку на кнопке
    const btn = document.getElementById('tool-attribution');
    if (btn) {
        btn.title = `Атрибуция: ${mode.label}`;
        // Можно менять иконку в зависимости от режима, например, зачёркивание или жирность
        // Пока просто оставляем ©
    }
    console.log(`Атрибуция переключена на: ${mode.label}`);
}

// Обработчик клика по кнопке
document.getElementById('tool-attribution')?.addEventListener('click', function() {
    // Переключаем индекс циклически
    currentAttributionIndex = (currentAttributionIndex + 1) % attributionModes.length;
    updateAttribution(currentAttributionIndex);
});

// Инициализация: устанавливаем полную атрибуцию при загрузке (уже установлена по умолчанию, но для уверенности)
// Можно сразу вызвать, чтобы синхронизировать
updateAttribution(currentAttributionIndex);