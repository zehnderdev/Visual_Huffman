const TREE_VARIANTS = [
    { id: "wide-tidy", name: "01 Wide tidy", strategy: "tidy", edge: "straight", xGap: 162, yGap: 112 },
    { id: "balanced-tidy", name: "02 Balanced tidy", strategy: "tidy", edge: "straight", xGap: 122, yGap: 108 },
    { id: "compressed-depth", name: "03 Compressed depth", strategy: "tidy", edge: "elbow", xGap: 108, yGap: 102, yPower: 0.82 },
    { id: "binary-slots", name: "04 Binary slots", strategy: "binarySlots", edge: "straight", xGap: 104, yGap: 108 },
    { id: "binary-heap", name: "05 Heap slots", strategy: "binarySlots", edge: "elbow", xGap: 82, yGap: 98, heapTight: true },
    { id: "compact-tidy", name: "06 Compact tidy", strategy: "tidy", edge: "orthogonal", xGap: 86, yGap: 92 }
];

const huffmanState = {
    sourceType: "text",
    input: "",
    root: null,
    charFreq: null,
    tableVisible: false,
    selectedVariant: "wide-tidy",
    file: null,
    fileCompression: null,
    compressedBlob: null,
    downloadUrl: null,
    fileBusy: false
};

function fullHuffman() {
    const prepared = prepareHuffmanState();
    if (!prepared) {
        return;
    }

    updateTableButton();
    renderHuffmanOutput(huffmanState.root);
}

function showHuffmanTable() {
    if (!huffmanState.root || !huffmanState.charFreq) {
        const prepared = prepareHuffmanState();
        if (!prepared) {
            return;
        }
    }

    if (huffmanState.tableVisible) {
        huffmanState.tableVisible = false;
        document.querySelector("#huffmanTree").innerHTML = renderCurrentSummary();
        updateTableButton();
        return;
    }

    huffmanState.tableVisible = true;
    document.querySelector("#huffmanTree").innerHTML = renderHuffmanTable(huffmanState.root, huffmanState.charFreq);
    updateTableButton();
}

function setTreeVariant(variantId) {
    huffmanState.selectedVariant = variantId;
    renderHuffmanOutput(huffmanState.root);
}

function prepareHuffmanState() {
    const input = document.querySelector("#Input").value;

    if (input.length === 0) {
        huffmanState.sourceType = "text";
        huffmanState.input = "";
        huffmanState.root = null;
        huffmanState.charFreq = null;
        huffmanState.fileCompression = null;
        huffmanState.tableVisible = false;
        document.querySelector("#huffmanTree").innerHTML = `<p class="empty-state">Enter text first.</p>`;
        document.querySelector("#HuffmanRoot").innerHTML = "";
        clearDownloadLink();
        updateTableButton();
        return false;
    }

    const charFreq = getCharFrequency(input);
    const root = buildHuffmanTree(charFreq);

    huffmanState.sourceType = "text";
    huffmanState.input = input;
    huffmanState.root = root;
    huffmanState.charFreq = charFreq;
    huffmanState.fileCompression = null;
    huffmanState.tableVisible = false;
    clearDownloadLink();

    document.querySelector("#huffmanTree").innerHTML = renderCurrentSummary();

    return true;
}

function updateTableButton() {
    const tableButton = document.querySelector("#Table");

    tableButton.hidden = !huffmanState.root;
    tableButton.textContent = huffmanState.tableVisible ? "Hide Table" : "Table";
}

function renderCurrentSummary() {
    if (huffmanState.sourceType === "file") {
        return renderFileSummary();
    }

    return renderFrequencyList(huffmanState.charFreq);
}

function renderFileSummary() {
    const file = huffmanState.file;
    const byteFreq = huffmanState.charFreq;
    const compression = huffmanState.fileCompression || { payload: new Uint8Array(0), bitLength: 0 };
    const compressedBlob = huffmanState.compressedBlob;

    if (!file || !byteFreq) {
        return `<p class="empty-state">No file selected.</p>`;
    }

    const stats = getFileStats(file, byteFreq, compression, compressedBlob);

    return `
        <div class="file-result-header">
            <div>
                <strong>${escapeHTML(file.name || "file")}</strong>
                <span>${escapeHTML(file.type || "application/octet-stream")}</span>
            </div>
            <div>
                <strong>${escapeHTML(getCompressedFileName(file.name))}</strong>
                <span>${escapeHTML(stats.finalSize)}</span>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card"><span>Original</span><strong>${escapeHTML(stats.originalSize)}</strong></div>
            <div class="stat-card"><span>Bytes</span><strong>${escapeHTML(stats.totalBytes)}</strong></div>
            <div class="stat-card"><span>Symbole</span><strong>${escapeHTML(stats.uniqueSymbols)}</strong></div>
            <div class="stat-card"><span>Bitstream</span><strong>${escapeHTML(stats.huffmanBits)} bits</strong></div>
            <div class="stat-card"><span>Payload</span><strong>${escapeHTML(stats.payloadSize)}</strong></div>
            <div class="stat-card"><span>Gespart</span><strong>${escapeHTML(stats.finalPercent)}%</strong></div>
        </div>
        ${renderFrequencyList(byteFreq)}
    `;
}

