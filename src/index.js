/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Utility functions for handling suggestions.
 */
'use strict';

import * as Blockly from 'blockly/core';

/** Map from workspaces to BlockSuggestor objects. */
const suggestorLookup = new WeakMap();

/**
 * Class that tracks all blocks created in a workspace and suggests future
 * blocks to use.
 */
export class BlockSuggestor {
  /**
   * Constructs a BlockSuggestor object.
   * @param {number} numBlocksPerCategory the size of each toolbox category
   */
  
  constructor(numBlocksPerCategory) {
    /**
     *references the workspace to store information
     */
    this.workspaceSvg = null; 
    /**
     * @param {Element|string|null} inputSource store the problem description 
     * that's used to make suggestions for the blocks
     * used to make suggestions for the blocks. 
     * When it's a @type {string}, it becomes the problem description that's used. 
     * When it's an @type {element}, we use an associated value of sorts.
     */
    this.inputSource = null;

    /**
     * Saves the full JSON data for each block type the first time it's used.
     * This helps store what initial configuration / sub-blocks each block type
     * would be expected to have.
     */
    this.defaultJsonForBlockLookup = {};
    /**
     * List of reently used block types
     */
    this.recentlyUsedBlocks = [];
    /**
     * Checks if the workspace is finished loading, to avoid taking action on
     * all the BLOCK_CREATE events during workspace loading.
     */
    this.workspaceHasFinishedLoading = false;
    /**
     * Config parameter which sets the size of the toolbox categories.
     */
    this.numBlocksPerCategory = numBlocksPerCategory;

    this.eventListener = this.eventListener.bind(this);
    this.getMostUsed = this.getMostUsed.bind(this);
    this.getRecentlyUsed = this.getRecentlyUsed.bind(this);
    this.generateBlockData = this.generateBlockData.bind(this);
    
  }


  /**
   * Setter for the problem description
   */
  set description(newValue) {
    this.inputSource = newValue
  }
  /**
   * Getter for the problem description
   */
  get description(){
    return this.inputSource
  }


  /**
   * Generates a list of the 10 most frequently used blocks, in order.
   * Includes a secondary sort by most recent blocks.
   * @returns {!Array<!Blockly.utils.toolbox.BlockInfo>}A list of block JSON
   */
  getMostUsed = function () {
    // Store the frequency of each block, as well as the index first appears at.
    const countMap = new Map();
    const recencyMap = new Map();
    for (const [index, key] of this.recentlyUsedBlocks.entries()) {
      countMap.set(key, (countMap.get(key) || 0) + 1);
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    }

    // Get a sorted list.
    const freqUsedBlockTypes = [];
    for (const key of countMap.keys()) {
      freqUsedBlockTypes.push(key);
    }
    // Use recency as a tiebreak.
    freqUsedBlockTypes.sort(
      (a, b) =>
        countMap.get(b) -
        countMap.get(a) +
        0.01 * (recencyMap.get(a) - recencyMap.get(b)),
    );

    return this.generateBlockData(freqUsedBlockTypes);
  };

  /**
   * Generates a list of the 10 most recently used blocks.
   * @returns {Array <object>} A list of block JSON objects
   */
  getRecentlyUsed = function () {
    const uniqueRecentBlocks = [...new Set(this.recentlyUsedBlocks)];
    const recencyMap = new Map();
    for (const [index, key] of this.recentlyUsedBlocks.entries()) {
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    }
    uniqueRecentBlocks.sort((a, b) => recencyMap[a] - recencyMap[b]);
    return this.generateBlockData(uniqueRecentBlocks);
  };

  /**
   * Converts a list of block types to a full-fledge list of block data.
   * @param {Array<string>} blockTypeList the list of block types
   * @returns {Array<JSON>} the block data list
   */
  generateBlockData = function (blockTypeList) {
    const blockList = blockTypeList
      .slice(0, this.numBlocksPerCategory)
      .map((key) => {
        const json = this.defaultJsonForBlockLookup[key] || {};
        json['kind'] = 'BLOCK';
        json['type'] = key;
        json['x'] = null;
        json['y'] = null;
        return json;
      });

    if (blockList.length == 0) {
      blockList.push({
        kind: 'LABEL',
        text: 'No blocks have been used yet!',
      });
    }
    return blockList;
  };

  /**
   * Loads the state of this object from a serialized JSON.
   * @param {object} data the serialized data payload to load from
   */
  loadFromSerializedData(data) {
    this.defaultJsonForBlockLookup = data.defaultJsonForBlockLookup;
    this.recentlyUsedBlocks = data.recentlyUsedBlocks;
  }

  /**
   * Saves the state of this object to a serialized JSON.
   * @returns {object} a serialized data object including this object's state
   */
  saveToSerializedData() {
    return {
      defaultJsonForBlockLookup: this.defaultJsonForBlockLookup,
      recentlyUsedBlocks: this.recentlyUsedBlocks,
    };
  }

  /**
   * Resets the internal state of this object.
   */
  clearPriorBlockData() {
    this.defaultJsonForBlockLookup = {};
    this.recentlyUsedBlocks = [];
  }

