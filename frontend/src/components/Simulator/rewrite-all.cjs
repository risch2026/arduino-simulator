const fs = require('fs');
const path = require('path');

// ============================================================
// === arduinoGenerator.js — ЧИСТАЯ ВЕРСИЯ ===
// ============================================================
const generatorContent = `import * as Blockly from 'blockly';
import 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';

// === 1. Создаём Arduino-генератор ===
const arduinoGenerator = new Blockly.Generator('Arduino');
arduinoGenerator.addReservedWords('HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,Serial,lcd,String,pow,sqrt,abs,log,log10,exp,random,constrain,map,millis,analogRead,analogWrite,digitalRead,digitalWrite,pinMode,delay,tone,noTone');
arduinoGenerator.ORDER_ATOMIC = 0;
arduinoGenerator.ORDER_UNARY_POSTFIX = 1;
arduinoGenerator.ORDER_UNARY_PREFIX = 2;
arduinoGenerator.ORDER_MULTIPLICATIVE = 3;
arduinoGenerator.ORDER_ADDITIVE = 4;
arduinoGenerator.ORDER_SHIFT = 5;
arduinoGenerator.ORDER_RELATIONAL = 6;
arduinoGenerator.ORDER_EQUALITY = 7;
arduinoGenerator.ORDER_LOGICAL_AND = 8;
arduinoGenerator.ORDER_LOGICAL_OR = 9;
arduinoGenerator.ORDER_CONDITIONAL = 10;
arduinoGenerator.ORDER_ASSIGNMENT = 11;
arduinoGenerator.ORDER_COMMA = 12;
arduinoGenerator.ORDER_NONE = 99;

// === 2. Вспомогательная функция для получения имени переменной ===
// В Blockly v13 getFieldValue('VAR') возвращает UUID, а не имя
function getVarName(block) {
  const varId = block.getFieldValue('VAR');
  if (!varId) return 'x';
  // Если это уже имя (не UUID) — возвращаем как есть
  if (!varId.includes(';') && varId.length < 20 && /^[A-Za-z_]\\w*$/.test(varId)) {
    return varId;
  }
  // Иначе ищем переменную в workspace
  const ws = block.workspace;
  if (ws) {
    const variable = ws.getVariableById(varId);
    if (variable) return variable.name;
  }
  return varId;
}

// === 3. Копируем стандартные генераторы из JavaScript ===
const standardBlocks = [
  'math_number', 'math_arithmetic', 'math_single', 'math_modulo',
  'math_constrain', 'math_random_int', 'math_number_property',
  'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean', 'logic_ternary',
  'controls_if', 'controls_whileUntil', 'controls_for',
  'text', 'text_join', 'text_length', 'text_isEmpty',
  'lists_create_empty', 'lists_create_with', 'lists_repeat', 'lists_length',
  'lists_isEmpty', 'lists_indexOf', 'lists_getIndex', 'lists_setIndex',
  'colour_picker', 'colour_random', 'colour_rgb', 'colour_blend'
];

for (const blockType of standardBlocks) {
  if (javascriptGenerator.forBlock[blockType]) {
    arduinoGenerator.forBlock[blockType] = javascriptGenerator.forBlock[blockType];
  }
}

// === 4. Переопределение переменных (БЕЗ variableDB_) ===
arduinoGenerator.forBlock['variables_get'] = function(block) {
  const varName = getVarName(block);
  return [varName, arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['variables_set'] = function(block) {
  const arg = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  const varName = getVarName(block);
  if (!arduinoGenerator.definitions_['var_' + varName]) {
    arduinoGenerator.definitions_['var_' + varName] = 'int ' + varName + ';';
  }
  return varName + ' = ' + arg + ';\\n';
};

// === 5. math_change (изменение переменной) ===
arduinoGenerator.forBlock['math_change'] = function(block) {
  const varName = getVarName(block);
  const delta = arduinoGenerator.valueToCode(block, 'DELTA', arduinoGenerator.ORDER_NONE) || '0';
  if (!arduinoGenerator.definitions_['var_' + varName]) {
    arduinoGenerator.definitions_['var_' + varName] = 'int ' + varName + ' = 0;';
  }
  return varName + ' = ' + varName + ' + ' + delta + ';\\n';
};

// === 6. controls_repeat (повтор N раз — фиксированное число) ===
arduinoGenerator.forBlock['controls_repeat'] = function(block) {
  const times = String(block.getFieldValue('TIMES') || '0');
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int count = 0; count < ' + times + '; count++) {\\n' + branch + '}\\n';
};

// === 7. controls_repeat_ext (повтор N раз — переменное число) ===
arduinoGenerator.forBlock['controls_repeat_ext'] = function(block) {
  const times = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.ORDER_NONE) || '0';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int count = 0; count < ' + times + '; count++) {\\n' + branch + '}\\n';
};

// === 8. controls_for (цикл с счётчиком) ===
arduinoGenerator.forBlock['controls_for'] = function(block) {
  const varName = getVarName(block);
  const from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_NONE) || '0';
  const to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_NONE) || '0';
  const step = arduinoGenerator.valueToCode(block, 'BY', arduinoGenerator.ORDER_NONE) || '1';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int ' + varName + ' = ' + from + '; ' + varName + ' <= ' + to + '; ' + varName + ' += ' + step + ') {\\n' + branch + '}\\n';
};

// === 9. controls_forEach (цикл по списку) ===
arduinoGenerator.forBlock['controls_forEach'] = function(block) {
  const varName = getVarName(block);
  const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.ORDER_NONE) || '[]';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return '// forEach: for (int ' + varName + ' = 0; ' + varName + ' < sizeof(' + list + ')/sizeof(' + list + '[0]); ' + varName + '++) {\\n' + branch + '}\\n';
};

// === 10. controls_flow_statements (break/continue) ===
arduinoGenerator.forBlock['controls_flow_statements'] = function(block) {
  const flow = block.getFieldValue('FLOW');
  if (flow === 'BREAK') return 'break;\\n';
  if (flow === 'CONTINUE') return 'continue;\\n';
  return '';
};

// === 11. controls_ifelse (if с else) ===
arduinoGenerator.forBlock['controls_ifelse'] = function(block) {
  const cond = arduinoGenerator.valueToCode(block, 'IF0', arduinoGenerator.ORDER_NONE) || 'false';
  const thenBranch = arduinoGenerator.statementToCode(block, 'DO0');
  const elseBranch = arduinoGenerator.statementToCode(block, 'ELSE');
  return 'if (' + cond + ') {\\n' + thenBranch + '} else {\\n' + elseBranch + '}\\n';
};

// === 12. controls_if (if с elseif и else) ===
arduinoGenerator.forBlock['controls_if'] = function(block) {
  let code = '';
  const n = 1 + (block.elseifCount_ || 0);
  for (let i = 0; i < n; i++) {
    const cond = arduinoGenerator.valueToCode(block, 'IF' + i, arduinoGenerator.ORDER_NONE) || 'false';
    const branch = arduinoGenerator.statementToCode(block, 'DO' + i);
    if (i === 0) code += 'if (' + cond + ') {\\n' + branch + '}';
    else code += ' else if (' + cond + ') {\\n' + branch + '}';
  }
  if (block.elseCount_) {
    const branch = arduinoGenerator.statementToCode(block, 'ELSE');
    code += ' else {\\n' + branch + '}';
  }
  return code + '\\n';
};

// === 13. controls_whileUntil ===
arduinoGenerator.forBlock['controls_whileUntil'] = function(block) {
  const until = block.getFieldValue('MODE') === 'UNTIL';
  const cond = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_NONE) || 'false';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  if (until) return 'while (!(' + cond + ')) {\\n' + branch + '}\\n';
  return 'while (' + cond + ') {\\n' + branch + '}\\n';
};

// === 14. text_print → Serial.println ===
arduinoGenerator.forBlock['text_print'] = function(block) {
  const msg = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_NONE) || '""';
  return 'Serial.println(' + msg + ');\\n';
};

// === 15. Функции (процедуры) ===
arduinoGenerator.forBlock['procedures_defnoreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  const branch = arduinoGenerator.statementToCode(block, 'STACK');
  arduinoGenerator.definitions_['func_' + funcName] = 'void ' + funcName + '() {\\n' + branch + '}\\n';
  return '';
};

arduinoGenerator.forBlock['procedures_defreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  const branch = arduinoGenerator.statementToCode(block, 'STACK');
  const returnValue = arduinoGenerator.valueToCode(block, 'RETURN', arduinoGenerator.ORDER_NONE) || '0';
  arduinoGenerator.definitions_['func_' + funcName] = 'int ' + funcName + '() {\\n' + branch + '  return ' + returnValue + ';\\n}\\n';
  return '';
};

arduinoGenerator.forBlock['procedures_callnoreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  return funcName + '();\\n';
};

arduinoGenerator.forBlock['procedures_callreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  return [funcName + '()', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['procedures_ifreturn'] = function(block) {
  const condition = arduinoGenerator.valueToCode(block, 'CONDITION', arduinoGenerator.ORDER_NONE) || 'false';
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  return 'if (' + condition + ') return ' + value + ';\\n';
};

// === 16. Простые блоки цвета ===
Blockly.Blocks['simple_colour'] = {
  init: function() {
    this.appendDummyInput()
      .appendField(new Blockly.FieldDropdown([
        ['red', '#ff0000'], ['green', '#00ff00'], ['blue', '#0000ff'],
        ['yellow', '#ffff00'], ['orange', '#ff8800'], ['purple', '#aa00ff'],
        ['white', '#ffffff'], ['cyan', '#00ffff'], ['pink', '#ff00ff'],
        ['black', '#000000']
      ]), 'COLOUR');
    this.setOutput(true, 'Colour');
    this.setColour(20);
  }
};

Blockly.Blocks['simple_colour_random'] = {
  init: function() {
    this.appendDummyInput().appendField('random color');
    this.setOutput(true, 'Colour');
    this.setColour(20);
  }
};

arduinoGenerator.forBlock['simple_colour'] = function(block) {
  return ['"' + block.getFieldValue('COLOUR') + '"', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['simple_colour_random'] = function() {
  return ['String(random(0x1000000), HEX)', arduinoGenerator.ORDER_ATOMIC];
};

// ============================================================
// === 17. ARDUINO БЛОКИ ===
// ============================================================

Blockly.Blocks['arduino_setup'] = {
  init: function() {
    this.appendDummyInput().appendField('Setup');
    this.appendStatementInput('DO').appendField('');
    this.setColour(230);
  }
};

Blockly.Blocks['arduino_loop'] = {
  init: function() {
    this.appendDummyInput().appendField('Loop');
    this.appendStatementInput('DO').appendField('');
    this.setColour(230);
  }
};

Blockly.Blocks['arduino_pin_mode'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('pinMode')
      .appendField(new Blockly.FieldDropdown([
        ['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],
        ['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],
        ['12','12'],['13','13']
      ]), 'PIN')
      .appendField(new Blockly.FieldDropdown([
        ['OUTPUT','OUTPUT'],['INPUT','INPUT'],['INPUT_PULLUP','INPUT_PULLUP']
      ]), 'MODE');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

Blockly.Blocks['arduino_digital_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('digitalWrite')
      .appendField(new Blockly.FieldDropdown([
        ['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],
        ['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],
        ['12','12'],['13','13']
      ]), 'PIN');
    this.appendValueInput('VALUE').setCheck(null).appendField('value');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(0);
  }
};

Blockly.Blocks['arduino_digital_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('digitalRead')
      .appendField(new Blockly.FieldDropdown([
        ['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],
        ['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['11','11'],
        ['12','12'],['13','13']
      ]), 'PIN');
    this.setOutput(true, null);
    this.setColour(0);
  }
};

Blockly.Blocks['arduino_analog_write'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('analogWrite (PWM)')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']
      ]), 'PIN');
    this.appendValueInput('VALUE').setCheck('Number').appendField('value');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(65);
  }
};

Blockly.Blocks['arduino_analog_read'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('analogRead')
      .appendField(new Blockly.FieldDropdown([
        ['A0','A0'],['A1','A1'],['A2','A2'],['A3','A3'],['A4','A4'],['A5','A5']
      ]), 'PIN');
    this.setOutput(true, 'Number');
    this.setColour(65);
  }
};

Blockly.Blocks['arduino_delay'] = {
  init: function() {
    this.appendValueInput('MS').setCheck('Number').appendField('delay (ms)');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(30);
  }
};

Blockly.Blocks['arduino_serial_println'] = {
  init: function() {
    this.appendValueInput('VALUE').appendField('Serial.println');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['arduino_map'] = {
  init: function() {
    this.appendValueInput('VALUE').setCheck('Number').appendField('map(');
    this.appendValueInput('FROM_LOW').setCheck('Number').appendField(', from');
    this.appendValueInput('FROM_HIGH').setCheck('Number').appendField('to');
    this.appendValueInput('TO_LOW').setCheck('Number').appendField(', to');
    this.appendValueInput('TO_HIGH').setCheck('Number').appendField('to');
    this.appendDummyInput().appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(65);
  }
};

Blockly.Blocks['arduino_millis'] = {
  init: function() {
    this.appendDummyInput().appendField('millis()');
    this.setOutput(true, 'Number');
    this.setColour(30);
  }
};

Blockly.Blocks['arduino_random'] = {
  init: function() {
    this.appendValueInput('MAX').setCheck('Number').appendField('random(0,');
    this.appendValueInput('MIN').setCheck('Number').appendField(')');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setColour(230);
  }
};

Blockly.Blocks['arduino_tone'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('tone on pin')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],
        ['9','9'],['10','10'],['11','11'],['12','12'],['13','13']
      ]), 'PIN');
    this.appendValueInput('FREQ').setCheck('Number').appendField('freq');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['arduino_no_tone'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('noTone on pin')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],
        ['9','9'],['10','10'],['11','11'],['12','12'],['13','13']
      ]), 'PIN');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['arduino_motor_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Motor')
      .appendField(new Blockly.FieldDropdown([
        ['A (ENA+IN1+IN2)', 'A'], ['B (ENB+IN3+IN4)', 'B']
      ]), 'MOTOR');
    this.appendValueInput('SPEED').setCheck('Number').appendField('speed');
    this.appendDummyInput()
      .appendField('direction')
      .appendField(new Blockly.FieldDropdown([
        ['forward', 'FORWARD'], ['backward', 'BACKWARD']
      ]), 'DIR');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(20);
  }
};

Blockly.Blocks['arduino_motor_stop'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Stop motor')
      .appendField(new Blockly.FieldDropdown([['A', 'A'], ['B', 'B'], ['both', 'BOTH']]), 'MOTOR');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(20);
  }
};

Blockly.Blocks['arduino_stepper_step'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Stepper motor')
      .appendField(new Blockly.FieldDropdown([
        ['1 (8,9,10,11)', '1'], ['2 (4,5,6,7)', '2']
      ]), 'MOTOR');
    this.appendValueInput('STEPS').setCheck('Number').appendField('steps');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(290);
  }
};

Blockly.Blocks['arduino_stepper_speed'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('Stepper speed')
      .appendField(new Blockly.FieldDropdown([['1', '1'], ['2', '2']]), 'MOTOR');
    this.appendValueInput('RPM').setCheck('Number').appendField('RPM');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(290);
  }
};

Blockly.Blocks['arduino_rgb_led'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('RGB LED R')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']
      ]), 'PIN_R')
      .appendField('G')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']
      ]), 'PIN_G')
      .appendField('B')
      .appendField(new Blockly.FieldDropdown([
        ['3','3'],['5','5'],['6','6'],['9','9'],['10','10'],['11','11']
      ]), 'PIN_B');
    this.appendValueInput('R').setCheck('Number').appendField('red');
    this.appendValueInput('G').setCheck('Number').appendField('green');
    this.appendValueInput('B').setCheck('Number').appendField('blue');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(20);
  }
};

// === 18. Блок объявления переменной с типом ===
Blockly.Blocks['arduino_var_declare'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('declare')
      .appendField(new Blockly.FieldDropdown([
        ['int', 'int'], ['float', 'float'], ['long', 'long'],
        ['byte', 'byte'], ['bool', 'bool']
      ]), 'TYPE')
      .appendField(new Blockly.FieldTextInput('x'), 'VAR');
    this.appendValueInput('VALUE').appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
  }
};

// ============================================================
// === 19. LCD БЛОКИ (определены ОДИН РАЗ) ===
// ============================================================

Blockly.Blocks['lcd_begin'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCD.begin(')
      .appendField(new Blockly.FieldDropdown([['16', '16'], ['20', '20']]), 'COLS')
      .appendField(',')
      .appendField(new Blockly.FieldDropdown([['2', '2'], ['4', '4']]), 'ROWS')
      .appendField(')');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['lcd_set_cursor'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('LCD.setCursor(col')
      .appendField(new Blockly.FieldDropdown([
        ['0','0'],['1','1'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],
        ['8','8'],['9','9'],['10','10'],['11','11'],['12','12'],['13','13'],['14','14'],['15','15']
      ]), 'COL')
      .appendField(', row')
      .appendField(new Blockly.FieldDropdown([['0','0'],['1','1']]), 'ROW')
      .appendField(')');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['lcd_print'] = {
  init: function() {
    this.appendValueInput('TEXT').appendField('LCD.print');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

Blockly.Blocks['lcd_clear'] = {
  init: function() {
    this.appendDummyInput().appendField('LCD.clear()');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(160);
  }
};

// ============================================================
// === 20. ГЕНЕРАТОРЫ ARDUINO-БЛОКОВ ===
// ============================================================

arduinoGenerator.forBlock['arduino_setup'] = function(block) {
  let code = 'void setup() {\\n';
  let childBlock = block.getInputTargetBlock('DO');
  while (childBlock) {
    try {
      const childCode = arduinoGenerator.blockToCode(childBlock);
      if (Array.isArray(childCode)) code += '  ' + childCode[0] + '\\n';
      else if (childCode) code += '  ' + childCode;
    } catch (e) {
      code += '  // Error: ' + childBlock.type + '\\n';
    }
    childBlock = childBlock.getNextBlock();
  }
  code += '}\\n';
  return code;
};

arduinoGenerator.forBlock['arduino_loop'] = function(block) {
  let code = 'void loop() {\\n';
  let childBlock = block.getInputTargetBlock('DO');
  while (childBlock) {
    try {
      const childCode = arduinoGenerator.blockToCode(childBlock);
      if (Array.isArray(childCode)) code += '  ' + childCode[0] + '\\n';
      else if (childCode) code += '  ' + childCode;
    } catch (e) {
      code += '  // Error: ' + childBlock.type + '\\n';
    }
    childBlock = childBlock.getNextBlock();
  }
  code += '}\\n';
  return code;
};

arduinoGenerator.forBlock['arduino_pin_mode'] = function(block) {
  return 'pinMode(' + block.getFieldValue('PIN') + ', ' + block.getFieldValue('MODE') + ');\\n';
};

arduinoGenerator.forBlock['arduino_digital_write'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || 'LOW';
  return 'digitalWrite(' + block.getFieldValue('PIN') + ', ' + value + ');\\n';
};

arduinoGenerator.forBlock['arduino_digital_read'] = function(block) {
  return ['digitalRead(' + block.getFieldValue('PIN') + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_analog_write'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  return 'analogWrite(' + block.getFieldValue('PIN') + ', ' + value + ');\\n';
};

arduinoGenerator.forBlock['arduino_analog_read'] = function(block) {
  return ['analogRead(' + block.getFieldValue('PIN') + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_delay'] = function(block) {
  const ms = arduinoGenerator.valueToCode(block, 'MS', arduinoGenerator.ORDER_NONE) || '1000';
  return 'delay(' + ms + ');\\n';
};

arduinoGenerator.forBlock['arduino_serial_println'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '""';
  return 'Serial.println(' + value + ');\\n';
};

arduinoGenerator.forBlock['arduino_map'] = function(block) {
  const v = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  const fl = arduinoGenerator.valueToCode(block, 'FROM_LOW', arduinoGenerator.ORDER_NONE) || '0';
  const fh = arduinoGenerator.valueToCode(block, 'FROM_HIGH', arduinoGenerator.ORDER_NONE) || '1023';
  const tl = arduinoGenerator.valueToCode(block, 'TO_LOW', arduinoGenerator.ORDER_NONE) || '0';
  const th = arduinoGenerator.valueToCode(block, 'TO_HIGH', arduinoGenerator.ORDER_NONE) || '255';
  return ['map(' + v + ', ' + fl + ', ' + fh + ', ' + tl + ', ' + th + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_millis'] = function() {
  return ['millis()', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_random'] = function(block) {
  const max = arduinoGenerator.valueToCode(block, 'MAX', arduinoGenerator.ORDER_NONE) || '100';
  const min = arduinoGenerator.valueToCode(block, 'MIN', arduinoGenerator.ORDER_NONE) || '0';
  return ['random(' + min + ', ' + max + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_tone'] = function(block) {
  const freq = arduinoGenerator.valueToCode(block, 'FREQ', arduinoGenerator.ORDER_NONE) || '440';
  return 'tone(' + block.getFieldValue('PIN') + ', ' + freq + ');\\n';
};

arduinoGenerator.forBlock['arduino_no_tone'] = function(block) {
  return 'noTone(' + block.getFieldValue('PIN') + ');\\n';
};

arduinoGenerator.forBlock['arduino_motor_set'] = function(block) {
  const motor = block.getFieldValue('MOTOR');
  const speed = arduinoGenerator.valueToCode(block, 'SPEED', arduinoGenerator.ORDER_NONE) || '0';
  const dir = block.getFieldValue('DIR');
  const pins = motor === 'A' ? { en: 5, in1: 6, in2: 7 } : { en: 10, in1: 11, in2: 12 };
  const in1 = dir === 'FORWARD' ? 'HIGH' : 'LOW';
  const in2 = dir === 'FORWARD' ? 'LOW' : 'HIGH';
  return 'digitalWrite(' + pins.in1 + ', ' + in1 + ');\\ndigitalWrite(' + pins.in2 + ', ' + in2 + ');\\nanalogWrite(' + pins.en + ', ' + speed + ');\\n';
};

arduinoGenerator.forBlock['arduino_motor_stop'] = function(block) {
  const motor = block.getFieldValue('MOTOR');
  let code = '';
  if (motor === 'A' || motor === 'BOTH') code += 'analogWrite(5, 0);\\n';
  if (motor === 'B' || motor === 'BOTH') code += 'analogWrite(10, 0);\\n';
  return code;
};

arduinoGenerator.forBlock['arduino_stepper_step'] = function(block) {
  const steps = arduinoGenerator.valueToCode(block, 'STEPS', arduinoGenerator.ORDER_NONE) || '0';
  return '// stepper_step_' + block.getFieldValue('MOTOR') + '(' + steps + ');\\n';
};

arduinoGenerator.forBlock['arduino_stepper_speed'] = function(block) {
  const rpm = arduinoGenerator.valueToCode(block, 'RPM', arduinoGenerator.ORDER_NONE) || '10';
  return '// Stepper ' + block.getFieldValue('MOTOR') + ' speed: ' + rpm + ' RPM\\n';
};

arduinoGenerator.forBlock['arduino_rgb_led'] = function(block) {
  const r = arduinoGenerator.valueToCode(block, 'R', arduinoGenerator.ORDER_NONE) || '0';
  const g = arduinoGenerator.valueToCode(block, 'G', arduinoGenerator.ORDER_NONE) || '0';
  const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.ORDER_NONE) || '0';
  return 'analogWrite(' + block.getFieldValue('PIN_R') + ', ' + r + ');\\n' +
         'analogWrite(' + block.getFieldValue('PIN_G') + ', ' + g + ');\\n' +
         'analogWrite(' + block.getFieldValue('PIN_B') + ', ' + b + ');\\n';
};

arduinoGenerator.forBlock['arduino_var_declare'] = function(block) {
  const type = block.getFieldValue('TYPE');
  const varName = block.getFieldValue('VAR');
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  arduinoGenerator.definitions_['var_' + varName] = type + ' ' + varName + ' = ' + value + ';';
  return '';
};

// === 21. ГЕНЕРАТОРЫ LCD (определены ОДИН РАЗ) ===
arduinoGenerator.forBlock['lcd_begin'] = function(block) {
  return 'lcd.begin(' + block.getFieldValue('COLS') + ', ' + block.getFieldValue('ROWS') + ');\\n';
};

arduinoGenerator.forBlock['lcd_set_cursor'] = function(block) {
  return 'lcd.setCursor(' + block.getFieldValue('COL') + ', ' + block.getFieldValue('ROW') + ');\\n';
};

arduinoGenerator.forBlock['lcd_print'] = function(block) {
  let text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_NONE);
  if (!text) return 'lcd.print("");\\n';
  // Если это уже строка в двойных кавычках
  if (text.startsWith('"') && text.endsWith('"')) {
    return 'lcd.print(' + text + ');\\n';
  }
  // Если число или переменная — оборачиваем в String()
  if (!isNaN(parseFloat(text)) || /^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    return 'lcd.print(String(' + text + '));\\n';
  }
  // Иначе оборачиваем в кавычки
  return 'lcd.print("' + text.replace(/"/g, '\\\\"') + '");\\n';
};

arduinoGenerator.forBlock['lcd_clear'] = function() {
  return 'lcd.clear();\\n';
};

export { arduinoGenerator };
`;