function getFileStats(file, byteFreq, compression, compressedBlob) {
    const originalSize = file.size;
    const finalSize = compressedBlob ? compressedBlob.size : 0;
    const finalPercent = originalSize === 0
        ? 0
        : ((originalSize - finalSize) / originalSize) * 100;

    return {
        originalSize: formatBytes(originalSize),
        totalBytes: Array.from(byteFreq.values()).reduce((sum, freq) => sum + freq, 0),
        uniqueSymbols: byteFreq.size,
        huffmanBits: compression.bitLength,
        payloadSize: formatBytes(compression.payload.length),
        finalSize: formatBytes(finalSize),
        finalPercent: finalPercent.toFixed(1)
    };
}

function updateFileControls() {
    const button = document.querySelector("#CompressFile");
    const file = huffmanState.file;

    if (!button) {
        return;
    }

    button.disabled = !file || huffmanState.fileBusy;
    button.textContent = huffmanState.fileBusy ? "Compressing..." : "Compress file";

    if (!file) {
        setFileStatus("No file selected.");
    } else if (!huffmanState.fileBusy) {
        setFileStatus(`${file.name || "file"} - ${formatBytes(file.size)}`);
    }
}

function setFileBusy(isBusy) {
    huffmanState.fileBusy = isBusy;
    updateFileControls();
}

function setFileStatus(message) {
    const status = document.querySelector("#FileStatus");

    if (status) {
        status.textContent = message;
    }
}

function clearDownloadLink() {
    if (huffmanState.downloadUrl) {
        URL.revokeObjectURL(huffmanState.downloadUrl);
    }

    huffmanState.downloadUrl = null;
    huffmanState.compressedBlob = null;

    const link = document.querySelector("#DownloadFile");

    if (!link) {
        return;
    }

    link.hidden = true;
    link.removeAttribute("href");
    link.removeAttribute("download");
    link.textContent = "Download .vhuff";
}

function updateDownloadLink(file, compressedBlob, downloadUrl) {
    const link = document.querySelector("#DownloadFile");

    if (!link) {
        return;
    }

    link.hidden = false;
    link.href = downloadUrl;
    link.download = getCompressedFileName(file.name);
    link.textContent = `Download .vhuff (${formatBytes(compressedBlob.size)})`;
}

function getCharFrequency(input) {
    const charFreq = new Map();

    for (const char of input) {
        charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    return charFreq;
}

async function handleFileSelection(event) {
    const [file] = event.target.files;

    huffmanState.file = file || null;
    updateFileControls();

    if (file) {
        await compressSelectedFile();
    }
}

async function compressSelectedFile() {
    const fileInput = document.querySelector("#FileInput");
    const file = huffmanState.file || (fileInput && fileInput.files[0]);

    if (!file) {
        setFileStatus("No file selected.");
        updateFileControls();
        return;
    }

    setFileBusy(true);
    setFileStatus(`${file.name || "file"} - ${formatBytes(file.size)}`);

    try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const byteFreq = getByteFrequency(bytes);
        const root = buildHuffmanTree(byteFreq);
        const codes = root ? getHuffmanCodes(root) : new Map();
        const compression = root
            ? compressBytes(bytes, codes)
            : { payload: new Uint8Array(0), bitLength: 0 };
        const compressedBlob = createCompressedHuffmanFile(file, byteFreq, codes, compression);

        clearDownloadLink();

        const downloadUrl = URL.createObjectURL(compressedBlob);

        huffmanState.sourceType = "file";
        huffmanState.file = file;
        huffmanState.root = root;
        huffmanState.charFreq = byteFreq;
        huffmanState.fileCompression = compression;
        huffmanState.compressedBlob = compressedBlob;
        huffmanState.downloadUrl = downloadUrl;
        huffmanState.tableVisible = false;

        updateDownloadLink(file, compressedBlob, downloadUrl);
        updateFileControls();
        updateTableButton();

        document.querySelector("#huffmanTree").innerHTML = renderCurrentSummary();
        renderHuffmanOutput(root);
    } catch (error) {
        console.error(error);
        clearDownloadLink();
        setFileStatus("File compression failed.");
    } finally {
        setFileBusy(false);
    }
}

