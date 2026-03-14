'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileUp,
  X,
  Lightbulb,
  Search,
  LayoutPanelLeft,
  RefreshCcw,
  Eraser,
} from 'lucide-react';
import DOMPurify from 'dompurify'; // Utility package, will be auto-detected for package.json

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn, truncate } from '@/lib/utils';
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode, DOMNodeType } from '@/lib/types';

// Helper function to generate unique IDs for DOM nodes
// This helps with React keys and state management
function generateUniqueId(depth: number, index: number, parentId?: string): string {
  return parentId ? `${parentId}-${index}` : `node-${depth}-${index}`;
}

/**
 * Converts a browser DOM Node into our serializable DOMTreeNode format.
 * This is a recursive function.
 */
function convertBrowserNodeToDOMTreeNode(
  node: Node,
  depth: number,
  index: number,
  parentNodeId?: string
): DOMTreeNode | null {
  const id = generateUniqueId(depth, index, parentNodeId);

  // Ignore empty text nodes (which often appear between elements due to whitespace)
  if (node.nodeType === Node.TEXT_NODE && !node.nodeValue?.trim()) {
    return null;
  }

  // Handle specific node types
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const attributes: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }

    const children: DOMTreeNode[] = [];
    for (let i = 0; i < element.childNodes.length; i++) {
      const childNode = element.childNodes[i];
      const childTreeNode = convertBrowserNodeToDOMTreeNode(childNode, depth + 1, i, id);
      if (childTreeNode) {
        children.push(childTreeNode);
      }
    }

    return {
      id,
      type: 'element',
      tagName: element.tagName.toLowerCase(),
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      textContent: element.textContent || '', // Aggregated text content
      children: children.length > 0 ? children : undefined,
      parentNodeId,
      depth,
      index,
    };
  } else if (node.nodeType === Node.TEXT_NODE) {
    return {
      id,
      type: 'text',
      nodeValue: node.nodeValue || '',
      textContent: node.nodeValue || '',
      parentNodeId,
      depth,
      index,
    };
  } else if (node.nodeType === Node.COMMENT_NODE) {
    return {
      id,
      type: 'comment',
      nodeValue: node.nodeValue || '',
      textContent: node.nodeValue || '',
      parentNodeId,
      depth,
      index,
    };
  } else if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
    const doctype = node as DocumentType;
    // Construct a representation of the doctype declaration
    const doctypeString = `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}${doctype.systemId ? ` "${doctype.systemId}"` : ''}>`;
    return {
      id,
      type: 'doctype',
      nodeValue: doctypeString,
      textContent: doctype.name,
      parentNodeId,
      depth,
      index,
    };
  } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return {
      id,
      type: 'cdata',
      nodeValue: node.nodeValue || '',
      textContent: node.nodeValue || '',
      parentNodeId,
      depth,
      index,
    };
  }
  return null; // Ignore other node types (e.g., Document, DocumentFragment, ProcessingInstruction)
}

/**
 * Parses an HTML string into a DOMTreeNode array and sanitizes it for preview.
 */
function parseHtmlContent(htmlString: string): {
  domTreeNodes: DOMTreeNode[];
  sanitizedHtml: string;
  error: string | null;
} {
  if (!htmlString.trim()) {
    return { domTreeNodes: [], sanitizedHtml: '', error: null };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    // Check for parsing errors reported by the browser (e.g., malformed HTML)
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return {
        domTreeNodes: [],
        sanitizedHtml: '',
        error: `HTML Parsing Error: ${parserError.textContent?.split('\n')[0].trim() || 'Unknown parsing error.'}`,
      };
    }

    const treeNodes: DOMTreeNode[] = [];
    let indexCounter = 0;

    // Iterate through top-level children of the document (typically DOCTYPE and HTML element)
    Array.from(doc.childNodes).forEach((childNode) => {
      const treeNode = convertBrowserNodeToDOMTreeNode(childNode, 0, indexCounter++);
      if (treeNode) {
        treeNodes.push(treeNode);
      }
    });

    // Sanitize for safe preview in the iframe
    const sanitizedHtml = DOMPurify.sanitize(htmlString, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'object', 'embed', 'link', 'meta'], // Restrict potentially harmful tags
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onmouseover', 'onclick'], // Restrict dangerous attributes
      ALLOW_DATA_ATTR: false, // Disallow data attributes
    });

    return { domTreeNodes: treeNodes, sanitizedHtml, error: null };
  } catch (e: any) {
    console.error('HTML Parsing/Sanitization error:', e);
    return { domTreeNodes: [], sanitizedHtml: '', error: `Failed to parse HTML: ${e.message}` };
  }
}

interface DomTreeNodeViewProps {
  node: DOMTreeNode;
  expandedNodes: Set<string>;
  highlightedNodeId: string | null;
  toggleNodeExpansion: (nodeId: string) => void;
  setHighlightedNodeId: (nodeId: string | null) => void;
}

