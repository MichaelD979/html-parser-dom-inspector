'use client';

import { useEffect } from 'react';
import { useHtmlParserStore } from '@/lib/store';
import { HtmlInputPasteUpload } from '@/components/HtmlInputPasteUpload';
import { DomTreeVisualization } from '@/components/DomTreeVisualization';
import { SafeHtmlPreview } from '@/components/SafeHtmlPreview';

export default function Page() {
  const { htmlInput, parseHtmlInput } = useHtmlParserStore();

  // Trigger HTML parsing whenever the raw HTML input changes
  useEffect(() => {
    // Only parse if htmlInput is not null/undefined to avoid unnecessary calls.
    // The parseHtmlInput action itself should handle clearing state if the input is empty.
    parseHtmlInput(htmlInput);
  }, [htmlInput, parseHtmlInput]); // Dependency array includes htmlInput and parseHtmlInput

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* Header for the application title */}
      <header className="py-4 px-4 md:px-8 bg-card border-b border-border shadow-sm flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">HTML Parser & Visualizer</h1>
      </header>

      {/* Main content area, takes remaining vertical space and allows scrolling */}
      <main className="flex-1 flex flex-col p-4 md:p-8 space-y-6 overflow-auto">
        {/* Section for HTML Input (Paste & Upload) */}
        <section className="flex-shrink-0 h-[45vh] min-h-[300px]">
          <HtmlInputPasteUpload />
        </section>

        {/* Section for DOM Tree Visualization and Safe HTML Preview */}
        {/* This section takes the remaining vertical space and arranges components in a responsive grid */}
        <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          <DomTreeVisualization />
          <SafeHtmlPreview />
        </section>
      </main>
    </div>
  );
}