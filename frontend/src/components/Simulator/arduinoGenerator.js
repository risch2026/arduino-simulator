import * as Blockly from 'blockly';




// ============================================================
// === 1. СОЗДАНИЕ ARDUINO-ГЕНЕРАТОРА ===
// ============================================================
const arduinoGenerator = new Blockly.Generator('Arduino');

// Зарезервированные слова Arduino
arduinoGenerator.addReservedWords(
  'HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,Serial,lcd,String,pow,sqrt,abs,log,log10,exp,' +
  'random,constrain,map,millis,analogRead,analogWrite,digitalRead,digitalWrite,' +
  'pinMode,delay,tone,noTone,int,float,long,byte,bool,void,return,if,else,for,while,' +
  'break,continue,const,switch,case,default,true,false,NULL'
);

// Приоритеты операторов (стандарт C++)
arduinoGenerator.ORDER_ATOMIC = 0;
arduinoGenerator.ORDER_UNARY_POSTFIX = 1;
arduinoGenerator.ORDER_UNARY_PREFIX = 2;
arduinoGenerator.ORDER_MULTIPLICATIVE = 3;
arduinoGenerator.ORDER_ADDITIVE = 4;
arduinoGenerator.ORDER_SHIFT = 5;
arduinoGenerator.ORDER_RELATIONAL = 6;
arduinoGenerator.ORDER_EQUALITY = 7;
arduinoGenerator.ORDER_BITWISE_AND = 8;
arduinoGenerator.ORDER_BITWISE_XOR = 9;
arduinoGenerator.ORDER_BITWISE_OR = 10;
arduinoGenerator.ORDER_LOGICAL_AND = 11;
arduinoGenerator.ORDER_LOGICAL_OR = 12;
arduinoGenerator.ORDER_CONDITIONAL = 13;
arduinoGenerator.ORDER_ASSIGNMENT = 14;
arduinoGenerator.ORDER_COMMA = 15;
arduinoGenerator.ORDER_NONE = 99;

// ============================================================
// === 2. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПЕРЕМЕННЫХ ===
// ============================================================
// В Blockly v10+ getFieldValue('VAR') возвращает UUID, а не имя
// Используем variableDB_ генератора — это стандартный API, работающий во всех версиях
// ============================================================
function getVarName(block) {
  const varId = block.getFieldValue('VAR');
  if (!varId) return 'x';
  
  // Ищем переменную в workspace
  const ws = block.workspace;
  if (ws && ws.getVariableById) {
    const variable = ws.getVariableById(varId);
    if (variable) return variable.name;
  }
  
  // Fallback: если это уже имя
  if (/^[A-Za-z_]\w*$/.test(varId)) {
    return varId;
  }
  
  return 'var_' + varId.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ============================================================
// === 3. БЛОКИ ПЕРЕМЕННЫХ ===
// ============================================================

// --- Объявление переменной с типом ---
Blockly.Blocks['arduino_var_declare'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('объявить')
      .appendField(new Blockly.FieldDropdown([
        ['int', 'int'], ['float', 'float'], ['long', 'long'],
        ['byte', 'byte'], ['bool', 'bool'], ['char', 'char']
      ]), 'TYPE')
      .appendField(new Blockly.FieldTextInput('x'), 'VAR');
    this.appendValueInput('VALUE').appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
    this.setTooltip('Объявить переменную с типом');
  }
};

arduinoGenerator.forBlock['arduino_var_declare'] = function(block) {
  const type = block.getFieldValue('TYPE');
  const varName = block.getFieldValue('VAR');
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  arduinoGenerator.definitions_['var_' + varName] = type + ' ' + varName + ' = ' + value + ';';
  return  type + ' ' + varName + ' = ' + value + ';\n';
};

// --- Объявление константы ---
Blockly.Blocks['arduino_const_declare'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('const')
      .appendField(new Blockly.FieldDropdown([
        ['int', 'int'], ['float', 'float'], ['long', 'long'],
        ['byte', 'byte'], ['bool', 'bool']
      ]), 'TYPE')
      .appendField(new Blockly.FieldTextInput('MAX_VALUE'), 'NAME');
    this.appendValueInput('VALUE').appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
    this.setTooltip('Объявить константу');
  }
};

