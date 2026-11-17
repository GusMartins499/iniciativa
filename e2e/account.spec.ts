import { expect, test } from "@playwright/test";
import { accountCopy, signInCopy } from "@/modules/users/client";
import { profilePhoto, storageStatePath } from "./support/profiles";

test.use({ storageState: storageStatePath("leaver") });

test("mostra quem está na conta e sai de verdade", async ({ page }) => {
  await page.goto("/conta");
  await expect(page.getByText("Davi Teste")).toBeVisible();
  await expect(page.getByText(accountCopy.googleAccount("davi-teste@exemplo.test"))).toBeVisible();
  // Foto do Google no lugar da inicial: na barra e no topo da página.
  const photos = page.locator(`img[src="${profilePhoto}"]`);
  await expect(photos).toHaveCount(2);
  await expect(photos.first()).toBeVisible();

  await page.getByRole("button", { name: accountCopy.signOutButton }).click();

  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
  await expect(page.getByRole("link", { name: signInCopy.button })).toBeVisible();
  // A sessão acabou: as páginas do app voltam para a tela inicial.
  await page.goto("/encontros");
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
});
