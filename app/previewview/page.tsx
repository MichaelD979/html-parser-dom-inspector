'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { DOMNode, ExtractionResult } from '@/lib/types';
import { cn, truncate } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Icons
import { Upload, X, ClipboardCopy, ChevronDown, ChevronRight, AlertCircle, Search } from 'lucide-react';

// --- Inline Component: DOMNodeViewer ---
// This component recursively renders a single DOMNode and its children.
interface DOMNodeViewerProps {
  node: DOMNode;
  initialExpanded?: boolean;
}

export const DOMNodeViewer: React.FC<DOMNodeViewerProps> = ({ node, initialExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderAttributes = (attrs: Record<string, string> | undefined) => {
    if (!attrs || Object.keys(attrs).length === 0) return null;
    return (
      <span className="text-blue-500">
        {' '}
        {Object.entries(attrs)
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ')}
      </span>
    );
  };

  const nodeColorClass = (type: DOMNode['type']) => {
    switch (type) {
      case 'element':
        return 'text-green-600';
      case 'text':
        return 'text-purple-600';
      case 'comment':
        return 'text-gray-500 italic';
      case 'doctype':
        return 'text-yellow-600';
      case 'document':
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="flex flex-col text-sm">
      <div
        className={cn(
          'flex items-center group py-0.5 pr-2 rounded-sm',
          hasChildren && 'cursor-pointer hover:bg-gray-100'
        )}
        onClick={toggleExpand}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={14} className="text-gray-500 mr-1" />
          ) : (
            <ChevronRight size={14} className="text-gray-500 mr-1" />
          )
        ) : (
          <span className="w-3 mr-1 inline-block" /> // Placeholder for alignment
        )}
        <span className={cn('font-mono', nodeColorClass(node.type))}>
          {node.type === 'element' && (
            <>
              &lt;{node.tagName}
              {renderAttributes(node.attributes)}
              {node.isSelfClosing ? ' /&gt;' : '&gt;'}
            </>
          )}
          {node.type === 'text' && `#text: "${node.textContent ? truncate(node.textContent.trim(), 50) : ''}"`}
          {node.type === 'comment' && `<!-- ${truncate(node.textContent || '', 50)} -->`}
          {node.type === 'document' && `#document`}
          {node.type === 'doctype' && `<!DOCTYPE ${node.nodeName}>`}
        </span>
        {node.type === 'element' && !node.isSelfClosing && hasChildren && isExpanded && (
          <span className={cn('font-mono ml-auto text-green-600')}>{`</${node.tagName}>`}</span>
        )}
      </div>
      {isExpanded && hasChildren && node.children && (
        <div className="ml-4 border-l border-gray-200">
          {node.children.map((child) => (
            <DOMNodeViewer key={child.id} node={child} />
          ))}
        </div>
      )}
      {node.type === 'element' && !node.isSelfClosing && !hasChildren && (
          <div className="ml-4 font-mono text-green-600">{`</${node.tagName}>`}</div>
      )}
    </div>
  );
};
// --- End Inline Component: DOMNodeViewer ---

