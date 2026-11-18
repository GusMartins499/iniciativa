CREATE TABLE "communities" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_memberships" (
	"community_slug" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_memberships_community_slug_user_id_pk" PRIMARY KEY("community_slug","user_id")
);
--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_community_slug_communities_slug_fk" FOREIGN KEY ("community_slug") REFERENCES "public"."communities"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- As 9 comunidades fixas, iguais a COMMUNITIES (src/modules/communities/list.ts).
INSERT INTO "communities" ("slug", "name") VALUES
	('ar-livre', 'Ar livre'),
	('academia', 'Academia'),
	('rpg', 'RPG'),
	('card-games', 'Card games'),
	('cinema', 'Cinema'),
	('musica', 'Música'),
	('clube-do-livro', 'Clube do livro'),
	('corrida', 'Corrida'),
	('caminhada', 'Caminhada');
