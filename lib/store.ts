import { create } from 'zustand';
import { DOMNode, HTMLJSONNode, ExtractionResult } from '@/lib/types';

/**
 * Interface defining the state and actions for the HTML parser tool.
 */
interface HtmlParserState {
  // --- Raw HTML Input ---
  /** The current raw HTML content entered by the user or loaded from a file. */
  rawHtmlInput: string;
  /** Sets the raw HTML input content. */
  setRawHtmlInput: (html: string) => void;

  // --- HTML File Upload ---
  /** The name of the currently uploaded HTML file, or null if none. */
  uploadedFileName: string | null;
  /** The content of the currently uploaded HTML file, or null if none. */
  uploadedFileContent: string | null;
  /** Sets the uploaded file's name and content, also updating `rawHtmlInput`. */
  setUploadedFile: (name: string, content: string) => void;
  /** Clears any uploaded file information. */
  clearUploadedFile: () => void;

  // --- DOM Structure Parsing & Visualization ---
  /** The parsed DOM tree represented as an array of `DOMNode`s, or null if not yet parsed or if parsing failed. */
  parsedDomTree: DOMNode[] | null;
  /** Any error message encountered during HTML parsing (e.g., malformed markup), or null if parsing was successful. */
  parsingError: string | null;
  /** Sets the parsed DOM tree. */
  setParsedDomTree: (tree: DOMNode[] | null) => void;
  /** Sets any parsing error message and updates `isMalformedHtml`. */
  setParsingError: (error: string | null) => void;

  // --- Element Extraction by Selector ---
  /** The CSS selector or XPath string entered by the user for extraction. */
  selectorInput: string;
  /** An array of results from previous extraction operations. */
  extractionResults: ExtractionResult[];
  /** Sets the current selector input string. */
  setSelectorInput: (selector: string) => void;
  /** Sets the complete array of extraction results. */
  setExtractionResults: (results: ExtractionResult[]) => void;
  /** Adds a single extraction result to the existing list. */
  addExtractionResult: (result: ExtractionResult) => void;
  /** Clears all current extraction results. */
  clearExtractionResults: () => void;

  // --- HTML Cleaning & Sanitization ---
  /** The cleaned and sanitized HTML output, or null if not yet processed. */
  cleanHtmlOutput: string | null;
  /** Indicates whether the current `cleanHtmlOutput` has been processed through the sanitization logic. */
  isHtmlSanitized: boolean;
  /** Configuration options for HTML sanitization using DOMPurify. */
  sanitizationOptions: {
    /** If true, script tags and event attributes will be removed. */
    removeScripts: boolean;
    /** If true, HTML comments will be removed. */
    removeComments: boolean;
    /** An array of allowed HTML tags (e.g., ['div', 'p']). If null, all tags are allowed (after script removal). */
    allowedTags: string[] | null;
    /** A map of allowed attributes for specific tags. Keys can be tag names or '*' for all tags. Values are arrays of attribute names. If null, all attributes are allowed. */
    allowedAttributes: Record<string, string[]> | null;
  };
  /** Sets the cleaned HTML output. */
  setCleanHtmlOutput: (html: string | null) => void;
  /** Sets the flag indicating whether the HTML has been sanitized. */
  setIsHtmlSanitized: (sanitized: boolean) => void;
  /** Updates the sanitization options, merging with existing options. */
  setSanitizationOptions: (options: Partial<HtmlParserState['sanitizationOptions']>) => void;

  // --- HTML to JSON Conversion ---
  /** The parsed HTML DOM structure converted to a JSON-serializable format, or null. */
  jsonOutput: HTMLJSONNode[] | null;
  /** Sets the JSON representation of the HTML DOM. */
  setJsonOutput: (json: HTMLJSONNode[] | null) => void;

  // --- Safe Rendered Preview ---
  /** The HTML string intended for display in a sandboxed iframe preview, typically sanitized. */
  previewHtml: string | null;
  /** Sets the HTML content for the safe rendered preview. */
  setPreviewHtml: (html: string | null) => void;

  // --- Malformed Markup Detection ---
  /** True if the `rawHtmlInput` contains malformed or invalid HTML markup, derived from `parsingError`. */
  isMalformedHtml: boolean;
  /** Explicitly sets the malformed HTML flag. (Usually updated by `setParsingError`). */
  setIsMalformedHtml: (malformed: boolean) => void;

  // --- Source Editor Enhancements (Monaco Editor) ---
  /** The current theme for the Monaco Editor ('vs-dark' or 'vs-light'). */
  editorTheme: 'vs-dark' | 'vs-light';
  /** Configuration options for the Monaco Editor. */
  editorOptions: {
    minimap: { enabled: boolean };
    lineNumbers: 'on' | 'off';
    autoClosingTags: boolean;
    formatOnType: boolean;
    matchBrackets: 'never' | 'always' | 'active';
  };
  /** Sets the Monaco Editor theme. */
  setEditorTheme: (theme: HtmlParserState['editorTheme']) => void;
  /** Updates the Monaco Editor options, merging with existing options (deeply for `minimap`). */
  setEditorOptions: (options: Partial<HtmlParserState['editorOptions']>) => void;

  // --- DOM Tree Viewer Features ---
  /** A Set of unique IDs for DOM nodes that are currently expanded in the tree viewer. */
  expandedNodeIds: Set<string>;
  /** Toggles the expansion state of a specific node in the DOM tree viewer. */
  toggleNodeExpansion: (nodeId: string) => void;
  /** Sets the entire Set of expanded node IDs, useful for batch updates. */
  setExpandedNodeIds: (ids: Set<string>) => void;

