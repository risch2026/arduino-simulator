export const PARTS = {
  arduino_uno: {
    name: 'Arduino Uno', w: 260, h: 160,
    pins: {
      digital: [13,12,11,10,9,8,7,6,5,4,3,2,1,0],
      analog: ['A0','A1','A2','A3','A4','A5'],
      power: ['5V','3.3V','GND','GND','VIN']
    },
    svg: (x, y, state) => {
      const s = state || {};
      const digitalPins = [13,12,11,10,9,8,7,6,5,4,3,2,1,0];
      const leds = digitalPins.map((pin, i) => {
        const val = s['D' + pin] || s['PWM' + pin] || 0;
        const brightness = Math.min(1, val / 255);
        const color = val > 0 ? 'rgba(255, 200, 0, ' + brightness + ')' : '#333';
        const lx = x + 20 + i * 17;
        return '<circle cx="' + lx + '" cy="' + (y + 70) + '" r="4" fill="' + color + '" stroke="#000" stroke-width="0.5"/>' +
               '<text x="' + lx + '" y="' + (y + 62) + '" text-anchor="middle" font-size="7" fill="#fff">' + pin + '</text>';
      }).join('');
      const powerLed = s.power ? 'rgba(0, 255, 0, 0.9)' : '#333';
      return '<rect x="' + x + '" y="' + y + '" width="260" height="160" fill="#00979D" stroke="#005F63" stroke-width="2" rx="8"/>' +
             '<text x="' + (x+15) + '" y="' + (y+25) + '" fill="white" font-size="13" font-weight="bold">ARDUINO UNO</text>' +
             '<circle cx="' + (x+240) + '" cy="' + (y+20) + '" r="4" fill="' + powerLed + '"/>' +
             '<text x="' + (x+215) + '" y="' + (y+23) + '" font-size="7" fill="#fff">PWR</text>' +
             '<rect x="' + (x+250) + '" y="' + (y+30) + '" width="40" height="30" fill="#222" stroke="#000"/>' +
             '<text x="' + (x+120) + '" y="' + (y+65) + '" text-anchor="middle" font-size="8" fill="#888">USB</text>' +
             leds +
             '<text x="' + (x+15) + '" y="' + (y+130) + '" fill="#fff" font-size="9">DIGITAL (PWM~)</text>' +
             '<text x="' + (x+210) + '" y="' + (y+130) + '" fill="#fff" font-size="9">POWER</text>';
    }
  },

  led: {
    name: 'Светодиод', w: 30, h: 50, pins: ['A','K'],
    state: { on: false, color: '#ff0000' },
    svg: (x, y, state) => {
      const s = state || {on:false,color:'#ff0000'};
      const fill = s.on ? s.color : '#555';
      return '<polygon points="' + (x+15) + ',' + y + ' ' + (x+28) + ',' + (y+35) + ' ' + x + ',' + (y+35) + '" fill="' + fill + '" stroke="#333" stroke-width="1.5"/>' +
             '<line x1="' + (x+8) + '" y1="' + (y+35) + '" x2="' + (x+8) + '" y2="' + (y+50) + '" stroke="#888" stroke-width="2"/>' +
             '<line x1="' + (x+22) + '" y1="' + (y+35) + '" x2="' + (x+22) + '" y2="' + (y+50) + '" stroke="#888" stroke-width="2"/>' +
             (s.on ? '<circle cx="' + (x+15) + '" cy="' + (y+20) + '" r="22" fill="' + s.color + '" opacity="0.35"/>' : '');
    }
  },

  resistor: {
    name: 'Резистор', w: 80, h: 20, pins: ['1','2'],
    state: { ohm: 220 },
    svg: (x, y) => {
      return '<line x1="' + x + '" y1="' + (y+10) + '" x2="' + (x+15) + '" y2="' + (y+10) + '" stroke="#888" stroke-width="2"/>' +
             '<rect x="' + (x+15) + '" y="' + y + '" width="50" height="20" fill="#D2B48C" stroke="#8B4513"/>' +
             '<line x1="' + (x+65) + '" y1="' + (y+10) + '" x2="' + (x+80) + '" y2="' + (y+10) + '" stroke="#888" stroke-width="2"/>';
    }
  },

  button: {
    name: 'Кнопка', w: 40, h: 40, pins: ['1','2'],
    state: { pressed: false },
    svg: (x, y, state) => {
      const s = state || {pressed:false};
      return '<rect x="' + x + '" y="' + y + '" width="40" height="40" fill="#444" rx="4" stroke="#222"/>' +
             '<circle cx="' + (x+20) + '" cy="' + (y+20) + '" r="' + (s.pressed?9:7) + '" fill="' + (s.pressed?'#0f0':'#f00') + '" stroke="#222"/>';
    }
  },

  buzzer: {
    name: 'Зуммер', w: 40, h: 40, pins: ['+','-'],
    state: { on: false },
    svg: (x, y, state) => {
      const s = state || {on:false};
      return '<circle cx="' + (x+20) + '" cy="' + (y+20) + '" r="18" fill="' + (s.on?'#ff0':'#222') + '" stroke="#555"/>';
    }
  },

  potentiometer: {
    name: 'Потенциометр', w: 50, h: 50, pins: ['1','W','2'],
    state: { value: 512 },
    svg: (x, y) => {
      return '<rect x="' + x + '" y="' + y + '" width="50" height="50" fill="#333" rx="4"/>' +
             '<circle cx="' + (x+25) + '" cy="' + (y+25) + '" r="12" fill="#666"/>' +
             '<line x1="' + (x+25) + '" y1="' + (y+13) + '" x2="' + (x+25) + '" y2="' + (y+25) + '" stroke="#fff" stroke-width="2"/>';
    }
  },

  servo: {
    name: 'Серво SG90', w: 70, h: 50, pins: ['VCC','SIG','GND'],
    state: { angle: 90 },
    svg: (x, y, state) => {
      const a = (state && state.angle) || 90;
      const rad = (a - 90) * Math.PI / 180;
      const ex = x + 55 + Math.cos(rad) * 18;
      const ey = y + 12 + Math.sin(rad) * 18;
      return '<rect x="' + x + '" y="' + y + '" width="70" height="50" fill="#1E90FF" stroke="#00008B" rx="3"/>' +
             '<circle cx="' + (x+55) + '" cy="' + (y+12) + '" r="8" fill="#fff" stroke="#000"/>' +
             '<line x1="' + (x+55) + '" y1="' + (y+12) + '" x2="' + ex + '" y2="' + ey + '" stroke="#000" stroke-width="3"/>' +
             '<text x="' + (x+35) + '" y="' + (y+42) + '" text-anchor="middle" fill="#fff" font-size="9">' + a + '°</text>';
    }
  },

  dht11: {
    name: 'DHT11', w: 50, h: 70, pins: ['VCC','DATA','NC','GND'],
    state: { temp: 25, humidity: 60 },
    svg: (x, y, state) => {
      const s = state || {temp:25,humidity:60};
      return '<rect x="' + x + '" y="' + y + '" width="50" height="70" fill="#3366cc" stroke="#003399" rx="4"/>' +
             '<rect x="' + (x+5) + '" y="' + (y+5) + '" width="40" height="25" fill="#ddd" stroke="#666"/>' +
             '<text x="' + (x+25) + '" y="' + (y+22) + '" text-anchor="middle" fill="#000" font-size="9">DHT11</text>' +
             '<text x="' + (x+25) + '" y="' + (y+50) + '" text-anchor="middle" fill="#fff" font-size="8">T:' + s.temp + 'C</text>' +
             '<text x="' + (x+25) + '" y="' + (y+62) + '" text-anchor="middle" fill="#fff" font-size="8">H:' + s.humidity + '%</text>';
    }
  },

  ultrasonic: {
    name: 'HC-SR04', w: 80, h: 45, pins: ['VCC','TRIG','ECHO','GND'],
    state: { distance: 50 },
    svg: (x, y) => {
      return '<rect x="' + x + '" y="' + y + '" width="80" height="45" fill="#2a7a2a" stroke="#000" rx="3"/>' +
             '<circle cx="' + (x+20) + '" cy="' + (y+22) + '" r="14" fill="#c0c0c0" stroke="#666"/>' +
             '<circle cx="' + (x+60) + '" cy="' + (y+22) + '" r="14" fill="#c0c0c0" stroke="#666"/>' +
             '<text x="' + (x+40) + '" y="' + (y+42) + '" text-anchor="middle" fill="#fff" font-size="7">HC-SR04</text>';
    }
  },

  lcd_1602: {
    name: 'LCD 16x2', w: 220, h: 90, pins: ['VCC','GND','SDA','SCL'],
    state: { lines: ['Hello!', 'Arduino'] },
    svg: (x, y, state) => {
      const s = state || {lines:['','']};
      return '<rect x="' + x + '" y="' + y + '" width="220" height="90" fill="#1a5c1a" stroke="#0a3a0a" stroke-width="2" rx="4"/>' +
             '<rect x="' + (x+10) + '" y="' + (y+10) + '" width="200" height="50" fill="#4a7a2a" stroke="#000"/>' +
             '<text x="' + (x+15) + '" y="' + (y+32) + '" fill="#00ff00" font-family="monospace" font-size="12">' + ((s.lines[0]||'').substring(0,16)) + '</text>' +
             '<text x="' + (x+15) + '" y="' + (y+52) + '" fill="#00ff00" font-family="monospace" font-size="12">' + ((s.lines[1]||'').substring(0,16)) + '</text>';
    }
  },

  photoresistor: {
    name: 'Фоторезистор', w: 40, h: 40, pins: ['1','2'],
    state: { light: 500 },
    svg: (x, y) => {
      return '<circle cx="' + (x+20) + '" cy="' + (y+20) + '" r="16" fill="#8B4513" stroke="#000"/>' +
             '<text x="' + (x+20) + '" y="' + (y+38) + '" text-anchor="middle" fill="#fff" font-size="7">LDR</text>';
    }
  },

  rgb_led: {
    name: 'RGB LED', w: 40, h: 50, pins: ['R','G','B','GND'],
    state: { r: 0, g: 0, b: 0 },
    svg: (x, y, state) => {
      const s = state || {r:0,g:0,b:0};
      const color = 'rgb(' + s.r + ',' + s.g + ',' + s.b + ')';
      const glow = (s.r+s.g+s.b) > 50;
      return (glow ? '<circle cx="' + (x+20) + '" cy="' + (y+20) + '" r="25" fill="' + color + '" opacity="0.3"/>' : '') +
             '<circle cx="' + (x+20) + '" cy="' + (y+20) + '" r="15" fill="' + color + '" stroke="#000"/>';
    }
  },

  motor_dc: {
    name: 'DC-мотор + L298N', w: 100, h: 80,
    pins: ['ENA', 'IN1', 'IN2', 'VCC', 'GND'],
    state: { speed: 0, direction: 'STOP' },
    svg: (x, y, state) => {
      const s = state || { speed: 0, direction: 'STOP' };
      const speed = Math.abs(s.speed || 0);
      const angle = (Date.now() / 20 * (speed / 255)) % 360;
      const rad = angle * Math.PI / 180;
      const cx = x + 50, cy = y + 35;
      const ex = cx + Math.cos(rad) * 18;
      const ey = cy + Math.sin(rad) * 18;
      const color = speed > 0 ? '#ff6b35' : '#555';
      return '<rect x="' + x + '" y="' + y + '" width="100" height="80" fill="#8B0000" stroke="#000" rx="3"/>' +
             '<text x="' + (x+5) + '" y="' + (y+12) + '" fill="#fff" font-size="8" font-weight="bold">L298N</text>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="22" fill="#333" stroke="#000"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="18" fill="#444"/>' +
             '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="' + color + '" stroke-width="3"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="3" fill="#888"/>' +
             '<text x="' + (x+50) + '" y="' + (y+72) + '" text-anchor="middle" fill="#fff" font-size="9">' +
             (speed > 0 ? (s.direction === 'FORWARD' ? '▶ ' : '◀ ') + speed : '⏹ STOP') + '</text>';
    }
  },

  stepper_motor: {
    name: 'Шаговый мотор 28BYJ', w: 90, h: 90,
    pins: ['IN1', 'IN2', 'IN3', 'IN4', 'VCC', 'GND'],
    state: { steps: 0, rpm: 10 },
    svg: (x, y, state) => {
      const s = state || { steps: 0, rpm: 10 };
      const angle = ((s.steps || 0) * 5.625) % 360;
      const rad = angle * Math.PI / 180;
      const cx = x + 45, cy = y + 40;
      const ex = cx + Math.cos(rad) * 20;
      const ey = cy + Math.sin(rad) * 20;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="35" fill="#c0c0c0" stroke="#000" stroke-width="2"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="28" fill="#888"/>' +
             '<circle cx="' + cx + '" cy="' + cy + '" r="8" fill="#333"/>' +
             '<line x1="' + cx + '" y1="' + cy + '" x2="' + ex + '" y2="' + ey + '" stroke="#000" stroke-width="3"/>' +
             '<line x1="' + cx + '" y1="' + (cy-20) + '" x2="' + cx + '" y2="' + (cy+20) + '" stroke="#444" stroke-width="1"/>' +
             '<line x1="' + (cx-20) + '" y1="' + cy + '" x2="' + (cx+20) + '" y2="' + cy + '" stroke="#444" stroke-width="1"/>' +
             '<text x="' + (x+45) + '" y="' + (y+85) + '" text-anchor="middle" fill="#fff" font-size="8">' +
             (s.steps || 0) + ' шагов | ' + (s.rpm || 0) + ' RPM</text>';
    }
  }
};