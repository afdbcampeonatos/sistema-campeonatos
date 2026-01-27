import { prisma } from "@/lib/prisma";
import { deleteImage } from "@/lib/storage";
import { NextResponse } from "next/server";

/**
 * Cleanup endpoint for abandoned and rejected teams
 *
 * This endpoint should be called periodically (e.g., via cron job)
 * to clean up:
 * 1. Teams with status REJECTED
 * 2. Teams with status PENDING and no payment for 30+ days
 *
 * Security: Protected by CRON_SECRET token
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, CRON_SECRET is mandatory
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error(
        "[CLEANUP] CRON_SECRET not configured in production environment"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate authorization token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CLEANUP] Unauthorized cleanup attempt", {
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find teams to delete:
    // 1. Status REJECTED
    // 2. Status PENDING created 30+ days ago with no payment OR overdue payment
    const teamsToDelete = await prisma.team.findMany({
      where: {
        OR: [
          {
            status: "REJECTED",
          },
          {
            status: "PENDING",
            createdAt: {
              lt: thirtyDaysAgo,
            },
            OR: [
              {
                payment: null,
              },
              {
                payment: {
                  status: {
                    in: ["OVERDUE", "PENDING"],
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        players: {
          select: {
            id: true,
            photoUrl: true,
          },
        },
        championship: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`[CLEANUP] Found ${teamsToDelete.length} teams to delete`);

    let deletedTeams = 0;
    let deletedPlayers = 0;
    let deletedPhotos = 0;
    const errors: Array<{ teamId: string; error: string }> = [];

    for (const team of teamsToDelete) {
      try {
        // Delete all player photos
        for (const player of team.players) {
          if (player.photoUrl) {
            try {
              await deleteImage(player.photoUrl);
              deletedPhotos++;
            } catch (photoError) {
              console.error(
                `[CLEANUP] Failed to delete player photo ${player.id}:`,
                photoError
              );
              // Continue even if photo deletion fails
            }
          }
        }

        // Delete team shield
        if (team.shieldUrl) {
          try {
            await deleteImage(team.shieldUrl);
            deletedPhotos++;
          } catch (photoError) {
            console.error(
              `[CLEANUP] Failed to delete team shield ${team.id}:`,
              photoError
            );
            // Continue even if photo deletion fails
          }
        }

        // Delete team from database (cascade deletes players and payment)
        await prisma.team.delete({
          where: { id: team.id },
        });

        deletedTeams++;
        deletedPlayers += team.players.length;

        console.log(
          `[CLEANUP] Deleted team ${team.id} (${team.name}) from championship ${team.championship.name}`
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`[CLEANUP] Failed to delete team ${team.id}:`, error);
        errors.push({
          teamId: team.id,
          error: errorMessage,
        });
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        teamsDeleted: deletedTeams,
        playersDeleted: deletedPlayers,
        photosDeleted: deletedPhotos,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[CLEANUP] Cleanup completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CLEANUP] Cleanup job failed:", error);
    return NextResponse.json(
      {
        error: "Cleanup job failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check cleanup status without running it
export async function GET(request: Request) {
  try {
    // Simple auth check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Count teams that would be deleted
    const rejectedCount = await prisma.team.count({
      where: { status: "REJECTED" },
    });

    const abandonedCount = await prisma.team.count({
      where: {
        status: "PENDING",
        createdAt: { lt: thirtyDaysAgo },
        OR: [
          { payment: null },
          {
            payment: {
              status: { in: ["OVERDUE", "PENDING"] },
            },
          },
        ],
      },
    });

    return NextResponse.json({
      pendingCleanup: {
        rejected: rejectedCount,
        abandoned: abandonedCount,
        total: rejectedCount + abandonedCount,
      },
      cutoffDate: thirtyDaysAgo.toISOString(),
    });
  } catch (error) {
    console.error("[CLEANUP] Status check failed:", error);
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    );
  }
}