  /**
   * Callback for when the workspace sends out events.
   * @param {!Blockly.Events.Abstract} e the event object
   */
  eventListener(e) {
    if (e.type == Blockly.Events.FINISHED_LOADING) {
      this.workspaceHasFinishedLoading = true;
      return;
    }
    if (
      e.type == Blockly.Events.BLOCK_CREATE &&
      this.workspaceHasFinishedLoading
    ) {
      const newBlockType = e.json.type;
      // If this is the first time creating this block, store its default
      // configuration so we know how exactly to render it in the toolbox.
      if (!this.defaultJsonForBlockLookup[newBlockType]) {
        this.defaultJsonForBlockLookup[newBlockType] = e.json;
      }
      this.recentlyUsedBlocks.unshift(newBlockType);
    }
  }
}



/**
 * Main entry point to initialize the suggested blocks categories.
 * @param {Blockly.WorkspaceSvg|Element|string} workspaceOrContainer the workspace to load into WorkspaceSvg, or an Element, or string
 * @param {number} numBlocksPerCategory how many blocks should be included per
 * category. Defaults to 10.
 * @param {boolean} waitForFinishedLoading whether to wait until we hear the
 * FINISHED_LOADING event before responding to BLOCK_CREATE events. Set to false
 * if you disable events during initial load. Defaults to true.
 */
export const init = function (
  workspaceOrContainer,
  options = {},
  numBlocksPerCategory = 10,
  waitForFinishedLoading = true,
) {
  // stores the Blockly workspace instance
  let workspace
  let container;
  const suggestor = new BlockSuggestor(numBlocksPerCategory);
  // Check if 'workspaceOrContainer' is already a Blockly workspace
  // If 'workspaceOrContainer' is a string, attempt to find the container element
  // If 'workspaceOrContainer' is not a string, treat it as a container element
  if (workspaceOrContainer instanceof Blockly.WorkspaceSvg) {
    workspace = workspaceOrContainer;
  }
  // Container stores the container element or string
  else {
    container = (typeof workspaceOrContainer === 'string') 
    ? document.getElementById(workspaceOrContainer) || document.querySelector(workspaceOrContainer) 
    : workspaceOrContainer;
    
    const textInputAndButtonContainer = document.createElement('div');
    const blocklyContainer = document.createElement('div');
    
    // Create a button element
    // Create an input element for problem input
    const button = document.createElement("button");
    button.innerText = "Get Suggested Blocks"
    const problemInput = document.createElement("input");
        problemInput.type = "text";
        problemInput.placeholder = "Enter problem here";
    // Inject Blockly workspace into the 'blocklyContainer' div
    workspace = Blockly.inject(blocklyContainer);   
    this.inputSource = problemInput;
    textInputAndButtonContainer.appendChild(problemInput);
    textInputAndButtonContainer.appendChild(button)

    // Append the text input container and Blockly container to the main container
    container.appendChild(textInputAndButtonContainer)
    container.appendChild(blocklyContainer)
  }
  this.workspaceSvg = workspace;
  workspace.registerToolboxCategoryCallback('MOST_USED', suggestor.getMostUsed);
  workspace.registerToolboxCategoryCallback(
    'RECENTLY_USED',
    suggestor.getRecentlyUsed,
  );

  
  // If user says not to wait to hear FINISHED_LOADING event,
  // then always respond to BLOCK_CREATE events.
  if (!waitForFinishedLoading) suggestor.workspaceHasFinishedLoading = true;
  workspace.addChangeListener(suggestor.eventListener);
  suggestorLookup.set(workspace, suggestor);
  return workspace
};


/**
 * Custom serializer so that the block suggestor can save and later recall which
 * blocks have been used in a workspace.
 */
class BlockSuggestorSerializer {
  /** Constructs the block suggestor serializer */
  constructor() {
    /**
     * The priority for deserializing block suggestion data.
     * Should be less than the priority for blocks so that this state is
     * applied after the blocks are loaded.
     * @type {number}
     */
    this.priority = Blockly.serialization.priorities.BLOCKS - 10;
  }

  /**
   * Saves a target workspace's state to serialized JSON.
   * @param {Blockly.Workspace} workspace the workspace to save
   * @returns {object|undefined} the serialized JSON if present
   */
  save(workspace) {
    return suggestorLookup.get(workspace)?.saveToSerializedData();
  }

  /**
   * Loads a serialized state into the target workspace.
   * @param {object} state the serialized state JSON
   * @param {Blockly.Workspace} workspace the workspace to load into
   */
  load(state, workspace) {
    suggestorLookup.get(workspace)?.loadFromSerializedData(state);
  }

  /**
   * Resets the state of a workspace.
   * @param {Blockly.Workspace} workspace the workspace to reset
   */
  clear(workspace) {
    suggestorLookup.get(workspace)?.clearPriorBlockData();
  }
}

Blockly.serialization.registry.register(
  'suggested-blocks', // Name
  new BlockSuggestorSerializer(),
);
