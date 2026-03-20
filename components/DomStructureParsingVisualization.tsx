'use client';

import React, { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { DOMNode } from '@/lib/types';
import Editor from '@monaco-editor/react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  XCircle,
  Tag,
  Text,
  MessageCircle,
  Code,
  AlertCircle,
  Info,
} from 'lucide-react';

// AVAILABLE UI COMPONENTS (from '@/components/ui/*')
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
// Tooltip is not directly used in this component, but listed as available.

/**
 * Helper function to recursively map a native DOM Node to the custom DOMNode interface.
 * Filters out empty text nodes for cleaner visualization.
 *
 * @param nativeNode The native DOM Node to convert.
 * @param parentId The ID of the parent node, or null for root nodes.
 * @param depth The current depth of the node in the tree.
 * @param index The index of the node among its siblings, used for unique ID generation.
 * @returns A DOMNode object, or null if the node should be filtered (e.g., empty text node).
 */
function mapNativeNodeToDOMNodeRecursive(
  nativeNode: Node,
  parentId: string | null,
  depth: number,
  index: number
): DOMNode | null {
  // Filter out empty text nodes (e.g., from whitespace between elements) for cleaner visualization.
  if (nativeNode.nodeType === Node.TEXT_NODE && !nativeNode.textContent?.trim()) {
    return null;
  }

  // Generate a robust unique ID for each node.
  // Using Date.now() + random string ensures high uniqueness across multiple parsing runs
  // and for sibling nodes with identical names.
  const id = `${parentId || 'root'}-${nativeNode.nodeName}-${index}-${Date.now() + Math.random().toString(36).substring(2, 9)}`;

  // Determine the type of the node based on Node.nodeType.
  const type: DOMNode['type'] =
    nativeNode.nodeType === Node.ELEMENT_NODE
      ? 'element'
      : nativeNode.nodeType === Node.TEXT_NODE
      ? 'text'
      : nativeNode.nodeType === Node.COMMENT_NODE
      ? 'comment'
      : nativeNode.nodeType === Node.DOCUMENT_TYPE_NODE
      ? 'doctype'
      : 'document'; // Fallback for other less common types, like the Document itself

  const domNode: DOMNode = {
    id,
    type,
    nodeName: nativeNode.nodeName,
    nodeType: nativeNode.nodeType,
    textContent: nativeNode.textContent || undefined,
    depth,
    parentId,
    children: [], // Initialize children array, will be populated recursively
  };

  if (nativeNode.nodeType === Node.ELEMENT_NODE) {
    const element = nativeNode as HTMLElement;
    domNode.tagName = element.tagName.toLowerCase();
    domNode.attributes = {};
    if (element.hasAttributes()) {
      Array.from(element.attributes).forEach((attr) => {
        if (domNode.attributes) domNode.attributes[attr.name] = attr.value;
      });
    }
    // Heuristic for self-closing tags (HTML5 void elements list).
    // The DOM doesn't inherently distinguish between <img /> and <img> in its tree structure,
    // so this is based on common HTML void elements.
    domNode.isSelfClosing = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(domNode.tagName);
    domNode.outerHTML = element.outerHTML; // Store outerHTML for potential future use or display
  } else if (nativeNode.nodeType === Node.DOCUMENT_TYPE_NODE) {
    const doctype = nativeNode as DocumentType;
    domNode.nodeName = doctype.name; // e.g., "html" for <!DOCTYPE html>
    // Construct the doctype text content for display
    domNode.textContent = `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}${doctype.systemId ? ` "${doctype.systemId}"` : ''}>`;
  } else if (nativeNode.nodeType === Node.DOCUMENT_NODE) {
    // The document node itself, not typically rendered directly, but its children are.
    domNode.nodeName = '#document';
  }

  // Recursively process all child nodes of the current native node.
  Array.from(nativeNode.childNodes).forEach((childNativeNode, childIndex) => {
    const childDomNode = mapNativeNodeToDOMNodeRecursive(childNativeNode, domNode.id, depth + 1, childIndex);
    if (childDomNode) {
      domNode.children?.push(childDomNode);
    }
  });

  return domNode;
}

/**
 * Parses an HTML string into a nested array of DOMNode objects.
 * Handles <!DOCTYPE> and <html> elements as top-level nodes.
 *
 * @param htmlString The raw HTML content to parse.
 * @returns An array of DOMNode objects representing the root of the parsed HTML tree.
 * @throws Error if the HTML parsing encounters a `parsererror` indicating malformed HTML.
 */
