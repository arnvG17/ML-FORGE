from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.execute import router as execute_router

app = FastAPI(title="Forge Sandbox Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(execute_router, prefix="/execute", tags=["execute"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sandbox"}


if __name__ == "__main__":
    import uvicorn
    from config import settings

    uvicorn.run(app, host=settings.sandbox_host, port=settings.sandbox_port)
