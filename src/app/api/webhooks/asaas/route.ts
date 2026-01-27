import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resend, FROM_EMAIL } from "@/lib/resend";
import { generatePaymentConfirmationEmail } from "@/lib/email-templates";
import { z } from "zod";

// Webhook payload validation schema
const AsaasWebhookPayloadSchema = z.object({
  event: z.enum([
    "PAYMENT_RECEIVED",
    "PAYMENT_CONFIRMED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_CREATED",
    "PAYMENT_UPDATED",
    "PAYMENT_DELETED",
  ]),
  payment: z.object({
    id: z.string(),
    status: z.string().optional(),
    value: z.number().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error("[Webhook] Invalid JSON in request body");
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // MANDATORY webhook authentication in production
    const asaasAccessToken = request.headers.get("asaas-access-token");
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

    // In production, webhook token MUST be configured
    if (process.env.NODE_ENV === "production" && !webhookToken) {
      console.error(
        "[SECURITY] ASAAS_WEBHOOK_TOKEN not configured in production environment"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate token if configured (mandatory in prod, optional in dev)
    if (webhookToken && asaasAccessToken !== webhookToken) {
      console.warn("[SECURITY] Webhook authentication failed - Invalid token", {
        receivedToken: asaasAccessToken ? "***" : "none",
        timestamp: new Date().toISOString(),
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In development, warn if token not configured
    if (process.env.NODE_ENV === "development" && !webhookToken) {
      console.warn(
        "[DEV WARNING] ASAAS_WEBHOOK_TOKEN not set - webhook security disabled"
      );
    }

    // Validate webhook payload structure
    const validated = AsaasWebhookPayloadSchema.safeParse(body);
    if (!validated.success) {
      console.error("[Webhook] Payload validation failed:", {
        errors: validated.error.issues,
        receivedPayload: body,
      });
      return NextResponse.json(
        {
          error: "Invalid payload structure",
          details: validated.error.issues[0]?.message,
        },
        { status: 400 }
      );
    }

    const { event, payment } = validated.data;

    // Log for debugging
    console.log(`[Webhook] Received Asaas event: ${event}`, {
      paymentId: payment.id,
      timestamp: new Date().toISOString(),
    });

    // Buscar o pagamento no banco de dados
    // O ID do pagamento no Asaas corresponde ao asaasPaymentId no nosso banco
    // Usamos @ts-ignore temporariamente caso o client do Prisma não tenha sido gerado ainda
    const localPayment = await prisma.payment.findUnique({
      // @ts-ignore
      where: { asaasPaymentId: payment.id },
      include: {
        team: {
          include: {
            championship: true,
          },
        },
      },
    });

    if (!localPayment) {
      console.warn(`Pagamento ${payment.id} não encontrado no banco de dados.`);
      // Retornamos 200 para o Asaas não ficar tentando reenviar se for um evento irrelevante para nós
      return NextResponse.json({ received: true });
    }

    switch (event) {
      case "PAYMENT_RECEIVED":
      case "PAYMENT_CONFIRMED":
        // Atualizar status do pagamento
        await prisma.payment.update({
          where: { id: localPayment.id },
          data: {
            status: "RECEIVED",
          },
        });

        // Aprovar o time automaticamente
        await prisma.team.update({
          where: { id: localPayment.team.id },
          data: {
            status: "APPROVED",
          },
        });

        // Enviar e-mail de confirmação
        if (localPayment.team.email) {
          try {
            const emailHtml = generatePaymentConfirmationEmail({
              responsibleName: localPayment.team.responsibleName,
              teamName: localPayment.team.name,
              championshipName: localPayment.team.championship.name,
              amount: Number(localPayment.amount),
              paymentDate: new Date(),
              invoiceUrl: localPayment.invoiceUrl,
            });

            await resend.emails.send({
              from: FROM_EMAIL,
              to: localPayment.team.email,
              subject: `Pagamento Confirmado - ${localPayment.team.championship.name}`,
              html: emailHtml,
            });
            console.log(
              `E-mail de confirmação enviado para ${localPayment.team.email}`
            );
          } catch (emailError) {
            console.error("Erro ao enviar e-mail de confirmação:", emailError);
            // Não falhamos o webhook por erro de e-mail, apenas logamos
          }
        }

        // Tentar revalidar a página do campeonato
        try {
          revalidatePath(
            `/campeonatos/${localPayment.team.championship.slug}`
          );
        } catch (e) {
          console.error("Erro ao revalidar cache:", e);
        }

        console.log(
          `Pagamento confirmado. Time ${localPayment.team.id} aprovado.`
        );
        break;

      case "PAYMENT_OVERDUE":
        await prisma.payment.update({
          where: { id: localPayment.id },
          data: {
            status: "OVERDUE",
          },
        });
        break;

      case "PAYMENT_REFUNDED":
        await prisma.payment.update({
          where: { id: localPayment.id },
          data: {
            status: "REFUNDED",
          },
        });
        break;

      default:
        console.log(`Evento não tratado: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
