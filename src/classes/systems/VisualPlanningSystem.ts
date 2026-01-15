/**
 * VisualPlanningSystem Class
 * Visual planning tools for screenplay structure
 */

export class VisualPlanningSystem {
  private scenes: Array<{ id: string; title: string }> = [];

  /**
   * Add a scene to the plan
   */
  addScene(title: string): void {
    const id = `scene-${Date.now()}`;
    this.scenes.push({ id, title });
  }

  /**
   * Remove a scene from the plan
   */
  removeScene(id: string): void {
    this.scenes = this.scenes.filter((scene) => scene.id !== id);
  }

  /**
   * Get all scenes
   */
  getScenes(): Array<{ id: string; title: string }> {
    return this.scenes;
  }

  /**
   * Reorder scenes
   */
  reorderScenes(fromIndex: number, toIndex: number): void {
    const [scene] = this.scenes.splice(fromIndex, 1);
    this.scenes.splice(toIndex, 0, scene);
  }
}