export default function PreviewViewPage() {
  const {
    rawHtmlInput,
    setRawHtmlInput,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
    parsedDomTree,
    parsingError,
    selectorInput,
    setSelectorInput,
    extractionResults,
    addExtractionResult,
    clearExtractionResults,
  } = useHtmlParserStore();

  const [activeTab, setActiveTab] = useState('input');
  const [fileError, setFileError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileError('No file selected.');
      return;
    }

    if (!file.type.includes('html') && !file.name.endsWith('.html')) {
      setFileError('Please upload an HTML file.');
      return;
    }

    setFileError(null);
    try {
      const content = await file.text();
      setUploadedFile(file.name, content);
      // Automatically switch to Input tab after upload
      setActiveTab('input');
    } catch (error) {
      console.error('Error reading file:', error);
      setFileError('Failed to read file content.');
    }
  }, [setUploadedFile]);

  // Clear uploaded file and input
  const handleClearFile = useCallback(() => {
    clearUploadedFile();
    setRawHtmlInput('');
    setFileError(null);
  }, [clearUploadedFile, setRawHtmlInput]);

  // Handle manual HTML input change
  const handleHtmlInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawHtmlInput(e.target.value);
    // Clear uploaded file info if user starts typing manually
    if (uploadedFileName) {
      clearUploadedFile();
    }
  }, [setRawHtmlInput, uploadedFileName, clearUploadedFile]);

  // Handle copy to clipboard for raw HTML
  const handleCopyRawHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawHtmlInput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [rawHtmlInput]);

  // Effect to automatically switch to the DOM Tree View tab if parsing is successful
  // This is a design choice to guide the user after they input HTML
  useEffect(() => {
    if (parsedDomTree && !parsingError && activeTab === 'input') {
      setActiveTab('dom-tree');
    }
  }, [parsedDomTree, parsingError, activeTab]);

  // Placeholder for triggering parsing.
  // In a real app, parsing would likely be debounced and trigger a web worker
  // when `rawHtmlInput` changes. For this exercise, we'll just display the
  // `parsedDomTree` and `parsingError` as they are updated by the store.

  // Placeholder for extraction logic
  const handleExtract = useCallback(() => {
    if (!parsedDomTree || !selectorInput.trim()) {
      return;
    }

    // This is a simulated extraction. In a real app, this would involve:
    // 1. Sending rawHtmlInput and selectorInput to a web worker.
    // 2. The worker using DOMParser/querySelector/XPathEvaluator to find elements.
    // 3. The worker returning the extracted values.
    // 4. Updating the `extractionResults` store with the real data.

    const simulatedResults: string[] = [];
    if (rawHtmlInput.includes(selectorInput)) {
        simulatedResults.push(`Found "${selectorInput}" in the HTML.`);
    } else {
        simulatedResults.push(`No exact match for "${selectorInput}" in the HTML. (Simulated)`);
    }
    simulatedResults.push(`Another simulated result for ${selectorInput}`);


    const newExtractionResult: ExtractionResult = {
      selector: selectorInput.trim(),
      values: simulatedResults,
    };
    addExtractionResult(newExtractionResult);
  }, [parsedDomTree, selectorInput, rawHtmlInput, addExtractionResult]);


  return (
    <TooltipProvider>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">HTML Parser & Viewer</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="input">Input HTML</TabsTrigger>
            <TabsTrigger value="dom-tree">DOM Tree View</TabsTrigger>
            <TabsTrigger value="extraction">Extraction</TabsTrigger>
            {/* <TabsTrigger value="cleaning">Cleaning</TabsTrigger> */}
          </TabsList>

          {/* Input HTML Tab */}
          <TabsContent value="input" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Raw HTML Input</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid w-full gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="html-upload" className="flex items-center cursor-pointer p-2 border rounded-md hover:bg-gray-50 transition-colors">
                      <Upload className="mr-2 h-4 w-4" /> Upload HTML File
                    </Label>
                    <Input
                      id="html-upload"
                      type="file"
                      accept=".html"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploadedFileName && (
                      <Badge variant="brand" dot className="flex items-center">
                        {truncate(uploadedFileName, 30)}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleClearFile}
                          className="ml-2 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </Badge>
                    )}
                  </div>
                  {fileError && <p className="text-sm text-red-500">{fileError}</p>}
                </div>

                <div className="relative">
                  <Textarea
                    id="html-input"
                    value={rawHtmlInput}
                    onChange={handleHtmlInputChange}
                    placeholder="Paste your HTML here..."
                    className="min-h-[300px] font-mono text-sm pr-10"
                    aria-label="HTML Input Area"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCopyRawHtml}
                        className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:bg-gray-100"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isCopied ? 'Copied!' : 'Copy to clipboard'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOM Tree View Tab */}
          <TabsContent value="dom-tree" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>DOM Tree Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                {parsingError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-red-800">Parsing Error:</h3>
                      <p className="text-sm">{parsingError}</p>
                    </div>
                  </div>
                )}
                {parsedDomTree && parsedDomTree.length > 0 ? (
                  <div className="max-h-[500px] overflow-y-auto p-2 border rounded-md bg-gray-50">
                    {parsedDomTree.map((node) => (
                      <DOMNodeViewer key={node.id} node={node} initialExpanded={node.depth === 0} />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 border rounded-md">
                    <p>No HTML parsed yet. Please input or upload HTML in the "Input HTML" tab.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extraction Tab */}
          <TabsContent value="extraction" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Extract Elements by Selector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    id="selector-input"
                    placeholder="e.g., div.product-title, a[href], .item p"
                    value={selectorInput}
                    onChange={(e) => setSelectorInput(e.target.value)}
                    className="flex-grow"
                    aria-label="CSS Selector or XPath Input"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleExtract}
                        disabled={!parsedDomTree || !selectorInput.trim()}
                      >
                        <Search className="h-4 w-4 mr-2" /> Extract
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {parsedDomTree ? 'Extract elements based on the selector' : 'Parse HTML first to enable extraction'}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={clearExtractionResults} disabled={extractionResults.length === 0}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear all extraction results</TooltipContent>
                  </Tooltip>
                </div>

                <Separator className="my-4" />

                <h3 className="text-lg font-semibold mb-3">Results:</h3>
                {extractionResults.length > 0 ? (
                  <div className="max-h-[400px] overflow-y-auto p-2 border rounded-md bg-gray-50">
                    {extractionResults.map((result, index) => (
                      <div key={index} className="mb-4 p-3 bg-white rounded-md shadow-sm border">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Selector: <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700">{result.selector}</code>
                          <Badge variant="info" className="ml-2">{result.values.length} matches</Badge>
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-gray-800">
                          {result.values.map((value, valIdx) => (
                            <li key={valIdx} className="text-sm break-all">{truncate(value, 150)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 bg-gray-50 border rounded-md">
                    <p>No extraction results yet. Enter a selector and click "Extract".</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}