arduinoGenerator.forBlock['arduino_const_declare'] = function(block) {
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  arduinoGenerator.definitions_['const_' + name] = 'const ' + type + ' ' + name + ' = ' + value + ';';
  return  'const ' + type + ' ' + name + ' = ' + value + ';\n';
};

// --- Объявление массива ---
Blockly.Blocks['arduino_array_declare'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('массив')
      .appendField(new Blockly.FieldDropdown([
        ['int', 'int'], ['float', 'float'], ['long', 'long'],
        ['byte', 'byte'], ['bool', 'bool']
      ]), 'TYPE')
      .appendField(new Blockly.FieldTextInput('arr'), 'NAME')
      .appendField('[')
      .appendField(new Blockly.FieldTextInput('10'), 'SIZE')
      .appendField(']');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
    this.setTooltip('Объявить массив');
  }
};

arduinoGenerator.forBlock['arduino_array_declare'] = function(block) {
  const type = block.getFieldValue('TYPE');
  const name = block.getFieldValue('NAME');
  const size = block.getFieldValue('SIZE');
  arduinoGenerator.definitions_['array_' + name] = type + ' ' + name + '[' + size + '];';
  return type + ' ' + name + '[' + size + '];\n';
};

// --- Чтение элемента массива ---
Blockly.Blocks['arduino_array_get'] = {
  init: function() {
    this.appendValueInput('INDEX')
      .setCheck('Number')
      .appendField('массив')
      .appendField(new Blockly.FieldTextInput('arr'), 'NAME')
      .appendField('[');
    this.appendDummyInput().appendField(']');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(330);
    this.setTooltip('Получить элемент массива');
  }
};

arduinoGenerator.forBlock['arduino_array_get'] = function(block) {
  const name = block.getFieldValue('NAME');
  const index = arduinoGenerator.valueToCode(block, 'INDEX', arduinoGenerator.ORDER_NONE) || '0';
  return name + '[' + index + ']';
};

// --- Запись элемента массива ---
Blockly.Blocks['arduino_array_set'] = {
  init: function() {
    this.appendValueInput('INDEX')
      .setCheck('Number')
      .appendField('массив')
      .appendField(new Blockly.FieldTextInput('arr'), 'NAME')
      .appendField('[');
    this.appendValueInput('VALUE')
      .appendField('] =');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
    this.setTooltip('Записать значение в элемент массива');
  }
};

arduinoGenerator.forBlock['arduino_array_set'] = function(block) {
  const name = block.getFieldValue('NAME');
  const index = arduinoGenerator.valueToCode(block, 'INDEX', arduinoGenerator.ORDER_NONE) || '0';
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  return name + '[' + index + '] = ' + value + ';\n';
};

// --- Чтение переменной ---

Blockly.Blocks['variables_get'] = {
  init: function() {
     this.appendDummyInput()
      .appendField('Получить переменную')
      
      .appendField(new Blockly.FieldTextInput('x'), 'VAR');
      this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(330);
    this.setTooltip('Получить переменную');
  }
};

arduinoGenerator.forBlock['variables_get'] = function(block) {
  const varName = block.getFieldValue('VAR');
   arduinoGenerator.definitions_['var_' + varName];
    return varName;
};


// --- Запись переменной ---
Blockly.Blocks['variables_set'] = {
  init: function() {
    this.appendDummyInput()
      .appendField('set')
    
      .appendField(new Blockly.FieldTextInput('x'), 'VALUE');
    this.appendValueInput('VALUE').appendField('=');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(330);
    this.setTooltip('set');
  }
};


arduinoGenerator.forBlock['variables_set'] = function(block) {
  const arg = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
  const varName = block.getFieldValue('VALUE');
  // Автоматическое объявление переменной, если её ещё нет
  if (!arduinoGenerator.definitions_['var_' + varName]) {
    arduinoGenerator.definitions_['var_' + varName] = 'int ' + varName + ';';
  }
  return varName + ' = ' + arg + ';\n';
};

// --- Изменение переменной на величину (item += delta) ---

