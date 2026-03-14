# HTML Parsing Tool

A comprehensive, browser-based tool designed for developers and content creators to interactively parse, visualize, extract, clean, and convert HTML content. This application provides a safe sandbox environment for previewing parsed HTML, leveraging technologies like Monaco Editor for code editing, DOMParser for efficient parsing, a sandboxed iframe for secure previews, DOMPurify for sanitization, and Prettier for code formatting.

## Features

*   **Interactive HTML Editor:** Write or paste HTML code with syntax highlighting and auto-completion powered by Monaco Editor.
*   **Real-time Parsing & Visualization:** Instantly parse HTML and visualize its DOM structure.
*   **Safe HTML Preview:** Preview rendered HTML within a sandboxed iframe, ensuring isolation from the main application.
*   **Extraction Capabilities:** Extract specific elements, attributes, or text content based on user-defined criteria.
*   **HTML Cleaning & Sanitization:** Sanitize HTML using DOMPurify to remove potentially malicious scripts or unwanted tags.
*   **Code Formatting:** Format HTML output using Prettier for readability.
*   **Conversion Tools:** Future-proof for potential conversions (e.g., HTML to Markdown).

## Technologies Used

*   **Next.js 15 (App Router):** For a robust and performant React framework.
*   **TypeScript:** For type safety and improved developer experience.
*   **React:** For building the user interface.
*   **Monaco Editor:** For an advanced code editing experience.
*   **DOMParser:** For efficient in-browser HTML parsing.
*   **`iframe` (Sandboxed):** For secure and isolated previews.
*   **DOMPurify:** For sanitizing HTML content.
*   **Prettier:** For consistent code formatting.
*   **Tailwind CSS:** For highly customizable and utility-first styling.
*   **Zustand:** For state management.
*   **Lucide React:** For a beautiful icon set.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Make sure you have the following installed on your machine:

*   Node.js (LTS version recommended)
*   npm, yarn, or pnpm (pnpm is recommended)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/html-parsing-tool.git
    cd html-parsing-tool
    

2.  **Install dependencies:**

    Using pnpm (recommended):
    ```bash
    pnpm install
    ```

    Using npm:
    ```bash
    npm install
    ```

    Using yarn:
    ```bash
    yarn install
    ```

### Running the Development Server

To start the development server:

Using pnpm:
pnpm dev
```

Using npm:
```bash
npm run dev
```

Using yarn:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

The application will hot-reload on changes, and any build errors will be shown in the console.

### Building for Production

To create a production-ready build:

Using pnpm:
```bash
pnpm build
```

Using npm:
```bash
npm run build
```

Using yarn:
```bash
yarn build
```

Then, you can start the production server:

Using pnpm:
```bash
pnpm start
```

Using npm:
```bash
npm run start
```

Using yarn:
```bash
yarn start
```