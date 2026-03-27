import { expect, test } from "@playwright/test";

test("member can create, edit, delete, and sign back out", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("dev-member@example.com");
  await page.getByLabel("Password").fill("dev-member-password");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("heading", { name: "Your trips" })).toBeVisible();
  await expect(page.getByText("Connected to /api/v1")).toBeVisible();

  await page.getByRole("button", { name: "Open trip" }).click();
  await expect(page).toHaveURL(/\/trips\//);

  const expenseName = `Playwright expense ${Date.now()}`;
  const updatedExpenseName = `${expenseName} updated`;

  await page.getByRole("button", { name: "Add expense" }).click();
  await page.getByLabel("Amount").fill("19.75");
  await page.getByRole("combobox", { name: "Currency" }).focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("option", { name: "USD" }).click();
  await page.getByLabel("Location").fill("Vienna");
  await page.getByLabel("Description").fill(expenseName);
  await page.getByRole("button", { name: "Create expense" }).click();

  await expect(page.getByText(expenseName)).toBeVisible();
  await expect(page.getByText("Reference EUR")).toBeVisible();

  const expenseRow = page.locator("tr", { hasText: expenseName });
  await expenseRow.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Description").fill(updatedExpenseName);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText(updatedExpenseName)).toBeVisible();

  const updatedRow = page.locator("tr", { hasText: updatedExpenseName });
  await updatedRow.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Confirm delete" }).click();

  await expect(page.getByText(updatedExpenseName)).toHaveCount(0);

  await page.getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(/\/login\?reason=logged-out$/);
  await expect(page.getByText("You have been signed out.")).toBeVisible();
});
