import SingleWordTokenizer from "../src/SingleWordTokenizer";

describe("SingleWordTokenizer", () => {
    it("should tokenize a simple sentence into words", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("Hello world");
        expect(result).toEqual(["hello", "world"]);
    });

    it("should remove punctuation and tokenize", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("Hello, world! How are you?");
        expect(result).toEqual(["hello", "world", "how", "are", "you"]);
    });

    it("should handle multiple spaces correctly", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("Hello    world  !");
        expect(result).toEqual(["hello", "world"]);
    });

    it("should return an empty array for an empty string", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("");
        expect(result).toEqual([]);
    });

    it("should handle strings with only spaces", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("       ");
        expect(result).toEqual([]);
    });

    it("should handle a single word", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("Word");
        expect(result).toEqual(["word"]);
    });

    it("should handle mixed-case input", () => {
        const tokenizer = new SingleWordTokenizer();
        const result = tokenizer.tokenize("MiXeD CaSe WoRdS");
        expect(result).toEqual(["mixed", "case", "words"]);
    });
});