function getByteFrequency(bytes) {
    const byteFreq = new Map();

    for (const byte of bytes) {
        byteFreq.set(byte, (byteFreq.get(byte) || 0) + 1);
    }

    return byteFreq;
}

function compressBytes(bytes, codes) {
    const bitLength = bytes.reduce((sum, byte) => sum + (codes.get(byte) || "").length, 0);
    const payload = new Uint8Array(Math.ceil(bitLength / 8));
    let bitIndex = 0;

    for (const byte of bytes) {
        const code = codes.get(byte) || "";

        for (const bit of code) {
            if (bit === "1") {
                payload[bitIndex >> 3] |= 1 << (7 - (bitIndex & 7));
            }

            bitIndex += 1;
        }
    }

    return { payload, bitLength };
}

function createCompressedHuffmanFile(file, byteFreq, codes, compression) {
    const header = {
        format: "visual-huffman",
        version: 1,
        originalName: file.name || "file",
        mimeType: file.type || "",
        originalSize: file.size,
        bitLength: compression.bitLength,
        paddingBits: (8 - (compression.bitLength % 8)) % 8,
        frequencies: Array.from(byteFreq.entries())
            .sort(([byteA], [byteB]) => byteA - byteB),
        codes: Array.from(codes.entries())
            .sort(([byteA], [byteB]) => byteA - byteB)
    };
    const encoder = new TextEncoder();
    const headerBytes = encoder.encode(JSON.stringify(header));
    const prefix = new Uint8Array(8);
    const view = new DataView(prefix.buffer);

    prefix[0] = 0x56;
    prefix[1] = 0x48;
    prefix[2] = 0x46;
    prefix[3] = 0x31;
    view.setUint32(4, headerBytes.length, true);

    return new Blob([prefix, headerBytes, compression.payload], {
        type: "application/x-visual-huffman"
    });
}

function buildHuffmanTree(charFreq) {
    const queue = new PriorityQueue();
    const entries = Array.from(charFreq.entries())
        .sort(compareFrequencyEntriesAscending);

    if (entries.length === 0) {
        return null;
    }

    for (let i = 0; i < entries.length; i++) {
        const [char, freq] = entries[i];
        const leaf = new HuffNode(char, freq);
        leaf._leafOrder = i;
        queue.insert(leaf);
    }

    if (queue.items.length === 1) {
        return queue.extractMin();
    }

    while (queue.items.length > 1) {
        const left = queue.extractMin();
        const right = queue.extractMin();
        const merged = new HuffNode(null, left.freq + right.freq, left, right);

        queue.insert(merged);
    }

    return queue.extractMin();
}

function renderHuffmanOutput(root) {
    if (!root) {
        const message = huffmanState.sourceType === "file"
            ? "No Huffman tree for an empty file."
            : "Build a tree first.";
        document.querySelector("#HuffmanRoot").innerHTML = `<p class="empty-state">${message}</p>`;
        return;
    }

    document.querySelector("#HuffmanRoot").innerHTML = renderTree(root);
    bindTreeInteractions();
}

function renderTree(root) {
    const activeVariant = getVariantById(huffmanState.selectedVariant);

    return `
        ${renderVariantToolbar()}
        <div class="tree-gallery single-view">
            ${renderTreeCard(root, activeVariant)}
        </div>
    `;
}

function renderVariantToolbar() {
    const buttons = TREE_VARIANTS.map((variant) => {
        const active = huffmanState.selectedVariant === variant.id;
        return `<button type="button" class="variant-tab ${active ? "active" : ""}" onclick="setTreeVariant('${variant.id}')">${escapeHTML(variant.name)}</button>`;
    }).join("");

    return `
        <div class="variant-toolbar">
            <div class="variant-tabs">${buttons}</div>
        </div>
    `;
}

function renderTreeCard(root, variant) {
    return `
        <article class="tree-card ${variant.id}" data-variant="${variant.id}" data-root-freq="${escapeAttr(root.freq)}">
            <header class="tree-card-header">
                <h2>${escapeHTML(variant.name)}</h2>
                <output class="tree-code-readout">root ${escapeHTML(root.freq)}</output>
            </header>
            <div class="tree-visual">
                ${renderTreeSvg(root, variant)}
            </div>
        </article>
    `;
}

