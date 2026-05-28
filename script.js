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
}