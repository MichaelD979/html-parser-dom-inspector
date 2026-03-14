'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, UploadCloud, FileWarning, Loader2 } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import type { editor } from 'monaco-editor';

/**
 * HtmlSourceEditor component provides an interactive Monaco Editor for HTML input.
 * It includes features like syntax highlighting, line numbers, auto-close tags,
 * error markers, format-on-demand, and file upload capabilities.
 */
export const HtmlSourceEditor = () => {
  const monaco = useMonaco();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const {
    htmlSource,
    editorMarkers,
    isFormatting,
    editorOptions,
    parsingErrors,
    hasParsingError,
    setHtmlSource,
    setIsFormatting,
    setEditorMarkers, // Although we primarily consume markers here, having the setter might be useful for clearing
  } = useHtmlParserStore();

  const [editorLoading, setEditorLoading] = useState(true);

  /**
   * Handles the editor mounting event.
   * @param editorInstance The Monaco editor instance.
   * @param monacoInstance The Monaco global instance.
   */
  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monacoInstance: typeof import('monaco-editor')
  ) => {
    editorRef.current = editorInstance;
    setEditorLoading(false);

    // Apply any initial markers from the store
    if (editorMarkers && editorMarkers.length > 0) {
      monacoInstance.editor.setModelMarkers(editorInstance.getModel()!, 'html-parser', editorMarkers as editor.IMarkerData[]);
    }

    // Configure auto-completion and auto-close tags (if not already handled by 'html' language mode)
    // Monaco's HTML language mode usually handles this well.
    // Additional configurations could go here if needed.
  };

  /**
   * Handles changes in the editor content.
   * @param value The new content of the editor.
   * @param event The editor change event.
   */
  const handleEditorChange = (value: string | undefined) => {
    setHtmlSource(value || '');
  };

  /**
   * Applies markers to the editor when `editorMarkers` from the store changes.
   */
  useEffect(() => {
    if (monaco && editorRef.current && editorRef.current.getModel()) {
      monaco.editor.setModelMarkers(editorRef.current.getModel()!, 'html-parser', editorMarkers as editor.IMarkerData[]);
    }
  }, [editorMarkers, monaco]);


  /**
   * Handles the file upload triggered by the "Load from File" button.
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const fileContent = await file.text();
        setHtmlSource(fileContent);
        // Clear the input value so the same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        console.error('Error reading file:', error);
        // Optionally, display an error message to the user
      }
    }
  };

  /**
   * Formats the HTML content in the editor using Monaco's built-in formatter.
   */
  const formatHtml = async () => {
    if (editorRef.current && monaco) {
      setIsFormatting(true);
      try {
        // Trigger the built-in format action
        await editorRef.current.getAction('editor.action.formatDocument')?.run();
      } catch (error) {
        console.error('Error formatting document:', error);
      } finally {
        setIsFormatting(false);
      }
    }
  };

  const defaultEditorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: true,
    padding: {
      top: 10,
      bottom: 10,
    },
    // Other HTML specific features like auto-closing tags are usually enabled by default
    // when language is set to 'html'.
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            HTML Source Editor
          </div>
          <div className="flex items-center gap-2">
            {hasParsingError && parsingErrors.length > 0 && (
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Badge variant="error" dot className="cursor-help">
                      <FileWarning className="h-3 w-3 mr-1" />
                      Parsing Errors
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">Detected malformed HTML:</p>
                    <ul className="list-disc list-inside text-xs">
                      {parsingErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={formatHtml}
                    disabled={isFormatting || editorLoading || !editorRef.current}
                    aria-label="Format HTML"
                  >
                    {isFormatting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Format HTML</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={editorLoading}
                    aria-label="Upload HTML File"
                  >
                    <UploadCloud className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Load HTML from File</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <input
              type="file"
              ref={fileInputRef}
              accept=".html,.htm,.txt"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Hidden file input for HTML upload"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 p-0 relative min-h-[300px]"> {/* Added min-h to ensure editor has space */}
        {editorLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="sr-only">Loading editor...</span>
          </div>
        )}
        <Editor
          height="100%"
          language="html"
          value={htmlSource}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
          options={{ ...defaultEditorOptions, ...editorOptions }}
          theme="vs-dark" // Using a dark theme for better visibility
        />
      </CardContent>
    </Card>
  );
};