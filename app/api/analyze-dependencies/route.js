import { NextRequest, NextResponse } from "next/server";
import { analyzeDependencies } from "@/lib/analyzers/dependency-analyzer";

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

    const dependencies = analyzeDependencies(filePath, projectRoot);

    return NextResponse.json({
      success: true,
      data: dependencies,
    });
  } catch (error) {
    console.error("Dependency analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze dependencies" },
      { status: 500 }
    );
  }
}
