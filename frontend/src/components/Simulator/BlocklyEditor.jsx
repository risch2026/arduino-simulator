import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { arduinoGenerator } from './arduinoGenerator';

const STORAGE_KEY = 'arduino_blockly_workspace';

export default function BlocklyEditor({ setCode, visible }) {
  const containerRef = useRef(null);
  const workspaceRef = useRef(null);
  const [status, setStatus] = useState('');
  const resizeObserverRef = useRef(null);
  const lineToBlockMapRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || workspaceRef.current) return;

    const toolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: '🔧 Arduino', colour: '0',
          contents: [
            { kind: 'block', type: 'arduino_setup' },
            { kind: 'block', type: 'arduino_loop' },
            { kind: 'block', type: 'arduino_pin_mode' },
            { kind: 'block', type: 'arduino_digital_write' },
            { kind: 'block', type: 'arduino_digital_read' },
            { kind: 'block', type: 'arduino_analog_write' },
            { kind: 'block', type: 'arduino_analog_read' },
            { kind: 'block', type: 'arduino_delay' },
            { kind: 'block', type: 'arduino_serial_println' },
            { kind: 'block', type: 'arduino_map' },
            { kind: 'block', type: 'arduino_millis' },
            { kind: 'block', type: 'arduino_random' },
            { kind: 'block', type: 'arduino_tone' },
            { kind: 'block', type: 'arduino_no_tone' },
            { kind: 'block', type: 'arduino_motor_set' },
            { kind: 'block', type: 'arduino_motor_stop' },
            { kind: 'block', type: 'arduino_stepper_step' },
            { kind: 'block', type: 'arduino_stepper_speed' },
            { kind: 'block', type: 'arduino_rgb_led' },
           // { kind: 'block', type: 'arduino_var_declare' },
            { kind: 'block', type: 'lcd_begin' },
            { kind: 'block', type: 'lcd_set_cursor' },
            { kind: 'block', type: 'lcd_print' },
            { kind: 'block', type: 'lcd_clear' }
          ]
        },
        {
          kind: 'category', name: '🔢 Числа', colour: '230',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
            { kind: 'block', type: 'math_modulo' },
            { kind: 'block', type: 'math_constrain' },
            { kind: 'block', type: 'math_random_int' }
          ]
        },
        {
          kind: 'category', name:'📝 Текст', colour: '160',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_length' },
            { kind: 'block', type: 'text_print' }
          ]
        },
        {
          kind: 'category', name: '🔀 Логика', colour: '210',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
            { kind: 'block', type: 'logic_ternary' }
          ]
        },
        {
          kind: 'category', name: '🔄 Циклы', colour: '120',
          contents: [
                     
            { kind: 'block', type: 'controls_repeat' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
            { kind: 'block', type: 'controls_forEach' },
            { kind: 'block', type: 'controls_flow_statements' }


          ]
        },
        {
          kind: 'category', name: '📦 Переменные', colour: '330',
  contents: [
    { kind: 'block', type: 'arduino_var_declare' },
    { kind: 'block', type: 'arduino_const_declare' },
    { kind: 'block', type: 'arduino_array_declare' },
    { kind: 'block', type: 'arduino_array_get' },
    { kind: 'block', type: 'arduino_array_set' },
    { kind: 'block', type: 'variables_get' },
    { kind: 'block', type: 'variables_set' },
    { kind: 'block', type: 'math_change' }
  ]},

{ kind: 'category', name: '📊 Списки', colour: '260', contents: [
          { kind: 'block', type: 'lists_create_empty' }, { kind: 'block', type: 'lists_create_with' },
          { kind: 'block', type: 'lists_repeat' }, { kind: 'block', type: 'lists_length' },
          { kind: 'block', type: 'lists_isEmpty' }, { kind: 'block', type: 'lists_indexOf' },
          { kind: 'block', type: 'lists_getIndex' }, { kind: 'block', type: 'lists_setIndex' }
        ]},


 { kind: 'category', name: '🎨 Цвет', colour: '20', contents: [
          { kind: 'block', type: 'simple_colour' }, { kind: 'block', type: 'simple_colour_random' }
        ]},
        { kind: 'category', name: '⚙️ Функции', colour: '290', contents: [
          { kind: 'block', type: 'procedures_defnoreturn' }, { kind: 'block', type: 'procedures_defreturn' },
          { kind: 'block', type: 'procedures_callnoreturn' }, { kind: 'block', type: 'procedures_callreturn' }
        ]}


      ]
    };

    try {
      const workspace = Blockly.inject(containerRef.current, {
  toolbox: toolbox,
  grid: { spacing: 20, length: 3, colour: '#333', snap: true },
  zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.1 },
  trashcan: true,
  move: { scrollbars: true, drag: true, wheel: true },
  // === ОТКЛЮЧАЕМ МАРКЕРЫ ВСТАВКИ ===
  insertionMarkerMinOpacity: 0,
  insertionMarkerOpacity: 0
});

      workspaceRef.current = workspace;

      // Восстановление из localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state = JSON.parse(saved);
          Blockly.serialization.workspaces.load(state, workspace);
          setStatus('Restored');
          setTimeout(() => setStatus(''), 2000);
          setTimeout(() => {
            workspace.scrollCenter();
            Blockly.svgResize(workspace);
          }, 100);
        }
      } catch (e) {
        console.warn('Load error:', e);
      }

      // === Маппинг строк к блокам ===
      const buildLineToBlockMap = () => {
        const map = {};
        try {
          const fullCode = arduinoGenerator.workspaceToCode(workspace);
          const allLines = fullCode.split('\n');
          const allBlocks = workspace.getAllBlocks(false);

          for (const block of allBlocks) {
            if (block.type === 'arduino_setup' || block.type === 'arduino_loop') continue;
            if (!block.previousConnection && !block.outputConnection) continue;

            try {
              const codeResult = arduinoGenerator.blockToCode(block);
              const blockCode = Array.isArray(codeResult) ? codeResult[0] : codeResult;
              if (!blockCode || typeof blockCode !== 'string') continue;

              const blockLines = blockCode.split('\n').filter(l => l.trim().length > 0);
              if (blockLines.length === 0) continue;

              const firstLine = blockLines[0].trim();
              for (let i = 0; i < allLines.length; i++) {
                if (allLines[i].trim() === firstLine) {
                  for (let j = 0; j < blockLines.length; j++) {
                    if (i + j < allLines.length && allLines[i + j].trim().length > 0) {
                      map[i + j + 1] = block.id;
                    }
                  }
                  break;
                }
              }
            } catch (e) {}
          }
        } catch (e) {}
        lineToBlockMapRef.current = map;
        return map;
      };

      const highlightBlockByLine = (lineNumber) => {
        const blockId = lineToBlockMapRef.current[lineNumber];
        if (blockId) {
          workspace.highlightBlock(blockId);
          const block = workspace.getBlockById(blockId);
          if (block) {
            const xy = block.getRelativeToSurfaceXY();
            workspace.scroll(xy.x - 150, xy.y - 80);
          }
        } else {
          workspace.highlightBlock(null);
        }
      };

      window.highlightBlocklyBlock = highlightBlockByLine;
      window.clearBlocklyHighlight = () => {
        if (workspaceRef.current) {
          // Способ 1: стандартный API
          workspaceRef.current.highlightBlock(null);
          
          // Способ 2: перебираем все блоки и снимаем выделение
          try {
            const allBlocks = workspaceRef.current.getAllBlocks(false);
            allBlocks.forEach(block => {
              if (block.svgPath_) {
                block.svgPath_.style.fill = '';
              }
              // Снимаем CSS-класс подсветки
              if (block.svgGroup_) {
                block.svgGroup_.classList.remove('blocklySelected');
                block.svgGroup_.classList.remove('blocklyHighlighted');
              }
            });
          } catch (e) {
            // Игнорируем ошибки
          }
        }
      };
      window.rebuildBlockMap = buildLineToBlockMap;

      workspace.addChangeListener((event) => {
        if (event.isUiEvent) return;
        try {
          const generated = arduinoGenerator.workspaceToCode(workspace);
          if (setCode) setCode(generated);
          buildLineToBlockMap();
          const state = Blockly.serialization.workspaces.save(workspace);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error('Generation error:', e);
        }
      });

      setTimeout(() => buildLineToBlockMap(), 200);

      resizeObserverRef.current = new ResizeObserver(() => {
        if (workspaceRef.current) {
          Blockly.svgResize(workspaceRef.current);
        }
      });
      resizeObserverRef.current.observe(containerRef.current);

    } catch (e) {
      console.error('Blockly inject error:', e);
    }

    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
      // Очищаем подсветку перед удалением
      if (window.clearBlocklyHighlight) window.clearBlocklyHighlight();
      window.highlightBlocklyBlock = null;
      window.clearBlocklyHighlight = null;
      window.rebuildBlockMap = null;
    };
  }, []);









  
  useEffect(() => {
    if (visible && workspaceRef.current) {
      setTimeout(() => {
        Blockly.svgResize(workspaceRef.current);
        workspaceRef.current.scrollCenter();
      }, 50);
    }
  }, [visible]);

  const clearWorkspace = () => {
    if (workspaceRef.current && confirm('Delete all blocks?')) {
      workspaceRef.current.clear();
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const showAllBlocks = () => {
    if (workspaceRef.current) {
      workspaceRef.current.scrollCenter();
      Blockly.svgResize(workspaceRef.current);
    }
  };

  const exportBlocks = () => {
    if (!workspaceRef.current) return;
    const state = Blockly.serialization.workspaces.save(workspaceRef.current);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blocks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBlocks = (e) => {
    const file = e.target.files[0];
    if (!file || !workspaceRef.current) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const state = JSON.parse(ev.target.result);
        Blockly.serialization.workspaces.load(state, workspaceRef.current);
        workspaceRef.current.scrollCenter();
        if (window.rebuildBlockMap) window.rebuildBlockMap();
        setStatus('Imported');
        setTimeout(() => setStatus(''), 2000);
      } catch (err) {
        alert('Import error: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-900">
      <div className="flex gap-2 p-2 bg-slate-800 border-b border-slate-700 flex-wrap items-center">
        <button onClick={clearWorkspace}
          className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-xs">
          Очистить
        </button>
        <button onClick={showAllBlocks}
          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs">
          Показать все
        </button>
        <button onClick={exportBlocks}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
          Экспорт
        </button>
        <label className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs cursor-pointer">
          Импорт
          <input type="file" accept=".json" className="hidden" onChange={importBlocks}/>
        </label>
        {status && <span className="text-xs text-green-400 ml-2">{status}</span>}
        <span className="text-xs text-slate-400 self-center ml-auto">
          Блоки перетаскиваются из панели
        </span>
      </div>
      <div ref={containerRef} className="flex-1 w-full" style={{ minHeight: '500px' }}/>
    </div>
  );
}
