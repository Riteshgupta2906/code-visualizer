/**
 * Client-side schema analyzer that calls the server API
 * This avoids importing Node.js modules in the browser
 */
export async function analyzeSchemaForGraph(schemaPath, schemaFolderPath = null) {
  try {
    
    console.log("Analyzing schema at path:", schemaPath, " Folder:", schemaFolderPath);
    const response = await fetch("/api/analyze-schema", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
          schemaPath, 
          schemaFolderPath 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to analyze schema");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Schema analysis error:", error);
    throw error;
  }
}
