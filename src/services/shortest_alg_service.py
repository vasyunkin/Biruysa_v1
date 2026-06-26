import heapq
import json
from typing import Any, Dict, List, Optional


def load_scenario_data(file_path: str = "data.json") -> Dict[str, Any]:
    """Загружает конфигурационный файл ТЗ в формате JSON."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_shortest_route(
    data: Dict[str, Any],
    start: str,
    finish: str,
    config_name: str,
    mode_name: str = "кратчайший",
) -> Optional[Dict[str, Any]]:
    """Находит кратчайший маршрут по графу методом Дейкстры.

    Критерий оптимизации: минимум длины (км) с учетом проходимости
    поверхностей (блокировка жестких покрытий, если нет поддува).
    """
    boat_cfg = data["boat"]
    selected_config = data["configs"].get(config_name)
    selected_mode = data["modes"].get(mode_name)

    if not selected_config or not selected_mode:
        raise ValueError("Некорректная конфигурация лодки или режим.")

    allow_hard = selected_config["allow_hard"]
    k_load = selected_config["k_load"]
    k_mode = selected_mode["k_mode"]
    base_fuel = boat_cfg["base_l_per_km"]

    # Построение графа (списки смежности)
    adj_list: Dict[str, List[tuple]] = {}
    for edge in data["map"]["edges"]:
        u, v = edge["from"], edge["to"]
        km = edge["km"]
        surf_type = edge["surface"]
        surf_info = data["surfaces"][surf_type]

        # Фильтрация по проходимости (проверка на жесткие поверхности)
        if surf_info["hard"] and not allow_hard:
            continue

        if u not in adj_list:
            adj_list[u] = []
        if v not in adj_list:
            adj_list[v] = []

        # Граф ненаправленный, добавляем ребро в обе стороны
        adj_list[u].append((v, km, surf_type, surf_info))
        adj_list[v].append((u, km, surf_type, surf_info))

    if start not in adj_list or finish not in adj_list:
        return None

    # Очередь Дейкстры хранит кортежи: (текущее_расстояние_км, вершина)
    queue = [(0.0, start)]
    min_distances = {start: 0.0}
    parent_edges = {start: None}

    while queue:
        current_dist, u = heapq.heappop(queue)

        if current_dist > min_distances.get(u, float("inf")):
            continue

        if u == finish:
            break

        for v, km, surf_type, surf_info in adj_list.get(u, []):
            # Вес ребра — это расстояние (км) для режима "Кратчайший"
            total_dist_to_v = current_dist + km

            if total_dist_to_v < min_distances.get(v, float("inf")):
                min_distances[v] = total_dist_to_v
                parent_edges[v] = (u, km, surf_type, surf_info)
                heapq.heappush(queue, (total_dist_to_v, v))

    if finish not in min_distances:
        return None

    # Восстановление пути и расчет параметров
    curr = finish
    total_km = 0.0
    total_time = 0.0
    total_fuel = 0.0
    warnings = []

    segments_reversed = []
    while parent_edges[curr] is not None:
        prev, km, surf_type, surf_info = parent_edges[curr]
        segments_reversed.append((prev, curr, km, surf_type, surf_info))
        curr = prev

    path = [start] + [seg[1] for seg in reversed(segments_reversed)]

    # Агрегация метрик по выбранным сегментам пути
    for prev, curr, km, surf_type, surf_info in reversed(segments_reversed):
        total_km += km

        # Расчет времени сегмента: время = расстояние / скорость
        speed = surf_info["spd"]
        total_time += km / speed

        # Расчет топлива по формуле ТЗ
        k_surf = surf_info["k_surf"]
        segment_fuel = km * base_fuel * k_surf * k_load * k_mode
        total_fuel += segment_fuel

        # Генерация предупреждений на основе рисков местности
        if not surf_info["planing"]:
            warnings.append(
                f"Участок {prev} → {curr} ({surf_info['label']}): "
                f"потеря глиссирования!"
            )
        if surf_info["risk"] >= 4:
            warnings.append(
                f"Участок {prev} → {curr} ({surf_info['label']}): "
                f"повышенный риск ({surf_info['risk']}/7)!"
            )

    remainder_fuel = boat_cfg["tank_l"] - total_fuel
    reserve_limit = boat_cfg["tank_l"] * boat_cfg["reserve_frac_tank"]

    if remainder_fuel < 0:
        warnings.append(
            "ВНИМАНИЕ: Недостаточно топлива для завершения маршрута!"
        )
    elif remainder_fuel < reserve_limit:
        warnings.append(
            f"Предупреждение: Остаток топлива ниже резерва ({reserve_limit} л)."
        )

    return {
        "path": path,
        "total_km": round(total_km, 1),
        "total_time_hours": round(total_time, 2),
        "total_fuel_liters": round(total_fuel, 1),
        "remainder_fuel_liters": round(max(0.0, remainder_fuel), 1),
        "warnings": list(set(warnings)),
    }


# Пример запуска скрипта на сервере или локально
if __name__ == "__main__":
    try:
        # Автоматическая загрузка из файла data.json в корне проекта
        json_data = load_scenario_data("data.json")

        # Тест 1: Вариант без поддува (не может идти через камни/болота)
        res_no_blow = calculate_shortest_route(
            json_data, "Дивногорск", "Бирюса", "без поддува"
        )
        print(" РЕЖИМ: КРАТЧАЙШИЙ (БЕЗ ПОДДУВА):")
        print(json.dumps(res_no_blow, ensure_ascii=False, indent=2))

        # Тест 2: Вариант с поддувом (сократит путь через камни, но изменится расход)
        res_with_blow = calculate_shortest_route(
            json_data, "Дивногорск", "Бирюса", "с поддувом"
        )
        print("\n РЕЖИМ: КРАТЧАЙШИЙ (С ПОДДУВОМ):")
        print(json.dumps(res_with_blow, ensure_ascii=False, indent=2))

    except FileNotFoundError:
        print("Ошибка: Убедитесь, что файл 'data.json' находится в той же папке.")