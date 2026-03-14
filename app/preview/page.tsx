'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadIcon,
  ExpandIcon,
  MinimizeIcon,
  PlusIcon,
  Trash2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  CodeIcon,
  TextCursorIcon,
  TagIcon,
  HashIcon,
  CircleIcon,
  ScissorsIcon, // Used for extraction
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { cn, truncate } from '@/lib/utils';
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode, DOMNodeType, ExtractionAttribute, ExtractedElement } from '@/lib/types';

// Global counter for generating unique node IDs during parsing
let nodeIdCounter = 0;

/**
 * Converts a native DOM Node into a `DOMTreeNode` structure.
 * This function recursively processes the DOM tree.
 */
function convertNodeToDOMTreeNode(
  node: Node,
  parentNodeId: string | undefined,
  depth: number,
  index: number
): DOMTreeNode | null {
  // Skip empty text nodes for a cleaner tree
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() === '') {
    return null;
  }

  const id = `node-${nodeIdCounter++}`; // Assign a unique ID

  const domNode: DOMTreeNode = {
    id: id,
    type: 'text', // Default type, will be updated
    nodeValue: node.nodeValue || undefined,
    textContent: node.textContent || undefined,
    parentNodeId: parentNodeId,
    depth: depth,
    index: index,
  };

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement;
    domNode.type = 'element';
    domNode.tagName = element.tagName.toLowerCase();
    domNode.attributes = {};
    Array.from(element.attributes).forEach(attr => {
      if (domNode.attributes) {
        domNode.attributes[attr.name] = attr.value;
      }
    });

    const children: DOMTreeNode[] = [];
    Array.from(element.childNodes).forEach((childNode, childIndex) => {
      const convertedChild = convertNodeToDOMTreeNode(childNode, id, depth + 1, childIndex);
      if (convertedChild) {
        children.push(convertedChild);
      }
    });
    domNode.children = children.length > 0 ? children : undefined;
    domNode.outerHtml = element.outerHTML;
  } else if (node.nodeType === Node.TEXT_NODE) {
    domNode.type = 'text';
    domNode.nodeValue = node.nodeValue || '';
    domNode.textContent = node.nodeValue || '';
  } else if (node.nodeType === Node.COMMENT_NODE) {
    domNode.type = 'comment';
  } else if (node.nodeType === Node.DOCUMENT_TYPE_NODE) {
    domNode.type = 'doctype';
    domNode.nodeValue = `<!DOCTYPE ${(node as DocumentType).name}>`;
  } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
    domNode.type = 'cdata';
  }

  return domNode;
}

/**
 * Parses an HTML string into a `DOMTreeNode` array.
 * Resets the node ID counter on each call.
 */
function parseHtmlToDomTree(html: string): { domTree: DOMTreeNode[]; error: string | null } {
  nodeIdCounter = 0; // Reset counter for each parsing operation
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const parserError = doc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      const errorText = parserError[0].textContent || 'Unknown parsing error';
      return { domTree: [], error: `HTML parsing error: ${errorText}` };
    }

    const domTree: DOMTreeNode[] = [];
    Array.from(doc.childNodes).forEach((node, index) => {
      const convertedNode = convertNodeToDOMTreeNode(node, undefined, 0, index);
      if (convertedNode) {
        domTree.push(convertedNode);
      }
    });

    return { domTree, error: null };
  } catch (e: any) {
    console.error("Error parsing HTML:", e);
    return { domTree: [], error: `Failed to parse HTML: ${e.message}` };
  }
}

/**
 * Recursively collects all node IDs from a DOMTreeNode array.
 * Used for the "Expand All" functionality.
 */
function getAllNodeIds(nodes: DOMTreeNode[]): string[] {
  let ids: string[] = [];
  nodes.forEach(node => {
    ids.push(node.id);
    if (node.children) {
      ids = ids.concat(getAllNodeIds(node.children));
    }
  });
  return ids;
}

/**
 * Inline component for rendering a single DOM tree node.
 */
