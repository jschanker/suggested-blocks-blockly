import MachineLearningModel from './IMachineLearningModel';
import Tokenizer from './ITokenizer';
import SingleWordTokenizer from './SingleWordTokenizer';
import * as Blockly from 'blockly/core';

class NaiveBayesClassifier implements MachineLearningModel {
  private tokenizer: Tokenizer;
  private totalDescriptions: number;
  /**
   * Maps a token to the number of training descriptions it appears in.
   * Key: Token (string)
   * Value: Frequency of the token in descriptions (number)
   */
  private tokenFrequencyMap: Map<string, number>;
  /**
   * Maps a block type to the number of training descriptions in which it is used.
   * Key: Block type (string)
   * Value: Frequency of the block type in descriptions (number) // change this
   */
  private blockFrequencyMap: Map<string, number>;
  /**
   * Maps a combination of a token and a block type to the number of training descriptions
   * where the token appears in conjunction with that block type.
   * Key: Encoded string combining token and block type (string)
   * Value: Number of tokens for which that particular block type is used
   */

  private tokenBlockFrequencyMap: Map<string, number>;

  constructor(options: {tokenizer?: Tokenizer}) {
    this.tokenizer = options.tokenizer || new SingleWordTokenizer();
    this.totalDescriptions = 0;
    this.tokenBlockFrequencyMap = new Map<string, number>();
    this.blockFrequencyMap = new Map<string, number>();
    this.tokenFrequencyMap = new Map<string, number>();
  }
  toKey(a: string[]): string {
    return JSON.stringify(a);
  }
  decodeKey(a: string): string[] {
    return JSON.parse(a);
  }

  train(data: Array<{description: string; blocks: Blockly.Block[]}>): void {
    this.totalDescriptions += data.length;
    for (const dataPoint of data) {
      const uniqueTokens = new Set(
        this.tokenizer.tokenize(dataPoint.description),
      );
      const blockTypes = new Set(dataPoint.blocks.map((block) => block.type));
      for (const bt of blockTypes) {
        this.blockFrequencyMap.set(
          bt,
          (this.blockFrequencyMap.get(bt) || 0) + 1,
        );
      }
      for (const ut of uniqueTokens) {
        this.tokenFrequencyMap.set(
          ut,
          (this.tokenFrequencyMap.get(ut) || 0) + 1,
        );

        for (const b of blockTypes) {
          const key = this.toKey([ut, b]);
          this.tokenBlockFrequencyMap.set(
            key,
            (this.tokenBlockFrequencyMap.get(key) || 0) + 1,
          );
        }
      }
    }
  }

  getSuggestedBlocks(
    description: string,
    workspace: Blockly.Workspace,
  ): Blockly.Block[] {
    const descriptionTokens = this.tokenizer.tokenize(description);
    const tokenSet = new Set(descriptionTokens);
    const usedTokenBlockPairs = Array.from(
      this.tokenBlockFrequencyMap.entries(),
    ).filter(([key, value]) => {
      const [token] = this.decodeKey(key);
      return tokenSet.has(token);
    });

    const possibleBlockTypes = new Set(
      usedTokenBlockPairs.map(([key]) => {
        const [, blockType] = this.decodeKey(key);
        return blockType;
      }),
    );

    const blockTypeProbabilities: Array<{
      blockType: string;
      probability: number;
    }> = [];
    const pBlock = 0.5;
    const pNotBlock = 1 - pBlock;

    for (const blockType of possibleBlockTypes) {
      let numerator = pBlock;
      let pTokensGivenNotBlock = 1;

      for (const token of tokenSet) {
        const tokenBlockKey = this.toKey([token, blockType]);
        const tokenBlockFrequency =
          this.tokenBlockFrequencyMap.get(tokenBlockKey) || 0;
        const tokenFrequency = this.tokenFrequencyMap.get(token) || 0;

        const blockFrequency = this.blockFrequencyMap.get(blockType) || 0;
        const notBlockFrequency = this.totalDescriptions - blockFrequency;

        const pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;

        numerator *= pTokenGivenBlock;

        const pTokenGivenNotBlock =
          notBlockFrequency > 0
            ? (tokenFrequency - tokenBlockFrequency) / notBlockFrequency
            : 0;
        pTokensGivenNotBlock *= pTokenGivenNotBlock;
      }

      const pTokens = numerator + pNotBlock * pTokensGivenNotBlock;
      const probability = numerator / pTokens;

      blockTypeProbabilities.push({blockType, probability});
    }
    return blockTypeProbabilities
      .sort((prob1, prob2) => prob2.probability - prob1.probability)
      .map((blocktype) => workspace.newBlock(blocktype.blockType));
  }
}

export default NaiveBayesClassifier;
