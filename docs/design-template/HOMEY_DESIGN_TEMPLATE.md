# Designmal for Homey-innstillinger

Denne malen samler uttrykket fra Power Guard per 8. oktober 2026. Den er laget for å kopieres til en annen Homey-app. [CSS-filen](homey-settings-design-template.css) er selvstendig og lastes **ikke** av Power Guard. Den endrer dermed ingen av skjermene eller styringen i denne appen.

## Felles vedlikehold

Dette er NorthGuard Labs sin felles mal for Homey-innstillinger. Når utseendet i Power Guard endres, oppdater denne veiledningen som del av samme arbeid. Oppdater også CSS-filen når endringen gjelder en stil eller komponent som andre apper kan bruke. Apper som allerede har kopiert CSS-filen, må ta inn den nye versjonen selv.
## Ta den i bruk i en annen app

1. Kopier `homey-settings-design-template.css` til den andre appens `settings/`-mappe, for eksempel som `settings/design.css`.
2. Legg `pg-design` på rot-elementet og last CSS-filen i innstillingssiden. Legg inn kontekstskriptet **før** CSS, så riktig tema brukes ved første visning:

   ```html
   <html class="pg-design">
   <head>
     <script>
       if (window.self === window.top) {
         document.documentElement.classList.add('pg-standalone');
       }
     </script>
     <link rel="stylesheet" href="design.css">
   </head>
   ```

3. Bruk `pgd-*`-klassene på komponentene som skal følge malen. Prefikset gjør at andre appers eksisterende `.card`, `.row` og knapper ikke endres ved et uhell. Gi nye elementer innhold på både norsk og engelsk i den andre appens oversettelser.
4. Bytt bare `--pgd-brand` hvis den andre appen skal ha en annen identitetsfarge. Hold kontrast, kanttykkelse, avrunding og typografi felles. Kopier ikke Power Guards app-ID, tekster eller funksjonslogikk.

## Slik fungerer mørkt tema i Homey

Malen har lys palett som utgangspunkt. I Homeys **nettapp** er innstillingene en iframe som Homey selv inverterer i mørk modus. Derfor skal denne iframe-en beholde lys CSS også når nettleseren melder mørkt tema. I Homeys **iPhone-visning** er innstillingene en toppnivå-webview uten denne inverteringen; her aktiverer `pg-standalone` den mørke paletten via `prefers-color-scheme: dark`. Dette er målt for Power Guard, og bør kontrolleres på den andre appens faktiske web- og mobilvisning. Ikke tving mørkt tema med JavaScript eller legg en generell mørk mediaregel på iframe-en.

Homeys stilark kan lastes etter appens eget. Den kopierbare CSS-en beskytter etiketter med en avgrenset `!important`-regel og gir de blå hjelpenedtrekkene avgrensede `!important`-regler. Ikke overstyr alle knapper globalt.

| Token i malen | Lys kildepalett | Toppnivå mørk | Bruk |
| --- | --- | --- | --- |
| `--pgd-text` | `#000000` | `#ffffff` | Vanlig tekst og etiketter |
| `--pgd-body` | `#f2f2f7` | `#101014` | Sidebakgrunn |
| `--pgd-card` | `#ffffff` | `#1c1c22` | Hovedkort, dialoger og felt |
| `--pgd-surface` | `#f5f5f7` | `#25252d` | Innfelte bokser og rader |
| `--pgd-border` | `#e0e0e5` | `#3b3b44` | Vanlige kanter |
| `--pgd-brand` | `#e8622a` | Uendret | Valgt fane, seksjonsmarkør og vedvarende aktiv tilstand |
| `--pgd-green` | `#22c55e` | Uendret | Forklarende grønn boks |
| `--pgd-blue` | `#007aff` | Uendret | Klikkbar lenke, knapp eller nedtrekk |

## Bokser og komponenter

Disse målene er hentet fra Power Guards `settings/index.html`. Klassenavnene i CSS-malen har `pgd-`-prefiks for trygg kopiering. «Samme stil» betyr samme mål for **samme komponenttype** på tvers av skjermene; hovedkort, statusboks og dialog har ulike oppgaver og trenger ikke samme størrelse.