const DomTreeNodeView: React.FC<DomTreeNodeViewProps> = ({
  node,
  expandedNodes,
  highlightedNodeId,
  toggleNodeExpansion,
  setHighlightedNodeId,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  // Indentation amount for the current node's content (1rem = 16px per depth level)
  const indent = node.depth * 16;

  // Determine text color based on node type for visual distinction
  const nodeTypeClass = useMemo(() => {
    switch (node.type) {
      case 'element':
        return 'text-brand-500 dark:text-brand-400';
      case 'text':
        return 'text-zinc-600 dark:text-zinc-400';
      case 'comment':
        return 'text-green-600 dark:text-green-400 italic';
      case 'doctype':
        return 'text-purple-600 dark:text-purple-400 font-mono';
      case 'cdata':
        return 'text-yellow-600 dark:text-yellow-400 font-mono';
      default:
        return 'text-zinc-800 dark:text-zinc-200';
    }
  }, [node.type]);

  const handleNodeClick = useCallback(() => {
    if (hasChildren) {
      toggleNodeExpansion(node.id);
    }
    setHighlightedNodeId(node.id);
  }, [hasChildren, node.id, toggleNodeExpansion, setHighlightedNodeId]);

  const getTooltipContent = () => {
    if (node.type === 'element') {
      const attrs = node.attributes
        ? Object.entries(node.attributes)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ')
        : '';
      return `<${node.tagName}${attrs ? ' ' + attrs : ''}>`;
    }
    if (node.type === 'text') {
      return `Text Node: ${truncate(node.nodeValue || '', 100)}`;
    }
    if (node.type === 'comment') {
      return `Comment: ${truncate(node.nodeValue || '', 100)}`;
    }
    if (node.type === 'doctype') {
      return `DOCTYPE: ${node.nodeValue}`;
    }
    if (node.type === 'cdata') {
      return `CDATA: ${node.nodeValue}`;
    }
    return `Type: ${node.type}`;
  };

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center gap-1 py-0.5 cursor-pointer rounded-sm transition-colors',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                highlightedNodeId === node.id && 'bg-brand-100 dark:bg-brand-900'
              )}
              style={{ paddingLeft: indent + 'px' }} // Dynamic indentation for current node
              onClick={handleNodeClick}
              onMouseEnter={() => setHighlightedNodeId(node.id)}
              onMouseLeave={() => setHighlightedNodeId(null)}
            >
              {/* Vertical line connecting to children nodes */}
              {hasChildren && node.children && isExpanded && (
                <div
                  className="absolute left-0 top-0 h-full w-[1px] bg-zinc-200 dark:bg-zinc-700"
                  style={{ left: indent + 8 + 'px' }} // Position to align with the start of child nodes
                />
              )}

              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={14} className="flex-shrink-0 text-zinc-500 z-10" />
                ) : (
                  <ChevronRight size={14} className="flex-shrink-0 text-zinc-500 z-10" />
                )
              ) : (
                <span className="inline-block w-[14px] flex-shrink-0 z-10" /> // Spacer for alignment
              )}

              {node.type === 'element' && (
                <span className={cn('font-semibold', nodeTypeClass, 'text-sm')}>
                  &lt;{node.tagName}
                  {node.attributes &&
                    Object.entries(node.attributes).map(([key, value]) => (
                      <Badge key={key} variant="default" className="ml-1 px-1.5 py-0.5 text-xs font-normal">
                        {key}=<span className="text-brand-400 dark:text-brand-300">"{value}"</span>
                      </Badge>
                    ))}
                  {hasChildren ? '>' : ' /&gt;'}
                </span>
              )}

              {node.type === 'text' && (
                <span className={cn('text-sm', nodeTypeClass)}>
                  {truncate(node.nodeValue || '', 80, '...')}{' '}
                  <Badge variant="info" dot className="ml-1 text-xs font-normal">
                    Text
                  </Badge>
                </span>
              )}

              {node.type === 'comment' && (
                <span className={cn('text-sm', nodeTypeClass)}>
                  &lt;!-- {truncate(node.nodeValue || '', 80, '...')} --&gt;
                </span>
              )}

              {node.type === 'doctype' && (
                <span className={cn('text-sm', nodeTypeClass)}>
                  {truncate(node.nodeValue || '', 80, '...')}
                </span>
              )}

              {node.type === 'cdata' && (
                <span className={cn('text-sm', nodeTypeClass)}>
                  &lt;![CDATA[ {truncate(node.nodeValue || '', 80, '...')} ]]&gt;
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs text-sm">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isExpanded && hasChildren && (
        <div className="relative">
          {node.children?.map((child) => (
            <DomTreeNodeView
              key={child.id}
              node={child}
              expandedNodes={expandedNodes}
              highlightedNodeId={highlightedNodeId}
              toggleNodeExpansion={toggleNodeExpansion}
              setHighlightedNodeId={setHighlightedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function DomTreePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    htmlInput,
    setHtmlInput,
    domTree,
    setDomTree,
    expandedNodes,
    toggleNodeExpansion,
    expandAllNodes,
    collapseAllNodes,
    highlightedNodeId,
    setHighlightedNodeId,
    parsingError,
    setParsingError,
    safeHtmlPreview,
    setSafeHtmlPreview,
  } = useHtmlParserStore();

  // Function to get all node IDs for expanding/collapsing all
  const getAllNodeIds = useCallback((nodes: DOMTreeNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
      ids.push(node.id);
      if (node.children) {
        ids = ids.concat(getAllNodeIds(node.children));
      }
    });
    return ids;
  }, []);

  const handleParseHtml = useCallback(() => {
    const { domTreeNodes, sanitizedHtml, error } = parseHtmlContent(htmlInput);
    setDomTree(domTreeNodes);
    setSafeHtmlPreview(sanitizedHtml);
    setParsingError(error);

    if (domTreeNodes.length > 0 && !error) {
      // Automatically expand root nodes and their immediate children for a better initial view
      const nodesToInitiallyExpand = new Set<string>();
      domTreeNodes.forEach(node => {
        nodesToInitiallyExpand.add(node.id); // Expand root
        node.children?.forEach(child => {
            if (child.depth <= 2) { // Limit auto-expansion to 2 levels deep
                nodesToInitiallyExpand.add(child.id);
            }
        });
      });
      expandAllNodes(Array.from(nodesToInitiallyExpand));
    } else if (error) {
        collapseAllNodes(); // Collapse if there's an error
    }
  }, [htmlInput, setDomTree, setSafeHtmlPreview, setParsingError, expandAllNodes, collapseAllNodes]);

  useEffect(() => {
    // Trigger parsing when component mounts if there's existing htmlInput, or when htmlInput changes
    if (htmlInput.trim()) {
        handleParseHtml();
    } else {
        setDomTree(null);
        setSafeHtmlPreview('');
        setParsingError(null);
        collapseAllNodes();
    }
  }, [htmlInput, handleParseHtml, setDomTree, setSafeHtmlPreview, setParsingError, collapseAllNodes]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlInput(content);
        // Clear file input to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }
  }, [setHtmlInput]);

  const handleClearInput = useCallback(() => {
    setHtmlInput('');
    setDomTree(null);
    collapseAllNodes();
    setHighlightedNodeId(null);
    setParsingError(null);
    setSafeHtmlPreview('');
  }, [setHtmlInput, setDomTree, collapseAllNodes, setHighlightedNodeId, setParsingError, setSafeHtmlPreview]);

  const handleExpandAll = useCallback(() => {
    if (domTree) {
      const allIds = getAllNodeIds(domTree);
      expandAllNodes(allIds);
    }
  }, [domTree, getAllNodeIds, expandAllNodes]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto p-4 flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: HTML Input & Controls */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col flex-grow min-h-[300px] lg:min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <LayoutPanelLeft className="w-5 h-5 text-brand-500" /> HTML Input
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <Textarea
                placeholder="Paste your HTML here..."
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                rows={10}
                className="flex-grow font-mono text-sm resize-none"
              />
              <div className="flex items-center justify-between mt-3 gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  <FileUp className="w-4 h-4 mr-2" /> Upload HTML File
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".html,.htm,.txt"
                  className="hidden"
                />
                <div className="flex gap-2">
                    <Button onClick={handleParseHtml} disabled={!htmlInput.trim()} size="sm">
                        <RefreshCcw className="w-4 h-4 mr-2" /> Parse HTML
                    </Button>
                    <Button onClick={handleClearInput} variant="ghost" size="sm">
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                    </Button>
                </div>
              </div>
              {parsingError && (
                <div className="mt-3 flex items-center p-3 rounded-md bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-900">
                  <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>{parsingError}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Safe HTML Preview */}
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-brand-500" /> Safe HTML Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[300px] flex">
              <iframe
                srcDoc={safeHtmlPreview}
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin" // Minimal permissions, no script execution
                title="HTML Preview"
                className="w-full h-full border-0 bg-white dark:bg-zinc-900 rounded-b-md"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: DOM Tree Visualization */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col flex-grow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <LayoutPanelLeft className="w-5 h-5 text-brand-500" /> DOM Tree Visualization
                </span>
                <div className="flex gap-2">
                  <Button onClick={handleExpandAll} variant="outline" size="sm" disabled={!domTree || domTree.length === 0}>
                    Expand All
                  </Button>
                  <Button onClick={collapseAllNodes} variant="outline" size="sm" disabled={!domTree || domTree.length === 0}>
                    Collapse All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto p-0">
              {domTree && domTree.length > 0 ? (
                <div className="py-2 text-sm">
                  {domTree.map((node) => (
                    <DomTreeNodeView
                      key={node.id}
                      node={node}
                      expandedNodes={expandedNodes}
                      highlightedNodeId={highlightedNodeId}
                      toggleNodeExpansion={toggleNodeExpansion}
                      setHighlightedNodeId={setHighlightedNodeId}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                  {htmlInput.trim() ? 'Parsing HTML...' : 'Paste or upload HTML to see the DOM tree.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}