// ============================================================
// === BlocklyEditor.jsx — ЧИСТАЯ ВЕРСИЯ ===
// ============================================================
const editorContent = `import { useEffect, useRef, useState } from 'react';
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
          kind: 'category', name: 'Arduino', colour: '0',
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
            { kind: 'block', type: 'arduino_var_declare' },
            { kind: 'block', type: 'lcd_begin' },
            { kind: 'block', type: 'lcd_set_cursor' },
            { kind: 'block', type: 'lcd_print' },
            { kind: 'block', type: 'lcd_clear' }
          ]
        },
        {
          kind: 'category', name: 'Numbers', colour: '230',
          contents: [
            { kind: 'block', type: 'math_number' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_single' },
            { kind: 'block', type: 'math_modulo' },
            { kind: 'block', type: 'math_constrain' },
            { kind: 'block', type: 'math_random_int' },
            { kind: 'block', type: 'math_change' }
          ]
        },
        {
          kind: 'category', name: 'Text', colour: '160',
          contents: [
            { kind: 'block', type: 'text' },
            { kind: 'block', type: 'text_join' },
            { kind: 'block', type: 'text_length' },
            { kind: 'block', type: 'text_print' }
          ]
        },
        {
          kind: 'category', name: 'Logic', colour: '210',
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'controls_ifelse' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'logic_operation' },
            { kind: 'block', type: 'logic_negate' },
            { kind: 'block', type: 'logic_boolean' },
            { kind: 'block', type: 'logic_ternary' }
          ]
        },
        {
          kind: 'category', name: 'Loops', colour: '120',
          contents: [
            { kind: 'block', type: 'controls_repeat_ext' },
            { kind: 'block', type: 'controls_repeat' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_for' },
            { kind: 'block', type: 'controls_forEach' },
            { kind: 'block', type: 'controls_flow_statements' }
          ]
        },
        {
          kind: 'category', name: 'Variables', colour: '330',
          custom: 'VARIABLE'
        },
        {
          kind: 'category', name: 'Lists', colour: '260',
          contents: [
            { kind: 'block', type: 'lists_create_empty' },
            { kind: 'block', type: 'lists_create_with' },
            { kind: 'block', type: 'lists_repeat' },
            { kind: 'block', type: 'lists_length' },
            { kind: 'block', type: 'lists_isEmpty' },
            { kind: 'block', type: 'lists_indexOf' },
            { kind: 'block', type: 'lists_getIndex' },
            { kind: 'block', type: 'lists_setIndex' }
          ]
        },
        {
          kind: 'category', name: 'Colour', colour: '20',
          contents: [
            { kind: 'block', type: 'simple_colour' },
            { kind: 'block', type: 'simple_colour_random' }
          ]
        },
        {
          kind: 'category', name: 'Functions', colour: '290',
          contents: [
            { kind: 'block', type: 'procedures_defnoreturn' },
            { kind: 'block', type: 'procedures_defreturn' },
            { kind: 'block', type: 'procedures_callnoreturn' },
            { kind: 'block', type: 'procedures_callreturn' }
          ]
        }
      ]
    };

    try {
      const workspace = Blockly.inject(containerRef.current, {
        toolbox: toolbox,
        grid: { spacing: 20, length: 3, colour: '#333', snap: true },
        zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.1 },
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true }
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

      // === Построение маппинга: номер строки -> ID блока ===
      const buildLineToBlockMap = () => {
        const map = {};
        try {
          const fullCode = arduinoGenerator.workspaceToCode(workspace);
          const allLines = fullCode.split('\\n');
          const allBlocks = workspace.getAllBlocks(false);

          for (const block of allBlocks) {
            if (block.type === 'arduino_setup' || block.type === 'arduino_loop') continue;
            if (!block.previousConnection && !block.outputConnection) continue;

            try {
              const codeResult = arduinoGenerator.blockToCode(block);
              const blockCode = Array.isArray(codeResult) ? codeResult[0] : codeResult;
              if (!blockCode || typeof blockCode !== 'string') continue;

              const blockLines = blockCode.split('\\n').filter(l => l.trim().length > 0);
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

      // === Подсветка блока по номеру строки ===
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

      // Глобальные функции для подсветки
      window.highlightBlocklyBlock = highlightBlockByLine;
      window.clearBlocklyHighlight = () => {
        if (workspaceRef.current) workspaceRef.current.highlightBlock(null);
      };
      window.rebuildBlockMap = buildLineToBlockMap;

      // Слушаем изменения
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

      // ResizeObserver
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
          Clear
        </button>
        <button onClick={showAllBlocks}
          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs"
          title="Show all blocks">
          Show all
        </button>
        <button onClick={exportBlocks}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs">
          Export
        </button>
        <label className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-xs cursor-pointer">
          Import
          <input type="file" accept=".json" className="hidden" onChange={importBlocks}/>
        </label>
        {status && <span className="text-xs text-green-400 ml-2">{status}</span>}
        <span className="text-xs text-slate-400 self-center ml-auto">
          Drag blocks from palette
        </span>
      </div>
      <div ref={containerRef} className="flex-1 w-full" style={{ minHeight: '500px' }}/>
    </div>
  );
}
`;

