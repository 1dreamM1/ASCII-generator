import os
import uuid
import shutil
import logging
import time
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.ascii_engine import process_image_to_ascii

# ─── Логирование ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("server_logs.log", encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("VIRGA")

# ─── Приложение ─────────────────────────────────────────────────────────────
app = FastAPI(title="VIRGA ASCII Generator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Допустимые MIME-типы изображений

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
}

# Раздача готовых .txt файлов как статику
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")


# ─── Health-check ────────────────────────────────────────────────────────────
@app.get("/api/v1/health")
def health():
    """Позволяет фронту и тестировщику проверить, жив ли сервер."""
    return {"status": "ok", "service": "VIRGA ASCII Generator"}


# ─── Очистка старых файлов (фоновая задача) ──────────────────────────────────
def cleanup_old_files():
    """Удаляет файлы старше 1 часа, чтобы не переполнять диск."""
    now = time.time()
    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath) and os.stat(filepath).st_mtime < now - 3600:
                os.remove(filepath)
                logger.info(f"Удалён старый файл: {filepath}")


# ─── Главный эндпоинт конвертации ────────────────────────────────────────────
@app.post("/api/v1/convert")
async def convert_media(
    request: Request,                           # ← нужен для динамического URL
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mode: str       = Form("text"),             # text | image (image — на будущее)
    width: int      = Form(100),                # ширина арта в символах
    invert: bool    = Form(False),              # инверсия цветов
):
    logger.info(f"Запрос конвертации: файл={file.filename}, width={width}, invert={invert}")

    # ── Валидация размера ─────────────────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Размер файла не должен превышать 10 МБ.")
    await file.seek(0)

    # ── Валидация типа файла ──────────────────────────────────────────────────
    if file.content_type not in ALLOWED_MIME_TYPES:
        logger.warning(f"Недопустимый тип: {file.content_type}")
        return JSONResponse(
            status_code=400,
            content={
                "message": (
                    f"Недопустимый тип файла: «{file.content_type}». "
                    "Загружайте только изображения (JPEG, PNG, GIF, WEBP, BMP)."
                )
            },
        )

    # ── Валидация ширины ──────────────────────────────────────────────────────
    if not (10 <= width <= 500):
        logger.warning(f"Недопустимая ширина: {width}")
        return JSONResponse(
            status_code=400,
            content={"message": "Параметр width должен быть от 10 до 500."},
        )

    # ── Фоновая очистка ──────────────────────────────────────────────────────
    background_tasks.add_task(cleanup_old_files)

    # ── Генерация уникальных путей ────────────────────────────────────────────
    file_ext        = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    job_id          = str(uuid.uuid4())
    input_filepath  = os.path.join(UPLOAD_DIR, f"{job_id}_in.{file_ext}")
    output_filename = f"{job_id}_out.txt"
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)

    # ── Сохранение оригинала ──────────────────────────────────────────────────
    try:
        with open(input_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Ошибка сохранения файла: {e}")
        return JSONResponse(status_code=500, content={"message": "Ошибка сохранения файла."})

    # ── Конвертация ───────────────────────────────────────────────────────────
    try:
        ascii_art = process_image_to_ascii(input_filepath, output_filepath, new_width=width, invert=invert)
    finally:
        file.file.close()
        if os.path.exists(input_filepath):
            os.remove(input_filepath)

    if ascii_art is None:
        logger.error(f"Сбой генерации ASCII для задачи {job_id}")
        return JSONResponse(
            status_code=500,
            content={"message": "Ошибка обработки изображения. Убедитесь, что файл не повреждён."},
        )

    logger.info(f"Успешно: {output_filename}")

    # base_url берётся из реального запроса — работает на любом хосте/порту
    base_url = str(request.base_url)

    return {
        "status":     "success",
        "ascii":      ascii_art,                                   # ← текст прямо в ответе
        "result_url": f"{base_url}outputs/{output_filename}",     # ← запасной вариант (файл)
        "job_id":     job_id,
    }