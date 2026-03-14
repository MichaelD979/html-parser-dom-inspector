'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import DOMPurify from 'dompurify';
import { FileUp, Trash2, Code, Eye } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // For unique IDs, pipeline will auto-detect and add to package.json

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
// import { cn } from '@/lib/utils'; // Not strictly needed for this file, but good to have.
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode, DOMNodeType } from '@/lib/types';

/**
 * Converts a native DOM Node to a simplified DOMTreeNode for the application's state.
 * Filters out empty text nodes and provides unique IDs.
 *
 * @param node The native DOM Node to convert.
 * @param depth The current depth of the node in the tree (0 for root).
 * @param index The index of this node among its siblings.
 * @param parentNodeId Optional ID of the parent node.
 * @returns A DOMTreeNode object or null if the node should be skipped.
 */
const convertDomNodeToTreeNode = (
  node: Node,
  depth: number,
  index: number,
  parentNodeId: string | undefined = undefined,
): DOMTreeNode | null => {
  // Filter out empty text nodes (e.g., whitespace between tags)
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() === '') {
    return null;
  }

  const id = uuidv4(); // Generate a unique ID for each node

  let type: DOMNodeType;
  let tagName: string | undefined;
  let attributes: Record<string, string> | undefined;
  let nodeValue: string | undefined;
  let textContent: string | undefined;
  let children: DOMTreeNode[] | undefined;
  let outerHtml: string | undefined;

  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      type = 'element';
      tagName = (node as HTMLElement).tagName.toLowerCase();
      attributes = {};
      Array.from((node as HTMLElement).attributes).forEach((attr) => {
        attributes![attr.name] = attr.value;
      });
      textContent = node.textContent ?? '';
      outerHtml = (node as HTMLElement).outerHTML; // Capture outer HTML for element nodes

      children = Array.from(node.childNodes)
        .map((child, childIndex) =>
          convertDomNodeToTreeNode(child, depth + 1, childIndex, id),
        )
        .filter(Boolean) as DOMTreeNode[]; // Filter out null children (e.g., empty text nodes)
      break;
    case Node.TEXT_NODE:
      type = 'text';
      nodeValue = node.nodeValue ?? '';
      textContent = nodeValue;
      break;
    case Node.COMMENT_NODE:
      type = 'comment';
      nodeValue = node.nodeValue ?? '';
      textContent = nodeValue;
      break;
    case Node.DOCUMENT_TYPE_NODE:
      type = 'doctype';
      nodeValue = (node as DocumentType).name;
      textContent = nodeValue;
      break;
    case Node.CDATA_SECTION_NODE:
      type = 'cdata';
      nodeValue = node.nodeValue ?? '';
      textContent = nodeValue;
      break;
    default:
      // console.warn(`Unsupported DOM Node type encountered: ${node.nodeType} (${node.nodeName})`);
      return null; // Skip unsupported node types
  }

  return {
    id,
    type,
    tagName,
    attributes,
    nodeValue,
    textContent,
    children,
    parentNodeId,
    depth,
    index,
    outerHtml,
  };
};

/**
 * Parses an HTML string into an array of DOMTreeNode objects.
 * Handles parser errors and includes head/body content.
 *
 * @param htmlString The raw HTML string to parse.
 * @returns An array of DOMTreeNode representing the parsed HTML document.
 * @throws Error if the HTML string cannot be parsed.
 */
const htmlStringToDOMTreeNode = (htmlString: string): DOMTreeNode[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // Check for parser errors (specific to Firefox/Chrome using a 'parsererror' element)
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) {
    throw new Error(`HTML Parsing Error: ${errorNode.textContent || 'Unknown parsing error'}`);
  }

  const rootNodes: DOMTreeNode[] = [];

  // Convert the <head> element and its children
  const headNode = doc.head;
  if (headNode) {
    const headTreeNode = convertDomNodeToTreeNode(headNode, 0, 0);
    if (headTreeNode) {
      rootNodes.push(headTreeNode);
    }
  }

  // Convert the <body> element and its children
  const bodyNode = doc.body;
  if (bodyNode) {
    // Note: We might want to represent body itself as a node, or just its children.
    // For simplicity, we'll take children of body as top-level if head is already a root.
    // If we want a single root like <html>, we'd need a different approach.
    // For now, let's treat body as a distinct root if head exists, or its children directly.
    // The current convertDomNodeToTreeNode already handles recursing children.
    const bodyChildren = Array.from(bodyNode.childNodes)
      .map((node, index) => convertDomNodeToTreeNode(node, 0, index + rootNodes.length))
      .filter(Boolean) as DOMTreeNode[];
    rootNodes.push(...bodyChildren);
  } else {
    // Fallback if no body tag, take all top-level children of the document
    const docChildren = Array.from(doc.childNodes)
      .map((node, index) => convertDomNodeToTreeNode(node, 0, index))
      .filter(Boolean) as DOMTreeNode[];
    rootNodes.push(...docChildren);
  }

  return rootNodes;
};