function renderTreeSvg(root, variant) {
    const drawing = createTreeDrawing(root, variant);

    return `
        <svg class="huffman-svg ${variant.id}"
            viewBox="0 0 ${drawing.width} ${drawing.height}"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="${escapeAttr(variant.name)} Huffman tree">
            <g class="tree-extras">
                ${drawing.extras.map((extra) => renderTreeExtra(extra)).join("")}
            </g>
            <g class="tree-edges">
                ${drawing.edges.map((edge) => renderTreeEdge(edge)).join("")}
            </g>
            <g class="tree-edge-labels">
                ${drawing.edges.map((edge) => renderTreeEdgeLabel(edge)).join("")}
            </g>
            <g class="tree-nodes">
                ${drawing.nodes.map((node) => renderTreeNode(node)).join("")}
            </g>
        </svg>
    `;
}

function createTreeDrawing(root, variant) {
    const base = createBaseLayout(root);

    if (variant.strategy === "level") {
        applyLevelLayout(base, variant);
    } else if (variant.strategy === "weighted") {
        applyWeightedLayout(base, variant);
    } else if (variant.strategy === "binarySlots") {
        applyBinarySlotLayout(base, variant);
    } else if (variant.strategy === "fan") {
        applyFanLayout(base, variant);
    } else if (variant.strategy === "trunk") {
        applyTrunkLayout(base, variant);
    } else {
        applyTidyLayout(base, variant);
    }

    applyShapeTransform(base, variant);
    const extras = createLayoutExtras(base, variant);

    return finalizeDrawing(base, variant, extras);
}

function applyTidyLayout(base, variant) {
    const xGap = variant.xGap || 118;
    const yGap = variant.yGap || 108;
    const yPower = variant.yPower || 1;

    for (const item of base.nodes) {
        item.x = item.xIndex * xGap;
        item.y = Math.pow(item.depth, yPower) * yGap;

        if (variant.levelOffset && item.depth % 2 === 1) {
            item.x += variant.levelOffset;
        }
    }
}

function applyLevelLayout(base, variant) {
    const xGap = variant.xGap || 112;
    const yGap = variant.yGap || 104;

    for (const level of base.levels) {
        const startX = -((level.length - 1) * xGap) / 2;

        level.forEach((item, index) => {
            item.x = startX + index * xGap;
            item.y = item.depth * yGap;
        });
    }
}

function applyWeightedLayout(base, variant) {
    const xGap = variant.xGap || 58;
    const yGap = variant.yGap || 108;
    const power = variant.weightPower ?? 0.5;
    let cursor = 0;
    const xByNode = new Map();
    const widthByNode = new Map();

    base.leaves.forEach((leaf) => {
        const width = Math.max(1, Math.pow(leaf.node.freq, power)) * xGap;
        widthByNode.set(leaf.node, width);
        xByNode.set(leaf.node, cursor + width / 2);
        cursor += width;
    });

    function assignInternal(item) {
        if (xByNode.has(item.node)) {
            return { x: xByNode.get(item.node), width: widthByNode.get(item.node) };
        }

        const left = assignInternal(base.nodeMap.get(item.node.left));
        const right = assignInternal(base.nodeMap.get(item.node.right));
        const width = left.width + right.width;
        const x = (left.x * left.width + right.x * right.width) / width;
        xByNode.set(item.node, x);
        widthByNode.set(item.node, width);
        return { x, width };
    }

    assignInternal(base.root);

    for (const item of base.nodes) {
        item.x = xByNode.get(item.node);
        item.y = item.depth * yGap;
    }
}

function applyBinarySlotLayout(base, variant) {
    const xGap = variant.xGap || 96;
    const yGap = variant.yGap || 104;
    const maxSlots = Math.pow(2, Math.min(base.maxDepth, variant.heapTight ? 5 : 6));
    const totalWidth = Math.max(base.leafCount * xGap, maxSlots * xGap * 0.72);

    for (const item of base.nodes) {
        if (item.depth === 0) {
            item.x = 0;
        } else {
            const value = parseInt(item.path, 2);
            const slots = Math.pow(2, item.depth);
            item.x = ((value + 0.5) / slots - 0.5) * totalWidth;
        }

        item.y = item.depth * yGap;
    }
}

function applyFanLayout(base, variant) {
    const xGap = variant.xGap || 170;
    const yGap = variant.yGap || 106;
    const ratio = variant.fanRatio || 0.64;

    base.root.x = 0;
    base.root.y = 0;

    function placeChildren(item) {
        if (item.isLeaf) {
            return;
        }

        const spread = xGap * Math.pow(ratio, item.depth);
        const left = base.nodeMap.get(item.node.left);
        const right = base.nodeMap.get(item.node.right);

        left.x = item.x - spread;
        right.x = item.x + spread;
        left.y = (left.depth * yGap);
        right.y = (right.depth * yGap);

        placeChildren(left);
        placeChildren(right);
    }

    placeChildren(base.root);
}

