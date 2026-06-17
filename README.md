# VIRGA - Генератор ASCII-артов

Проект представляет собой веб-приложение для конвертации изображений в текстовые ASCII-арты. 

## Стек технологий
* **Бэкенд:** Python, FastAPI, Uvicorn, Pillow, NumPy.
* **Фронтенд:** Vite, React, TailwindCSS, HTML/JS.
* **Архитектура:** Stateless API (без использования базы данных), обмен данными через REST API. История генераций сохраняется локально в браузере пользователя.

## Структура проекта
```text
ASCII-generator/
├── app/                  # Исходный код бэкенда (FastAPI)
│   ├── main.py           # Точка входа, эндпоинты API
│   └── ascii_engine.py   # Ядро конвертации пикселей в символы
├── frontend/             # Исходный код интерфейса (Node.js/Vite)
├── uploads/              # Временное хранение оригиналов (Git ignored)
├── outputs/              # Временное хранение ASCII-результатов (Git ignored)
├── .gitignore            # Исключения для Git
└── requirements.txt      # Зависимости Python


## Backend fixes
- File size limit: 10 MB
- Automatic cleanup of uploaded originals after conversion
- Fixed CORS configuration
- Improved resource cleanup
