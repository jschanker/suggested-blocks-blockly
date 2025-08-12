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
export const suggestorLookup = new WeakMap<Blockly.Workspace, BlockSuggestor>();

/**
 * Class that tracks all blocks created in a workspace and suggests future
 * blocks to use.
 */
export class BlockSuggestor {
  /**
   * Machine learning model for block suggestions
   */
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
   * List of recently used block types
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
   * The Blockly workspace instance associated with this BlockSuggestor.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public workspace: Blockly.WorkspaceSvg | null = null;
  /**
   * Optional input description element or string
   */
  // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
  public inputSource: HTMLInputElement | string | null = null;
  /**
   * Constructs a BlockSuggestor object.
   *
   * @param numBlocksPerCategory the size of each toolbox category
   * @param workspace new workspace
   * @param inputSource optional input description element or string
   */
  constructor(
    numBlocksPerCategory: number,
    workspace: Blockly.WorkspaceSvg | null = null,
    inputSource: HTMLInputElement | string | null = null,
  ) {
    this.numBlocksPerCategory = numBlocksPerCategory;
    this.workspace = workspace;
    this.inputSource = inputSource;

    this.eventListener = this.eventListener.bind(this);
    this.getSuggestedBlocks = this.getSuggestedBlocks.bind(this);
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
    let description = '';

    if (typeof this.inputSource === 'string') {
      description = this.inputSource;
    } else if (this.inputSource instanceof HTMLInputElement) {
      description = this.inputSource.value || '';
    }

    const suggestedBlocks = this.model
      ? this.model.getSuggestedBlocks(description, this.workspace)
      : [];

    const blockTypes = suggestedBlocks.map((block) => block.type);
    const result = this.generateBlockData(blockTypes);

    return result;
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
    const uniqueRecentBlocks = [...new Set(this.recentlyUsedBlocks)];
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
   * Loads the state of this object from a serialized JSON.
   *
   * @param data the serialized data payload to load from
   * @param data.defaultJsonForBlockLookup the lookup table for default block JSON
   * @param data.recentlyUsedBlocks the list of recently used block types
   */
  loadFromSerializedData(data: {
    defaultJsonForBlockLookup: Record<string, Blockly.utils.toolbox.BlockInfo>;
    recentlyUsedBlocks: string[];
  }): void {
    this.defaultJsonForBlockLookup = data.defaultJsonForBlockLookup;
    this.recentlyUsedBlocks = data.recentlyUsedBlocks;
  }

  /**
   * Saves the state of this object to a serialized JSON.
   *
   * @returns a serialized data object including this object's state, an object with defaultJsonForBlockLookup and recentlyUsedBlocks
   */
  saveToSerializedData(): {
    defaultJsonForBlockLookup: Record<string, Blockly.utils.toolbox.BlockInfo>;
    recentlyUsedBlocks: string[];
  } {
    return {
      defaultJsonForBlockLookup: this.defaultJsonForBlockLookup,
      recentlyUsedBlocks: this.recentlyUsedBlocks,
    };
  }

  /**
   * Resets the internal state of this object.
   */
  clearPriorBlockData(): void {
    this.defaultJsonForBlockLookup = {};
    this.recentlyUsedBlocks = [];
  }

  /**
   * Callback for when the workspace sends out events.
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
      const blockEvent = e as Blockly.Events.BlockCreate;

      const newBlockType = blockEvent.json.type;

      if (!this.defaultJsonForBlockLookup[newBlockType]) {
        this.defaultJsonForBlockLookup[newBlockType] =
          blockEvent.json as Blockly.utils.toolbox.BlockInfo;
      }
      this.recentlyUsedBlocks.unshift(newBlockType);
    }
  }
}
/**
 * Main entry point to initialize the suggested blocks categories.
 *
 * @param workspaceOrContainer The workspace to load into, or the container to inject into.
 * @param options Blockly options.
 * @param numBlocksPerCategory how many blocks should be included per
 * category. Defaults to 10.
 * @param waitForFinishedLoading whether to wait until we hear the
 * FINISHED_LOADING event before responding to BLOCK_CREATE events. Set to false
 * if you disable events during initial load. Defaults to true.
 */
export const init = function (
  workspaceOrContainer: string | Element | Blockly.WorkspaceSvg,
  options?: Blockly.BlocklyOptions,
  numBlocksPerCategory = 10,
  waitForFinishedLoading = true,
): Blockly.WorkspaceSvg {
  let workspace: Blockly.WorkspaceSvg;
  let inputSource: HTMLInputElement | null = null;
  let container: HTMLElement | null = null;

  if (workspaceOrContainer instanceof Blockly.WorkspaceSvg) {
    workspace = workspaceOrContainer;
  } else {
    container =
      typeof workspaceOrContainer === 'string'
        ? document.getElementById(workspaceOrContainer) ||
          document.querySelector(workspaceOrContainer)
        : (workspaceOrContainer as HTMLElement);

    const inputButtonDiv = document.createElement('div');
    inputButtonDiv.style.position = 'fixed';
    inputButtonDiv.style.top = '0';
    inputButtonDiv.style.right = '0';
    inputButtonDiv.style.zIndex = '1000';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Describe your problem...';
    inputButtonDiv.appendChild(input);
    inputSource = input;

    const button = document.createElement('button');
    button.textContent = 'Get Suggested Blocks';
    inputButtonDiv.appendChild(button);

    container.appendChild(inputButtonDiv);

    workspace = Blockly.inject(container, options) as Blockly.WorkspaceSvg;
  }
  const suggestor = new BlockSuggestor(
    numBlocksPerCategory,
    workspace,
    inputSource,
  );

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

  if (inputSource && container) {
    const button = container.querySelector('button');
    if (button) {
      button.addEventListener('click', () => {
        let inputValue = '';

        if (typeof inputSource === 'string') {
          inputValue = inputSource;
        } else if (inputSource instanceof HTMLInputElement) {
          inputValue = inputSource.value;
        }

        if (inputValue.trim()) {
          const flyout = workspace.getFlyout();
          if (flyout && flyout.show) {
            flyout.show('AI_SUGGESTED');
          } else {
            console.error(
              'Flyout or show method not available on workspaceSvg.',
            );
          }
        } else {
          alert('Please enter a problem to get suggestions.');
        }
      });
    }
  }

  return workspace;
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
  save(workspace: Blockly.Workspace): object | undefined {
    return suggestorLookup.get(workspace)?.saveToSerializedData();
  }

  /**
   * Loads a serialized state into the target workspace.
   *
   * @param state the serialized state JSON
   * @param workspace the workspace to load into
   */
  load(state, workspace) {
    suggestorLookup.get(workspace)?.loadFromSerializedData(state);
  }

  /**
   * Resets the state of a workspace.
   *
   * @param workspace the workspace to reset
   */
  clear(workspace) {
    suggestorLookup.get(workspace)?.clearPriorBlockData();
  }
}

Blockly.serialization.registry.register(
  'suggested-blocks', // Name
  new BlockSuggestorSerializer(),
);
