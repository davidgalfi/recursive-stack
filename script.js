class RecursiveStack {
    constructor() {
        // Core Data (v3 Schema)
        this.sessions = {};
        this.currentSessionId = null;
        
        // Runtime cache
        this.nodes = {};
        this.path = [];
        this.nodeIdCounter = 0;
        this.maxDepthReached = 0;
        this.currentId = null;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadStorage();
        
        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) {
            this.createNewSession();
        } else {
            this.loadSession(this.currentSessionId);
        }

        this.render();
        this.renderSessionList();
    }

    cacheDOM() {
        this.dom = {
            question: document.getElementById('questionInput'),
            answer: document.getElementById('answerInput'),
            clickableWords: document.getElementById('clickableWords'),
            breadcrumbs: document.getElementById('breadcrumbs'),
            saveBtn: document.getElementById('saveBtn'),
            popBtn: document.getElementById('popBtn'),
            clearBtn: document.getElementById('deleteSessionBtn'),
            newSessionBtn: document.getElementById('newSessionBtn'),
            sessionList: document.getElementById('sessionList'),
            depth: document.getElementById('currentDepth'),
            nodeCount: document.getElementById('nodeCount'),
            maxDepth: document.getElementById('maxDepth'),
            resolvedSection: document.getElementById('resolvedSection'),
            resolvedContainer: document.getElementById('resolvedContainer'),
            goalText: document.getElementById('goalText'),
            // Export
            exportBtn: document.getElementById('exportBtn'),
            exportModal: document.getElementById('exportModal'),
            exportJsonBtn: document.getElementById('exportJsonBtn'),
            exportMdBtn: document.getElementById('exportMdBtn'),
            closeExportModal: document.getElementById('closeExportModal'),
            // Graph
            viewGraphBtn: document.getElementById('viewGraphBtn'),
            graphModal: document.getElementById('graphModal'),
            closeGraphModal: document.getElementById('closeGraphModal'),
            graphContainer: document.getElementById('graphContainer')
        };
    }

    bindEvents() {
        this.dom.answer.addEventListener('input', () => this.handleInput());
        this.dom.question.addEventListener('input', () => this.handleQuestionInput());
        this.dom.saveBtn.addEventListener('click', () => this.generateLinks());
        this.dom.popBtn.addEventListener('click', () => this.pop());
        this.dom.clearBtn.addEventListener('click', () => this.deleteSession());
        this.dom.newSessionBtn.addEventListener('click', () => this.createNewSession());
        
        // Export
        this.dom.exportBtn.addEventListener('click', () => this.showModal(this.dom.exportModal));
        this.dom.closeExportModal.addEventListener('click', () => this.hideModal(this.dom.exportModal));
        this.dom.exportJsonBtn.addEventListener('click', () => this.exportJSON());
        this.dom.exportMdBtn.addEventListener('click', () => this.exportMarkdown());

        // Graph
        this.dom.viewGraphBtn.addEventListener('click', () => {
            this.showModal(this.dom.graphModal);
            this.renderGraph();
        });
        this.dom.closeGraphModal.addEventListener('click', () => this.hideModal(this.dom.graphModal));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!this.dom.saveBtn.disabled) this.generateLinks();
            }
            if (e.key === 'Escape') {
                if (!this.dom.graphModal.classList.contains('hidden')) {
                    this.hideModal(this.dom.graphModal);
                } else if (!this.dom.exportModal.classList.contains('hidden')) {
                    this.hideModal(this.dom.exportModal);
                } else if (!this.dom.popBtn.disabled) {
                    this.pop();
                }
            }
        });
    }

    // --- Modal Logic ---
    showModal(modal) { modal.classList.remove('hidden'); }
    hideModal(modal) { modal.classList.add('hidden'); }

    // --- Session Management ---
    createNewSession() {
        const id = Date.now().toString();
        this.sessions[id] = {
            id: id,
            nodes: {},
            path: [],
            nodeIdCounter: 1,
            maxDepthReached: 0,
            created: Date.now()
        };
        const root = { id: 0, question: 'New Topic', answer: '', children: [], depth: 0 };
        this.sessions[id].nodes[0] = root;
        this.sessions[id].path = [0];
        this.currentSessionId = id;
        this.loadSession(id);
        this.saveGlobal();
        this.renderSessionList();
    }

    loadSession(sessionId) {
        const s = this.sessions[sessionId];
        this.nodes = s.nodes;
        this.path = s.path;
        this.nodeIdCounter = s.nodeIdCounter;
        this.maxDepthReached = s.maxDepthReached;
        this.currentId = this.path[this.path.length - 1];
        this.currentSessionId = sessionId;
        this.render();
    }

    deleteSession() {
        if (Object.keys(this.sessions).length <= 1) {
            if (confirm('Clear current session?')) {
                delete this.sessions[this.currentSessionId];
                this.createNewSession();
            }
            return;
        }
        if (confirm('Delete this session permanently?')) {
            delete this.sessions[this.currentSessionId];
            const nextId = Object.keys(this.sessions)[0];
            this.loadSession(nextId);
            this.saveGlobal();
            this.renderSessionList();
        }
    }

    // --- Graph Visualization (D3.js) ---
    renderGraph() {
        const container = this.dom.graphContainer;
        container.innerHTML = ''; // Clear previous
        
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Convert nodes object to D3 array
        const nodes = Object.values(this.nodes).map(n => ({ 
            id: n.id, 
            label: n.question, 
            depth: n.depth,
            group: n.depth 
        }));

        // Generate links
        const links = [];
        Object.values(this.nodes).forEach(n => {
            if (n.children) {
                n.children.forEach(childId => {
                    links.push({ source: n.id, target: childId });
                });
            }
        });

        const svg = d3.select("#graphContainer").append("svg")
            .attr("width", width)
            .attr("height", height)
            .call(d3.zoom().on("zoom", (event) => {
                g.attr("transform", event.transform);
            }))
            .append("g");
        
        const g = svg.append("g");

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collide", d3.forceCollide().radius(40));

        const link = g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link");

        const node = g.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // Color scale for depth
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        node.append("circle")
            .attr("r", d => 10 + (d.depth === 0 ? 10 : 0)) // Root is bigger
            .attr("fill", d => color(d.depth));

        node.append("text")
            .attr("dy", 25)
            .attr("text-anchor", "middle")
            .text(d => d.label.length > 15 ? d.label.substring(0, 12) + '...' : d.label);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; // Release the node so it springs back
            d.fy = null;
        }
    }

    // --- Export Logic ---
    exportJSON() {
        const dataStr = JSON.stringify(this.sessions, null, 2);
        this.downloadFile(dataStr, `recursive-stack-backup-${Date.now()}.json`, 'application/json');
    }

    exportMarkdown() {
        let md = `# Recursive Stack Export\nDate: ${new Date().toLocaleDateString()}\n\n`;
        Object.values(this.sessions).forEach(session => {
            const root = session.nodes[0];
            md += `## Topic: ${root.question}\n\n`;
            const printNode = (nodeId, level) => {
                const node = session.nodes[nodeId];
                const indent = '  '.repeat(level);
                md += `${indent}- **${node.question}**\n`;
                md += `${indent}  > ${node.answer.replace(/\n/g, `\n${indent}  > `)}\n\n`;
                if (node.children) node.children.forEach(childId => printNode(childId, level + 1));
            };
            printNode(0, 0);
            md += `---\n\n`;
        });
        this.downloadFile(md, `recursive-stack-notes-${Date.now()}.md`, 'text/markdown');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.hideModal(this.dom.exportModal);
    }

    // --- Core Logic ---
    createChild(word) {
        const id = this.nodeIdCounter++;
        const parent = this.nodes[this.currentId];
        const child = { id: id, question: word, answer: '', children: [], depth: parent.depth + 1 };
        this.nodes[id] = child;
        parent.children.push(id);
        this.path.push(id);
        this.currentId = id;
        if (child.depth > this.maxDepthReached) this.maxDepthReached = child.depth;
        this.syncSessionData();
        this.saveGlobal();
        this.render();
        this.dom.question.focus();
    }

    updateCurrentNode(question, answer) {
        const node = this.nodes[this.currentId];
        node.question = question;
        node.answer = answer;
        this.syncSessionData();
        this.saveGlobal();
        if (this.currentId === 0) {
            this.renderSessionList();
            this.renderGoal();
        }
    }

    syncSessionData() {
        const s = this.sessions[this.currentSessionId];
        s.nodes = this.nodes;
        s.path = this.path;
        s.nodeIdCounter = this.nodeIdCounter;
        s.maxDepthReached = this.maxDepthReached;
    }

    handleInput() {
        const currentText = this.dom.answer.value.trim();
        const node = this.nodes[this.currentId];
        
        // Logic: Enable save if text is different from saved OR if empty (to disable)
        // Wait, if empty -> Disable.
        // If same as saved -> Show "Analyzed" state (Secondary).
        // If different -> Show "Analyze" state (Primary).

        const isEmpty = currentText.length === 0;
        const isSaved = currentText === node.answer.trim();

        if (isEmpty) {
            this.dom.saveBtn.disabled = true;
            this.dom.saveBtn.innerHTML = `<span>Analyze & Link</span><span class="shortcut">Cmd/Ctrl + Enter</span>`;
            this.dom.saveBtn.className = 'btn btn-primary';
        } else if (isSaved) {
            // Already saved/analyzed
            this.dom.saveBtn.disabled = false;
            this.dom.saveBtn.innerHTML = `<span>✅ Links Updated</span><span class="shortcut">Cmd/Ctrl + Enter</span>`;
            this.dom.saveBtn.className = 'btn btn-secondary'; // Visual cue
        } else {
            // Changed / Dirty
            this.dom.saveBtn.disabled = false;
            this.dom.saveBtn.innerHTML = `<span>Analyze & Link</span><span class="shortcut">Cmd/Ctrl + Enter</span>`;
            this.dom.saveBtn.className = 'btn btn-primary';
        }
    }

    handleQuestionInput() {
        if (this.currentId === 0) {
            this.nodes[0].question = this.dom.question.value;
            this.renderSessionList();
            this.renderGoal();
            this.saveGlobal();
        }
    }

    generateLinks() {
        const text = this.dom.answer.value;
        const question = this.dom.question.value;
        this.updateCurrentNode(question, text);

        const tokens = text.match(/[\p{L}\d']+/gu) || [];
        const uniqueTokens = [...new Set(tokens)];

        this.dom.clickableWords.innerHTML = '';
        
        uniqueTokens.forEach(token => {
            const btn = document.createElement('span');
            btn.className = 'word';
            btn.textContent = token;
            btn.onclick = () => this.createChild(token);
            this.dom.clickableWords.appendChild(btn);
        });

        this.dom.popBtn.disabled = this.path.length <= 1;
        
        // Update button state immediately
        this.handleInput(); 
    }

    pop() {
        if (this.path.length <= 1) return;
        this.updateCurrentNode(this.dom.question.value, this.dom.answer.value);
        this.path.pop();
        this.currentId = this.path[this.path.length - 1];
        this.syncSessionData();
        this.saveGlobal();
        this.render();
    }

    render() {
        const node = this.nodes[this.currentId];
        this.dom.question.value = node.question;
        this.dom.answer.value = node.answer;
        
        // Update button states
        this.handleInput(); // Re-evaluates save button state based on loaded text
        this.dom.popBtn.disabled = this.path.length <= 1;
        
        this.dom.depth.textContent = node.depth;
        this.dom.maxDepth.textContent = this.maxDepthReached;
        this.dom.nodeCount.textContent = Object.keys(this.nodes).length;
        
        this.renderBreadcrumbs();
        this.renderResolvedChildren(node);
        this.renderGoal();
        
        // Always regenerate links if text exists, to ensure UI is consistent
        if (node.answer) {
             // We duplicate logic here to avoid re-saving to DB during render, which caused recursion logic issues before
             // Just purely visual generation:
            const tokens = node.answer.match(/[\p{L}\d']+/gu) || [];
            const uniqueTokens = [...new Set(tokens)];
            this.dom.clickableWords.innerHTML = '';
            uniqueTokens.forEach(token => {
                const btn = document.createElement('span');
                btn.className = 'word';
                btn.textContent = token;
                btn.onclick = () => this.createChild(token);
                this.dom.clickableWords.appendChild(btn);
            });
        } else {
            this.dom.clickableWords.innerHTML = '';
        }
    }

    renderGoal() {
        const root = this.nodes[0];
        let text = root ? root.question : 'New Topic';
        if (text.length > 25) text = text.substring(0, 22) + '...';
        this.dom.goalText.textContent = text;
        this.dom.goalText.parentElement.title = root ? root.question : 'Original Goal';
    }

    renderSessionList() {
        this.dom.sessionList.innerHTML = '';
        const sortedIds = Object.keys(this.sessions).sort((a, b) => this.sessions[b].created - this.sessions[a].created);
        sortedIds.forEach(id => {
            const s = this.sessions[id];
            const div = document.createElement('div');
            div.className = `session-item ${id === this.currentSessionId ? 'active' : ''}`;
            const title = s.nodes[0] ? s.nodes[0].question : 'Untitled';
            div.textContent = title || 'Untitled';
            div.onclick = () => {
                if (id !== this.currentSessionId) {
                    this.loadSession(id);
                    this.renderSessionList();
                }
            };
            this.dom.sessionList.appendChild(div);
        });
    }

    renderBreadcrumbs() {
        this.dom.breadcrumbs.innerHTML = '';
        this.path.forEach((id, index) => {
            const n = this.nodes[id];
            const span = document.createElement('span');
            span.className = `crumb ${index === this.path.length - 1 ? 'active' : ''}`;
            let label = n.question;
            if (label.length > 15) label = label.substring(0, 12) + '...';
            span.textContent = label;
            span.onclick = () => {
                this.updateCurrentNode(this.dom.question.value, this.dom.answer.value);
                this.path = this.path.slice(0, index + 1);
                this.currentId = id;
                this.syncSessionData();
                this.saveGlobal();
                this.render();
            };
            this.dom.breadcrumbs.appendChild(span);
        });
    }

    renderResolvedChildren(node) {
        this.dom.resolvedContainer.innerHTML = '';
        if (!node.children || node.children.length === 0) {
            this.dom.resolvedSection.classList.add('hidden');
            return;
        }
        let hasContent = false;
        node.children.forEach(childId => {
            const child = this.nodes[childId];
            if (child.answer) { 
                hasContent = true;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `<h3>✔ ${child.question}</h3><p>${child.answer}</p>`;
                card.onclick = () => {
                    this.path.push(childId);
                    this.currentId = childId;
                    this.render();
                };
                card.style.cursor = 'pointer';
                card.title = "Click to edit";
                this.dom.resolvedContainer.appendChild(card);
            }
        });
        if (hasContent) {
            this.dom.resolvedSection.classList.remove('hidden');
        } else {
            this.dom.resolvedSection.classList.add('hidden');
        }
    }

    saveGlobal() {
        const data = { currentSessionId: this.currentSessionId, sessions: this.sessions };
        localStorage.setItem('recursiveStack_v3', JSON.stringify(data));
    }

    loadStorage() {
        const v3 = localStorage.getItem('recursiveStack_v3');
        if (v3) {
            try {
                const parsed = JSON.parse(v3);
                this.sessions = parsed.sessions;
                this.currentSessionId = parsed.currentSessionId;
                return;
            } catch (e) { console.error("v3 load failed", e); }
        }
        const v2 = localStorage.getItem('recursiveStack_v2');
        if (v2) {
            try {
                const parsed = JSON.parse(v2);
                const newId = Date.now().toString();
                this.sessions = {};
                this.sessions[newId] = {
                    id: newId,
                    nodes: parsed.nodes,
                    path: parsed.path,
                    nodeIdCounter: parsed.nodeIdCounter,
                    maxDepthReached: parsed.maxDepthReached,
                    created: Date.now()
                };
                this.currentSessionId = newId;
                localStorage.removeItem('recursiveStack_v2');
                this.saveGlobal();
                console.log("Migrated v2 -> v3");
            } catch (e) { console.error("v2 migration failed", e); }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new RecursiveStack());