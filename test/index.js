/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Plugin test.
 */

import * as Blockly from 'blockly';
import {toolboxCategories, createPlayground} from '@blockly/dev-tools';
import * as SuggestedBlocks from '../src/index';
import trainingData from './training_data.json';
import NaiveBayesClassifier from '../src/NaiveBayesClassifier';

/**
 * Create blocks from JSON array.
 * @param {Array<Object>} blockJsonArray The JSON block definitions.
 * @returns {Array<Blockly.Block>} The created blocks.
 */
function createBlocksFromJson(blockJsonArray) {
  const tempDiv = document.createElement('div');

  const tempWorkspace = Blockly.inject(tempDiv, {
    toolbox: {
      kind: 'categoryToolbox',
      contents: [],
    },
  });

  const workspaceData = {blocks: {blocks: blockJsonArray}};
  Blockly.serialization.workspaces.load(workspaceData, tempWorkspace);

  const blocks = tempWorkspace.getAllBlocks();

  tempWorkspace.dispose();
  tempDiv.remove();

  return blocks;
}
const transformedData = trainingData.map((item, index) => {
  return {
    description: item.description,
    blocks: createBlocksFromJson(item.blocks.blocks),
  };
});

const NaiveBayes = new NaiveBayesClassifier({});
NaiveBayes.train(transformedData);
console.log('Training completed with', transformedData.length, 'examples');

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = SuggestedBlocks.init(blocklyDiv, options);
  return workspace;
}

const customTheme = Blockly.Theme.defineTheme('classic_with_suggestions', {
  name: 'classic_with_suggestions',
  base: Blockly.Themes.Classic,
  blockStyles: {},
  categoryStyles: {
    frequently_used_category: {colour: '60'},
    recently_used_category: {colour: '60'},
    ai_suggestion_category: {colour: '60'},
  },
  componentStyles: {},
  fontStyle: {},
  startHats: null,
});

document.addEventListener('DOMContentLoaded', async function () {
  // Insert two new categories
  toolboxCategories['contents'].push({
    kind: 'category',
    name: 'Frequently Used',
    custom: 'MOST_USED',
    categorystyle: 'frequently_used_category',
  });
  toolboxCategories['contents'].push({
    kind: 'category',
    name: 'Recently Used',
    custom: 'RECENTLY_USED',
    categorystyle: 'recently_used_category',
  });
  toolboxCategories['contents'].push({
    kind: 'category',
    name: 'AI suggested',
    custom: 'AI_SUGGESTED',
    categorystyle: 'ai_suggestion_category',
  });
  const defaultOptions = {
    toolbox: toolboxCategories,
    theme: customTheme,
  };

  const playground = await createPlayground(
    document.getElementById('root'),
    createWorkspace,
    defaultOptions,
  );

  const testWorkspace = playground.getWorkspace();
  const suggestor = SuggestedBlocks.suggestorLookup?.get(testWorkspace);

  if (suggestor) {
    suggestor.setModel(NaiveBayes);
  } else {
    console.error('Suggestor not found on workspace');
  }

  const testDescription = 'print text';
  const suggestions = NaiveBayes.getSuggestedBlocks(
    testDescription,
    testWorkspace,
  );
  console.log(
    'Suggested blocks:',
    suggestions.map((block) => block.type),
  );

  // Fire a FINISHED_LOADING event again after the playground loads.
  // This may be fired if there is saved JSON in the advanced playground.
  // But we need it to fire even if there's no saved JSON and therefore deserialization was never called.
  Blockly.Events.fire(
    new (Blockly.Events.get(Blockly.Events.FINISHED_LOADING))(
      playground.getWorkspace(),
    ),
  );
});
