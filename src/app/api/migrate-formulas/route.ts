import { NextRequest, NextResponse } from "next/server";
import { runFormulaMigration, previewFormulaMigration } from "@/lib/migrations/fixFormulas";

/**
 * POST /api/migrate-formulas
 * Run the formula migration to fix Hill notation formulas in IndexedDB
 *
 * Query params:
 * - dryRun: "true" to preview changes without applying them
 * - secret: Admin secret for authentication (should match MIGRATE_SECRET env var)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.MIGRATE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Migration not configured. Set MIGRATE_SECRET env var." },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dryRun = searchParams.get("dryRun") === "true";

    if (dryRun) {
      const preview = await previewFormulaMigration();
      return NextResponse.json({
        dryRun: true,
        cacheChanges: preview.cacheChanges,
        historyChanges: preview.historyChanges,
        totalChanges: preview.cacheChanges.length + preview.historyChanges.length,
      });
    }

    // Run actual migration
    const result = await runFormulaMigration();

    return NextResponse.json({
      success: result.success,
      cacheUpdated: result.cacheUpdated,
      historyUpdated: result.historyUpdated,
      totalUpdated: result.cacheUpdated + result.historyUpdated,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Migration API error:", error);
    return NextResponse.json(
      { error: "Migration failed", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/migrate-formulas
 * Preview what changes would be made (dry run by default)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const expectedSecret = process.env.MIGRATE_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: "Migration not configured. Set MIGRATE_SECRET env var." },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preview = await previewFormulaMigration();

    return NextResponse.json({
      dryRun: true,
      cacheChanges: preview.cacheChanges,
      historyChanges: preview.historyChanges,
      totalChanges: preview.cacheChanges.length + preview.historyChanges.length,
      message: "Use POST with dryRun=false to apply changes",
    });
  } catch (error) {
    console.error("Migration preview error:", error);
    return NextResponse.json(
      { error: "Preview failed", details: String(error) },
      { status: 500 }
    );
  }
}
