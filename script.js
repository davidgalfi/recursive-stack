class RecursiveStack {
    constructor() {
        // Core Data Structure
        // nodes: Map of ID -> Node Object { id, question, answer, childrenIDs[] }
        // path: Array of IDs representing current navigation stack
        this.nodes = {};
        this.path = [];
        this.nodeIdCounter = 0;
        this.maxDepthReached = 0;
        
        // Runtime state
        this.currentId = null;
        
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadState();
        
        if (this.path.length === 0) {
            this.createRoot();
        } else {
            this.currentId = this.path[this.path.length - 1];
        }

        this.render();
    }

    cacheDOM() {
        this.dom = {
            question: document.getElementById('questionInput'),
            answer: document.getElementById('answerInput'),
            clickableWords: document.getElementById('clickableWords'),
            breadcrumbs: document.getElementById('breadcrumbs'),
            saveBtn: document.getElementById('saveBtn'),
            popBtn: document.getElementById('popBtn'),
            clearBtn: document.getElementById('clearBtn'),
            depth: document.getElementById('currentDepth'),
            nodeCount: document.getElementById('nodeCount'),
            maxDepth: document.getElementById('maxDepth'),
            resolvedSection: document.getElementById('resolvedSection'),
            resolvedContainer: document.getElementById('resolvedContainer')
        };
    }

    bindEvents() {
        this.dom.answer.addEventListener('input', () => this.handleInput());
        this.dom.saveBtn.addEventListener('click', () => this.generateLinks());
        this.dom.popBtn.addEventListener('click', () => this.pop());
        this.dom.clearBtn.addEventListener('click', () => this.reset());
        
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

    // --- Data Management ---

    createRoot() {
        const root = {
            id: 0,
            question: 'Main Problem',
            answer: '',
            children: [],
            depth: 0
        };
        this.nodes[0] = root;
        this.path = [0];
        this.currentId = 0;
        this.nodeIdCounter = 1;
    }

    createChild(word) {
        const id = this.nodeIdCounter++;
        const parent = this.nodes[this.currentId];
        
        const child = {
            id: id,
            question: word, // Default question is the word itself
            answer: '',
            children: [],
            depth: parent.depth + 1
        };

        this.nodes[id] = child;
        parent.children.push(id);
        
        // Navigate to child
        this.path.push(id);
        this.currentId = id;

        // Stats
        if (child.depth > this.maxDepthReached) this.maxDepthReached = child.depth;

        this.save();
        this.render();
        
        // Auto-focus question to let user refine "What is X?"
        this.dom.question.focus();
    }

    updateCurrentNode(question, answer) {
        const node = this.nodes[this.currentId];
        node.question = question;
        node.answer = answer;
        this.save();
    }

    // --- Actions ---

    handleInput() {
        const hasText = this.dom.answer.value.trim().length > 0;
        this.dom.saveBtn.disabled = !hasText;
    }

    generateLinks() {
        const text = this.dom.answer.value;
        const question = this.dom.question.value;
        this.updateCurrentNode(question, text);

        // Regex for tokens: unicode letters, numbers, apostrophes
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
        
        // Save before leaving
        this.updateCurrentNode(this.dom.question.value, this.dom.answer.value);

        this.path.pop();
        this.currentId = this.path[this.path.length - 1];
        
        this.render();
        this.save();
    }

    reset() {
        if (confirm('Delete everything?')) {
            localStorage.removeItem('recursiveStack_v2');
            this.nodes = {};
            this.path = [];
            this.createRoot();
            this.render();
        }
    }

    // --- Rendering ---

    render() {
        const node = this.nodes[this.currentId];
        
        // 1. Inputs
        this.dom.question.value = node.question;
        this.dom.answer.value = node.answer;
        
        // 2. Buttons state
        this.dom.saveBtn.disabled = node.answer.trim().length === 0;
        this.dom.popBtn.disabled = this.path.length <= 1;

        // 3. Stats
        this.dom.depth.textContent = node.depth;
        this.dom.maxDepth.textContent = this.maxDepthReached;
        this.dom.nodeCount.textContent = Object.keys(this.nodes).length;

        // 4. Breadcrumbs
        this.renderBreadcrumbs();

        // 5. Resolved Children (The "History" requested by user)
        this.renderResolvedChildren(node);

        // 6. Restore clickable words if answer exists
        if (node.answer) {
            this.generateLinks();
        } else {
            this.dom.clickableWords.innerHTML = '';
        }
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
            
            // Allow clicking crumbs to jump back
            span.onclick = () => {
                // Cut path to this index
                this.updateCurrentNode(this.dom.question.value, this.dom.answer.value);
                this.path = this.path.slice(0, index + 1);
                this.currentId = id;
                this.render();
                this.save();
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
            if (child.answer) { // Only show if answered
                hasContent = true;
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3>✔ ${child.question}</h3>
                    <p>${child.answer}</p>
                `;
                // Allow editing again?
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

    save() {
        const state = {
            nodes: this.nodes,
            path: this.path,
            nodeIdCounter: this.nodeIdCounter,
            maxDepthReached: this.maxDepthReached
        };
        localStorage.setItem('recursiveStack_v2', JSON.stringify(state));
    }

    loadState() {
        // Try load v2
        const v2 = localStorage.getItem('recursiveStack_v2');
        if (v2) {
            const parsed = JSON.parse(v2);
            this.nodes = parsed.nodes;
            this.path = parsed.path;
            this.nodeIdCounter = parsed.nodeIdCounter;
            this.maxDepthReached = parsed.maxDepthReached;
            return;
        }

        // Try migrate v1 (The "broken" stack array)
        const v1 = localStorage.getItem('recursiveStack');
        if (v1) {
            try {
                const parsed = JSON.parse(v1);
                // We can only recover the current stack path, as v1 deleted popped nodes.
                // We will convert the 'stack' array into our 'nodes' map.
                
                this.nodes = {};
                this.path = [];
                
                parsed.stack.forEach(oldNode => {
                    this.nodes[oldNode.id] = {
                        id: oldNode.id,
                        question: oldNode.question,
                        answer: oldNode.answer,
                        children: [], // Lost relations for siblings, but path is preserved
                        depth: oldNode.depth
                    };
                    this.path.push(oldNode.id);
                    
                    // Rebuild parent-child relationship
                    if (this.path.length > 1) {
                        const parentId = this.path[this.path.length - 2];
                        this.nodes[parentId].children.push(oldNode.id);
                    }
                });
                
                this.nodeIdCounter = parsed.nodeIdCounter;
                this.maxDepthReached = parsed.maxDepthReached;
                
                console.log("Migrated from v1 to v2");
            } catch (e) {
                console.error("Migration failed", e);
            }
        }
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => new RecursiveStack());