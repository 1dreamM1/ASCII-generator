import os
import uuid
import shutil
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="VIRGA ASCII Generator API")

# Папки для хранения файлов
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
FRONTEND_DIR = "frontend"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FRONTEND_DIR, exist_ok=True)

# Заглушка базовой навигации: раздача интерфейса
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

@app.get("/")
async def read_index():
    """Отдача главной страницы интерфейса"""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Поместите верстку в папку frontend"}

@app.post("/api/v1/convert")
async def convert_media(file: UploadFile = File(...), mode: str = Form("text")):
    """Заглушка конвертера с использованием UUID (без БД)"""
    file_ext = file.filename.split('.')[-1]
    job_id = str(uuid.uuid4())
    
    input_filename = f"{job_id}_in.{file_ext}"
    input_filepath = os.path.join(UPLOAD_DIR, input_filename)
    
    # Сохраняем оригинал
    with open(input_filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Заглушка генерации результата
    output_filename = f"{job_id}_out.txt"
    output_filepath = os.path.join(OUTPUT_DIR, output_filename)
    
    with open(output_filepath, "w") as f:
        f.write("Тут будет ASCII-art генерация файла " + file.filename)
        
    return {
        "status": "success",
        "result_url": f"/outputs/{output_filename}"
    }
