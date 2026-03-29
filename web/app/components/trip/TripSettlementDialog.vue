<script setup lang="ts">
import {
  getConfirmedSettlementPaymentActionKey,
  getSuggestedSettlementPaymentKey,
  type ConfirmedSettlementPayment,
  type SettlementMember,
  type SettlementPayment,
} from "~/utils/trip-settlement";

type ParticipantOption = {
  user: {
    id: string;
    name: string;
  };
};

const props = defineProps<{
  modelValue: boolean;
  totalAmount: number;
  factorTotal: number;
  members: SettlementMember[];
  participants: ParticipantOption[];
  payments: SettlementPayment[];
  confirmedPayments: ConfirmedSettlementPayment[];
  busyPaymentKey: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "confirm-payment": [payment: SettlementPayment];
  "update-payment": [payment: { id: string; fromUserId: string; toUserId: string; amount: number; date: string }];
  "cancel-payment": [paymentId: string];
}>();

const editingPaymentId = ref<string | null>(null);
const editForm = reactive({
  fromUserId: "",
  toUserId: "",
  amount: 0,
  date: "",
});

const participantOptions = computed(() =>
  props.participants.map((participant) => ({
    value: participant.user.id,
    title: participant.user.name,
  })),
);

const editFormValid = computed(() =>
  !!editForm.fromUserId &&
  !!editForm.toUserId &&
  editForm.fromUserId !== editForm.toUserId &&
  Number.isFinite(editForm.amount) &&
  editForm.amount > 0 &&
  !!editForm.date,
);

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function startEditing(payment: ConfirmedSettlementPayment) {
  editingPaymentId.value = payment.id;
  editForm.fromUserId = payment.fromUserId;
  editForm.toUserId = payment.toUserId;
  editForm.amount = payment.amount;
  editForm.date = payment.date.slice(0, 10);
}

function stopEditing() {
  editingPaymentId.value = null;
  editForm.fromUserId = "";
  editForm.toUserId = "";
  editForm.amount = 0;
  editForm.date = "";
}

