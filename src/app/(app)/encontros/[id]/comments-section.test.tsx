import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { CommentView } from "@/modules/comments/client";
import type { CommentFormProps } from "./comment-form";
import type { CommentListProps } from "./comment-list";
import { CommentsSection } from "./comments-section";

vi.mock("@/modules/comments", async () => import("@/modules/comments/client"));

const noop = async () => ({ code: null });
const at = new Date("2026-12-05T18:10:00.000Z");

function comment(overrides: Partial<CommentView>): CommentView {
  return {
    id: "c1",
    body: "Oi",
    author: { firstName: "Bia", image: null },
    isOrganizer: false,
    canDelete: false,
    createdAt: at,
    ...overrides,
  };
}

function renderSection(
  comments: CommentView[],
  {
    readOnly = false,
    createAction = noop,
    deleteAction = noop,
  }: {
    readOnly?: boolean;
    createAction?: CommentFormProps["createAction"];
    deleteAction?: CommentListProps["deleteAction"];
  } = {},
) {
  return render(
    <CommentsSection
      comments={comments}
      readOnly={readOnly}
      createAction={createAction}
      deleteAction={deleteAction}
      refreshAction={async () => undefined}
    />,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("comentários do encontro", () => {
  it("mostra primeiro nome, inicial sem foto e o selo de organizador, na ordem recebida", () => {
    renderSection([
      comment({
        id: "a",
        body: "Sala 3",
        author: { firstName: "Caio", image: null },
        isOrganizer: true,
      }),
      comment({ id: "b", body: "Vou" }),
    ]);

    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Caio");
    expect(items[0]).toHaveTextContent("organizador");
    expect(items[0]).toHaveTextContent("C");
    expect(items[1]).toHaveTextContent("Bia");
    expect(items[1]).not.toHaveTextContent("organizador");
    expect(items[1]).toHaveTextContent("05/12/2026 15:10");
  });

  it("mostra URL como texto puro e escapa HTML", () => {
    const { container } = renderSection([
      comment({ body: 'veja https://exemplo.test <a href="x">link</a><script>x</script>' }),
    ]);

    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(screen.getByText(/https:\/\/exemplo\.test <a href="x">link<\/a>/)).toBeInTheDocument();
  });

  it("mostra o comentário apagado sem autor nem texto", () => {
    renderSection([comment({ body: null, author: null })]);

    expect(screen.getByText("Comentário apagado")).toBeInTheDocument();
    expect(screen.queryByText("Bia")).toBeNull();
  });

  it("só mostra Apagar a quem pode, e pede confirmação com verbo literal", async () => {
    const deleteAction = vi.fn<CommentListProps["deleteAction"]>(noop);
    renderSection([comment({ id: "mine", canDelete: true }), comment({ id: "theirs" })], {
      deleteAction,
    });

    const buttons = screen.getAllByRole("button", { name: "Apagar comentário" });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0] as HTMLButtonElement);
    expect(deleteAction).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getAllByRole("button", { name: "Apagar comentário" })[0]!);

    await waitFor(() => expect(deleteAction).toHaveBeenCalledWith({ code: null }, "mine"));
  });

  it("avisa sobre nome, foto e dados de saúde no campo", () => {
    renderSection([]);

    expect(screen.getByLabelText("Escreva um comentário")).toHaveAccessibleDescription(
      /primeiro nome e a sua foto aparecem para quem vê este encontro. Não escreva dados pessoais nem de saúde/,
    );
  });

  it("recusa vazio e mais de 500 caracteres mostrando o motivo, e conta emoji como 1", async () => {
    const createAction = vi.fn<CommentFormProps["createAction"]>(noop);
    renderSection([], { createAction });
    const field = screen.getByLabelText("Escreva um comentário");
    const send = screen.getByRole("button", { name: "Enviar comentário" });

    fireEvent.click(send);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Escreva o comentário antes de enviar.",
    );

    fireEvent.change(field, { target: { value: "a".repeat(501) } });
    fireEvent.click(send);
    expect(
      await screen.findByText("O comentário pode ter no máximo 500 caracteres."),
    ).toBeInTheDocument();
    expect(createAction).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: "😀".repeat(500) } });
    fireEvent.click(send);
    await waitFor(() =>
      expect(createAction).toHaveBeenCalledWith({ code: null }, { body: "😀".repeat(500) }),
    );
  });

  it("mostra a recusa do servidor por limite de envio com o texto literal", async () => {
    renderSection([], { createAction: async () => ({ code: "RATE_LIMITED" }) });

    fireEvent.change(screen.getByLabelText("Escreva um comentário"), { target: { value: "oi" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar comentário" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Você enviou muitos comentários seguidos. Espere um minuto.",
    );
  });

  it("fica só para leitura sem o campo de escrever", () => {
    renderSection([comment({})], { readOnly: true });

    expect(screen.queryByLabelText("Escreva um comentário")).toBeNull();
    expect(screen.getByText(/comentários deste encontro estão fechados/)).toBeInTheDocument();
  });

  it("atualiza só no botão, sem polling", () => {
    const interval = vi.spyOn(globalThis, "setInterval");
    const timeout = vi.spyOn(globalThis, "setTimeout");
    renderSection([comment({})]);

    expect(screen.getByRole("button", { name: "Atualizar comentários" })).toBeInTheDocument();
    expect(interval).not.toHaveBeenCalled();
    expect(timeout).not.toHaveBeenCalled();
  });

  it("não tem violações de acessibilidade", async () => {
    const { container } = renderSection([
      comment({ canDelete: true }),
      comment({ id: "d", body: null, author: null }),
    ]);
    expect(await axe(container)).toHaveNoViolations();
  });
});