function applyTrunkLayout(base, variant) {
    const xGap = variant.xGap || 96;
    const yGap = variant.yGap || 108;
    const center = (base.leafCount - 1) / 2;

    for (const item of base.nodes) {
        const leftTurns = (item.path.match(/0/g) || []).length;
        const rightTurns = (item.path.match(/1/g) || []).length;
        const trunkPull = (rightTurns - leftTurns) * xGap * 0.42;
        const leafPull = (item.xIndex - center) * xGap * 0.34;

        item.x = trunkPull + leafPull;
        item.y = item.depth * yGap;
    }
}

function applyShapeTransform(base, variant) {
    if (!variant.shape) {
        return;
    }

    const center = average(base.leaves.map((leaf) => leaf.x));

    for (const item of base.nodes) {
        const depthT = item.depth / Math.max(base.maxDepth, 1);
        const relative = item.x - center;

        if (variant.shape === "hourglass") {
            item.x = center + relative * (0.58 + depthT * 0.72);
        }

        if (variant.shape === "bow") {
            item.x = center + relative * (1 + Math.sin(depthT * Math.PI) * 0.34);
        }
    }
}

function createLayoutExtras(base, variant) {
    if (variant.extras === "boxes") {
        return createSubtreeBoxes(base);
    }

    if (variant.extras === "columns") {
        return createSubtreeColumns(base);
    }

    if (variant.extras === "icicle") {
        return createIcicleBars(base);
    }

    return [];
}

function createSubtreeBoxes(base) {
    const extras = [];

    for (const item of base.nodes) {
        if (item.isLeaf) {
            continue;
        }

        const descendants = base.leaves.filter((leaf) => leaf.leafStart >= item.leafStart && leaf.leafEnd <= item.leafEnd);
        const minX = Math.min(...descendants.map((leaf) => leaf.x)) - 44;
        const maxX = Math.max(...descendants.map((leaf) => leaf.x)) + 44;
        const maxY = Math.max(...descendants.map((leaf) => leaf.y)) + 42;

        extras.push({
            type: "rect",
            className: "subtree-box",
            x: minX,
            y: item.y - 42,
            width: maxX - minX,
            height: maxY - item.y + 42
        });
    }

    return extras;
}

function createSubtreeColumns(base) {
    return base.leaves.map((leaf) => ({
        type: "rect",
        className: "subtree-column",
        x: leaf.x - 38,
        y: -36,
        width: 76,
        height: leaf.y + 78
    }));
}

function createIcicleBars(base) {
    return base.nodes.map((item) => {
        const descendants = base.leaves.filter((leaf) => leaf.leafStart >= item.leafStart && leaf.leafEnd <= item.leafEnd);
        const minX = Math.min(...descendants.map((leaf) => leaf.x)) - 40;
        const maxX = Math.max(...descendants.map((leaf) => leaf.x)) + 40;

        return {
            type: "rect",
            className: item.isLeaf ? "icicle-bar leaf-bar" : "icicle-bar",
            x: minX,
            y: item.y - 29,
            width: maxX - minX,
            height: 58
        };
    });
}

function createBaseLayout(root) {
    const nodes = [];
    const nodeMap = new Map();
    let leafCursor = 0;
    let maxDepth = 0;

    function walk(node, depth, path) {
        maxDepth = Math.max(maxDepth, depth);
        const isLeaf = !node.left && !node.right;
        let xIndex;
        let leafStart;
        let leafEnd;

        if (isLeaf) {
            xIndex = leafCursor;
            leafStart = leafCursor;
            leafEnd = leafCursor;
            leafCursor += 1;
        } else {
            const left = walk(node.left, depth + 1, `${path}0`);
            const right = walk(node.right, depth + 1, `${path}1`);
            xIndex = (left.xIndex + right.xIndex) / 2;
            leafStart = Math.min(left.leafStart, right.leafStart);
            leafEnd = Math.max(left.leafEnd, right.leafEnd);
        }

        const item = {
            node,
            id: nodes.length,
            depth,
            path: isLeaf && path.length === 0 ? "0" : path,
            xIndex,
            leafStart,
            leafEnd,
            isLeaf
        };

        nodes.push(item);
        nodeMap.set(node, item);
        return item;
    }

    const rootItem = walk(root, 0, "");
    const levels = Array.from({ length: maxDepth + 1 }, () => []);

    for (const item of nodes) {
        levels[item.depth].push(item);
    }

    for (const level of levels) {
        level.sort((a, b) => a.xIndex - b.xIndex);
        level.forEach((item, index) => {
            item.levelIndex = index;
            item.levelCount = level.length;
        });
    }

    return {
        nodes,
        nodeMap,
        root: rootItem,
        levels,
        leaves: nodes.filter((item) => item.isLeaf).sort((a, b) => a.xIndex - b.xIndex),
        leafCount: Math.max(leafCursor, 1),
        maxDepth
    };
}

