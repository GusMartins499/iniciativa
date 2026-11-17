import { expect, test } from "@playwright/test";
import { meetupsCopy } from "@/modules/meetups/client";
import { onboardingCopy } from "@/modules/users/client";
import { storageStatePath } from "./support/profiles";

test.use({ storageState: storageStatePath("newcomer") });

test("usuário novo conclui a autodeclaração", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/boas-vindas/);

  await page.getByLabel(onboardingCopy.declarationLabel).check();
  await page.getByLabel(onboardingCopy.consentLabel).check();
  await page.getByRole("button", { name: onboardingCopy.continueButton }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: onboardingCopy.dialogConfirm })
    .click();

  await expect(page).toHaveURL(/\/encontros$/);
  await expect(page.getByRole("heading", { level: 1, name: meetupsCopy.listTitle })).toBeVisible();
});
