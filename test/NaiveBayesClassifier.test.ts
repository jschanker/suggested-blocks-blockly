import NaiveBayesClassifier from "../src/NaiveBayesClassifier";
import SingleWordTokenizer from "../src/SingleWordTokenizer";
import * as Blockly from "blockly/core";

describe("NaiveBayesClassifier", () => {
    // Step 10
    it("should tokenize the description using the provided tokenizer", () => {
        const mockTokenizer = new SingleWordTokenizer();
        const classifier = new NaiveBayesClassifier({ tokenizer: mockTokenizer });

        const description = "Hello, world! Welcome to testing.";
        const expectedTokens = ["hello", "world", "welcome", "to", "testing"];

        const arrayTokens = classifier["tokenizer"].tokenize(description);

        expect(arrayTokens).toEqual(expectedTokens);
    });

    it("should use SingleWordTokenizer by default if no tokenizer is provided", () => {
        const classifier = new NaiveBayesClassifier({});

        const description = "Testing the default tokenizer.";
        const expectedTokens = ["testing", "the", "default", "tokenizer"];

        const arrayTokens = classifier["tokenizer"].tokenize(description);

        expect(arrayTokens).toEqual(expectedTokens);
    });

    it("should tokenize the description and convert it to a set of unique tokens", () => {
        const mockTokenizer = new SingleWordTokenizer();
        const classifier = new NaiveBayesClassifier({ tokenizer: mockTokenizer });

        const description = "Hello, world! Hello testing.";
        const expectedTokens = new Set(["hello", "world", "testing"]);

        const arrayTokens = classifier["tokenizer"].tokenize(description);
        const tokenSet = new Set(arrayTokens);

        expect(tokenSet).toEqual(expectedTokens);
    });

    it("should filter tokenBlockFrequencyMap based on matching tokens in the description", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["hello", "text_block"]', 5],
            ['["world", "logic_block"]', 3],
            ['["other", "control_block"]', 2],
        ]);

        classifier["decodeKey"] = jest.fn((key) => JSON.parse(key));

        const description = "hello world";
        const expectedFilteredArray = [
            ['["hello", "text_block"]', 5],
            ['["world", "logic_block"]', 3],
        ];

        const arrayTokens = classifier["tokenizer"].tokenize(description);
        const tokenSet = new Set(arrayTokens);
        const filteredArray = Array.from(classifier["tokenBlockFrequencyMap"].entries()).filter(([key, value]) => {
            const [token] = classifier.decodeKey(key);
            return tokenSet.has(token);
        });

        expect(filteredArray).toEqual(expectedFilteredArray);
    });

    it("should return an empty array if no tokens match", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["hello", "text_block"]', 5],
            ['["world", "logic_block"]', 3],
        ]);

        classifier["decodeKey"] = jest.fn((key) => JSON.parse(key));

        const description = "goodbye";
        const filteredArray = Array.from(classifier["tokenBlockFrequencyMap"].entries()).filter(([key, value]) => {
            const [token] = classifier.decodeKey(key);
            return new Set(classifier["tokenizer"].tokenize(description)).has(token);
        });

        expect(filteredArray).toEqual([]);
    });

    // Step 11
    it("should create a set of unique block types from the filtered array", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["decodeKey"] = jest.fn((key) => JSON.parse(key));

        const filteredArray: [string, number][] = [
            ['["hello", "text_block"]', 5],
            ['["world", "logic_block"]', 3],
            ['["hello", "logic_block"]', 2],
        ];

        const expectedPossibleBlockTypes = new Set(["text_block", "logic_block"]);

        const possibleBlockTypes = new Set(
            filteredArray.map(([key]) => {
                const [, blockType] = classifier.decodeKey(key);
                return blockType;
            })
        );

        expect(possibleBlockTypes).toEqual(expectedPossibleBlockTypes);
    });

    it("should return an empty set when the filtered array is empty", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["decodeKey"] = jest.fn((key) => JSON.parse(key));

        const filteredArray: [string, number][] = [];

        const expectedPossibleBlockTypes = new Set();

        const possibleBlockTypes = new Set(
            filteredArray.map(([key]) => {
                const [, blockType] = classifier.decodeKey(key);
                return blockType;
            })
        );

        expect(possibleBlockTypes).toEqual(expectedPossibleBlockTypes);
    });
});
