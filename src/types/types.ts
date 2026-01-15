/**
 * Type Definitions for THEEditor
 * Contains all the type definitions used throughout the application
 */

/**
 * ViterbiState - All possible states in the Viterbi classification
 */
export type ViterbiState =
  | 'scene-header-top-line'
  | 'scene-header-1'
  | 'scene-header-2'
  | 'scene-header-3'
  | 'character'
  | 'dialogue'
  | 'parenthetical'
  | 'action'
  | 'transition'
  | 'blank'
  | 'basmala';

/**
 * ALL_STATES - Array of all possible states
 */
export const ALL_STATES: ViterbiState[] = [
  'scene-header-top-line',
  'scene-header-1',
  'scene-header-2',
  'scene-header-3',
  'character',
  'dialogue',
  'parenthetical',
  'action',
  'transition',
  'blank',
  'basmala',
];

/**
 * ClassifiedLine - A line that has been classified with a type
 */
export interface ClassifiedLine {
  text: string;
  type: ViterbiState;
  _reviewInfo?: {
    originalType: ViterbiState;
    confidence: number;
    reason: string;
  };
}

/**
 * ReviewableLineUI - A line that can be reviewed in the UI
 */
export interface ReviewableLineUI {
  lineIndex?: number;
  text: string;
  type: ViterbiState | string;
  currentType?: string;
  doubtScore?: number;
  emissionScore?: number;
  index?: number;
  suggestedTypes?: Array<{
    type: any;
    score: any;
    reasons?: any;
  }>;
  fallbackApplied?: any;
}

/**
 * Script - Represents a complete screenplay script
 */
export interface Script {
  title: string;
  author: string;
  scenes: Scene[];
  characters: Character[];
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
    version?: string;
  };
}

/**
 * Scene - Represents a scene in the script
 */
export interface Scene {
  id: string;
  number: number;
  header: string;
  location?: string;
  timeOfDay?: string;
  lines: (DialogueLine | SceneActionLine)[];
}

/**
 * Character - Represents a character in the script
 */
export interface Character {
  name: string;
  description?: string;
  dialogueLines?: number;
}

/**
 * DialogueLine - A line of dialogue spoken by a character
 */
export interface DialogueLine {
  type: 'dialogue';
  character: string;
  text: string;
  parenthetical?: string;
}

/**
 * SceneActionLine - An action/description line in a scene
 */
export interface SceneActionLine {
  type: 'action';
  text: string;
}

/**
 * LineContext - Context information for line classification
 */
export interface LineContext {
  prevLine?: ClassifiedLine;
  nextLine?: ClassifiedLine;
  previousLines?: ClassifiedLine[];
  nextLines?: ClassifiedLine[];
  inDialogue?: boolean;
  sceneNumber?: number;
  stats?: {
    totalLines?: number;
    currentIndex?: number;
    [key: string]: any;
  };
}

/**
 * ClassificationScore - Score for a particular classification
 */
export interface ClassificationScore {
  type: ViterbiState;
  score: number;
  confidence: number;
  reasons?: string[];
}

/**
 * ClassificationResult - Result of classifying a single line
 */
export interface ClassificationResult {
  text: string;
  type: ViterbiState | string;
  scores?: ClassificationScore[] | { [key: string]: ClassificationScore };
  confidence?: number | string;
  doubtScore?: number;
  needsReview?: boolean;
  top2Candidates?: any;
  fallbackApplied?: any;
}

/**
 * CandidateType - A candidate type with its score
 */
export interface CandidateType {
  type: ViterbiState;
  score: number;
}

/**
 * BatchClassificationResult - Result of batch classification
 */
export interface BatchClassificationResult {
  text: string;
  type: string;
  confidence?: number | string;
  doubtScore?: number;
  emissionScore?: number;
  needsReview?: boolean;
  top2Candidates?: any;
  fallbackApplied?: any;
  viterbiOverride?: any;
  lineIndex?: number;
}
