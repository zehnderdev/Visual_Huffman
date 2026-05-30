function visualizeHuffman() {
    const input = document.querySelector('#Input').value;
    document.querySelector('#huffmanTree').innerHTML = `<p>You entered: ${input}</p>`; 
    let charFreq = new Map();
    charFreq.set(input.charAt(0),1);
    for (let i = 1; i < input.length; i++) {
        const char = input.charAt(i);
        // check if we already have char in map
        charFreq.set(char,(charFreq.has(char)? charFreq.get(char):0)+1)
    }
    console.log(charFreq);
    
    for (const [char,freq] of charFreq.entries()) {
        document.querySelector('#huffmanTree').innerHTML += `<p>${char} with frequencie :  ${freq} </p>`
    }
    document.getElementById('Step').style.display = "inline";
}
function stepHuffman(){
    document.querySelector('#huffmanTree').innerHTML += '<p>Bomba</p>'
}

function fullHuffman(char,freq,n){
    let queue = new PriorityQueue();

}


class PriorityQueue{
    // based on a min heap
    // min heap must not be in order 
    // only parent is smaller than child for the root and every subTree
    constructor(){
        this.items =[]
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
    insert(tuple){
       // insert at the end  
       let arr = this.items;
       arr.push(tuple);
       // check if we need to switch parent and inserted
       let i = arr.length -1;
       while(i > 0 && arr[this.parent(i)] > arr[i]){
        let p = this.parent(i);
        [arr[i],arr[p]] = [arr[p], arr[i]];
        i = p;
       }
    }
    // assumes that the val < arr[i]
    decreaseKey(i,new_val){
        let arr = this.items;
        arr[i] =  new_val;

        while (i > 0 && arr[this.parent(i)] > arr[i])
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
        if(l < length && arr[l] < arr[smallest]){
            smallest = l;
        }
        if(r < length && arr[r] < arr[smallest]){
            smallest = r;
        }
        // check if we don´t have to swap because parent is the smallest
        if(smallest !== i){
            [arr[i],arr[smallest]] =  [arr[smallest],arr[i]];
            this.minHeapify(smallest);
        }
    }
}