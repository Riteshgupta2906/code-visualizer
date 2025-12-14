import { NextResponse } from "next/server";
import { analyzeProject } from "../../../lib/analyzers/project-analyzer";
import { projectManager } from "../../../lib/services/project-manager";

export const runtime = "nodejs"; // Force Node.js runtime

export async function POST(request) {

  try {
    const body = await request.json();
    const { projectPath } = body;

    if (!projectPath) {
      return NextResponse.json(
        { error: "Project path or GitHub URL is required" },
        { status: 400 }
      );
    }

    // Prepare the project (clone if URL, verify if local)
    // We DON'T await cleanup here because subsequent API calls (like dependency details)
    // might need to read these files.
    // In a production app, we'd need a background job to clean these up.
    const projectInfo = await projectManager.prepareProject(projectPath);
    
    // Analyze the project using the resolved path
    const analysisResult = await analyzeProject(projectInfo.path);

    // If it was a GitHub URL, we can leverage the insights name or package.json name
    // The analysisResult.structure.name will be the folder name (e.g. uuid or repo name)
    // We might want to fix the name if it's a temp dir with a UUID
    if (projectInfo.originalUrl) {
       // Try to extract repo name from URL for better display
       const repoName = projectInfo.originalUrl.split('/').pop().replace('.git', '');
       if (analysisResult.structure) {
         analysisResult.structure.name = repoName;
       }
    }

    return NextResponse.json({
      success: true,
      data: {
        structure: analysisResult.structure,
        insights: analysisResult.insights,
        prismaInfo: analysisResult.prismaInfo,
        metadata: {
            ...analysisResult.metadata,
            // Return the resolved path so frontend uses this for future calls
            projectRoot: projectInfo.path, 
            isTemp: projectInfo.isTemp,
            originalSource: projectPath
        },
        dependencyMap: analysisResult.dependencyMap,
        gitInfo: analysisResult.gitInfo,
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