| Komponent | Klasse i malen | Kant, hjørne og innvendig luft | Bruk |
| --- | --- | --- | --- |
| Toppfelt | `.pgd-hero` | Toppnivå: 16 px hjørne, 18 × 20 px luft. Innebygd Homey-vindu: 10 px hjørne, 10 × 14 px luft | Vis appnavn bare når Homey ikke allerede viser det i vindustittelen; behold beskrivelse og versjon |
| Hovedfaner | `.pgd-nav`, `.pgd-tab` | Felles avrundet ramme med 4 px luft; hver fane minst 58 px høy (52 px på mobil). Valgt fane har myk oransje bakgrunn og 2 px bunnlinje | Fem kompakte faner med ett 20 px streksymbol (18 px på mobil) over etiketten |
| Hovedkort | `.pgd-card` | 1 px lys kant, 16 px hjørne, 16 × 14 px luft; mobil 8 px hjørne og 10 × 6 px luft | En hovedseksjon med overskrift |
| Forklarende boks | `.pgd-guidance` | 1 px grønn kant, 4 px venstre kant, 10 px hjørne, 12 × 14 px luft | Aktiv modus, Varmeplan, Enhetsinnstillinger og ladestatus |
| Åpne/lukke-hjelp | `.pgd-disclosure` | 2 px blå kant, 10 px hjørne, 11 × 12 px klikkflate i overskriften | Klikkbar hjelpetekst eller navigasjon |
| Handlingsknapp | `.pgd-action` | 1 px nøytral kant, rolig overflate, 10 px hjørne, 8 × 12 px luft | Vanlige handlinger. Bare vedvarende aktive valg markeres oransje |
| Effekt-/tallboks | `.pgd-stat` | 3 px oransje venstre kant, 10 px hjørne, 12 × 14 px luft; mobil 8 px luft | Store tall med etikett og undertekst |
| Kompakt oversikt | `.pgd-overview` | 1 px nøytral kant, 9 px hjørne og luft | Flere små nøkkeltall på samme side |
| Innfelt seksjon | `.pgd-section` | 1 px nøytral kant, 10 px hjørne, 9 × 10 px luft i overskriften | Avanserte innstillinger |
| Enhets-/laderkort | `.pgd-device` | 1,5 px nøytral kant, 3 px gul/oransje venstre kant, 8 px hjørne og luft; `is-warning` / `is-error` gir tydelig statuskant | Styrt enhet eller lader |
| Snarvei | `.pgd-shortcut` | 2 px blå kant, 10 px hjørne, 11 × 12 px luft; kompakt rad uten fast minstehøyde | Hele raden åpner en underside, med 22 px streksymbol, tittel, 12 px beskrivelse og blå pil |
| Statusmerke | `.pgd-badge` | 1 px statuskant, pill-form, 3 × 7 px luft | På, av, feil; bruk tekst i tillegg til farge |
| Varsel | `.pgd-alert` | 10 px hjørne, 10 × 14 px luft, 4 px statuskant til venstre; oransje/rødt etter alvor | Feil eller tydelig advarsel |
| Dialog | `.pgd-dialog` | 16 px hjørne, 20 px luft, maks 420 px bredde | Bekreftelse eller valg |
| Innstillingsrad | `.pgd-row` | 10 px vertikal luft, tynn skillelinje; mobil 7 px | Etikett og kontroll |
| Felt | `.pgd-field` | 1 px feltkant, 8 px hjørne, 6 × 8 px luft | Tall, tekst og valg |

Grønne bokser er en **visuell type for forklaring eller status**, ikke en garanti for at funksjonen er på. Skriv for eksempel «Tilstedeværelsesstyring er av» når den er av. Vanlige knapper og inaktive faner bruker nøytrale farger for et rolig uttrykk. Blått reserveres for klikkbare hjelpenedtrekk med pil og tydelige lenker. Oransje markerer valgt fane og en vedvarende, aktiv tilstand, for eksempel hvilken låsehandling som svarer til låsens faktiske status. Engangshandlinger som «Start bortemodus» ser ikke valgte ut. Bare aktivt valg i en gruppe er oransje. Advarsel og feil bruker egne statusfarger. Ikke bruk bare farge som statusmelding.

## Informasjonsknapp ved en overskrift

Ved «Aktiv modus» brukes en liten blå firkant med et informasjonssymbol (ⓘ)
rett etter overskriften. Selve firkanten er 28 × 28 px med 2 px blå kant,
10 px avrunding og blåtonet bakgrunn. Trykkflaten er 44 × 44 px, og et
16 px SVG-symbol arver tekstfargen. Gi knappen en oversatt tilgjengelig etikett,
for eksempel «Om aktiv modus», og aria-haspopup="dialog" / aria-controls.

Forklaringen flyttes fra hovedsiden til en ren informasjonspopup. Den viser
samme aktuelle informasjon, på norsk og engelsk, uten valg eller innstillinger.
Statusen ved overskriften blir stående synlig. Eksisterende betjeningsknapper
på hovedsiden beholdes; de flyttes ikke inn i informasjonspopupen.

Bruk en native dialog med showModal(), navngitt overskrift og beskrivelse,
maks 420 px bredde og 85 vh høyde. Behold den grønne forklaringsboksen inne i
dialogen. Lukk med «Lukk», Escape eller trykk på bakgrunnen. Nettleseren
holder fokus i dialogen og gir det tilbake ved lukking. Start fokus på
overskriften med tabindex="-1" og autofocus, og sett scrollTop til 0 ved
åpning. Da vises starten av lange forklaringer også på smal skjerm.
Bruk fargetokens for
både innebygd Homey-visning og selvstendig mobilvisning. De gjenbrukbare
klassene er pgd-info-button, pgd-info-symbol, pgd-info-dialog,
pgd-info-dialog-body og pgd-info-close. Kontroller ekte mobilvisning separat.

