'use client'

import { useRef, useState, useEffect } from 'react';

type Pixel = {
  size: number;
  color: string;
  x: number;
  y: number;
};

export default function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [prevPos, setPrevPos] = useState<{x: number, y: number} | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Инициализация WebSocket и canvas
  useEffect(() => {
    // Подключаемся к WebSocket
    const ws = new WebSocket('ws://26.57.252.134:1323/ws/drawing');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const receivedPixels: Pixel[] = JSON.parse(event.data);
      drawPixels(receivedPixels);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    };

    // Инициализация canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);

    return () => {
      ws.close();
    };
  }, []);

  const drawPixels = (pixels: Pixel[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Оптимизация: группируем пиксели по цвету и размеру
    const groupedPixels: Record<string, Pixel[]> = {};
    
    pixels.forEach(pixel => {
      const key = `${pixel.color}-${pixel.size}`;
      if (!groupedPixels[key]) {
        groupedPixels[key] = [];
      }
      groupedPixels[key].push(pixel);
    });

    // Рисуем сгруппированные пиксели
    Object.entries(groupedPixels).forEach(([key, pixels]) => {
      const [color, sizeStr] = key.split('-');
      const size = parseInt(sizeStr);
      
      context.strokeStyle = color;
      context.lineWidth = size;
      context.fillStyle = color;

      // Рисуем линии между последовательными точками
      context.beginPath();
      context.moveTo(pixels[0].x, pixels[0].y);
      
      for (let i = 1; i < pixels.length; i++) {
        context.lineTo(pixels[i].x, pixels[i].y);
      }
      
      context.stroke();

      // Рисуем круги в каждой точке для более плавного вида
      pixels.forEach(pixel => {
        context.beginPath();
        context.arc(pixel.x, pixel.y, size/2, 0, Math.PI * 2);
        context.fill();
      });
    });
  };

  const getIntermediatePixels = (start: {x: number, y: number}, end: {x: number, y: number}): Pixel[] => {
    const pixels: Pixel[] = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(distance / (brushSize / 3))); // Более частые точки

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      const x = Math.round(start.x + dx * t);
      const y = Math.round(start.y + dy * t);
      pixels.push({ size: brushSize, color: brushColor, x, y });
    }

    return pixels;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setPrevPos({ x, y });

    // Создаем и отправляем первый пиксель
    const pixel = { size: brushSize, color: brushColor, x, y };
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify([pixel]));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !prevPos) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Получаем все промежуточные пиксели
    const pixels = getIntermediatePixels(prevPos, {x: currentX, y: currentY});

    // Рисуем на локальном холсте
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    context.beginPath();
    context.moveTo(prevPos.x, prevPos.y);
    context.lineTo(currentX, currentY);
    context.stroke();

    // Рисуем круги в каждой точке для более плавного вида
    pixels.forEach(pixel => {
      context.beginPath();
      context.arc(pixel.x, pixel.y, pixel.size/2, 0, Math.PI * 2);
      context.fillStyle = pixel.color;
      context.fill();
    });

    // Отправляем пиксели на сервер
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(pixels));
    }

    setPrevPos({ x: currentX, y: currentY });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setPrevPos(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4 flex gap-4 items-center">
        <div>
          <label htmlFor="brush-size" className="block mb-1">Размер кисти:</label>
          <input
            id="brush-size"
            type="range"
            min="1"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="ml-2">{brushSize}px</span>
        </div>
        
        <div>
          <label htmlFor="brush-color" className="block mb-1">Цвет:</label>
          <input
            id="brush-color"
            type="color"
            value={brushColor}
            onChange={(e) => setBrushColor(e.target.value)}
            className="h-10 w-10"
          />
        </div>
        
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Очистить
        </button>
        
        <div className={`px-3 py-1 rounded ${isConnected ? 'bg-green-200' : 'bg-red-200'}`}>
          {isConnected ? 'Подключено' : 'Отключено'}
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="border border-gray-300 bg-white shadow-md"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}