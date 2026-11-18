import { expect, type Page, test } from "@playwright/test";
import { communitiesCopy as copy } from "@/modules/communities/client";
import { storageStatePath } from "./support/profiles";

test.use({ storageState: storageStatePath("member") });

// O botão que abre o diálogo e o que confirma têm o mesmo texto: o segundo fica no diálogo.
async function confirmInDialog(page: Page, name: string) {
  await page.getByRole("dialog").getByRole("button", { name }).click();
}

test("entra e sai de uma comunidade, com confirmação", async ({ page }) => {
  await page.goto("/comunidades");
  await expect(page.getByRole("heading", { level: 1, name: copy.listTitle })).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(9);

  await page.getByRole("link", { name: "Clube do livro" }).click();
  await expect(page).toHaveURL(/\/comunidades\/clube-do-livro$/);
  await expect(page.getByText(copy.members(0))).toBeVisible();

  await page.getByRole("button", { name: copy.joinButton }).click();
  await confirmInDialog(page, copy.joinButton);
  await expect(page.getByText(copy.memberNote)).toBeVisible();
  await expect(page.getByText(copy.members(1))).toBeVisible();

  await page.getByRole("button", { name: copy.leaveButton }).click();
  await confirmInDialog(page, copy.leaveButton);
  await expect(page.getByRole("button", { name: copy.joinButton })).toBeVisible();
  await expect(page.getByText(copy.members(0))).toBeVisible();
});

test("slug inexistente dá 404", async ({ page }) => {
  const response = await page.goto("/comunidades/xadrez");
  expect(response?.status()).toBe(404);
});

for (const width of [375, 640, 1280]) {
  test(`a navegação com 3 itens cabe em ${width} px sem rolagem horizontal`, async ({ page }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("/comunidades");
    const nav = page.getByRole("navigation", { name: "Principal" });
    await expect(nav.getByRole("link")).toHaveText(["Próximos", "Meus encontros", "Comunidades"]);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
    // A barra também não passa da borda do cabeçalho (o container do layout).
    const header = await page.locator("header").boundingBox();
    const avatar = await page.getByRole("link", { name: "Minha conta" }).boundingBox();
    expect((avatar?.x ?? 0) + (avatar?.width ?? 0)).toBeLessThanOrEqual(
      (header?.x ?? 0) + (header?.width ?? 0) - 16,
    );
  });
}
