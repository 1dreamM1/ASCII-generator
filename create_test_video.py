import cv2
import numpy as np

# Параметры видео
width, height = 320, 240
fps = 30
duration_sec = 5
frames_count = fps * duration_sec

# Создаём писатель видео
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('test_video.mp4', fourcc, fps, (width, height))

# Генерируем кадры
for i in range(frames_count):
    # Создаём простой кадр с градиентом и текстом
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Градиент от тёмного к светлому
    progress = i / frames_count
    color_value = int(255 * progress)
    frame[:, :] = [color_value // 3, color_value // 2, color_value]
    
    # Добавляем белый прямоугольник, который движется
    x = int((i / frames_count) * (width - 50))
    cv2.rectangle(frame, (x, height // 2 - 25), (x + 50, height // 2 + 25), (255, 255, 255), -1)
    
    # Добавляем текст
    cv2.putText(frame, f'Frame {i+1}', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    
    out.write(frame)

out.release()
print(f"Test video created: test_video.mp4 ({frames_count} frames, {width}x{height}, {fps}fps)")
