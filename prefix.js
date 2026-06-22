function checkPrefixFreeFromInput() {
    const input = document.getElementById("CodeInput").value.trim();
    const result = document.getElementById("PrefixResult");

    if (!input) {
        result.innerHTML = '<p class="empty-state">Bitte Codes eingeben – Format: Symbol:Code, z.B. <code>C:00, D:01, E:010</code></p>';
        return;
    }

    const entries = parseCodeInput(input);

    if (entries.length === 0) {
        result.innerHTML = '<p class="empty-state">Keine gültigen Codes gefunden. Beispiel: <code>C:00, D:01, E:010</code></p>';
        return;
    }

    const { violations, duplicates } = findProblems(entries);
    const isPrefixFree = violations.length === 0 && duplicates.length === 0;

    result.innerHTML = renderPrefixCheckResult(entries, violations, duplicates, isPrefixFree);
}

function parseCodeInput(input) {
    const entries = [];
    const parts = input.split(",");

    for (const part of parts) {
        const trimmed = part.trim();
        const colonIdx = trimmed.indexOf(":");
        if (colonIdx === -1) continue;

        const symbol = trimmed.slice(0, colonIdx).trim();
        const code = trimmed.slice(colonIdx + 1).trim();

        if (symbol.length > 0 && /^[01]+$/.test(code)) {
            entries.push({ symbol, code });
        }
    }

    return entries;
}

function findProblems(entries) {
    const violations = [];
    const duplicates = [];

    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            const a = entries[i];
            const b = entries[j];

            if (a.code === b.code) {
                duplicates.push({ a, b });
            } else if (b.code.startsWith(a.code)) {
                violations.push({ prefix: a, longer: b });
            } else if (a.code.startsWith(b.code)) {
                violations.push({ prefix: b, longer: a });
            }
        }
    }

    return { violations, duplicates };
}

function renderPrefixCheckResult(entries, violations, duplicates, isPrefixFree) {
    const violatingSymbols = new Set([
        ...violations.flatMap((v) => [v.prefix.symbol, v.longer.symbol]),
        ...duplicates.flatMap((d) => [d.a.symbol, d.b.symbol])
    ]);

    const statusText = isPrefixFree ? "Präfixfrei ✓" : "Nicht präfixfrei ✗";
    const statusClass = isPrefixFree ? "status-ok" : "status-error";

    const chips = entries.map((e) => {
        const isViolating = violatingSymbols.has(e.symbol);
        return `<div class="code-chip ${isViolating ? "chip-violation" : "chip-ok"}">
            <span class="chip-symbol">${escHTML(e.symbol)}</span><span class="chip-sep">:</span><span class="chip-code">${escHTML(e.code)}</span>
        </div>`;
    }).join("");

    let problemsHtml = "";

    if (duplicates.length > 0) {
        problemsHtml += `<div class="problems-section">
            ${duplicates.map((d) => `<div class="problem-item problem-duplicate">
                <strong>${escHTML(d.a.symbol)}:${escHTML(d.a.code)}</strong> und <strong>${escHTML(d.b.symbol)}:${escHTML(d.b.code)}</strong> haben denselben Code
            </div>`).join("")}
        </div>`;
    }

    if (violations.length > 0) {
        problemsHtml += `<div class="problems-section">
            ${violations.map((v) => `<div class="problem-item problem-prefix">
                <strong>${escHTML(v.prefix.symbol)}:${escHTML(v.prefix.code)}</strong> ist Präfix von <strong>${escHTML(v.longer.symbol)}:${escHTML(v.longer.code)}</strong>
            </div>`).join("")}
        </div>`;
    }

    const trieSvg = renderTrieSvg(entries, violatingSymbols);

    return `
        <div class="prefix-status ${statusClass}">${statusText}</div>
        <div class="code-chips">${chips}</div>
        ${problemsHtml}
        <p class="trie-heading">Trie</p>
        ${trieSvg}
    `;
}

