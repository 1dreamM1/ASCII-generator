import os
import uuid
import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.ascii_engine import process_image_to_ascii  # Импортируем наше ядро

app = FastAPI(title="VIRGA ASCII Generator API")

# Настройка CORS (КРИТИЧЕСКИ ВАЖНО для работы с фронтендом)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем запросы с любых портов (от Vite)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Раздаем папку с готовыми результатами
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

@app.post("/api/v1/convert")
async def convert_media(file: UploadFile = File(...), mode: str = Form("text")):
    # 1. Генерируем уникальные имена
    file_ext = file.filename.split('.')[-1]
    job_id = str(uuid.uuid4())
    
    input_filename = f"{job_id}_in.{file_ext}"
    input_filepath = os.path.join(UPLOAD_DIR, input_filename)
    
    # 2. Сохраняем оригинальную картинку
    with open(input_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 3. Запускаем реальную генерацию ASCII
    output_filename = f"{job_id}_out.txt"
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)
    
    success = process_image_to_ascii(input_filepath, output_filepath)
    
    if not success:
        return JSONResponse(status_code=500, content={"message": "Ошибка обработки изображения"})
        
    # 4. Отдаем ссылку на результат. 
    # Включаем полный путь с localhost:8000, чтобы фронтенду было проще скачать файл
    return {
        "status": "success",
        "result_url": f"http://localhost:8000/outputs/{output_filename}"
    }
