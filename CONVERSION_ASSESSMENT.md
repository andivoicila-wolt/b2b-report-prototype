# PDF-to-Website UI Conversion Assessment

## Goal
Convert the provided B2B report PDFs into a real website that preserves the original design language while using structured HTML content.

## Current State
- We have 39 slide-derived visuals (`assets/slides/*.png`) from your PDFs.
- We have extracted semantic text from all 39 source PDFs (`report-content.json`).
- We now have a deployable web codebase and live GitHub Pages deployment.

## Design Signals Extracted From Slides
- Base background: very light neutral (`#f0f0f0` equivalent)
- Primary brand accent: cyan/blue (`#50b0e0` family)
- Secondary accents used repeatedly: green (`#a0c050`), pink (`#e090c0`), warm yellow (`#f0c060`)
- Supporting dark/navy tones for text and depth (`#102030`, `#203050`, `#506090` families)

## What “Actual Slide-to-Website Conversion” Requires
1. Layout translation, not screenshot embedding:
- Recreate each slide family as HTML components (hero, metric cards, insight blocks, timeline/list blocks).

2. Content translation:
- Use extracted PDF text as source-of-truth.
- Clean OCR/glyph artifacts editorially for production readability.

3. Design-system fidelity:
- Reuse slide palette, spacing rhythm, card corner radii, hierarchy and visual motifs.

## Proposed Build Plan
1. Template mapping (in progress):
- Group slides into chapter sections and apply dedicated UI templates per group.

2. Content cleanup pass:
- Manual editorial cleanup of extracted text per chapter.

3. High-fidelity styling pass:
- Align typography scales, color usage, and composition to match report style.

4. QA pass:
- Desktop + mobile parity checks.
- Semantic/accessibility checks.

## Risks / Constraints
- Some PDF text extraction contains glyph spacing artifacts; pure automated extraction is insufficient for final copy quality.
- A strict pixel-perfect match requires manual fine-tuning per chapter template.

## Definition of Done
- Website is fully semantic HTML/CSS/JS.
- Content comes from your PDFs (cleaned for readability).
- Visual language is recognizably the same as the report design system.
- No “slide gallery” UX remains.