På Varme → Settpunkt vises «Tilstedeværelse er valgt» og ⓘ på venstre side,
med «Aktiv» til høyre. Vis raden bare når tilstedeværelse faktisk eier
modusvalget. Bruk en nøytral, kompakt rad uten grønn ramme; forklaring og
veien til av/på-bryteren vises i informasjonspopupen. I Power Guard er dette
Mer → Tilstedeværelse → «Bruk valgte Homey-brukere». Popupen har ingen
innstillinger. I malen brukes pgd-info-row, pgd-info-row-label og
pgd-info-row-state sammen med informasjonsknappen.

Varme → Plan bruker samme rad. Ved aktiv tilstedeværelse vises
«Tilstedeværelse er valgt» og «Aktiv». Når den er av, vises
«Tilstedeværelse» og «Inaktiv»; dette sier ikke at selve varmeplanen er av.
Popupen beholder hele planforklaringen som passer til gjeldende oppsett.

Varme → VVB beholder overskriften «Prisstyrt varmtvann», en blå ⓘ-knapp rett etter overskriften og det dynamiske antallet aktive enheter til høyre, for eksempel «1 av 1 aktive». Bryteren «Prisstyring av varmtvann» står synlig på neste rad. Forklaringer om pris, sikkerhetsoppvarming, gjenoppvarming og enhetsvalg flyttes til en informasjonspopup med snarvei til Enheter. Popupen skal kunne åpnes også når prisstyring er av, og må ikke endre innstillinger. Behold plass til statusmerket på smale skjermer; la overskriften bryte ved behov. Bruk samme infoknapp, popup, farger og avrunding som de andre visningene.

På VVB-siden vises enhetsvelgeren og «Legg til som VVB» bare når ingen bereder er konfigurert. Skjul hele legge-til-raden etter valg, og vis den igjen når siste bereder fjernes. En avslått prisbryter eller en midlertidig utilgjengelig bereder skal ikke vise legge-til-feltet på nytt. Eksisterende berederkort beholdes.

Informasjonspopuper kan ha blå snarveier til stedene teksten nevner.
I Power Guard: Aktiv modus → Tilstedeværelse og Varmeplan (ved automatisk
modusforklaring), Settpunkt → Tilstedeværelse, Plan → Tilstedeværelse og
Settpunkt. Ikke lenk tilbake til siden brukeren allerede står på. Bruk
pgd-info-shortcuts for en rad med fleksible knapper, minst 44 px høye.
Snarveien lukker dialogen før den åpner riktig intern side, uten å endre
innstillinger. Popupen beholder også en egen Lukk-knapp.

## Felles bredde på bokser og felt

Bokser og klikkbare felt som fyller hele raden i samme seksjon, skal ha identisk ytre bredde og flukte på både venstre og høyre side. Plasser dem på samme nivå i layouten; ikke la innvendig marg i én statusboks gjøre bare det ene feltet smalere. Bruk samme kantbredde, avrunding, innvendige marger og høyde i lukket tilstand for sammenlignbare blå nedtrekk. Tillat høyden å følge innholdet når de åpnes. Bokser ved siden av hverandre med samme rolle bruker like brede kolonner og felles avstand.

I VVB-kortet står «Beslutning og måledetaljer» og «Tekniske innstillinger og tilbakestilling» rett under statusboksen, i full kortbredde. Begge har 2 px blå kant, 10 px avrunding og minst 56 px lukket høyde, med plass til to tekstlinjer på smale skjermer. Bruk `pgd-full-row-stack`, `pgd-full-row-panel` og `pgd-full-row-control` fra CSS-malen.

VVB beholder alle felt og måleverdier: driftstider står i tre kolonner, ukedag/fra/til står på én rad, forklaringer åpnes med ⓘ, og full beslutning vises i detaljfeltet. Vis ukjent oppvarmingseffekt, for lave manuelle verdier, sikkerhetsstopp og målevarsler også når detaljer er lukket. Behold åpne detaljer ved statusoppdatering. Tilbakestilling ligger i tekniske innstillinger og beholder sitt eksisterende virkeområde.

## Tekststørrelser

| Tekst | Størrelse og vekt | Typisk plassering |
| --- | --- | --- |
| Sidetittel | 22 px, 700 | App-/sideoverskrift |
| Kortoverskrift | 15 px, 600 | Overskrift med 3 px oransje markør |
| Klikkbar hjelpetittel | 14 px, 700 | Blått nedtrekk |
| Grunntekst | 14 px | Vanlig sidetekst |
| Forklaringsboks og feltnavn | 13 px; bokstittel 700, felt 500 | Grønn boks og innstillinger |
| Felt og handlingsknapper | 13 px | Input, select, nøytral knapp |
| Hjelpetekst | 12 px, linjehøyde 1,4 | Kort under et felt |
| Undertekst/status | 11 px | Måleundertekst og metadata |
| Statusmerke | 10 px, 700 | På/av/feil i liten plass |
| Faneetikett | 11 px; mobil 10 px | Kort navigasjonstekst |
| Kompakt oversikt | 10 px etikett, 13 px verdi, 11 px undertekst | Små nøkkeltall |
| Stort måltall | 22 px, 800 | Watt og andre hovedverdier |

