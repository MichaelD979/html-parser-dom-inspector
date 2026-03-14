'use client';

import { useHtmlParserStore } from '@/lib/store';
import {
  DOMTreeNode,
  ExtractionRule,
  ExtractedElement,
  CleaningRule,
  ExtractionAttribute,
} from '@/lib/types';

/**
 * Hook for accessing and manipulating the HTML input state.
 */
export const useHtmlInput = () => {
  const htmlInput = useHtmlParserStore((state) => state.htmlInput);
  const setHtmlInput = useHtmlParserStore((state) => state.setHtmlInput);
  return { htmlInput, setHtmlInput };
};

/**
 * Hook for accessing DOM tree visualization data.
 */
export const useDomTreeData = () => {
  const domTree = useHtmlParserStore((state) => state.domTree);
  const expandedNodes = useHtmlParserStore((state) => state.expandedNodes);
  const highlightedNodeId = useHtmlParserStore(
    (state) => state.highlightedNodeId,
  );
  const parsingError = useHtmlParserStore((state) => state.parsingError);
  return { domTree, expandedNodes, highlightedNodeId, parsingError };
};

/**
 * Hook for accessing DOM tree visualization actions.
 */
export const useDomTreeActions = () => {
  const setDomTree = useHtmlParserStore((state) => state.setDomTree);
  const toggleNodeExpansion = useHtmlParserStore(
    (state) => state.toggleNodeExpansion,
  );
  const expandAllNodes = useHtmlParserStore((state) => state.expandAllNodes);
  const collapseAllNodes = useHtmlParserStore(
    (state) => state.collapseAllNodes,
  );
  const setHighlightedNodeId = useHtmlParserStore(
    (state) => state.setHighlightedNodeId,
  );
  const setParsingError = useHtmlParserStore((state) => state.setParsingError);

  return {
    setDomTree,
    toggleNodeExpansion,
    expandAllNodes,
    collapseAllNodes,
    setHighlightedNodeId,
    setParsingError,
  };
};

/**
 * Hook for accessing and manipulating the safe HTML preview state.
 */
export const useSafeHtmlPreview = () => {
  const safeHtmlPreview = useHtmlParserStore(
    (state) => state.safeHtmlPreview,
  );
  const setSafeHtmlPreview = useHtmlParserStore(
    (state) => state.setSafeHtmlPreview,
  );
  return { safeHtmlPreview, setSafeHtmlPreview };
};

/**
 * Hook for accessing the extraction rules.
 */
export const useExtractionRules = () => {
  const extractionRules = useHtmlParserStore((state) => state.extractionRules);
  return { extractionRules };
};

/**
 * Hook for accessing extraction rule actions.
 */
export const useExtractionRuleActions = () => {
  const addExtractionRule = useHtmlParserStore(
    (state) => state.addExtractionRule,
  );
  const updateExtractionRule = useHtmlParserStore(
    (state) => state.updateExtractionRule,
  );
  const removeExtractionRule = useHtmlParserStore(
    (state) => state.removeExtractionRule,
  );
  return { addExtractionRule, updateExtractionRule, removeExtractionRule };
};

/**
 * Hook for accessing extracted data and loading state.
 */
export const useExtractedData = () => {
  const extractedData = useHtmlParserStore((state) => state.extractedData);
  const extractionLoading = useHtmlParserStore(
    (state) => state.extractionLoading,
  );
  const setExtractedData = useHtmlParserStore(
    (state) => state.setExtractedData,
  );
  const setExtractionLoading = useHtmlParserStore(
    (state) => state.setExtractionLoading,
  );
  return {
    extractedData,
    extractionLoading,
    setExtractedData,
    setExtractionLoading,
  };
};

/**
 * Hook for accessing the cleaning rules.
 */
export const useCleaningRules = () => {
  const cleaningRules = useHtmlParserStore((state) => state.cleaningRules);
  return { cleaningRules };
};

/**
 * Hook for accessing cleaning rule actions.
 */
export const useCleaningRuleActions = () => {
  const addCleaningRule = useHtmlParserStore((state) => state.addCleaningRule);
  const updateCleaningRule = useHtmlParserStore(
    (state) => state.updateCleaningRule,
  );
  const removeCleaningRule = useHtmlParserStore(
    (state) => state.removeCleaningRule,
  );
  return { addCleaningRule, updateCleaningRule, removeCleaningRule };
};

/**
 * Hook for accessing and manipulating the sanitized HTML state.
 */
export const useSanitizedHtml = () => {
  const sanitizedHtml = useHtmlParserStore((state) => state.sanitizedHtml);
  const setSanitizedHtml = useHtmlParserStore(
    (state) => state.setSanitizedHtml,
  );
  return { sanitizedHtml, setSanitizedHtml };
};

/**
 * Hook for accessing and manipulating sanitization options.
 */
export const useSanitizeOptions = () => {
  const sanitizeOptions = useHtmlParserStore((state) => state.sanitizeOptions);
  const setSanitizeOption = useHtmlParserStore(
    (state) => state.setSanitizeOption,
  );
  return { sanitizeOptions, setSanitizeOption };
};

/**
 * Hook for accessing and manipulating the JSON output state.
 */
export const useJsonOutput = () => {
  const jsonOutput = useHtmlParserStore((state) => state.jsonOutput);
  const setJsonOutput = useHtmlParserStore((state) => state.setJsonOutput);
  return { jsonOutput, setJsonOutput };
};

/**
 * Hook for accessing the editor theme.
 */
export const useEditorTheme = () => {
  const editorTheme = useHtmlParserStore((state) => state.editorTheme);
  return { editorTheme };
};<ctrl63>