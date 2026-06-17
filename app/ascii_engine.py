import cv2
from PIL import Image, ImageDraw, ImageFont, ImageSequence
import numpy as np
import logging

logger = logging.getLogger("VIRGA")

ASCII_CHARS_DARK  = "@%#*+=-:. "
ASCII_CHARS_LIGHT = " .:-=+*#%@"


def resize_image(image: Image.Image, new_width: int = 100) -> Image.Image:
    """Сжимает картинку пропорционально с учётом соотношения сторон шрифта."""
    width, height = image.size
    ratio = height / width / 0.55
    new_height = int(new_width * ratio)
    return image.resize((new_width, new_height))


def grayify(image: Image.Image) -> Image.Image:
    """Переводит изображение в оттенки серого."""
    return image.convert("L")


def pixels_to_ascii(image: Image.Image, invert: bool = False) -> str:
    """Превращает пиксели в ASCII-символы."""
    # Добавляем dtype=int, чтобы избежать ошибки overflow при вычислениях
    pixels = np.array(image, dtype=int)
    chars  = ASCII_CHARS_LIGHT if invert else ASCII_CHARS_DARK
    rows   = []
    for row in pixels:
        rows.append("".join(chars[px * len(chars) // 256] for px in row))
    return "\n".join(rows)


def process_image_to_ascii(
    input_path: str,
    output_path: str,
    new_width: int = 100,
    invert: bool = False,
) -> str | None:
    """
    Конвертирует изображение в ASCII-арт.

    Возвращает строку с результатом или None при ошибке.
    Параллельно сохраняет результат в output_path.
    """
    try:
        image     = Image.open(input_path)
        image     = resize_image(image, new_width)
        image     = grayify(image)
        ascii_art = pixels_to_ascii(image, invert)

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ascii_art)

        return ascii_art          # ← строка, а не True
    except Exception as e:
        logger.error(f"Ошибка ascii_engine при обработке {input_path}: {e}")
        return None               # ← None, а не False
    
def process_video_to_ascii(input_path: str, output_path: str, new_width: int = 100, invert: bool = False) -> str | None:
    """
    Разбивает видео или GIF на кадры, переводит каждый в ASCII-картинку 
    и собирает обратно в .mp4 файл.
    """
    try:
        is_gif = input_path.lower().endswith('.gif')
        frames = []
        fps = 24.0
        
        # 1. Извлечение кадров в зависимости от типа файла
        if is_gif:
            gif = Image.open(input_path)
            # Пытаемся получить длительность кадра для расчета FPS
            duration = gif.info.get('duration', 100)
            if duration > 0:
                fps = 1000.0 / duration
            else:
                fps = 10.0
                
            # Читаем все кадры из GIF
            for frame in ImageSequence.Iterator(gif):
                frame_rgb = frame.convert("RGB")
                # Конвертируем RGB (Pillow) в BGR (OpenCV)
                frames.append(cv2.cvtColor(np.array(frame_rgb), cv2.COLOR_RGB2BGR))
        else:
            cap = cv2.VideoCapture(input_path)
            fps_cap = cap.get(cv2.CAP_PROP_FPS)
            if fps_cap and fps_cap > 0:
                fps = fps_cap
                
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frames.append(frame)
            cap.release()

        if not frames:
            return None

        # 2. Вычисление размеров по первому кадру
        first_frame_pil = Image.fromarray(cv2.cvtColor(frames[0], cv2.COLOR_BGR2RGB))
        resized_first = resize_image(first_frame_pil, new_width)
        gray_first = grayify(resized_first)
        
        font = ImageFont.load_default()
        left, top, right, bottom = font.getbbox("@")
        char_w = right - left
        char_h = bottom - top

        ascii_str = pixels_to_ascii(gray_first, invert)
        lines = ascii_str.split('\n')
        out_width = len(lines[0]) * char_w
        out_height = len(lines) * char_h

        # 3. Настройка VideoWriter для записи MP4
        # ЗАМЕНИ НА КОДЕК H.264 (avc1):
        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, fps, (out_width, out_height))

        chars = ASCII_CHARS_LIGHT if invert else ASCII_CHARS_DARK
        bg_color = "white" if invert else "black"
        text_color = "black" if invert else "white"

        # 4. Покадровый рендеринг и сборка
        for frame in frames:
            pil_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            resized = resize_image(pil_img, new_width)
            gray = grayify(resized)
            pixels = np.array(gray, dtype=int)

            rows = []
            for row in pixels:
                rows.append("".join(chars[px * len(chars) // 256] for px in row))
            
            img_frame = Image.new("RGB", (out_width, out_height), color=bg_color)
            draw = ImageDraw.Draw(img_frame)
            for i, line in enumerate(rows):
                draw.text((0, i * char_h), line, font=font, fill=text_color)

            open_cv_image = cv2.cvtColor(np.array(img_frame), cv2.COLOR_RGB2BGR)
            out.write(open_cv_image)

        out.release()
        return output_path
    except Exception as e:
        logger.error(f"Ошибка рендера видео/GIF {input_path}: {e}")
        return None