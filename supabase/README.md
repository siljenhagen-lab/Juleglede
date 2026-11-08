# Supabase for fanen Ønsker

Bare fanen **Ønsker** bruker Supabase. Alt annet (handleliste, produksjon, gaver og takkeliste)
lagres kun på enheten.

## Oppsett
1. Lag et prosjekt på [supabase.com](https://supabase.com).
2. Åpne **SQL Editor**, lim inn innholdet i [`schema.sql`](schema.sql) og trykk **Run**.
3. Gå til **Project Settings → API** (eller **API Keys**) og hent:
   - **Project URL**, f.eks. `https://abcd1234.supabase.co`
   - den **offentlige** nøkkelen: `anon` (starter med `eyJ…`) eller `publishable` (starter med `sb_publishable_…`).
     Bruk aldri `service_role`/`secret`-nøkkelen i appen.
4. Velg én av disse:
   - **Felles for alle (anbefalt):** Fyll inn `url` og `key` i [`../js/config.js`](../js/config.js) og publiser appen.
     Da er alle som åpner appen, koblet til automatisk.
   - **Per enhet:** La `config.js` stå tom. Første gang man åpner Ønsker, blir man bedt om URL og nøkkel.

## Personvern og sikkerhet
- Ønskelistene (hvem som ønsker seg hva, lenke og kommentar) er synlige for alle som har URL og nøkkel.
- Om et ønske er lagt i **Gaver** eller kjøpt, lagres **ikke** i Supabase. Det ligger bare på enheten til den som kjøper.
  Derfor blir ønsket stående på lista, og den som ønsker seg noe, kan ikke se om det er kjøpt.
- Det finnes ingen innlogging. Appen viser bare slett-knappen på din egen liste, men teknisk kan alle med nøkkelen slette
  ønsker. Det holder for en familie, men ikke del nøkkelen offentlig.
