<script setup lang="ts">
import type { SettlementMember, SettlementPayment } from "~/utils/trip-settlement";

const props = defineProps<{
  modelValue: boolean;
  totalAmount: number;
  factorTotal: number;
  members: SettlementMember[];
  payments: SettlementPayment[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();
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
          :key="`${payment.fromUserId}-${payment.toUserId}`"
          class="px-0"
        >
          <template #prepend>
            <v-avatar color="secondary" variant="tonal" size="32">
              <v-icon icon="mdi-swap-horizontal" />
            </v-avatar>
          </template>
          <template #append>
            <strong>EUR {{ payment.amount.toFixed(2) }}</strong>
          </template>
          <v-list-item-title>{{ payment.fromName }} pays {{ payment.toName }}</v-list-item-title>
        </v-list-item>
      </v-list>

      <v-alert v-else type="success" variant="tonal">
        No balancing payments are needed right now.
      </v-alert>
    </v-card>
  </v-dialog>
</template>
