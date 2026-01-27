import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID é obrigatório" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { teamId },
      select: {
        status: true,
        invoiceUrl: true,
        team: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { paymentStatus: "NOT_FOUND", teamStatus: "PENDING", invoiceUrl: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      paymentStatus: payment.status,
      teamStatus: payment.team.status,
      invoiceUrl: payment.invoiceUrl,
    });
  } catch (error) {
    console.error("Erro ao buscar status do pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status" },
      { status: 500 }
    );
  }
}
