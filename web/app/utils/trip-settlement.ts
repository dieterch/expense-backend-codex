import { getExpenseDisplayAmount } from "./expense-reference";

type ParticipantLike = {
  user: {
    id: string;
    name: string;
    settlementFactor?: number | null;
  };
};

type ExpenseLike = {
  amount: number;
  currency: string;
  referenceEurAmount?: number | null;
  manualReferenceEurAmount?: number | null;
  user?: {
    id: string;
    name: string;
  } | null;
};

export type SettlementMember = {
  userId: string;
  name: string;
  factor: number;
  paid: number;
  share: number;
  balance: number;
};

export type SettlementPayment = {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
};

export type ConfirmedSettlementPayment = SettlementPayment & {
  id: string;
  tripId: string;
  amountCents?: number | null;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type TripSettlement = {
  totalAmount: number;
  factorTotal: number;
  members: SettlementMember[];
  payments: SettlementPayment[];
};

function amountToCents(amount: number) {
  return Math.round(amount * 100);
}

function centsToAmount(amountCents: number) {
  return amountCents / 100;
}

function getConfirmedPaymentAmountCents(payment: ConfirmedSettlementPayment) {
  return typeof payment.amountCents === "number" ? payment.amountCents : amountToCents(payment.amount);
}

export function getSuggestedSettlementPaymentKey(payment: SettlementPayment) {
  return `${payment.fromUserId}:${payment.toUserId}:${amountToCents(payment.amount)}`;
}

export function getConfirmedSettlementPaymentActionKey(paymentId: string, action: "edit" | "cancel") {
  return `${action}:${paymentId}`;
}

export function calculateTripSettlement(
  participants: ParticipantLike[],
  expenses: ExpenseLike[],
  confirmedPayments: ConfirmedSettlementPayment[] = [],
): TripSettlement {
  const members = participants.map((participant) => ({
    userId: participant.user.id,
    name: participant.user.name,
    factor: participant.user.settlementFactor && participant.user.settlementFactor > 0
      ? participant.user.settlementFactor
      : 1,
  }));

  const paidByUser = new Map<string, number>();
  let totalAmountCents = 0;

  for (const expense of expenses) {
    const amountCents = amountToCents(getExpenseDisplayAmount(expense));
    totalAmountCents += amountCents;

    if (expense.user?.id) {
      paidByUser.set(expense.user.id, (paidByUser.get(expense.user.id) || 0) + amountCents);
    }
  }

  const factorTotal = members.reduce((sum, member) => sum + member.factor, 0);

  if (!members.length || factorTotal <= 0) {
    return {
      totalAmount: centsToAmount(totalAmountCents),
      factorTotal: 0,
      members: [],
      payments: [],
    };
  }

  const rawShares = members.map((member) => ({
    userId: member.userId,
    rawShareCents: (totalAmountCents * member.factor) / factorTotal,
  }));

  const flooredShares = rawShares.map((entry) => ({
    userId: entry.userId,
    shareCents: Math.floor(entry.rawShareCents),
    remainder: entry.rawShareCents - Math.floor(entry.rawShareCents),
  }));

  let remainingCents = totalAmountCents - flooredShares.reduce((sum, entry) => sum + entry.shareCents, 0);

  flooredShares
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((entry) => {
      if (remainingCents > 0) {
        entry.shareCents += 1;
        remainingCents -= 1;
      }
    });

  const shareByUser = new Map(flooredShares.map((entry) => [entry.userId, entry.shareCents]));
  const settlementAdjustmentByUser = new Map<string, number>();

  for (const payment of confirmedPayments) {
    const amountCents = getConfirmedPaymentAmountCents(payment);
    settlementAdjustmentByUser.set(payment.fromUserId, (settlementAdjustmentByUser.get(payment.fromUserId) || 0) + amountCents);
    settlementAdjustmentByUser.set(payment.toUserId, (settlementAdjustmentByUser.get(payment.toUserId) || 0) - amountCents);
  }

  const settlementMembers = members
    .map((member) => {
      const paidCents = paidByUser.get(member.userId) || 0;
      const shareCents = shareByUser.get(member.userId) || 0;
      const settlementAdjustmentCents = settlementAdjustmentByUser.get(member.userId) || 0;
      const balanceCents = paidCents - shareCents + settlementAdjustmentCents;

      return {
        userId: member.userId,
        name: member.name,
        factor: member.factor,
        paid: centsToAmount(paidCents),
        share: centsToAmount(shareCents),
        balance: centsToAmount(balanceCents),
        balanceCents,
      };
    })
    .sort((left, right) => right.balance - left.balance);

  const creditors = settlementMembers
    .filter((member) => member.balanceCents > 0)
    .map((member) => ({ ...member }));
  const debtors = settlementMembers
    .filter((member) => member.balanceCents < 0)
    .map((member) => ({ ...member, debtCents: Math.abs(member.balanceCents) }));

  const payments: SettlementPayment[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    const amountCents = Math.min(creditor.balanceCents, debtor.debtCents);

    if (amountCents > 0) {
      payments.push({
        fromUserId: debtor.userId,
        fromName: debtor.name,
        toUserId: creditor.userId,
        toName: creditor.name,
        amount: centsToAmount(amountCents),
      });
    }

    creditor.balanceCents -= amountCents;
    debtor.debtCents -= amountCents;

    if (creditor.balanceCents === 0) {
      creditorIndex += 1;
    }

    if (debtor.debtCents === 0) {
      debtorIndex += 1;
    }
  }

  return {
    totalAmount: centsToAmount(totalAmountCents),
    factorTotal,
    members: settlementMembers.map(({ balanceCents: _ignored, ...member }) => member),
    payments,
  };
}
