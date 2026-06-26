from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

templates = Jinja2Templates(directory="src/presentation/static")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Biryusa",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    app.mount("/static", StaticFiles(directory="src/presentation/static"), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def home(request: Request):
        template = templates.env.get_template("index.html")
        content = template.render({"request": request})
        return HTMLResponse(content)

    return app

app = create_app()