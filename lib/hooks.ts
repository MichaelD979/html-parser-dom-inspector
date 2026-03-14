'use client';

import { useCallback } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode, HTMLJSONNode, ParsingOptions } from '@/lib/types';

// Infer types from the store to avoid re-declaring them
type HtmlParserState = ReturnType<typeof useHtmlParserStore>;
type MonacoMarker = HtmlParserState['editorMarkers'][number]; // Assuming MonacoMarker is the type of an item in editorMarkers
type MonacoEditorOptions = HtmlParserState['editorOptions'];
type PrettierOptions = HtmlParserState['beautifierOptions'];
type DOMPurifyConfig = HtmlParserState['sanitizationConfig'];
type ExtractionType = HtmlParserState['extractionType'];

/**
 * Hook to access the HTML source code from the store.
 * @returns The current HTML source string.
 */
export const useHtmlSource = (): string =>
  useHtmlParserStore(useCallback((state) => state.htmlSource, []));

/**
 * Hook to access the Monaco Editor markers (e.g., for syntax errors).
 * @returns An array of MonacoMarker objects.
 */
export const useEditorMarkers = (): MonacoMarker[] =>
  useHtmlParserStore(useCallback((state) => state.editorMarkers, []));

/**
 * Hook to check if HTML formatting is currently in progress.
 * @returns A boolean indicating if formatting is active.
 */
export const useIsFormatting = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isFormatting, []));

/**
 * Hook to access Monaco Editor specific options.
 * @returns An object containing Monaco editor options.
 */
export const useEditorOptions = (): MonacoEditorOptions =>
  useHtmlParserStore(useCallback((state) => state.editorOptions, []));

/**
 * Hook to access the parsed DOM Document object.
 * @returns The parsed Document or null if not parsed.
 */
export const useParsedDocument = (): Document | null =>
  useHtmlParserStore(useCallback((state) => state.parsedDocument, []));

/**
 * Hook to access the structured DOM tree for visualization.
 * @returns An array of DOMTreeNode objects representing the DOM structure.
 */
export const useDomTree = (): DOMTreeNode[] =>
  useHtmlParserStore(useCallback((state) => state.domTree, []));

/**
 * Hook to access the current HTML parsing options.
 * @returns An object containing the current ParsingOptions.
 */
export const useParsingOptions = (): ParsingOptions =>
  useHtmlParserStore(useCallback((state) => state.parsingOptions, []));

/**
 * Hook to check if HTML parsing is currently in progress.
 * @returns A boolean indicating if parsing is active.
 */
export const useIsParsing = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isParsing, []));

/**
 * Hook to access any parsing errors detected.
 * @returns An array of strings describing parsing errors.
 */
export const useParsingErrors = (): string[] =>
  useHtmlParserStore(useCallback((state) => state.parsingErrors, []));

/**
 * Hook to quickly check if there are any parsing errors.
 * @returns A boolean indicating if parsing errors exist.
 */
export const useHasParsingError = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.hasParsingError, []));

/**
 * Hook to access the set of IDs for currently expanded nodes in the DOM tree viewer.
 * @returns A Set of string IDs for expanded nodes.
 */
export const useExpandedNodes = (): Set<string> =>
  useHtmlParserStore(useCallback((state) => state.expandedNodes, []));

/**
 * Hook to access the ID of the currently highlighted node in the DOM tree viewer.
 * @returns The ID of the highlighted node or null.
 */
export const useHighlightedNodeId = (): string | null =>
  useHtmlParserStore(useCallback((state) => state.highlightedNodeId, []));

/**
 * Hook to access the ID of the currently selected node in the DOM tree viewer.
 * @returns The ID of the selected node or null.
 */
export const useSelectedNodeId = (): string | null =>
  useHtmlParserStore(useCallback((state) => state.selectedNodeId, []));

/**
 * Hook to access the sanitized HTML content prepared for the iframe preview.
 * @returns The sanitized HTML string.
 */
export const usePreviewHtml = (): string =>
  useHtmlParserStore(useCallback((state) => state.previewHtml, []));

/**
 * Hook to check if HTML sanitization is currently in progress.
 * @returns A boolean indicating if sanitization is active.
 */
export const useIsSanitizing = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isSanitizing, []));

/**
 * Hook to access the CSS selector or XPath input string for element extraction.
 * @returns The selector input string.
 */
