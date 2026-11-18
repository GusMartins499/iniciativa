import { describe, expect, it } from "vitest";
import { accountCopy, CONSENT_VERSION, onboardingCopy, privacyCopy } from "./copy";

// Texto corrido de cada termo, para conferir o que ele cobre sem depender da ordem das frases.
const summary = onboardingCopy.consentText.join("\n");
const fullText = privacyCopy.sections
  .flatMap((section) => [
    section.title,
    ...(section.paragraphs ?? []),
    ...(section.items ?? []),
    ...(section.after ?? []),
  ])
  .join("\n");

// O que o termo v2 precisa cobrir, no resumo de /boas-vindas e no texto completo de /privacidade.
const v2Topics: [string, RegExp][] = [
  [
    "nome e foto nos comentários",
    /coment[áa]rio[^\n]*nome e[^\n]*foto|nome e[^\n]*foto[^\n]*coment[áa]rio/i,
  ],
  ["nome e foto para o criador do encontro", /cria um encontro[^\n]*nome[^\n]*foto/i],
  ["participação em comunidades, só contagem", /comunidade[^\n]*(número|contagem|quantas)/i],
  ["sem lista de membros", /lista de (membros|quem participa)/i],
  [
    "conteúdo dos comentários",
    /o que você escreve[^\n]*coment[áa]rio|texto dos? (seus )?coment[áa]rios/i,
  ],
  [
    "aviso para não escrever dados pessoais ou de saúde",
    /não escreva[^\n]*dados pessoais[^\n]*saúde/i,
  ],
  ["apagamento 30 dias depois do fim do encontro", /30 dias depois do fim do encontro/i],
  [
    "contagens anônimas por encontro",
    /contage(m|ns)[^\n]*coment[áa]rios[^\n]*encontro[^\n]*(sem|não)[^\n]*quem/i,
  ],
  ["o que a exclusão de conta apaga", /excluir a (sua )?conta[^\n]*apaga/i],
];

describe("termo de consentimento v2", () => {
  it("sobe a versão do termo para a v2", () => {
    expect(CONSENT_VERSION).toBe("v2");
    expect(onboardingCopy.consentTitle).toBe("Termo de consentimento (versão 2)");
    expect(privacyCopy.version).toBe("Versão 2");
  });

  it.each(v2Topics)("o resumo em /boas-vindas cobre %s", (_topic, pattern) => {
    expect(summary).toMatch(pattern);
  });

  it.each(v2Topics)("o texto completo em /privacidade cobre %s", (_topic, pattern) => {
    expect(fullText).toMatch(pattern);
  });

  it("mantém a lista de operadores: Vercel, Neon, Grafana Labs e Google, sem nenhum outro", () => {
    const services = privacyCopy.sections.find((section) => section.title.includes("Serviços"));
    const operators = (services?.items ?? []).map((item) => item.split(":")[0]);
    expect(operators).toEqual(["Google", "Vercel", "Neon", "Grafana Labs"]);
  });

  it("não diz mais que só o criador vê o nome nem que o app não tem conversa", () => {
    for (const text of [summary, fullText]) {
      expect(text).not.toMatch(/não tem chat/i);
      expect(text).not.toMatch(/só (quem cria|o criador)[^\n]*vê[^\n]*nome/i);
    }
  });
});

// Cada consequência da exclusão, como aparece na tela /conta e na seção 11 do termo.
const deletionTopics: [string, RegExp][] = [
  ["perfil, autodeclaração e consentimento", /perfil[^\n]*autodeclaração[^\n]*consentimento/i],
  ["participação nas comunidades", /participação nas comunidades/i],
  ['comentários viram "Comentário apagado"', /coment[áa]rios[^\n]*"Comentário apagado"/i],
  ["encontros futuros cancelados", /encontros futuros que você criou/i],
  ["presenças canceladas", /presenças confirmadas/i],
];

const termDeletion = privacyCopy.sections.find((section) =>
  section.title.includes("Excluir a conta"),
);
const termDeletionItems = termDeletion?.items ?? [];

describe("consequências da exclusão de conta em /conta", () => {
  it("cita a participação nas comunidades e os comentários", () => {
    expect(accountCopy.deleteConsequences).toContain("Apaga a sua participação nas comunidades.");
    expect(accountCopy.deleteConsequences).toContain(
      'Troca os seus comentários por "Comentário apagado".',
    );
  });

  it.each(deletionTopics.slice(1, 3))("o diálogo de confirmação cita %s", (_topic, pattern) => {
    expect(accountCopy.deleteDescription).toMatch(pattern);
  });

  it.each([...accountCopy.deleteConsequences])(
    'o item "%s" tem um correspondente no termo',
    (item) => {
      const topic = deletionTopics.find(([, pattern]) => pattern.test(item));
      expect(topic, `nenhum tema conhecido cobre "${item}"`).toBeDefined();
      const [, pattern] = topic as [string, RegExp];
      expect(termDeletionItems.some((termItem) => pattern.test(termItem))).toBe(true);
    },
  );
});
