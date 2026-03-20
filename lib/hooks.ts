'use client';

import { useHtmlParserStore } from '@/lib/store';
import { DOMNode, ExtractionResult } from '@/lib/types';

/**
 * Hook for accessing and modifying the raw HTML input and its setter.
 * @returns An object containing `rawHtmlInput` (string) and `setRawHtmlInput` ((html: string) => void).
 */
export const useRawHtmlInput = () => {
  const rawHtmlInput = useHtmlParserStore((state) => state.rawHtmlInput);
  const setRawHtmlInput = useHtmlParserStore((state) => state.setRawHtmlInput);
  return { rawHtmlInput, setRawHtmlInput };
};

/**
 * Hook for managing uploaded HTML file state.
 * @returns An object containing `uploadedFileName` (string | null), `uploadedFileContent` (string | null),
 *          `setUploadedFile` ((name: string, content: string) => void), and `clearUploadedFile` (() => void).
 */
export const useUploadedFile = () => {
  const uploadedFileName = useHtmlParserStore((state) => state.uploadedFileName);
  const uploadedFileContent = useHtmlParserStore((state) => state.uploadedFileContent);
  const setUploadedFile = useHtmlParserStore((state) => state.setUploadedFile);
  const clearUploadedFile = useHtmlParserStore((state) => state.clearUploadedFile);
  return { uploadedFileName, uploadedFileContent, setUploadedFile, clearUploadedFile };
};

/**
 * Hook for accessing and modifying the parsed DOM tree and any parsing errors.
 * @returns An object containing `parsedDomTree` (DOMNode[] | null), `parsingError` (string | null),
 *          `setParsedDomTree` ((tree: DOMNode[] | null) => void), and `setParsingError` ((error: string | null) => void).
 */
export const useParsedDomTree = () => {
  const parsedDomTree = useHtmlParserStore((state) => state.parsedDomTree);
  const parsingError = useHtmlParserStore((state) => state.parsingError);
  const setParsedDomTree = useHtmlParserStore((state) => state.setParsedDomTree);
  const setParsingError = useHtmlParserStore((state) => state.setParsingError);
  return { parsedDomTree, parsingError, setParsedDomTree, setParsingError };
};

/**
 * Hook for managing CSS selector input and extraction results.
 * @returns An object containing `selectorInput` (string), `extractionResults` (ExtractionResult[]),
 *          `setSelectorInput` ((selector: string) => void), `setExtractionResults` ((results: ExtractionResult[]) => void),
 *          `addExtractionResult` ((result: ExtractionResult) => void), and `clearExtractionResults` (() => void).
 */
export const useSelectorExtraction = () => {
  const selectorInput = useHtmlParserStore((state) => state.selectorInput);
  const extractionResults = useHtmlParserStore((state) => state.extractionResults);
  const setSelectorInput = useHtmlParserStore((state) => state.setSelectorInput);
  const setExtractionResults = useHtmlParserStore((state) => state.setExtractionResults);
  const addExtractionResult = useHtmlParserStore((state) => state.addExtractionResult);
  const clearExtractionResults = useHtmlParserStore((state) => state.clearExtractionResults);
  return {
    selectorInput,
    extractionResults,
    setSelectorInput,
    setExtractionResults,
    addExtractionResult,
    clearExtractionResults,
  };
};

/**
 * Hook for accessing the cleaned HTML output and its sanitization status.
 * Note: Setters for these values are assumed to be handled by internal logic,
 * so only the read-only state is exposed here based on the provided context.
 * @returns An object containing `cleanHtmlOutput` (string | null) and `isHtmlSanitized` (boolean).
 */
export const useCleanHtmlOutput = () => {
  const cleanHtmlOutput = useHtmlParserStore((state) => state.cleanHtmlOutput);
  const isHtmlSanitized = useHtmlParserStore((state) => state.isHtmlSanitized);
  return { cleanHtmlOutput, isHtmlSanitized };
};