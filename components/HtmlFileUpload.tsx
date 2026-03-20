'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { FileUp, ClipboardPaste, XCircle, FileInput } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export const HtmlFileUpload = () => {
  const {
    rawHtmlInput,
    setRawHtmlInput,
    uploadedFileName,
    setUploadedFile,
    clearUploadedFile,
  } = useHtmlParserStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handles the change event for the file input.
   * Reads the selected HTML file and updates the store.
   * @param event The change event from the file input.
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('text/html')) {
        // Optionally add a user-facing error here
        console.error('Only HTML files are allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setUploadedFile(file.name, content);
      };
      reader.readAsText(file);
    }
  };

  /**
   * Clears the currently uploaded file from the store and resets the file input element.
   */
  const handleClearFile = (): void => {
    clearUploadedFile();
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input visually
    }
  };

  /**
   * Clears the raw HTML input content in the store.
   */
  const handleClearRawInput = (): void => {
    setRawHtmlInput('');
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileUp className="h-5 w-5 text-brand" /> HTML Source Input
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 pt-0">
        <Tabs defaultValue="paste" className="flex-grow flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">
              <ClipboardPaste className="h-4 w-4 mr-2" /> Paste HTML
            </TabsTrigger>
            <TabsTrigger value="upload">
              <FileUp className="h-4 w-4 mr-2" /> Upload File
            </TabsTrigger>
          </TabsList>

          {/* Paste HTML Tab */}
          <TabsContent value="paste" className="flex-grow flex flex-col mt-4">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="raw-html-input" className="text-sm font-medium text-gray-700">
                Paste your HTML below:
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRawInput}
                disabled={!rawHtmlInput}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-4 w-4 mr-1" /> Clear Input
              </Button>
            </div>
            <Textarea
              id="raw-html-input"
              placeholder="Paste your HTML content here..."
              value={rawHtmlInput}
              onChange={(e) => setRawHtmlInput(e.target.value)}
              className="flex-grow font-mono text-sm resize-none"
            />
          </TabsContent>

          {/* Upload File Tab */}
          <TabsContent value="upload" className="flex-grow flex flex-col mt-4">
            <Label htmlFor="html-file-upload" className="text-sm font-medium text-gray-700 mb-2">
              Select an HTML file to upload:
            </Label>
            <div className="flex items-center gap-2 mb-4">
              <Input
                id="html-file-upload"
                type="file"
                accept=".html, .htm"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="flex-grow file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:py-1.5 file:px-3 file:mr-2 cursor-pointer"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFile}
                disabled={!uploadedFileName}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-4 w-4 mr-1" /> Clear File
              </Button>
            </div>

            {uploadedFileName ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Badge variant="brand" dot>
                  {uploadedFileName}
                </Badge>
                <span className="text-gray-500">File loaded. Content available in 'Paste HTML' tab.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 italic mt-2">
                <FileInput className="h-4 w-4 text-gray-400" /> No file selected.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};