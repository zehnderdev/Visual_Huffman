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
    return charFreq;
}
function stepHuffman(){
    document.querySelector('#huffmanTree').innerHTML += '<p>Bomba</p>'
}

function fullHuffman(){
    const map = visualizeHuffman();
    const char = Array.from(map.keys());
    const freq = Array.from(map.values());
    const n = char.length;

    for (let index = 0; index < n; index++) {
        console.log(char[index]);
    }
    for (let index = 0; index < n; index++) {
        console.log(freq[index]);
    }

    let Q = new PriorityQueue(); // 1.

    for (let i = 0; i < n; i++) { // 2.
        const z = new HuffNode(char[i],freq[i]); // A.
        Q.insert(z); // B.
    }
    // Just logging no algo 
    let q_items = Q.items;
    for (let index = 0; index < n; index++) {
        console.log(q_items[index]);
    }
    // end logging

    for (let i = 0; i < n-1; i++) { // 3.
        console.log("Iteration "+i);
        const x = Q.extractMin(); // A.
        const y = Q.extractMin(); // B.
        console.log("x= ",x);
        console.log("y= ",y);
        const z_xy = new HuffNode(x.char+y.char,x.freq+y.freq); // C.
        z_xy.left = x; // D.
        z_xy.right = y; // D.
        printArray(Q.items);
        console.log(z_xy,i);
        
        // TODO: Implement left and right child of node
        Q.insert(z_xy); // E.
        printArray(Q.items);
    }
    console.log(Q.extractMin()); // 4. 
    
}

function printArray(arr){
    for (let index = 0; index < arr.length; index++) {
        console.log("Item "+index+ ":",arr[index]);
    }
}