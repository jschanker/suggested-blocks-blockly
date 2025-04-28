import * as Blockly from 'blockly/core';
import IMachineLearningModel from './IMachineLearningModel';

const suggestorLookup = new WeakMap<Blockly.Workspace, BlockSuggestor>();

export class BlockSuggestor {
  private description?: string;
  // Properties with explicit types
  private model: IMachineLearningModel | null = null;
  private defaultJsonForBlockLookup: Record<
    string,
    Blockly.utils.toolbox.BlockInfo
  > = {};
  private recentlyUsedBlocks: string[] = [];
  private workspaceHasFinishedLoading = false;
  private numBlocksPerCategory: number;

  constructor(numBlocksPerCategory: number) {
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
   * Generates a list of the 10 most frequently used blocks.
   */
  getMostUsed = (): Blockly.utils.toolbox.BlockInfo[] => {
    const countMap = new Map<string, number>();
    const recencyMap = new Map<string, number>();

    this.recentlyUsedBlocks.forEach((key, index) => {
      countMap.set(key, (countMap.get(key) || 0) + 1);
      if (!recencyMap.has(key)) {
        recencyMap.set(key, index + 1);
      }
    });

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
   * Converts block types to block data.
   *
   * @param blockTypeList - The list of block types to convert
   */
  generateBlockData = (
    blockTypeList: [string],
  ): Array<Blockly.utils.toolbox.BlockInfo | {kind: 'LABEL'; text: string}> => {
    const blockList = blockTypeList
      .slice(0, this.numBlocksPerCategory)
      .map((key) => {
        const json = this.defaultJsonForBlockLookup[key] || {};
        return {
          ...json,
          kind: 'BLOCK',
          type: key,
          x: undefined,
          y: undefined,
        };
      });

    if (blockList.length === 0) {
      blockList.push({
        kind: 'LABEL',
        text: 'No blocks have been used yet!',
      });
    }

    return blockList;
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
      e.json?.type
    ) {
      const newBlockType = e.json.type;

      if (!this.defaultJsonForBlockLookup[newBlockType]) {
        this.defaultJsonForBlockLookup[newBlockType] = (e as any).json;
      }
      this.recentlyUsedBlocks.unshift(newBlockType);
    }
  }
  saveToSerializedData(): object {
    return {
      recentlyUsedBlocks: this.recentlyUsedBlocks,
      defaultJsonForBlockLookup: this.defaultJsonForBlockLookup,
    };
  }

  loadFromSerializedData(state: any): void {
    if (state.recentlyUsedBlocks) {
      this.recentlyUsedBlocks = state.recentlyUsedBlocks;
    }
    if (state.defaultJsonForBlockLookup) {
      this.defaultJsonForBlockLookup = state.defaultJsonForBlockLookup;
    }
  }

  clearPriorBlockData(): void {
    this.recentlyUsedBlocks = [];
    this.defaultJsonForBlockLookup = {};
  }
}

class BlockSuggestorSerializer implements Blockly.serialization.ISerializer {
  priority = Blockly.serialization.priorities.BLOCKS - 10;

  save(workspace: Blockly.Workspace): object | null {
    const suggestor = suggestorLookup.get(workspace);
    return suggestor ? suggestor.saveToSerializedData() : null;
  }

  load(state: object, workspace: Blockly.Workspace): void {
    const suggestor = suggestorLookup.get(workspace);
    if (suggestor) {
      suggestor.loadFromSerializedData(state);
    }
  }

  clear(workspace: Blockly.Workspace): void {
    const suggestor = suggestorLookup.get(workspace);
    if (suggestor) {
      suggestor.clearPriorBlockData();
    }
  }
}

Blockly.serialization.registry.register(
  'suggested-blocks',
  new BlockSuggestorSerializer(),
);
