'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { UploadCloud, FileText, CheckCircle, XCircle, Wand2 } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

// Placeholder for Monaco and Prettier configuration if not available via store.
// In a real scenario, these would likely be managed by the store or a dedicated config service.
const defaultMonacoOptions = {
  minimap: { enabled: false },
  // Additional Monaco options will come from editorOptions in store
};

export default function MainToolPage() {
  const {
    htmlSource,
    setHtmlSource,
    editorMarkers,
    editorOptions,
    parsingErrors,
    hasParsingError,
    isFormatting,
    formatHtml, // Assuming this is an action that formats and updates htmlSource
    parseHtml, // Assuming this is an action that parses and updates parsedDocument, domTree, parsingErrors
  } = useHtmlParserStore();

  const editorRef = useRef<any>(null); // Monaco editor instance
  const [activeTab, setActiveTab] = useState('editor');

  // Effect to re-parse HTML whenever htmlSource changes
  useEffect(() => {
    parseHtml(htmlSource);
  }, [htmlSource, parseHtml]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    // Set up Monaco HTML specific features
    monaco.languages.html.htmlDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [], // No specific schema, validate generic HTML
    });
    monaco.languages.html.htmlDefaults.setOptions({
      format: true, // Enable built-in formatter for HTML
      suggest: true, // Enable auto-completion
      autoClosingTags: true,
      autoCreateQuotes: true,
      autoSurround: true,
      folding: true,
      matchBrackets: true,
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    setHtmlSource(value || '');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlSource(content);
      };
      reader.readAsText(file);
    }
  };

  const handleFormat = async () => {
    if (editorRef.current && formatHtml) {
      // Assuming formatHtml is an async action that updates htmlSource directly
      await formatHtml(htmlSource);
    }
  };

  // Apply Monaco markers when editorMarkers in store changes
  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        // Clear existing markers
        // monaco.editor.setModelMarkers(model, 'owner', []);
        // Set new markers
        // This assumes editorMarkers are in the format expected by Monaco (e.g., { startLineNumber, endLineNumber, ... })
        // For now, it's a placeholder. The `lib/store.ts` would need to properly map DOMParser errors to Monaco markers.
      }
    }
  }, [editorMarkers]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full p-4 overflow-hidden">
        <h1 className="text-3xl font-bold mb-4">HTML Parsing Workbench</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow">
          <TabsList className="grid w-full grid-cols-5 md:w-fit mb-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="dom-tree">DOM Tree</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="extractor">Extractor</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex flex-col flex-grow">
            <Card className="flex flex-col flex-grow overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  HTML Source
                  <div className="flex items-center space-x-2">
                    {hasParsingError ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="error" dot className="cursor-help">
                            <XCircle className="h-4 w-4 mr-1" /> Malformed HTML
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Parsing errors detected.</p>
                          {parsingErrors.slice(0, 3).map((error, index) => (
                            <p key={index} className="text-xs text-red-300">{error}</p>
                          ))}
                          {parsingErrors.length > 3 && <p className="text-xs text-red-300">...</p>}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="success" dot>
                        <CheckCircle className="h-4 w-4 mr-1" /> Valid HTML
                      </Badge>
                    )}
                    <Button
                      onClick={handleFormat}
                      variant="outline"
                      size="sm"
                      disabled={isFormatting}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      {isFormatting ? 'Formatting...' : 'Format HTML'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow p-0">
                <div className="flex flex-col lg:flex-row gap-4 p-4 pb-0">
                  <div className="flex-1">
                    <Label htmlFor="paste-html" className="sr-only">Paste HTML</Label>
                    <Textarea
                      id="paste-html"
                      placeholder="Paste your HTML here or upload a file below."
                      value={htmlSource}
                      onChange={(e) => setHtmlSource(e.target.value)}
                      rows={5}
                      className="resize-y min-h-[100px] mb-2 font-mono text-xs"
                    />
                  </div>
                  <Separator orientation="vertical" className="hidden lg:flex" />
                  <Separator orientation="horizontal" className="lg:hidden" />
                  <div className="flex-none flex flex-col items-center justify-center p-2 border border-dashed rounded-md bg-muted/20 text-muted-foreground w-full lg:w-1/4 min-h-[100px]">
                    <Input
                      id="html-file-upload"
                      type="file"
                      accept=".html,.htm,.txt"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                    <Label
                      htmlFor="html-file-upload"
                      className="flex flex-col items-center justify-center h-full w-full cursor-pointer p-4 text-center"
                    >
                      <UploadCloud className="h-8 w-8 mb-2" />
                      <span className="text-sm font-medium">Click to upload or drag & drop</span>
                      <span className="text-xs text-gray-500">HTML files (.html, .htm)</span>
                    </Label>
                  </div>
                </div>

                <div className="flex-grow pt-4">
                  <Editor
                    height="100%"
                    language="html"
                    value={htmlSource}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{ ...defaultMonacoOptions, ...editorOptions }}
                    theme="vs-dark" // Or 'light' based on app theme
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="dom-tree" className="flex-grow">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>DOM Tree Viewer</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Visual representation of the parsed HTML DOM.
                  {hasParsingError && (
                    <span className="text-red-500 ml-2">
                      (Errors detected, tree might be incomplete)
                    </span>
                  )}
                </p>
                {/* DOM Tree Component would go here */}
                <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 h-96 overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(useHtmlParserStore.getState().domTree, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="flex-grow">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Safe HTML Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  A sandboxed iframe to safely preview your HTML output.
                  {useHtmlParserStore.getState().isSanitizing && (
                    <span className="text-gray-500 ml-2">(Sanitizing...)</span>
                  )}
                </p>
                {/* Iframe for preview goes here */}
                <div className="mt-4 border rounded-md overflow-hidden" style={{ height: 'calc(100% - 80px)' }}>
                  <iframe
                    srcDoc={useHtmlParserStore.getState().previewHtml}
                    title="HTML Preview"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    className="w-full h-full border-0"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extractor" className="flex-grow">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Element Extractor</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Use CSS selectors or XPath to extract specific elements or data.</p>
                <div className="mt-4">
                  <Label htmlFor="selector-input">Selector</Label>
                  <Input
                    id="selector-input"
                    placeholder="e.g., div.product-card > h2.title"
                    value={useHtmlParserStore.getState().selectorInput}
                    onChange={(e) =>
                      useHtmlParserStore.getState().selectorInput = e.target.value
                    } // This is not how Zustand actions work, need proper setter
                    className="mt-1"
                  />
                  <Button className="mt-2">Extract</Button>
                </div>
                <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800 h-60 overflow-auto">
                  <pre className="text-sm">
                    {JSON.stringify(useHtmlParserStore.getState().extractionResults, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="flex-grow">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Settings & Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Configure parsing, sanitization, and editor options.</p>
                {/* Example of a setting, others would follow */}
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Parsing Options</Label>
                    {/* Switches for removeComments, removeEmptyTextNodes, etc. */}
                    <div className="flex items-center space-x-2 mt-2">
                      {/* Placeholder for Switch component */}
                      <span className="text-sm">Remove Comments</span>
                      {/* <Switch checked={parsingOptions.removeComments} onCheckedChange={(val) => setParsingOption('removeComments', val)} /> */}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <Label>Editor Options</Label>
                    {/* Inputs/Switches for editor settings */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}