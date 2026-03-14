'use client';

import { create } from 'zustand';
import {
  DOMTreeNode,
  HTMLJSONNode,
  ParsingOptions,
} from '@/lib/types';

// Define placeholder types for external configurations
type MonacoEditorOptions = Record<string, any>;
type MonacoMarker = Record<string, any>;
type PrettierOptions = Record<string, any>;
type DOMPurifyConfig = Record<string, any>;

/**
 * State and actions for the HTML parsing tool.
 */
interface HtmlParserState {
  // 1. HTML Source Editor
  htmlSource: string;
  editorMarkers: MonacoMarker[]; // For syntax errors, etc.
  isFormatting: boolean; // Flag for format-on-demand
  editorOptions: MonacoEditorOptions; // Monaco editor configuration

  // 2. File Upload & Paste HTML Input (handled by htmlSource)

  // 3. Client-Side HTML Parsing
  parsedDocument: Document | null;
  domTree: DOMTreeNode[]; // Structured DOM for tree viewer
  parsingOptions: ParsingOptions;
  isParsing: boolean;

  // 4. Malformed Markup Detection
  parsingErrors: string[];
  hasParsingError: boolean; // Derived from parsingErrors.length

  // 5. Visual DOM Tree Viewer
  expandedNodes: Set<string>; // IDs of expanded nodes
  highlightedNodeId: string | null; // Node currently hovered/highlighted
  selectedNodeId: string | null; // Node currently selected

  // 6. Safe HTML Preview
  previewHtml: string; // Sanitized HTML content for the iframe
  isSanitizing: boolean; // Flag for sanitization process

  // 7. Element Extractor
  selectorInput: string; // CSS selector or XPath
  extractionResults: any[]; // Results of element extraction
  extractionType: 'text' | 'html' | 'attributes' | 'element'; // Type of extraction output

  // 8. HTML Beautifier
  formattedHtml: string;
  isBeautifying: boolean;
  beautifierOptions: PrettierOptions;

  // 9. HTML Minifier
  minifiedHtml: string;
  isMinifying: boolean;

  // 10. HTML to JSON Conversion
  htmlJson: HTMLJSONNode[] | null;
  isConvertingToJson: boolean;

  // 11. HTML Sanitization (already part of preview, but might need dedicated output)
  sanitizedHtmlOutput: string; // Explicit sanitized output
  sanitizationConfig: DOMPurifyConfig; // Configuration for DOMPurify

  // 12. Large HTML Performance Optimizations
  maxDomTreeNodes: number; // Max nodes to render in tree
  domTreeDepthLimit: number; // Max depth to expand automatically
  isVirtualizedTree: boolean; // Enable/disable virtualization
  isWebWorkerParsing: boolean; // Enable/disable Web Worker for parsing

  // 13. Interactive Selector Matching
  currentSelector: string; // Current selector for highlighting
  matchingNodeIds: Set<string>; // IDs of nodes matching the current selector
  selectorMatchCount: number;

  // 14. Accessibility Features (mostly UI implementation, not direct store state)
}

interface HtmlParserActions {
  // HTML Source Editor
  setHtmlSource: (source: string) => void;
  setEditorMarkers: (markers: MonacoMarker[]) => void;
  setIsFormatting: (formatting: boolean) => void;
  setEditorOptions: (options: Partial<MonacoEditorOptions>) => void;

  // Client-Side HTML Parsing
  setParsedDocument: (doc: Document | null) => void;
  setDomTree: (tree: DOMTreeNode[]) => void;
  setParsingOptions: (options: Partial<ParsingOptions>) => void;
  setIsParsing: (parsing: boolean) => void;

  // Malformed Markup Detection
  setParsingErrors: (errors: string[]) => void;

