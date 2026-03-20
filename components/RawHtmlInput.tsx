'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor, Monaco } from '@monaco-editor/react';
import { UploadCloud, FileText, XCircle } from 'lucide-react';

import { useHtmlParserStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Named export for the component as per rules
export const RawHtmlInput: React.FC = () => {
  const {
    rawHtmlInput,
    setRawHtmlInput,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
  } = useHtmlParserStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null); // Monaco editor instance
  const [editorValue, setEditorValue] = useState<string>(rawHtmlInput);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Update internal editor value when rawHtmlInput from store changes
  useEffect(() => {
    setEditorValue(rawHtmlInput);
  }, [rawHtmlInput]);

  // Debounce the editor's onChange event to update the Zustand store
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update if the value has actually changed to avoid unnecessary re-renders
      if (editorValue !== rawHtmlInput) {
        setRawHtmlInput(editorValue);
        // If user types after uploading a file, clear the uploaded file state
        if (uploadedFileName) {
          clearUploadedFile();
        }
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [editorValue, rawHtmlInput, setRawHtmlInput, uploadedFileName, clearUploadedFile]);

  // Callback for Monaco Editor's onMount
  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    // You can set initial editor options here if needed
    monaco.editor.defineTheme('my-dark-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1f2937', // bg-gray-800 from Tailwind
      },
    });
    monaco.editor.setTheme('my-dark-theme');
  }, []);

  // Callback for Monaco Editor's onChange
  const handleEditorChange = useCallback((value: string | undefined) => {
    setEditorValue(value || '');
  }, []);

  // Handle file input trigger
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection from input
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  // Handle drag over event
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  // Handle drag leave event
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  // Handle file drop event
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // Utility function to read file content
  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFile(file.name, content);
      setEditorValue(content); // Update editor immediately
    };
    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      // Optionally show a toast or error message to the user
    };
    reader.readAsText(file);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Raw HTML Input</CardTitle>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".html,.htm"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            onClick={handleFileUploadClick}
            className="flex items-center gap-2"
          >
            <UploadCloud className="h-4 w-4" /> Upload HTML File
          </Button>

          {uploadedFileName && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="info" dot className="pr-1">
                    <FileText className="mr-1 h-3 w-3" />
                    <span className="max-w-[150px] truncate md:max-w-[200px]">
                      {uploadedFileName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUploadedFile}
                      className="ml-1 h-auto p-0.5"
                    >
                      <XCircle className="h-3 w-3 text-current hover:text-red-500" />
                    </Button>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{uploadedFileName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        <Label htmlFor="raw-html-editor" className="mb-2 text-sm font-medium">
          Paste your HTML here or drag & drop an HTML file below:
        </Label>
        <div
          id="raw-html-editor"
          className={cn(
            'flex-1 border rounded-md overflow-hidden transition-all duration-200',
            isDragOver ? 'border-brand-500 shadow-md shadow-brand-500/30' : 'border-input',
            uploadedFileName ? 'border-dashed border-primary' : ''
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Editor
            height="100%"
            defaultLanguage="html"
            language="html"
            value={editorValue}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              // Use the custom theme defined in onMount
              theme: 'my-dark-theme', 
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              padding: {
                top: 10,
                bottom: 10,
              },
              automaticLayout: true, // Auto-resize editor
              lineNumbersMinChars: 3,
              fontFamily: 'Fira Code, monospace', // Or any other desired font
              fontSize: 14,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};