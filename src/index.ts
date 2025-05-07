/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Utility functions for handling suggestions.
 */
import * as Blockly from 'blockly/core';
import IMachineLearningModel from './IMachineLearningModel';

/** Map from workspaces to BlockSuggestor objects. */
const suggestorLookup = new WeakMap<Blockly.Workspace, BlockSuggestor>();

/**
 * Class that tracks all blocks created in a workspace and suggests future
 * blocks to use.
 */
export class BlockSuggestor {
  private description?: string;
  private model: IMachineLearningModel | null = null;
    /**
     * Saves the full JSON data for each block type the first time it's used.
     * This helps store what initial configuration / sub-blocks each block type
     * would be expected to have.
     */
  private defaultJsonForBlockLookup: Record<
    string,
    Blockly.utils.toolbox.BlockInfo
  > = {};
    /**
     * List of reently used block types
     */
  private recentlyUsedBlocks: string[] = [];
    /**
     * Checks if the workspace is finished loading, to avoid taking action on
     * all the BLOCK_CREATE events during workspace loading.
     */
  /* eslint-disable-next-line @typescript-eslint/explicit-member-accessibility */
  public workspaceHasFinishedLoading = false;


    /**
     * Config parameter which sets the size of the toolbox categories.
     */
  private numBlocksPerCategory: number;

  /**
   * Constructs a BlockSuggestor object.
   * 
   * @param numBlocksPerCategory the size of each toolbox category
   */
  constructor(numBlocksPerCategory: number) {
    /**
     * Config parameter which sets the size of the toolbox categories.
     */
    this.numBlocksPerCategory = numBlocksPerCategory;

    // Bind methods to `this`
    this.eventListener = this.eventListener.bind(this);
    this.getMostUsed = this.getMostUsed.bind(this);
    this.getRecentlyUsed = this.getRecentlyUsed.bind(this);
    this.generateBlockData = this.generateBlockData.bind(this);
  }

  /**
   * Sets the machine learning model to be used for block suggestions.
   *
   * @param model - The machine learning model to set
   */
  setModel(model: IMachineLearningModel): void {
    this.model = model;
  }

  /**
   * Generates block suggestions based on the current description.
   */
  getSuggestedBlocks = (): Blockly.utils.toolbox.BlockInfo[] => {
    const description =
      typeof this.description === 'string' ? this.description : '';

    const suggestedBlocks = this.model
      ? this.model.getSuggestedBlocks(description)
      : [];

    const blockTypes = suggestedBlocks.map((block) => block.type);
    return this.generateBlockData(blockTypes);
  };

  /**
   * Generates a list of the 10 most frequently used blocks, in order.
   * Includes a secondary sort by most recent blocks.
   * 
   * @returns A list of block JSON
   */
  getMostUsed = (): Blockly.utils.toolbox.BlockInfo[] => {
    // Store the frequency of each block, as well as the index first appears at.
    const countMap = new Map<string, number>();
    const recencyMap = new Map<string, number>();

    this.recentlyUsedBlocks.forEach((key, index) => {
      countMap.set(key, (countMap.get(key) || 0) + 1);
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    });

     // Get a sorted list.
    const freqUsedBlockTypes = Array.from(countMap.keys()).sort(
      (a, b) =>
        countMap.get(b) -
        countMap.get(a) +
        0.01 * (recencyMap.get(a) - recencyMap.get(b)),
    );

    return this.generateBlockData(freqUsedBlockTypes);
  };

  /**
   * Generates a list of the 10 most recently used blocks.
   * 
   * @returns A list of block JSON objects
   */
  getRecentlyUsed = (): Blockly.utils.toolbox.BlockInfo[] => {
    const uniqueRecentBlocks = Array.from(new Set(this.recentlyUsedBlocks));
    const recencyMap = new Map<string, number>();

    this.recentlyUsedBlocks.forEach((key, index) => {
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    });

    uniqueRecentBlocks.sort((a, b) => recencyMap.get(a) - recencyMap.get(b));

    return this.generateBlockData(uniqueRecentBlocks);
  };

  /**
   * Converts a list of block types to a full-fledge list of block data.
   * 
   * @param blockTypeList the list of block types
   * @returns the block data list
   */
  generateBlockData = (
    blockTypeList: string[],
  ):
    | Blockly.utils.toolbox.BlockInfo[]
    | Array<{kind: string; text: string}> => {
    if (blockTypeList.length === 0) {
      return [
        {
          kind: 'LABEL',
          text: 'No blocks have been used yet!',
        },
      ];
    }

    return blockTypeList.slice(0, this.numBlocksPerCategory).map((key) => {
      const json = this.defaultJsonForBlockLookup[key] || {};
      return {
        ...json,
        kind: 'BLOCK',
        type: key,
        x: undefined,
        y: undefined,
      };
    });
  };