function finalizeDrawing(base, variant, extras = []) {
    normalizeDrawing(base, extras);

    const edges = [];

    for (const parent of base.nodes) {
        if (parent.node.left) {
            edges.push(createEdge(parent, base.nodeMap.get(parent.node.left), "0", base.root.node.freq, variant.edge));
        }

        if (parent.node.right) {
            edges.push(createEdge(parent, base.nodeMap.get(parent.node.right), "1", base.root.node.freq, variant.edge));
        }
    }

    const bounds = getBounds(base.nodes, extras);

    return {
        nodes: base.nodes,
        edges,
        extras,
        width: Math.ceil(Math.max(540, bounds.maxX + 74)),
        height: Math.ceil(Math.max(320, bounds.maxY + 74))
    };
}

function normalizeDrawing(base, extras) {
    const bounds = getBounds(base.nodes, extras);
    const actualWidth = bounds.maxX - bounds.minX + 148;
    const actualHeight = bounds.maxY - bounds.minY + 148;
    const extraX = Math.max(0, 540 - actualWidth) / 2;
    const extraY = Math.max(0, 320 - actualHeight) / 2;
    const shiftX = 74 - bounds.minX + extraX;
    const shiftY = 74 - bounds.minY + extraY;

    for (const item of base.nodes) {
        item.x += shiftX;
        item.y += shiftY;
    }

    for (const extra of extras) {
        extra.x += shiftX;
        extra.y += shiftY;
    }
}

function getBounds(nodes, extras) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const item of nodes) {
        minX = Math.min(minX, item.x - 48);
        minY = Math.min(minY, item.y - 52);
        maxX = Math.max(maxX, item.x + 48);
        maxY = Math.max(maxY, item.y + 48);
    }

    for (const extra of extras) {
        minX = Math.min(minX, extra.x);
        minY = Math.min(minY, extra.y);
        maxX = Math.max(maxX, extra.x + extra.width);
        maxY = Math.max(maxY, extra.y + extra.height);
    }

    return { minX, minY, maxX, maxY };
}

function createEdge(parent, child, branch, rootFreq, edgeStyle = "curve") {
    const start = { x: parent.x, y: parent.y };
    const end = { x: child.x, y: child.y };
    const path = getEdgePath(start, end, edgeStyle);
    const labelPoint = getLabelPoint(start, end);

    return {
        parent,
        child,
        branch,
        labelX: labelPoint.x,
        labelY: labelPoint.y,
        path,
        weight: child.node.freq / rootFreq
    };
}

function getLabelPoint(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const offset = 23;
    let normalX = dy / length;
    let normalY = -dx / length;

    if (normalY > 0) {
        normalX *= -1;
        normalY *= -1;
    }

    return {
        x: midX + normalX * offset,
        y: midY + normalY * offset - 8
    };
}

function getEdgePath(start, end, edgeStyle) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const midX = start.x + dx / 2;
    const midY = start.y + dy / 2;

    if (edgeStyle === "straight") {
        return `M ${point(start)} L ${point(end)}`;
    }

    if (edgeStyle === "orthogonal") {
        return `M ${point(start)} V ${midY.toFixed(1)} H ${end.x.toFixed(1)} V ${end.y.toFixed(1)}`;
    }

    if (edgeStyle === "elbow") {
        return `M ${point(start)} V ${midY.toFixed(1)} H ${end.x.toFixed(1)} V ${end.y.toFixed(1)}`;
    }

    if (edgeStyle === "bracket") {
        const bracketY = start.y + dy * 0.58;
        return `M ${point(start)} V ${bracketY.toFixed(1)} H ${end.x.toFixed(1)} V ${end.y.toFixed(1)}`;
    }

    return `M ${point(start)} C ${start.x.toFixed(1)} ${(start.y + dy * 0.48).toFixed(1)}, ${end.x.toFixed(1)} ${(end.y - dy * 0.48).toFixed(1)}, ${point(end)}`;
}

