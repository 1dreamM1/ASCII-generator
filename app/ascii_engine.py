from PIL import Image
import numpy as np
import logging

logger = logging.getLogger("VIRGA")

# Палитры символов: для тёмной и светлой темы
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
    pixels = np.array(image)
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