# Copilot Instructions for Rabyana Screenplay Editor

## Project Overview
**the-editor** (محرر السيناريو العربي) is a Next.js-based Arabic screenplay editor. It's a platform-independent advanced screenplay writing tool with AI assistance, character management, and sophisticated line classification.

**Key Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand state management, Google Gemini AI API

---

## Architecture

### Core Components
- **THEEditor.tsx** - Main component combining:
  - **ScreenplayClassifier** - Line type classification (character, dialogue, action, scene-header, etc.)
  - **DocumentMemory** - Tracks characters/context within documents
  - **ClassifierReviewer** - AI-powered classification verification
  - **EmissionCalculator** - Scoring system for line type confidence
  - **ViterbiDecoder** - Optimal sequence detection using Viterbi algorithm

### System Classes (Imported in THEEditor)
- **StateManager** - Script state management
- **AutoSaveManager** - Auto-save functionality
- **AdvancedSearchEngine** - Search/find-replace
- **CollaborationSystem** - Multi-user support
- **ProjectManager** - Project organization
- **AIWritingAssistant** - AI suggestions
- **VisualPlanningSystem** - Visual storyboarding

### API Route
- **src/app/api/ai/chat/route.ts** - Google Gemini integration endpoint (POST)
  - Extracts first text response from candidates
  - Respects `GEMINI_API_KEY` and `GEMINI_MODEL` env vars

---

## Critical Workflows

### Screenplay Line Classification
The **ScreenplayClassifier** uses a multi-stage pipeline:

1. **Quick Classification** - Pattern-based regex for obvious types
2. **Contextual Scoring** - Assigns scores to all valid types based on:
   - Regex patterns (TRANSITION_RE, PARENTHETICAL_SHAPE_RE, etc.)
   - Sentence structure analysis
   - Previous line context (dialogue blocks, scene headers)
   - Character memory (recurring names)
3. **Viterbi Optimization** - Finds optimal sequence if enabled
4. **AI Review** - Optional Gemini-based verification for uncertain lines (doubtScore ≥ threshold)

### Line Types & Patterns
```
- 'blank' - Empty lines
- 'scene-header' / 'scene-header-3' - Scene descriptors (INT./EXT./etc)
- 'action' - Action/description text
- 'character' - Character name (triggers dialogue block)
- 'dialogue' - Character speech
- 'parenthetical' - Actor direction in parentheses
- 'transition' - Scene transitions (FADE TO:, CUT TO:, etc)
```

### Development Commands
```bash
npm run dev          # Start dev server (port 5000)
npm run build        # Next.js production build
npm run lint         # TypeScript + ESLint (strict: max-warnings=0)
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # tsc type checking
npm run format       # Prettier formatting
```

---

## Project-Specific Conventions

### Naming & Structure
- **RTL Support** - All UI marked with `dir="rtl"`, `lang="ar"` (see src/app/layout.tsx)
- **Path Alias** - `@/*` maps to `./src/*` for clean imports
- **Component Folder** - Single component file approach; Classes live in src/components/THEEditor.tsx (5700+ lines)

### Screenplay Classification Scoring
When implementing classification features:
- **Confidence Levels** - high (>70), medium (40-70), low (<40)
- **Doubt Scores** - Range 0-100; ≥60 triggers AI review consideration
- **Viterbi State Weight** - emissionWeight (0.6) vs transitionWeight (0.4)
- **Skip AI for High Confidence** - Scene headers with high scores + no verbs skip AI

### Text Processing
- **ReDoS Protection** - Regex patterns include ReDoS safeguards in screenplay patterns
- **Paste Handling** - Advanced context tracking for pasted content
- **Post-Processing** - `postProcessFormatting()` for intelligent text correction

### State Management
- **Zustand stores** - Used for persistent UI state (selected font, size, theme)
- **DocumentMemory** - Instance-based; reset on new document to clear character history

### Integration Points
- **Google Gemini API** - Called via `/api/ai/chat` endpoint
- **Async AI Review** - `classifyBatchWithAIReview()` for threshold-based verification
- **Export System** - ExportDialog component handles screenplay output formats

---

## Common Patterns

### When Classifying New Screenplay Elements
1. Add regex patterns to ScreenplayClassifier (e.g., `TRANSITION_RE`)
2. Add emission scoring in `classifyWithScoring()` method
3. Return ClassificationResult with type + confidence
4. Consider context from `previousTypes[]` array
5. Update doubtScore calculation if uncertainty likely

### When Adding Features to THEEditor
- Initialize system classes in `useRef()` at component level
- Use Zustand stores for UI state persistence
- Call Gemini via `/api/ai/chat` (handles streaming/batching)
- Track classifications in DocumentMemory for character persistence

### Arabic Text Handling
- Maintain RTL layout in all new components
- Use Tailwind with Tailwind CSS (v4) for styling
- Test character names with diacritics and Unicode edge cases

---

## Key Files Reference
| File | Purpose |
|------|---------|
| src/components/THEEditor.tsx | Main editor + all classifier/system classes |
| src/app/api/ai/chat/route.ts | Gemini API proxy |
| src/app/layout.tsx | Root layout with RTL/Arabic config |
| package.json | Dependencies (Next, React, Gemini SDK, Tailwind) |

---

## Environment Setup
Create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash  # or other Gemini model
```

No database required; state is in-memory + localStorage via Zustand.
