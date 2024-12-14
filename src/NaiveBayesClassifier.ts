import MachineLearningModel from "./IMachineLearningModel";
import Tokenizer from "./ITokenizer";
import SingleWordTokenizer from "./SingleWordTokenizer";
import * as Blockly from 'blockly/core';

class NaiveBayesClassifier implements MachineLearningModel {
    private tokenizer: Tokenizer
    private totalDescriptions: number
    private tokenFrequencyMap: Map<string,number>
    private blockFrequencyMap:Map<string,number>
    private tokenBlockFrequencyMap: Map<string,number>

    constructor(options:{tokenizer?:Tokenizer}) {
        this.tokenizer = options.tokenizer || new SingleWordTokenizer() /* step 4 here || means or */
        this.totalDescriptions = 0
        this.tokenBlockFrequencyMap = new Map<string,number>()
        this.blockFrequencyMap = new Map<string,number>()
        this.tokenFrequencyMap = new Map<string,number>()

        
    }
    toKey(a:string[]): string {
        return JSON.stringify(a)
    }
    decodeKey(a:string): string[] {
        return JSON.parse(a)
    }
    train(data: { description:string; blocks:Blockly.Block[] }[]): any {
        this.totalDescriptions += data.length;
        for(let dataPoint of data) {
            const uniqueTokens = new Set(this.tokenizer.tokenize(dataPoint.description));
            const blockTypes = new Set(dataPoint.blocks.map(block => block.type))
            for(let bt of blockTypes) {
                this.blockFrequencyMap.set(bt,(this.blockFrequencyMap.get(bt)||0) +1) 
            }
            for(let ut of uniqueTokens) {
                if (this.tokenFrequencyMap.has(ut)) {
                    this.tokenFrequencyMap.set(ut,this.tokenFrequencyMap.get(ut)!+1)
                } else {
                    this.tokenFrequencyMap.set(ut,1)
    
                }
                for (let b of blockTypes) {
                    const key = this.toKey([ut,b]);
                    this.tokenBlockFrequencyMap.set(key,(this.tokenBlockFrequencyMap.get(key)||0)+1)
                }
                
            }
        }

    }

    getSuggestedBlocks(description: string): Blockly.Block[] {
        // Tokenize the given inputted description
        const arrayTokens = this.tokenizer.tokenize(description)
        // Convert to a set
        const tokenSet = new Set(arrayTokens)
        /*  Filter the Array of key-value pairs from tokenBlockFrequencyMap 
         to only include pairs where the key is one of the tokens in the set. */
         const filteredArray = Array.from(this.tokenBlockFrequencyMap.entries()).filter(([key, value]) => {
            const [token] = this.decodeKey(key);
            return tokenSet.has(token);
        });

        // Then initialize a variable possibleBlockTypes which should be initialized to a set of the items at index 1 from this filtered Array.
        const possibleBlockTypes = new Set(
            filteredArray.map(([key]) => {
                const [, blockType] = this.decodeKey(key); 
                return blockType; 
            }))

        // Now define a variable blockTypeProbabilities
        const blockTypeProbabilities = new Array(); // Add to array later
        const pBlock = 0.5
        const pNotBlock = 0.5

        let denominator = 0
        // Calculating probabilities
        for (const blockType of possibleBlockTypes) {
            let numerator = pBlock
            let pTokensGivenNotBlock = 1;
            
            for (const token of tokenSet) {
                // Calculating probabilities
                const tokenBlockKey = this.toKey([token, blockType]);
                const tokenBlockFrequency = this.tokenBlockFrequencyMap.get(tokenBlockKey) || 0;
                const tokenFrequency = this.tokenFrequencyMap.get(token) || 0;

                const blockFrequency = this.blockFrequencyMap.get(blockType) || 0;
                const notBlockFrequency = this.totalDescriptions - blockFrequency;

                const pTokenGivenBlock = blockFrequency > 0 ? tokenBlockFrequency / blockFrequency : 0;

                numerator *= pTokenGivenBlock

                const pTokenGivenNotBlock = notBlockFrequency > 0
                ? (tokenFrequency - tokenBlockFrequency) / notBlockFrequency
                : 0;
                pTokensGivenNotBlock *= pTokenGivenNotBlock;

            }

            const denominator = numerator + pNotBlock * pTokensGivenNotBlock;
            const probability = numerator / denominator;
        
            blockTypeProbabilities.push({ block: blockType, probability });

        }
        // Step 13
        return(blockTypeProbabilities.sort((prob1, prob2) => prob2.probability - prob1.probability))
    }

}

export default NaiveBayesClassifier;