// ============================================================
// === ЗАПИСЬ ФАЙЛОВ ===
// ============================================================
const generatorPath = path.join(__dirname, 'src', 'components', 'Simulator', 'arduinoGenerator.js');
const editorPath = path.join(__dirname, 'src', 'components', 'Simulator', 'BlocklyEditor.jsx');

fs.writeFileSync(generatorPath, generatorContent, 'utf8');
fs.writeFileSync(editorPath, editorContent, 'utf8');

console.log('OK: arduinoGenerator.js ->', generatorPath);
console.log('OK: BlocklyEditor.jsx ->', editorPath);

// ============================================================
// === ПРОВЕРКИ ===
// ============================================================
console.log('\n=== arduinoGenerator.js checks ===');
const genFile = fs.readFileSync(generatorPath, 'utf8');
const genChecks = [
  ['NO "& &" syntax error', /& &/g, 0],
  ['NO broken quotes \'" "', /' "'/g, 0],
  ['NO broken quotes "\' "', /"' "/g, 0],
  ['lcd_begin defined ONCE', /Blockly\.Blocks\['lcd_begin'\]/g, 1],
  ['lcd_print defined ONCE', /Blockly\.Blocks\['lcd_print'\]/g, 1],
  ['lcd_set_cursor ONCE', /Blockly\.Blocks\['lcd_set_cursor'\]/g, 1],
  ['lcd_clear ONCE', /Blockly\.Blocks\['lcd_clear'\]/g, 1],
  ['HAS getVarName helper', /function getVarName/g, 1],
  ['HAS math_change', /arduinoGenerator\.forBlock\['math_change'\]/g, 1],
  ['HAS controls_repeat', /arduinoGenerator\.forBlock\['controls_repeat'\]/g, 1],
  ['HAS controls_repeat_ext', /arduinoGenerator\.forBlock\['controls_repeat_ext'\]/g, 1],
  ['HAS controls_forEach', /arduinoGenerator\.forBlock\['controls_forEach'\]/g, 1],
  ['HAS controls_flow_statements', /arduinoGenerator\.forBlock\['controls_flow_statements'\]/g, 1],
  ['HAS controls_ifelse', /arduinoGenerator\.forBlock\['controls_ifelse'\]/g, 1],
  ['HAS variables_get', /arduinoGenerator\.forBlock\['variables_get'\]/g, 1],
  ['HAS variables_set', /arduinoGenerator\.forBlock\['variables_set'\]/g, 1],
  ['HAS controls_for', /arduinoGenerator\.forBlock\['controls_for'\]/g, 1],
  ['HAS controls_whileUntil', /arduinoGenerator\.forBlock\['controls_whileUntil'\]/g, 1],
  ['HAS procedures_defnoreturn', /arduinoGenerator\.forBlock\['procedures_defnoreturn'\]/g, 1],
  ['HAS arduino_var_declare', /arduinoGenerator\.forBlock\['arduino_var_declare'\]/g, 1],
  ['NO variableDB_ in variables_get', /variables_get[\s\S]{0,300}variableDB_/g, 0],
  ['NO variableDB_ in variables_set', /variables_set[\s\S]{0,300}variableDB_/g, 0],
  ['NO variableDB_ in controls_for', /controls_for[\s\S]{0,300}variableDB_/g, 0],
  ['NO variableDB_ in math_change', /math_change[\s\S]{0,300}variableDB_/g, 0]
];

