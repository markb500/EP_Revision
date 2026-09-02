# Electrical Principles Revision Aid

Flip-card revision tool for the RAF Aerospace Engineering Technician course — **electrical principles**.

Same structure and controls as the Science Definitions Revision Aid.

---

## Quick start

Needs HTTP (not `file://`):

```bash
cd "Ep Revision"
npx serve .
```

---

## How to use

1. Read the prompt on the front of a card.
2. Write your response on paper.
3. Flip the card (**Space** / **Enter**, or click) to check.
4. **Next** or **N** for a new set of six (avoids the previous set when the pool allows).

**Keyboard:** ← → ↑ ↓ move focus · Home/End first/last · Space/Enter flip · N next set.

---

## Folder structure

```
EP_Revision/
├── index.html
├── README.md
├── css/main.css
├── js/
│   ├── app.js
│   └── definitions.js
└── stuff/
    ├── defs.txt          Prompts and answers (HTML allowed in answers)
    ├── Cosbadge.png
    ├── typhoon_line.png
    └── …                 Circuit symbols / diagrams referenced by defs.txt
```

---

## Editing content

Edit **`stuff/defs.txt`** only:

```
Prompt line
Answer line (plain text or HTML, e.g. &lt;img src="stuff/bat.png"&gt;)
```

- Alternating lines: prompt, then answer.
- Images use paths relative to `index.html` (usually `stuff/filename.png`).
- Use UTF-8. HTML entities such as `&ohm;` are fine.
- Save and hard-refresh the browser.

---

## Notes

- Answers may include images and line breaks; MathJax is loaded for `\(...\)` formulas if present.
- Source editor files (`.pdn`) are not included in this package.