Power Guard har noen tette visninger med 9–10 px ren metadata og enkelte mobilunntak. De er ikke normen for nye forklaringer. Bruk 12–14 px når brukeren skal lese mer enn en kort etikett. Bruk `line-height: 1.55` i grønne bokser og `1.6` i blå hjelpetekster. Appens felles størrelsestokens heter `--type-body`, `--type-section`, `--type-text`, `--type-help`, `--type-meta`, `--type-compact` og `--type-value`.

I Power Guards toppmeny brukes fem like brede faner: Hjem, Enheter, Varme, Lader og Mer. Bruk enkle SVG-strekikoner med `currentColor` og `aria-hidden="true"`; selve knappen skal fortsatt ha synlig tekst. En valgt fane bruker oransje, mens handlingsrader under Mer følger den felles blå klikkstilen. Mer-radene skal være korte nok til å kunne skannes uten store tomme flater. Behold navn, beskrivelse og pil på hver rad. Legg ikke inn en ekstra appoverskrift i en innebygd Homey-dialog; appen kan vise den når siden åpnes som selvstendig mobilvisning.

## Forbruksoversikt

Fanen heter «Forbruk akkurat nå»; ikke gjenta overskriften inne på siden.
Start direkte med husmåleren og summen av rapporterte enhetsverdier i to kompakte tallbokser.
Ikke vis en egen grønn informasjonsrute over tallboksene.
Bruk kort undertekst: «Siste rapporterte verdier», og 8 px vertikal padding.
Merk forskjellen som en differanse, ikke som sikkert ukjent forbruk: målingene
kan ha ulike tidspunkt. Totalene skal ikke endres når brukeren filtrerer eller
skjuler rader. Visningsvalg skal bare lagre filtre og skjuling.

Bruk en sammenhengende liste med hele enhetsnavnet til venstre og watt til høyre.
Hver rad har 3 px oransje venstrekant, 10 px hjørner og 10 px innvendig sideavstand.
Bruk 7 px vertikal padding, 4 px mellom radene og 4 px over/under stolpen.
Behold tekststørrelser og minst 44 px trykkflate på berøringsskjermer.
En tynn blå stolpe viser andelen av rapportert enhetsforbruk. Snitt, topp og
målealder står som 12 px undertekst. Bruk «Sist rapportert», og marker gamle
eller ukjente tidspunkt tydelig uten å påstå at enheten er defekt. Manglende
effekt vises som «Ukjent», mens en faktisk nullmåling vises som 0 W.

Typefiltre har norske/engelske navn, 2 px blå kant og 10 px hjørner. Grupper
varmeovner og termostater under Varme, men bevar tidligere lagrede klassevalg.
Øyeikonet skjuler bare raden; gi det en tilgjengelig tekst og vis en knapp for
å hente skjulte enheter tilbake. Ikke bruk flere åpne/lukke-paneler i listen.

## Eksempel

«Bil og laderoppsett» er en fast, åpen seksjon med nøytral kant og overskrift.
Rammen rundt hver lader er også nøytral; bare de seks infoboksene har oransje kant.
Bare «Laderoppsett» under hver lader kan åpnes og lukkes, med blå kant.
Snarveier fra Enheter åpner oppsettet til den valgte laderen.
Hver lader har seks faste infobokser: Lading, Batteri, Ladetider,
Prisstyring, Automatikk og Ladertype. De viser
alltid informasjonen for akkurat denne laderen, uten egne nedtrekk.
Bruk tre kolonner på vanlig bredde og to på skjermer opptil 420 px.
Boksene har 7 × 8 px luft, 6 px mellomrom og oransje venstrekant.
Vis korte på/av-verdier; skill valgte, ubrukte og ufullstendige innstillinger.
Tekniske målinger og batteritidspunkter samles per lader under
Mer → Diagnostikk. Informasjonen bevares og oppdateres også når Diagnostikk
åpnes direkte. Ikke fyll de kompakte boksene med feilsøkingsdata;
batteriets ferskhetsstatus beholdes, og lengre varsler vises rett under boksene.
Blått brukes til oppsettet som kan endres.
Under boksene samles bil, lademål og tillatte tider i ett blått nedtrekk. Flow, RFID,
startstrøm og spesielle integrasjonsvalg samles under Avansert oppsett.
Felles prisstyring og ladefrist ligger under Mer → Prisstyring.
Prisstyringsstatus vises per lader, uten en dobbel statusrad øverst.
Generelle forklaringer ligger under Hjelp.
Behold advarsler synlige og husk åpne paneler ved statusoppdatering.
Klokkeslett skal vises som `23:30`, ikke AM/PM. Bruk validerte tekstfelt
med `TT:MM` der nettleserens native tidsvelger ikke sikrer 24-timersvisning.
Flytting av kontroller skal beholde enhetskobling, lagringsfunksjoner og
lagrede verdier; visuell opprydding skal ikke endre styringsregler.

