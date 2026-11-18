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
  const link = page.getByRole("link", { name: rpgTitle });
  const href = await link.getAttribute("href");

  await page.goto("/comunidades");
  const rpgCard = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name: "RPG", exact: true }) });
  await expect(rpgCard.getByText(meetupsCopy.community.upcomingCount(1))).toBeVisible();
  await rpgCard.getByRole("link", { name: communitiesCopy.seeMeetups }).click();
  await expect(page).toHaveURL(/\/comunidades\/rpg$/);
  await expect(page.getByRole("link", { name: rpgTitle })).toBeVisible();

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

test("filtra Próximos por uma comunidade e guarda a escolha na URL", async ({ page }) => {
  await page.goto("/comunidades/rpg");
  await page.getByRole("button", { name: communitiesCopy.joinButton }).click();
  await confirmInDialog(page, communitiesCopy.joinButton);
  await expect(page.getByRole("button", { name: communitiesCopy.leaveButton })).toBeVisible();

  await page.goto("/encontros");
  const filter = page.getByRole("navigation", { name: meetupsCopy.filter.label });
  await expect(filter.getByRole("link", { name: meetupsCopy.filter.all })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("link", { name: rpgTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toBeVisible();

  await filter.getByRole("link", { name: "RPG", exact: true }).click();
  await expect(page).toHaveURL(/\/encontros\?publico=rpg$/);
  await expect(filter.getByRole("link", { name: "RPG", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("link", { name: rpgTitle })).toBeVisible();
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toHaveCount(0);
  await expect(page.getByRole("link", { name: rpgTitle })).toBeVisible();

  await filter.getByRole("link", { name: meetupsCopy.filter.open }).click();
  await expect(page).toHaveURL(/\/encontros\?publico=abertos$/);
  await expect(page.getByRole("link", { name: rpgTitle })).toHaveCount(0);
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/encontros\?publico=rpg$/);
  await expect(page.getByRole("link", { name: seedMeetups.hosted.title })).toHaveCount(0);

  // Comunidade de que a pessoa não é membro cai em "Todos", sem erro.
  const response = await page.goto("/encontros?publico=cinema");
  expect(response?.status()).toBe(200);
  await expect(filter.getByRole("link", { name: meetupsCopy.filter.all })).toHaveAttribute(
    "aria-current",
    "true",
  );

  // Devolve o member ao estado inicial (sem comunidades) para os specs seguintes.
  await page.goto("/comunidades/rpg");
  await page.getByRole("button", { name: communitiesCopy.leaveButton }).click();
  await confirmInDialog(page, communitiesCopy.leaveButton);
  await expect(page.getByRole("button", { name: communitiesCopy.joinButton })).toBeVisible();
});