export default function SourcePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    htmlInput,
    setHtmlInput,
    setSafeHtmlPreview,
    setDomTree,
    parsingError,
    setParsingError,
    setSanitizeOption,
  } = useHtmlParserStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('source');
  const [editorHeight, setEditorHeight] = useState('400px'); // Initial height for Monaco

  // Set default DOMPurify options on component mount
  useEffect(() => {
    // Example sanitization options:
    setSanitizeOption('FORBID_ATTR', ['style', 'on*']); // Forbid inline styles and event handlers
    setSanitizeOption('FORBID_TAGS', ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button']); // Forbid interactive/dangerous tags
    setSanitizeOption('ADD_ATTR', ['data-*', 'aria-*']); // Allow all data- and aria- attributes
    setSanitizeOption('USE_PROFILES', { html: true }); // Use general HTML profile
  }, [setSanitizeOption]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    setHtmlInput(value || '');
  }, [setHtmlInput]);

  const handleClearEditor = () => {
    setHtmlInput('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        setHtmlInput(e.target?.result as string);
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input value
        }
      };
      reader.onerror = () => {
        setParsingError('Failed to read file.');
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input value
        }
      };
      reader.readAsText(file);
    }
  };

  /**
   * Processes the HTML input: sanitizes it for preview and parses it into a DOM tree.
   * This function would ideally offload heavy parsing/sanitization to a Web Worker
   * for large inputs, but due to strict import rules prohibiting worker imports,
   * it runs on the main thread for now.
   *
   * @param html The raw HTML string to process.
   */
  const processHtml = useCallback(async (html: string) => {
    setIsLoading(true);
    setParsingError(null); // Clear any previous errors

    try {
      const currentSanitizeOptions = useHtmlParserStore.getState().sanitizeOptions;

      // 1. Sanitize HTML for safe preview using DOMPurify
      const cleanHtml = DOMPurify.sanitize(html, {
        ...currentSanitizeOptions,
        // Override for srcDoc to always strip scripts, etc.
        ADD_TAGS: [], // No additional tags beyond default safe ones
        ADD_ATTR: ['data-*'], // Keep data attributes for general use, but be strict on preview
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'video', 'audio', 'canvas', 'svg', 'math'], // Strict forbidding for preview
        FORBID_ATTR: ['style', 'on*', 'formaction', 'formmethod', 'formtarget', 'href', 'src', 'poster', 'autoplay', 'controls', 'loop', 'muted', 'preload', 'width', 'height', 'loading'], // Strict attributes
      });
      setSafeHtmlPreview(cleanHtml);

      // 2. Parse HTML into DOM tree structure for analysis
      const domTreeNodes = htmlStringToDOMTreeNode(html);
      setDomTree(domTreeNodes);

    } catch (error: any) {
      console.error('HTML Processing error:', error);
      setParsingError(error.message || 'An unknown error occurred during HTML processing.');
      setDomTree(null); // Clear tree on error
      setSafeHtmlPreview(''); // Clear preview on error
    } finally {
      setIsLoading(false);
    }
  }, [setSafeHtmlPreview, setDomTree, setParsingError]);

  // Effect to re-process HTML when input changes
  useEffect(() => {
    if (htmlInput) {
      processHtml(htmlInput);
    } else {
      setSafeHtmlPreview('');
      setDomTree(null);
      setParsingError(null);
    }
  }, [htmlInput, processHtml, setSafeHtmlPreview, setDomTree, setParsingError]);

  // Adjust editor height dynamically based on window size
  useEffect(() => {
    const handleResize = () => {
      // Calculate desired height: e.g., 70% of viewport height, minimum 400px
      const headerHeight = 64; // Approximate height of a potential fixed header
      const padding = 64; // Top/bottom padding for the container
      const newHeight = Math.max(window.innerHeight * 0.7 - headerHeight - padding, 400);
      setEditorHeight(`${newHeight}px`);
    };

    handleResize(); // Set initial height
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">HTML Source Input</CardTitle>
          <p className="text-muted-foreground">Paste your HTML or upload a file to begin parsing and analysis.</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
              <TabsTrigger value="source">
                <Code className="mr-2 h-4 w-4" /> Source HTML
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="mr-2 h-4 w-4" /> Safe Preview
              </TabsTrigger>
            </TabsList>
            <TabsContent value="source" className="mt-4">
              <div className="space-y-4">
                <Label htmlFor="html-editor" className="sr-only">HTML Source Editor</Label>
                {/* Monaco Editor */}
                <div className="relative border rounded-md overflow-hidden" style={{ height: editorHeight }}>
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    defaultValue=""
                    value={htmlInput}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      readOnly: isLoading,
                      tabSize: 2,
                    }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                      <Badge variant="brand" className="animate-pulse">Processing HTML...</Badge>
                    </div>
                  )}
                </div>

                {parsingError && (
                  <Textarea
                    readOnly
                    value={`Parsing Error:\n${parsingError}`}
                    className="h-24 text-red-600 border-red-500 bg-red-50/20 dark:bg-red-950/20"
                    aria-label="HTML parsing error"
                  />
                )}

                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".html,.htm,.txt"
                    aria-label="Upload HTML file"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <FileUp className="mr-2 h-4 w-4" /> Upload HTML File
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleClearEditor}
                    disabled={isLoading || !htmlInput}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Clear Editor
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-900" style={{ height: editorHeight }}>
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                    <Badge variant="brand" className="animate-pulse">Generating safe preview...</Badge>
                  </div>
                ) : (
                  <>
                    {useHtmlParserStore.getState().safeHtmlPreview ? (
                      <iframe
                        title="Safe HTML Preview"
                        sandbox="" // CRITICAL for security: prevents script execution, forms, popups, etc.
                        srcDoc={useHtmlParserStore.getState().safeHtmlPreview}
                        className="w-full h-full border-0"
                        aria-label="Safe HTML Preview Frame"
                        onError={(e) => console.error("iframe load error:", e)}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground p-4 text-center">
                        <p>Paste HTML in the 'Source HTML' tab to see a safe preview here.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}