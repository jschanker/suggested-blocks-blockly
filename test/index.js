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
import trainingData from './training_data_kd.json';
import NaiveBayesClassifier from '../src/NaiveBayesClassifier';

/**
 * Create a workspace.
 * @param {HTMLElement} blocklyDiv The blockly container div.
 * @param {!Blockly.BlocklyOptions} options The Blockly options.
 * @returns {!Blockly.WorkspaceSvg} The created workspace.
 */
function createWorkspace(blocklyDiv, options) {
  const workspace = Blockly.inject(blocklyDiv, options);
  SuggestedBlocks.init(workspace);
  return SuggestedBlocks.init(blocklyDiv, options);
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

/**
 * Creates Blockly block instances from JSON block definitions by making a temporary workspace.
 * @param {Array} blockJsonArray - Array of JSON objects representing block definitions.
 * @returns {Array} Array of Blockly block instances.
 */
function createBlocksFromJson(blockJsonArray) {
  const tempDiv = document.createElement('div');
  const tempWorkspace = Blockly.inject(tempDiv, {toolbox: toolboxCategories});

  const workspaceData = {blocks: {blocks: blockJsonArray}};
  Blockly.serialization.workspaces.load(workspaceData, tempWorkspace);

  const blocks = tempWorkspace.getAllBlocks();
  tempWorkspace.dispose();
  tempDiv.remove();
  return blocks;
}

const transformedData = trainingData.map((item) => ({
  description: item.description,
  blocks: createBlocksFromJson(item.blocks.blocks),
}));

const NaiveBayes = new NaiveBayesClassifier({});
NaiveBayes.train(transformedData);
console.log('Training completed with', transformedData.length, 'examples');

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
