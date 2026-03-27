import { expect, test } from "@playwright/test";

test("member can log in and see the trip list", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("dev-member@example.com");
  await page.getByLabel("Password").fill("dev-member-password");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
  await expect(page.getByText("Connected to /api/v1")).toBeVisible();
});
