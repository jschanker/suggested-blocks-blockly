import NaiveBayesClassifier from "../src/NaiveBayesClassifier";
import * as Blockly from "blockly/core";

describe("NaiveBayesClassifier", () => {
    let classifier: NaiveBayesClassifier;

    beforeEach(() => {
        classifier = new NaiveBayesClassifier({});
    });

    it("should tokenize the description and create a unique set of tokens", () => {
        const description = "create variable";
        const tokenizer = classifier["tokenizer"]; // Access private tokenizer for testing
        const tokens = tokenizer.tokenize(description);
        expect(new Set(tokens)).toEqual(new Set(["create", "variable"]));
    });

    it("should filter tokenBlockFrequencyMap for matching tokens in the description", () => {
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["create", "variable_block"]', 3],
            ['["variable", "variable_block"]', 5],
            ['["if", "logic_block"]', 2],
        ]);

        const description = "create variable";
        const uniqueTokens = new Set(["create", "variable"]);
        const filteredEntries = Array.from(classifier["tokenBlockFrequencyMap"].entries()).filter(
            ([key]) => uniqueTokens.has(classifier.decodeKey(key)[0])
        );

        expect(filteredEntries).toEqual([
            ['["create", "variable_block"]', 3],
            ['["variable", "variable_block"]', 5],
        ]);
    });

    it("should decode the key correctly and extract the 0th item (token)", () => {
        const key = '["create", "variable_block"]';
        const decodedKey = classifier.decodeKey(key);
        expect(decodedKey[0]).toBe("create");
    });

    it("should suggest blocks based on tokenBlockFrequencyMap", () => {
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["create", "variable_block"]', 3],
            ['["variable", "variable_block"]', 5],
            ['["if", "logic_block"]', 2],
        ]);

        classifier["blockFrequencyMap"] = new Map([
            ["variable_block", 8],
            ["logic_block", 2],
        ]);

        classifier["totalDescriptions"] = 10;
        classifier["tokenFrequencyMap"] = new Map([
            ["create", 6],
            ["variable", 7],
            ["if", 3],
        ]);

        const description = "create variable";
        const suggestedBlocks = classifier.getSuggestedBlocks(description);

        expect(suggestedBlocks).toEqual([
            { block: "variable_block", probability: expect.any(Number) },
        ]);
        expect(suggestedBlocks[0].block).toBe("variable_block");
        expect(suggestedBlocks.length).toBeGreaterThanOrEqual(1); // Ensure it returns at least one block
    });

    it("should rank blocks by probability", () => {
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["create", "variable_block"]', 3],
            ['["variable", "variable_block"]', 5],
            ['["if", "logic_block"]', 2],
        ]);

        classifier["blockFrequencyMap"] = new Map([
            ["variable_block", 8],
            ["logic_block", 2],
        ]);

        classifier["totalDescriptions"] = 10;
        classifier["tokenFrequencyMap"] = new Map([
            ["create", 6],
            ["variable", 7],
            ["if", 3],
        ]);

        const description = "create variable";
        const suggestedBlocks = classifier.getSuggestedBlocks(description);

        expect(suggestedBlocks).toEqual([
            { block: "variable_block", probability: expect.any(Number) },
            { block: "logic_block", probability: expect.any(Number) },
        ]);
        expect(suggestedBlocks[0].probability).toBeGreaterThan(suggestedBlocks[1].probability);
    });
});


