import os
import uuid
import shutil
import logging
import time
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.ascii_engine import process_image_to_ascii

# 1. Настройка системы логирования (запись в консоль и в файл server_logs.log)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("server_logs.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("VIRGA")

app = FastAPI(title="VIRGA ASCII Generator API")

# 2. Настройка CORS для работы с фронтендом
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Раздача готовых файлов
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

# 3. Функция очистки мусора (Костыль MVP)
def cleanup_old_files():
    """Удаляет файлы старше 1 часа, чтобы не переполнять диск"""
    now = time.time()
    for directory in [UPLOAD_DIR, OUTPUT_DIR]:
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath):
                # Если файл старше 3600 секунд (1 час)
                if os.stat(filepath).st_mtime < now - 3600:
                    os.remove(filepath)
                    logger.info(f"Удален старый файл: {filepath}")

# 4. Главный эндпоинт конвертации
@app.post("/api/v1/convert")
async def convert_media(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    mode: str = Form("text"),         # Режим: text или image (на будущее)
    width: int = Form(100),           # Ширина арта
    invert: bool = Form(False)        # Инверсия цветов
):
    logger.info(f"Запрос конвертации: файл={file.filename}, width={width}, invert={invert}")
    
    # Запускаем очистку старых файлов в фоновом режиме (не блокирует ответ пользователю)
    background_tasks.add_task(cleanup_old_files)
    
    file_ext = file.filename.split('.')[-1]
    job_id = str(uuid.uuid4())
    
    input_filepath = os.path.join(UPLOAD_DIR, f"{job_id}_in.{file_ext}")
    output_filename = f"{job_id}_out.txt"
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)
    
    # Сохранение оригинала
    try:
        with open(input_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Ошибка сохранения файла на диск: {e}")
        return JSONResponse(status_code=500, content={"message": "Ошибка сохранения файла"})
        
    # Конвертация с учетом параметров
    success = process_image_to_ascii(input_filepath, output_filepath, new_width=width, invert=invert)
    
    if not success:
        logger.error(f"Сбой генерации ASCII для задачи {job_id}")
        return JSONResponse(status_code=500, content={"message": "Ошибка обработки изображения"})
        
    logger.info(f"Успешно сконвертирован: {output_filename}")
    
    return {
        "status": "success",
        "result_url": f"http://localhost:8000/outputs/{output_filename}"
    }
