# Code Eye

<div align="center">
  <video src="public/demo.mp4" width="100%" controls></video> 
  <br/>
  <a href="public/demo.mp4">Watch Demo</a>
</div>

**Code Eye** is a powerful Next.js Code Visualizer designed to help developers understand complex application structures and database schemas at a glance. It provides interactive visualizations for Next.js App Router projects and Prisma schemas, making it easier to analyze dependencies, routing patterns, and data models.

## 🚀 Key Features

- **Dependency Visualization**: comprehensive graph of your project's file dependencies using recursive directory scanning.
- **Reverse Dependency Analysis**: Instantly see "Imported By" relationships to understand the impact of changes.
- **Next.js App Router Support**: Automatically detects and categorizes App Router conventions (Pages, Layouts, API Routes, Route Groups, etc.).
- **Prisma Schema Visualization**: Interactive ER diagram generation from your `schema.prisma` files using `@prisma/internals`.
- **Git Integration**: View repository details, current branch, and latest commit information directly in the dashboard.
- **Interactive Graphs**: Powered by **React Flow** with custom node types and layout algorithms.

## 🛠️ Important Packages

This project relies on several key open-source libraries to deliver its functionality:

- **Core Framework**: `next`, `react`, `tailwindcss`
- **Visualization**:
  - `@xyflow/react` (React Flow): For rendering the interactive node-based graphs.
  - `d3` & `d3-force`: For physics-based graph layout simulations.
  - `elkjs`: For advanced layered graph layouts (entity-relationship diagrams).
- **Analysis Engine**:
  - `@babel/parser` & `@babel/traverse`: For parsing JavaScript/TypeScript ASTs to extract imports and exports.
  - `@prisma/internals`: specifically `getDMMF` (Data Model Meta Format) is used to parse `schema.prisma` files into structured objects.
  - `simple-git`: For extracting repository metadata.
- **UI Components**:
  - `framer-motion`: For fluid animations and transitions.
  - `lucide-react`: For iconography.
  - `@radix-ui/*`: For accessible UI primitives.

## ⚙️ How It Works

### Dependency Analysis
The dependency analyzer (`lib/analyzers/project-analyzer.js` & `dependency-analyzer.js`) works by:
1.  **Scanning**: Recursively walks through your project directory using `fast-glob`.
2.  **Parsing**: Reads each file and uses Babel's AST parser to identify `import` declarations and `export` statements.
3.  **Resolution**: Resolves path aliases (like `@/components`) and relative paths to absolute file locations.
4.  **Graph Building**: Constructs a bidirectional graph where nodes represent files and edges represent imports.

### Prisma Schema Visualization
The schema analyzer (`app/api/analyze-schema/route.js`) processes your Prisma files:
1.  **Parsing**: Uses Prisma's internal SDK to convert the raw schema into a DMMF object.
2.  **Transformation**: Maps models and enums to React Flow nodes (`databaseSchema` type).
3.  **Relation Linking**: Identifies relationships (1:1, 1:N, N:N) and creates edges with appropriate labels and foreign key details.

### Graph Rendering
The visualizations are rendered using **React Flow**, but with a custom layer of intelligence:
-   **Custom Nodes**: `DependencyNode` and `SchemaNode` components render rich details like file types, stats, and database columns.
-   **Layout Management**: Uses a combination of Dagre (for hierarchical layouts) and D3 Force (for organic clusters) to ensure the graph is readable and organized.

## 📦 Installation & Use

Clone the project and install dependencies to get started.

```bash
# Clone the repository
git clone https://github.com/Riteshgupta2906/code-visualizer.git

# Navigate into the directory
cd code-visualizer

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

You can analyze a project in two ways:

1.  **Local Path**: Enter the absolute path of a local Next.js project.
    -   *Tip*: Navigate to the project folder in your terminal and run `pwd` to get the full path, then paste it.
2.  **GitHub URL**: Enter the URL of any public GitHub repository (e.g., `https://github.com/vercel/next.js`). Code Eye will clone and analyze it automatically.

## 🔮 Future Roadmap

We are constantly working to improve Code Eye. Here is what's coming next:

-   **VS Code Extension**: Bring the power of Code Eye directly into your editor for seamless context switching.
-   **API Call Visualization**: specialized graph layer to visualize HTTP requests and API interactions within your app.
-   **Multi-Project Support**: Ability to analyze and switch between multiple projects without restarting the server.