export const useSelectorInput = (): string =>
  useHtmlParserStore(useCallback((state) => state.selectorInput, []));

/**
 * Hook to access the results of element extraction.
 * @returns An array of extraction results (type depends on extractionType).
 */
export const useExtractionResults = (): any[] =>
  useHtmlParserStore(useCallback((state) => state.extractionResults, []));

/**
 * Hook to access the currently selected type of extraction output.
 * @returns The extraction type ('text' | 'html' | 'attributes' | 'element').
 */
export const useExtractionType = (): ExtractionType =>
  useHtmlParserStore(useCallback((state) => state.extractionType, []));

/**
 * Hook to access the beautified HTML string.
 * @returns The formatted HTML string.
 */
export const useFormattedHtml = (): string =>
  useHtmlParserStore(useCallback((state) => state.formattedHtml, []));

/**
 * Hook to check if HTML beautification is currently in progress.
 * @returns A boolean indicating if beautification is active.
 */
export const useIsBeautifying = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isBeautifying, []));

/**
 * Hook to access the Prettier options for HTML beautification.
 * @returns An object containing Prettier options.
 */
export const useBeautifierOptions = (): PrettierOptions =>
  useHtmlParserStore(useCallback((state) => state.beautifierOptions, []));

/**
 * Hook to access the minified HTML string.
 * @returns The minified HTML string.
 */
export const useMinifiedHtml = (): string =>
  useHtmlParserStore(useCallback((state) => state.minifiedHtml, []));

/**
 * Hook to check if HTML minification is currently in progress.
 * @returns A boolean indicating if minification is active.
 */
export const useIsMinifying = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isMinifying, []));

/**
 * Hook to access the HTML converted to a JSON structure.
 * @returns An array of HTMLJSONNode objects or null.
 */
export const useHtmlJson = (): HTMLJSONNode[] | null =>
  useHtmlParserStore(useCallback((state) => state.htmlJson, []));

/**
 * Hook to check if HTML to JSON conversion is currently in progress.
 * @returns A boolean indicating if conversion is active.
 */
export const useIsConvertingToJson = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isConvertingToJson, []));

/**
 * Hook to access the explicit sanitized HTML output.
 * @returns The sanitized HTML string for output.
 */
export const useSanitizedHtmlOutput = (): string =>
  useHtmlParserStore(useCallback((state) => state.sanitizedHtmlOutput, []));

/**
 * Hook to access the DOMPurify configuration for HTML sanitization.
 * @returns An object containing DOMPurify configuration.
 */
export const useSanitizationConfig = (): DOMPurifyConfig =>
  useHtmlParserStore(useCallback((state) => state.sanitizationConfig, []));

/**
 * Hook to access the maximum number of DOM tree nodes to render.
 * @returns The maximum number of DOM tree nodes.
 */
export const useMaxDomTreeNodes = (): number =>
  useHtmlParserStore(useCallback((state) => state.maxDomTreeNodes, []));

/**
 * Hook to access the maximum depth to automatically expand in the DOM tree.
 * @returns The maximum DOM tree depth limit.
 */
export const useDomTreeDepthLimit = (): number =>
  useHtmlParserStore(useCallback((state) => state.domTreeDepthLimit, []));

/**
 * Hook to check if tree virtualization is enabled for the DOM tree viewer.
 * @returns A boolean indicating if tree virtualization is enabled.
 */
export const useIsVirtualizedTree = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isVirtualizedTree, []));

/**
 * Hook to check if Web Worker parsing is enabled.
 * @returns A boolean indicating if Web Worker parsing is enabled.
 */
export const useIsWebWorkerParsing = (): boolean =>
  useHtmlParserStore(useCallback((state) => state.isWebWorkerParsing, []));

// If actions were needed, a hook like this could be provided:
/**
 * Hook to access all actions of the HTML parser store.
 * NOTE: This returns a new object on every render if not carefully memoized,
 * which can cause re-renders in consuming components. It's often better to
 * select individual actions, or group related actions.
 * For example:
 * `export const useHtmlSourceActions = () => useHtmlParserStore((state) => ({ setHtmlSource: state.setHtmlSource }));`
 */
/*
export const useHtmlParserActions = () => {
  return useHtmlParserStore(
    useCallback((state) => ({
      setHtmlSource: state.setHtmlSource,
      setIsParsing: state.setIsParsing,
      // ... and all other actions
    }), [])
  );
};
*/