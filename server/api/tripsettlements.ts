import prisma from "../../prisma/client.js";
import { requireTripAccess } from "../../utils/access-control";
import { amountToCents, centsToAmount } from "../../utils/money";
import { normalizeRouteError } from "../../utils/route-error";
import {
  ensureObjectBody,
  requireDate,
  requireNumber,
  requireUuidLikeId,
} from "../../utils/request-validation";

function normalizeSettlementPaymentRecord(payment: {
  id: string;
  amount: number;
  amountCents: number;
  date: Date;
  tripId: string;
  fromUserId: string;
  toUserId: string;
  fromUser?: { id: string; name: string } | null;
  toUser?: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const amountCents = typeof payment.amountCents === "number" ? payment.amountCents : amountToCents(payment.amount);

  return {
    ...payment,
    amountCents,
    amount: centsToAmount(amountCents),
    fromName: payment.fromUser?.name || "",
    toName: payment.toUser?.name || "",
  };
}

function requirePositiveAmount(value: unknown) {
  const amount = requireNumber(value, "amount");
  if (amount <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "amount must be greater than 0",
    });
  }

  return amount;
}

async function ensureTripParticipantIds(tripId: string, fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Settlement payer and recipient must be different",
    });
  }

  const memberships = await prisma.tripUser.findMany({
    where: {
      tripId,
      userId: {
        in: [fromUserId, toUserId],
      },
    },
    select: {
      userId: true,
    },
  });

  const memberIds = new Set(memberships.map((membership) => membership.userId));
  if (!memberIds.has(fromUserId) || !memberIds.has(toUserId)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Settlement payments must reference trip participants",
    });
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = ensureObjectBody(await readBody(event));

    if (event.node.req.method === "POST") {
      if (body.tripId !== undefined) {
        const tripId = requireUuidLikeId(body.tripId, "tripId");
        await requireTripAccess(prisma, event, tripId);

        const amount = requirePositiveAmount(body.amount);
        const fromUserId = requireUuidLikeId(body.fromUserId, "fromUserId");
        const toUserId = requireUuidLikeId(body.toUserId, "toUserId");

        await ensureTripParticipantIds(tripId, fromUserId, toUserId);

        const created = await prisma.settlementPayment.create({
          data: {
            amount,
            amountCents: amountToCents(amount),
            date: requireDate(body.date, "date"),
            tripId,
            fromUserId,
            toUserId,
          },
          include: {
            fromUser: {
              select: {
                id: true,
                name: true,
              },
            },
            toUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        return normalizeSettlementPaymentRecord(created);
      }

      const tripId = requireUuidLikeId(body.id, "id");
      await requireTripAccess(prisma, event, tripId);

      const payments = await prisma.settlementPayment.findMany({
        where: {
          tripId,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { date: "desc" },
          { createdAt: "desc" },
        ],
      });

      return payments.map(normalizeSettlementPaymentRecord);
    }

    if (event.node.req.method === "PUT") {
      const paymentId = requireUuidLikeId(body.id, "id");
      const existingPayment = await prisma.settlementPayment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          tripId: true,
        },
      });

      if (!existingPayment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Settlement payment not found",
        });
      }

      await requireTripAccess(prisma, event, existingPayment.tripId);

      const amount = requirePositiveAmount(body.amount);
      const fromUserId = requireUuidLikeId(body.fromUserId, "fromUserId");
      const toUserId = requireUuidLikeId(body.toUserId, "toUserId");

      await ensureTripParticipantIds(existingPayment.tripId, fromUserId, toUserId);

      const updated = await prisma.settlementPayment.update({
        where: {
          id: paymentId,
        },
        data: {
          amount,
          amountCents: amountToCents(amount),
          date: requireDate(body.date, "date"),
          fromUserId,
          toUserId,
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return normalizeSettlementPaymentRecord(updated);
    }

    if (event.node.req.method === "DELETE") {
      const paymentId = requireUuidLikeId(body.id, "id");
      const existingPayment = await prisma.settlementPayment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          tripId: true,
        },
      });

      if (!existingPayment) {
        throw createError({
          statusCode: 404,
          statusMessage: "Settlement payment not found",
        });
      }

      await requireTripAccess(prisma, event, existingPayment.tripId);

      return await prisma.settlementPayment.delete({
        where: {
          id: paymentId,
        },
      });
    }

    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  } catch (error) {
    console.error(
      `Http Method ${event.node.req.method} created Database operation error:`,
      error,
    );
    throw normalizeRouteError(error);
  }
});
