// lib/types.ts

/**
 * Represents a node in the DOM tree structure, suitable for UI display.
 */
export interface DOMTreeNode {
  /** A unique identifier for the node, useful for React keys and selection. */
  id: string;
  /** The type of the DOM node (e.g., 'element', 'text', 'comment', 'document', 'doctype'). */
  type: 'element' | 'text' | 'comment' | 'document' | 'doctype';
  /** The tag name for element nodes (e.g., 'div', 'p'), or a descriptive name for other types (e.g., '#text', '#comment', '#document', '#doctype'). */
  name: string;
  /** The text content for text and comment nodes, or the public/system ID for doctype nodes. */
  value?: string;
  /** A record of attribute names and their values for element nodes. */
  attributes?: Record<string, string>;
  /** An array of child nodes, if the node has children. */
  children?: DOMTreeNode[];
  /** Optional flag to control collapsed state in a tree view UI. */
  collapsed?: boolean;
  /** A CSS selector path to this node from the document root (e.g., "html > body > div:nth-child(2)"). */
  path?: string;
  /** The character start and end offsets of this node within the original HTML string. */
  originalHtmlOffset?: { start: number; end: number };
}

/**
 * Represents a node in a simplified JSON structure of HTML, suitable for data extraction or API responses.
 */
export interface HTMLJSONNode {
  /** The type of the HTML node. */
  type: 'element' | 'text' | 'comment' | 'doctype';
  /** The tag name for element nodes (e.g., 'div', 'p'). Omitted for non-element nodes. */
  tagName?: string;
  /** A record of attribute names and their values for element nodes. Omitted for non-element nodes. */
  attributes?: Record<string, string>;
  /** The text content for text, comment, or doctype nodes. */
  content?: string;
  /** An array of child HTMLJSONNode objects for element nodes. */
  children?: HTMLJSONNode[];
}

/**
 * Defines parsing options that can be applied to the HTML input.
 */
export interface ParsingOptions {
  /** Whether to remove HTML comments from the parsed output. */
  removeComments: boolean;
  /** Whether to remove text nodes that only contain whitespace. */
  removeEmptyTextNodes: boolean;
  /** Whether to remove `<script>` tags and their content. */
  removeScripts: boolean;
  /** Whether to remove `<style>` tags and their content. */
  removeStyles: boolean;
  /** A list of attribute names to remove from all elements (e.g., ['id', 'class']). */
  removeAttributes: string[];
  /** A list of tag names whose content should be unwraped (i.e., the tag itself is removed, but its children are kept). */
  unwrapTags: string[];
}

/**
 * Defines options for how the HTML preview should behave, especially regarding security.
 */
export interface PreviewOptions {
  /** Whether to sanitize the HTML using DOMPurify before displaying in the iframe. */
  sanitize: boolean;
  /** Whether to sandbox scripts within the iframe, preventing them from running. */
  sandboxScripts: boolean;
  /** Whether to sandbox forms within the iframe, preventing submission. */
  sandboxForms: boolean;
  /** Whether to sandbox popups (e.g., `window.open`) within the iframe. */
  sandboxPopups: boolean;
  /** Whether to allow same-origin content in the iframe. */
  sandboxAllowSameOrigin: boolean;
}

/**
 * Defines options for converting the parsed HTML into different formats.
 */
export interface ConversionOptions {
  /** The target format for conversion (e.g., 'html', 'markdown', 'text', 'json'). */
  targetFormat: 'html' | 'markdown' | 'text' | 'json';
  /** Options specific to Markdown conversion. */
  markdownOptions: {
    /** Whether to preserve HTML comments during Markdown conversion. */
    keepHtmlComments: boolean;
    /** Whether to convert raw HTML blocks/tags to Markdown equivalent if possible. */
    convertHtmlToMarkdown: boolean;
  };
  /** Options specific to plain text conversion. */
  textOptions: {
    /** Whether to remove all HTML tags, leaving only text content. */
    removeHtmlTags: boolean;
    /** Whether to preserve whitespace and line breaks as much as possible. */
    preserveWhitespace: boolean;
  };
  /** Options specific to JSON conversion (referring to the HTMLJSONNode structure). */
  jsonOptions: {
    /** Whether to include element attributes in the JSON output. */
    includeAttributes: boolean;
    /** Whether to flatten adjacent text nodes into a single string. */
    flattenTextNodes: boolean;
  };
}

/**
 * Represents the entire application state, typically managed by a state management library like Zustand.
 */
export interface AppState {
  /** The raw HTML string input by the user. */
  htmlInput: string;
  /** The root of the parsed DOM tree structure, or null if not yet parsed or on error. */
  parsedDomTree: DOMTreeNode | null;
  /** The root of the parsed HTML JSON structure, or null if not yet parsed or on error. */
  parsedHtmlJson: HTMLJSONNode | null;
  /** The currently active tab in the UI. */
  activeTab: 'input' | 'tree' | 'json' | 'preview' | 'extract' | 'clean' | 'convert';
  /** The HTML string prepared for display in the sandboxed iframe preview. */
  previewHtml: string;
  /** Any error message encountered during HTML parsing or processing. */
  parsingError: string | null;
  /** The ID of the DOM node currently highlighted in the tree/json view. */
  highlightedNodeId: string | null;
  /** The character start and end offsets to highlight in the input editor, corresponding to the `highlightedNodeId`. */
  highlightedOffset: { start: number; end: number } | null;

  /** Current options for HTML parsing. */
  parsingOptions: ParsingOptions;
  /** Current options for the HTML preview. */
  previewOptions: PreviewOptions;
  /** Current options for HTML conversion. */
  conversionOptions: ConversionOptions;

  // Actions (typically defined in the store, but listed here for context of state shape)
  // setHtmlInput: (html: string) => void;
  // parseHtml: (html: string) => void;
  // setActiveTab: (tab: AppState['activeTab']) => void;
  // setHighlightedNode: (nodeId: string | null, offset: { start: number; end: number } | null) => void;
  // setParsingOptions: (options: Partial<ParsingOptions>) => void;
  // setPreviewOptions: (options: Partial<PreviewOptions>) => void;
  // setConversionOptions: (options: Partial<ConversionOptions>) => void;
}