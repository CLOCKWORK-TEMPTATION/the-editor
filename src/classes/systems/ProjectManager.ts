/**
 * ProjectManager Class
 * Manages screenplay projects
 */

export class ProjectManager {
  private currentProject: string | null = null;

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<void> {
    this.currentProject = name;
  }

  /**
   * Open an existing project
   */
  async openProject(name: string): Promise<void> {
    this.currentProject = name;
  }

  /**
   * Save the current project
   */
  async saveProject(content: string): Promise<void> {
    // Stub implementation
  }

  /**
   * Get current project name
   */
  getCurrentProject(): string | null {
    return this.currentProject;
  }
}
