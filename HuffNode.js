/**
 * This is a basic Node implementation for the Huffman Priority Queue.
 * Leaf symbols can be text characters or byte values.
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
