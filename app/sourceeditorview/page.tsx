'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react'; // This will be auto-detected and added to package.json
import { Upload, FileWarning, Trash2, ClipboardCopy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import { cn, truncate } from '@/lib/utils'; // Assuming truncate is available here
import { useHtmlParserStore } from '@/lib/store';

export default function SourceEditorView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    rawHtmlInput,
    setRawHtmlInput,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
    parsingError,
    setParsingError,
  } = useHtmlParserStore();

  const [editorValue, setEditorValue] = useState(rawHtmlInput);
  const [isEditorReady, setIsEditorReady] = useState(false); // State to track if Monaco Editor is loaded
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  // Sync editor content with store when rawHtmlInput changes externally
  // (e.g., from file upload or initial load)
  useEffect(() => {
    if (editorValue !== rawHtmlInput) {
      setEditorValue(rawHtmlInput);
    }
  }, [rawHtmlInput]);

  // Handle editor changes
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      setRawHtmlInput(value);
      // Clear parsing error if user starts typing/editing
      if (parsingError) {
        setParsingError(null);
      }
    }
  }, [setRawHtmlInput, parsingError, setParsingError]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFile(file.name, content);
        setEditorValue(content); // Update editor with file content
        setRawHtmlInput(content); // Ensure store is updated
        setParsingError(null); // Clear any previous parsing error
      };
      reader.readAsText(file);
    }
  }, [setUploadedFile, setRawHtmlInput, setParsingError]);

  // Handle clear file
  const handleClearFile = useCallback(() => {
    clearUploadedFile();
    setEditorValue(''); // Clear editor content
    setRawHtmlInput(''); // Clear store content
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input
    }
    setParsingError(null); // Clear any parsing error
  }, [clearUploadedFile, setRawHtmlInput, setParsingError]);

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(editorValue);
      setShowCopyTooltip(true);
      setTimeout(() => setShowCopyTooltip(false), 2000); // Hide tooltip after 2 seconds
    } catch (err) {
      console.error('Failed to copy HTML: ', err);
      // Optionally show an error message
    }
  }, [editorValue]);

  // Monaco editor options
  const monacoOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on' as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle>Source HTML Editor</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="file-upload" className="sr-only">Upload HTML File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              <Upload className="mr-2 h-4 w-4" /> Upload HTML File
            </Button>

            {uploadedFileName && (
              <div className="flex items-center space-x-2">
                <Badge variant="brand" dot>
                  {truncate(uploadedFileName, 30)}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearFile}
                        aria-label="Clear uploaded file"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear uploaded file</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            <div className="flex-grow" /> {/* Spacer */}
            <TooltipProvider>
              <Tooltip open={showCopyTooltip}> {/* Control tooltip visibility */}
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyToClipboard}
                    aria-label="Copy HTML to clipboard"
                    disabled={!editorValue}
                  >
                    <ClipboardCopy className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showCopyTooltip ? 'Copied!' : 'Copy HTML to clipboard'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator />

          {parsingError && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 border border-red-200 p-3 rounded-md">
              <FileWarning className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{parsingError}</p>
            </div>
          )}

          <div className="flex-grow min-h-[300px] border border-input rounded-md overflow-hidden">
            <Editor
              height="100%"
              language="html"
              theme="vs-dark" // Consider dynamic theme based on system/user preference
              value={editorValue}
              options={monacoOptions}
              onMount={() => setIsEditorReady(true)}
              onChange={handleEditorChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}