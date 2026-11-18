import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { communitiesCopy } from "@/modules/communities/client";
import { meetupsCopy } from "@/modules/meetups/client";
import { onboardingCopy } from "@/modules/users/client";
import { type StorageState } from "./support/sign-in";
import { storageStatePath } from "./support/profiles";

// Cadastro novo de ponta a ponta, menos o Google: o aceite é gravado pelo app de verdade
// (cookie assinado), a ida ao Google é bloqueada e a sessão que o Google criaria é
// injetada. Depois, o retorno do Google cai em /boas-vindas/concluir, como no app.
test("conta nova: aceite antes do Google, conclusão e escolha de comunidades levam aos encontros", async ({
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

  // Conta nova escolhe comunidades antes de entrar; nenhuma vem marcada.
  const step = communitiesCopy.onboarding;
  await expect(page).toHaveURL(/\/boas-vindas\/comunidades$/);
  await expect(page.getByRole("heading", { level: 1, name: step.title })).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(9);
  for (const box of await page.getByRole("checkbox").all()) await expect(box).not.toBeChecked();

  await page.getByRole("checkbox", { name: /Cinema/ }).check();
  await page.getByRole("checkbox", { name: /Corrida/ }).check();
  await page.getByRole("button", { name: step.continueButton }).click();
  await page.getByRole("dialog").getByRole("button", { name: step.dialogTitle }).click();

  await expect(page).toHaveURL(/\/encontros$/);
  await expect(page.getByRole("heading", { level: 1, name: meetupsCopy.listTitle })).toBeVisible();

  // Mesmo efeito de entrar pela página "Comunidades".
  await page.goto("/comunidades");
  await expect(page.getByText(communitiesCopy.memberNote)).toHaveCount(2);

  // Voltar ao passo e salvar de novo não duplica participações.
  await page.goto("/boas-vindas/comunidades");
  await page.getByRole("checkbox", { name: /Cinema/ }).check();
  await page.getByRole("button", { name: step.continueButton }).click();
  await page.getByRole("dialog").getByRole("button", { name: step.dialogTitle }).click();
  await expect(page).toHaveURL(/\/encontros$/);
  await page.goto("/comunidades/cinema");
  await expect(page.getByText(communitiesCopy.members(1))).toBeVisible();
});

test("pular o passo de comunidades leva a Próximos", async ({ page, context }) => {
  const member = JSON.parse(await readFile(storageStatePath("member"), "utf8")) as StorageState;
  await context.addCookies(member.cookies);

  await page.goto("/boas-vindas/comunidades");
  await page.getByRole("link", { name: communitiesCopy.onboarding.skipButton }).click();

  await expect(page).toHaveURL(/\/encontros$/);
});