function htmlToDomNodes(htmlString: string): DOMNode[] {
  const parser = new DOMParser();
  // Parse the HTML string into a native Document object.
  const doc = parser.parseFromString(htmlString, 'text/html');
  const rootNodes: DOMNode[] = [];

  // Check for parser errors. Browsers often insert a <parsererror> element for malformed HTML.
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(parserError.textContent || 'HTML parsing error: Document is malformed.');
  }

  // Handle <!DOCTYPE html> if present, adding it as a root node.
  if (doc.doctype) {
    const doctypeNode = mapNativeNodeToDOMNodeRecursive(doc.doctype, null, 0, 0);
    if (doctypeNode) rootNodes.push(doctypeNode);
  }

  // Handle the <html> element, adding it as a root node and processing its children.
  if (doc.documentElement) {
    // Use rootNodes.length as index to ensure unique IDs for top-level siblings (e.g., doctype then html)
    const htmlElementNode = mapNativeNodeToDOMNodeRecursive(doc.documentElement, null, 0, rootNodes.length);
    if (htmlElementNode) rootNodes.push(htmlElementNode);
  }

  return rootNodes;
}

/**
 * Recursive component to display an individual DOMNode and its children.
 * Features: indentation, node type icons, attribute display, and collapsible sections for elements.
 */
interface DomNodeViewProps {
  node: DOMNode;
}

