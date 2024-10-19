import * as Blockly from 'blockly/core';

interface MachineLearningModel {
  getSuggestedBlocks(description: string): Blockly.Block[];

  train(data: {description: string; blocks: Blockly.Block[]}[]): void;
}

export default MachineLearningModel;
