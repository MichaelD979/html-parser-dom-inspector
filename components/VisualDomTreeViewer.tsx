'use client';

import React, { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  ChevronRight,
  ChevronDown,
  Code,
  Text,
  MessageCircle,
  File,
  XCircle,
  Expand,
  Shrink,
  CheckCircle2,
} from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import { DOMTreeNode } from '@/lib/types';

interface DomTreeNodeProps {
  node: DOMTreeNode;
  depth: number;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onMouseEnter: (id: string | null) => void;
  onMouseLeave: () => void;
  isSelected: boolean;
  isHighlighted: boolean;
  // Prop to indicate if the node is an ancestor of the highlighted/selected node
  isAncestorOfHighlightedOrSelected: boolean;
}

const getNodeIcon = (type: DOMTreeNode['type']) => {
  switch (type) {
    case 'element':
      return <Code size={14} className="text-blue-500" />;
    case 'text':
      return <Text size={14} className="text-green-500" />;
    case 'comment':
      return <MessageCircle size={14} className="text-gray-500" />;
    case 'document':
    case 'doctype':
      return <File size={14} className="text-purple-500" />;
    default:
      return <Code size={14} className="text-neutral-500" />;
  }
};

const getNodeColorClasses = (type: DOMTreeNode['type']) => {
  switch (type) {
    case 'element':
      return 'text-blue-700 dark:text-blue-300';
    case 'text':
      return 'text-green-700 dark:text-green-300';
    case 'comment':
      return 'text-gray-600 dark:text-gray-400';
    case 'document':
    case 'doctype':
      return 'text-purple-700 dark:text-purple-300';
    default:
      return 'text-neutral-700 dark:text-neutral-300';
  }
};

// Recursive component to render individual DOM nodes
export const DomTreeNodeRenderer: React.FC<DomTreeNodeProps> = ({
  node,
  depth,
  isExpanded,
  onToggleExpand,
  onMouseEnter,
  onMouseLeave,
  isSelected,
  isHighlighted,
  isAncestorOfHighlightedOrSelected,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const showToggle = hasChildren;

  const handleMouseEnter = () => onMouseEnter(node.id);
  const handleMouseLeave = () => onMouseLeave();

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 cursor-pointer py-0.5 rounded-sm transition-all text-sm',
          {
            'bg-blue-100 dark:bg-blue-900/50': isHighlighted || isSelected,
            'bg-blue-50 dark:bg-blue-950/30': isAncestorOfHighlightedOrSelected && !isHighlighted && !isSelected,
            'hover:bg-accent hover:text-accent-foreground': !isHighlighted && !isSelected,
          }
        )}
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => {
          // Allow clicking on the node itself to select it
          // Clicking the toggle button will handle expansion
          // For simplicity, clicking anywhere on the row toggles expansion and selects
          onToggleExpand(node.id); // Toggle expansion on click
          // We can add a separate click handler for selection if needed.
          // For now, let's say clicking a node both toggles it and makes it selected/highlighted.
          onMouseEnter(node.id); // Also highlight on click
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showToggle ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation(); // Prevent parent div's onClick from firing
              onToggleExpand(node.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown size={14} className="transition-transform duration-200" />
            ) : (
              <ChevronRight size={14} className="transition-transform duration-200" />
            )}
          </Button>
        ) : (
          <span className="w-5 flex-shrink-0 flex items-center justify-center">
            {getNodeIcon(node.type)}
          </span>
        )}

        <span className={cn('font-mono', getNodeColorClasses(node.type))}>
          {node.type === 'element' && `<`}
          <span className="font-semibold">{node.name}</span>
          {node.type === 'element' && node.attributes && (
            <>
              {Object.entries(node.attributes).map(([key, value]) => (
                <Tooltip key={key}>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="ml-1 px-1 py-0 text-xs font-normal text-muted-foreground">
                      {key}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{key}=&quot;{value}&quot;</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </>
          )}
          {node.type === 'element' && `>`}
        </span>

        {node.type === 'text' && node.value && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block ml-1">
            {node.value.trim().length > 0 ? `"${node.value.trim().substring(0, 50)}${node.value.trim().length > 50 ? '...' : ''}"` : '(empty text node)'}
          </span>
        )}

        {node.type === 'comment' && node.value && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block ml-1">
            &lt;!-- {node.value.trim().substring(0, 50)}{node.value.trim().length > 50 ? '...' : ''} --&gt;
          </span>
        )}
      </div>

      {isExpanded && hasChildren && (
        <div className="relative">
          {node.children!.map((child) => (
            <DomTreeNodeRenderer
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={child.id ? isExpanded : false} // Pass expansion state from parent
              onToggleExpand={onToggleExpand}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              isSelected={false} // Selection logic is in the main viewer
              isHighlighted={false} // Highlight logic is in the main viewer
              isAncestorOfHighlightedOrSelected={false} // Ancestor logic is in the main viewer
            />
          ))}
        </div>
      )}
    </>
  );
};


