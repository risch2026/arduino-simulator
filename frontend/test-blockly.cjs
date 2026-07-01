const Blockly = require('blockly');
const jsGen = require('blockly/javascript');

console.log('Blockly version:', Blockly.VERSION);
console.log('javascriptGenerator:', typeof jsGen.javascriptGenerator);
console.log('javascriptGenerator.forBlock:', typeof jsGen.javascriptGenerator?.forBlock);
console.log('math_number in forBlock:', !!jsGen.javascriptGenerator?.forBlock?.math_number);
console.log('text in forBlock:', !!jsGen.javascriptGenerator?.forBlock?.text);
console.log('text_print in forBlock:', !!jsGen.javascriptGenerator?.forBlock?.text_print);