Blockly.Blocks['math_change'] = {
  init: function() {
     this.appendDummyInput()
      .appendField('Увеличить переменную')
      .appendField(new Blockly.FieldTextInput('x'), 'VAR')
      .appendField('+')
     this.appendValueInput('DELTA')
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setColour(330);
    this.setTooltip('Увеличить переменную');
  }
};

arduinoGenerator.forBlock['math_change'] = function(block) {


  const varName = block.getFieldValue('VAR');
  const delta = arduinoGenerator.valueToCode(block, 'DELTA', arduinoGenerator.ORDER_ADDITIVE) || '1';
  if (!arduinoGenerator.definitions_['var_' + varName]) {
    arduinoGenerator.definitions_['var_' + varName] = 'int ' + varName + ' = 0;';
  }
  return varName + ' = ' + varName + ' + ' + delta + ';\n';
};

// ============================================================
// === 4. ЧИСЛА ===
// ============================================================

arduinoGenerator.forBlock['math_number'] = function(block) {
  const code = String(block.getFieldValue('NUM'));
  const order = code.indexOf('.') !== -1 || code.indexOf('e') !== -1
    ? arduinoGenerator.ORDER_ATOMIC
    : arduinoGenerator.ORDER_ATOMIC;
  return [code, order];
};

arduinoGenerator.forBlock['math_arithmetic'] = function(block) {
  const op = block.getFieldValue('OP');
  const a = arduinoGenerator.valueToCode(block, 'A', arduinoGenerator.ORDER_NONE) || '0';
  const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.ORDER_NONE) || '0';
  
  if (op === 'POWER') {
    return ['pow(' + a + ', ' + b + ')', arduinoGenerator.ORDER_NONE];
  }
  
  const ops = {
    'ADD': [' + ', arduinoGenerator.ORDER_ADDITIVE],
    'MINUS': [' - ', arduinoGenerator.ORDER_ADDITIVE],
    'MULTIPLY': [' * ', arduinoGenerator.ORDER_MULTIPLICATIVE],
    'DIVIDE': [' / ', arduinoGenerator.ORDER_MULTIPLICATIVE]
  };
  
  const tuple = ops[op] || [' + ', arduinoGenerator.ORDER_ADDITIVE];
  return [a + tuple[0] + b, tuple[1]];
};

arduinoGenerator.forBlock['math_single'] = function(block) {
  const op = block.getFieldValue('OP');
  const arg = arduinoGenerator.valueToCode(block, 'NUM', arduinoGenerator.ORDER_NONE) || '0';
  
  const funcs = {
    'ROOT': 'sqrt(' + arg + ')',
    'ABS': 'abs(' + arg + ')',
    'NEG': '-' + arg,
    'LN': 'log(' + arg + ')',
    'LOG10': 'log10(' + arg + ')',
    'EXP': 'exp(' + arg + ')',
    'POW10': 'pow(10, ' + arg + ')'
  };
  
  const code = funcs[op] || '0';
  return [code, op === 'NEG' ? arduinoGenerator.ORDER_UNARY_PREFIX : arduinoGenerator.ORDER_NONE];
};

arduinoGenerator.forBlock['math_modulo'] = function(block) {
  const a = arduinoGenerator.valueToCode(block, 'DIVIDEND', arduinoGenerator.ORDER_NONE) || '0';
  const b = arduinoGenerator.valueToCode(block, 'DIVISOR', arduinoGenerator.ORDER_NONE) || '0';
  return [a + ' % ' + b, arduinoGenerator.ORDER_MULTIPLICATIVE];
};

arduinoGenerator.forBlock['math_constrain'] = function(block) {
  const val = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  const low = arduinoGenerator.valueToCode(block, 'LOW', arduinoGenerator.ORDER_NONE) || '0';
  const high = arduinoGenerator.valueToCode(block, 'HIGH', arduinoGenerator.ORDER_NONE) || '0';
  return ['constrain(' + val + ', ' + low + ', ' + high + ')', arduinoGenerator.ORDER_NONE];
};

