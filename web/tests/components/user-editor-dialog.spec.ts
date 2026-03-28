import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserEditorDialog from "../../app/components/admin/UserEditorDialog.vue";

mockNuxtImport("useRoute", () => () => ({ path: "/admin/users" }));

describe("user editor dialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("visualViewport", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      width: 1280,
      height: 720,
    });
  });

  it("requires a password for new users", async () => {
    const wrapper = await mountSuspended(UserEditorDialog, {
      props: {
        modelValue: true,
        saving: false,
        title: "Create user",
        submitLabel: "Create user",
        isEditing: false,
        form: {
          name: "New User",
          email: "new@example.com",
          password: "",
          role: "user",
          settlementFactor: 1,
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

    const button = wrapper.get('button[type="submit"]');
    expect((button.element as HTMLButtonElement).disabled).toBe(true);
  });

  it("allows editing without changing the password", async () => {
    const wrapper = await mountSuspended(UserEditorDialog, {
      props: {
        modelValue: true,
        saving: false,
        title: "Edit user",
        submitLabel: "Save user",
        isEditing: true,
        form: {
          name: "Dev Admin",
          email: "dev-admin@example.com",
          password: "",
          role: "admin",
          settlementFactor: 1.5,
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

    await wrapper.find("form").trigger("submit");
    expect(wrapper.emitted("submit")).toBeTruthy();
  });
});
