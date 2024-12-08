import NaiveBayesClassifier from "../src/NaiveBayesClassifier";
import * as Blockly from "blockly/core";

describe("NaiveBayesClassifier", () => {
    it("should return suggested blocks", () => {
        const classifier = new NaiveBayesClassifier({});
        const description = "create variable";

        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["create", "variable_block"]', 3],
            ['["variable", "variable_block"]', 5],
        ]);

        classifier["blockFrequencyMap"] = new Map([
            ["variable_block", 8],
        ]);

        classifier["tokenFrequencyMap"] = new Map([
            ["create", 6],
            ["variable", 7],
        ]);

        classifier["totalDescriptions"] = 10;

        const suggestedBlocks = classifier.getSuggestedBlocks(description);

        expect(suggestedBlocks).toBeDefined();
        expect(suggestedBlocks.length).toBeGreaterThan(0);
        expect(suggestedBlocks[0].type).toBe("variable_block");
    });

    it("should rank blocks by probability (mocked)", () => {
        const classifier = new NaiveBayesClassifier({});
        const description = "if condition";

        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["if", "logic_block"]', 4],
            ['["condition", "logic_block"]', 6],
            ['["if", "control_block"]', 2],
        ]);

        classifier["blockFrequencyMap"] = new Map([
            ["logic_block", 10],
            ["control_block", 5],
        ]);

        classifier["totalDescriptions"] = 20;

        classifier["tokenFrequencyMap"] = new Map([
            ["if", 8],
            ["condition", 12],
        ]);

        const suggestedBlocks = classifier.getSuggestedBlocks(description);

        expect(suggestedBlocks).toBeDefined();
        expect(suggestedBlocks.length).toBeGreaterThan(1);
        expect(suggestedBlocks[0].type).toBe("logic_block");
        expect(suggestedBlocks[1].type).toBe("control_block");
    });
});
