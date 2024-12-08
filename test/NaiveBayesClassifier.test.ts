import NaiveBayesClassifier from "../src/NaiveBayesClassifier";
import * as Blockly from "blockly/core";

beforeAll(() => {
    Blockly.Blocks["variable_block"] = {
        init: function () {
            this.jsonInit({ message0: "Variable Block", output: null });
        },
    };

    Blockly.Blocks["logic_block"] = {
        init: function () {
            this.jsonInit({ message0: "Logic Block", output: null });
        },
    };

    Blockly.Blocks["greeting_block"] = {
        init: function () {
            this.jsonInit({ message0: "Greeting Block", output: null });
        },
    };

    Blockly.Blocks["message_block"] = {
        init: function () {
            this.jsonInit({ message0: "Message Block", output: null });
        },
    };

    Blockly.Blocks["control_block"] = {
        init: function () {
            this.jsonInit({ message0: "Control Block", output: null });
        },
    };
});

afterAll(() => {
    delete Blockly.Blocks["variable_block"];
    delete Blockly.Blocks["logic_block"];
    delete Blockly.Blocks["greeting_block"];
    delete Blockly.Blocks["message_block"];
    delete Blockly.Blocks["control_block"];
});


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

    it("should calculate probabilities correctly for one token and one block", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["hello", "greeting_block"]', 4],
        ]);
        classifier["blockFrequencyMap"] = new Map([
            ["greeting_block", 5],
        ]);
        classifier["totalDescriptions"] = 10;
    
        const suggestedBlocks = classifier.getSuggestedBlocks("hello");
        const expectedProbability = (4 / 5) * (5 / 10);
    
        expect(suggestedBlocks).toBeDefined();
        expect(suggestedBlocks.length).toBe(1);
        expect(suggestedBlocks[0].type).toBe("greeting_block");
    
        const calculatedBlockType = "greeting_block";
        const actualBlockScore =
            (classifier["tokenBlockFrequencyMap"].get('["hello", "greeting_block"]')! /
                classifier["blockFrequencyMap"].get(calculatedBlockType)!) *
            (classifier["blockFrequencyMap"].get(calculatedBlockType)! /
                classifier["totalDescriptions"]);
    
        expect(actualBlockScore).toBeCloseTo(expectedProbability, 5);
    });
    
    it("should rank multiple blocks by probability", () => {
        const classifier = new NaiveBayesClassifier({});
        classifier["tokenBlockFrequencyMap"] = new Map([
            ['["hello", "greeting_block"]', 3],
            ['["world", "message_block"]', 4],
        ]);
        classifier["blockFrequencyMap"] = new Map([
            ["greeting_block", 5],
            ["message_block", 8],
        ]);
        classifier["totalDescriptions"] = 20;
    
        const suggestedBlocks = classifier.getSuggestedBlocks("hello world");
    
        expect(suggestedBlocks).toBeDefined();
        expect(suggestedBlocks.length).toBe(2);
    
        const greetingScore =
            (classifier["tokenBlockFrequencyMap"].get('["hello", "greeting_block"]')! /
                classifier["blockFrequencyMap"].get("greeting_block")!) *
            (classifier["blockFrequencyMap"].get("greeting_block")! /
                classifier["totalDescriptions"]);
    
        const messageScore =
            (classifier["tokenBlockFrequencyMap"].get('["world", "message_block"]')! /
                classifier["blockFrequencyMap"].get("message_block")!) *
            (classifier["blockFrequencyMap"].get("message_block")! /
                classifier["totalDescriptions"]);
    
        expect(messageScore).toBeGreaterThan(greetingScore);
        expect(suggestedBlocks[0].type).toBe("message_block");
        expect(suggestedBlocks[1].type).toBe("greeting_block");
    });
    
    
});
