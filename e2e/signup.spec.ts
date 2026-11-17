import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { meetupsCopy } from "@/modules/meetups/client";
import { onboardingCopy } from "@/modules/users/client";
import { type StorageState } from "./support/sign-in";
import { storageStatePath } from "./support/profiles";

// Cadastro novo de ponta a ponta, menos o Google: o aceite é gravado pelo app de verdade
// (cookie assinado), a ida ao Google é bloqueada e a sessão que o Google criaria é
// injetada. Depois, o retorno do Google cai em /boas-vindas/concluir, como no app.
test("conta nova: aceite antes do Google e conclusão levam aos encontros", async ({
  page,
  context,
}) => {
  await page.route("**/api/auth/sign-in/social", (route) => route.abort());

  await page.goto("/boas-vindas");
  await page.getByLabel(onboardingCopy.declarationLabel).check();
  await page.getByLabel(onboardingCopy.consentLabel).check();
  await page.getByRole("button", { name: onboardingCopy.continueButton }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: onboardingCopy.dialogConfirm })
    .click();

  // O app tentou ir ao Google (bloqueado aqui) depois de gravar o aceite.
  await expect(page.getByText(onboardingCopy.errors.SIGN_UP_FAILED)).toBeVisible();
  const consent = (await context.cookies()).find((c) => c.name === "iniciativa.signup-consent");
  expect(consent, "cookie do aceite gravado pelo app").toBeDefined();

  const signup = JSON.parse(await readFile(storageStatePath("signup"), "utf8")) as StorageState;
  await context.addCookies(signup.cookies);

  await page.goto("/boas-vindas/concluir");

  await expect(page).toHaveURL(/\/encontros$/);
  await expect(page.getByRole("heading", { level: 1, name: meetupsCopy.listTitle })).toBeVisible();
});
