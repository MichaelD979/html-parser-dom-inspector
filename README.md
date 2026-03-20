# HTML Parsing Tool

## Project Description

The HTML Parsing Tool is a browser-based application designed to streamline the process of working with HTML documents. It provides a comprehensive suite of features for parsing, visualizing, extracting specific content, cleaning up markup, and converting HTML into various formats. Built with Next.js and TypeScript, it offers a robust and user-friendly interface for developers, content managers, and anyone needing to manipulate HTML efficiently.

## Features

*   **HTML Input & Editing:** A powerful editor (powered by Monaco Editor) for inputting and modifying HTML content.
*   **Live Parsing & Visualization:** Instant parsing and a visual representation of the HTML DOM structure.
*   **Content Extraction:** Tools to extract specific elements, attributes, or text based on selectors or patterns.
*   **HTML Cleaning & Sanitization:** Features to remove unwanted tags, attributes, and potential vulnerabilities (using DOMPurify).
*   **Format Conversion:** Ability to convert HTML to plain text, markdown, or other structured data formats.
*   **User-Friendly Interface:** An intuitive UI for a smooth user experience.
*   **Client-Side Processing:** All core parsing and manipulation logic runs in the browser, ensuring data privacy and quick responses.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

Ensure you have the following installed:

*   Node.js (LTS version recommended, e.g., 18.x or 20.x)
*   npm or yarn (npm is included with Node.js)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [YOUR_REPOSITORY_URL_HERE]
    cd html-parsing-tool
    

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Development Server

1.  **Start the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    ```

2.  **Open in your browser:**

    The application will be accessible at `http://localhost:3000`.

### Building for Production

To create an optimized production build:

npm run build
# or
yarn build
```

Then, to run the production build:

```bash
npm run start
# or
yarn start
```