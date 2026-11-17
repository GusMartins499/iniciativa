import { expect, test } from "@playwright/test";
import { signInCopy } from "@/modules/users/client";

test("visitante sem sessão é levado para /entrar", async ({ page }) => {
  await page.goto("/encontros");

  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByRole("button", { name: signInCopy.button })).toBeVisible();
});