Temperaturkort skal samle − / temperatur / + og en kompakt prisbryter på
samme kontrollrad. Prisboksen tilpasses etikett og bryter, med 12 px etikett
og 4–5 px vertikal luft; bryteren skal ikke krympes. Enhetsnavn og måledata
står over kontrollene i smale paneler. Først ved svært smal visning (370 px
eller mindre i Power Guard) flyttes prisboksen til egen rad. Behold synlige
varsler og lesbar tekst når boksen trenger mer høyde.

```html
<main class="pgd-container">
  <header class="pgd-hero">
    <h1 class="pgd-page-title">Appnavn</h1>
    <p>Kort beskrivelse av appen.</p>
  </header>
  <nav class="pgd-nav" aria-label="Hovedmeny">
    <button type="button" class="pgd-tab is-active"><svg class="pgd-tab-icon" viewBox="0 0 24 24" aria-hidden="true"><!-- streksymbol --></svg><span class="pgd-tab-label">Hjem</span></button>
    <!-- Legg til de andre fanene med samme struktur. -->
  </nav>
  <section class="pgd-card">
    <h2 class="pgd-card-title">Varmeplan</h2>
    <div class="pgd-guidance">
      <strong class="pgd-guidance-title">Tilstedeværelsesstyring er valgt</strong>
      <p>Hjemme- og bortestatus velger riktig profil.</p>
      <p class="pgd-guidance-hint">Temperaturen settes under Settpunkt.</p>
    </div>
    <details class="pgd-disclosure">
      <summary>Hvordan fungerer planen?</summary>
      <div class="pgd-disclosure-body">Forklar tidsbytter her.</div>
    </details>
    <button type="button" class="pgd-action">Åpne avansert oppsett</button>
  </section>
  <button type="button" class="pgd-shortcut">
    <svg class="pgd-shortcut-icon" viewBox="0 0 24 24" aria-hidden="true"><!-- streksymbol --></svg>
    <span class="pgd-shortcut-copy"><span class="pgd-shortcut-title">Diagnostikk</span><span class="pgd-shortcut-desc">Logg og feilsøking.</span></span>
    <span class="pgd-shortcut-arrow" aria-hidden="true">›</span>
  </button>
</main>
```

Eksemplet viser bare utseendet; koble handlinger og oversettelser til den andre appens egen kode. Test nettappen i lys og mørk visning og en faktisk mobilvisning. En desktop-forhåndsvisning alene bekrefter ikke hvordan iPhone-webviewen vises.

Utgangspunktet er Power Guards `../../PG pluss/settings/index.html` for farger og komponenter, og `../../PG pluss/CLAUDE.md` for observerte Homey-regler. Oppdater denne felles malen når Power Guards design endres.

## Utviklingsoversikt for ventende enheter

Vises bare på Homey-ID-er godkjent på serversiden. Bruk en kompakt, fast boks
i egen fane Enheter → Utvikling, med oransje venstrekant
på radene. Vis navn, type venting, årsak og kjente effektverdier. Skill mellom
ventende oppstart/ønsket tilstand og aktiv effektbegrensning. Ikke presenter listen
som en garantert startrekkefølge eller som enhetens eget bekreftede varmebehov.
Vis beslutningstidspunkt, merk gamle data, og fjern gamle rader ved lesefeil.

Utviklingsfanen har blå knapper for «Nå» og «Historikk». Historikk viser
periodevalg 6, 12 og 24 timer, nyeste hendelse øverst, tidspunkt, navn og årsak.
Vis når registreringen begynte og sist observerte status. En forsvunnet rad
merkes «Ikke lenger registrert på listen», aldri som bekreftet oppstart.
Fane og historikk er skjult på Homey-ID-er som ikke er godkjent.

Utviklingshistorikk åpnes med 6 timer som standard. Valgt periode og valgt
«Nå»/«Historikk» har 2 px oransje kant og oransje myk bakgrunn; øvrige valg
beholder blå kant. Hjørner er fortsatt 10 px.

Samle historikk i én boks per enhets-ID, med navn én gang og en kompakt
tidslinje under. Vis nyeste hendelse øverst og tidspunkt med dato ved hver rad.
«Sist registrert» beskriver siste hendelse, ikke en garantert nåtilstand.
Bekreftet frigivelse/kapasitetsgodkjenning kan markeres grønt. En vanlig
forsvunnet rad forblir nøytral. Registreringsstart og opphold vises som
kompakt tekst over enhetsboksene. Ikke gjenta gammel venteårsak under en
bekreftet frigivelse.

## Synlig lagring og trygge statusoppdateringer

Vis en kort status ved automatisk lagring: «Lagrer», «Lagret» eller «Kunne ikke lagre». Bruk `role="status"` og `aria-live="polite"` slik at statusen kan leses opp uten å flytte fokus. Ved feil skal visningen gå tilbake til sist bekreftede verdi; en uspart verdi må ikke se lagret ut. Plasser statusen ved listen som lagres, og vis den også i et eget oppsettspanel som lagrer samme data. La den følge med når en lang liste rulles. Bruk `.pgd-save-status` som felles stil og marker `data-state="saved"` eller `data-state="error"`.

En automatisk statuspoll kan oppdatere målinger, men må ikke erstatte et tekstfelt, klokkeslettfelt, valgliste eller annet aktivt redigeringsfelt. Utsett oppbygging av skjemaet til redigeringen er ferdig, og kontroller også asynkrone svar som kommer mens feltet er i fokus.



