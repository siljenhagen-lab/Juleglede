# 🎄 Juleglede

En liten nettapp for julen, med flere faner. Den første fanen er på plass:

## 🛒 Julehandelen
- Legg til varer med antall og butikk (butikk er valgfritt).
- Varene sorteres i kategoriene: frukt og grønt, pålegg, fisk, kjøtt, melkeprodukter og tørrvarer.
  Kategorien foreslås automatisk ut fra varenavnet, men du kan endre den selv.
- Slå på **«Del på butikk»** for å se listen gruppert per butikk (og kategori inni hver butikk).
- Kryss av det du har handlet, og fjern de avkryssede med ett trykk.
- Trykk på butikk-merket på en vare for å endre butikken.
- Listen lagres i nettleseren (localStorage).

## Kjøre appen
Det trengs ingen bygging: åpne `index.html` i en nettleser, eller publiser repoet med GitHub Pages.

## Legge til nye faner
Legg til en knapp i `<nav class="tabs">` med `data-tab="navn"` og en tilhørende
`<section id="tab-navn" class="tab-panel">` i `index.html`.
