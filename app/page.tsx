export default function Page() {
  return (
    <main className="flex flex-col min-h-screen items-center p-4 md:p-8 lg:p-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      {/* Main container for the two feature panels.
          It uses flex-col for mobile (panels stack vertically) and lg:flex-row for larger screens (panels side-by-side).
          flex-grow allows this container to expand and fill available vertical space. */}
      <div className="z-10 w-full max-w-7xl flex flex-col lg:flex-row gap-8 flex-grow">
        {/* Left pane: HTML Input via Monaco Editor and File Upload */}
        <div className="w-full lg:w-1/2 flex flex-col h-full">
          {/* RawHtmlInput handles pasting HTML into a Monaco editor and uploading HTML files. */}
          <RawHtmlInput />
        </div>

        {/* Right pane: DOM Structure Parsing and Visualization */}
        <div className="w-full lg:w-1/2 flex flex-col h-full">
          {/* DomStructureParsingVisualization displays the parsed HTML as an interactive tree. */}
          <DomStructureParsingVisualization />
        </div>
      </div>
    </main>
  );
}

// Internal components are imported as named exports as per rules.
import { RawHtmlInput } from '@/components/RawHtmlInput';
import { DomStructureParsingVisualization } from '@/components/DomStructureParsingVisualization';