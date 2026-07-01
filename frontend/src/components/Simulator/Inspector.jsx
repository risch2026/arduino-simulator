export default function Inspector({ part, onChange }) {
  if (!part) return <div className="p-4 text-slate-400 text-sm">Выберите компонент для настройки</div>;

  const update = (key, value) => {
    onChange({ ...part, state: { ...part.state, [key]: value } });
  };

  const fields = {
    led: [{ key: 'color', label: 'Цвет', type: 'color' }],
    resistor: [{ key: 'ohm', label: 'Сопротивление (Ом)', min: 1, max: 10000 }],
    dht11: [
      { key: 'temp', label: 'Температура (°C)', min: -10, max: 50 },
      { key: 'humidity', label: 'Влажность (%)', min: 20, max: 90 }
    ],
    ultrasonic: [{ key: 'distance', label: 'Расстояние (см)', min: 2, max: 400 }],
    photoresistor: [{ key: 'light', label: 'Освещённость (0-1023)', min: 0, max: 1023 }],
    potentiometer: [{ key: 'value', label: 'Значение (0-1023)', min: 0, max: 1023 }],
    servo: [{ key: 'angle', label: 'Угол (0-180)', min: 0, max: 180 }],
    lcd_1602: [
      { key: 'line0', label: 'Строка 1', type: 'text' },
      { key: 'line1', label: 'Строка 2', type: 'text' }
    ]
  };

  const list = fields[part.type] || [];
  if (list.length === 0) return (
    <div className="p-4 text-slate-400 text-sm">
      <b>{part.type}</b><br/>Нет настраиваемых параметров
    </div>
  );

  return (
    <div className="p-3 bg-slate-800 border-t border-slate-700">
      <h4 className="font-bold mb-2 text-sm">Свойства: {part.type}</h4>
      {list.map(f => (
        <div key={f.key} className="mb-2">
          <label className="text-xs text-slate-400 block">{f.label}</label>
          {f.type === 'color' ? (
            <input type="color" value={part.state?.[f.key] || '#ff0000'}
              onChange={e => update(f.key, e.target.value)} className="w-full h-8"/>
          ) : f.type === 'text' ? (
            <input type="text" value={part.state?.[f.key] || ''}
              onChange={e => update(f.key, e.target.value)}
              className="w-full p-1 bg-slate-700 rounded text-sm"/>
          ) : (
            <div className="flex items-center gap-2">
              <input type="range" min={f.min} max={f.max}
                value={part.state?.[f.key] || 0}
                onChange={e => update(f.key, +e.target.value)} className="flex-1"/>
              <span className="text-xs w-12 text-right">{part.state?.[f.key]}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
