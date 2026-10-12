# Videre arbeid

Målet er at nye brukere kan sette opp ønsket husoppførsel uten å forstå interne ID-er, ruting eller tekniske migreringsverktøy.

## Implementert i 0.4.1

- Veiviser med personvalg og egne Flow-valg for avreise, hjemkomst og natt.
- Automatisk lagring av felt, handlinger og veiviservalg med synlig status og revisjonskontroll.
- Egen alarmmotor, sensorvalg, inn-/utgangsforsinkelse, Homey-alarmpanel og direkte låsstyring.
- Enkle Flow-kort med navnevalg og få tagger.
- Oppsettskontroll av reelle kortforbindelser, mål og tagger.
- Gjestemodus som Homey-enhet.
- Felles mottakerutvalg for alle pushvarsler, med vanlig/kritisk/bildepush og valgfri tidslinjekopi.

## Før ny sertifiseringsinnsending

1. Kontroller engelsk og norsk oppsett i Homeys faktiske webview. Den engelske standardopplevelsen er implementert og har bestått lokale GUI-/språktester; pikselkontroll gjenstår.
2. Dokumenter brann-/vannsensor → mobilvarsel → fysisk tiltak og gjenoppretting, inkludert eventuell døropplåsing og vannstenging, med operatør på stedet. Følg [testplanen](CERTIFICATION-TEST-PLAN.md).
3. Forklar behovet for API-nøkkelen til Homey, eller avklar en støttet appbasert løsning før nøkkelen erstattes. Lesingen fra appens SDK-sesjon viser manglende full Flow-tilgang og Flow-start. [Svarutkastet](CERTIFICATION-RESPONSE.md) er ikke sendt.
4. Kontroller at automatisk utgivelse er av før innsending. Ny butikkbeskrivelse, bilder og formaterte Flow-tekster er rettet; Homeys nye godkjenning gjenstår.

## Videre forbedringer

1. Test oppsettet med nye brukere, inkludert bytte av mottaker og enhet.
2. Gjennomfør visuell kontroll på mobil og i Homeys innstillinger.
3. Test den nye alarmen med virkelige sensorer, strøm-/nettbrudd og avstilling. Vurder sabotasje, sensorhelse og tidsbegrenset forbikobling før neste alarmutvidelse.
4. Test mobilspørsmål, feil og tidsavbrudd på reelle telefoner.
5. Vurder mottakergrupper som et valgfritt tillegg. Nå mottar valgte brukere alle appens pushvarsler.

Brukeren kan velge egne scene-Flows i veiviseren eller legge direkte enhetshandlinger til under Rutiner. Med klar API-nøkkelforbindelse kjøres push, nattspørsmål, kamera, Sonos og valgte Flows direkte, uten hjelpeflows.

Appens SDK-sesjon har lesetilgang til Flows, men mangler tilgang til Flow-start og kjøring av native kort. Den separate, lokale API-nøkkelen dekker disse funksjonene; veiviseren ber om Flows-tillatelse. En akseptert API-handling eller startet Flow er ikke bevis for faktisk telefonlevering eller mekanisk resultat. Lås-/portkontroller, nei-veto, avbrudd og vern før fullført grunnoppsett skal beholdes ved videre forenkling.
