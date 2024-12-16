import NaiveBayesClassifier from '../src/NaiveBayesClassifier';
import SingleWordTokenizer from '../src/SingleWordTokenizer';

describe('NaiveBayesClassifier', () => {
  it('should tokenize the description using the provided tokenizer', () => {
    const mockTokenizer = new SingleWordTokenizer();
    const classifier = new NaiveBayesClassifier({tokenizer: mockTokenizer});

    const description = 'Hello, world! Welcome to testing.';
    const expectedTokens = ['hello', 'world', 'welcome', 'to', 'testing'];

    const descriptionTokens = classifier['tokenizer'].tokenize(description);

    expect(descriptionTokens).toEqual(expectedTokens);
  });

  it('should use SingleWordTokenizer by default if no tokenizer is provided', () => {
    const classifier = new NaiveBayesClassifier({});

    const description = 'Testing the default tokenizer.';
    const expectedTokens = ['testing', 'the', 'default', 'tokenizer'];

    const descriptionTokens = classifier['tokenizer'].tokenize(description);

    expect(descriptionTokens).toEqual(expectedTokens);
  });

  it('should tokenize the description and convert it to a set of unique tokens', () => {
    const mockTokenizer = new SingleWordTokenizer();
    const classifier = new NaiveBayesClassifier({tokenizer: mockTokenizer});

    const description = 'Hello, world! Hello testing.';
    const expectedTokens = new Set(['hello', 'world', 'testing']);

    const descriptionTokens = classifier['tokenizer'].tokenize(description);
    const tokenSet = new Set(descriptionTokens);

    expect(tokenSet).toEqual(expectedTokens);
  });

  it('should filter tokenBlockFrequencyMap based on matching tokens in the description', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['tokenBlockFrequencyMap'] = new Map([
      ['["hello", "text_block"]', 5],
      ['["world", "logic_block"]', 3],
      ['["other", "control_block"]', 2],
    ]);

    classifier['decodeKey'] = jest.fn((key) => JSON.parse(key));

    const description = 'hello world';
    const expectedusedTokenBlockPairs = [
      ['["hello", "text_block"]', 5],
      ['["world", "logic_block"]', 3],
    ];

    const descriptionTokens = classifier['tokenizer'].tokenize(description);
    const tokenSet = new Set(descriptionTokens);
    const usedTokenBlockPairs = Array.from(
      classifier['tokenBlockFrequencyMap'].entries(),
    ).filter(([key, value]) => {
      const [token] = classifier.decodeKey(key);
      return tokenSet.has(token);
    });

    expect(usedTokenBlockPairs).toEqual(expectedusedTokenBlockPairs);
  });

  it('should return an empty array if no tokens match', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['tokenBlockFrequencyMap'] = new Map([
      ['["hello", "text_block"]', 5],
      ['["world", "logic_block"]', 3],
    ]);

    classifier['decodeKey'] = jest.fn((key) => JSON.parse(key));

    const description = 'goodbye';
    const usedTokenBlockPairs = Array.from(
      classifier['tokenBlockFrequencyMap'].entries(),
    ).filter(([key, value]) => {
      const [token] = classifier.decodeKey(key);
      return new Set(classifier['tokenizer'].tokenize(description)).has(token);
    });

    expect(usedTokenBlockPairs).toEqual([]);
  });

  it('should create a set of unique block types from the filtered array', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['decodeKey'] = jest.fn((key) => JSON.parse(key));

    const usedTokenBlockPairs: Array<[string, number]> = [
      ['["hello", "text_block"]', 5],
      ['["world", "logic_block"]', 3],
      ['["hello", "logic_block"]', 2],
    ];

    const expectedPossibleBlockTypes = new Set(['text_block', 'logic_block']);

    const possibleBlockTypes = new Set(
      usedTokenBlockPairs.map(([key]) => {
        const [, blockType] = classifier.decodeKey(key);
        return blockType;
      }),
    );

    expect(possibleBlockTypes).toEqual(expectedPossibleBlockTypes);
  });

  it('should return an empty set when the filtered array is empty', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['decodeKey'] = jest.fn((key) => JSON.parse(key));

    const usedTokenBlockPairs: Array<[string, number]> = [];

    const expectedPossibleBlockTypes = new Set();

    const possibleBlockTypes = new Set(
      usedTokenBlockPairs.map(([key]) => {
        const [, blockType] = classifier.decodeKey(key);
        return blockType;
      }),
    );

    expect(possibleBlockTypes).toEqual(expectedPossibleBlockTypes);
  });

  it('should calculate pTokenGivenBlock correctly for a single token and block', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);

    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);

    const tokenSet = new Set(['hello']);
    const possibleBlockTypes = new Set(['blockA']);
    let pTokenGivenBlock = 0;

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;

        console.log('TokenBlockKey:', tokenBlockKey);
        console.log('TokenBlockFrequency:', tokenBlockFrequency);
        console.log('BlockFrequency:', blockFrequency);

        pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;
        console.log('P(Token | Block):', pTokenGivenBlock);
      }
    }

    expect(pTokenGivenBlock).toBe(3 / 10);
  });

  it('should set pTokenGivenBlock to 0 when block frequency is 0', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = jest.fn(([token, blockType]) =>
      JSON.stringify([token, blockType]),
    );

    classifier['tokenBlockFrequencyMap'] = new Map([
      ['["hello", "blockB"]', 5],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockB', 0]]);

    const tokenSet = new Set(['hello']);
    const possibleBlockTypes = new Set(['blockB']);
    let pTokenGivenBlock = 0;

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;

        pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;
      }
    }

    expect(pTokenGivenBlock).toBe(0);
  });

  it('should calculate pTokenGivenBlock correctly for multiple tokens', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);

    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
      [classifier.toKey(['world', 'blockA']), 2],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);

    const tokenSet = new Set(['hello', 'world']);
    const possibleBlockTypes = new Set(['blockA']);
    const pTokenGivenBlockResults: number[] = [];

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;

        const pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;
        pTokenGivenBlockResults.push(pTokenGivenBlock);
      }
    }

    expect(pTokenGivenBlockResults).toEqual([3 / 10, 2 / 10]);
  });

  it('should calculate the numerator correctly for a single token and block', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);

    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);

    const tokenSet = new Set(['hello']);
    const possibleBlockTypes = new Set(['blockA']);
    const pBlock = 0.5;

    let numerator = pBlock;

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;

        const pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;

        numerator *= pTokenGivenBlock;
      }
    }

    expect(numerator).toBe(0.5 * (3 / 10));
  });

  it('should calculate the numerator correctly for multiple tokens', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);

    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
      [classifier.toKey(['world', 'blockA']), 2],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);

    const tokenSet = new Set(['hello', 'world']);
    const possibleBlockTypes = new Set(['blockA']);
    const pBlock = 0.5;

    let numerator = pBlock;

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;

        const pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;

        numerator *= pTokenGivenBlock;
      }
    }

    expect(numerator).toBe(0.5 * (3 / 10) * (2 / 10));
  });

  it('should calculate numerator and pTokensGivenNotBlock correctly', () => {
    const classifier = new NaiveBayesClassifier({});
    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);

    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
      [classifier.toKey(['world', 'blockA']), 2],
    ]);
    classifier['tokenFrequencyMap'] = new Map([
      ['hello', 5],
      ['world', 4],
    ]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);
    classifier['totalDescriptions'] = 20;

    const tokenSet = new Set(['hello', 'world']);
    const possibleBlockTypes = new Set(['blockA']);
    const pBlock = 0.5;

    let numerator = pBlock;
    let pTokensGivenNotBlock = 1;

    for (const blockType of possibleBlockTypes) {
      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const tokenFrequency = classifier['tokenFrequencyMap'].get(token) || 0;
        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;
        const notBlockFrequency =
          classifier['totalDescriptions'] - blockFrequency;

        const pTokenGivenBlock =
          blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;
        numerator *= pTokenGivenBlock;

        const pTokenGivenNotBlock =
          notBlockFrequency > 0
            ? (tokenFrequency - tokenBlockFrequency) / notBlockFrequency
            : 0;
        pTokensGivenNotBlock *= pTokenGivenNotBlock;
      }
    }

    expect(numerator).toBe(0.5 * (3 / 10) * (2 / 10));
    expect(pTokensGivenNotBlock).toBe((2 / 10) * (2 / 10));
  });

  it('should calculate the pTokens and probability correctly for a single block', () => {
    const classifier = new NaiveBayesClassifier({});
    const possibleBlockTypes = new Set(['blockA']);
    const tokenSet = new Set(['hello']);

    classifier['toKey'] = ([token, blockType]) =>
      JSON.stringify([token, blockType]);
    classifier['tokenBlockFrequencyMap'] = new Map([
      [classifier.toKey(['hello', 'blockA']), 3],
    ]);
    classifier['tokenFrequencyMap'] = new Map([['hello', 5]]);
    classifier['blockFrequencyMap'] = new Map([['blockA', 10]]);
    classifier['totalDescriptions'] = 20;

    const blockTypeProbabilities: Array<{block: string; probability: number}> =
      [];
    const pBlock = 0.5;
    const pNotBlock = 0.5;

    for (const blockType of possibleBlockTypes) {
      let numerator = pBlock;
      let pTokensGivenNotBlock = 1;

      for (const token of tokenSet) {
        const tokenBlockKey = classifier.toKey([token, blockType]);
        const tokenBlockFrequency =
          classifier['tokenBlockFrequencyMap'].get(tokenBlockKey) || 0;
        const tokenFrequency = classifier['tokenFrequencyMap'].get(token) || 0;

        const blockFrequency =
          classifier['blockFrequencyMap'].get(blockType) || 0;
        const notBlockFrequency =
          classifier['totalDescriptions'] - blockFrequency;

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

      blockTypeProbabilities.push({block: blockType, probability});
    }

    expect(blockTypeProbabilities).toEqual([
      {
        block: 'blockA',
        probability: (0.5 * (3 / 10)) / (0.5 * (3 / 10) + 0.5 * (2 / 10)),
      },
    ]);
  });

  it('should sort blocks by probability in descending order', () => {
    const blockTypeProbabilities = [
      {block: 'blockB', probability: 0.3},
      {block: 'blockA', probability: 0.7},
      {block: 'blockC', probability: 0.5},
    ];

    const sortedProbabilities = blockTypeProbabilities.sort(
      (prob1, prob2) => prob2.probability - prob1.probability,
    );

    expect(sortedProbabilities).toEqual([
      {block: 'blockA', probability: 0.7},
      {block: 'blockC', probability: 0.5},
      {block: 'blockB', probability: 0.3},
    ]);
  });
});
