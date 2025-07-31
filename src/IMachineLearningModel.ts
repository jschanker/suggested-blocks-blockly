import * as Blockly from 'blockly/core';

interface MachineLearningModel {
  getSuggestedBlocks(
    description: string,
    workspace: Blockly.Workspace,
  ): Blockly.Block[];

  train(data: Array<{description: string; blocks: Blockly.Block[]}>): void;
}

export default MachineLearningModel;
