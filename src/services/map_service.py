def build_graph(edges: list) -> dict:
    graph = {}
    for edge in edges:
        frm, to = edge['from'], edge['to']
        # добавляем прямое ребро
        graph.setdefault(frm, []).append((to, edge))
        # если граф неориентированный – добавляем обратное
        graph.setdefault(to, []).append((frm, {**edge, 'from': to, 'to': frm}))
    return graph