const DomNodeView: React.FC<DomNodeViewProps> = ({ node }) => {
  // State to manage the expansion/collapse of element nodes.
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isElement = node.type === 'element';
  const isText = node.type === 'text';
  const isComment = node.type === 'comment';
  const isDocType = node.type === 'doctype';

  // Determine the appropriate icon based on the node type.
  const nodeIcon = isElement ? <Tag size={14} className="text-blue-500" /> :
                   isText ? <Text size={14} className="text-green-500" /> :
                   isComment ? <MessageCircle size={14} className="text-gray-500" /> :
                   isDocType ? <Code size={14} className="text-purple-500" /> :
                   <FileText size={14} className="text-gray-400" />; // Fallback icon

  // Toggle expansion state for elements that have children.
  const toggleExpand = () => {
    if (isElement && hasChildren) {
      setIsExpanded((prev) => !prev);
    }
  };

  // Format attributes for display.
  const attributeDisplay = node.attributes
    ? Object.entries(node.attributes)
        .map(([key, value]) => (
          <span key={key} className="text-yellow-600 dark:text-yellow-400 mx-0.5">
            {' '}
            {key}=<span className="text-orange-500 dark:text-orange-300">&quot;{value}&quot;</span>
          </span>
        ))
    : null;

  return (
    <div style={{ paddingLeft: `${node.depth * 20}px` }} className="py-0.5 text-sm">
      <div
        className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm pr-2"
        onClick={toggleExpand}
      >
        {/* Expand/Collapse icon for elements with children */}
        {isElement && hasChildren ? (
          isExpanded ? (
            <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
          ) : (
            <ChevronRight size={16} className="text-gray-500 dark:text-gray-400 mr-1" />
          )
        ) : (
          // Placeholder for non-collapsible nodes to maintain alignment
          <div className="w-4 h-4 mr-1 flex items-center justify-center">
            {isText || isComment || isDocType ? null : <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
          </div>
        )}
        <span className="flex items-center space-x-1">
          {nodeIcon}
          {isElement ? (
            <>
              <span className="text-blue-600 dark:text-blue-400">&lt;{node.tagName}</span>
              {attributeDisplay}
              <span className="text-blue-600 dark:text-blue-400">{node.isSelfClosing ? ' /&gt;' : '&gt;'}</span>
            </>
          ) : isText ? (
            <span className="text-green-700 dark:text-green-300 whitespace-pre-wrap break-all">{node.textContent}</span>
          ) : isComment ? (
            <span className="text-gray-600 dark:text-gray-400">&lt;!--{node.textContent}--&gt;</span>
          ) : isDocType ? (
            <span className="text-purple-600 dark:text-purple-400">{node.textContent}</span>
          ) : (
            <span className="text-gray-700 dark:text-gray-300">{node.nodeName}</span>
          )}
        </span>
      </div>

      {/* Render children if expanded and present */}
      {isElement && hasChildren && isExpanded && (
        <div className="border-l border-gray-200 dark:border-gray-700 ml-1">
          {node.children?.map((child) => (
            <DomNodeView key={child.id} node={child} />
          ))}
          {/* Closing tag for expanded elements that are not self-closing */}
          {!node.isSelfClosing && (
            <div style={{ paddingLeft: `${node.depth * 20}px` }} className="text-sm">
              <span className="flex items-center space-x-1 pl-1">
                <span className="w-4 h-4 mr-1"></span> {/* Alignment placeholder */}
                <span className="text-blue-600 dark:text-blue-400">&lt;/{node.tagName}&gt;</span>
              </span>
            </div>
          )}
        </div>
      )}
      {/* Closing tag for elements without children (and not self-closing) that are not expanded */}
      {isElement && !node.isSelfClosing && !hasChildren && (
        <div style={{ paddingLeft: `${node.depth * 20}px` }} className="text-sm">
          <span className="flex items-center space-x-1 pl-1">
            <span className="w-4 h-4 mr-1"></span> {/* Alignment placeholder */}
            <span className="text-blue-600 dark:text-blue-400">&lt;/{node.tagName}&gt;</span>
          </span>
        </div>
      )}
    </div>
  );
};


/**
 * The main component for DOM Structure Parsing & Visualization.
 * Provides an HTML editor, file upload, and an interactive tree visualization of the parsed DOM.
 */
export const DomStructureParsingVisualization: React.FC = () => {
  // Access state and actions from the Zustand store.
  const {
    rawHtmlInput,
    setRawHtmlInput,
    parsedDomTree,
    setParsedDomTree,
    parsingError,
    setParsingError,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
  } = useHtmlParserStore();

  // Ref for the hidden file input element to programmatically trigger file selection.
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect hook to trigger HTML parsing whenever `rawHtmlInput` changes.
  useEffect(() => {
    if (rawHtmlInput.trim() === '') {
      // Clear tree and errors if input is empty
      setParsedDomTree(null);
      setParsingError(null);
      return;
    }

    try {
      const parsedTree = htmlToDomNodes(rawHtmlInput);
      setParsedDomTree(parsedTree);
      setParsingError(null); // Clear any previous errors on successful parse
    } catch (error: any) {
      setParsedDomTree(null); // Clear the tree on parsing error
      setParsingError(error.message || 'An unknown error occurred during parsing.');
    }
  }, [rawHtmlInput, setParsedDomTree, setParsingError]); // Dependencies ensure effect runs when these values change

  /**
   * Handles the file upload event. Reads the content of the uploaded HTML file
   * and updates the store with its name and content.
   */
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFile(file.name, content);
      };
      reader.onerror = () => {
        setParsingError('Failed to read file.');
        clearUploadedFile();
      };
      reader.readAsText(file); // Read file content as text
    }
    // Clear the input value so the same file can be selected again after clearing.
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Clears the currently uploaded file information from the store.
   */
  const handleClearFileUpload = () => {
    clearUploadedFile();
  };

  /**
   * Callback for Monaco Editor's onChange event, debounced or memoized for performance.
   */
  const handleMonacoEditorChange = useCallback((value: string | undefined) => {
    setRawHtmlInput(value || '');
  }, [setRawHtmlInput]);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-brand" /> DOM Structure Parsing & Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row flex-grow p-0">
        {/* Input & Controls Section */}
        <div className="flex flex-col w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 overflow-auto">
          <Label htmlFor="html-input" className="mb-2 text-md font-semibold">
            Raw HTML Input
          </Label>
          <div className="flex items-center space-x-2 mb-4">
            {/* Hidden file input, triggered by the button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".html,.htm"
              onChange={handleFileUpload}
              className="hidden"
              id="html-file-upload"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Upload HTML File
            </Button>
            {uploadedFileName && (
              <Badge variant="info" dot className="flex items-center gap-1">
                {uploadedFileName}
                <Button variant="ghost" size="sm" onClick={handleClearFileUpload} className="h-auto p-1 text-info-foreground hover:bg-info/20">
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
          {/* Monaco Editor for raw HTML input */}
          <div className="flex-grow min-h-[300px] border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            <Editor
              height="100%" // Editor fills the available height
              language="html"
              value={rawHtmlInput}
              theme="vs-dark" // Dark theme for a coding-like experience
              options={{
                minimap: { enabled: false }, // Disable minimap for cleaner UI
                readOnly: false,
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 10, bottom: 10 },
                lineNumbers: 'on',
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                glyphMargin: false,
              }}
              onChange={handleMonacoEditorChange}
            />
          </div>
        </div>

        {/* Visualization Section */}
        <div className="flex flex-col w-full md:w-1/2 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          <h3 className="mb-2 text-md font-semibold flex items-center gap-2">
            <Code className="h-5 w-5 text-brand" /> DOM Tree Visualization
          </h3>
          <Separator className="mb-4" />

          {/* Display parsing errors */}
          {parsingError && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md mb-4 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Parsing Error: {parsingError}</p>
            </div>
          )}

          {/* Render the DOM tree or a placeholder message */}
          {!parsingError && parsedDomTree && parsedDomTree.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm flex-grow overflow-auto font-mono text-xs">
              {parsedDomTree.map((node) => (
                <DomNodeView key={node.id} node={node} />
              ))}
            </div>
          ) : !rawHtmlInput.trim() ? (
            <div className="flex-grow flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
              <Info className="h-10 w-10 mb-4" />
              <p className="text-lg font-medium text-center">Enter HTML or upload a file to see the DOM structure.</p>
              <p className="text-sm text-center mt-2">Whitespace-only text nodes are automatically filtered for clarity.</p>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
              <p>No DOM tree to display (empty input or unhandled parsing issue).</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};