from typing import List, Tuple, Optional
import heapq
from src.domain.route import Route


class RoutingService:
    def __init__(self, graph, surfaces, node_coords=None):
        self.graph = graph
        self.surfaces = surfaces
        self.node_coords = node_coords
        self.weight_calculator = WeightCalculator(surfaces)  # ваш класс

    def find_path(self, start: str, goal: str, mode: dict, boat_config) -> Optional[Route]:
        # подготовка функций
        def weight_func(edge):
            return self.weight_calculator.compute_edge_cost(edge, mode, boat_config)

        # эвристика – для простоты пусть будет 0 (Дейкстра)
        # если есть координаты, можно реализовать более точную
        def heuristic(node, goal):
            if self.node_coords is None:
                return 0.0
            # здесь вычисляем евклидово расстояние / макс. скорость
            # ...
            return 0.0  # заглушка

        path_nodes = a_star(start, goal, self.graph, weight_func, heuristic)
        if path_nodes is None:
            return None

        # преобразуем путь в объект Route (с метриками) через AnalysisService
        # ...


def a_star(
    start: str,
    goal: str,
    graph: Dict[str, List[Tuple[str, dict]]],
    weight_func,               # функция cost = weight_func(edge, mode, boat_config)
    heuristic_func,            # функция h(node, goal) -> float
) -> Optional[List[str]]:
    """
    Возвращает список узлов от start до goal включительно или None, если путь не найден.
    """
    # Инициализация
    open_set = []
    heapq.heappush(open_set, (0.0, start))
    
    came_from: Dict[str, Optional[str]] = {}
    g_score: Dict[str, float] = {start: 0.0}
    f_score: Dict[str, float] = {start: heuristic_func(start, goal)}
    
    closed_set = set()
    
    while open_set:
        current_f, current = heapq.heappop(open_set)
        
        if current == goal:
            # восстановление пути
            path = []
            while current is not None:
                path.append(current)
                current = came_from.get(current)
            path.reverse()
            return path
        
        if current in closed_set:
            continue
        closed_set.add(current)
        
        # Обход соседей
        for neighbor, edge_data in graph.get(current, []):
            if neighbor in closed_set:
                continue
            
            # стоимость перехода по ребру
            edge_cost = weight_func(edge_data)
            if edge_cost == float('inf'):
                continue  # ребро непроходимо
            
            tentative_g = g_score[current] + edge_cost
            
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                h = heuristic_func(neighbor, goal)
                f = tentative_g + h
                f_score[neighbor] = f
                heapq.heappush(open_set, (f, neighbor))
    
    return None  # путь не найден