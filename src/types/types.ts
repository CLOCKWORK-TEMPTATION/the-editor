/**
 * TypeScript Types & Interfaces
 * تعريفات الأنواع المستخدمة في المشروع
 */

// ==================== Script Types ====================

export interface Script {
  id: string;
  title: string;
  author?: string;
  scenes: Scene[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Scene {
  id: string;
  number: number;
  header: string;
  location?: string;
  timeOfDay?: string;
  lines: (DialogueLine | SceneActionLine)[];
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  appearances: number;
}

export interface DialogueLine {
  type: 'dialogue' | 'character' | 'parenthetical';
  character?: string;
  text: string;
  lineNumber?: number;
}

export interface SceneActionLine {
  type: 'action' | 'transition' | 'scene-header' | 'scene-header-3';
  text: string;
  lineNumber?: number;
}

// ==================== Classification Types ====================

export type ViterbiState = 
  | 'blank'
  | 'basmala'
  | 'scene-header'
  | 'scene-header-top-line'
  | 'scene-header-1'
  | 'scene-header-2'
  | 'scene-header-3'
  | 'action'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'transition';

export const ALL_STATES: ViterbiState[] = [
  'blank',
  'basmala',
  'scene-header',
  'scene-header-top-line',
  'scene-header-1',
  'scene-header-2',
  'scene-header-3',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

export interface LineContext {
  prevLine: string | null;
  nextLine: string | null;
  prevNonBlank: string | null;
  nextNonBlank: string | null;
  position: 'start' | 'middle' | 'end';
  prevType?: string | null;
  nextType?: string | null;
  previousLines?: any[];
  nextLines?: any[];
  stats?: {
    currentWordCount: number;
    currentLineLength: number;
    nextWordCount?: number;
    nextLineLength?: number;
    hasPunctuation: boolean;
    nextHasPunctuation?: boolean;
  };
}

export interface ClassificationScore {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface ClassificationResult {
  type: string;
  confidence: 'high' | 'medium' | 'low';
  score?: number;
  scores?: Record<string, ClassificationScore>;
  reasons?: string[];
  alternatives?: CandidateType[];
  doubtScore?: number;
  needsReview?: boolean;
  top2Candidates?: CandidateType[] | null;
  fallbackApplied?: FallbackInfo | undefined;
  context?: LineContext;
  multiDimensionalConfidence?: {
    overall: number;
    context: number;
    pattern: number;
    history: number;
    alternatives: Array<{ type: string; score: number }>;
    isUncertain: boolean;
    explanation: string;
  };
}

export interface FallbackInfo {
  originalType: string;
  fallbackType: string;
  reason: string;
}

export interface CandidateType {
  type: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface BatchClassificationResult {
  text: string;
  type: string;
  confidence: 'high' | 'medium' | 'low';
  doubtScore?: number;
  needsReview?: boolean;
  top2Candidates?: CandidateType[] | null;
  viterbiOverride?: {
    greedyChoice: string;
    viterbiChoice: string;
    reason: string;
  };
  fallbackApplied?: FallbackInfo;
}

export interface ReviewableLineUI {
  text: string;
  type: string;
  currentType: string;
  doubtScore: number;
  index: number;
  lineIndex: number;
  suggestedTypes: { type: string; score: number; reasons: string[] }[];
  fallbackApplied?: FallbackInfo;
}

export interface ClassifiedLine {
  text: string;
  type: ViterbiState;
}

export interface ReviewResult {
  originalIndex: number;
  originalType: ViterbiState;
  suggestedType: ViterbiState;
  confidence: number;
  reason: string;
}

export interface ReviewPerformanceStats {
  totalLines: number;
  reviewedLines: number;
  changedLines: number;
  totalTimeMs: number;
  averageTimePerLine: number;
  apiCalls: number;
}

