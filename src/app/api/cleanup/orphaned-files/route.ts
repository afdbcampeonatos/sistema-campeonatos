import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Cleanup endpoint for orphaned files in Supabase Storage
 *
 * This scans storage for files not referenced in the database
 * and deletes them to save storage costs.
 *
 * WARNING: This is a heavy operation - run infrequently (monthly)
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error(
        "[ORPHANED-CLEANUP] CRON_SECRET not configured in production"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[ORPHANED-CLEANUP] Unauthorized attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List all files in shields and players folders
    const [shieldsResult, playersResult] = await Promise.all([
      supabase.storage.from("championships").list("shields"),
      supabase.storage.from("championships").list("players"),
    ]);

    if (shieldsResult.error || playersResult.error) {
      throw new Error(
        `Failed to list storage files: ${
          shieldsResult.error?.message || playersResult.error?.message
        }`
      );
    }

    const shieldFiles = shieldsResult.data || [];
    const playerFiles = playersResult.data || [];

    // Get all shield URLs from database
    const teams = await prisma.team.findMany({
      where: { shieldUrl: { not: null } },
      select: { shieldUrl: true },
    });

    // Get all player photo URLs from database
    const players = await prisma.player.findMany({
      where: { photoUrl: { not: null } },
      select: { photoUrl: true },
    });

    // Extract filenames from URLs
    const shieldFilenames = new Set(
      teams
        .map((t) => {
          if (!t.shieldUrl) return null;
          const match = t.shieldUrl.match(/shields\/([^?]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[]
    );

    const playerFilenames = new Set(
      players
        .map((p) => {
          if (!p.photoUrl) return null;
          const match = p.photoUrl.match(/players\/([^?]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[]
    );

    // Find orphaned files
    const orphanedShields = shieldFiles.filter(
      (file) => !shieldFilenames.has(file.name)
    );
    const orphanedPlayers = playerFiles.filter(
      (file) => !playerFilenames.has(file.name)
    );

    // Delete orphaned files
    const filesToDelete: string[] = [
      ...orphanedShields.map((f) => `shields/${f.name}`),
      ...orphanedPlayers.map((f) => `players/${f.name}`),
    ];

    let deletedCount = 0;
    const errors: Array<{ file: string; error: string }> = [];

    if (filesToDelete.length > 0) {
      // Delete in batches of 100 (Supabase limit)
      for (let i = 0; i < filesToDelete.length; i += 100) {
        const batch = filesToDelete.slice(i, i + 100);
        const { error } = await supabase.storage
          .from("championships")
          .remove(batch);

        if (error) {
          console.error(`[ORPHANED-CLEANUP] Batch deletion failed:`, error);
          batch.forEach((file) =>
            errors.push({ file, error: error.message })
          );
        } else {
          deletedCount += batch.length;
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalShieldFiles: shieldFiles.length,
        totalPlayerFiles: playerFiles.length,
        orphanedShields: orphanedShields.length,
        orphanedPlayers: orphanedPlayers.length,
        filesDeleted: deletedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[ORPHANED-CLEANUP] Cleanup completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ORPHANED-CLEANUP] Failed:", error);
    return NextResponse.json(
      {
        error: "Orphaned files cleanup failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview orphaned files without deleting
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [shieldsResult, playersResult] = await Promise.all([
      supabase.storage.from("championships").list("shields"),
      supabase.storage.from("championships").list("players"),
    ]);

    if (shieldsResult.error || playersResult.error) {
      throw new Error(
        `Failed to list storage files: ${
          shieldsResult.error?.message || playersResult.error?.message
        }`
      );
    }

    const shieldFiles = shieldsResult.data || [];
    const playerFiles = playersResult.data || [];

    const teams = await prisma.team.findMany({
      where: { shieldUrl: { not: null } },
      select: { shieldUrl: true },
    });

    const players = await prisma.player.findMany({
      where: { photoUrl: { not: null } },
      select: { photoUrl: true },
    });

    const shieldFilenames = new Set(
      teams
        .map((t) => {
          if (!t.shieldUrl) return null;
          const match = t.shieldUrl.match(/shields\/([^?]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[]
    );

    const playerFilenames = new Set(
      players
        .map((p) => {
          if (!p.photoUrl) return null;
          const match = p.photoUrl.match(/players\/([^?]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean) as string[]
    );

    const orphanedShields = shieldFiles.filter(
      (file) => !shieldFilenames.has(file.name)
    );
    const orphanedPlayers = playerFiles.filter(
      (file) => !playerFilenames.has(file.name)
    );

    return NextResponse.json({
      preview: true,
      stats: {
        totalShieldFiles: shieldFiles.length,
        totalPlayerFiles: playerFiles.length,
        referencedShields: shieldFilenames.size,
        referencedPlayers: playerFilenames.size,
        orphanedShields: orphanedShields.length,
        orphanedPlayers: orphanedPlayers.length,
        totalOrphaned: orphanedShields.length + orphanedPlayers.length,
      },
      orphanedFiles: {
        shields: orphanedShields.map((f) => f.name).slice(0, 50),
        players: orphanedPlayers.map((f) => f.name).slice(0, 50),
      },
    });
  } catch (error) {
    console.error("[ORPHANED-CLEANUP] Preview failed:", error);
    return NextResponse.json(
      { error: "Preview failed" },
      { status: 500 }
    );
  }
}
