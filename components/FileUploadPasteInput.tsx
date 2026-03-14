'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { FileUp, Wand } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input'; // For hidden file input
import { useHtmlParserStore } from '@/lib/store'; // Assuming this is exported from lib/store

// Temporarily import Prettier for formatting.
// Our pipeline will auto-detect and add it to package.json.
import prettier from 'prettier/standalone';
import parserHtml from 'prettier/parser-html';

// Monaco editor configuration type
type MonacoEditorOptions = Record<string, any>;
// Prettier options type from store
type PrettierOptions = Record<string, any>;

/**
 * React component for file upload and HTML paste input using Monaco Editor.
 * Allows users to paste raw HTML or upload HTML files for parsing.
 */
export const FileUploadPasteInput = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const monaco = useMonaco();

  // Get state and actions from the Zustand store
  const {
    htmlSource,
    setHtmlSource,
    editorMarkers,
    setEditorMarkers, // Assuming this action exists in the store
    editorOptions,
    isFormatting,
    beautifierOptions,
  } = useHtmlParserStore((state) => ({
    htmlSource: state.htmlSource,
    setHtmlSource: state.setHtmlSource,
    editorMarkers: state.editorMarkers,
    setEditorMarkers: state.setEditorMarkers,
    editorOptions: state.editorOptions,
    isFormatting: state.isFormatting,
    beautifierOptions: state.beautifierOptions,
  }));

  // Local state for editor-specific issues (e.g., file read errors, formatting errors)
  const [editorLocalError, setEditorLocalError] = useState<string | null>(null);

  /**
   * Handles changes in the Monaco Editor's content, updating the Zustand store.
   */
  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      setHtmlSource(value || '');
      // Clear local editor error on user input
      setEditorLocalError(null);
      // Clear editor markers (e.g., syntax errors) on user input to allow re-evaluation
      // This is a common pattern; actual parsing errors will be re-added by the parser.
      if (monaco) {
        const model = monaco.editor.getModels()[0];
        if (model) {
          monaco.editor.setModelMarkers(model, 'html-parser', []);
          setEditorMarkers([]); // Update store to reflect cleared markers
        }
      }
    },
    [setHtmlSource, monaco, setEditorMarkers]
  );

  /**
   * Handles HTML file uploads, reading the file content and updating the store.
   */
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setHtmlSource(content);
          setEditorLocalError(null); // Clear errors on new file upload
          // Reset file input value to allow re-uploading the same file
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };
        reader.onerror = () => {
          setEditorLocalError('Failed to read file.');
        };
        reader.readAsText(file);
      }
    },
    [setHtmlSource]
  );

  /**
   * Triggers the hidden file input element click programmatically.
   */
  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Formats the current HTML source using Prettier and updates the store.
   */
  const formatHtml = useCallback(async () => {
    if (!htmlSource) return;

    // TODO: Add an action to `useHtmlParserStore` to set `isFormatting: true`
    // useHtmlParserStore.setState({ isFormatting: true });

    try {
      const formatted = prettier.format(htmlSource, {
        parser: 'html',
        plugins: [parserHtml],
        // Default Prettier options, can be overridden by beautifierOptions from store
        htmlWhitespaceSensitivity: 'css', // Or 'ignore', 'strict'
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: false,
        trailingComma: 'es5',
        bracketSpacing: true,
        bracketSameLine: false,
        arrowParens: 'always',
        // Merge with options from store
        ...beautifierOptions,
      });
      setHtmlSource(formatted);
      setEditorLocalError(null);
    } catch (error: any) {
      setEditorLocalError(`Formatting error: ${error.message}`);
      console.error('Prettier formatting error:', error);
    } finally {
      // TODO: Add an action to `useHtmlParserStore` to set `isFormatting: false`
      // useHtmlParserStore.setState({ isFormatting: false });
    }
  }, [htmlSource, setHtmlSource, beautifierOptions]);

  /**
   * Callback executed when the Monaco Editor is mounted.
   * Can be used for initial setup or custom configurations.
   */
  const handleEditorDidMount = useCallback(
    (editor: any, monacoInstance: any) => {
      // Set initial markers if any exist from a previous parse from the store
      if (editorMarkers.length > 0) {
        monacoInstance.editor.setModelMarkers(
          editor.getModel(),
          'html-parser',
          editorMarkers
        );
      }
    },
    [editorMarkers]
  );

  /**
   * Effect to update Monaco editor markers whenever `editorMarkers` in the store changes.
   */
  useEffect(() => {
    if (monaco) {
      const model = monaco.editor.getModels()[0]; // Assuming a single editor model
      if (model) {
        monaco.editor.setModelMarkers(model, 'html-parser', editorMarkers);
      }
    }
  }, [monaco, editorMarkers]);

  // Default Monaco editor options (can be overridden by store's editorOptions)
  const defaultEditorOptions: MonacoEditorOptions = {
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    autoClosingTags: true,
    autoClosingBrackets: 'always',
    formatOnType: false, // Disabling as it can be resource-intensive; rely on explicit format button.
    formatOnPaste: true,
    matchBrackets: 'always',
    theme: 'vs-dark', // Example: 'vs-dark', 'light'
    // You might load a custom theme here if needed
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>HTML Source Input</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Button onClick={triggerFileUpload} variant="outline" className="flex items-center gap-2">
            <FileUp className="h-4 w-4" />
            Upload HTML File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".html,.htm,.txt"
            onChange={handleFileUpload}
          />
          <Button
            onClick={formatHtml}
            variant="ghost"
            className="flex items-center gap-2"
            disabled={!htmlSource || isFormatting}
          >
            <Wand className="h-4 w-4" />
            {isFormatting ? 'Formatting...' : 'Format HTML'}
          </Button>
        </div>
        <div className="flex-grow relative border rounded-md overflow-hidden">
          {editorLocalError && (
            <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-md shadow-lg">
              {editorLocalError}
            </div>
          )}
          <Editor
            height="100%"
            language="html"
            value={htmlSource}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{ ...defaultEditorOptions, ...editorOptions }} // Merge defaults with store options
            className="rounded-md"
          />
        </div>
        {/* Placeholder for showing HTML parsing errors (e.g., malformed HTML) from the store. */}
        {/*
        {useHtmlParserStore.getState().hasParsingError && useHtmlParserStore.getState().parsingErrors.length > 0 && (
          <div className="text-red-500 text-sm mt-2">
            <strong>Parsing Errors Detected:</strong>
            <ul className="list-disc pl-5">
              {useHtmlParserStore.getState().parsingErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        */}
      </CardContent>
    </Card>
  );
};