import Tokenizer from './ITokenizer';

class SingleWordTokenizer implements Tokenizer {
  tokenize(a: string): string[] {
    return a
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }
}

export default SingleWordTokenizer;