from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, sessions, execute, cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Forge API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
app.include_router(execute.router, prefix="/execute", tags=["execute"])
app.include_router(cache.router, prefix="/cache", tags=["cache"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "api"}


if __name__ == "__main__":
    import uvicorn
    from config import settings

    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
