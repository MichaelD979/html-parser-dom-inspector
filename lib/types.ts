export type DOMNodeType = 'element' | 'text' | 'comment' | 'doctype' | 'cdata';

/**
 * Represents a single node in the parsed HTML DOM tree.
 */
export interface DOMTreeNode {
  id: string; // Unique ID for this node (e.g., 'node-0-1-2')
  type: DOMNodeType;
  tagName?: string; // Present only for 'element' nodes (e.g., 'div', 'p')
  attributes?: Record<string, string>; // Present only for 'element' nodes
  nodeValue?: string; // Raw value for 'text', 'comment', 'cdata', 'doctype' nodes
  textContent?: string; // Aggregated text content for 'element' nodes, or nodeValue for others
  children?: DOMTreeNode[]; // Present only for 'element' nodes that can have children
  parentNodeId?: string; // Optional reference to the parent node's ID
  outerHtml?: string; // The full HTML snippet of this node, including its children (optional, for debugging/display)
  depth: number; // The depth of the node in the DOM tree (root is 0)
  index: number; // The index of this node among its siblings
}

/**
 * Defines the type of attribute or content to extract from an element.
 * 'text': Extracts the aggregated text content of the element.
 * 'html': Extracts the inner HTML of the element.
 * string: Extracts the value of a specific attribute (e.g., 'href', 'src').
 */
export type ExtractionAttribute = 'text' | 'html' | string;

/**
 * Represents a rule defined by the user for extracting data from the HTML.
 */
export interface ExtractionRule {
  id: string; // Unique identifier for the rule
  selector: string; // CSS selector to target elements
  attribute: ExtractionAttribute; // What to extract from the matched elements
  label: string; // A user-friendly label for the extracted data
}

/**
 * Represents a single piece of data extracted based on an ExtractionRule.
 */
export interface ExtractedElement {
  id: string; // Unique identifier for this extracted item
  ruleId: string; // Reference to the ExtractionRule that generated this item
  selector: string; // The selector used for extraction
  attribute: ExtractionAttribute; // The attribute/content type extracted
  value: string | null; // The extracted string value (null if not found)
  nodeId: string; // The ID of the DOMTreeNode from which the data was extracted
  contextPath?: string; // Optional, a simplified path like "div > p > a" for context
}

/**
 * Defines the type of cleaning action to perform on HTML elements.
 */
export type CleaningAction =
  | 'remove-tag'        // Removes the tag and its children
  | 'unwrap-tag'        // Removes the tag but keeps its children
  | 'remove-attribute'  // Removes a specific attribute from the tag
  | 'replace-attribute'; // Replaces the value of a specific attribute

/**
 * Represents a rule defined by the user for cleaning or transforming the HTML.
 */
export interface CleaningRule {
  id: string; // Unique identifier for the cleaning rule
  action: CleaningAction;
  selector: string; // CSS selector to target elements for cleaning
  attributeName?: string; // Required for 'remove-attribute', 'replace-attribute'
  newValue?: string; // Required for 'replace-attribute'
  // Future: Could add 'applyToChildren', 'matchValue', etc.
}

/**
 * Represents a node in the structured JSON output when converting HTML to JSON.
 */
export type HTMLToJsonNodeChildren = (HTMLToJsonNode | string)[];

export interface HTMLToJsonNode {
  type: 'element' | 'text' | 'comment' | 'doctype';
  tag?: string; // For 'element' nodes (e.g., 'div', 'p')
  attributes?: Record<string, string>; // For 'element' nodes
  content?: string; // For 'text', 'comment', 'doctype' nodes
  children?: HTMLToJsonNodeChildren; // For 'element' nodes with child elements or text
}

/**
 * Represents the overall state of the HTML parsing tool.
 */
export interface HtmlParserToolState {
  // Input
  htmlInput: string;
  sanitizedInput: string; // The input after initial sanitization (e.g., DOMPurify)

  // Parsing & DOM Tree
  parsedDom: DOMTreeNode[]; // Array of root DOMTreeNodes
  domTreeError: string | null; // Any error during DOM parsing
  domTreeExpandedNodes: Set<string>; // Set of node IDs currently expanded in the tree view
  domTreeSelectedNodeId: string | null; // The ID of the currently selected node in the tree

  // Extraction
  extractionRules: ExtractionRule[];
  extractedData: ExtractedElement[];
  extractionError: string | null; // Any error during data extraction

  // Cleaning
  cleaningRules: CleaningRule[];
  cleanedHtml: string; // The HTML string after applying cleaning rules
  cleaningError: string | null; // Any error during HTML cleaning

  // Conversion
  conversionFormat: 'json' | 'markdown' | 'text' | 'html'; // Target format for conversion
  convertedOutput: string; // The result of the conversion
  conversionError: string | null; // Any error during conversion

  // UI State
  activeTab: 'input' | 'dom-tree' | 'extract' | 'clean' | 'convert' | 'settings';
  isLoading: boolean; // General loading indicator for operations
  errorMessage: string | null; // General error message for the tool

  // Settings
  prettyPrintOutput: boolean; // Whether to pretty-print HTML/JSON output
  stripCommentsOnParse: boolean; // Whether to remove comments during initial parsing
  domPurifyEnabled: boolean; // Whether to use DOMPurify on input HTML
}