function buildTrie(entries) {
    const root = { children: [null, null], symbols: [], code: null };

    for (const { symbol, code } of entries) {
        let node = root;

        for (let i = 0; i < code.length; i++) {
            const bit = parseInt(code[i]);
            if (!node.children[bit]) {
                node.children[bit] = { children: [null, null], symbols: [], code: null };
            }
            node = node.children[bit];
        }

        node.symbols.push(symbol);
        node.code = code;
    }

    return root;
}

function renderTrieSvg(entries, violatingSymbols) {
    if (entries.length === 0) return "";

    const trie = buildTrie(entries);
    const layoutNodes = [];
    const layoutEdges = [];
    let maxDepth = 0;

    function walk(node, depth, path) {
        if (!node) return;
        maxDepth = Math.max(maxDepth, depth);
        layoutNodes.push({ node, depth, path });

        for (const bit of [0, 1]) {
            if (node.children[bit]) {
                layoutEdges.push({ fromDepth: depth, fromPath: path, bit, toDepth: depth + 1, toPath: path + bit });
                walk(node.children[bit], depth + 1, path + bit);
            }
        }
    }

    walk(trie, 0, "");

    const xGap = Math.max(44, Math.min(80, 700 / Math.pow(2, maxDepth)));
    const yGap = 92;
    const totalWidth = Math.pow(2, maxDepth) * xGap;
    const svgWidth = Math.max(520, totalWidth + 80);
    const svgHeight = (maxDepth + 1) * yGap + 80;
    const offsetX = (svgWidth - totalWidth) / 2;
    const offsetY = 44;

    const getX = (depth, path) => {
        if (depth === 0) return totalWidth / 2 + offsetX;
        const value = parseInt(path, 2);
        const slots = Math.pow(2, depth);
        return ((value + 0.5) / slots) * totalWidth + offsetX;
    };

    const getY = (depth) => depth * yGap + offsetY;

    const edgesHtml = layoutEdges.map((e) => {
        const x1 = getX(e.fromDepth, e.fromPath);
        const y1 = getY(e.fromDepth);
        const x2 = getX(e.toDepth, e.toPath);
        const y2 = getY(e.toDepth);
        const lx = (x1 + x2) / 2 + (e.bit === 0 ? -14 : 14);
        const ly = (y1 + y2) / 2;
        const cls = e.bit === 0 ? "code-zero" : "code-one";
        return `<line class="trie-edge ${cls}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"></line>
                <text class="trie-edge-label ${cls}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${e.bit}</text>`;
    }).join("");

    const nodesHtml = layoutNodes.map(({ node, depth, path }) => {
        const x = getX(depth, path);
        const y = getY(depth);
        const hasSymbol = node.symbols.length > 0;
        const r = hasSymbol ? 20 : 10;

        let nodeClass = "trie-node";
        let labelHtml = "";
        let sublabelHtml = "";

        if (hasSymbol) {
            const isViolating = node.symbols.some((s) => violatingSymbols.has(s));
            nodeClass += isViolating ? " node-violation" : " node-ok";
            const label = node.symbols.join("/");
            const fontSize = label.length > 3 ? 9 : label.length > 2 ? 11 : 13;
            labelHtml = `<text class="trie-node-label" y="0" style="font-size:${fontSize}px">${escHTML(label)}</text>`;
            sublabelHtml = `<text class="trie-node-code" y="${r + 14}">${escHTML(node.code || path)}</text>`;
        } else {
            nodeClass += " node-internal";
        }

        return `<g class="${nodeClass}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
            <circle r="${r}"></circle>
            ${labelHtml}
            ${sublabelHtml}
        </g>`;
    }).join("");

    return `<div class="trie-container">
        <svg class="trie-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
            <g class="trie-edges">${edgesHtml}</g>
            <g class="trie-nodes">${nodesHtml}</g>
        </svg>
    </div>`;
}

function escHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
