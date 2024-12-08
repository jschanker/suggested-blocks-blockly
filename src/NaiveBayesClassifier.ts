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
        const uniqueTokens = new Set(this.tokenizer.tokenize(description));
    
        const filteredEntries = Array.from(this.tokenBlockFrequencyMap.entries()).filter(([key]) => {
            const [token] = this.decodeKey(key);
            return uniqueTokens.has(token);
        });
    
        const blockScores: Map<string, number> = new Map();
    
        for (const [key, frequency] of filteredEntries) {
            const [token, blockType] = this.decodeKey(key);
            const nBlock = this.blockFrequencyMap.get(blockType) || 0;
            const nTokenAndBlock = frequency;
    
            if (nBlock > 0) {
                const tokenBlockProbability = nTokenAndBlock / nBlock;
                const blockProbability = nBlock / this.totalDescriptions;
    
                const score = tokenBlockProbability * blockProbability;
                blockScores.set(blockType, (blockScores.get(blockType) || 0) + score);
            }
        }
    
        const result = Array.from(blockScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([blockType]) => {
                const workspace = new Blockly.Workspace();
                return workspace.newBlock(blockType);
            });
    
        return result;
    }
    
    
    
    
    }

export default NaiveBayesClassifier;