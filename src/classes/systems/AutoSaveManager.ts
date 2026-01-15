/**
 * AutoSaveManager Class
 * Manages automatic saving of content
 */

export class AutoSaveManager {
  private saveCallback: ((content: string) => Promise<void>) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private saveInterval: number = 30000; // 30 seconds

  /**
   * Set the save callback function
   */
  setSaveCallback(callback: (content: string) => Promise<void>): void {
    this.saveCallback = callback;
  }

  /**
   * Start auto-save
   */
  startAutoSave(): void {
    if (this.intervalId) {
      this.stopAutoSave();
    }

    this.intervalId = setInterval(() => {
      this.performAutoSave();
    }, this.saveInterval);
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform an auto-save
   */
  private async performAutoSave(): Promise<void> {
    if (this.saveCallback) {
      // In a real implementation, this would get content from the editor
      await this.saveCallback('');
    }
  }
}