function point(item) {
    return `${item.x.toFixed(1)} ${item.y.toFixed(1)}`;
}

function renderTreeExtra(extra) {
    if (extra.type !== "rect") {
        return "";
    }

    return `
        <rect class="tree-extra ${escapeAttr(extra.className)}"
            x="${extra.x.toFixed(1)}"
            y="${extra.y.toFixed(1)}"
            width="${extra.width.toFixed(1)}"
            height="${extra.height.toFixed(1)}"
            rx="10"></rect>
    `;
}

function renderTreeEdge(edge) {
    return `
        <path class="tree-edge code-${edge.branch === "0" ? "zero" : "one"}"
            d="${edge.path}"
            data-code-path="${escapeAttr(edge.child.path)}"
            data-branch="${edge.branch}"
            style="--edge-weight: ${edge.weight.toFixed(3)}"></path>
    `;
}

function renderTreeEdgeLabel(edge) {
    return `
        <g class="edge-label code-${edge.branch === "0" ? "zero" : "one"}"
            transform="translate(${edge.labelX.toFixed(1)} ${edge.labelY.toFixed(1)})">
            <rect x="-13" y="-13" width="26" height="22" rx="11"></rect>
            <text x="0" y="3">${edge.branch}</text>
        </g>
    `;
}

function renderTreeNode(item) {
    const symbol = getNodeSymbol(item.node, item.isLeaf);
    const displayFreq = item.isLeaf ? `x${item.node.freq}` : item.node.freq;
    const nodeKind = item.isLeaf ? "leaf" : "internal";
    const rootClass = item.depth === 0 ? "root-node" : "";

    return `
        <g class="tree-node ${nodeKind} ${rootClass}"
            transform="translate(${item.x.toFixed(1)} ${item.y.toFixed(1)})"
            data-code="${escapeAttr(item.path)}"
            data-symbol="${escapeAttr(symbol)}"
            data-freq="${escapeAttr(item.node.freq)}">
            <title>${escapeHTML(symbol)} ${escapeHTML(item.node.freq)} ${escapeHTML(item.path)}</title>
            <circle class="node-halo" r="34"></circle>
            <circle class="node-core" r="26"></circle>
            <text class="node-symbol" x="0" y="-2">${escapeHTML(symbol)}</text>
            <text class="node-freq" x="0" y="17">${escapeHTML(displayFreq)}</text>
        </g>
    `;
}

function bindTreeInteractions() {
    document.querySelectorAll(".tree-card").forEach((card) => {
        const readout = card.querySelector(".tree-code-readout");

        card.querySelectorAll(".tree-node").forEach((node) => {
            node.addEventListener("mouseenter", () => {
                const code = node.dataset.code || "";
                const symbol = node.dataset.symbol || "root";

                card.querySelectorAll(".tree-edge").forEach((edge) => {
                    const edgePath = edge.dataset.codePath || "";
                    edge.classList.toggle("is-hot", code.length > 0 && edgePath.length > 0 && code.startsWith(edgePath));
                });

                card.querySelectorAll(".tree-node").forEach((otherNode) => {
                    const nodeCode = otherNode.dataset.code || "";
                    otherNode.classList.toggle("is-hot", code.length > 0 && nodeCode.length > 0 && code.startsWith(nodeCode));
                });

                readout.textContent = code.length > 0 ? `${symbol} = ${code}` : `${symbol} ${node.dataset.freq}`;
            });
        });

        card.addEventListener("mouseleave", () => {
            card.querySelectorAll(".is-hot").forEach((element) => element.classList.remove("is-hot"));
            readout.textContent = `root ${card.dataset.rootFreq || ""}`;
        });
    });
}

function renderFrequencyList(charFreq) {
    if (!charFreq || charFreq.size === 0) {
        return `<p class="empty-state">No symbols found.</p>`;
    }

    const total = Array.from(charFreq.values()).reduce((sum, freq) => sum + freq, 0);
    const entries = Array.from(charFreq.entries())
        .sort(compareFrequencyEntriesDescending);

    return `
        <div class="frequency-header">
            <span>${escapeHTML(charFreq.size)} ${escapeHTML(getSymbolLabel(charFreq.size))}</span>
            <strong>${escapeHTML(total)} total</strong>
        </div>
        <div class="frequency-grid">
            ${entries.map(([symbol, freq]) => `
                <div class="frequency-chip">
                    <span>${escapeHTML(formatChar(symbol))}</span>
                    <strong>${escapeHTML(freq)}</strong>
                </div>
            `).join("")}
        </div>
    `;
}

