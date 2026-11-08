# 🎄 Juleglede

En liten nettapp for julen, med flere faner.

## 🛒 Julehandelen
- Legg til varer med antall og butikk (butikk er valgfritt).
- Varene sorteres i kategoriene: frukt og grønt, pålegg, fisk, kjøtt, melkeprodukter, tørrvarer og gaver.
  Kategorien foreslås automatisk ut fra varenavnet, men du kan endre den selv.
- Slå på **«Del på butikk»** for å se listen gruppert per butikk (og kategori inni hver butikk).
- Kryss av det du har handlet, og fjern de avkryssede med ett trykk.
- Trykk på butikk-merket på en vare for å endre butikken.

## 👩‍🍳 Produksjon
- Legg inn det som skal lages, for eksempel pepperkaker, ribbemiddag eller julekort.
- Under hvert produkt legger du inn det som trengs for å lage det (antall og kategori).
- Marker **«+ Handleliste»** på en ting for å legge den på handlelista. Trykk igjen for å ta den av.
  Med **«Legg alt på handlelista»** legger du alt på én gang, og med **«Rett på handlelista»** havner nye ting der med en gang.
- Merket viser **🛒 På lista** eller **✓ Handlet**, avhengig av hva som er krysset av i Julehandelen.
  På handlelista står det hva varen skal brukes til (f.eks. «til Pepperkaker»).
- Kryss av produktet når det er ferdig laget. Trykk på navnet for å slå sammen eller åpne det.

## 🎁 Gaver
- Legg inn personene du skal handle til, og gaveideer under hver person.
- Hver gave kan ha en **lenke** til produktet (f.eks. `elkjop.no/...`, https:// legges på automatisk) og en butikk.
- **«+ Handleliste»** legger gaven i kategorien 🎁 Gaver i Julehandelen, med butikk, lenke og hvem den er til.
- Kryss av **Kjøpt** og **Pakket**. «Kjøpt» følger handlelista: krysser du av gaven der, blir den kjøpt her også,
  og den forblir kjøpt selv om du fjerner avkryssede varer fra handlelista.
- Øverst ser du hvor mange gaver som er kjøpt og pakket totalt.

## 💌 Takkeliste
- Noter hvem du fikk hva fra på julaften: **Fra hvem**, **Hva** og eventuelt **Til hvem** (fint med flere i familien).
- «Fra» og «Til» huskes etter at du har lagt til en gave, så det går raskt å registrere flere fra samme person.
- Gavene grupperes per giver. Kryss av hver gave når du har takket, eller bruk avkrysningen ved giveren for å takke for alt.
- Givere du ikke er ferdig med, vises øverst. «Skjul ferdig takket» skjuler dem du har takket.

## ⭐ Ønsker (delt via Supabase)
- Den eneste fanen som synkroniseres mellom enheter. Se [`supabase/README.md`](supabase/README.md) for oppsett.
- Første gang velger du **hvem du er**. Da får du din egen ønskeliste, der du legger inn ønsker med lenke og kommentar.
- Under **Andres ønskelister** ser du alle andre sine lister. Med **«🎁 Legg til i Gaver»** havner ønsket under
  riktig person i Gaver-fanen, med lenken.
- Ønsket blir liggende på ønskelista. At det er lagt i Gaver eller kjøpt, lagres bare på din enhet,
  så den som ønsker seg noe, ser aldri om det er kjøpt.
- Lista oppdateres når du åpner fanen, hvert 30. sekund mens den er åpen, og med «↻ Oppdater».

## Lagring
Julehandelen, Produksjon, Gaver og Takkeliste lagres **bare på enheten** (localStorage). Bare Ønsker deles via Supabase.

## Kjøre appen
Det trengs ingen bygging: åpne `index.html` i en nettleser, eller publiser repoet med GitHub Pages.

## Legge til nye faner
Legg til en knapp i `<nav class="tabs">` med `data-tab="navn"` og en tilhørende
`<section id="tab-navn" class="tab-panel">` i `index.html`.
