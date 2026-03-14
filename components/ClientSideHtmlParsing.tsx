'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import * as prettier from 'prettier/standalone';
import * as parserHtml from 'prettier/parser-html';
import DOMPurify from 'dompurify';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCcw, Upload, FileUp, XCircle, CheckCircle, Code, ScanText } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { DOMTreeNode } from '@/lib/types'; // Assuming this is defined as per context

// Helper function to convert a DOM node to a DOMTreeNode interface
// This is a simplified version and might need refinement for full fidelity
// with path, offset, etc.
const domNodeToTreeNode = (
  node: Node,
  idCounter: { value: number },
  depth: number = 0,
  pathAccumulator: string = '',
  maxDepth: number = 5 // Limit initial recursion depth for performance
): DOMTreeNode | null => {
  if (!node || depth > maxDepth) {
    return null;
  }

  const id = `node-${idCounter.value++}`;
  let type: DOMTreeNode['type'];
  let name: string;
  let value: string | undefined;
  let attributes: Record<string, string> | undefined;
  let newPathSegment: string = '';

  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      const element = node as HTMLElement;
      type = 'element';
      name = element.tagName.toLowerCase();
      attributes = {};
      if (element.attributes) {
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          attributes[attr.name] = attr.value;
        }
      }
      // Simple path segment: tag name, or tag#id. If multiple of same tag, add :nth-child
      newPathSegment = name;
      if (element.id) newPathSegment += `#${element.id}`;
      // Note: nth-child calculation requires iterating siblings, which is complex for a simple helper.
      // We'll skip it for this initial version for simplicity.
      break;
    case Node.TEXT_NODE:
      const textNode = node as Text;
      if (!textNode.textContent?.trim()) return null; // Skip empty text nodes
      type = 'text';
      name = '#text';
      value = textNode.textContent || undefined;
      newPathSegment = name;
      break;
    case Node.COMMENT_NODE:
      const commentNode = node as Comment;
      type = 'comment';
      name = '#comment';
      value = commentNode.textContent || undefined;
      newPathSegment = name;
      break;
    case Node.DOCUMENT_NODE:
      type = 'document';
      name = '#document';
      newPathSegment = name;
      break;
    case Node.DOCUMENT_TYPE_NODE:
      const doctypeNode = node as DocumentType;
      type = 'doctype';
      name = `#doctype (${doctypeNode.name})`;
      value = doctypeNode.publicId || doctypeNode.systemId || undefined;
      newPathSegment = name;
      break;
    default:
      return null; // Ignore other node types for now
  }

  const currentPath = pathAccumulator ? `${pathAccumulator} > ${newPathSegment}` : newPathSegment;

  const treeNode: DOMTreeNode = {
    id,
    type,
    name,
    value,
    attributes,
    path: currentPath,
  };

  const children: DOMTreeNode[] = [];
  node.childNodes.forEach((childNode) => {
    const childTreeNode = domNodeToTreeNode(childNode, idCounter, depth + 1, currentPath, maxDepth);
    if (childTreeNode) {
      children.push(childTreeNode);
    }
  });

  if (children.length > 0) {
    treeNode.children = children;
  }

  return treeNode;
};

// Converts a Document object into an array of DOMTreeNode
const documentToTreeNodes = (doc: Document): DOMTreeNode[] => {
  const rootNodes: DOMTreeNode[] = [];
  const idCounter = { value: 0 };
  doc.childNodes.forEach((node) => {
    const treeNode = domNodeToTreeNode(node, idCounter);
    if (treeNode) {
      rootNodes.push(treeNode);
    }
  });
  return rootNodes;
};


