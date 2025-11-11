// app/api/analyze/route.js
import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/analyzers/project-analyzer"; // Your enhanced analyzer

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectPath } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: "Project path is required" },
        { status: 400 }
      );
    }

    // Validate the project path exists and is accessible
    const analysisResult = await analyzeProject(projectPath);

    return NextResponse.json({
      success: true,
      data: {
        structure: analysisResult.structure,
        insights: analysisResult.insights,
        prismaInfo: analysisResult.prismaInfo, // 🆕 NEW!
        metadata: analysisResult.metadata,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to analyze project",
        success: false,
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    message: "Analysis API is working",
    timestamp: new Date().toISOString(),
  });
}
