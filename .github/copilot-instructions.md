# Copilot Instructions for THE-Editor

## Project Overview
**THE-Editor** is an advanced Arabic screenplay editor built with Next.js and React. It combines NLP-based text classification (Viterbi algorithm) with AI-powered writing assistance to help screenwriters structure and refine scripts in Arabic.

### Tech Stack
- **Framework**: Next.js 16.1.1 + React 19
- **Language**: TypeScript 5.7
- **Styling**: TailwindCSS 4.1 + Framer Motion
- **AI Backend**: Google Gemini API (v1.5-flash)
- **State Management**: Zustand 5
- **Logging**: Winston 3.19

## Architecture Overview

### Core Components

1. **THEEditor.tsx** - Main editor component
   - Monolithic component (~5700 lines) combining multiple features
   - Integrates all system classes and UI elements
   - Handles text classification, AI assistance, search/replace, export
   - Uses keyboard shortcuts (Ctrl+1-6 for formatting)

2. **ViterbiDecoder** - Text classification engine
   - Classifies screenplay lines into screenplay element types
   - States: `scene-header-top-line`, `scene-header-1-3`, `character`, `dialogue`, `parenthetical`, `action`, `transition`, `blank`, `basmala`
   - Currently stub implementation - needs real Viterbi algorithm

3. **System Classes** (`/src/classes/systems/`)
   - **StateManager**: Undo/redo history tracking
   - **AutoSaveManager**: Periodic document saving
   - **AdvancedSearchEngine**: Regex-based search with DOM integration
   - **CollaborationSystem**: Multi-user editing
   - **ProjectManager**: Script project management
   - **VisualPlanningSystem**: Timeline and scene visualization

4. **AIWritingAssistant** - AI integration layer
   - Routes requests through `/api/ai/chat` endpoint
   - Communicates with Google Gemini API
   - Currently stub implementation

### Data Flow

```
User Input (THEEditor)
  ↓
Text Classification (ViterbiDecoder)
  ↓
State Management (StateManager, Zustand store)
  ↓
System Processing (AdvancedSearchEngine, AIWritingAssistant, etc.)
  ↓
DOM Rendering + Export (domTextReplacement, ExportDialog)
```

## Key File Locations

| Purpose | File |
|---------|------|
| Type definitions | `src/types/types.ts` |
| Main editor UI | `src/components/THEEditor.tsx` |
| AI endpoint | `src/app/api/ai/chat/route.ts` |
| Text classification | `src/classes/ViterbiDecoder.ts` |
| Undo/redo logic | `src/classes/systems/StateManager.ts` |
| Search/replace DOM ops | `src/modules/domTextReplacement.ts` |

## Development Workflows

### Building & Running
```bash
npm run dev        # Start dev server on port 5000
npm run build      # Next.js production build
npm run lint       # ESLint (zero warnings)
npm run type-check # TypeScript check
npm run format     # Prettier format
```

### Critical Patterns

1. **Viterbi State Classification**
   - All line types must be from `ViterbiState` union type
   - States array in `src/types/types.ts` (line 23) is source of truth
   - Interface: `ClassifiedLine { text, type }`

2. **AI API Communication**
   - Endpoint: POST `/api/ai/chat`
   - Takes `{ model?, messages: ChatMessage[] }`
   - Returns text extracted from Gemini response's `candidates[0].content.parts`
   - Uses `GEMINI_API_KEY` and `GEMINI_MODEL` env vars

3. **DOM Text Operations**
   - Use `applyRegexReplacementToTextNodes()` for safe DOM replacements
   - TreeWalker pattern to locate and modify text nodes
   - Prevents ReDoS attacks with caution in regex patterns

4. **State Management**
   - Zustand store in main THEEditor component
   - StateManager class for undo/redo history
   - AutoSaveManager persists state periodically

5. **Export & Formatting**
   - ExportDialog handles file export
   - postProcessFormatting applies intelligent text correction
   - Advanced paste handling preserves context

## Important Implementation Notes

### Screenplay Element Detection
The editor must distinguish between screenplay elements:
- **Scene Header**: "INT/EXT location - TIME" (multi-line Arabic support)
- **Character**: Actor name (typically centered, uppercase)
- **Dialogue**: Character speech
- **Parenthetical**: Performance directions "(angrily)" inside dialogue
- **Action**: Scene description
- **Transition**: "CUT TO:", "FADE OUT"
- **Basmala**: "بسم الله الرحمن الرحيم" (Islamic opening)

### Stub Implementations to Complete
These classes need real implementations, not stubs:
- `ViterbiDecoder.decode()` - Actual Viterbi algorithm
- `ViterbiDecoder.viterbi()` - Probability-based state inference
- `AIWritingAssistant.getSuggestions()` - Real AI calls
- `AIWritingAssistant.improveText()` - Text enhancement via API

### Environment Configuration
```
GEMINI_API_KEY=<your-key>
GEMINI_MODEL=gemini-1.5-flash (or latest)
```

## Code Quality Standards
- TypeScript strict mode (tsconfig.json enforced)
- ESLint required (zero warnings allowed)
- Prettier formatting on all commits
- No bare exceptions - type errors properly
- ReDoS protection in regex patterns

## When Adding Features
1. Check `src/types/types.ts` for existing type definitions first
2. Coordinate with StateManager for undo/redo if modifying content
3. Use Viterbi classification for screenplay element detection
4. For AI features, route through `/api/ai/chat` endpoint
5. Test keyboard shortcut integration with existing Ctrl+1-6 scheme
6. Consider Arabic RTL text handling in UI layouts
