'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useHtmlParserStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * MalformedMarkupDetection component displays parsing errors detected in the HTML source.
 * It uses the browser's DOMParser error indicators (e.g., 'parsererror' element)
 * to determine if the HTML is malformed, as reflected in the Zustand store.
 */
export const MalformedMarkupDetection = () => {
  const { parsingErrors, hasParsingError } = useHtmlParserStore((state) => ({
    parsingErrors: state.parsingErrors,
    hasParsingError: state.hasParsingError,
  }));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        className={cn(
          'flex flex-row items-center justify-between space-y-0 p-4 pb-2'
        )}
      >
        <CardTitle className="text-xl font-semibold">
          Malformed Markup Detection
        </CardTitle>
        <Badge variant={hasParsingError ? 'error' : 'success'} dot>
          {hasParsingError ? 'Errors Detected' : 'No Errors'}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 overflow-auto p-4 text-sm">
        {hasParsingError ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-orange-500">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="font-medium">
                The HTML parser detected malformed markup or errors.
              </p>
            </div>
            {parsingErrors.length > 0 && (
              <ul className="list-inside list-disc space-y-1 pl-4">
                {parsingErrors.map((error: string, index: number) => (
                  <li key={`parse-error-${index}`} className="text-muted-foreground">
                    {error}
                  </li>
                ))}
              </ul>
            )}
            {parsingErrors.length === 0 && (
              <p className="text-muted-foreground pl-7">
                Malformed markup was detected, but specific error details could not be extracted.
                This often happens when the DOMParser inserts a &lt;parsererror&gt; element.
              </p>
            )}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-3 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-lg font-medium">No malformed markup detected.</p>
            <p className="max-w-md">
              Your HTML appears to be well-formed according to the browser's
              DOMParser.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};