## Usikre liveverdier

En laderboks eller widget skal ikke vise sist kjente watt eller «lader nå» som en fersk måling når statusoppslaget feiler. Skill mellom intern sist kjent verdi og visning: erstatt usikker effekt med «— W», vis en nøytral status om at laderstatus ikke er oppdatert, og oppgi hvor lenge siden status sist ble observert når tidspunktet er kjent. Bruk den eksisterende kompakte statuslinjen i kortet; ikke legg til et stort advarselsfelt. Hvis selve widget-API-et feiler, vis «Ingen data» i stedet for å beholde gamle tall. Tekstene skal finnes på både norsk og engelsk.

Tallfelt som viser en sikkerhetsgrense, bør bruke samme dynamiske maksimum som serverens validering. Vis maksimum i feltets hjelpetekst eller tittel når det avhenger av bekreftet nettsystem og hovedsikring; nettleserens `max` alene er ikke tilstrekkelig validering.

## Knapper nederst i laderkort

Når laderkort står ved siden av hverandre, skal kriseknappene ligge nederst på samme linje selv om bare én bil lader eller statuslinjene er ulike. Bruk like høye kort i hver rutenettrad, flex-kolonne på `pgd-charger-card` og en `pgd-charger-content`-del med `flex:1` over knapperaden. Behold luft og skillelinje over knappene. Reserver samme kantbredde øverst og nederst for vanlig og aktiv overstyring, så knapperaden ikke flytter seg når en ramme vises. Unngå fast korthøyde; ett kort eller en ny rad skal tilpasse seg innholdet.

## Animasjon på aktive laderkort

På Hjem-siden pulserer bare den oransje venstrekanten på kortet til bilen som faktisk lader. Flere aktive ladere kan pulsere samtidig. Krev kjent ladestatus (lading eller dynamisk lading), ingen eksplisitt «lader ikke»-status, sikre effektdata og målt effekt over 100 W. Pause, venting, frakoblet bil, 0 W, usikre data eller feilet statusoppdatering stopper pulsen. Overskrifter og øvrige oransje markører står stille. Bruk 2,4 sekunders rolig puls i kantfargen; flytt ikke tekst eller kort. Malen bruker `pgd-charger-card is-charging` på et kort med eksisterende oransje venstrekant. Oppdater klassen ved hver statusoppdatering, og fjern den ved lesefeil. Sett `pgd-motion-paused` på html når dokumentet er skjult; `prefers-reduced-motion` slår animasjonen av.

## Oversikt-widget

Oversikt-widgeten bruker en kompakt hovedflate med nøytral kant og 16 px hjørner. Vis husforbruk og grense først, deretter aktiv profil og antall reduserte enheter i én delt rad. Elbilladere vises i to kolonner når bredden tillater det. Vis de tre største målte forbrukerne med tynne blå andelsstolper og watt til høyre. En oransje seksjonsmarkør og effektstolpe gir Power Guard-identitet uten oransje ramme rundt hver rad. Grønn, oransje og rød status må alltid ha tekst i tillegg til farge.

La widgethøyden følge faktisk innhold, inkludert periodegraf, laderstatus og antall ladere. Vis «— W» ved usikker laderkraft og nøytral status ved foreldet måling. Tallet for effekttariff er snittet av månedens tre høyeste timer; kall det «Snitt av topp 3», ikke «Månedsmaks». Bruk Homeys temavariabler for bakgrunn og tekst, samt de felles fargene oransje `#e8622a`, blå `#007aff` og grønn `#22c55e`.

Animasjon i Oversikt skal være rolig og knyttet til reelle data: effektstolpen glir fra forrige synlige nivå til ny måling over 550 ms, mens tall og status oppdateres straks. Laderens lille statuspunkt kan pulsere med 2,4 sekunders periode bare ved kjent aktiv lading og målt effekt over 100 W. Ingen puls ved pause, venting eller usikre målinger. Respekter «redusert bevegelse», stans bevegelse når visningen er skjult, og unngå ekstra API-kall for animasjon. Første innlasting viser riktig nivå direkte. Statiske forhåndsvisningsbilder trenger ingen endring ved bare animasjon.

## Widgetforhåndsvisninger

Når en widget bygges om, oppdater både `preview-dark.png` og `preview-light.png` i widgetmappen. Bildene brukes i Homeys widgetvelger og på appens App Store-side. De er egne statiske ressurser og oppdateres ikke automatisk når `public/index.html` endres. Hold dem på 1024 × 1024 px med transparent bakgrunn. Bruk få, enkle former uten tekst, i tråd med widgetens faktiske informasjonsrekkefølge. Den mørke og den lyse varianten skal vise samme oppsett. Kontroller dem side om side med de forrige bildene før publisering.

For Oversikt er valgt forhåndsvisning en mer ikonisk variant: én tydelig effektmodul med oransje energisymbol og linjemåler, to enkle bilkort med nøytral/grønn status og blå stolper for de største forbrukerne. Hold symbolene lesbare i liten størrelse; bruk myk dybde og få merkefarger uten lesbare tall eller ord. Den lyse og mørke versjonen beholder samme komposisjon.


