'use client';

import { useState, useRef } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardPaste, UploadCloud, FileText, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

export const HtmlInputPasteUpload = () => {
  const { htmlInput, setHtmlInput, editorTheme } = useHtmlParserStore();
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input to clear its value

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null); // Clear previous errors
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'text/html' && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        setFileError('Please upload a valid HTML file (.html or .htm).');
        setHtmlInput(''); // Clear editor if wrong file type
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input visual state
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setHtmlInput(content);
        setFileError(null); // Clear error on successful load
      };
      reader.onerror = () => {
        setFileError('Failed to read file. Please try again.');
        setHtmlInput(''); // Clear editor on error
      };
      reader.readAsText(file);
    } else {
      setHtmlInput(''); // Clear editor if no file selected (e.g., user opened dialog and cancelled)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input visual state
      }
    }
  };

  const clearEditor = () => {
    setHtmlInput('');
    setFileError(null); // Clear any file upload errors as well
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input visually
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <FileText className="h-5 w-5 text-brand" />
          <span>HTML Source</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearEditor}
            className="ml-auto text-muted-foreground hover:text-foreground"
            disabled={!htmlInput && !fileError} // Disable if editor is empty and no file error
          >
            <XCircle className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow pt-0 overflow-hidden">
        <Tabs defaultValue="paste" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4" /> Paste HTML
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4" /> Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="flex-grow mt-0 data-[state=inactive]:hidden">
            <div className="h-full w-full border border-input rounded-md overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="html"
                value={htmlInput}
                onChange={(value) => setHtmlInput(value || '')}
                theme={editorTheme === 'vs-dark' ? 'vs-dark' : 'vs'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  fontSize: 14,
                  lineNumbers: 'on',
                  automaticLayout: true, // Crucial for proper resizing
                  tabSize: 2,
                  insertSpaces: true,
                  detectIndentation: false,
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-grow mt-0 data-[state=inactive]:hidden">
            <div className="flex flex-col items-center justify-center h-full w-full border border-dashed border-input rounded-md p-6 bg-background/50">
              <Label htmlFor="html-upload" className="flex flex-col items-center justify-center text-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors duration-200">
                <UploadCloud className="h-12 w-12 mb-4 text-brand" />
                <span className="text-lg font-medium">Drag & drop HTML file here, or click to upload</span>
                <span className="text-sm mt-1">(Only .html, .htm files)</span>
              </Label>
              <Input
                id="html-upload"
                type="file"
                accept=".html,.htm"
                onChange={handleFileUpload}
                className="sr-only" // Visually hide the input, use the label for click
                ref={fileInputRef}
              />
              {fileError && (
                <p className="text-sm text-red-500 mt-4 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> {fileError}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};