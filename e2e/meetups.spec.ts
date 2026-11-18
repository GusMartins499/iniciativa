import { expect, type Page, test } from "@playwright/test";
import { addDays } from "date-fns";
import { meetupsCopy } from "@/modules/meetups/client";
import { rsvpsCopy } from "@/modules/rsvps/client";
import { toAppDateInput } from "@/shared/time";
import { seedMeetups, storageStatePath } from "./support/profiles";

test.use({ storageState: storageStatePath("member") });

const form = meetupsCopy.form;

// O botão que abre o diálogo e o que confirma têm o mesmo texto: o segundo fica no diálogo.
async function confirmInDialog(page: Page, name: string) {
  await page.getByRole("dialog").getByRole("button", { name }).click();
}

async function openMeetup(page: Page, title: string) {
  await page.goto("/encontros");
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

test("cria um encontro e vê na lista e no detalhe", async ({ page }) => {
  // Título único por tentativa: um retry no CI não encontra o encontro da tentativa anterior.
  const title = `Jogos de tabuleiro na biblioteca ${test.info().retry + 1}`;
  const address = "Biblioteca Pública, Rua Lauro Müller";

  await page.goto("/encontros/novo");
  await page.getByLabel(form.titleLabel).fill(title);
  await page.getByLabel(form.dateLabel).fill(toAppDateInput(addDays(new Date(), 14)));
  await page.getByLabel(form.startTimeLabel).fill("14:00");
  await page.getByLabel(form.endTimeLabel).fill("16:30");
  await page.getByLabel(form.addressLabel).fill(address);
  await page.getByLabel(form.capacityLabel).fill("6");
  await page.getByLabel(form.publicPlaceLabel).check();
  await page.getByLabel(form.audienceOpen).check();
  await page.getByRole("button", { name: form.submit }).click();
  await confirmInDialog(page, form.dialogConfirm);

  await expect(page).toHaveURL(/\/encontros\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText(address)).toBeVisible();
  await expect(page.getByText(meetupsCopy.seatsTaken(1, 6))).toBeVisible();
  await expect(page.getByText(rsvpsCopy.creatorNote)).toBeVisible();

  await page.goto("/encontros");
  await expect(
    page.getByRole("listitem").filter({ has: page.getByRole("link", { name: title }) }),
  ).toContainText(meetupsCopy.tags.open);

  await page.goto("/meus-encontros");
  await expect(
    page.getByRole("region", { name: "Criados por mim" }).getByRole("link", { name: title }),
  ).toBeVisible();
});

test("confirma e cancela presença com acompanhante", async ({ page }) => {
  const { title, capacity } = seedMeetups.hosted;
  await openMeetup(page, title);
  await expect(page.getByText(meetupsCopy.seatsTaken(1, capacity))).toBeVisible();

  await page.getByLabel(rsvpsCopy.withCompanionLabel).check();
  await page.getByRole("button", { name: rsvpsCopy.confirmButton }).click();
  await confirmInDialog(page, rsvpsCopy.confirmDialogTitle);

  await expect(page.getByText(rsvpsCopy.confirmedWithCompanionNote)).toBeVisible();
  await expect(page.getByText(meetupsCopy.seatsTaken(3, capacity))).toBeVisible();

  await page.getByRole("button", { name: rsvpsCopy.cancelButton }).click();
  await confirmInDialog(page, rsvpsCopy.cancelDialogTitle);

  await expect(page.getByText(meetupsCopy.seatsTaken(1, capacity))).toBeVisible();
  await expect(page.getByRole("button", { name: rsvpsCopy.confirmButton })).toBeVisible();
});

test("criador edita e cancela o próprio encontro", async ({ page }) => {
  const newTitle = "Caminhada no parque da cidade";
  const newAddress = "Parque Municipal, Avenida Marcolino Martins Cabral";
  await openMeetup(page, seedMeetups.ownedByMember.title);

  await page.getByRole("link", { name: meetupsCopy.editLink }).click();
  await page.getByLabel(form.titleLabel).fill(newTitle);
  await page.getByLabel(form.addressLabel).fill(newAddress);
  await page.getByRole("button", { name: meetupsCopy.editForm.submit }).click();
  await confirmInDialog(page, meetupsCopy.editForm.dialogConfirm);

  await expect(page.getByRole("heading", { level: 1, name: newTitle })).toBeVisible();
  await expect(page.getByText(newAddress)).toBeVisible();
  await expect(page.getByText(meetupsCopy.editedNotice)).toBeVisible();

  await page.getByRole("button", { name: meetupsCopy.cancelMeetupButton }).click();
  await confirmInDialog(page, meetupsCopy.cancelMeetupButton);

  await expect(page.getByText(meetupsCopy.cancelledNotice)).toBeVisible();
});
