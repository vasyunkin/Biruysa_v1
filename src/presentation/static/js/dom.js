// static/js/dom.js

// --- Панели ---
const routePanel = document.getElementById('route-panel');
const boatPanel = document.getElementById('boat-panel');

// --- Информация о маршруте ---
const routeInfo = document.getElementById('route-info');

// --- Нижняя панель (кнопки) ---
const bottomBtns = document.querySelectorAll('.bottom-btn');

// --- Правая панель (инструменты) ---
const toolRouteBtn = document.getElementById('tool-route');

// --- Элементы управления лодкой ---
const boatModel = document.getElementById('boat-model');
const configNo = document.getElementById('config-no');
const configYes = document.getElementById('config-yes');
const loadSlider = document.getElementById('load-slider');
const loadValue = document.getElementById('load-value');
const fuelSlider = document.getElementById('fuel-slider');
const fuelValue = document.getElementById('fuel-value');
const reserveSlider = document.getElementById('reserve-slider');
const reserveValue = document.getElementById('reserve-value');
const applyBoatBtn = document.getElementById('apply-boat-settings');
const boatStatus = document.getElementById('boat-status');

// --- Верхняя панель (дополнительные кнопки) ---
const layersBtn = document.getElementById('layers-btn');
const menuBtn = document.getElementById('menu-btn');

// --- При необходимости можно добавить другие элементы ---