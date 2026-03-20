'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileUp,
  Code,
  ChevronsRight,
  Search,
  ChevronRight,
  ChevronDown,
  CircleX,
  Copy,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useHtmlParserStore } from '@/lib/store';
import { DOMNode, ExtractionResult } from '@/lib/types';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard'; // Assuming this hook is available or building inline. I will build it inline.

// Inline hook for copy to clipboard
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  return [copiedText, copy] as const;
};

interface DomTreeNodeProps {
  node: DOMNode;
  expandedNodes: Set<string>;
  toggleExpand: (nodeId: string) => void;
  depth: number;
}

const DomTreeNode = ({ node, expandedNodes, toggleExpand, depth }: DomTreeNodeProps) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const nodeLabelColor = (type: DOMNode['type']) => {
    switch (type) {
      case 'element':
        return 'text-blue-600 dark:text-blue-400';
      case 'text':
        return 'text-green-600 dark:text-green-400';
      case 'comment':
        return 'text-gray-500 dark:text-gray-400';
      case 'doctype':
        return 'text-purple-600 dark:text-purple-400';
      case 'document':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return '';
    }
  };

  const renderAttributes = (attrs?: Record<string, string>) => {
    if (!attrs || Object.keys(attrs).length === 0) return null;
    return (
      <span className="text-yellow-600 dark:text-yellow-300">
        {' '}
        {Object.entries(attrs)
          .map(([key, value]) => (
            <span key={key}>
              <span className="text-orange-500 dark:text-orange-300">{key}</span>=
              <span className="text-green-700 dark:text-green-300">"{value}"</span>
            </span>
          ))
          .join(' ')}
      </span>
    );
  };

  const renderNodeContent = () => {
    if (node.type === 'element') {
      return (
        <span className={nodeLabelColor(node.type)}>
          &lt;{node.tagName}
          {renderAttributes(node.attributes)}
          {node.isSelfClosing ? ' /' : ''}&gt;
          {node.isSelfClosing ? null : (
            <>
              {node.textContent && node.textContent.trim() !== '' && (
                <span className="text-gray-700 dark:text-gray-200">
                  {node.textContent.trim().substring(0, 50)}
                  {node.textContent.trim().length > 50 ? '...' : ''}
                </span>
              )}
              {!hasChildren && !node.isSelfClosing && `</${node.tagName}>`}
            </>
          )}
        </span>
      );
    } else if (node.type === 'text') {
      return (
        <span className={nodeLabelColor(node.type)}>
          &quot;{node.textContent?.trim().substring(0, 70)}
          {node.textContent && node.textContent.trim().length > 70 ? '...' : ''}&quot;
        </span>
      );
    } else if (node.type === 'comment') {
      return (
        <span className={nodeLabelColor(node.type)}>
          &lt;!--{node.textContent?.trim().substring(0, 70)}
          {node.textContent && node.textContent.trim().length > 70 ? '...' : ''}--&gt;
        </span>
      );
    } else if (node.type === 'doctype') {
      return <span className={nodeLabelColor(node.type)}>&lt;!DOCTYPE html&gt;</span>;
    } else if (node.type === 'document') {
      return <span className={nodeLabelColor(node.type)}>#document</span>;
    }
    return <span>{node.nodeName}</span>;
  };

  return (
    <div className="text-sm">
      <div
        className="flex items-start py-0.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && toggleExpand(node.id)}
      >
        {hasChildren ? (
          <span className="mr-1 mt-0.5 text-zinc-500">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        ) : (
          <span className="mr-1 w-4 h-4" />
        )}
        {renderNodeContent()}
      </div>
      {isExpanded && hasChildren && (
        <div className="pl-4">
          {node.children!.map((child) => (
            <DomTreeNode
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              depth={depth + 1}
            />
          ))}
          {node.type === 'element' && !node.isSelfClosing && (
            <div style={{ paddingLeft: `${depth * 16}px` }} className="text-blue-600 dark:text-blue-400">
              &lt;/{node.tagName}&gt;
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function DomTreeViewPage() {
  const {
    rawHtmlInput,
    setRawHtmlInput,
    parsedDomTree,
    setParsedDomTree,
    parsingError,
    setParsingError,
    selectorInput,
    setSelectorInput,
    extractionResults,
    addExtractionResult,
    clearExtractionResults,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
  } = useHtmlParserStore();

  const [activeTab, setActiveTab] = useState('input');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [_, copyToClipboard] = useCopyToClipboard(); // for extraction results
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If rawHtmlInput changes and it's not empty, clear parsing error
    if (rawHtmlInput && parsingError) {
      setParsingError(null);
    }
  }, [rawHtmlInput, parsingError, setParsingError]);

  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allNodeIds: string[] = [];
    const traverse = (nodes: DOMNode[]) => {
      nodes.forEach(node => {
        allNodeIds.push(node.id);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    if (parsedDomTree) {
      traverse(parsedDomTree);
      setExpandedNodes(new Set(allNodeIds));
    }
  }, [parsedDomTree]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);


  const convertNodeToDOMNode = (node: Node, parentId: string | null, depth: number): DOMNode | null => {
    const id = crypto.randomUUID();
    let domNode: Partial<DOMNode> = {
      id,
      parentId,
      depth,
      nodeName: node.nodeName,
      nodeType: node.nodeType,
      outerHTML: (node as HTMLElement).outerHTML,
    };

    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        const element = node as HTMLElement;
        domNode = {
          ...domNode,
          type: 'element',
          tagName: element.tagName.toLowerCase(),
          attributes: Array.from(element.attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>),
          textContent: element.textContent || undefined,
          isSelfClosing: ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'].includes(element.tagName.toLowerCase()),
        };
        break;
      case Node.TEXT_NODE:
        const textContent = node.textContent?.trim();
        if (!textContent) return null; // Ignore empty text nodes
        domNode = {
          ...domNode,
          type: 'text',
          textContent: textContent,
        };
        break;
      case Node.COMMENT_NODE:
        domNode = {
          ...domNode,
          type: 'comment',
          textContent: node.textContent || undefined,
        };
        break;
      case Node.DOCUMENT_NODE:
        domNode = {
          ...domNode,
          type: 'document',
          nodeName: '#document',
        };
        break;
      case Node.DOCUMENT_TYPE_NODE:
        domNode = {
          ...domNode,
          type: 'doctype',
          nodeName: '#doctype',
          textContent: (node as DocumentType).publicId || (node as DocumentType).systemId || '',
        };
        break;
      default:
        // Ignore other node types like CDATA_SECTION_NODE, PROCESSING_INSTRUCTION_NODE, etc.
        return null;
    }

    const children: DOMNode[] = [];
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach((child) => {
        const childDomNode = convertNodeToDOMNode(child, id, depth + 1);
        if (childDomNode) {
          children.push(childDomNode);
        }
      });
    }
    domNode.children = children.length > 0 ? children : undefined;

    return domNode as DOMNode;
  };

  const handleParseHtml = useCallback(() => {
    if (!rawHtmlInput.trim()) {
      setParsedDomTree(null);
      setParsingError("HTML input cannot be empty.");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtmlInput, 'text/html');

      // Check for parser errors (specific to HTML documents)
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        setParsedDomTree(null);
        setParsingError(`HTML parsing error: ${parseError.textContent}`);
        return;
      }

      // Start converting from the document node itself
      const domNodes: DOMNode[] = [];
      doc.childNodes.forEach(child => {
        const converted = convertNodeToDOMNode(child, null, 0);
        if (converted) {
          domNodes.push(converted);
        }
      });

      if (domNodes.length === 0) {
        setParsedDomTree(null);
        setParsingError("Parsing resulted in an empty DOM tree.");
        return;
      }
      
      setParsedDomTree(domNodes);
      setParsingError(null);
      setActiveTab('dom-tree'); // Switch to DOM tree view after successful parse
      setExpandedNodes(new Set([domNodes[0].id])); // Expand the root node by default

    } catch (error) {
      console.error("Error parsing HTML:", error);
      setParsedDomTree(null);
      setParsingError(`An unexpected error occurred during parsing: ${(error as Error).message}`);
    }
  }, [rawHtmlInput, setParsedDomTree, setParsingError]);


  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFile(file.name, content);
        setRawHtmlInput(content); // Update rawHtmlInput with file content
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input
        }
      };
      reader.onerror = () => {
        setParsingError(`Failed to read file: ${file.name}`);
      };
      reader.readAsText(file);
    }
  }, [setUploadedFile, setRawHtmlInput, setParsingError]);

  const handleClearUpload = useCallback(() => {
    clearUploadedFile();
    setRawHtmlInput('');
    setParsedDomTree(null);
    setParsingError(null);
  }, [clearUploadedFile, setRawHtmlInput, setParsedDomTree, setParsingError]);

  const handleExtract = useCallback(() => {
    clearExtractionResults(); // Clear previous results
    if (!selectorInput.trim()) {
      addExtractionResult({ selector: 'Error', values: ['Please enter a CSS selector or XPath.'] });
      return;
    }
    if (!rawHtmlInput.trim()) {
      addExtractionResult({ selector: 'Error', values: ['No HTML content to extract from.'] });
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtmlInput, 'text/html');

      // Check for parser errors (specific to HTML documents)
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        addExtractionResult({ selector: 'Error', values: [`HTML parsing error for extraction: ${parseError.textContent}`] });
        return;
      }

      const results: string[] = [];

      // Basic check for XPath vs CSS Selector
      // This is a simplified check. A full XPath parser would be more robust.
      const isXPath = selectorInput.startsWith('/') || selectorInput.startsWith('(');

      if (isXPath) {
        // XPath extraction
        const xpathResult = doc.evaluate(selectorInput, doc, null, XPathResult.ANY_TYPE, null);
        let node = xpathResult.iterateNext();
        while (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            results.push((node as HTMLElement).outerHTML);
          } else if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) {
            results.push(node.textContent || '');
          }
          node = xpathResult.iterateNext();
        }
      } else {
        // CSS Selector extraction
        const elements = doc.querySelectorAll(selectorInput);
        elements.forEach((el) => {
          results.push((el as HTMLElement).outerHTML);
        });
      }

      if (results.length > 0) {
        addExtractionResult({ selector: selectorInput, values: results });
      } else {
        addExtractionResult({ selector: selectorInput, values: ['No elements found matching the selector.'] });
      }

    } catch (error) {
      console.error("Error during extraction:", error);
      addExtractionResult({ selector: selectorInput, values: [`Extraction failed: ${(error as Error).message}`] });
    }
  }, [selectorInput, rawHtmlInput, addExtractionResult, clearExtractionResults]);


  return (
    <div className="flex flex-col h-full overflow-hidden p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-3xl font-bold mb-6 text-center">HTML DOM Tree View & Extractor</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">
            <Code className="mr-2 h-4 w-4" /> HTML Input
          </TabsTrigger>
          <TabsTrigger value="dom-tree" disabled={!parsedDomTree && !parsingError}>
            <ChevronsRight className="mr-2 h-4 w-4" /> DOM Tree View
          </TabsTrigger>
          <TabsTrigger value="extraction">
            <Search className="mr-2 h-4 w-4" /> Element Extraction
          </TabsTrigger>
        </TabsList>

        <div className="flex-grow pt-4 overflow-hidden">
          <TabsContent value="input" className="h-full flex flex-col">
            <Card className="flex-grow flex flex-col">
              <CardHeader>
                <CardTitle>Raw HTML Input</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Paste your HTML below or upload a file to get started.
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    ref={fileInputRef}
                    id="html-file-upload"
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileUpload}
                    className="flex-grow max-w-sm"
                  />
                  {uploadedFileName && (
                    <Badge variant="brand" dot className="py-2 px-3">
                      {uploadedFileName}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearUpload}
                        className="ml-2 h-6 w-6 rounded-full text-zinc-500 hover:text-red-500"
                      >
                        <CircleX className="h-4 w-4" />
                      </Button>
                    </Badge>
                  )}
                </div>
                <Label htmlFor="html-editor">HTML Content</Label>
                <div className="flex-grow border rounded-md overflow-hidden bg-zinc-50 dark:bg-zinc-900">
                  <Editor
                    height="100%"
                    language="html"
                    theme="vs-dark" // Or 'vs-light' based on preference
                    value={rawHtmlInput}
                    onChange={(value) => setRawHtmlInput(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleParseHtml} disabled={!rawHtmlInput.trim()}>
                    <Code className="mr-2 h-4 w-4" /> Parse HTML
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dom-tree" className="h-full flex flex-col">
            <Card className="flex-grow flex flex-col">
              <CardHeader>
                <CardTitle>DOM Tree View</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 overflow-hidden">
                {parsingError && (
                  <Badge variant="error" className="flex items-center justify-center p-3 text-sm">
                    <Info className="mr-2 h-4 w-4" /> {parsingError}
                  </Badge>
                )}
                {!parsedDomTree && !parsingError && (
                  <p className="text-center text-zinc-500 dark:text-zinc-400 py-10">
                    No DOM tree to display. Please parse HTML from the "HTML Input" tab.
                  </p>
                )}
                {parsedDomTree && parsedDomTree.length > 0 && (
                  <>
                    <div className="flex space-x-2 justify-end">
                      <Button variant="outline" size="sm" onClick={expandAll}>
                        Expand All
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll}>
                        Collapse All
                      </Button>
                    </div>
                    <div className="flex-grow border rounded-md p-4 overflow-auto bg-zinc-50 dark:bg-zinc-900 font-mono text-zinc-700 dark:text-zinc-200">
                      {parsedDomTree.map((node) => (
                        <DomTreeNode
                          key={node.id}
                          node={node}
                          expandedNodes={expandedNodes}
                          toggleExpand={toggleExpand}
                          depth={0}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extraction" className="h-full flex flex-col">
            <Card className="flex-grow flex flex-col">
              <CardHeader>
                <CardTitle>Element Extraction</CardTitle>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Enter a CSS selector (e.g., `div > p.intro`) or XPath (e.g., `//a/@href`) to
                  extract elements or attributes.
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col space-y-4 overflow-hidden">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter CSS selector or XPath (e.g., #my-div .item, //div[@class='item'])"
                    value={selectorInput}
                    onChange={(e) => setSelectorInput(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={handleExtract} disabled={!selectorInput.trim() || !rawHtmlInput.trim()}>
                    <Search className="mr-2 h-4 w-4" /> Extract
                  </Button>
                </div>

                <Separator />

                <h3 className="text-lg font-semibold">Extraction Results</h3>
                <div className="flex-grow border rounded-md p-4 overflow-auto bg-zinc-50 dark:bg-zinc-900">
                  {extractionResults.length === 0 ? (
                    <p className="text-center text-zinc-500 dark:text-zinc-400 py-10">
                      No extraction results yet.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {extractionResults.map((result, index) => (
                        <Card key={index} className="bg-zinc-100 dark:bg-zinc-800">
                          <CardHeader className="p-3 border-b dark:border-zinc-700">
                            <CardTitle className="text-base font-medium flex items-center justify-between">
                              <span>Selector: <span className="font-mono text-blue-600 dark:text-blue-300">{result.selector}</span></span>
                              {result.values.length > 0 && result.values[0] !== 'No elements found matching the selector.' && (
                                <Badge variant="default">{result.values.length} matches</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 text-sm font-mono whitespace-pre-wrap break-all text-zinc-800 dark:text-zinc-200">
                            {result.values.map((value, i) => (
                              <div key={i} className="flex items-start justify-between py-1 border-b dark:border-zinc-700 last:border-b-0">
                                <span className="flex-grow pr-2">{truncate(value, 200)}</span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => copyToClipboard(value)}
                                        className="h-6 w-6 text-zinc-500 hover:text-blue-500"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy to clipboard</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}