let allOk = true;
for (const [name, regex, expected] of genChecks) {
  const matches = genFile.match(regex);
  const count = matches ? matches.length : 0;
  const ok = count === expected;
  if (!ok) allOk = false;
  console.log(ok ? 'OK' : 'FAIL', '-', name, '(found: ' + count + ', expected: ' + expected + ')');
}

console.log('\n=== BlocklyEditor.jsx checks ===');
const editorFile = fs.readFileSync(editorPath, 'utf8');
const editorChecks = [
  ['NO "arduino_ setup" (with space)', /'arduino_ setup'/g, 0],
  ['NO "blo ck" (with space)', /'blo ck'/g, 0],
  ['NO "arduino_mil lis"', /'arduino_mil lis'/g, 0],
  ['NO "log ic_negate"', /'log ic_negate'/g, 0],
  ['NO "wh ileUntil"', /'wh ileUntil'/g, 0],
  ['NO "get Index"', /'get Index'/g, 0],
  ['NO "t ype"', /'t ype'/g, 0],
  ['NO "STORAG E_KEY"', /STORAG E_KEY/g, 0],
  ['NO "math_modu lo"', /'math_modu lo'/g, 0],
  ['NO "ar duino_stepper_speed"', /'ar duino_stepper_speed'/g, 0],
  ['NO "colo ur"', /'colo ur'/g, 0],
  ['NO "() = >" (broken arrow)', /\(\)\s*=\s*>/g, 0],
  ['NO "& &" (broken AND)', /& &/g, 0],
  ['HAS "arduino_setup"', /'arduino_setup'/g, 1],
  ['HAS "arduino_delay"', /'arduino_delay'/g, 1],
  ['HAS "arduino_millis"', /'arduino_millis'/g, 1],
  ['HAS "logic_negate"', /'logic_negate'/g, 1],
  ['HAS "controls_whileUntil"', /'controls_whileUntil'/g, 1],
  ['HAS "lists_getIndex"', /'lists_getIndex'/g, 1],
  ['HAS "STORAGE_KEY"', /STORAGE_KEY/g, 1],
  ['HAS "() =>" (correct arrow)', /\(\)\s*=>/g, 1],
  ['HAS "&&" (correct AND)', /&&/g, 1],
  ['HAS "buildLineToBlockMap"', /buildLineToBlockMap/g, 1],
  ['HAS "highlightBlockByLine"', /highlightBlockByLine/g, 1],
  ['HAS "window.highlightBlocklyBlock"', /window\.highlightBlocklyBlock/g, 1],
  ['HAS "lcd_begin" in toolbox', /lcd_begin/g, 1],
  ['HAS "lcd_print" in toolbox', /lcd_print/g, 1],
  ['HAS "arduino_var_declare" in toolbox', /arduino_var_declare/g, 1],
  ['HAS "math_change" in toolbox', /math_change/g, 1],
  ['HAS "controls_flow_statements" in toolbox', /controls_flow_statements/g, 1],
  ['HAS "controls_forEach" in toolbox', /controls_forEach/g, 1],
  ['HAS "procedures_defnoreturn" in toolbox', /procedures_defnoreturn/g, 1]
];

for (const [name, regex, expected] of editorChecks) {
  const matches = editorFile.match(regex);
  const count = matches ? matches.length : 0;
  const ok = count === expected;
  if (!ok) allOk = false;
  console.log(ok ? 'OK' : 'FAIL', '-', name, '(found: ' + count + ', expected: ' + expected + ')');
}

if (allOk) {
  console.log('\n✅ Все проверки пройдены!');
} else {
  console.log('\n❌ Некоторые проверки не пройдены');
}