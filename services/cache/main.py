from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.cache import router as cache_router

app = FastAPI(title="Forge Cache Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cache_router, tags=["cache"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "cache"}


if __name__ == "__main__":
    import uvicorn
    from config import settings

    uvicorn.run(app, host=settings.cache_host, port=settings.cache_port)