function renderHuffmanTable(root, charFreq) {
    if (!root || !charFreq || charFreq.size === 0) {
        return `<p class="empty-state">No Huffman table for empty input.</p>`;
    }

    const codes = getHuffmanCodes(root);
    const stats = getHuffmanStats(charFreq, codes);
    const rows = Array.from(charFreq.entries())
        .sort(([symbolA], [symbolB]) => compareSymbols(symbolA, symbolB));
    const symbolHeader = huffmanState.sourceType === "file" ? "Byte" : "Zeichen";

    return `
        <div class="stats-grid">
            <div class="stat-card"><span>${escapeHTML(symbolHeader)}</span><strong>${escapeHTML(stats.totalSymbols)}</strong></div>
            <div class="stat-card"><span>Symbole</span><strong>${escapeHTML(stats.uniqueSymbols)}</strong></div>
            <div class="stat-card"><span>Originaldaten</span><strong>${escapeHTML(stats.originalBits)} bits</strong></div>
            <div class="stat-card"><span>Huffman</span><strong>${escapeHTML(stats.huffmanBits)} bits</strong></div>
            <div class="stat-card"><span>Gespart</span><strong>${escapeHTML(stats.savedPercent)}%</strong></div>
        </div>
        <div class="table-wrap">
            <table class="huffman-table">
                <thead>
                    <tr><th>${escapeHTML(symbolHeader)}</th><th>Freq</th><th>Code</th></tr>
                </thead>
                <tbody>
                    ${rows.map(([symbol, freq]) => {
                        const code = codes.get(symbol);

                        return `
                            <tr>
                                <td>${escapeHTML(formatChar(symbol))}</td>
                                <td>${escapeHTML(freq)}</td>
                                <td>${escapeHTML(code)}</td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function getHuffmanStats(charFreq, codes) {
    const totalSymbols = Array.from(charFreq.values()).reduce((sum, freq) => sum + freq, 0);
    const huffmanBits = Array.from(charFreq.entries())
        .reduce((sum, [symbol, freq]) => sum + freq * (codes.get(symbol) || "").length, 0);
    const originalBits = totalSymbols * 8;
    const savedPercent = originalBits === 0
        ? 0
        : ((originalBits - huffmanBits) / originalBits) * 100;

    return {
        totalSymbols,
        uniqueSymbols: charFreq.size,
        originalBits,
        huffmanBits,
        savedPercent: savedPercent.toFixed(1)
    };
}

function getHuffmanCodes(root) {
    const codes = new Map();

    function walk(node, code) {
        if (!node.left && !node.right) {
            codes.set(node.char, code || "0");
            return;
        }

        if (node.left) {
            walk(node.left, `${code}0`);
        }

        if (node.right) {
            walk(node.right, `${code}1`);
        }
    }

    walk(root, "");
    return codes;
}

function getVariantById(variantId) {
    return TREE_VARIANTS.find((variant) => variant.id === variantId) || TREE_VARIANTS[0];
}

function getNodeSymbol(node, isLeaf) {
    return isLeaf ? formatChar(node.char) : "sum";
}

function getCompactNodeLabel(node) {
    if (!node.left && !node.right) {
        return `${escapeHTML(formatChar(node.char))}:${escapeHTML(node.freq)}`;
    }

    return `sum:${escapeHTML(node.freq)}`;
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
}

function compareFrequencyEntriesAscending([symbolA, freqA], [symbolB, freqB]) {
    return freqA - freqB || compareSymbols(symbolA, symbolB);
}

function compareFrequencyEntriesDescending([symbolA, freqA], [symbolB, freqB]) {
    return freqB - freqA || compareSymbols(symbolA, symbolB);
}

function compareSymbols(symbolA, symbolB) {
    if (typeof symbolA === "number" && typeof symbolB === "number") {
        return symbolA - symbolB;
    }

    return String(symbolA).localeCompare(String(symbolB));
}

function getSymbolLabel(count) {
    if (huffmanState.sourceType === "file") {
        return count === 1 ? "byte" : "bytes";
    }

    return count === 1 ? "symbol" : "symbols";
}

function formatChar(char) {
    if (typeof char === "number") {
        return `0x${char.toString(16).padStart(2, "0").toUpperCase()}`;
    }

    if (char === " ") {
        return "space";
    }

    if (char === "\n") {
        return "\\n";
    }

    if (char === "\t") {
        return "\\t";
    }

    return char;
}

function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCompressedFileName(fileName) {
    const baseName = (fileName || "file")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .trim() || "file";

    return `${baseName}.vhuff`;
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
    return escapeHTML(value);
}