export const VisualDomTreeViewer = () => {
  const {
    htmlSource,
    domTree,
    parsingErrors,
    expandedNodes,
    highlightedNodeId,
    setExpandedNodes,
    setHighlightedNodeId,
    domTreeDepthLimit,
    maxDomTreeNodes,
  } = useHtmlParserStore();

  const handleToggleExpand = useCallback(
    (nodeId: string) => {
      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    },
    [setExpandedNodes]
  );

  const handleExpandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    const collectNodeIds = (nodes: DOMTreeNode[], currentDepth: number) => {
      if (currentDepth > domTreeDepthLimit) return;
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          allNodeIds.add(node.id);
          collectNodeIds(node.children, currentDepth + 1);
        }
      });
    };
    collectNodeIds(domTree, 0);
    setExpandedNodes(allNodeIds);
  }, [domTree, setExpandedNodes, domTreeDepthLimit]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set<string>());
  }, [setExpandedNodes]);

  const isAncestor = useCallback((ancestorId: string, childId: string | null): boolean => {
    if (!childId) return false;

    let currentNode: DOMTreeNode | undefined = undefined;
    const findNode = (nodes: DOMTreeNode[], id: string): DOMTreeNode | undefined => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findNode(node.children, id);
          if (found) return found;
        }
      }
      return undefined;
    };

    currentNode = findNode(domTree, childId);

    while (currentNode) {
      if (currentNode.id === ancestorId) return true;
      // Find parent - this is inefficient O(N) for each lookup.
      // For performance, a map of parentIds or a flat structure with parentId might be better.
      // For now, let's assume `path` property can be used or a simple recursive find.
      // For this example, let's stick to simple parent finding.
      const parentNode = findParent(domTree, currentNode.id);
      currentNode = parentNode;
    }
    return false;
  }, [domTree]);

  const findParent = useCallback((nodes: DOMTreeNode[], targetId: string): DOMTreeNode | undefined => {
    for (const node of nodes) {
      if (node.children) {
        if (node.children.some(child => child.id === targetId)) {
          return node;
        }
        const found = findParent(node.children, targetId);
        if (found) return found;
      }
    }
    return undefined;
  }, []);

  const renderTree = useCallback((nodes: DOMTreeNode[], depth: number) => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        <DomTreeNodeRenderer
          node={node}
          depth={depth}
          isExpanded={expandedNodes.has(node.id)}
          onToggleExpand={handleToggleExpand}
          onMouseEnter={setHighlightedNodeId}
          onMouseLeave={() => setHighlightedNodeId(null)}
          isSelected={false} // No direct selection in this iteration, using highlighted for now
          isHighlighted={highlightedNodeId === node.id}
          isAncestorOfHighlightedOrSelected={highlightedNodeId ? isAncestor(node.id, highlightedNodeId) : false}
        />
        {expandedNodes.has(node.id) && node.children && node.children.length > 0 && (
          <div className="relative">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </React.Fragment>
    ));
  }, [expandedNodes, handleToggleExpand, setHighlightedNodeId, highlightedNodeId, isAncestor]);


  const totalNodeCount = useMemo(() => {
    let count = 0;
    const countNodes = (nodes: DOMTreeNode[]) => {
      count += nodes.length;
      nodes.forEach(node => {
        if (node.children) {
          countNodes(node.children);
        }
      });
    };
    countNodes(domTree);
    return count;
  }, [domTree]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">DOM Tree</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExpandAll} disabled={domTree.length === 0}>
            <Expand size={16} className="mr-1" /> Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={handleCollapseAll} disabled={domTree.length === 0}>
            <Shrink size={16} className="mr-1" /> Collapse All
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 p-0 overflow-auto">
        <TooltipProvider>
          {parsingErrors.length > 0 && (
            <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 flex items-start gap-2 border-b border-red-200 dark:border-red-900">
              <XCircle size={18} className="flex-shrink-0" />
              <div>
                <p className="font-semibold">Parsing Errors Detected:</p>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  {parsingErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {domTree.length === 0 && !htmlSource ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
              <p>
                No HTML parsed yet. <br /> Paste or upload HTML to see the DOM tree.
              </p>
            </div>
          ) : domTree.length === 0 && htmlSource && parsingErrors.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground p-4">
              <p>
                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                HTML parsed successfully, but the resulting DOM tree is empty.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {renderTree(domTree, 0)}
            </div>
          )}

          {totalNodeCount > maxDomTreeNodes && (
            <div className="p-4 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 flex items-start gap-2 border-t border-orange-200 dark:border-orange-900 mt-auto">
              <XCircle size={18} className="flex-shrink-0" />
              <div>
                <p className="font-semibold">Tree Truncation Warning:</p>
                <p className="text-sm">
                  The DOM tree has {totalNodeCount} nodes, exceeding the configured limit of {maxDomTreeNodes}.
                  Displaying a potentially truncated view for performance. Consider enabling virtualization for large trees.
                </p>
              </div>
            </div>
          )}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};