  // --- HTML Beautify/Minify Options ---
  /** Configuration options for HTML beautification (formatting). */
  beautifyOptions: {
    indentSize: number;
    wrapLineLength: number; // 0 for no wrapping
    endWithNewline: boolean;
  };
  /** Configuration options for HTML minification. */
  minifyOptions: {
    removeComments: boolean;
    collapseWhitespace: boolean;
    removeEmptyElements: boolean;
    removeAttributeQuotes: boolean;
  };
  /** Updates the HTML beautification options, merging with existing options. */
  setBeautifyOptions: (options: Partial<HtmlParserState['beautifyOptions']>) => void;
  /** Updates the HTML minification options, merging with existing options. */
  setMinifyOptions: (options: Partial<HtmlParserState['minifyOptions']>) => void;

  // --- General UI State ---
  /** The currently active tab in the main interface. */
  activeTab: 'input' | 'dom-tree' | 'json' | 'preview' | 'extraction' | 'clean';
  /** Sets the active tab. */
  setActiveTab: (tab: HtmlParserState['activeTab']) => void;

  // --- Global Loading State ---
  /** Indicates if a global operation (e.g., parsing, fetching) is currently in progress. */
  isLoading: boolean;
  /** Sets the global loading state. */
  setIsLoading: (loading: boolean) => void;
}

/**
 * Zustand store for managing the state of the HTML parsing tool.
 */
export const useHtmlParserStore = create<HtmlParserState>((set) => ({
  // --- Initial State: Raw HTML Input ---
  rawHtmlInput: '',
  setRawHtmlInput: (html) => set({ rawHtmlInput: html }),

  // --- Initial State: HTML File Upload ---
  uploadedFileName: null,
  uploadedFileContent: null,
  setUploadedFile: (name, content) =>
    set({
      uploadedFileName: name,
      uploadedFileContent: content,
      rawHtmlInput: content, // Automatically load file content into the editor
    }),
  clearUploadedFile: () => set({ uploadedFileName: null, uploadedFileContent: null }),

  // --- Initial State: DOM Structure Parsing & Visualization ---
  parsedDomTree: null,
  parsingError: null,
  setParsedDomTree: (tree) => set({ parsedDomTree: tree }),
  setParsingError: (error) => set({ parsingError: error, isMalformedHtml: !!error }),

  // --- Initial State: Element Extraction by Selector ---
  selectorInput: '',
  extractionResults: [],
  setSelectorInput: (selector) => set({ selectorInput: selector }),
  setExtractionResults: (results) => set({ extractionResults: results }),
  addExtractionResult: (result) =>
    set((state) => ({ extractionResults: [...state.extractionResults, result] })),
  clearExtractionResults: () => set({ extractionResults: [] }),

  // --- Initial State: HTML Cleaning & Sanitization ---
  cleanHtmlOutput: null,
  isHtmlSanitized: false,
  sanitizationOptions: {
    removeScripts: true,
    removeComments: false,
    allowedTags: null, // Allow all tags by default
    allowedAttributes: null, // Allow all attributes by default
  },
  setCleanHtmlOutput: (html) => set({ cleanHtmlOutput: html }),
  setIsHtmlSanitized: (sanitized) => set({ isHtmlSanitized: sanitized }),
  setSanitizationOptions: (options) =>
    set((state) => ({
      sanitizationOptions: { ...state.sanitizationOptions, ...options },
    })),

  // --- Initial State: HTML to JSON Conversion ---
  jsonOutput: null,
  setJsonOutput: (json) => set({ jsonOutput: json }),

  // --- Initial State: Safe Rendered Preview ---
  previewHtml: null,
  setPreviewHtml: (html) => set({ previewHtml: html }),

  // --- Initial State: Malformed Markup Detection ---
  isMalformedHtml: false, // Will be set by setParsingError
  setIsMalformedHtml: (malformed) => set({ isMalformedHtml: malformed }),

  // --- Initial State: Source Editor Enhancements (Monaco Editor) ---
  editorTheme: 'vs-light',
  editorOptions: {
    minimap: { enabled: true },
    lineNumbers: 'on',
    autoClosingTags: true,
    formatOnType: true,
    matchBrackets: 'always',
  },
  setEditorTheme: (theme) => set({ editorTheme: theme }),
  setEditorOptions: (options) =>
    set((state) => ({
      editorOptions: {
        ...state.editorOptions,
        ...options,
        // Deep merge for nested minimap options
        minimap: options.minimap
          ? { ...state.editorOptions.minimap, ...options.minimap }
          : state.editorOptions.minimap,
      },
    })),

  // --- Initial State: DOM Tree Viewer Features ---
  expandedNodeIds: new Set<string>(),
  toggleNodeExpansion: (nodeId) =>
    set((state) => {
      const newExpandedNodes = new Set(state.expandedNodeIds);
      if (newExpandedNodes.has(nodeId)) {
        newExpandedNodes.delete(nodeId);
      } else {
        newExpandedNodes.add(nodeId);
      }
      return { expandedNodeIds: newExpandedNodes };
    }),
  setExpandedNodeIds: (ids) => set({ expandedNodeIds: ids }),

  // --- Initial State: HTML Beautify/Minify Options ---
  beautifyOptions: {
    indentSize: 2,
    wrapLineLength: 0, // 0 for no line wrapping
    endWithNewline: false,
  },
  minifyOptions: {
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyElements: false,
    removeAttributeQuotes: false,
  },
  setBeautifyOptions: (options) =>
    set((state) => ({
      beautifyOptions: { ...state.beautifyOptions, ...options },
    })),
  setMinifyOptions: (options) =>
    set((state) => ({
      minifyOptions: { ...state.minifyOptions, ...options },
    })),

  // --- Initial State: General UI State ---
  activeTab: 'input',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // --- Initial State: Global Loading State ---
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));