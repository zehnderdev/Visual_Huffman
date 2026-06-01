/**
 * This is a basic Node implementation for the Huffman Priority Queue
 */
class HuffNode{
    char;
    freq;
    left;
    right;
    constructor (char,freq,left=null,right=null){
        this.char = char;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}