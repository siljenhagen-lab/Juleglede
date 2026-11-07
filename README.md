# 🎄 Juleglede

En liten nettapp for julen, med flere faner.

## 🛒 Julehandelen
- Legg til varer med antall og butikk (butikk er valgfritt).
- Varene sorteres i kategoriene: frukt og grønt, pålegg, fisk, kjøtt, melkeprodukter, tørrvarer og gaver.
  Kategorien foreslås automatisk ut fra varenavnet, men du kan endre den selv.
- Slå på **«Del på butikk»** for å se listen gruppert per butikk (og kategori inni hver butikk).
- Kryss av det du har handlet, og fjern de avkryssede med ett trykk.
- Trykk på butikk-merket på en vare for å endre butikken.
- Listen lagres i nettleseren (localStorage).

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

## Kjøre appen
Det trengs ingen bygging: åpne `index.html` i en nettleser, eller publiser repoet med GitHub Pages.

## Legge til nye faner
Legg til en knapp i `<nav class="tabs">` med `data-tab="navn"` og en tilhørende
`<section id="tab-navn" class="tab-panel">` i `index.html`.
