from PIL import Image
import numpy as np
import logging

logger = logging.getLogger("VIRGA")

# Палитры символов: для темной и светлой темы
ASCII_CHARS_DARK = "@%#*+=-:. "
ASCII_CHARS_LIGHT = " .:-=+*#%@"

def resize_image(image, new_width=100):
    """Сжимает картинку пропорционально с учетом высоты шрифта"""
    width, height = image.size
    ratio = height / width / 0.55
    new_height = int(new_width * ratio)
    return image.resize((new_width, new_height))

def grayify(image):
    """Переводит картинку в черно-белые цвета (Grayscale)"""
    return image.convert("L")

def pixels_to_ascii(image, invert=False):
    """Превращает пиксели в символы"""
    pixels = np.array(image)
    ascii_str = ""
    # Выбор палитры в зависимости от инверсии
    chars = ASCII_CHARS_LIGHT if invert else ASCII_CHARS_DARK
    
    for row in pixels:
        for pixel in row:
            ascii_str += chars[pixel * len(chars) // 256]
        ascii_str += "\n"
    return ascii_str

def process_image_to_ascii(input_path, output_path, new_width=100, invert=False):
    """Основная функция обработки"""
    try:
        image = Image.open(input_path)
        image = resize_image(image, new_width)
        image = grayify(image)
        ascii_art = pixels_to_ascii(image, invert)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(ascii_art)
            
        return True
    except Exception as e:
        logger.error(f"Ошибка в ascii_engine при обработке {input_path}: {e}")
        return False
