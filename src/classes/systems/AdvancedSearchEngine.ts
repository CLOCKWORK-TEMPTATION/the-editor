/**
 * AdvancedSearchEngine Class
 * Advanced search and replace functionality for the editor
 */

export interface SearchResult {
  success: boolean;
  totalMatches?: number;
  matches?: Array<{ line: number; text: string }>;
  error?: string;
}

export interface ReplaceResult {
  success: boolean;
  replacements?: number;
  patternSource?: string;
  patternFlags?: string;
  replaceText?: string;
  replaceAll?: boolean;
  error?: string;
}

export class AdvancedSearchEngine {
  /**
   * Search for a term in content
   */
  async searchInContent(content: string, searchTerm: string): Promise<SearchResult> {
    try {
      const lines = content.split('\n');
      const matches: Array<{ line: number; text: string }> = [];
      const regex = new RegExp(searchTerm, 'gi');

      lines.forEach((line, index) => {
        if (regex.test(line)) {
          matches.push({ line: index + 1, text: line });
        }
      });

      return {
        success: true,
        totalMatches: matches.length,
        matches,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Replace a term in content
   */
  async replaceInContent(
    content: string,
    searchTerm: string,
    replaceTerm: string,
    replaceAll: boolean = true
  ): Promise<ReplaceResult> {
    try {
      const flags = replaceAll ? 'gi' : 'i';
      const regex = new RegExp(searchTerm, flags);
      const matches = content.match(regex);
      const replacements = matches ? matches.length : 0;

      return {
        success: true,
        replacements,
        patternSource: searchTerm,
        patternFlags: flags,
        replaceText: replaceTerm,
        replaceAll,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
