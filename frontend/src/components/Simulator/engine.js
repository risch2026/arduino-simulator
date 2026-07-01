export class ArduinoEngine {
    constructor() {
    this.pins = {};
    this.variables = {};
    this.running = false;
    this.onUpdate = null;
    this.onLog = null;
    this.onLine = null;
    this.parts = [];
    this.wires = [];
    this._stepperStep = 0;
    this.stepDelay = 150; // мс между строками для визуализации
    this.lcdLines = ['', ''];
    this.lcdCursor = { col: 0, row: 0 };
  }

  setCircuit(parts, wires) {
    this.parts = parts;
    this.wires = wires;
  }

  log(msg) {
    if (this.onLog) this.onLog(msg);
  }

  highlightLine(lineInfo) {
    if (this.onLine) this.onLine(lineInfo);
  }

  async run(code) {
    this.running = true;
    this.pins = {};
    this.variables = {};
    this._stepperStep = 0;
    this.log('Запуск программы...');

    try {
      const setupInfo = this.extractFunction(code, 'setup');
      const loopInfo = this.extractFunction(code, 'loop');

      if (setupInfo) {
        this.log('-> Выполнение setup()');
        await this.exec(setupInfo.body, 'setup', setupInfo.startLine);
      }

      if (loopInfo) {
        this.log('-> Вход в loop()');
        let iteration = 0;
        while (this.running) {
          await this.exec(loopInfo.body, 'loop', loopInfo.startLine);
          iteration++;
          await this.sleep(10);
          if (iteration > 10000) {
            this.log('Превышен лимит итераций');
            
           // ↓↓↓ ОБЯЗАТЕЛЬНО ДОБАВИТЬ ПОСЛЕ ЦИКЛА ↓↓↓
                    
                    this.running = false;
                    if (this.onLine) this.onLine(null);
                    this.updateComponents();
                    this.log('Программа завершена');
                    

          }
        }



      }
    } catch (e) {
      this.log('Ошибка: ' + e.message);
    } finally {
      // ГАРАНТИРОВАННАЯ очистка подсветки
      this.log('Программа остановлена');
      this.running = false;
      if (this.onLine) this.onLine(null);
      this.updateComponents();
    }
  }

  stop() {
    this.running = false;
    // Очищаем подсветку строки
    if (this.onLine) this.onLine(null);
    // Сбрасываем состояние компонентов
    this.updateComponents();
  }



  // Возвращает { body, startLine } — тело функции и номер строки, где оно начинается
  extractFunction(code, name) {
    const re = new RegExp('void\\s+' + name + '\\s*\\(\\s*\\)\\s*\\{');
    const m = code.match(re);
    if (!m) return null;

    const startIdx = m.index + m[0].length;
    const beforeMatch = code.substring(0, startIdx);
    const startLine = beforeMatch.split('\n').length; // номер строки, где начинается тело

    // Ищем закрывающую скобку
    let depth = 1;
    let i = startIdx;
    while (i < code.length && depth > 0) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') depth--;
      i++;
    }

    const body = code.substring(startIdx, i - 1);
    return { body, startLine };
  }

  // startLine — реальный номер строки в полном коде
  async exec(body, funcName, startLine) {
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!this.running) break;
      const line = lines[i].trim();
      if (!line || line.startsWith('//') || line === '{' || line === '}') continue;

      try {
        await this.executeLine(line, startLine + i, funcName);
      } catch (e) {
        this.log('Строка ' + (startLine + i) + ': ' + e.message);
        throw e;
      }
    }
  }

 

  async executeLine(line, realLineNum, funcName) {
    // Подсветка текущей строки
    this.highlightLine({ line: realLineNum, func: funcName });

    // Небольшая задержка для визуализации (кроме delay, которая уже имеет свою)
    const isDelay = line.trim().startsWith('delay(');
    if (!isDelay && this.stepDelay > 0) {
      await this.sleep(this.stepDelay);
    }

    let m = line.match(/pinMode\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
    if (m) {
      this.pins['mode_' + m[1]] = m[2];
      return;
    }

    m = line.match(/digitalWrite\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
    if (m) {
      const pin = this.resolveValue(m[1]);
      const val = m[2] === 'HIGH' ? 1 : (m[2] === 'LOW' ? 0 : this.resolveValue(m[2]));
      this.pins['D' + pin] = val;
      this.updateComponents();
      return;
    }

    m = line.match(/analogWrite\(\s*(\w+)\s*,\s*([^)]+)\)/);
    if (m) {
      const pin = this.resolveValue(m[1]);
      const val = this.resolveValue(m[2]);
      this.pins['PWM' + pin] = Math.max(0, Math.min(255, val));
      this.updateComponents();
      return;
    }

    m = line.match(/delay\(\s*([^)]+)\s*\)/);
    if (m) {
      const ms = this.resolveValue(m[1]);
      await this.sleep(ms);
      return;
    }

    m = line.match(/Serial\.println\(\s*(.+)\s*\)/);
    if (m) {
      const val = this.resolveValue(m[1].replace(/"/g, '').replace(/'/g, ''));
      this.log('[Serial] ' + val);
      return;
    }

    m = line.match(/(?:int|long|float|byte)\s+(\w+)\s*=\s*([^;]+);/);
    if (m) {
      this.variables[m[1]] = this.resolveValue(m[2]);
      return;
    }

    m = line.match(/(\w+)\s*=\s*([^;]+);/);
    if (m && !line.startsWith('if') && !line.startsWith('for')) {
      this.variables[m[1]] = this.resolveValue(m[2]);
      return;
    }

    m = line.match(/(\w+)\s*(\+\+|--)/);
    if (m) {
      const v = this.variables[m[1]] || 0;
      this.variables[m[1]] = m[2] === '++' ? v + 1 : v - 1;
      return;
    }


    // LCD команды
    m = line.match(/lcd\.begin\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) {
      this.updateLcd({ cols: parseInt(m[1]), rows: parseInt(m[2]) });
      return;
    }

    m = line.match(/lcd\.setCursor\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
    if (m) {
      const col = this.resolveValue(m[1]);
      const row = this.resolveValue(m[2]);
      this.lcdCursor = { col, row };
      return;
    }

    m = line.match(/lcd\.print\(\s*(.+)\s*\)/);
    if (m) {
      const text = this.resolveValue(m[1].replace(/"/g, '').replace(/'/g, ''));
      this.writeToLcd(String(text));
      return;
    }

    m = line.match(/lcd\.clear\(\)/);
    if (m) {
      this.lcdLines = ['', ''];
      this.lcdCursor = { col: 0, row: 0 };
      this.updateLcd();
      return;
    }



    this.log('Неизвестная команда: ' + line);
  }











  resolveValue(expr) {
    if (typeof expr === 'number') return expr;
    expr = String(expr).trim();
    if (/^-?\d+(\.\d+)?$/.test(expr)) return parseFloat(expr);
    if (expr === 'HIGH') return 1;
    if (expr === 'LOW') return 0;
    if (expr === 'true') return 1;
    if (expr === 'false') return 0;
    if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);
    if (this.variables.hasOwnProperty(expr)) return this.variables[expr];
    if (/^A\d$/.test(expr)) return expr;
    try {
      let evalExpr = expr;
      for (const k of Object.keys(this.variables)) {
        evalExpr = evalExpr.replace(new RegExp('\\b' + k + '\\b', 'g'), this.variables[k]);
      }
      if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
        return Function('"use strict"; return (' + evalExpr + ')')();
      }
    } catch (e) {}
    return 0;
  }

  updateComponents() {
    if (!this.onUpdate) return;
    const states = {};

    for (const part of this.parts) {
      if (part.type === 'led' || part.type === 'rgb_led') {
        const wire = this.wires.find(w =>
          (w.from.partId === part.id && w.from.pin === 'A') ||
          (w.to.partId === part.id && w.to.pin === 'A'));
        if (wire) {
          const otherId = wire.from.partId === part.id ? wire.to.partId : wire.from.partId;
          const other = this.parts.find(p => p.id === otherId);
          if (other && other.type === 'arduino_uno') {
            const pinName = wire.from.partId === part.id ? wire.to.pin : wire.from.pin;
            const val = this.pins['D' + pinName] || this.pins['PWM' + pinName] || 0;
            if (part.type === 'led') {
              states[part.id] = { on: val > 0, color: part.state?.color || '#ff0000' };
            } else {
              states[part.id] = {
                r: this.pins['PWM' + (part.state?.rPin || 9)] || 0,
                g: this.pins['PWM' + (part.state?.gPin || 10)] || 0,
                b: this.pins['PWM' + (part.state?.bPin || 11)] || 0
              };
            }
          }
        }
      } else if (part.type === 'buzzer') {
        const wire = this.wires.find(w => w.from.partId === part.id || w.to.partId === part.id);
        if (wire) {
          const otherId = wire.from.partId === part.id ? wire.to.partId : wire.from.partId;
          const other = this.parts.find(p => p.id === otherId);
          if (other && other.type === 'arduino_uno') {
            const pinName = wire.from.partId === part.id ? wire.to.pin : wire.from.pin;
            states[part.id] = { on: (this.pins['D' + pinName] || 0) > 0 };
          }
        }
      } else if (part.type === 'servo') {
        const wire = this.wires.find(w =>
          (w.from.partId === part.id && w.from.pin === 'SIG') ||
          (w.to.partId === part.id && w.to.pin === 'SIG'));
        if (wire) {
          const otherId = wire.from.partId === part.id ? wire.to.partId : wire.from.partId;
          const other = this.parts.find(p => p.id === otherId);
          if (other && other.type === 'arduino_uno') {
            const pinName = wire.from.partId === part.id ? wire.to.pin : wire.from.pin;
            const val = this.pins['PWM' + pinName];
            if (val !== undefined) {
              states[part.id] = { angle: Math.round(val / 255 * 180) };
            }
          }
        }
      } else if (part.type === 'motor_dc') {
        const ena = this.pins['PWM5'] || 0;
        const in1 = this.pins['D6'] || 0;
        const in2 = this.pins['D7'] || 0;
        let speed = ena;
        let direction = 'STOP';
        if (in1 && !in2) direction = 'FORWARD';
        else if (!in1 && in2) direction = 'BACKWARD';
        states[part.id] = { speed, direction };
      } else if (part.type === 'stepper_motor') {
        const currentStep =
          ((this.pins['D8'] || 0) << 3) |
          ((this.pins['D9'] || 0) << 2) |
          ((this.pins['D10'] || 0) << 1) |
          (this.pins['D11'] || 0);
        const prevStep = this._stepperStep || 0;
        if (currentStep !== prevStep && currentStep > 0) {
          const steps = (part.state?.steps || 0) + 1;
          states[part.id] = { ...part.state, steps };
        }
        this._stepperStep = currentStep;
      }
    }

    const arduino = this.parts.find(p => p.type === 'arduino_uno');
    if (arduino) {
      states[arduino.id] = { ...this.pins, running: this.running, power: true };
    }

    this.onUpdate(states);
  }

  writeToLcd(text) {
    const row = this.lcdCursor.row;
    let col = this.lcdCursor.col;
    
    if (row < 0 || row > 1) return;
    
    // Заполняем текущую строку начиная с позиции курсора
    let currentLine = this.lcdLines[row] || '';
    // Дополняем пробелами до позиции курсора
    while (currentLine.length < col) currentLine += ' ';
    
    // Вставляем текст
    currentLine = currentLine.substring(0, col) + text + currentLine.substring(col + text.length);
    // Обрезаем до 16 символов
    currentLine = currentLine.substring(0, 16);
    
    this.lcdLines[row] = currentLine;
    this.lcdCursor.col = col + text.length;
    
    this.updateLcd();
  }

  updateLcd(extraState) {
    const lcdPart = this.parts.find(p => p.type === 'lcd_1602');
    if (!lcdPart) return;
    
    // Проверяем, что LCD подключён к Arduino
    const wire = this.wires.find(w => 
      (w.from.partId === lcdPart.id) || (w.to.partId === lcdPart.id)
    );
    if (!wire) return;
    
    const states = {
      [lcdPart.id]: { 
        lines: [...this.lcdLines],
        ...extraState
      }
    };
    if (this.onUpdate) this.onUpdate(states);
  }





  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}


