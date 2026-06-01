/**
* Basic Priority Queue Implementation as a min heap 
* With using Nodes as Input
*/
class PriorityQueue{
    // based on a min heap
    // min heap must not be in order 
    // only parent is smaller than child for the root and every subTree
    constructor(){
        this.items =[]
    }
    isValidNode(node) {
    return node instanceof HuffNode &&
        (typeof node.char === "string" || node.char === null) &&
        typeof node.freq === "number" &&
        (node.left === null || node.left instanceof HuffNode) &&
        (node.right === null || node.right instanceof HuffNode);
    }   
    left(i){
        return((2*i)+1);
    }
    // get indicies back of left and right nodes 
    right(i){
        return((2*i)+2);
    }
    parent(i){
        return Math.floor((i-1)/2);
    }
    getMin(){
        return(this.items[0]);
    }
    insert(node){
       // check if valid Node
       if (!this.isValidNode(node)) {
           throw new TypeError("Input must be a Node with:[string, number,node?,node?]");
       }
       // insert at the end  
       let arr = this.items;
       arr.push(node);
       // check if we need to switch parent and inserted
       let i = arr.length -1;
       while(i > 0 && arr[this.parent(i)][1] > arr[i][1]){
        let p = this.parent(i);
        [arr[i],arr[p]] = [arr[p], arr[i]];
        i = p;
       }
    }
    // assumes that the val < arr[i]
    decreaseKey(i,new_val){
        let arr = this.items;
        arr[i][1] =  new_val;

        while (i > 0 && arr[this.parent(i)][1] > arr[i][1])
        {
            let p = this.parent(i);
            [arr[i], arr[p]] = [arr[p], arr[i]];
            i = p;
        }
    }
    // extract Root 
    extractMin(){
        let arr = this.items;
        if(arr.length ==1){
            return arr.pop();
        }
        // store min value to return
        // restore heap feature of root
        let min = arr[0];
        arr[0] = arr[arr.length-1];
        arr.pop();
        this.minHeapify(0);

        return min;
    }

    // assume subtrees are already heapified
    minHeapify(i){
        let arr = this.items;
        // look at children swap with smallest child
        let smallest = i;
        let length = arr.length;
        let l = this.left(i);
        let r = this.right(i);
        if(l < length && arr[l][1] < arr[smallest][1]){
            smallest = l;
        }
        if(r < length && arr[r][1] < arr[smallest][1]){
            smallest = r;
        }
        // check if we don´t have to swap because parent is the smallest
        if(smallest !== i){
            [arr[i],arr[smallest]] =  [arr[smallest],arr[i]];
            this.minHeapify(smallest);
        }
    }
}