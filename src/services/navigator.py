import heapq
import json
from typing import Any, Dict, List, Optional


def load_scenario_data(file_path: str = "data.json") -> Dict[str, Any]:
    """Загружает конфигурационный файл ТЗ в формате JSON."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def calculate_route(
    data: Dict[str, Any],
    start: str,
    finish: str,
    config_name: str,
    mode_name: str,
) -> Optional[Dict[str, Any]]:
    """Универсальная функция построения оптимального маршрута методом Дейкстры.

    Поддерживает динамическое переключение поддува на жестких участках пути
    для конфигураций лодки, поддерживающих эту опцию.
    """
    boat_cfg = data["boat"]
    selected_config = data["configs"].get(config_name)
    selected_mode = data["modes"].get(mode_name)

    if not selected_config or not selected_mode:
        raise ValueError(
            f"Некорректная конфигурация лодки ({config_name}) "
            f"или режим движения ({mode_name})."
        )

    # Модификация: allow_hard теперь означает принципиальное наличие поддува у лодки
    has_air_blow = selected_config["allow_hard"]
    k_mode = selected_mode["k_mode"]
    base_fuel = boat_cfg["base_l_per_km"]

    # 1. Построение списков смежности графа
    adj_list: Dict[str, List[tuple]] = {}
    for edge in data["map"]["edges"]:
        u, v = edge["from"], edge["to"]
        km = edge["km"]
        surf_type = edge["surface"]
        surf_info = data["surfaces"][surf_type]

        # Если участок жесткий, а у лодки в принципе нет поддува — ребро непроходимо
        if surf_info["hard"] and not has_air_blow:
            continue

        if u not in adj_list:
            adj_list[u] = []
        if v not in adj_list:
            adj_list[v] = []

        adj_list[u].append((v, km, surf_type, surf_info))
        adj_list[v].append((u, km, surf_type, surf_info))

    if start not in adj_list or finish not in adj_list:
        return None

    # 2. Инициализация Дейкстры
    queue = [(0.0, start)]
    min_costs = {start: 0.0}
    parent_edges = {start: None}

    # 3. Основной цикл Дейкстры
    while queue:
        current_cost, u = heapq.heappop(queue)

        if current_cost > min_costs.get(u, float("inf")):
            continue

        if u == finish:
            break

        for v, km, surf_type, surf_info in adj_list.get(u, []):
            # ДИНАМИЧЕСКИЙ РАСЧЕТ k_load:
            # Если поверхность жесткая, включаем поддув (k_load = 1.12 из конфига "с поддувом")
            # Если гладкая — отключаем поддув ради экономии (k_load = 1.0 из конфига "без поддува")
            if surf_info["hard"]:
                current_k_load = data["configs"]["с поддувом"]["k_load"]
            else:
                current_k_load = data["configs"]["без поддува"]["k_load"]

            # Вычисление стоимости ребра в зависимости от выбранного режима
            if mode_name == "кратчайший":
                edge_weight = km
            elif mode_name == "быстрый":
                edge_weight = km / surf_info["spd"]
            elif mode_name == "экономичный":
                edge_weight = (
                    km * base_fuel * surf_info["k_surf"] * current_k_load * k_mode
                )
            elif mode_name == "безопасный":
                edge_weight = km * surf_info["risk"]
            else:
                raise ValueError(f"Неизвестный режим: {mode_name}")

            total_cost_to_v = current_cost + edge_weight

            if total_cost_to_v < min_costs.get(v, float("inf")):
                min_costs[v] = total_cost_to_v
                parent_edges[v] = (u, km, surf_type, surf_info)
                heapq.heappush(queue, (total_cost_to_v, v))

    if finish not in min_costs:
        return None

    # 4. Восстановление пути и сбор параметров
    curr = finish
    total_km = 0.0
    total_time = 0.0
    total_fuel = 0.0
    max_route_risk = 0
    air_blow_activated_segments = 0
    warnings = []

    segments_reversed = []
    while parent_edges[curr] is not None:
        prev, km, surf_type, surf_info = parent_edges[curr]
        segments_reversed.append((prev, curr, km, surf_type, surf_info))
        curr = prev

    path = [start] + [seg[1] for seg in reversed(segments_reversed)]

    # 5. Сквозной расчет параметров для финальной карточки
    for prev, curr, km, surf_type, surf_info in reversed(segments_reversed):
        total_km += km
        total_time += km / surf_info["spd"]

        # Повторяем логику динамического поддува для точного расчета агрегированного топлива
        if surf_info["hard"]:
            current_k_load = data["configs"]["с поддувом"]["k_load"]
            air_blow_activated_segments += 1
            warnings.append(f"На участке {prev} → {curr} автоматически включен поддув!")
        else:
            current_k_load = data["configs"]["без поддува"]["k_load"]

        segment_fuel = km * base_fuel * surf_info["k_surf"] * current_k_load * k_mode
        total_fuel += segment_fuel

        if surf_info["risk"] > max_route_risk:
            max_route_risk = surf_info["risk"]

        if not surf_info["planing"]:
            warnings.append(
                f"Участок {prev} → {curr} ({surf_info['label']}): потеря глиссирования!"
            )
        if surf_info["risk"] >= 4:
            warnings.append(
                f"Участок {prev} → {curr} ({surf_info['label']}): повышенный риск ({surf_info['risk']}/7)!"
            )

    remainder_fuel = boat_cfg["tank_l"] - total_fuel
    reserve_limit = boat_cfg["tank_l"] * boat_cfg["reserve_frac_tank"]

    if remainder_fuel < 0:
        warnings.append("ВНИМАНИЕ: Недостаточно топлива для завершения маршрута!")
    elif remainder_fuel < reserve_limit:
        warnings.append(
            f"Предупреждение: Остаток топлива ниже резерва ({reserve_limit} л)."
        )

    return {
        "mode_used": mode_name,
        "boat_type_configured": config_name,
        "path": path,
        "total_km": round(total_km, 1),
        "total_time_hours": round(total_time, 2),
        "total_fuel_liters": round(total_fuel, 1),
        "remainder_fuel_liters": round(max(0.0, remainder_fuel), 1),
        "max_route_risk": max_route_risk,
        "air_blow_activation_count": air_blow_activated_segments,
        "warnings": list(set(warnings)),
    }