  // Visual DOM Tree Viewer
  toggleNodeExpansion: (nodeId: string) => void;
  expandAllNodes: (allNodeIds: string[]) => void;
  collapseAllNodes: () => void;
  setHighlightedNodeId: (nodeId: string | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;

  // Safe HTML Preview
  setPreviewHtml: (html: string) => void;
  setIsSanitizing: (sanitizing: boolean) => void;

  // Element Extractor
  setSelectorInput: (selector: string) => void;
  setExtractionResults: (results: any[]) => void;
  setExtractionType: (type: 'text' | 'html' | 'attributes' | 'element') => void;

  // HTML Beautifier
  setFormattedHtml: (html: string) => void;
  setIsBeautifying: (beautifying: boolean) => void;
  setBeautifierOptions: (options: Partial<PrettierOptions>) => void;

  // HTML Minifier
  setMinifiedHtml: (html: string) => void;
  setIsMinifying: (minifying: boolean) => void;

  // HTML to JSON Conversion
  setHtmlJson: (json: HTMLJSONNode[] | null) => void;
  setIsConvertingToJson: (converting: boolean) => void;

  // HTML Sanitization
  setSanitizedHtmlOutput: (html: string) => void;
  setSanitizationConfig: (config: Partial<DOMPurifyConfig>) => void;

  // Large HTML Performance Optimizations
  setMaxDomTreeNodes: (count: number) => void;
  setDomTreeDepthLimit: (limit: number) => void;
  setIsVirtualizedTree: (enabled: boolean) => void;
  setIsWebWorkerParsing: (enabled: boolean) => void;

  // Interactive Selector Matching
  setCurrentSelector: (selector: string) => void;
  setMatchingNodeIds: (ids: Set<string>) => void;
  setSelectorMatchCount: (count: number) => void;
}

export const useHtmlParserStore = create<HtmlParserState & HtmlParserActions>((set, get) => ({
  // Initial State
  htmlSource: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Hello World</title>\n  </head>\n  <body>\n    <h1>Welcome!</h1>\n    <p id="first-para" data-info="example">This is a <a href="#">sample</a> HTML document.</p>\n    <!-- A comment -->\n    <script>alert("XSS!");</script>\n    <style>h1 { color: blue; }</style>\n    <div>\n      <span>Nested Span</span>\n    </div>\n  </body>\n</html>',
  editorMarkers: [],
  isFormatting: false,
  editorOptions: {
    minimap: { enabled: false },
    lineNumbers: 'on',
    autoClosingTags: 'always',
    autoIndent: 'full',
    formatOnType: true,
    formatOnPaste: true,
    tabSize: 2,
    wordWrap: 'on',
  },

  parsedDocument: null,
  domTree: [],
  parsingOptions: {
    removeComments: false,
    removeEmptyTextNodes: true,
    removeScripts: false,
    removeStyles: false,
    removeAttributes: [],
  },
  isParsing: false,

  parsingErrors: [],
  hasParsingError: false, // Will be computed in the selector if needed

  expandedNodes: new Set<string>(),
  highlightedNodeId: null,
  selectedNodeId: null,

  previewHtml: '',
  isSanitizing: false,

  selectorInput: '',
  extractionResults: [],
  extractionType: 'element',

  formattedHtml: '',
  isBeautifying: false,
  beautifierOptions: {
    parser: 'html',
    htmlWhitespaceSensitivity: 'css',
    tabWidth: 2,
    useTabs: false,
  },

  minifiedHtml: '',
  isMinifying: false,

  htmlJson: null,
  isConvertingToJson: false,

  sanitizedHtmlOutput: '',
  sanitizationConfig: {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onerror', 'onload', 'onmouseover'],
  },

  maxDomTreeNodes: 5000,
  domTreeDepthLimit: 10,
  isVirtualizedTree: true,
  isWebWorkerParsing: false,

  currentSelector: '',
  matchingNodeIds: new Set<string>(),
  selectorMatchCount: 0,

  // Actions
  setHtmlSource: (source) => set({ htmlSource: source }),
  setEditorMarkers: (markers) => set({ editorMarkers: markers }),
  setIsFormatting: (formatting) => set({ isFormatting: formatting }),
  setEditorOptions: (options) => set((state) => ({ editorOptions: { ...state.editorOptions, ...options } })),

  setParsedDocument: (doc) => set({ parsedDocument: doc }),
  setDomTree: (tree) => set({ domTree: tree }),
  setParsingOptions: (options) => set((state) => ({ parsingOptions: { ...state.parsingOptions, ...options } })),
  setIsParsing: (parsing) => set({ isParsing: parsing }),

  setParsingErrors: (errors) => set({ parsingErrors: errors, hasParsingError: errors.length > 0 }),

  toggleNodeExpansion: (nodeId) =>
    set((state) => {
      const newExpandedNodes = new Set(state.expandedNodes);
      if (newExpandedNodes.has(nodeId)) {
        newExpandedNodes.delete(nodeId);
      } else {
        newExpandedNodes.add(nodeId);
      }
      return { expandedNodes: newExpandedNodes };
    }),
  expandAllNodes: (allNodeIds) => set({ expandedNodes: new Set(allNodeIds) }),
  collapseAllNodes: () => set({ expandedNodes: new Set<string>() }),
  setHighlightedNodeId: (nodeId) => set({ highlightedNodeId: nodeId }),
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),

  setPreviewHtml: (html) => set({ previewHtml: html }),
  setIsSanitizing: (sanitizing) => set({ isSanitizing: sanitizing }),

  setSelectorInput: (selector) => set({ selectorInput: selector }),
  setExtractionResults: (results) => set({ extractionResults: results }),
  setExtractionType: (type) => set({ extractionType: type }),

  setFormattedHtml: (html) => set({ formattedHtml: html }),
  setIsBeautifying: (beautifying) => set({ isBeautifying: beautifying }),
  setBeautifierOptions: (options) => set((state) => ({ beautifierOptions: { ...state.beautifierOptions, ...options } })),

  setMinifiedHtml: (html) => set({ minifiedHtml: html }),
  setIsMinifying: (minifying) => set({ isMinifying: minifying }),

  setHtmlJson: (json) => set({ htmlJson: json }),
  setIsConvertingToJson: (converting) => set({ isConvertingToJson: converting }),

  setSanitizedHtmlOutput: (html) => set({ sanitizedHtmlOutput: html }),
  setSanitizationConfig: (config) => set((state) => ({ sanitizationConfig: { ...state.sanitizationConfig, ...config } })),

  setMaxDomTreeNodes: (count) => set({ maxDomTreeNodes: count }),
  setDomTreeDepthLimit: (limit) => set({ domTreeDepthLimit: limit }),
  setIsVirtualizedTree: (enabled) => set({ isVirtualizedTree: enabled }),
  setIsWebWorkerParsing: (enabled) => set({ isWebWorkerParsing: enabled }),

  setCurrentSelector: (selector) => set({ currentSelector: selector }),
  setMatchingNodeIds: (ids) => set({ matchingNodeIds: ids }),
  setSelectorMatchCount: (count) => set({ selectorMatchCount: count }),
}));