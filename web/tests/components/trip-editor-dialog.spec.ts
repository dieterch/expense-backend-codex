import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import TripEditorDialog from "../../app/components/admin/TripEditorDialog.vue";

mockNuxtImport("useRoute", () => () => ({ path: "/trips" }));

describe("trip editor dialog", () => {
  const baseProps = {
    modelValue: true,
    saving: false,
    title: "Create trip",
    submitLabel: "Create trip",
    form: {
      name: "Team Offsite",
      startDate: "2026-03-27",
      endDate: "",
      userIds: ["user-1"],
    },
    users: [
      { id: "user-1", name: "Dev Admin", email: "dev-admin@example.com" },
      { id: "user-2", name: "Dev Member", email: "dev-member@example.com" },
    ],
  };

  it("requires at least one participant", async () => {
    const wrapper = await mountSuspended(TripEditorDialog, {
      props: {
        ...baseProps,
        form: {
          ...baseProps.form,
          userIds: [],
        },
      },
      global: {
        stubs: {
          VDialog: {
            props: ["modelValue"],
            template: "<div><slot /></div>",
          },
        },
      },
    });

    expect(wrapper.text()).toContain("Participants");
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeDefined();
  });

  it("emits submit for a valid trip payload", async () => {
    const wrapper = await mountSuspended(TripEditorDialog, {
      props: baseProps,
      global: {
        stubs: {
          VDialog: {
            props: ["modelValue"],
            template: "<div><slot /></div>",
          },
        },
      },
    });

    await wrapper.find("form").trigger("submit");

    expect(wrapper.emitted("submit")).toBeTruthy();
    expect(wrapper.text()).toContain("Create trip");
  });
});