export const ClientSideHtmlParsing = () => {
  const editorRef = useRef<any>(null); // Monaco editor instance
  const monacoRef = useRef<Monaco | null>(null); // Monaco object itself

  const {
    htmlSource,
    setHtmlSource,
    parsedDocument,
    setParsedDocument,
    domTree,
    setDomTree,
    parsingErrors,
    setParsingErrors,
    hasParsingError,
    setHasParsingError,
    editorMarkers,
    setEditorMarkers,
    isFormatting,
    setIsFormatting,
    editorOptions,
    isSanitizing,
    setIsSanitizing,
    sanitizationConfig,
    setSanitizedHtmlOutput,
    setPreviewHtml,
  } = useHtmlParserStore();

  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Optional: Auto-format on mount if htmlSource is already present and not empty
    if (htmlSource && !isFormatting) {
      // Delay to ensure editor is fully ready
      setTimeout(() => {
        editor.getAction('editor.action.formatDocument')?.run();
      }, 500);
    }
  }, [htmlSource, isFormatting]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setHtmlSource(value || '');
  }, [setHtmlSource]);

  const parseHtml = useCallback((htmlString: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const errors: string[] = [];
    const parserErrorElement = doc.querySelector('parsererror');

    if (parserErrorElement) {
      // Extract error message from the parsererror element
      // It often contains a preformatted error message
      const errorMessage = parserErrorElement.textContent || parserErrorElement.innerHTML;
      errors.push(`Malformed HTML detected: ${errorMessage.trim()}`);

      // Also set Monaco markers for the editor
      if (monacoRef.current && editorRef.current) {
        // This is a simplified marker creation. A real implementation would parse the error
        // to get line/column numbers. For now, a generic marker.
        const model = editorRef.current.getModel();
        const newMarkers = [{
          startLineNumber: 1, // Placeholder
          endLineNumber: model.getLineCount(), // Placeholder
          startColumn: 1, // Placeholder
          endColumn: model.getLineMaxColumn(model.getLineCount()), // Placeholder
          message: `HTML Parsing Error: ${errorMessage.substring(0, 100)}...`,
          severity: monacoRef.current.MarkerSeverity.Error,
          source: 'DOMParser',
        }];
        monacoRef.current.editor.setModelMarkers(model, 'domParser', newMarkers);
        setEditorMarkers(newMarkers);
      }
    } else {
      if (monacoRef.current && editorRef.current) {
        monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'domParser', []);
        setEditorMarkers([]);
      }
    }

    setParsedDocument(doc);
    setParsingErrors(errors);
    setHasParsingError(errors.length > 0);

    // Convert Document to DOMTreeNode for the viewer
    const tree = documentToTreeNodes(doc);
    setDomTree(tree);

  }, [setParsedDocument, setParsingErrors, setHasParsingError, setEditorMarkers, setDomTree]);

  // Effect to re-parse HTML when source changes
  useEffect(() => {
    // Only parse if htmlSource is not null or undefined
    if (htmlSource !== null) {
      parseHtml(htmlSource);
    }
  }, [htmlSource, parseHtml]);

  // Effect to sanitize HTML for preview whenever parsedDocument or source changes
  useEffect(() => {
    setIsSanitizing(true);
    let sanitizedHtml = '';
    try {
      if (parsedDocument) {
        // Use parsedDocument for sanitization if available and valid
        // DOMPurify needs a string, so we'll re-serialize the body (or whole doc)
        sanitizedHtml = DOMPurify.sanitize(parsedDocument.body.outerHTML, sanitizationConfig);
      } else if (htmlSource) {
        // Fallback to raw htmlSource if parsing failed or hasn't happened yet
        sanitizedHtml = DOMPurify.sanitize(htmlSource, sanitizationConfig);
      }
    } catch (error) {
      console.error('DOMPurify sanitization failed:', error);
      sanitizedHtml = `<p class="text-red-500">Sanitization failed: ${(error as Error).message}</p>`;
    } finally {
      setSanitizedHtmlOutput(sanitizedHtml);
      setPreviewHtml(sanitizedHtml); // Update preview HTML
      setIsSanitizing(false);
    }
  }, [parsedDocument, htmlSource, sanitizationConfig, setIsSanitizing, setSanitizedHtmlOutput, setPreviewHtml]);


  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlSource(content);
      };
      reader.readAsText(file);
      // Clear the input value so the same file can be uploaded again
      event.target.value = '';
    }
  }, [setHtmlSource]);

  const handleFormatCode = useCallback(async () => {
    if (!editorRef.current || !htmlSource) return;

    setIsFormatting(true);
    try {
      const formatted = await prettier.format(htmlSource, {
        parser: 'html',
        plugins: [parserHtml],
        htmlWhitespaceSensitivity: 'css',
        tabWidth: 2,
        printWidth: 80,
        // Add other prettier options from store if they were exposed
      });
      setHtmlSource(formatted);
      editorRef.current.setValue(formatted); // Update editor directly
    } catch (error) {
      console.error('Error formatting HTML:', error);
      // Optionally display an error message to the user
    } finally {
      setIsFormatting(false);
    }
  }, [htmlSource, setHtmlSource, setIsFormatting]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ScanText className="h-6 w-6 text-brand-500" />
          <span>HTML Source & Client-Side Parsing</span>
          {hasParsingError ? (
            <Badge variant="error" dot>Malformed</Badge>
          ) : parsedDocument ? (
            <Badge variant="success" dot>Parsed OK</Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-grow">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
          <div className="flex-grow">
            <Label htmlFor="html-input-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Upload HTML File
            </Label>
            <Input
              id="html-input-file"
              type="file"
              accept=".html, .htm, text/html"
              onChange={handleFileUpload}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-brand-50 file:text-brand-700
              hover:file:bg-brand-100 dark:file:bg-brand-900 dark:file:text-brand-300 dark:hover:file:bg-brand-800"
            />
          </div>
          <Button onClick={handleFormatCode} disabled={isFormatting || !htmlSource} className="w-full md:w-auto">
            {isFormatting ? (
              <>
                <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Formatting...
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" /> Format HTML
              </>
            )}
          </Button>
        </div>

        <Separator label="HTML Editor" />

        <div className="flex-grow min-h-[300px] border rounded-md overflow-hidden shadow-sm dark:border-gray-700">
          <Editor
            height="100%"
            language="html"
            theme="vs-dark"
            value={htmlSource}
            options={{
              ...editorOptions,
              wordWrap: 'on',
              minimap: { enabled: false },
              fontSize: 14,
            }}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            // Markers are managed by `setEditorMarkers` which internally calls `monaco.editor.setModelMarkers`
          />
        </div>

        {parsingErrors.length > 0 && (
          <div className="mt-4 p-3 border border-red-400 bg-red-50 dark:bg-red-950 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300">
            <h3 className="font-semibold flex items-center mb-1">
              <XCircle className="h-4 w-4 mr-2" /> Parsing Errors Detected:
            </h3>
            <ul className="list-disc pl-5">
              {parsingErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};