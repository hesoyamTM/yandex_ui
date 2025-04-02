"use client"; // Указываем, что это клиентский компонент

import React, { useRef, useState, useCallback, useEffect } from "react";

const CanvasDraw = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null); // Основной canvas
  const [isDrawing, setIsDrawing] = useState(false); // Состояние рисования
  const [brushRadius, setBrushRadius] = useState(10); // Радиус кисти (толщина линии)
  const [brushColor, setBrushColor] = useState("#000000"); // Цвет кисти
  const [lastPosition, setLastPosition] = useState<{ x: number; y: number } | null>(null); // Последняя позиция мыши
  const [history, setHistory] = useState<ImageData[]>([]); // История изменений canvas
  const [historyIndex, setHistoryIndex] = useState(-1); // Индекс текущего состояния в истории

  // Сохранение текущего состояния canvas в историю
  const saveStateToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Сохраняем текущее состояние canvas как ImageData
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1); // Удаляем всё после текущего индекса
    newHistory.push(imageData); // Добавляем новое состояние в историю
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1); // Обновляем индекс текущего состояния
  }, [history, historyIndex]);

  // Отмена последнего действия (Ctrl + Z)
  const undo = useCallback(() => {
    if (historyIndex <= 0) return; // Нельзя отменить, если история пуста

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    // Восстанавливаем предыдущее состояние из истории
    const previousState = history[historyIndex - 1];
    context.putImageData(previousState, 0, 0);

    setHistoryIndex((prev) => prev - 1); // Уменьшаем индекс текущего состояния
  }, [history, historyIndex]);

  // Обработка нажатия клавиш (Ctrl + Z)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        event.preventDefault(); // Предотвращаем стандартное поведение браузера
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  // Начало рисования
  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = event.nativeEvent;
    setIsDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });

    // Сохраняем состояние canvas перед началом рисования
    saveStateToHistory();
  };

  // Рисование
  const draw = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !lastPosition) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const { offsetX, offsetY } = event.nativeEvent;

      // Настройка стиля линии
      context.strokeStyle = brushColor;
      context.lineWidth = brushRadius * 2; // Толщина линии равна диаметру круга
      context.lineCap = "round"; // Закруглённые края линии
      context.lineJoin = "round"; // Закруглённые углы соединения линий

      // Рисуем линию между последней и текущей позицией
      context.beginPath();
      context.moveTo(lastPosition.x, lastPosition.y); // Начало линии
      context.lineTo(offsetX, offsetY); // Конец линии
      context.stroke(); // Рисуем линию

      // Обновляем последнюю позицию
      setLastPosition({ x: offsetX, y: offsetY });
      console.log('drawing')
    },
    [isDrawing, lastPosition, brushColor, brushRadius]
  );

  // Завершение рисования
  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPosition(null);

    // Сохраняем состояние canvas после завершения рисования
    saveStateToHistory();
  };

  // Очистка canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    // Очищаем историю
    setHistory([]);
    setHistoryIndex(-1);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{ border: "1px solid black" }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
      <div style={{ marginTop: "10px" }}>
        <label>
          Толщина кисти:
          <input
            type="number"
            value={brushRadius}
            onChange={(e) => setBrushRadius(Number(e.target.value))}
            min="1"
            max="100"
          />
        </label>
        <label style={{ marginLeft: "10px" }}>
          Цвет кисти:
          <input
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
          />
        </label>
        <button onClick={clearCanvas} style={{ marginLeft: "10px" }}>
          Очистить
        </button>
        <button onClick={undo} style={{ marginLeft: "10px" }} disabled={historyIndex <= 0}>
          Отменить (Ctrl + Z)
        </button>
      </div>
    </div>
  );
};

export default CanvasDraw;