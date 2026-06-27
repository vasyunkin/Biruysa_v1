import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Импортируем наш штурманский алгоритм
from src.services.navigator import calculate_all_modes

router = APIRouter(prefix="/api/route", tags=["Navigator"])


# Описываем Pydantic-модель для валидации входящего запроса от JS
class RouteRequest(BaseModel):
    start: str
    finish: str
    config_name: str  # Принимает "без поддува" или "с поддувом"


def _load_scenario_data() -> dict:
    """Умный загрузчик data.json.

    Ищет файл в корне проекта относительно текущего файла.
    """
    # Корневая папка проекта (поднимаемся на 3 уровня вверх от этого файла)
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    data_path = root_dir / "data.json"

    if not data_path.exists():
        # Резервный поиск, если структура папок изменилась во время хакатона
        data_path = Path("data.json").resolve()

    if not data_path.exists():
        raise HTTPException(
            status_code=500, detail=f"Критическая ошибка: Файл data.json не найден по пути {data_path}"
        )

    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post("/calculate")
async def calculate_route(payload: RouteRequest):
    try:
        # Загружаем JSON-конфигурации сценария
        data = _load_scenario_data()

        # Вызываем алгоритм, который вернет словарь сразу со всеми 4-мя режимами
        result = calculate_all_modes(
            data=data,
            start=payload.start,
            finish=payload.finish,
            config_name=payload.config_name,
        )
        return result

    except ValueError as val_err:
        # Если переданы неверные параметры конфигурации или точек
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        # На случай непредвиденных исключений во время хакатона
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")