function saveEdit() {
  if (!editingPaymentId.value || !editFormValid.value) {
    return;
  }

  emit("update-payment", {
    id: editingPaymentId.value,
    fromUserId: editForm.fromUserId,
    toUserId: editForm.toUserId,
    amount: Number(editForm.amount),
    date: editForm.date,
  });
  stopEditing();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="920"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card color="surface" class="pa-4 pa-md-6">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <div class="text-overline text-secondary page-title font-weight-bold">Settlement</div>
          <div class="text-h5">Weighted trip settlement</div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="emit('update:modelValue', false)" />
      </div>

      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Tracked total</div>
            <div class="text-h6">EUR {{ totalAmount.toFixed(2) }}</div>
          </v-sheet>
        </v-col>
        <v-col cols="12" md="6">
          <v-sheet color="background" rounded="xl" class="pa-4">
            <div class="text-caption text-medium-emphasis">Factor sum</div>
            <div class="text-h6">{{ factorTotal.toFixed(2) }}</div>
          </v-sheet>
        </v-col>
      </v-row>

      <div class="text-subtitle-1 font-weight-bold mb-3">Participant breakdown</div>
      <div class="table-shell mb-6">
        <v-table density="comfortable">
          <thead>
            <tr>
              <th>Participant</th>
              <th class="text-right">Factor</th>
              <th class="text-right">Paid</th>
              <th class="text-right">Target share</th>
              <th class="text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in members" :key="member.userId">
              <td>{{ member.name }}</td>
              <td class="text-right">{{ member.factor.toFixed(2) }}</td>
              <td class="text-right">EUR {{ member.paid.toFixed(2) }}</td>
              <td class="text-right">EUR {{ member.share.toFixed(2) }}</td>
              <td class="text-right">
                <span :class="member.balance >= 0 ? 'text-success' : 'text-error'">
                  EUR {{ member.balance.toFixed(2) }}
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div class="text-subtitle-1 font-weight-bold mb-3">Suggested payments</div>
      <v-list v-if="payments.length" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="payment in payments"
          :key="getSuggestedSettlementPaymentKey(payment)"
          class="px-0"
        >
          <template #prepend>
            <v-avatar color="secondary" variant="tonal" size="32">
              <v-icon icon="mdi-swap-horizontal" />
            </v-avatar>
          </template>
          <template #append>
            <div class="d-flex align-center ga-3">
              <strong>EUR {{ payment.amount.toFixed(2) }}</strong>
              <v-btn
                color="secondary"
                variant="tonal"
                size="small"
                :loading="busyPaymentKey === getSuggestedSettlementPaymentKey(payment)"
                @click="emit('confirm-payment', payment)"
              >
                Confirmed
              </v-btn>
            </div>
          </template>
          <v-list-item-title>{{ payment.fromName }} pays {{ payment.toName }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-alert v-else type="success" variant="tonal">
        No balancing payments are needed right now.
      </v-alert>

      <div class="text-subtitle-1 font-weight-bold mt-6 mb-3">Confirmed payments</div>
      <v-list v-if="confirmedPayments.length" bg-color="transparent" class="pa-0">
        <v-list-item
          v-for="payment in confirmedPayments"
          :key="payment.id"
          class="px-0"
        >
          <template #prepend>
            <v-avatar color="primary" variant="tonal" size="32">
              <v-icon icon="mdi-check-bold" />
            </v-avatar>
          </template>
          <template #append>
            <div class="d-flex align-center ga-2 flex-wrap justify-end">
              <strong>EUR {{ payment.amount.toFixed(2) }}</strong>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                :loading="busyPaymentKey === getConfirmedSettlementPaymentActionKey(payment.id, 'edit')"
                @click="startEditing(payment)"
              >
                Edit
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                color="error"
                :loading="busyPaymentKey === getConfirmedSettlementPaymentActionKey(payment.id, 'cancel')"
                @click="emit('cancel-payment', payment.id)"
              >
                Cancel
              </v-btn>
            </div>
          </template>
          <v-list-item-title>{{ payment.fromName }} paid {{ payment.toName }}</v-list-item-title>
          <v-list-item-subtitle>{{ formatDate(payment.date) }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
      <v-alert v-else type="info" variant="tonal">
        No settlement payments have been confirmed yet.
      </v-alert>

      <v-dialog
        :model-value="Boolean(editingPaymentId)"
        max-width="560"
        @update:model-value="(value) => { if (!value) stopEditing(); }"
      >
        <v-card color="surface" class="pa-4 pa-md-6">
          <div class="d-flex justify-space-between align-center mb-4">
            <div>
              <div class="text-overline text-secondary page-title font-weight-bold">Settlement</div>
              <div class="text-h5">Edit confirmed payment</div>
            </div>
            <v-btn icon="mdi-close" variant="text" @click="stopEditing" />
          </div>

          <v-form @submit.prevent="saveEdit">
            <v-select
              v-model="editForm.fromUserId"
              :items="participantOptions"
              label="Payer"
              class="mb-3"
            />
            <v-select
              v-model="editForm.toUserId"
              :items="participantOptions"
              label="Recipient"
              class="mb-3"
            />
            <v-text-field
              v-model.number="editForm.amount"
              type="number"
              min="0.01"
              step="0.01"
              label="Amount (EUR)"
              class="mb-3"
            />
            <v-text-field
              v-model="editForm.date"
              type="date"
              label="Payment date"
              class="mb-4"
            />

            <div class="d-flex justify-end ga-3">
              <v-btn variant="tonal" color="primary" @click="stopEditing">
                Close
              </v-btn>
              <v-btn
                type="submit"
                color="secondary"
                :disabled="!editFormValid"
                :loading="editingPaymentId ? busyPaymentKey === getConfirmedSettlementPaymentActionKey(editingPaymentId, 'edit') : false"
              >
                Save changes
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>
