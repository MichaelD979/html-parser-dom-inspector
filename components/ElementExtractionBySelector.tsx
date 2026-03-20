'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Lightbulb, Wrench, XCircle, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHtmlParserStore } from '@/lib/store';
import { ExtractionResult } from '@/lib/types';

export const ElementExtractionBySelector = () => {
  const {
    rawHtmlInput,
    selectorInput,
    setSelectorInput,
    extractionResults,
    addExtractionResult,
    clearExtractionResults,
    parsingError,
  } = useHtmlParserStore();

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionOutputType, setExtractionOutputType] = useState<
    'text' | 'outerHTML' | 'innerHTML' | 'attribute'
  >('text');
  const [attributeName, setAttributeName] = useState<string>('');

  const handleExtract = async () => {
    setExtractionError(null);
    if (!rawHtmlInput.trim()) {
      setExtractionError('Please provide HTML content in the Raw HTML Input tab first.');
      return;
    }
    if (!selectorInput.trim()) {
      setExtractionError('Please enter a CSS selector.'); // XPath support is advanced and requires a separate parser/library, focusing on CSS selector for now.
      return;
    }

    setIsExtracting(true);
    let results: string[] = [];

    try {
      // Using DOMParser directly in the main thread as per "NO Web Workers" rule.
      // For large HTML documents, this might block the UI.
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtmlInput, 'text/html');

      // Check for parsing errors reported by DOMParser itself
      const parseErrorElement = doc.querySelector('parsererror');
      if (parseErrorElement) {
        setExtractionError(`HTML parsing error: ${parseErrorElement.textContent}`);
        setIsExtracting(false);
        return;
      }

      // QuerySelectorAll supports CSS selectors.
      // XPath would require `document.evaluate` and potentially a more robust parser.
      const selectedElements = doc.querySelectorAll(selectorInput);

      if (selectedElements.length === 0) {
        setExtractionError(`No elements found for selector: "${selectorInput}"`);
      } else {
        selectedElements.forEach(element => {
          if (extractionOutputType === 'text') {
            results.push(element.textContent || '');
          } else if (extractionOutputType === 'outerHTML') {
            results.push(element.outerHTML || '');
          } else if (extractionOutputType === 'innerHTML') {
            results.push(element.innerHTML || '');
          } else if (extractionOutputType === 'attribute') {
            if (attributeName.trim()) {
              const attrValue = element.getAttribute(attributeName.trim());
              // getAttribute returns null if the attribute is not found
              results.push(attrValue !== null ? attrValue : `[Attribute "${attributeName.trim()}" not found]`);
            } else {
              // If attributeName is empty, we set an error and push an empty string for this element,
              // or could skip adding to results entirely.
              setExtractionError('Please enter an attribute name when "Specific Attribute" is selected.');
              results.push('');
            }
          }
        });
        const newResult: ExtractionResult = {
          selector: selectorInput,
          values: results,
        };
        addExtractionResult(newResult);
      }
    } catch (e: any) {
      // Catch errors during querySelectorAll (e.g., invalid selector syntax)
      setExtractionError(`Extraction failed: ${e.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleClearResults = () => {
    clearExtractionResults();
    setExtractionError(null);
  };

  // Combine all extraction values for easy copying
  const allExtractionValues = extractionResults
    .flatMap(res => res.values.filter(Boolean)) // Flatten and remove empty strings
    .join('\n\n'); // Separate results by double newline

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Wrench className="h-5 w-5 text-brand-500" />
          Element Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="selector-input">CSS Selector</Label>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Input
                  id="selector-input"
                  placeholder="e.g., div.product-card > h2, a[href]"
                  value={selectorInput}
                  onChange={(e) => setSelectorInput(e.target.value)}
                  className={cn(extractionError ? 'border-error-500' : '')}
                />
              </TooltipTrigger>
              <TooltipContent>
                Enter a CSS selector (e.g., <code>.my-class p</code>, <code>#id li:first-child</code>).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {extractionError && (
            <p className="text-sm text-error-500 flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              {extractionError}
            </p>
          )}
          {parsingError && (rawHtmlInput && rawHtmlInput.trim() !== '') && (
            <p className="text-sm text-warning-500 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              Warning: Original HTML has parsing errors. Extraction might be incomplete or inaccurate.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-grow flex flex-col space-y-2">
            <Label htmlFor="extraction-output-type">Extract As</Label>
            <Select
              value={extractionOutputType}
              onValueChange={(value: typeof extractionOutputType) => {
                setExtractionOutputType(value);
                if (value !== 'attribute') {
                  setAttributeName(''); // Clear attribute name if type changes away from 'attribute'
                }
              }}
            >
              <SelectTrigger id="extraction-output-type" className="w-full">
                <SelectValue placeholder="Select output type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text Content</SelectItem>
                <SelectItem value="outerHTML">Outer HTML</SelectItem>
                <SelectItem value="innerHTML">Inner HTML</SelectItem>
                <SelectItem value="attribute">Specific Attribute</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {extractionOutputType === 'attribute' && (
            <div className="flex-grow flex flex-col space-y-2">
              <Label htmlFor="attribute-name-input">Attribute Name</Label>
              <Input
                id="attribute-name-input"
                placeholder="e.g., href, src, data-id"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExtract} disabled={isExtracting || !rawHtmlInput.trim() || !selectorInput.trim()}>
            {isExtracting ? 'Extracting...' : 'Extract Elements'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClearResults}
            disabled={extractionResults.length === 0}
          >
            Clear Results
          </Button>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(allExtractionValues);
                  }}
                  disabled={allExtractionValues.length === 0}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy All Results to Clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Separator className="my-4" label="Extraction Results" />

        <div className="flex-grow flex flex-col space-y-2 min-h-[100px] overflow-hidden">
          {extractionResults.length === 0 && !isExtracting && (
            <div className="text-center text-muted-foreground py-8">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-brand-400" />
              <p>No extraction results yet.</p>
              <p className="text-sm">Enter a selector and click "Extract Elements".</p>
            </div>
          )}

          {extractionResults.length > 0 && (
            <div className="flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-450px)]"> {/* Adjust max-h based on surrounding elements */}
              {extractionResults.map((result, index) => (
                <div key={index} className="border rounded-md p-3 bg-card text-card-foreground shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="brand">Selector</Badge>
                    <span className="font-mono text-sm break-all flex-1">{result.selector}</span>
                    <Badge variant="info" dot>{result.values.length} found</Badge>
                  </div>
                  <Textarea
                    readOnly
                    value={result.values.join('\n\n')}
                    className="w-full text-sm font-mono h-[150px] resize-y"
                    placeholder="Extracted content will appear here..."
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};