/**
 * DOM Text Replacement Module
 * Utilities for applying regex replacements to text nodes in the DOM
 */

/**
 * Apply regex replacement to text nodes within a container
 * @param container - The container element
 * @param patternSource - The regex pattern source
 * @param patternFlags - The regex pattern flags
 * @param replaceText - The replacement text
 * @param replaceAll - Whether to replace all occurrences
 * @returns The number of replacements applied
 */
export function applyRegexReplacementToTextNodes(
  container: HTMLElement,
  patternSource: string,
  patternFlags: string,
  replaceText: string,
  replaceAll: boolean = true
): number {
  let replacementsCount = 0;
  
  try {
    const regex = new RegExp(patternSource, patternFlags);
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToReplace: { node: Text; newText: string }[] = [];

    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const textNode = node as Text;
        const originalText = textNode.textContent;
        
        if (regex.test(originalText)) {
          const newText = replaceAll
            ? originalText.replace(new RegExp(patternSource, patternFlags + 'g'), replaceText)
            : originalText.replace(regex, replaceText);
          
          if (newText !== originalText) {
            nodesToReplace.push({ node: textNode, newText });
          }
        }
      }
    }

    // Apply all replacements
    for (const { node, newText } of nodesToReplace) {
      node.textContent = newText;
      replacementsCount++;
    }
  } catch (error) {
    console.error('Error in applyRegexReplacementToTextNodes:', error);
  }

  return replacementsCount;
}
