// --- Панели ---
const routePanel = document.getElementById('route-panel');
const boatPanel = document.getElementById('boat-panel');

// --- Индикаторы выбора точек ---
const badgeStart = document.getElementById('badge-start');
const badgeFinish = document.getElementById('badge-finish');
const clearRouteBtn = document.getElementById('clear-route-btn');
const routeResultsBox = document.getElementById('route-results');
const routeSummary = document.getElementById('route-summary');

// --- Вкладки режимов ---
const modeTabs = document.querySelectorAll('.mode-tab');

// --- Нижня и Правая панели ---
const bottomBtns = document.querySelectorAll('.bottom-btn');
const toolRouteBtn = document.getElementById('tool-route');

// --- Управление лодкой ---
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

// --- Верхняя панель ---
const layersBtn = document.getElementById('layers-btn');
const menuBtn = document.getElementById('menu-btn');

// Элементы сравнения
const comparisonSection = document.getElementById('comparison-section');
const comparisonTableContainer = document.getElementById('comparison-table-container');
// const comparisonLoadSlider = document.getElementById('comparison-load-slider');
// const comparisonLoadValue = document.getElementById('comparison-load-value');
const closeComparisonBtn = document.getElementById('close-comparison');