  /**
   * Event listener for workspace events.
   *
   * @param e - The event object for workspace events
   */
  eventListener(e: Blockly.Events.Abstract): void {
    if (e.type === Blockly.Events.FINISHED_LOADING) {
      this.workspaceHasFinishedLoading = true;
      return;
    }

    if (
      e.type === Blockly.Events.BLOCK_CREATE &&
      this.workspaceHasFinishedLoading &&
      (e as Blockly.Events.BlockCreate).json?.type
    ) {
      const newBlockType = (e as Blockly.Events.BlockCreate).json.type;

       // If this is the first time creating this block, store its default
      // configuration so we know how exactly to render it in the toolbox.
      if (!this.defaultJsonForBlockLookup[newBlockType]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.defaultJsonForBlockLookup[newBlockType] = (e as any).json;
      }
      this.recentlyUsedBlocks.unshift(newBlockType);
    }
  }
  /**
   * Saves the state of this object to a serialized JSON.
   * 
   * @returns a serialized data object including this object's state
   */
  saveToSerializedData(): object {
    return {
      recentlyUsedBlocks: this.recentlyUsedBlocks,
      defaultJsonForBlockLookup: this.defaultJsonForBlockLookup,
    };
  }

  /**
   * Loads the state of this object from a serialized JSON.
   * 
   * @param state the serialized data payload to load from
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFromSerializedData(state: any): void {
    if (state.recentlyUsedBlocks) {
      this.recentlyUsedBlocks = state.recentlyUsedBlocks;
    }
    if (state.defaultJsonForBlockLookup) {
      this.defaultJsonForBlockLookup = state.defaultJsonForBlockLookup;
    }
  }

  /**
   * Resets the internal state of this object.
   */
  clearPriorBlockData(): void {
    this.recentlyUsedBlocks = [];
    this.defaultJsonForBlockLookup = {};
  }
}

/**
 * Main entry point to initialize the suggested blocks categories.
 * 
 * @param workspace the workspace to load into
 * @param numBlocksPerCategory how many blocks should be included per
 * category. Defaults to 10.
 * @param waitForFinishedLoading whether to wait until we hear the
 * FINISHED_LOADING event before responding to BLOCK_CREATE events. Set to false
 * if you disable events during initial load. Defaults to true.
 */
export const init = function (
  workspace: Blockly.WorkspaceSvg,
  numBlocksPerCategory: 10,
  waitForFinishedLoading: true,
): void {
  const suggestor = new BlockSuggestor(numBlocksPerCategory);
  workspace.registerToolboxCategoryCallback(
    'AI_SUGGESTED',
    suggestor.getSuggestedBlocks,
  );
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
  };

/**
 * Custom serializer so that the block suggestor can save and later recall which
 * blocks have been used in a workspace.
 */
class BlockSuggestorSerializer implements Blockly.serialization.ISerializer {
   /**
    * The priority for deserializing block suggestion data.
    * Should be less than the priority for blocks so that this state is
    * applied after the blocks are loaded.
    * 
    * @type {number}
    */
  priority = Blockly.serialization.priorities.BLOCKS - 10;

  /**
   * Saves a target workspace's state to serialized JSON.
   * 
   * @param workspace the workspace to save
   * @returns the serialized JSON if present
   */
  save(workspace: Blockly.Workspace): object | null {
    const suggestor = suggestorLookup.get(workspace);
    return suggestor ? suggestor.saveToSerializedData() : null;
  }

  /**
   * Loads a serialized state into the target workspace.
   * 
   * @param state the serialized state JSON
   * @param workspace the workspace to load into
   */
  load(state: object, workspace: Blockly.Workspace): void {
    const suggestor = suggestorLookup.get(workspace);
    if (suggestor) {
      suggestor.loadFromSerializedData(state);
    }
  }

  /**
   * Resets the state of a workspace.
   * 
   * @param workspace the workspace to reset
   */
  clear(workspace: Blockly.Workspace): void {
    const suggestor = suggestorLookup.get(workspace);
    if (suggestor) {
      suggestor.clearPriorBlockData();
    }
  }
}

Blockly.serialization.registry.register(
  'suggested-blocks',  // Name
  new BlockSuggestorSerializer(),
);