arduinoGenerator.forBlock['math_random_int'] = function(block) {
  const from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_NONE) || '0';
  const to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_NONE) || '0';
  return ['random(' + from + ', ' + to + ')', arduinoGenerator.ORDER_NONE];
};

// ============================================================
// === 5. ЛОГИКА ===
// ============================================================

arduinoGenerator.forBlock['logic_compare'] = function(block) {
  const ops = {
    'EQ': ' == ', 'NEQ': ' != ',
    'LT': ' < ', 'LTE': ' <= ',
    'GT': ' > ', 'GTE': ' >= '
  };
  const op = ops[block.getFieldValue('OP')] || ' == ';
  const a = arduinoGenerator.valueToCode(block, 'A', arduinoGenerator.ORDER_RELATIONAL) || '0';
  const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.ORDER_RELATIONAL) || '0';
  return [a + op + b, arduinoGenerator.ORDER_EQUALITY];
};

arduinoGenerator.forBlock['logic_operation'] = function(block) {
  const op = block.getFieldValue('OP') === 'AND' ? ' && ' : ' || ';
  const order = block.getFieldValue('OP') === 'AND'
    ? arduinoGenerator.ORDER_LOGICAL_AND
    : arduinoGenerator.ORDER_LOGICAL_OR;
  const a = arduinoGenerator.valueToCode(block, 'A', order) || 'false';
  const b = arduinoGenerator.valueToCode(block, 'B', order) || 'false';
  return [a + op + b, order];
};

arduinoGenerator.forBlock['logic_negate'] = function(block) {
  const arg = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_UNARY_PREFIX) || 'false';
  return ['!' + arg, arduinoGenerator.ORDER_UNARY_PREFIX];
};

