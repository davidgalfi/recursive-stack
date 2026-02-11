class RecursiveStack {
    constructor() {
        // Core Data (v3 Schema)
        // sessions: Map of sessionID -> { nodes, path, nodeIdCounter, maxDepthReached, created }
        this.sessions = {};
        this.currentSessionId = null;
        
        // Runtime cache for current session
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
            goalText: document.getElementById('goalText')
        };
    }

    bindEvents() {
        this.dom.answer.addEventListener('input', () => this.handleInput());
        this.dom.question.addEventListener('input', () => this.handleQuestionInput()); // Update session name
        this.dom.saveBtn.addEventListener('click', () => this.generateLinks());
        this.dom.popBtn.addEventListener('click', () => this.pop());
        this.dom.clearBtn.addEventListener('click', () => this.deleteSession());
        this.dom.newSessionBtn.addEventListener('click', () => this.createNewSession());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (!this.dom.saveBtn.disabled) this.generateLinks();
            }
            if (e.key === 'Escape') {
                if (!this.dom.popBtn.disabled) this.pop();
            }
        });
    }

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
        
        // Init Root
        const root = {
            id: 0,
            question: 'New Topic',
            answer: '',
            children: [],
            depth: 0
        };
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
            // Load first available
            const nextId = Object.keys(this.sessions)[0];
            this.loadSession(nextId);
            this.saveGlobal();
            this.renderSessionList();
        }
    }

    // --- Data Logic ---

    createChild(word) {
        const id = this.nodeIdCounter++;
        const parent = this.nodes[this.currentId];
        
        const child = {
            id: id,
            question: word, 
            answer: '',
            children: [],
            depth: parent.depth + 1
        };

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
            this.renderSessionList(); // Update sidebar name
            this.renderGoal(); // Update header goal
        }
    }

    syncSessionData() {
        // Sync local cache back to session object
        const s = this.sessions[this.currentSessionId];
        s.nodes = this.nodes;
        s.path = this.path;
        s.nodeIdCounter = this.nodeIdCounter;
        s.maxDepthReached = this.maxDepthReached;
    }

    // --- Actions ---

    handleInput() {
        const hasText = this.dom.answer.value.trim().length > 0;
        this.dom.saveBtn.disabled = !hasText;
    }

    handleQuestionInput() {
        // Auto-save title as you type (for root node mainly)
        if (this.currentId === 0) {
            this.nodes[0].question = this.dom.question.value;
            this.renderSessionList();
            this.renderGoal();
            this.saveGlobal(); // Save title change immediately
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

    // --- Rendering ---

    render() {
        const node = this.nodes[this.currentId];
        
        this.dom.question.value = node.question;
        this.dom.answer.value = node.answer;
        
        this.dom.saveBtn.disabled = node.answer.trim().length === 0;
        this.dom.popBtn.disabled = this.path.length <= 1;

        this.dom.depth.textContent = node.depth;
        this.dom.maxDepth.textContent = this.maxDepthReached;
        this.dom.nodeCount.textContent = Object.keys(this.nodes).length;

        this.renderBreadcrumbs();
        this.renderResolvedChildren(node);
        this.renderGoal();

        if (node.answer) {
            this.generateLinks();
        } else {
            this.dom.clickableWords.innerHTML = '';
        }
    }

    renderGoal() {
        // Find root question
        const root = this.nodes[0];
        let text = root ? root.question : 'New Topic';
        if (text.length > 25) text = text.substring(0, 22) + '...';
        this.dom.goalText.textContent = text;
        this.dom.goalText.parentElement.title = root ? root.question : 'Original Goal';
    }

    renderSessionList() {
        this.dom.sessionList.innerHTML = '';
        
        // Sort by created desc
        const sortedIds = Object.keys(this.sessions).sort((a, b) => 
            this.sessions[b].created - this.sessions[a].created
        );

        sortedIds.forEach(id => {
            const s = this.sessions[id];
            const div = document.createElement('div');
            div.className = `session-item ${id === this.currentSessionId ? 'active' : ''}`;
            
            // Use root question as title
            const title = s.nodes[0] ? s.nodes[0].question : 'Untitled';
            div.textContent = title || 'Untitled';
            
            div.onclick = () => {
                if (id !== this.currentSessionId) {
                    this.loadSession(id);
                    this.renderSessionList(); // update active class
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
                card.innerHTML = `
                    <h3>✔ ${child.question}</h3>
                    <p>${child.answer}</p>
                `;
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

    // --- Storage ---

    saveGlobal() {
        const data = {
            currentSessionId: this.currentSessionId,
            sessions: this.sessions
        };
        localStorage.setItem('recursiveStack_v3', JSON.stringify(data));
    }

    loadStorage() {
        // v3 Load
        const v3 = localStorage.getItem('recursiveStack_v3');
        if (v3) {
            try {
                const parsed = JSON.parse(v3);
                this.sessions = parsed.sessions;
                this.currentSessionId = parsed.currentSessionId;
                return;
            } catch (e) {
                console.error("v3 load failed", e);
            }
        }

        // Migration from v2
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
                
                localStorage.removeItem('recursiveStack_v2'); // Cleanup
                this.saveGlobal();
                console.log("Migrated v2 -> v3");
            } catch (e) { console.error("v2 migration failed", e); }
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => new RecursiveStack());