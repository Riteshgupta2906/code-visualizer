import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Security: Ensure the file path is absolute and doesn't contain path traversal
    const normalizedPath = path.normalize(filePath);

    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file content
    const content = await fs.readFile(normalizedPath, "utf-8");

    // Limit file size for safety (max 1MB)
    if (content.length > 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large to display" },
        { status: 413 }
      );
    }

    return NextResponse.json({
      content,
      filePath: normalizedPath,
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json(
      { error: "Failed to read file", details: error.message },
      { status: 500 }
    );
  }
}
