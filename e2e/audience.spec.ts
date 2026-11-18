import { expect, type Page, test } from "@playwright/test";
import { communitiesCopy } from "@/modules/communities/client";
import { meetupsCopy } from "@/modules/meetups/client";
import { seedMeetups, storageStatePath } from "./support/profiles";

test.use({ storageState: storageStatePath("member") });

const rpgTitle = seedMeetups.rpg.title;

// O botão que abre o diálogo e o que confirma têm o mesmo texto: o segundo fica no diálogo.
async function confirmInDialog(page: Page, name: string) {
  await page.getByRole("dialog").getByRole("button", { name }).click();
}

test("encontro de comunidade aparece só para quem participa dela", async ({ page }) => {
  await page.goto("/encontros");
  await expect(page.getByText(meetupsCopy.noCommunitiesBanner)).toBeVisible();
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toBeVisible();
  await expect(page.getByRole("link", { name: rpgTitle })).toHaveCount(0);

  await page.goto("/comunidades/rpg");
  await expect(page.getByText(meetupsCopy.community.upcomingCount(1))).toBeVisible();
  await expect(page.getByText(meetupsCopy.community.membersOnly)).toBeVisible();
  await expect(page.getByRole("link", { name: rpgTitle })).toHaveCount(0);

  await page.getByRole("button", { name: communitiesCopy.joinButton }).click();
  await confirmInDialog(page, communitiesCopy.joinButton);
  await expect(page.getByRole("link", { name: rpgTitle })).toBeVisible();

  await page.goto("/encontros");
  await expect(page.getByText(meetupsCopy.noCommunitiesBanner)).toHaveCount(0);
  const card = page.getByRole("link", { name: rpgTitle });
  await expect(card).toContainText("RPG");
  const href = await card.getAttribute("href");

  await page.goto("/encontros/novo");
  await expect(page.getByRole("radio", { name: "RPG" })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Cinema" })).toHaveCount(0);

  await page.goto("/comunidades/rpg");
  await page.getByRole("button", { name: communitiesCopy.leaveButton }).click();
  await confirmInDialog(page, communitiesCopy.leaveButton);
  await expect(page.getByRole("button", { name: communitiesCopy.joinButton })).toBeVisible();

  // Sem presença confirmada, sair da comunidade tira o acesso ao encontro.
  const response = await page.goto(href ?? "/encontros/x");
  expect(response?.status()).toBe(404);
  await expect(page.getByText(meetupsCopy.notFound)).toBeVisible();
});
