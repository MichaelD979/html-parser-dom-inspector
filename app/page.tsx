'use client';

import { HtmlSourceEditor } from '@/components/HtmlSourceEditor';
import { ClientSideHtmlParsing } from '@/components/ClientSideHtmlParsing';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Code, Eye } from 'lucide-react'; // Using icons relevant to code and preview

/**
 * Renders the main HTML Parsing & Visualization tool page.
 * This page orchestrates the HTML source editor and the client-side parsing/preview components.
 */
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="container max-w-7xl flex-grow space-y-6">
        {/* Header Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              HTML Parser & Visualizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              Input HTML, parse it into a DOM tree, detect errors, and preview safely in the browser.
            </p>
          </CardContent>
        </Card>

        <Separator label="Input & Output" />

        {/* Main Content Area: Split layout for Editor and Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Pane: HTML Source Editor */}
          <Card className="flex flex-col min-h-[600px] md:h-[calc(100vh-250px)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5 text-gray-500" /> HTML Source Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              {/* The HtmlSourceEditor component manages its own Monaco editor instance */}
              <HtmlSourceEditor />
            </CardContent>
          </Card>

          {/* Right Pane: Client-Side HTML Parsing & Preview */}
          <Card className="flex flex-col min-h-[600px] md:h-[calc(100vh-250px)]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-gray-500" /> Parsed HTML & Live Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              {/* The ClientSideHtmlParsing component displays the parsing results and the iframe preview */}
              <ClientSideHtmlParsing />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}