## Kompakt utviklingsvisning med registrerte data

Bruk ett kompakt kort per enhet, med bare én oransje venstrekant. Vis aktuell tilstand og de viktigste avleste verdiene først. En blå Detaljer-utvidelse viser beslutningstid, tidspunkt for avlesning, tidspunkt for verdioppdatering og tekniske fakta. Behold åpne detaljer ved automatisk oppdatering. Skill uttrykkelig mellom forespurt handling, akseptert kommando, tilbakemelding fra enheten og rapportert forbruk; ukjente eller gamle verdier må ikke se ferske ut. Grupper historikk per enhets-ID, med periodene 6, 12 og 24 timer og 6 timer som standard. Merk omstart og gjenfunnet tilstand uten å fremstille dette som en ny styringshandling. Denne komponenten er kun for diagnostikk og skal ikke endre styringen.


### Periodevalg og bredde i Oversikt-widgeten

Bruk Dag / Uke / Måned som tre like brede knapper i en egen kompakt forbruksdel. Valgt periode får 2 px oransje kant og svak oransje bakgrunn. Graf og kWh gjelder perioden, mens husforbruk, lading og enhetsforbruk er tydelig merket som sanntid. Dag viser dagens lokale timer, uke mandag–søndag og måned inneværende kalendermåned. Dagens pågående time telles én gang. Manglende historikk vises som ukjent, ikke null; fremtidige perioder tones ned. Husk valgt periode separat per widgetinstans når nettleserlagring er tilgjengelig.

Bruk Homeys `homey-widget-full` for rammen, ingen ekstra utvendig widgetmarg og 10 px indre polstring. Unngå både Homeys standardpolstring og en ny utvendig marg rundt samme innhold. Laderkort kan dele rad fra omtrent 307 px widgetbredde; smalere rammer bruker én kolonne. Mål høyden fra den faktiske innholdsrammen og oppdater ved breddeendring. Homey bestemmer den ytre dashboardbredden. Test 280–768 px, norsk/engelsk og lys/mørk visning; bekreft også på fysisk telefon.


### Bilinformasjon og laderstatus

Hold bilens rapport og laderens styringskilde adskilt. Kompakte laderkort viser Tilkoblet, Frakoblet eller Ukjent. Legg kilde, siste Homey-verdioppdatering og avlesningstid i eksisterende diagnostikk, slik at kortene ikke blir høyere. Bilrapporten merkes «kun informasjon». En gammel eller motstridende verdi vises som ukjent nå, med sist rapporterte tilstand separat. Et nytt API-oppslag må ikke fremstå som en ny måling. Biltilkobling gir ingen start/stopp-kommando eller effektreservasjon; batteriprosent kan være grunnlag for ladeberegning. Bruk eksisterende kort og tekstfarger, og kontroller norsk/engelsk, lys/mørk og smale mobilbredder.

### Hendelser som forklarer ladebeslutninger

I utviklingshistorikken kan oppsettsendringer, ladersignaler og batterirapporter vises som egne hendelser under samme enhet. Vis relevante før-/etterverdier og bruk kommandoreferanse for å koble forespørsel, aksept og tilbakemelding. Skill mellom tidspunkt for batteriverdien og siste avlesning. Bruk «sist rapportert», ikke en ny påstand om at bilen er fulladet. Råverdier og full beslutningskontekst ligger i eksisterende Detaljer. Nærhet i tid mellom oppsettsendring og kommando er ikke alene bekreftet årsak. Bruk eksisterende tekststiler; slike loggtillegg skal ikke endre hovedstatus eller styring.
### Effektmål og én felles prisbryter

Under Mer → Appinnstillinger vises effektmål som 80 %, 90 % eller 100 % av innstilt grense. Et lagret eldre valg på 95 % eller 105 % vises bare mens det er valgt og skal ikke omskrives ved åpning av siden. Forklar at marginer, timebudsjett og sikringsgrenser fortsatt gjelder. Skill effektmålet fra temperaturprofilene.

Den eneste felles bryteren for prisstyring av lading ligger under Mer → Appinnstillinger, med lagring og lagringsfeil ved bryteren. Mer → Prisstyring åpner direkte med prisinformasjon, uten en ekstra boks med gjentatt prisbryterstatus, forklaring og snarveier. Ladehjelpen finnes under Mer → Hjelp. Behold per-lader-oppsett og valget «Lad kun med billig strøm» som separate innstillinger.
### Tilkobling under oppstart

Vis «Kobler til Power Guard …» med en rolig blå informasjonsmarkering mens innstillingssiden prøver å koble til etter installasjon eller omstart. Fjern meldingen ved vellykket tilkobling. Vis rød feilmelding med råd om å åpne innstillingene på nytt først når de automatiske forsøkene er brukt opp. Tekniske API-feil hører hjemme i debugloggen. Ha norsk og engelsk tekst og bruk eksisterende temafarger.


## Oppstartsveiviser (11. oktober 2026)

