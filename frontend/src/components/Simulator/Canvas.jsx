import { useState, useRef, useCallback, useMemo } from 'react';
import { PARTS } from './parts';

const WIRE_COLORS = [
  { name: 'Красный', value: '#ef4444' },
  { name: 'Зелёный', value: '#22c55e' },
  { name: 'Синий', value: '#3b82f6' },
  { name: 'Жёлтый', value: '#eab308' },
  { name: 'Оранжевый', value: '#f97316' },
  { name: 'Фиолетовый', value: '#a855f7' },
  { name: 'Белый', value: '#f3f4f6' },
  { name: 'Чёрный', value: '#1f2937' },
  { name: 'Коричневый', value: '#92400e' },
  { name: 'Серый', value: '#9ca3af' }
];

export default function Canvas({ parts, setParts, wires, setWires, selectedId, setSelectedId }) {
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [wireColor, setWireColor] = useState('#ef4444');
  const [selectedWireIdx, setSelectedWireIdx] = useState(null);
  const [hoverPin, setHoverPin] = useState(null);
  
  const svgRef = useRef();
  const rafRef = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const getPos = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Оптимизированный обработчик движения мыши с requestAnimationFrame
  const onMove = useCallback((e) => {
    const pos = getPos(e);
    lastMouseRef.current = pos;
    
    // Обновляем позицию мыши без re-render (для провода)
    if (connecting) {
      setMouse(pos);
    }
    
    // Drag компонента — используем RAF для батчинга
    if (dragging) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const { x, y } = lastMouseRef.current;
        setParts(prev => prev.map(p =>
          p.id === dragging.id ? { ...p, x: x - dragging.ox, y: y - dragging.oy } : p
        ));
      });
    }
  }, [dragging, connecting, getPos, setParts]);

  const onPinClick = useCallback((e, partId, pin) => {
    e.stopPropagation();
    if (!connecting) {
      setConnecting({ partId, pin });
    } else {
      if (connecting.partId !== partId) {
        setWires(prev => [...prev, { 
          from: connecting, 
          to: { partId, pin },
          color: wireColor
        }]);
      }
      setConnecting(null);
    }
  }, [connecting, wireColor, setWires]);

  const onWireClick = useCallback((e, idx) => {
    e.stopPropagation();
    setSelectedWireIdx(idx);
    setSelectedId(null);
  }, [setSelectedId]);

  const deleteSelectedWire = useCallback(() => {
    if (selectedWireIdx === null) return;
    setWires(prev => prev.filter((_, i) => i !== selectedWireIdx));
    setSelectedWireIdx(null);
  }, [selectedWireIdx, setWires]);

  const recolorSelectedWire = useCallback((color) => {
    if (selectedWireIdx === null) return;
    setWires(prev => prev.map((w, i) => i === selectedWireIdx ? { ...w, color } : w));
  }, [selectedWireIdx, setWires]);

  const addPart = useCallback((type) => {
    const def = PARTS[type];
    const newPart = {
      id: Date.now() + Math.random(),
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      state: def.state ? { ...def.state } : {}
    };
    setParts(prev => [...prev, newPart]);
  }, [setParts]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setParts(prev => prev.filter(p => p.id !== selectedId));
    setWires(prev => prev.filter(w => w.from.partId !== selectedId && w.to.partId !== selectedId));
    setSelectedId(null);
  }, [selectedId, setParts, setWires, setSelectedId]);

  const clearAll = useCallback(() => {
    setParts([]);
    setWires([]);
    setSelectedId(null);
    setSelectedWireIdx(null);
  }, [setParts, setWires, setSelectedId]);

  const getPinPos = useCallback((part, pin, index, total) => {
    const def = PARTS[part.type];
    return {
      x: part.x + (index + 1) * def.w / (total + 1),
      y: part.y + def.h
    };
  }, []);

  // Мемоизация списка компонентов
  const partsList = useMemo(() => Object.entries(PARTS), []);

  // Очистка RAF при размонтировании
