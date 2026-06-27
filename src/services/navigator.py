import heapq
from typing import Any, Dict, List, Optional


def _run_dijkstra(
        data: Dict[str, Any],
        start: str,
        finish: str,
        has_air_blow: bool,
        mode_name: str,
) -> Optional[Dict[str, Any]]:
    """Внутренняя изолированная функция Дейкстры для одного конкретного режима."""
    boat_cfg = data["boat"]
    selected_mode = data["modes"][mode_name]

    k_mode = selected_mode["k_mode"]
    base_fuel = boat_cfg["base_l_per_km"]

    # 1. Построение списков смежности графа с учетом проходимости лодки
    adj_list: Dict[str, List[tuple]] = {}
    for edge in data["map"]["edges"]:
        u, v = edge["from"], edge["to"]
        km = edge["km"]
        surf_type = edge["surface"]
        surf_info = data["surfaces"][surf_type]

        # Если участок жесткий, а у лодки физически нет поддува — ребро непроходимо
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

    # 3. Основной цикл обхода
    while queue:
        current_cost, u = heapq.heappop(queue)

        if current_cost > min_costs.get(u, float("inf")):
            continue

        if u == finish:
            break

        for v, km, surf_type, surf_info in adj_list.get(u, []):
            # Динамический расчет k_load для текущего ребра
            if surf_info["hard"]:
                current_k_load = data["configs"]["с поддувом"]["k_load"]
            else:
                current_k_load = data["configs"]["без поддува"]["k_load"]

            # Вычисление веса (стоимости) ребра под выбранный критерий
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

    # 4. Восстановление пути от финиша к старту
    curr = finish
    segments_reversed = []
    while parent_edges[curr] is not None:
        prev, km, surf_type, surf_info = parent_edges[curr]
        segments_reversed.append((prev, curr, km, surf_type, surf_info))
        curr = prev

    # Формируем массив вершин в правильном порядке
    path = [start] + [seg[1] for seg in reversed(segments_reversed)]

    # 5. Сбор сквозных физических метрик по найденному пути
    total_km = 0.0
    total_time = 0.0
    total_fuel = 0.0
    max_route_risk = 0
    air_blow_activated_segments = 0
    warnings = []

    for prev, curr, km, surf_type, surf_info in reversed(segments_reversed):
        total_km += km
        total_time += km / surf_info["spd"]

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
            f"Предупреждение: Остаток топлива ниже резерва ({reserve_limit:.1f} л)."
        )

    # Строгое округление согласно регламенту Кубка Енисея
    return {
        "route_str": " → ".join(path),
        "path": path,
        "total_km": round(total_km, 1),
        "time_h": round(total_time, 2),
        "fuel_l": round(total_fuel, 1),
        "remainder_l": round(max(0.0, remainder_fuel), 1),
        "max_risk": int(max_route_risk),
        "air_blow_count": air_blow_activated_segments,
        "warnings": list(set(warnings)),
    }


def calculate_all_modes(
        data: Dict[str, Any],
        start: str,
        finish: str,
        config_name: str,
) -> Dict[str, Any]:
    """Публичная функция штурмана.

    Рассчитывает сразу 4 оптимальных маршрута (по одному на каждый режим)
    для заданной конфигурации лодки ('без поддува' или 'с поддувом').
    """
    selected_config = data["configs"].get(config_name)
    if not selected_config:
        raise ValueError(f"Некорректная конфигурация лодки: {config_name}")

    has_air_blow = selected_config["allow_hard"]
    modes_to_calculate = ["быстрый", "экономичный", "кратчайший", "безопасный"]

    routes_output = {}

    for mode in modes_to_calculate:
        route_result = _run_dijkstra(data, start, finish, has_air_blow, mode)
        # Если путь между точками принципиально не найден (например, изолирован)
        if route_result is None:
            routes_output[mode] = {
                "error": "Маршрут недоступен для текущей конфигурации лодки",
                "path": [],
                "total_km": 0.0,
                "time_h": 0.0,
                "fuel_l": 0.0,
                "remainder_l": 0.0,
                "max_risk": 0,
                "warnings": ["Путь заблокирован препятствиями!"]
            }
        else:
            routes_output[mode] = route_result

    return {
        "start": start,
        "finish": finish,
        "boat_config": config_name,
        "modes": routes_output
    }