Bruk en dialog med maksimalt 480 px bredde og høyde begrenset til skjermen.
Overskrift og fremdrift står øverst; Tilbake/Neste/Lagre ligger fast nederst.
Bare innholdet mellom dem ruller. Aktivt trinn har én oransje fremdriftsmarkør.
Bruk blå handlingsknapper med 2 px kant, 10 px hjørner og minst 44 px høyde.
Feltetiketter knyttes til kontrollene. Forklar hva valget betyr, hvor opplysningen
finnes og hva appen bruker den til. Bruk 13 px forklaring og 16 px felt på mobil.

PG viser fem trinn: HAN-måler, strømnett/hovedsikring, ønsket effektgrense,
prisgrunnlag og oppsummering. Første gjennomgang kreves også for eksisterende
brukere, med lagrede verdier ferdig utfylt. Kladd endrer ikke aktivt oppsett.
Fullføring registreres først etter bekreftet lagring. Etterpå åpnes veiviseren
bare via Mer → Appinnstillinger. Norsk/engelsk og begge visningskontekster
skal støttes. Fang tastaturfokus i dialogen og sperr bakgrunnen med inert.
Bruk tekst sammen med statusfarger. Ukjent måling er aldri 0 W.


### Bekreftelser og hjelpetekst i veiviseren

Behold begge bekreftelsesboksene og knytt dem til de bekreftede verdiene.
Endret strømnett eller sikring fjerner anleggsbekreftelsen; enhver endring
i grunnoppsettet fjerner sluttbekreftelsen. Navigasjon alene gjør ikke det.
Vis «Tidligere lagret oppsett» ved gjenåpning. Bruk vanlig setningsform på
etiketter og bekreftelser, med minst 13 px tekst. Skill feil i feltverdier
fra manglende bekreftelse. Samle prisveiledning og tekniske detaljer i blå
hjelpenedtrekk. Åpne prishjelpen når prisdata mangler. Målerstatus oppdateres
uten å flytte fokus eller bygge feltene på nytt. Oppdateringsfeil må vises
som usikre data; en ny cachelesing fornyer ikke måletidspunktet.

Oppsummeringen viser valgte innstillinger, måler-/prisstatus og bekreftelse.
Den generelle forklaringen om tidligere anleggsgrenser er fjernet herfra.
Teknisk hjelp under selve effektvalget beholdes.

### Effektvalg i grunnoppsett

Bruk samme kW-meny i veiviseren og Appinnstillinger: 2, 5, 10, 20 og 25 kW.
En lagret verdi utenfor listen vises som «eldre verdi» med opptil tre desimaler
uten avrunding av lagrede watt. Behold også en påbegynt kladd fra eldre veiviser.
Nye valg over anleggsgrensen sperres. Endret strømnett/sikring krever ny
kontroll av verdien; en uendret lagret grense skrives ikke på nytt.
Oppsummeringen viser kW. Effektmål bruker de fem prosentvalgene fra master.

### Utviklingsoversikt: beslutning, observasjon og venting

Skill visuelt mellom faktisk avlesning, ønsket tilstand, gjeldende regel og
kommandostatus. En pause eller 0 A betyr ikke i seg selv effektmangel.
Vis prispauser, venting på enhetssvar og sperretid mellom kommandoer med
ulike tekster. Neste pris-/tidsmulighet eller vurdering er ikke garantert
oppstart. Bruk eksplisitt ukjent tidspunkt når styringen ikke har en plan.

Bruk tre like brede oppsummeringsbokser i én rad. Vis ventende/usikre
enheter først, øvrige i et blått nedtrekk med antall. Enhetskort bruker
korte etiketter for avlesning, ønsket tilstand, årsak og neste vurdering.
Registrerte rådata samles i et eget blått Detaljer-nedtrekk. Behold åpne
nedtrekk under oppdatering, og merk gamle data med tekst. Ingen status
skal gis bare med farge. Bruk norske og engelske tekster og samme
tema-/mobilregler som øvrige innstillinger.


### Midlertidig bortfall av forbindelse

Vis «Kobler til …» med eksisterende informasjonsfarge når et lesesvar er tomt
eller ufullstendig. Ikke fyll inn standardverdier eller fjern tidligere
godkjente faner på grunn av manglende svar. Skjul gamle diagnosemålinger
og vis at de ikke kunne oppdateres. Bare et eksplisitt tilgangssvar kan
skjule en tilgangsstyrt fane. Nye leseforsøk skal bevare påbegynte felt,
unngå samtidige duplikater og aldri gjenta skrivehandlinger automatisk.


### Avgrensede utviklingslister

En liste over aktive inngrep skal bruke samme datagrunnlag som den tilhørende
status-telleren. Registrerte start- eller økningsforespørsler kan vises i tillegg,
med tydelig årsak og måletidspunkt. Ikke fyll listen med alle konfigurerte
enheter eller vanlige avlesninger. Tidligere hendelser hører hjemme i Historikk.
En gruppe med øvrige rader skal bare inneholde rader innenfor samme avgrensning;
bruk en beskrivende etikett som «Aktiv regulering».
