# 🔍 The Recursive Stack

**A DFS-based note-taking tool that forces deep understanding through recursive problem decomposition.**

Built for learners who struggle with skeleton knowledge and need to drill down to bedrock understanding.

## 🧠 The Science Behind It

Based on cognitive psychology principles:
- **Chunking**: Break complex problems into atomic pieces
- **First Principles Thinking**: Understand foundations before building up
- **Working Memory Management**: Focus on ONE concept at a time
- **Reinforcement Learning**: Dopamine hits when completing each level

## 🎯 How It Works

1. **Start with a question**: "I need to understand Pointers in C"
2. **Write your understanding**: Explain it in your own words
3. **Save & Generate Words**: Your answer becomes clickable words
4. **Dive Deeper**: Click ANY word you're not 100% certain about
5. **New Level**: Answer the deeper question
6. **Pop Up**: When done, return to the previous level
7. **Repeat**: Keep drilling until you hit solid understanding

### Example Flow

```
Level 0: "What are Pointers in C?"
  └─> Click "memory address"
      Level 1: "What is memory address?"
        └─> Click "hexadecimal"
            Level 2: "What is hexadecimal?"
              └─> Explain fully
            [Pop] ← Dopamine hit!
        [Pop] ← You now understand memory address!
  [Pop] ← You now TRULY understand pointers!
```

## 🚀 Live Demo

Simply open `index.html` in your browser. No build process, no dependencies!

Or try it live: [GitHub Pages Link](https://davidgalfi.github.io/recursive-stack/) *(will be available once GitHub Pages is enabled)*

## 💾 Features

- ✅ **Pure Vanilla JS**: No frameworks, just HTML/CSS/JS
- ✅ **Local Storage**: Your progress is automatically saved
- ✅ **Breadcrumb Navigation**: See your path through the knowledge tree
- ✅ **Depth Tracking**: Know how deep you've gone
- ✅ **Statistics**: Track nodes explored and max depth reached
- ✅ **Clean UI**: Beautiful gradient design, mobile-responsive

## 🛠️ Installation

### Option 1: Direct Use
```bash
# Clone the repo
git clone https://github.com/davidgalfi/recursive-stack.git
cd recursive-stack

# Open in browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

### Option 2: Local Server
```bash
# Using Python
python -m http.server 8000
# Visit http://localhost:8000

# Or using Node.js
npx http-server
```

### Option 3: GitHub Pages
This repo can be deployed to GitHub Pages for free hosting!

## 📖 Usage Tips

### Be Brutally Honest
If you have even 1% doubt about a word, **dive into it**. This tool rewards honesty with yourself.

### Start Small
Begin with concepts you think you know. You'll be surprised how many skeleton assumptions you have.

### Use in Hungarian or English
While the UI is English, you can write your questions and answers in any language!

### Common Use Cases
- Programming concepts (pointers, recursion, closures)
- Math problems (what IS a derivative, really?)
- Engineering principles (stress, strain, moment)
- Language learning (grammar rules, vocabulary)

## 🧩 Data Structure

The tool uses a simple tree structure stored as a stack in localStorage:

```javascript
{
  id: 0,
  question: "What are Pointers?",
  answer: "Variables that store memory addresses",
  children: [1, 2],  // IDs of child nodes
  depth: 0
}
```

## 🎨 Customization

Easy to customize!
- **Colors**: Edit gradient in `styles.css` (line 7)
- **Font**: Change font-family in `styles.css` (line 6)
- **Max textarea size**: Adjust `rows` in `index.html`

## 🐛 Known Limitations

- Single user (no accounts/sync)
- Browser-specific storage (won't sync across devices)
- No export/import (coming soon!)
- No undo feature (use carefully!)

## 🚧 Roadmap

- [ ] Export/Import as JSON
- [ ] Visualize the entire tree
- [ ] Search through past nodes
- [ ] Mobile app version
- [ ] Multi-language UI
- [ ] Share trees with others

## 🤝 Contributing

Pull requests welcome! This tool is intentionally simple - keep PRs focused and minimal.

## 📜 License

MIT License - Use freely, modify, share!

## 🙏 Credits

Built by [David Zsolt Galfi](https://github.com/davidgalfi) for learners who refuse to accept skeleton knowledge.

Inspired by:
- Call stack visualization in programming
- Socratic method of questioning
- ADHD-friendly focus techniques

---

**Remember**: The only way to truly understand is to question everything until you hit bedrock. This tool forces you to do exactly that. 🎯