arduinoGenerator.forBlock['logic_boolean'] = function(block) {
  return [block.getFieldValue('BOOL') === 'TRUE' ? 'true' : 'false', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['logic_ternary'] = function(block) {
  const cond = arduinoGenerator.valueToCode(block, 'IF', arduinoGenerator.ORDER_CONDITIONAL) || 'false';
  const then = arduinoGenerator.valueToCode(block, 'THEN', arduinoGenerator.ORDER_CONDITIONAL) || '0';
  const otherwise = arduinoGenerator.valueToCode(block, 'ELSE', arduinoGenerator.ORDER_CONDITIONAL) || '0';
  return [cond + ' ? ' + then + ' : ' + otherwise, arduinoGenerator.ORDER_CONDITIONAL];
};

// ============================================================
// === 6. ТЕКСТ ===
// ============================================================

arduinoGenerator.forBlock['text'] = function(block) {
  const text = block.getFieldValue('TEXT')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return ['"' + text + '"', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['text_join'] = function(block) {
  if (block.itemCount_ === 0) return ['""', arduinoGenerator.ORDER_ATOMIC];
  const elems = [];
  for (let i = 0; i < block.itemCount_; i++) {
    elems.push(arduinoGenerator.valueToCode(block, 'ADD' + i, arduinoGenerator.ORDER_NONE) || '""');
  }
  if (elems.length === 1) return ['String(' + elems[0] + ')', arduinoGenerator.ORDER_NONE];
  return [elems.map(e => 'String(' + e + ')').join(' + '), arduinoGenerator.ORDER_NONE];
};

arduinoGenerator.forBlock['text_length'] = function(block) {
  const text = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '""';
  return ['String(' + text + ').length()', arduinoGenerator.ORDER_UNARY_POSTFIX];
};

arduinoGenerator.forBlock['text_print'] = function(block) {
  const msg = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_NONE) || '""';
  return 'Serial.println(' + msg + ');\n';
};

// ============================================================
// === 7. УСЛОВИЯ И ЦИКЛЫ ===
// ============================================================

// --- if / else if / else ---
arduinoGenerator.forBlock['controls_if'] = function(block) {
  let code = '';
  const n = 1 + (block.elseifCount_ || 0);
  for (let i = 0; i < n; i++) {
    const cond = arduinoGenerator.valueToCode(block, 'IF' + i, arduinoGenerator.ORDER_NONE) || 'false';
    const branch = arduinoGenerator.statementToCode(block, 'DO' + i);
    if (i === 0) {
      code += 'if (' + cond + ') {\n' + branch + '}';
    } else {
      code += ' else if (' + cond + ') {\n' + branch + '}';
    }
  }
  if (block.elseCount_) {
    const branch = arduinoGenerator.statementToCode(block, 'ELSE');
    code += ' else {\n' + branch + '}';
  }
  return code + '\n';
};

// --- if else (отдельный блок) ---
arduinoGenerator.forBlock['controls_ifelse'] = function(block) {
  const cond = arduinoGenerator.valueToCode(block, 'IF', arduinoGenerator.ORDER_NONE) || 'false';
  const thenBranch = arduinoGenerator.statementToCode(block, 'DO');
  const elseBranch = arduinoGenerator.statementToCode(block, 'ELSE');
  return 'if (' + cond + ') {\n' + thenBranch + '} else {\n' + elseBranch + '}\n';
};




// --- repeat N times (фиксированное число) ---
arduinoGenerator.forBlock['controls_repeat'] = function(block) {
  const times = String(block.getFieldValue('TIMES') || '0');
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int count = 0; count < ' + times + '; count++) {\n' + branch + '}\n';
};

// --- repeat N times (переменное число) ---
arduinoGenerator.forBlock['controls_repeat_ext'] = function(block) {
  const times = arduinoGenerator.valueToCode(block, 'TIMES', arduinoGenerator.ORDER_NONE) || '0';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int count = 0; count < ' + times + '; count++) {\n' + branch + '}\n';
};

// --- while / until ---
arduinoGenerator.forBlock['controls_whileUntil'] = function(block) {
  const until = block.getFieldValue('MODE') === 'UNTIL';
  const cond = arduinoGenerator.valueToCode(block, 'BOOL', arduinoGenerator.ORDER_NONE) || 'false';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  if (until) {
    return 'while (!(' + cond + ')) {\n' + branch + '}\n';
  }
  return 'while (' + cond + ') {\n' + branch + '}\n';
};




// --- for с счётчиком ---
// controls_for - цикл for
arduinoGenerator.forBlock['controls_for'] = function(block) {
  const varName = getVarName(block) ;  // ← используем getVarName
  const from = arduinoGenerator.valueToCode(block, 'FROM', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
  const to = arduinoGenerator.valueToCode(block, 'TO', arduinoGenerator.ORDER_ASSIGNMENT) || '0';
  const step = arduinoGenerator.valueToCode(block, 'BY', arduinoGenerator.ORDER_ASSIGNMENT) || '1';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return 'for (int ' + varName + ' = ' + from + '; ' + varName + ' <= ' + to + '; ' + varName + ' += ' + step + ') {\n' + branch + '}\n';
};



// --- for each (цикл по списку) ---
arduinoGenerator.forBlock['controls_forEach'] = function(block) {
  const varName = getVarName(block);
  const list = arduinoGenerator.valueToCode(block, 'LIST', arduinoGenerator.ORDER_NONE) || 'arr';
  const branch = arduinoGenerator.statementToCode(block, 'DO');
  return '// forEach не поддерживается напрямую в Arduino\n' +
         'for (int ' + varName + ' = 0; ' + varName + ' < sizeof(' + list + ')/sizeof(' + list + '[0]); ' + varName + '++) {\n' + branch + '}\n';
};

// --- break / continue ---
arduinoGenerator.forBlock['controls_flow_statements'] = function(block) {
  const flow = block.getFieldValue('FLOW');
  if (flow === 'BREAK') return 'break;\n';
  if (flow === 'CONTINUE') return 'continue;\n';
  return '';
};

// ============================================================
// === 8. ФУНКЦИИ (ПРОЦЕДУРЫ) ===
// ============================================================

arduinoGenerator.forBlock['procedures_defnoreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  const branch = arduinoGenerator.statementToCode(block, 'STACK');
  arduinoGenerator.definitions_['func_' + funcName] = 'void ' + funcName + '() {\n' + branch + '}\n';
  return '';
};

arduinoGenerator.forBlock['procedures_defreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  const branch = arduinoGenerator.statementToCode(block, 'STACK');
  const returnValue = arduinoGenerator.valueToCode(block, 'RETURN', arduinoGenerator.ORDER_NONE) || '0';
  arduinoGenerator.definitions_['func_' + funcName] = 'int ' + funcName + '() {\n' + branch + '  return ' + returnValue + ';\n}\n';
  return '';
};

arduinoGenerator.forBlock['procedures_callnoreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  return funcName + '();\n';
};

arduinoGenerator.forBlock['procedures_callreturn'] = function(block) {
  const funcName = block.getFieldValue('NAME') || 'myFunc';
  return [funcName + '()', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['procedures_ifreturn'] = function(block) {
  const condition = arduinoGenerator.valueToCode(block, 'CONDITION', arduinoGenerator.ORDER_NONE) || 'false';
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  return 'if (' + condition + ') return ' + value + ';\n';
};

// ============================================================
// === 9. ЦВЕТ (простые блоки) ===
// ============================================================

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
// === 10. ARDUINO БЛОКИ ===
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

// ============================================================
// === 11. LCD БЛОКИ (определены ОДИН РАЗ) ===
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
// === 12. ГЕНЕРАТОРЫ ARDUINO БЛОКОВ ===
// ============================================================

// --- Setup / Loop (с обходом цепочки) ---
arduinoGenerator.forBlock['arduino_setup'] = function(block) {
  let code = 'void setup() {\n';
  let childBlock = block.getInputTargetBlock('DO');
  while (childBlock) {
    try {
      const childCode = arduinoGenerator.blockToCode(childBlock);
      if (Array.isArray(childCode)) code += '  ' + childCode[0] + '\n';
      else if (childCode) code += '  ' + childCode;
    } catch (e) {
      code += '  // Error: ' + childBlock.type + '\n';
    }
    childBlock = childBlock.getNextBlock();
  }
  code += '}\n';
  return code;
};

arduinoGenerator.forBlock['arduino_loop'] = function(block) {
  let code = 'void loop() {\n';
  let childBlock = block.getInputTargetBlock('DO');
  while (childBlock) {
    try {
      const childCode = arduinoGenerator.blockToCode(childBlock);
      if (Array.isArray(childCode)) code += '  ' + childCode[0] + '\n';
      else if (childCode) code += '  ' + childCode;
    } catch (e) {
      code += '  // Error: ' + childBlock.type + '\n';
    }
    childBlock = childBlock.getNextBlock();
  }
  code += '}\n';
  return code;
};

arduinoGenerator.forBlock['arduino_pin_mode'] = function(block) {
  return 'pinMode(' + block.getFieldValue('PIN') + ', ' + block.getFieldValue('MODE') + ');\n';
};

arduinoGenerator.forBlock['arduino_digital_write'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || 'LOW';
  return 'digitalWrite(' + block.getFieldValue('PIN') + ', ' + value + ');\n';
};

arduinoGenerator.forBlock['arduino_digital_read'] = function(block) {
  return ['digitalRead(' + block.getFieldValue('PIN') + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_analog_write'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '0';
  return 'analogWrite(' + block.getFieldValue('PIN') + ', ' + value + ');\n';
};

arduinoGenerator.forBlock['arduino_analog_read'] = function(block) {
  return ['analogRead(' + block.getFieldValue('PIN') + ')', arduinoGenerator.ORDER_ATOMIC];
};

arduinoGenerator.forBlock['arduino_delay'] = function(block) {
  const ms = arduinoGenerator.valueToCode(block, 'MS', arduinoGenerator.ORDER_NONE) || '1000';
  return 'delay(' + ms + ');\n';
};

arduinoGenerator.forBlock['arduino_serial_println'] = function(block) {
  const value = arduinoGenerator.valueToCode(block, 'VALUE', arduinoGenerator.ORDER_NONE) || '""';
  return 'Serial.println(' + value + ');\n';
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
  return 'tone(' + block.getFieldValue('PIN') + ', ' + freq + ');\n';
};

arduinoGenerator.forBlock['arduino_no_tone'] = function(block) {
  return 'noTone(' + block.getFieldValue('PIN') + ');\n';
};

arduinoGenerator.forBlock['arduino_motor_set'] = function(block) {
  const motor = block.getFieldValue('MOTOR');
  const speed = arduinoGenerator.valueToCode(block, 'SPEED', arduinoGenerator.ORDER_NONE) || '0';
  const dir = block.getFieldValue('DIR');
  const pins = motor === 'A' ? { en: 5, in1: 6, in2: 7 } : { en: 10, in1: 11, in2: 12 };
  const in1 = dir === 'FORWARD' ? 'HIGH' : 'LOW';
  const in2 = dir === 'FORWARD' ? 'LOW' : 'HIGH';
  return 'digitalWrite(' + pins.in1 + ', ' + in1 + ');\ndigitalWrite(' + pins.in2 + ', ' + in2 + ');\nanalogWrite(' + pins.en + ', ' + speed + ');\n';
};

arduinoGenerator.forBlock['arduino_motor_stop'] = function(block) {
  const motor = block.getFieldValue('MOTOR');
  let code = '';
  if (motor === 'A' || motor === 'BOTH') code += 'analogWrite(5, 0);\n';
  if (motor === 'B' || motor === 'BOTH') code += 'analogWrite(10, 0);\n';
  return code;
};

arduinoGenerator.forBlock['arduino_stepper_step'] = function(block) {
  const steps = arduinoGenerator.valueToCode(block, 'STEPS', arduinoGenerator.ORDER_NONE) || '0';
  return '// stepper_step_' + block.getFieldValue('MOTOR') + '(' + steps + ');\n';
};

arduinoGenerator.forBlock['arduino_stepper_speed'] = function(block) {
  const rpm = arduinoGenerator.valueToCode(block, 'RPM', arduinoGenerator.ORDER_NONE) || '10';
  return '// Stepper ' + block.getFieldValue('MOTOR') + ' speed: ' + rpm + ' RPM\n';
};

arduinoGenerator.forBlock['arduino_rgb_led'] = function(block) {
  const r = arduinoGenerator.valueToCode(block, 'R', arduinoGenerator.ORDER_NONE) || '0';
  const g = arduinoGenerator.valueToCode(block, 'G', arduinoGenerator.ORDER_NONE) || '0';
  const b = arduinoGenerator.valueToCode(block, 'B', arduinoGenerator.ORDER_NONE) || '0';
  return 'analogWrite(' + block.getFieldValue('PIN_R') + ', ' + r + ');\n' +
         'analogWrite(' + block.getFieldValue('PIN_G') + ', ' + g + ');\n' +
         'analogWrite(' + block.getFieldValue('PIN_B') + ', ' + b + ');\n';
};

// ============================================================
// === 13. ГЕНЕРАТОРЫ LCD ===
// ============================================================

arduinoGenerator.forBlock['lcd_begin'] = function(block) {
  return 'lcd.begin(' + block.getFieldValue('COLS') + ', ' + block.getFieldValue('ROWS') + ');\n';
};

arduinoGenerator.forBlock['lcd_set_cursor'] = function(block) {
  return 'lcd.setCursor(' + block.getFieldValue('COL') + ', ' + block.getFieldValue('ROW') + ');\n';
};

arduinoGenerator.forBlock['lcd_print'] = function(block) {
  let text = arduinoGenerator.valueToCode(block, 'TEXT', arduinoGenerator.ORDER_NONE);
  if (!text) return 'lcd.print("");\n';
  
  // Если это уже строка в двойных кавычках — оставляем как есть
  if (text.startsWith('"') && text.endsWith('"')) {
    return 'lcd.print(' + text + ');\n';
  }
  
  // Если число или переменная — оборачиваем в String()
  if (!isNaN(parseFloat(text)) || /^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    return 'lcd.print(String(' + text + '));\n';
  }
  
  // Иначе оборачиваем в кавычки
  return 'lcd.print("' + text.replace(/"/g, '\\"') + '");\n';
};

arduinoGenerator.forBlock['lcd_clear'] = function() {
  return 'lcd.clear();\n';
};

// ============================================================
// === 14. ЭКСПОРТ ===
// ============================================================

export { arduinoGenerator };
