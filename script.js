// The Recursive Stack - Core Logic

class RecursiveStack {
    constructor() {
        this.stack = [];
        this.currentNode = null;
        this.nodeIdCounter = 0;
        this.totalNodes = 0;
        this.maxDepthReached = 0;
        this.loadFromStorage();
        this.init();
    }

    init() {
        // DOM elements
        this.questionInput = document.getElementById('questionInput');
        this.answerInput = document.getElementById('answerInput');
        this.clickableWords = document.getElementById('clickableWords');
        this.breadcrumbs = document.getElementById('breadcrumbs');
        this.saveBtn = document.getElementById('saveBtn');
        this.popBtn = document.getElementById('popBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.depthIndicator = document.getElementById('currentDepth');
        this.nodeCount = document.getElementById('nodeCount');
        this.maxDepthDisplay = document.getElementById('maxDepth');

        // Event listeners
        this.answerInput.addEventListener('input', () => this.onAnswerChange());
        this.saveBtn.addEventListener('click', () => this.saveAndGenerateWords());
        this.popBtn.addEventListener('click', () => this.popStack());
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Initial state
        if (this.stack.length === 0) {
            this.pushRoot();
        }
        
        this.render();
    }

    pushRoot() {
        const rootNode = {
            id: this.nodeIdCounter++,
            question: 'Root',
            answer: '',
            children: [],
            depth: 0
        };
        this.stack.push(rootNode);
        this.currentNode = rootNode;
        this.totalNodes++;
    }

    onAnswerChange() {
        const hasContent = this.answerInput.value.trim().length > 0;
        this.saveBtn.disabled = !hasContent;
    }

    saveAndGenerateWords() {
        const question = this.questionInput.value.trim();
        const answer = this.answerInput.value.trim();

        if (!answer) return;

        // Update current node
        this.currentNode.question = question || this.currentNode.question;
        this.currentNode.answer = answer;

        // Generate clickable words
        this.generateClickableWords(answer);
        
        // Enable pop button
        this.popBtn.disabled = this.stack.length <= 1;

        this.saveToStorage();
    }

    generateClickableWords(text) {
        // Split into words, supporting Unicode characters (Hungarian accented letters)
        // Uses \p{L} for any Unicode letter, \d for digits, and ' for apostrophes
        const words = text.match(/[\p{L}\d']+/gu) || [];
        const uniqueWords = [...new Set(words)].sort();

        this.clickableWords.innerHTML = '';
        this.clickableWords.classList.add('active');

        uniqueWords.forEach(word => {
            const span = document.createElement('span');
            span.className = 'word';
            span.textContent = word;
            span.addEventListener('click', () => this.diveInto(word));
            this.clickableWords.appendChild(span);
        });
    }

    diveInto(word) {
        const newNode = {
            id: this.nodeIdCounter++,
            question: `What is "${word}"?`,
            answer: '',
            children: [],
            depth: this.currentNode.depth + 1,
            parent: this.currentNode.id
        };

        // Add to parent's children
        this.currentNode.children.push(newNode.id);

        // Push to stack
        this.stack.push(newNode);
        this.currentNode = newNode;
        this.totalNodes++;

        // Update max depth
        if (newNode.depth > this.maxDepthReached) {
            this.maxDepthReached = newNode.depth;
        }

        // Clear clickable words
        this.clickableWords.classList.remove('active');
        this.clickableWords.innerHTML = '';

        this.render();
        this.saveToStorage();
        
        // Focus on answer input
        this.answerInput.focus();
    }

    popStack() {
        if (this.stack.length <= 1) return;

        // Remove current node
        this.stack.pop();
        this.currentNode = this.stack[this.stack.length - 1];

        this.render();
        this.saveToStorage();
    }

    render() {
        // Update inputs
        this.questionInput.value = this.currentNode.question;
        this.answerInput.value = this.currentNode.answer;

        // Update breadcrumbs
        this.renderBreadcrumbs();

        // Update depth
        this.depthIndicator.textContent = this.currentNode.depth;

        // Update stats
        this.nodeCount.textContent = this.totalNodes;
        this.maxDepthDisplay.textContent = this.maxDepthReached;

        // Update buttons
        this.saveBtn.disabled = this.answerInput.value.trim().length === 0;
        this.popBtn.disabled = this.stack.length <= 1;

        // Regenerate clickable words if answer exists
        if (this.currentNode.answer) {
            this.generateClickableWords(this.currentNode.answer);
        } else {
            this.clickableWords.classList.remove('active');
            this.clickableWords.innerHTML = '';
        }
    }

    renderBreadcrumbs() {
        this.breadcrumbs.innerHTML = '';
        
        this.stack.forEach((node, index) => {
            const crumb = document.createElement('span');
            crumb.className = 'breadcrumb';
            if (index === this.stack.length - 1) {
                crumb.classList.add('active');
            }
            
            // Truncate long questions
            let text = node.question;
            if (text.length > 30) {
                text = text.substring(0, 27) + '...';
            }
            crumb.textContent = text;
            
            this.breadcrumbs.appendChild(crumb);
        });
    }

    saveToStorage() {
        const data = {
            stack: this.stack,
            nodeIdCounter: this.nodeIdCounter,
            totalNodes: this.totalNodes,
            maxDepthReached: this.maxDepthReached
        };
        localStorage.setItem('recursiveStack', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('recursiveStack');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stack = data.stack || [];
                this.nodeIdCounter = data.nodeIdCounter || 0;
                this.totalNodes = data.totalNodes || 0;
                this.maxDepthReached = data.maxDepthReached || 0;
                this.currentNode = this.stack[this.stack.length - 1];
            } catch (e) {
                console.error('Failed to load from storage:', e);
            }
        }
    }

    clearAll() {
        if (confirm('Are you sure? This will delete ALL your progress!')) {
            localStorage.removeItem('recursiveStack');
            this.stack = [];
            this.nodeIdCounter = 0;
            this.totalNodes = 0;
            this.maxDepthReached = 0;
            this.pushRoot();
            this.render();
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new RecursiveStack());
} else {
    new RecursiveStack();
}