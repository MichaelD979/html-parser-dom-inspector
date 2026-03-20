export interface DOMNode {
  /** A unique identifier for the node, useful for React keys and internal tracking. */
  id: string;
  /** The type of the node (e.g., 'element', 'text', 'comment', 'document', 'doctype'). */
  type: 'element' | 'text' | 'comment' | 'document' | 'doctype';
  /** The node's name (e.g., 'div', '#text', '#comment', '#document'). */
  nodeName: string;
  /** The DOM Node.nodeType constant (e.g., Node.ELEMENT_NODE, Node.TEXT_NODE). */
  nodeType: number;
  /** The tag name for element nodes (e.g., 'div', 'p'). Undefined for other node types. */
  tagName?: string;
  /** The text content of the node. Present for text, comment, and sometimes element nodes. */
  textContent?: string;
  /** A map of attribute names to their values for element nodes. */
  attributes?: Record<string, string>;
  /** An array of child DOMNodes for element and document nodes. */
  children?: DOMNode[];
  /** Indicates if the element is self-closing (e.g., <img>, <br>). */
  isSelfClosing?: boolean;
  /** The depth of the node in the DOM tree, relative to the root (0 for document). */
  depth: number;
  /** The ID of the parent node, or null if it's a root node. */
  parentId: string | null;
  /** The original outer HTML of this specific node. */
  outerHTML?: string;
}

/**
 * A simplified, JSON-serializable representation of an HTML node,
 * suitable for state storage or passing between threads/workers.
 */
export interface HTMLJSONNode {
  /** A unique identifier for the node, essential for React keys. */
  id: string;
  /** The type of the node ('element', 'text', 'comment'). */
  type: 'element' | 'text' | 'comment';
  /** The tag name for element nodes, or '#text'/'#comment' for text/comment nodes. */
  name: string;
  /** A map of attribute names to their values for element nodes. */
  attributes?: Record<string, string>;
  /** The text content of the node. Present for text/comment nodes, or combined text for elements. */
  content?: string;
  /** An array of child HTMLJSONNodes. */
  children?: HTMLJSONNode[];
  /** The depth of the node in the tree. */
  depth: number;
  /** Optional: Indicates if the node is currently expanded in a tree view. */
  isExpanded?: boolean;
  /** Optional: Original HTML string of this node. */
  originalHtml?: string;
}

export interface ExtractionResult {
  /** The CSS selector used for the extraction. */
  selector: string;
  /** An array of extracted values (e.g., text content, attribute values). */
  values: string[];
  /** The total number of elements matched by the selector. */
  count: number;
  /** Optional: An array of the outer HTML strings of the matched elements. */
  matchedElementsHtml?: string[];
  /** Optional: An error message if the extraction failed. */
  error?: string;
  /** The timestamp when this extraction was performed. */
  timestamp: string;
}

/**
 * Represents common Prettier formatting options.
 */
export interface PrettierConfigOptions {
  parser?: string;
  useTabs?: boolean;
  tabWidth?: number;
  printWidth?: number;
  semi?: boolean;
  singleQuote?: boolean;
  jsxSingleQuote?: boolean;
  trailingComma?: 'none' | 'es5' | 'all';
  bracketSpacing?: boolean;
  bracketSameLine?: boolean;
  arrowParens?: 'always' | 'avoid';
  proseWrap?: 'always' | 'never' | 'preserve';
  htmlWhitespaceSensitivity?: 'css' | 'strict' | 'ignore';
  vueIndentScriptAndStyle?: boolean;
  endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
  embeddedLanguageFormatting?: 'auto' | 'off';
  singleAttributePerLine?: boolean;
}

/**
 * Defines the application's global state.
 */
export interface AppState {
  /** The raw HTML string input by the user. */
  rawHtmlInput: string;
  /** The structured tree representation of the parsed HTML. Null if not parsed or errored. */
  parsedHtmlTree: HTMLJSONNode[] | null;
  /** The currently active view/tab in the UI. */
  currentView: 'editor' | 'tree' | 'extracted' | 'cleaned' | 'converted';
  /** The CSS selector currently being used for extraction. */
  cssSelector: string;
  /** An array of all past extraction results. */
  extractionResults: ExtractionResult[];
  /** The cleaned HTML string. Null if not cleaned or errored. */
  cleanedHtml: string | null;
  /** The converted Markdown string. Null if not converted or errored. */
  convertedMarkdown: string | null;
  /** Indicates if any background operation (parse, extract, clean, convert) is in progress. */
  isLoading: boolean;
  /** An error message if any operation failed. Null if no error. */
  error: string | null;

  /** Status flags for specific operations. */
  isParsing: boolean;
  isExtracting: boolean;
  isCleaning: boolean;
  isConverting: boolean;

  /** Options for various processing steps. */
  options: {
    /** Whether to sanitize the HTML using DOMPurify. */
    sanitize: boolean;
    /** Whether to remove script tags during cleaning. */
    removeScripts: boolean;
    /** Whether to remove style tags during cleaning. */
    removeStyles: boolean;
    /** A list of attribute names to strip from elements during cleaning (e.g., 'id', 'class'). */
    stripAttributes: string[];
    /** The desired output format for conversion. */
    outputFormat: 'html' | 'markdown';
    /** Whether to apply Prettier formatting to the output. */
    applyPrettier: boolean;
    /** Specific options for Prettier formatting. */
    prettifyOptions: PrettierConfigOptions;
    /** The CSS selector to remove specific elements when cleaning. */
    removeElementsSelector: string;
  };
}