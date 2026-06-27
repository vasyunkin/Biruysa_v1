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

let currentAttributionIndex = 0;

// Создаём свой контрол атрибуции
const attributionControl = L.control.attribution({
    prefix: false // Убираем стандартный префикс "Leaflet"
});

// Добавляем его на карту
attributionControl.addTo(map);

// Функция обновления атрибуции
function updateAttribution(index) {
    const mode = attributionModes[index];
    // Устанавливаем текст атрибуции через наш контрол
    attributionControl.setAttribution(mode.text);
    // Обновляем подсказку на кнопке
    const btn = document.getElementById('tool-attribution');
    if (btn) {
        btn.title = `Атрибуция: ${mode.label}`;
    }
    console.log(`Атрибуция переключена на: ${mode.label}`);
}

// Обработчик клика по кнопке
document.getElementById('tool-attribution')?.addEventListener('click', function() {
    currentAttributionIndex = (currentAttributionIndex + 1) % attributionModes.length;
    updateAttribution(currentAttributionIndex);
});

// Инициализация: устанавливаем полную атрибуцию при загрузке
updateAttribution(currentAttributionIndex);