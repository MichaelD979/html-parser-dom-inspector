import { create } from 'zustand';
import {
  DOMTreeNode,
  ExtractionRule,
  ExtractedElement,
  CleaningRule,
} from '@/lib/types';

/**
 * Defines the state and actions for the HTML parsing tool.
 */
interface HtmlParserState {
  // 1. HTML Input (Paste & Upload)
  htmlInput: string;
  setHtmlInput: (html: string) => void;

  // 2. DOM Tree Visualization
  domTree: DOMTreeNode[] | null;
  expandedNodes: Set<string>; // Stores IDs of currently expanded nodes in the tree
  highlightedNodeId: string | null; // ID of the node currently highlighted in the DOM tree view
  parsingError: string | null; // Stores any error message from HTML parsing
  setDomTree: (tree: DOMTreeNode[] | null) => void;
  toggleNodeExpansion: (nodeId: string) => void;
  expandAllNodes: (allNodeIds: string[]) => void; // Expands all nodes given their IDs
  collapseAllNodes: () => void;
  setHighlightedNodeId: (nodeId: string | null) => void;
  setParsingError: (error: string | null) => void;

  // 3. Safe HTML Preview
  safeHtmlPreview: string; // Sanitized HTML content for secure preview
  setSafeHtmlPreview: (html: string) => void;

  // 4. HTML Element Extraction
  extractionRules: ExtractionRule[]; // User-defined rules for data extraction
  extractedData: ExtractedElement[]; // Results of the extraction
  extractionLoading: boolean; // Indicates if extraction is currently in progress
  addExtractionRule: (rule: Omit<ExtractionRule, 'id'>) => void;
  updateExtractionRule: (id: string, rule: Partial<ExtractionRule>) => void;
  removeExtractionRule: (id: string) => void;
  setExtractedData: (data: ExtractedElement[]) => void;
  setExtractionLoading: (loading: boolean) => void;

  // 5. HTML Cleaning & Sanitization
  cleaningRules: CleaningRule[]; // User-defined rules for cleaning
  sanitizedHtml: string; // HTML content after applying cleaning rules
  sanitizeOptions: Record<string, any>; // Configuration options for HTML sanitization (e.g., DOMPurify)
  addCleaningRule: (rule: Omit<CleaningRule, 'id'>) => void;
  updateCleaningRule: (id: string, rule: Partial<CleaningRule>) => void;
  removeCleaningRule: (id: string) => void;
  setSanitizedHtml: (html: string) => void;
  setSanitizeOption: (key: string, value: any) => void; // Updates a specific sanitization option

  // 6. HTML to JSON Conversion
  jsonOutput: string | null; // JSON string representation of the parsed DOM tree
  setJsonOutput: (json: string | null) => void;

  // 7. Monaco Source Editor
  editorTheme: 'vs-dark' | 'vs-light';
  editorFontSize: number;
  editorLineNumbers: 'on' | 'off';
  editorWordWrap: 'on' | 'off';
  setEditorTheme: (theme: 'vs-dark' | 'vs-light') => void;
  setEditorFontSize: (size: number) => void;
  setEditorLineNumbers: (setting: 'on' | 'off') => void;
  setEditorWordWrap: (setting: 'on' | 'off') => void;

  // 8. HTML Beautify & Minify
  formattedHtml: string; // The HTML content after beautification or minification
  isBeautifying: boolean; // Indicates if beautification is in progress
  isMinifying: boolean; // Indicates if minification is in progress
  setFormattedHtml: (html: string) => void;
  setIsBeautifying: (status: boolean) => void;
  setIsMinifying: (status: boolean) => void;

  // 9. Malformed Markup Detection
  isMalformedHtml: boolean; // True if the HTML input is malformed
  malformedErrorDetails: string | null; // Details about the malformed HTML
  setIsMalformedHtml: (isMalformed: boolean) => void;
  setMalformedErrorDetails: (details: string | null) => void;

  // 10. DOM-Preview Hover Highlight
  hoveredNodeId: string | null; // ID of the node currently hovered (e.g., in tree or preview)
  setHoveredNodeId: (nodeId: string | null) => void;

  // 11. Large HTML Performance Optimization
  domTreeRenderLimit: number; // Max number of nodes to render in the DOM tree view for performance
  isParsingInWorker: boolean; // Flag indicating if HTML parsing is done in a Web Worker
  isParsingLoading: boolean; // Flag indicating if parsing is currently active
  setDomTreeRenderLimit: (limit: number) => void;
  setIsParsingInWorker: (inWorker: boolean) => void;
  setIsParsingLoading: (loading: boolean) => void;

  // 12. Accessibility Support
  enableKeyboardNavigation: boolean; // Toggles keyboard navigation for interactive elements
  setEnableKeyboardNavigation: (enabled: boolean) => void;

  // General UI State
  activeTab: 'editor' | 'dom-tree' | 'preview' | 'extract' | 'clean' | 'json' | 'settings'; // Currently active main tab
  setActiveTab: (tab: HtmlParserState['activeTab']) => void;
}

