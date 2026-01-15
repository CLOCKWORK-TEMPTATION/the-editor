/**
 * StateManager Class
 * Manages the state of the editor
 */

export class StateManager {
  private history: string[] = [];
  private currentIndex: number = -1;

  /**
   * Save a new state
   */
  saveState(content: string): void {
    // Remove any states after the current index
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(content);
    this.currentIndex++;
  }

  /**
   * Undo to the previous state
   */
  undo(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Redo to the next state
   */
  redo(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
