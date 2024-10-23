import * as Blockly from 'blockly/core';

interface MachineLearningModel {
  getSuggestedBlocks(description: string): Array<Blockly.Block>;

  train(data: {description: string; blocks: Array<Blockly.Block>}[]): void;
}

export default MachineLearningModel;
