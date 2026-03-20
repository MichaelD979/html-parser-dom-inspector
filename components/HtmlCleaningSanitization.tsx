import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { RefreshCcwIcon, Trash2Icon, ShieldCheckIcon, InfoIcon } from 'lucide-react';
import { useHtmlParserStore } from '@/lib/store';
import DOMPurify from 'dompurify'; // Will be auto-added to package.json

// Critical for Next.js 15 app router and client-side interactivity
'use client';

export const HtmlCleaningSanitization = () => {
  const {
    rawHtmlInput,
    cleanHtmlOutput,
    isHtmlSanitized,
    sanitizationConfig,
    setCleanHtmlOutput,
    setIsHtmlSanitized,
    setSanitizationConfig,
    setRawHtmlInput,
  } = useHtmlParserStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [sanitizationError, setSanitizationError] = useState<string | null>(null);

  // Memoize DOMPurify instance (though it's stateless, good practice)
  // Ensures the same DOMPurify object is used across renders
  const purify = useMemo(() => DOMPurify, []);

  /**
   * Performs the HTML sanitization using DOMPurify.
   * Wrapped in useCallback for memoization and stability in useEffect dependencies.
   */
  const sanitizeHtml = useCallback(async (html: string, config: DOMPurify.Config) => {
    setIsProcessing(true);
    setSanitizationError(null);
    let sanitizedContent = '';
    try {
      // DOMPurify.sanitize is synchronous. Using Promise.resolve to align
      // with potential future async operations (e.g., Web Workers) and consistent API.
      sanitizedContent = await Promise.resolve(purify.sanitize(html, config));
      setIsHtmlSanitized(true);
    } catch (error) {
      console.error('HTML Sanitization error:', error);
      setSanitizationError(`Sanitization failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsHtmlSanitized(false);
      sanitizedContent = html; // Fallback to original content on error
    } finally {
      setCleanHtmlOutput(sanitizedContent);
      setIsProcessing(false);
    }
  }, [purify, setIsHtmlSanitized, setCleanHtmlOutput]);

  /**
   * Effect to automatically sanitize when rawHtmlInput or sanitizationConfig changes.
   * Includes a debounce mechanism to prevent excessive sanitization calls during rapid input.
   */
  useEffect(() => {
    const handler = setTimeout(() => {
      if (rawHtmlInput) {
        sanitizeHtml(rawHtmlInput, sanitizationConfig);
      } else {
        // Clear output if input is empty
        setCleanHtmlOutput('');
        setIsHtmlSanitized(false);
        setSanitizationError(null);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(handler); // Cleanup function to clear timeout on unmount or re-render
  }, [rawHtmlInput, sanitizationConfig, sanitizeHtml, setCleanHtmlOutput, setIsHtmlSanitized]);

  /**
   * Handles manual click of the "Sanitize HTML" button.
   */
  const handleSanitizeClick = () => {
    if (rawHtmlInput) {
      sanitizeHtml(rawHtmlInput, sanitizationConfig);
    } else {
      setCleanHtmlOutput('');
      setIsHtmlSanitized(false);
      setSanitizationError('No HTML content to sanitize.');
    }
  };

  /**
   * Clears the sanitized HTML output and related status.
   */
  const handleClearOutput = () => {
    setCleanHtmlOutput('');
    setIsHtmlSanitized(false);
    setSanitizationError(null);
  };

  /**
   * Applies the currently sanitized HTML output back to the raw HTML input.
   */
  const handleApplyToInput = () => {
    if (cleanHtmlOutput) {
      setRawHtmlInput(cleanHtmlOutput);
    }
  };

  /**
   * Generic handler to update a simple boolean/string config key.
   */
  const handleConfigChange = (key: keyof DOMPurify.Config, value: any) => {
    setSanitizationConfig({
      ...sanitizationConfig,
      [key]: value,
    });
  };

  /**
   * Defines the common sanitization options presented as switches in the UI.
   * Custom `onChange` handlers are used for complex DOMPurify.Config properties.
   */
  const commonSanitizationOptions = useMemo(() => [
    {
      key: 'ALLOW_DATA_ATTR',
      label: 'Allow data-* attributes',
      tooltip: 'Permits the use of `data-*` attributes (e.g., `data-info="value"`) on elements.',
      currentValue: sanitizationConfig.ALLOW_DATA_ATTR || false,
      onChange: (checked: boolean) => handleConfigChange('ALLOW_DATA_ATTR', checked),
    },
    {
      key: 'KEEP_CONTENT',
      label: 'Keep content of forbidden tags',
      tooltip: 'If a tag is forbidden (e.g., `<script>`), its content is usually stripped. Enable this to keep the content (e.g., "alert(1)") but remove the tag itself.',
      currentValue: sanitizationConfig.KEEP_CONTENT || false,
      onChange: (checked: boolean) => handleConfigChange('KEEP_CONTENT', checked),
    },
    {
      key: 'FORCE_BODY',
      label: 'Force output to be within <body>',
      tooltip: 'Ensures the sanitized HTML is always wrapped in a `<body>` tag if not already present.',
      currentValue: sanitizationConfig.FORCE_BODY || false,
      onChange: (checked: boolean) => handleConfigChange('FORCE_BODY', checked),
    },
    {
      key: 'USE_SVG_PROFILE', // Custom key for UI
      label: 'Enable SVG Sanitization Profile',
      tooltip: 'Applies additional sanitization rules specific to SVG elements. It extends, not replaces, default HTML rules.',
      currentValue: !!sanitizationConfig.USE_PROFILES?.svg,
      onChange: (checked: boolean) => {
        setSanitizationConfig({
          ...sanitizationConfig,
          USE_PROFILES: {
            ...sanitizationConfig.USE_PROFILES,
            svg: checked,
          },
        });
      },
    },
    {
      key: 'FORBID_SCRIPTS', // Custom key for UI
      label: 'Forbid <script> tags',
      tooltip: 'Toggles the explicit forbiddance of `<script>` tags during sanitization. Note: `<script>` tags are often forbidden by default for security.',
      currentValue: (sanitizationConfig.FORBID_TAGS || []).includes('script'),
      onChange: (checked: boolean) => {
        const currentForbidden = new Set(sanitizationConfig.FORBID_TAGS || []);
        if (checked) {
          currentForbidden.add('script');
        } else {
          currentForbidden.delete('script');
        }
        setSanitizationConfig({
          ...sanitizationConfig,
          FORBID_TAGS: Array.from(currentForbidden),
        });
      },
    },
  ], [sanitizationConfig, setSanitizationConfig, handleConfigChange]);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6" /> HTML Cleaning & Sanitization
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleApplyToInput}
            disabled={!cleanHtmlOutput || isProcessing}
            variant="outline"
          >
            <RefreshCcwIcon className="mr-2 h-4 w-4" /> Apply to Input
          </Button>
          <Button
            onClick={handleClearOutput}
            disabled={!cleanHtmlOutput && !sanitizationError}
            variant="ghost"
          >
            <Trash2Icon className="mr-2 h-4 w-4" /> Clear Output
          </Button>
          <Button
            onClick={handleSanitizeClick}
            disabled={isProcessing || !rawHtmlInput}
            isLoading={isProcessing}
          >
            Sanitize HTML
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 p-6 overflow-auto">
        {/* Sanitization Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commonSanitizationOptions.map((option) => (
            <div key={option.key} className="flex items-center space-x-2">
              <Switch
                id={`sanitize-${String(option.key)}`}
                checked={option.currentValue}
                onCheckedChange={option.onChange}
                disabled={isProcessing}
              />
              <Label htmlFor={`sanitize-${String(option.key)}`} className="flex items-center gap-1 cursor-pointer text-sm">
                {option.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{option.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>
          ))}
        </div>

        {/* Input & Output Textareas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor="raw-html-for-sanitization" className="text-lg font-semibold">
              Raw HTML Input (Read-Only)
            </Label>
            <Textarea
              id="raw-html-for-sanitization"
              placeholder="Paste HTML here or upload a file..."
              value={rawHtmlInput}
              readOnly
              className="flex-1 font-mono text-sm resize-none"
              rows={10} // Default rows for consistent initial height
            />
            {rawHtmlInput && (
              <p className="text-sm text-muted-foreground">
                Content to be sanitized: {rawHtmlInput.length} characters.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 relative">
            <Label htmlFor="sanitized-html-output" className="text-lg font-semibold">
              Sanitized HTML Output
              <Badge
                variant={isHtmlSanitized ? 'success' : 'warning'}
                dot={true}
                className="ml-2"
              >
                {isProcessing ? 'Processing...' : (isHtmlSanitized ? 'Sanitized' : 'Not Sanitized')}
              </Badge>
            </Label>
            <Textarea
              id="sanitized-html-output"
              placeholder="Sanitized HTML will appear here..."
              value={cleanHtmlOutput || ''}
              readOnly
              className="flex-1 font-mono text-sm resize-none"
              rows={10} // Default rows for consistent initial height
              error={sanitizationError ? sanitizationError : undefined}
            />
            {!sanitizationError && cleanHtmlOutput && (
              <p className="text-sm text-muted-foreground">
                Output HTML: {cleanHtmlOutput.length} characters.
              </p>
            )}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <RefreshCcwIcon className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};