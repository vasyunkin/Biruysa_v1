import heapq
import json
from typing import Any, Dict, List, Optional


def load_scenario_data(file_path: str = "data.json") -> Dict[str, Any]:
    """Загружает конфигурационный файл ТЗ в формате JSON."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_safe_route(
    data: Dict[str, Any],
    start: str,
    finish: str,
    config_name: str,
    mode_name: str = "безопасный",
) -> Optional[Dict[str, Any]]:
    """Находит наиболее безопасный маршрут по графу методом Дейкстры.

    Критерий оптимизации: минимизация интегрального риска (длина * риск)
    с обходом опасных зон и учетом проходимости лодки.
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

    # Построение графа списков смежности
    adj_list: Dict[str, List[tuple]] = {}
    for edge in data["map"]["edges"]:
        u, v = edge["from"], edge["to"]
        km = edge["km"]
        surf_type = edge["surface"]
        surf_info = data["surfaces"][surf_type]

        # Фильтрация по проходимости жестких поверхностей
        if surf_info["hard"] and not allow_hard:
            continue

        if u not in adj_list:
            adj_list[u] = []
        if v not in adj_list:
            adj_list[v] = []

        # Граф ненаправленный
        adj_list[u].append((v, km, surf_type, surf_info))
        adj_list[v].append((u, km, surf_type, surf_info))

    if start not in adj_list or finish not in adj_list:
        return None

    # Очередь Дейкстры хранит: (накопленный_штраф_риска, вершина)
    queue = [(0.0, start)]
    min_risk_costs = {start: 0.0}
    parent_edges = {start: None}

    while queue:
        current_risk_cost, u = heapq.heappop(queue)

        if current_risk_cost > min_risk_costs.get(u, float("inf")):
            continue

        if u == finish:
            break

        for v, km, surf_type, surf_info in adj_list.get(u, []):
            # Вес ребра: длина участка умножается на его коэффициент риска
            risk_weight = surf_info["risk"]
            segment_risk_cost = km * risk_weight
            total_risk_cost = current_risk_cost + segment_risk_cost

            if total_risk_cost < min_risk_costs.get(v, float("inf")):
                min_risk_costs[v] = total_risk_cost
                parent_edges[v] = (u, km, surf_type, surf_info)
                heapq.heappush(queue, (total_risk_cost, v))

    if finish not in min_risk_costs:
        return None

    # Восстановление пути
    curr = finish
    total_km = 0.0
    total_time = 0.0
    total_fuel = 0.0
    max_route_risk = 0
    warnings = []

    segments_reversed = []
    while parent_edges[curr] is not None:
        prev, km, surf_type, surf_info = parent_edges[curr]
        segments_reversed.append((prev, curr, km, surf_type, surf_info))
        curr = prev

    path = [start] + [seg[1] for seg in reversed(segments_reversed)]

    # Агрегация финальных параметров по безопасному пути
    for prev, curr, km, surf_type, surf_info in reversed(segments_reversed):
        total_km += km

        # Время: расстояние / скорость
        speed = surf_info["spd"]
        total_time += km / speed

        # Топливо по формуле ТЗ
        k_surf = surf_info["k_surf"]
        segment_fuel = km * base_fuel * k_surf * k_load * k_mode
        total_fuel += segment_fuel

        # Фиксация максимального риска на маршруте
        if surf_info["risk"] > max_route_risk:
            max_route_risk = surf_info["risk"]

        # Генерация предупреждений
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
        "max_route_risk": max_route_risk,
        "total_km": round(total_km, 1),
        "total_time_hours": round(total_time, 2),
        "total_fuel_liters": round(total_fuel, 1),
        "remainder_fuel_liters": round(max(0.0, remainder_fuel), 1),
        "warnings": list(set(warnings)),
    }


# Демонстрация работы скрипта
if __name__ == "__main__":
    try:
        # Автоматическое чтение файла data.json
        json_data = load_scenario_data("data.json")

        print("=== РЕЖИМ: БЕЗОПАСНЫЙ (ОБХОД ЗОН РИСКА) ===")

        # Тест: Конфигурация с поддувом (даже при наличии поддува,
        # алгоритм постарается обойти Камни и Болота из-за высокого риска)
        res_with_blow = calculate_safe_route(
            json_data, "Дивногорск", "Бирюса", "с поддувом"
        )
        print("\nКонфигурация 'с поддувом':")
        print(json.dumps(res_with_blow, ensure_ascii=False, indent=2))

    except FileNotFoundError:
        print("Ошибка: положите файл 'data.json' в одну папку со скриптом.")