export const useHtmlParserStore = create<HtmlParserState>((set, get) => ({
  // 1. HTML Input
  htmlInput: '',
  setHtmlInput: (html) => set({ htmlInput: html }),

  // 2. DOM Tree Visualization
  domTree: null,
  expandedNodes: new Set<string>(),
  highlightedNodeId: null,
  parsingError: null,
  setDomTree: (tree) => set({ domTree: tree }),
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
  expandAllNodes: (allNodeIds: string[]) =>
    set({ expandedNodes: new Set(allNodeIds) }),
  collapseAllNodes: () => set({ expandedNodes: new Set<string>() }),
  setHighlightedNodeId: (nodeId) => set({ highlightedNodeId: nodeId }),
  setParsingError: (error) => set({ parsingError: error }),

  // 3. Safe HTML Preview
  safeHtmlPreview: '',
  setSafeHtmlPreview: (html) => set({ safeHtmlPreview: html }),

  // 4. HTML Element Extraction
  extractionRules: [],
  extractedData: [],
  extractionLoading: false,
  addExtractionRule: (rule) =>
    set((state) => ({
      extractionRules: [...state.extractionRules, { ...rule, id: crypto.randomUUID() }],
    })),
  updateExtractionRule: (id, rule) =>
    set((state) => ({
      extractionRules: state.extractionRules.map((r) =>
        r.id === id ? { ...r, ...rule } : r
      ),
    })),
  removeExtractionRule: (id) =>
    set((state) => ({
      extractionRules: state.extractionRules.filter((r) => r.id !== id),
    })),
  setExtractedData: (data) => set({ extractedData: data }),
  setExtractionLoading: (loading) => set({ extractionLoading: loading }),

  // 5. HTML Cleaning & Sanitization
  cleaningRules: [],
  sanitizedHtml: '',
  // Default sensible sanitization options, often aligned with DOMPurify defaults
  sanitizeOptions: {
    USE_PROFILES: { html: true }, // Enables basic HTML sanitization profile
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onmouseover', 'onclick', 'onblur', 'onfocus', 'style', 'srcdoc', 'sandbox'],
    ALLOW_DATA_ATTR: true, // Allow data- attributes by default
  },
  addCleaningRule: (rule) =>
    set((state) => ({
      cleaningRules: [...state.cleaningRules, { ...rule, id: crypto.randomUUID() }],
    })),
  updateCleaningRule: (id, rule) =>
    set((state) => ({
      cleaningRules: state.cleaningRules.map((r) =>
        r.id === id ? { ...r, ...rule } : r
      ),
    })),
  removeCleaningRule: (id) =>
    set((state) => ({
      cleaningRules: state.cleaningRules.filter((r) => r.id !== id),
    })),
  setSanitizedHtml: (html) => set({ sanitizedHtml: html }),
  setSanitizeOption: (key, value) =>
    set((state) => ({
      sanitizeOptions: {
        ...state.sanitizeOptions,
        [key]: value,
      },
    })),

  // 6. HTML to JSON Conversion
  jsonOutput: null,
  setJsonOutput: (json) => set({ jsonOutput: json }),

  // 7. Monaco Source Editor
  editorTheme: 'vs-dark',
  editorFontSize: 14,
  editorLineNumbers: 'on',
  editorWordWrap: 'off',
  setEditorTheme: (theme) => set({ editorTheme: theme }),
  setEditorFontSize: (size) => set({ editorFontSize: size }),
  setEditorLineNumbers: (setting) => set({ editorLineNumbers: setting }),
  setEditorWordWrap: (setting) => set({ editorWordWrap: setting }),

  // 8. HTML Beautify & Minify
  formattedHtml: '',
  isBeautifying: false,
  isMinifying: false,
  setFormattedHtml: (html) => set({ formattedHtml: html }),
  setIsBeautifying: (status) => set({ isBeautifying: status }),
  setIsMinifying: (status) => set({ isMinifying: status }),

  // 9. Malformed Markup Detection
  isMalformedHtml: false,
  malformedErrorDetails: null,
  setIsMalformedHtml: (isMalformed) => set({ isMalformedHtml: isMalformed }),
  setMalformedErrorDetails: (details) => set({ malformedErrorDetails: details }),

  // 10. DOM-Preview Hover Highlight
  hoveredNodeId: null,
  setHoveredNodeId: (nodeId) => set({ hoveredNodeId: nodeId }),

  // 11. Large HTML Performance Optimization
  domTreeRenderLimit: 500, // Default limit for nodes rendered in the tree view
  isParsingInWorker: false, // Default: parsing not in worker initially
  isParsingLoading: false,
  setDomTreeRenderLimit: (limit) => set({ domTreeRenderLimit: limit }),
  setIsParsingInWorker: (inWorker) => set({ isParsingInWorker: inWorker }),
  setIsParsingLoading: (loading) => set({ isParsingLoading: loading }),

  // 12. Accessibility Support
  enableKeyboardNavigation: true, // Keyboard navigation enabled by default
  setEnableKeyboardNavigation: (enabled) => set({ enableKeyboardNavigation: enabled }),

  // General UI State
  activeTab: 'editor', // Default active tab
  setActiveTab: (tab) => set({ activeTab: tab }),
}));