interface DomTreeNodeComponentProps {
  node: DOMTreeNode;
  expandedNodes: Set<string>;
  highlightedNodeId: string | null;
  toggleNodeExpansion: (nodeId: string) => void;
  setHighlightedNodeId: (nodeId: string | null) => void;
}

const DomTreeNodeComponent = ({
  node,
  expandedNodes,
  highlightedNodeId,
  toggleNodeExpansion,
  setHighlightedNodeId,
}: DomTreeNodeComponentProps) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isHighlighted = highlightedNodeId === node.id;

  const getBadgeVariant = (type: DOMNodeType) => {
    switch (type) {
      case 'element': return 'brand';
      case 'text': return 'info';
      case 'comment': return 'warning';
      case 'doctype': return 'success';
      case 'cdata': return 'error';
      default: return 'default';
    }
  };

  const getIconForType = (type: DOMNodeType) => {
    switch (type) {
      case 'element': return <CodeIcon className="h-3 w-3" />;
      case 'text': return <TextCursorIcon className="h-3 w-3" />;
      case 'comment': return <CodeIcon className="h-3 w-3" />;
      case 'doctype': return <TagIcon className="h-3 w-3" />;
      case 'cdata': return <CodeIcon className="h-3 w-3" />;
      default: return <HashIcon className="h-3 w-3" />;
    }
  };

  return (
    <div
      className={cn(
        'group cursor-pointer py-1 pr-2 rounded-md transition-colors duration-150',
        isHighlighted ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      )}
      style={{ marginLeft: node.depth * 16 }} // Indentation based on depth
      onMouseEnter={() => setHighlightedNodeId(node.id)}
      onMouseLeave={() => setHighlightedNodeId(null)}
      onClick={() => hasChildren && toggleNodeExpansion(node.id)}
    >
      <div className="flex items-center gap-1">
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => { e.stopPropagation(); toggleNodeExpansion(node.id); }}
          >
            {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
          </Button>
        ) : (
          <span className="inline-block w-5 h-5 flex items-center justify-center text-gray-400">
            {node.type === 'text' ? <CircleIcon className="h-3 w-3 fill-current" /> : null}
          </span>
        )}

        <Badge variant={getBadgeVariant(node.type)} className="capitalize px-1.5 py-0.5">
          {getIconForType(node.type)} <span className="ml-1">{node.type}</span>
        </Badge>

        {node.tagName && (
          <span className="font-semibold text-gray-800 dark:text-gray-200">{`<${node.tagName}>`}</span>
        )}

        {node.attributes && Object.keys(node.attributes).length > 0 && (
          <div className="flex flex-wrap gap-1 ml-2">
            {Object.entries(node.attributes).map(([key, value]) => (
              <TooltipProvider key={key}>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs">
                      {key}=<span className="italic">{`"${truncate(value, 15)}"`}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{`${key}="${value}"`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}

        {node.nodeValue && node.type !== 'element' && (
          <span className="text-gray-600 dark:text-gray-400 ml-2 italic text-sm">
            {truncate(node.nodeValue.trim(), 50)}
          </span>
        )}

        {node.tagName && !hasChildren && ( // Only show closing tag if no children AND it's an element
          <span className="text-gray-800 dark:text-gray-200 ml-1">{`</${node.tagName}>`}</span>
        )}
      </div>

      {isExpanded && node.children && node.children.length > 0 && (
        <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
          {node.children.map((child) => (
            <DomTreeNodeComponent
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

export default function PreviewPage() {
  const {
    htmlInput, setHtmlInput,
    domTree, expandedNodes, highlightedNodeId, parsingError,
    setDomTree, toggleNodeExpansion, expandAllNodes, collapseAllNodes, setHighlightedNodeId, setParsingError,
    safeHtmlPreview, setSafeHtmlPreview,
    extractionRules, extractedData, extractionLoading,
    addExtractionRule, updateExtractionRule, removeExtractionRule, setExtractedData, setExtractionLoading,
  } = useHtmlParserStore();

  const [activeTab, setActiveTab] = useState<string>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to parse and sanitize HTML whenever htmlInput changes
  useEffect(() => {
    if (htmlInput) {
      // 1. Parse HTML for DOM Tree
      const { domTree: parsedDomTree, error } = parseHtmlToDomTree(htmlInput);
      setDomTree(parsedDomTree);
      setParsingError(error);

      // 2. Sanitize HTML for Safe Preview
      const sanitized = DOMPurify.sanitize(htmlInput, {
        USE_PROFILES: { html: true },
        // Add more security options as needed
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onmouseover'],
      });
      setSafeHtmlPreview(sanitized);
    } else {
      setDomTree(null);
      setParsingError(null);
      setSafeHtmlPreview('');
    }
  }, [htmlInput, setDomTree, setParsingError, setSafeHtmlPreview]);

  // Handler for file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlInput(content);
        event.target.value = ''; // Clear file input
      };
      reader.onerror = (e) => {
        console.error("Error reading file:", e);
        setParsingError("Failed to read file.");
      };
      reader.readAsText(file);
    }
  }, [setHtmlInput, setParsingError]);

  // Handler to perform extraction based on rules
  const handleExtract = useCallback(() => {
    setExtractionLoading(true);
    const results: ExtractedElement[] = [];
    let tempDoc: Document | null = null;

    try {
      if (!htmlInput) {
        setExtractedData([]);
        return;
      }

      const parser = new DOMParser();
      tempDoc = parser.parseFromString(htmlInput, 'text/html');

      extractionRules.forEach(rule => {
        if (!rule.selector) return;

        try {
          const elements = tempDoc?.querySelectorAll(rule.selector);
          if (elements) {
            elements.forEach((el) => {
              let value: string | null = null;
              if (rule.attribute === 'text') {
                value = el.textContent;
              } else if (rule.attribute === 'html') {
                value = el.innerHTML;
              } else {
                value = el.getAttribute(rule.attribute);
              }

              results.push({
                id: uuidv4(),
                ruleId: rule.id,
                selector: rule.selector,
                attribute: rule.attribute,
                value: value,
                // In a real app, nodeId would link to the actual parsed DOMTreeNode.
                // For this simulation, we use a placeholder.
                nodeId: `temp-extracted-node-${uuidv4()}`,
              });
            });
          }
        } catch (ruleError: any) {
          console.warn(`Error applying extraction rule "${rule.label}" (${rule.selector}):`, ruleError);
          // In a production app, you might want to log this or display a specific error.
        }
      });
    } catch (parseError: any) {
      console.error("Error during extraction HTML parsing:", parseError);
      setParsingError(`Failed to parse HTML for extraction: ${parseError.message}`);
    } finally {
      // Simulate an async operation
      setTimeout(() => {
        setExtractedData(results);
        setExtractionLoading(false);
      }, 500);
    }
  }, [htmlInput, extractionRules, setExtractedData, setExtractionLoading, setParsingError]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="container mx-auto grid gap-6">
        <h1 className="text-3xl font-bold tracking-tight">HTML Parsing Workbench</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Parse, visualize, extract, clean, and convert HTML documents.
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="dom-tree">DOM Tree</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="extraction">Extraction</TabsTrigger>
          </TabsList>

          {/* Input Tab */}
          <TabsContent value="input">
            <Card>
              <CardHeader>
                <CardTitle>HTML Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label="Paste your HTML here"
                  placeholder="<!DOCTYPE html><html><body>...</body></html>"
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".html,.htm"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon className="mr-2 h-4 w-4" /> Upload HTML File
                  </Button>
                  <Button variant="outline" onClick={() => setHtmlInput('')}>
                    Clear Input
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOM Tree Tab */}
          <TabsContent value="dom-tree">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>DOM Tree Visualization</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => domTree && expandAllNodes(getAllNodeIds(domTree))}>
                    <ExpandIcon className="mr-2 h-4 w-4" /> Expand All
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAllNodes}>
                    <MinimizeIcon className="mr-2 h-4 w-4" /> Collapse All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {parsingError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900 dark:border-red-600 dark:text-red-100" role="alert">
                    <strong className="font-bold">Parsing Error: </strong>
                    <span className="block sm:inline">{parsingError}</span>
                  </div>
                )}
                {domTree && domTree.length > 0 ? (
                  <div className="overflow-auto max-h-[600px] font-mono text-sm border rounded-md p-2 bg-white dark:bg-gray-900">
                    {domTree.map(node => (
                      <DomTreeNodeComponent
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
                  <p className="text-gray-500 dark:text-gray-400">Paste HTML to see the DOM tree.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Safe HTML Preview</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Renders the sanitized HTML content in a sandboxed iframe. Scripts and potentially malicious tags are disabled.
                </p>
              </CardHeader>
              <CardContent>
                {safeHtmlPreview ? (
                  <iframe
                    title="HTML Preview"
                    srcDoc={safeHtmlPreview}
                    sandbox="" // Crucial for security: disables scripts, forms, etc.
                    className="w-full h-[600px] border rounded-md bg-white dark:bg-gray-800"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Paste HTML to see a safe preview.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extraction Tab */}
          <TabsContent value="extraction">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>HTML Element Extraction</CardTitle>
                <Button onClick={() => addExtractionRule({ id: uuidv4(), selector: '', attribute: 'text', label: '' })}>
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Rule
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {extractionRules.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">Add rules to extract data from your HTML.</p>
                )}
                <div className="space-y-4">
                  {extractionRules.map((rule) => (
                    <div key={rule.id} className="flex flex-col md:flex-row items-end gap-2 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-grow w-full md:w-auto">
                        <Input
                          label="Selector (CSS)"
                          placeholder="div.product-name"
                          value={rule.selector}
                          onChange={(e) => updateExtractionRule(rule.id, { selector: e.target.value })}
                        />
                        <Select
                          value={rule.attribute}
                          onValueChange={(value: ExtractionAttribute) => updateExtractionRule(rule.id, { attribute: value })}
                        >
                          <SelectTrigger className="w-full">
                            <Label>Extract</Label>
                            <SelectValue placeholder="Select attribute" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text Content</SelectItem>
                            <SelectItem value="html">Inner HTML</SelectItem>
                            <SelectItem value="href">Attribute: href</SelectItem>
                            <SelectItem value="src">Attribute: src</SelectItem>
                            <SelectItem value="id">Attribute: id</SelectItem>
                            <SelectItem value="class">Attribute: class</SelectItem>
                            <SelectItem value="data-id">Attribute: data-id</SelectItem>
                            {/* Can expand with more common attributes */}
                          </SelectContent>
                        </Select>
                        <Input
                          label="Label"
                          placeholder="Product Name"
                          value={rule.label}
                          onChange={(e) => updateExtractionRule(rule.id, { label: e.target.value })}
                        />
                      </div>
                      <Button variant="destructive" size="icon" onClick={() => removeExtractionRule(rule.id)} className="w-full md:w-auto mt-2 md:mt-0">
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {extractionRules.length > 0 && (
                  <div className="mt-4">
                    <Button onClick={handleExtract} loading={extractionLoading} disabled={!htmlInput}>
                      <ScissorsIcon className="mr-2 h-4 w-4" /> Run Extraction
                    </Button>
                  </div>
                )}

                {extractedData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Extracted Data</h3>
                    <div className="border rounded-md overflow-hidden bg-white dark:bg-gray-900">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Label
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Selector
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Attribute/Content
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {extractedData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                {extractionRules.find(r => r.id === item.ruleId)?.label || item.selector}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {truncate(item.selector, 30)}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {item.attribute === 'text' ? 'Text Content' : item.attribute === 'html' ? 'Inner HTML' : `Attribute: ${item.attribute}`}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-xs overflow-hidden text-ellipsis">
                                <span className="block max-h-16 overflow-hidden">{item.value || (item.value === null ? '<null>' : '<empty>')}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}