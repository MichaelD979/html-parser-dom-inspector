'use client';

import React, { useCallback, useMemo } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode, DOMNodeType } from '@/lib/types';
import { cn, truncate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Code,
  Braces,
  Tag,
  AlertTriangle,
  Expand,
  Shrink,
  MessageCircleQuestion,
  GitFork,
} from 'lucide-react';

/**
 * DomTreeVisualization component for displaying the parsed HTML DOM tree.
 * Allows users to collapse/expand nodes, highlight selected nodes, and view node details.
 */
export const DomTreeVisualization = () => {
  const {
    domTree,
    expandedNodes,
    highlightedNodeId,
    parsingError,
    toggleNodeExpansion,
    expandAllNodes,
    collapseAllNodes,
    setHighlightedNodeId,
  } = useHtmlParserStore();

  // Memoize all node IDs for the "Expand All" functionality
  const allNodeIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (nodes: DOMTreeNode[]) => {
      nodes.forEach(node => {
        ids.push(node.id);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    if (domTree) {
      traverse(domTree);
    }
    return ids;
  }, [domTree]);

  // Handler to expand all nodes
  const handleExpandAll = useCallback(() => {
    expandAllNodes(allNodeIds);
  }, [expandAllNodes, allNodeIds]);

  /**
   * Recursively renders a single DOM tree node and its children.
   * This is a memoized render function to optimize performance when rendering large trees.
   */
  const renderNode = useCallback(({
    node,
    expandedNodes,
    highlightedNodeId,
    toggleNodeExpansion,
    setHighlightedNodeId,
  }: {
    node: DOMTreeNode;
    expandedNodes: Set<string>;
    highlightedNodeId: string | null;
    toggleNodeExpansion: (nodeId: string) => void;
    setHighlightedNodeId: (nodeId: string | null) => void;
  }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHighlighted = highlightedNodeId === node.id;

    // Determine icon and color based on node type
    let NodeIcon: React.ElementType;
    let nodeTypeClass = '';
    switch (node.type) {
      case 'element':
        NodeIcon = Tag;
        nodeTypeClass = 'text-blue-500';
        break;
      case 'text':
        NodeIcon = FileText;
        nodeTypeClass = 'text-green-500';
        break;
      case 'comment':
        NodeIcon = MessageCircleQuestion;
        nodeTypeClass = 'text-gray-500';
        break;
      case 'doctype':
        NodeIcon = Braces;
        nodeTypeClass = 'text-purple-500';
        break;
      case 'cdata':
        NodeIcon = GitFork;
        nodeTypeClass = 'text-orange-500';
        break;
      default:
        NodeIcon = AlertTriangle;
        nodeTypeClass = 'text-red-500';
    }

    // Handles clicking on the node row to highlight it
    const handleNodeClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      setHighlightedNodeId(node.id);
    };

    // Handles clicking on the expand/collapse icon
    const handleToggleExpansion = (event: React.MouseEvent) => {
      event.stopPropagation();
      toggleNodeExpansion(node.id);
    };

    return (
      <div key={node.id} className="text-sm">
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded-md transition-colors duration-100",
            {
              'bg-blue-100 dark:bg-blue-900/40': isHighlighted,
              'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer': !isHighlighted,
            }
          )}
          style={{ paddingLeft: `${node.depth * 16}px` }} // Indent based on depth
          onClick={handleNodeClick}
        >
          {hasChildren ? (
            <span
              className="cursor-pointer flex-shrink-0"
              onClick={handleToggleExpansion}
              aria-expanded={isExpanded}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          ) : (
            // Spacer to align non-children nodes with their parents' icon position
            <span className="w-4 h-4 flex-shrink-0" />
          )}

          <NodeIcon size={16} className={cn("flex-shrink-0", nodeTypeClass)} />

          {node.type === 'element' && (
            <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
              &lt;{node.tagName}
            </span>
          )}

          {/* Render attributes as badges for element nodes */}
          {node.type === 'element' && node.attributes && Object.keys(node.attributes).map(attrName => (
            <TooltipProvider key={`${node.id}-${attrName}`}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="default" className="ml-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 cursor-help">
                    {attrName}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  <p>{attrName}=&quot;{node.attributes![attrName]}&quot;</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}

          {node.type === 'element' && (
            <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">
              &gt;
            </span>
          )}

          {/* Render truncated text content for text nodes */}
          {node.type === 'text' && node.nodeValue && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-mono text-green-700 dark:text-green-300 ml-1">
                    "{truncate(node.nodeValue.trim(), 50)}"
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-sm">
                  <p>{node.nodeValue.trim()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Render truncated node value for comment, doctype, and cdata nodes */}
          {(node.type === 'comment' || node.type === 'doctype' || node.type === 'cdata') && node.nodeValue && (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="font-mono text-gray-600 dark:text-gray-400 ml-1 italic">
                    {truncate(node.nodeValue.trim(), 50)}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-sm">
                  <p>{node.nodeValue.trim()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Recursively render children if the node is expanded and has children */}
        {isExpanded && hasChildren && (
          <div className="border-l border-gray-200 dark:border-gray-800 ml-1">
            {node.children!.map((child) => renderNode({
              node: child,
              expandedNodes,
              highlightedNodeId,
              toggleNodeExpansion,
              setHighlightedNodeId
            }))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, highlightedNodeId, toggleNodeExpansion, setHighlightedNodeId]); // Dependencies for useCallback

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          DOM Tree Visualization
        </CardTitle>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleExpandAll}
                  disabled={!domTree || domTree.length === 0}
                >
                  <Expand className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand All Nodes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={collapseAllNodes}
                  disabled={!domTree || domTree.length === 0}
                >
                  <Shrink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Collapse All Nodes</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 p-4 overflow-auto text-sm">
        {parsingError && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800 p-3 rounded-md mb-4">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">Parsing Error: {parsingError}</p>
          </div>
        )}

        {!domTree || domTree.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Paste HTML content or upload a file to visualize the DOM tree.
          </p>
        ) : (
          <div className="space-y-1">
            {domTree.map((node) =>
              renderNode({
                node,
                expandedNodes,
                highlightedNodeId,
                toggleNodeExpansion,
                setHighlightedNodeId
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};