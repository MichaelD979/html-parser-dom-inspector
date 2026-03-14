'use client';

import { useHtmlParserStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const SafeHtmlPreview = () => {
  const safeHtmlPreview = useHtmlParserStore((state) => state.safeHtmlPreview);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Safe HTML Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        {safeHtmlPreview ? (
          <iframe
            title="Safe HTML Preview"
            srcDoc={safeHtmlPreview}
            // The sandbox attribute with "allow-same-origin" prevents script execution,
            // form submissions, and top-level navigation, while still allowing relative
            // URLs for assets like images and stylesheets to load correctly.
            // Other sandbox flags like "allow-scripts" are explicitly omitted for security.
            sandbox="allow-same-origin"
            className="w-full h-full border-none"
            style={{ minHeight: '300px' }} // Ensures the iframe has a minimum visible height
            frameBorder="0"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
            No HTML content to preview. Process some HTML to see it here.
          </div>
        )}
      </CardContent>
    </Card>
  );
};