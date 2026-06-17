from PIL import Image
import numpy as np

# Палитра символов от темного к светлому
ASCII_CHARS = "@%#*+=-:. "

def resize_image(image, new_width=100):
    """Сжимает картинку пропорционально с учетом высоты шрифта"""
    width, height = image.size
    # Коэффициент 0.55 компенсирует то, что высота символа в тексте больше его ширины
    ratio = height / width / 0.55
    new_height = int(new_width * ratio)
    return image.resize((new_width, new_height))

def grayify(image):
    """Переводит картинку в черно-белые цвета"""
    return image.convert("L")

def pixels_to_ascii(image):
    """Каждому пикселю присваивает символ в зависимости от его яркости"""
    pixels = np.array(image)
    ascii_str = ""
    for row in pixels:
        for pixel in row:
            # Превращаем значение 0-255 в индекс массива символов
            ascii_str += ASCII_CHARS[pixel * len(ASCII_CHARS) // 256]
        ascii_str += "\n"
    return ascii_str

def process_image_to_ascii(input_path, output_path, new_width=100):
    """Главная функция обработки: открывает, конвертирует и сохраняет в txt"""
    try:
        image = Image.open(input_path)
    except Exception as e:
        print(f"Ошибка открытия файла: {e}")
        return False
    
    # 3 этапа конвертации
    image = resize_image(image, new_width)
    image = grayify(image)
    ascii_art = pixels_to_ascii(image)
    
    # Сохраняем результат
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(ascii_art)
        
    return True
