import { expect, test } from "@playwright/test";
import { meetupsCopy } from "@/modules/meetups/client";
import { signInCopy } from "@/modules/users/client";
import { storageStatePath } from "./support/profiles";

test("visitante sem sessão é levado para a tela inicial", async ({ page }) => {
  await page.goto("/encontros");

  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
  await expect(page.getByRole("link", { name: signInCopy.button })).toBeVisible();
});

test("o endereço antigo /entrar leva à tela inicial", async ({ page }) => {
  await page.goto("/entrar");

  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
});

test.describe("com cadastro completo", () => {
  test.use({ storageState: storageStatePath("member") });

  test("a tela inicial leva direto aos encontros", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/encontros$/);
    // Sem foto de perfil, a barra mostra a inicial do primeiro nome (Ana).
    await expect(page.getByRole("link", { name: "Minha conta" })).toHaveText("A");
    await expect(
      page.getByRole("heading", { level: 1, name: meetupsCopy.listTitle }),
    ).toBeVisible();
  });
});
