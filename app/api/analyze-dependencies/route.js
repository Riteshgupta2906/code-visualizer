import { NextRequest, NextResponse } from "next/server";
import {
  analyzeDependencies,
  findReverseDependencies,
} from "../../../lib/analyzers/dependency-analyzer";

export async function POST(request) {
  try {
    const { filePath, projectRoot } = await request.json();
    console.log("Received filePath:", filePath, "projectRoot:", projectRoot);
    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Run both analyses in parallel
    const [dependencies, importedBy] = await Promise.all([
      analyzeDependencies(filePath, projectRoot),
      findReverseDependencies(filePath, projectRoot),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...dependencies,
        importedBy,
      },
    });
  } catch (error) {
    console.error("Dependency analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze dependencies" },
      { status: 500 }
    );
  }
}
