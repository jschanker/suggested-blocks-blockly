import Tokenizer from "./ITokenizer";

class SingleWordTokenizer implements Tokenizer {
    tokenize(a:string): string[] {
        return a.toLocaleLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split("");
        
    }
}

export default SingleWordTokenizer;