const handleMouseUp = useCallback(() => {
  // Если было перетаскивание — снимаем выделение, чтобы рамка исчезла
  if (dragging) {
    setSelectedId(null);
  }
  setDragging(null);
  if (rafRef.current) {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }
}, [dragging, setSelectedId]);


  return (
    <div className="flex h-full">
      {/* Палитра компонентов */}
      <div className="w-56 bg-slate-800 p-2 overflow-y-auto border-r border-slate-700 flex flex-col">
        <h3 className="font-bold mb-2 text-sm">Компоненты</h3>
        <div className="flex-1 overflow-y-auto">
          {partsList.map(([k, v]) => (
            <button key={k} onClick={() => addPart(k)}
              className="w-full text-left p-2 mb-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
              {v.name}
            </button>
          ))}
        </div>

        {/* Палитра цветов */}
        <div className="mt-3 pt-3 border-t border-slate-700">
          <h3 className="font-bold mb-2 text-sm">Цвет провода</h3>
          <div className="grid grid-cols-5 gap-1">
            {WIRE_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setWireColor(c.value)}
                title={c.name}
                className={`w-8 h-8 rounded border-2 transition-all ${
                  wireColor === c.value ? 'border-white scale-110' : 'border-slate-600'
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs text-slate-400">Свой:</label>
            <input
              type="color"
              value={wireColor}
              onChange={e => setWireColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent"
            />
            <div className="flex-1 h-4 rounded" style={{ backgroundColor: wireColor }}/>
          </div>
        </div>

        {/* Действия */}
        <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
          <button onClick={() => setWires([])}
            className="w-full p-2 bg-orange-700 hover:bg-orange-600 rounded text-xs">
            Удалить все провода
          </button>
          {selectedWireIdx !== null && (
            <>
              <button onClick={deleteSelectedWire}
                className="w-full p-2 bg-red-700 hover:bg-red-600 rounded text-xs">
                Удалить выбранный провод
              </button>
              <div className="text-xs text-slate-400 mt-1">Перекрасить:</div>
              <div className="grid grid-cols-5 gap-1">
                {WIRE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => recolorSelectedWire(c.value)}
                    className="w-6 h-6 rounded border border-slate-600"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </>
          )}
          <button onClick={deleteSelected} disabled={!selectedId}
            className="w-full p-2 bg-red-700 hover:bg-red-600 rounded text-xs disabled:opacity-40">
            Удалить компонент
          </button>
          <button onClick={clearAll}
            className="w-full p-2 bg-slate-600 hover:bg-slate-500 rounded text-xs">
            Очистить всё
          </button>
        </div>
      </div>

      {/* SVG холст */}
      <svg 
        ref={svgRef} 
        className="flex-1 bg-slate-950 cursor-crosshair"
        onMouseMove={onMove} 
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => { setSelectedId(null); setSelectedWireIdx(null); setConnecting(null); }}
      >
        {/* Провода */}
        {wires.map((w, i) => {
          const a = parts.find(p => p.id === w.from.partId);
          const b = parts.find(p => p.id === w.to.partId);
          if (!a || !b) return null;
          const da = PARTS[a.type], db = PARTS[b.type];
          const allPinsA = Object.values(da.pins || {}).flat();
          const allPinsB = Object.values(db.pins || {}).flat();
          const iA = allPinsA.indexOf(w.from.pin);
          const iB = allPinsB.indexOf(w.to.pin);
          const pa = getPinPos(a, w.from.pin, iA >= 0 ? iA : 0, allPinsA.length);
          const pb = getPinPos(b, w.to.pin, iB >= 0 ? iB : 0, allPinsB.length);
          const isSelected = i === selectedWireIdx;
          
          const midY = (pa.y + pb.y) / 2 + 30;
          const path = `M ${pa.x} ${pa.y} C ${pa.x} ${midY}, ${pb.x} ${midY}, ${pb.x} ${pb.y}`;
          
          return (
            <g key={i}>
              <path d={path} fill="none" stroke="transparent" strokeWidth="12"
                onClick={(e) => onWireClick(e, i)} style={{ cursor: 'pointer' }}/>
              <path d={path} fill="none" stroke={w.color || '#0f0'}
                strokeWidth={isSelected ? 4 : 2.5} opacity={isSelected ? 1 : 0.85} strokeLinecap="round"/>
              {isSelected && (
                <path d={path} fill="none" stroke="#fff" strokeWidth="1"
                  strokeDasharray="4,4" opacity="0.6" pointerEvents="none"/>
              )}
            </g>
          );
        })}

        {/* Активный провод */}
        {connecting && (() => {
          const a = parts.find(p => p.id === connecting.partId);
          if (!a) return null;
          const da = PARTS[a.type];
          const allPins = Object.values(da.pins || {}).flat();
          const iA = allPins.indexOf(connecting.pin);
          const pa = getPinPos(a, connecting.pin, iA >= 0 ? iA : 0, allPins.length);
          return <line x1={pa.x} y1={pa.y} x2={mouse.x} y2={mouse.y}
            stroke={wireColor} strokeWidth="2.5" strokeDasharray="4" opacity="0.7"/>;
        })()}

        {/* Компоненты */}
        {parts.map(p => {
          const def = PARTS[p.type];
          const allPins = Object.values(def.pins || {}).flat();
          const isSelected = p.id === selectedId;
          return (
            <g key={p.id}
             onMouseDown={(e) => {
  e.stopPropagation();
  setSelectedId(p.id);
  setSelectedWireIdx(null);
  const pos = getPos(e);
  setDragging({ 
    id: p.id, 
    ox: pos.x - p.x, 
    oy: pos.y - p.y,
    startX: pos.x,  // ← добавлено
    startY: pos.y   // ← добавлено
  });
}}   >
              {isSelected && (
                <rect x={p.x - 3} y={p.y - 3} width={def.w + 6} height={def.h + 6}
                  fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4"/>
              )}
              <g dangerouslySetInnerHTML={{ __html: def.svg(p.x, p.y, p.state) }}/>
              {allPins.map((pin, i) => {
                const pos = getPinPos(p, pin, i, allPins.length);
                const isActive = connecting && connecting.partId === p.id && connecting.pin === pin;
                const isHover = hoverPin?.partId === p.id && hoverPin?.pin === pin;
                const labelAbove = p.type === 'arduino_uno';
                const labelY = labelAbove ? pos.y - 10 : pos.y + 14;
                
                return (
                  <g key={pin + i}>
                    <text x={pos.x} y={labelY} textAnchor="middle" fontSize="8"
                      fontFamily="monospace"
                      fill={isActive ? wireColor : (isHover ? '#fff' : '#94a3b8')}
                      fontWeight={isActive || isHover ? 'bold' : 'normal'}
                      pointerEvents="none">
                      {pin}
                    </text>
                    <circle cx={pos.x} cy={pos.y} r="7" fill="transparent"
                      onClick={(e) => onPinClick(e, p.id, pin)}
                      onMouseEnter={() => setHoverPin({ partId: p.id, pin })}
                      onMouseLeave={() => setHoverPin(null)}
                      style={{ cursor: 'pointer' }}/>
                    <circle cx={pos.x} cy={pos.y} r={isHover ? 5 : 4}
                      fill={isActive ? wireColor : (isHover ? '#fbbf24' : '#f97316')}
                      stroke="#000" strokeWidth="1" pointerEvents="none"/>
                    {isActive && (
                      <circle cx={pos.x} cy={pos.y} r="8" fill="none"
                        stroke={wireColor} strokeWidth="2" opacity="0.6" pointerEvents="none"/>
                    )}
                  </g>
                );
              })}
              <text x={p.x} y={p.y - 5} fill="#aaa" fontSize="10">{def.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}