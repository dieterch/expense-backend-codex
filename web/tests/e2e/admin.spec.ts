import { expect, test } from "@playwright/test";

test("admin can manage users, categories, and currencies", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill("dev-admin@example.com");
  await page.getByLabel("Password").fill("dev-admin-password");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/trips$/);
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();

  const suffix = Date.now();
  const userEmail = `playwright-admin-${suffix}@example.com`;
  const categoryName = `Playwright Category ${suffix}`;
  const categoryNameUpdated = `${categoryName} Updated`;
  const currencyCode = `PW${String(suffix).slice(-2)}`;

  await page.getByRole("link", { name: "Users" }).click();
  await expect(page).toHaveURL(/\/admin\/users$/);
  await page.getByRole("button", { name: "Add user" }).click();
  await page.getByLabel("Name").fill("Playwright Admin User");
  await page.getByLabel("Email").fill(userEmail);
  await page.getByLabel("Password").fill("playwright-password");
  await page.getByRole("button", { name: "Create user" }).click();
  await expect(page.getByText(userEmail)).toBeVisible();

  const userRow = page.locator("tr", { hasText: userEmail });
  await userRow.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Name").fill("Playwright Admin User Updated");
  await page.getByRole("button", { name: "Save user" }).click();
  await expect(page.getByText("Playwright Admin User Updated")).toBeVisible();
  await userRow.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(userEmail)).toHaveCount(0);

  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByLabel("Name").fill(categoryName);
  await page.getByLabel("Icon").fill("mdi-test-tube");
  await page.getByRole("button", { name: "Create category" }).click();
  await expect(page.getByText(categoryName)).toBeVisible();

  await page.locator("tr", { hasText: categoryName }).getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Name").fill(categoryNameUpdated);
  await page.getByRole("button", { name: "Save category" }).click();
  await expect(page.getByText(categoryNameUpdated)).toBeVisible();
  await page.locator("tr", { hasText: categoryNameUpdated }).getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(categoryNameUpdated)).toHaveCount(0);

  await page.getByRole("link", { name: "Currencies" }).click();
  await expect(page).toHaveURL(/\/admin\/currencies$/);
  await page.getByRole("button", { name: "Add currency" }).click();
  await page.getByLabel("Code").fill(currencyCode);
  await page.getByLabel("Symbol").fill(currencyCode);
  await page.getByLabel("Factor").fill("1.2345");
  await page.getByRole("button", { name: "Create currency" }).click();
  const currencyRow = page.locator("tr", { hasText: currencyCode });
  await expect(currencyRow).toBeVisible();

  await currencyRow.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Symbol").fill(`${currencyCode}!`);
  await page.getByRole("button", { name: "Save currency" }).click();
  await expect(page.locator("tr", { hasText: `${currencyCode}!` })).toBeVisible();
  await page.locator("tr", { hasText: `${currencyCode}!` }).getByRole("button", { name: "Delete" }).click();
  await expect(page.locator("tr", { hasText: currencyCode })).toHaveCount(0);
});
