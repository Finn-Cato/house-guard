'use strict';

// Translate generated application text, never arbitrary user names/templates.
// Config is deliberately not projected: the settings editor owns its labels.
const EN = {
  'Ukjent versjon for luxvilkår':'Unknown lux condition version',
  'Personer':'People', 'Enheter':'Devices', 'Soner':'Zones', 'Lys':'Lights', 'Dørlås':'Door lock', 'Garasjeport':'Garage door',
  'Hjemme':'Home', 'Borte':'Away', 'Natt':'Night', 'Ukjent':'Unknown', 'Ukjent sone':'Unknown room', 'Uten rom':'No room',
  'Bevegelse':'Motion', 'Dør/vindu':'Door/window', 'Sensor':'Sensor', 'Vannsensor':'Water sensor', 'Brann':'Fire', 'Vann':'Water',
  'Røykalarm':'Smoke alarm', 'Brannalarm':'Fire alarm', 'Varmealarm':'Heat alarm', 'Vannalarm':'Water alarm',
  'temperatur':'temperature', 'batterispenning':'battery voltage', 'batterinivå':'battery level', 'alarmrapport':'alarm report',
  'sensoren meldte alarm':'the sensor reported an alarm', 'sensoren meldte ikke alarm':'the sensor reported no alarm',
  'Siste Person forlater':'Last person leaves', 'Første Person som ankommer':'First person arrives', 'Ankomst om natten':'Arrival at night',
  'Aktivering av Nattmodus':'Night mode activation', 'Deaktivering av Nattmodus':'Night mode deactivation', 'Første person våkner':'First person wakes up',
  'Gjestemodus på':'Guest mode on', 'Gjestemodus av':'Guest mode off', 'Tilkoblingsforsinkelse':'Exit delay', 'Inngangsforsinkelse':'Entry delay',
  'Utløst alarm':'Triggered alarm', 'Alarm avstilt':'Alarm silenced', 'Aktiv sensor':'Active sensor', 'Velkomstlys':'Welcome lights',
  'House Guard innebygd alarm':'House Guard built-in alarm', 'Alarmmodus':'Alarm mode', 'Homey vær – utetemperatur':'Homey weather – outdoor temperature',
  'Utendørs':'Outdoors', 'Utetemperatur':'Outdoor temperature', 'Gjestevarsel':'Guest notification', 'Sett bortreist bruker våken':'Set absent resident awake', 'Huset våkner':'The home wakes up',
  'House Guard: Huset har våknet. Nattmodus er avsluttet.':'House Guard: The house has woken up. Night mode has ended.',
  'Gjestemodus er på. Huset regnes som bebodd, og alarmen holdes frakoblet.':'Guest mode is on. The house is occupied and the alarm stays disarmed.',
  'Gjestemodus er av. Huset følger nå beboernes tilstedeværelse.':'Guest mode is off. The house now follows the residents’ presence.',
  'Alle beboerne har dratt. Gjestemodus er fortsatt på, så gjestene er hjemme alene. Borterutinen kjøres ikke, og alarmen holdes frakoblet.':'All residents have left. Guest mode is still on, so guests are home alone. The away routine will not run and the alarm stays disarmed.',
  'Alarmen er tilkoblet. Kontroller disse aktive sensorene: {reason}. De overvåkes automatisk når de blir inaktive.':'The alarm is armed. Check these active sensors: {reason}. They will be monitored automatically once inactive.',
  'Innbruddsalarm i {zone}: {reason}':'Intrusion alarm in {zone}: {reason}',
  'House Guard kobles til om {seconds} sekunder.':'House Guard arms in {seconds} seconds.',
  'Du har {seconds} sekunder på å slå av alarmen. {zone}: {reason}':'You have {seconds} seconds to disarm the alarm. {zone}: {reason}',
  'Aktiv sensor ved tilkobling: {reason}':'Active sensor during arming: {reason}', 'Alarmen er avstilt.':'The alarm has been silenced.',
  'Aktivere nattmodus?':'Activate night mode?',
  'Venter på Homey':'Waiting for Homey', 'Nattmodus startet manuelt eller etter nattspørsmål':'Night mode started manually or after a night question',
  'Gjestemodus er på. Huset regnes som bebodd.':'Guest mode is on. The house is occupied.',
  'Gjester er hjemme alene. Gjestemodus holder huset hjemme.':'Guests are home alone. Guest mode keeps the house occupied.',
  'Alle valgte personer er bekreftet borte':'All selected residents are confirmed away', 'Alle hjemme i nattutvalget sover':'Everyone home in the night group is asleep',
  'Minst én valgt person er hjemme':'At least one selected resident is home', 'Tilstedeværelse er ukjent eller ingen personer er valgt':'Presence is unknown or no residents are selected',
  'Nattmodus startet':'Night mode started', 'Homey er ikke tilkoblet':'Homey is not connected', 'Homey er ikke tilkoblet.':'Homey is not connected.',
  'Automatisk natt er av':'Automatic night mode is off', 'Nattmodus er allerede startet':'Night mode has already started', 'Utenfor nattvinduet':'Outside the night time window',
  'Natt er hoppet over til neste morgen':'Night mode is skipped until the next morning', 'Ingen er bekreftet hjemme':'Nobody is confirmed home',
  'Tilstedeværelse eller sovestatus er ukjent':'Presence or sleep status is unknown', 'Gjester er hjemme. Automatisk natt venter til gjestemodus er slått av.':'Guests are home. Automatic night mode waits until guest mode is off.',
  'Alarmen er ikke bekreftet frakoblet':'The alarm is not confirmed disarmed', 'Ingen hjemmeværende mottakere valgt':'No recipients at home are selected',
  'Ingen våkne, hjemmeværende mottakere valgt':'No awake recipients at home are selected', 'Velg et nattområde':'Select a night area',
  'Soneaktiviteten er ukjent eller foreldet':'Zone activity is unknown or stale', 'Det er aktivitet i nattområdet':'There is activity in the night area',
  'Det har vært aktivitet etter nattspørsmålet':'There has been activity since the night question', 'Nattområdet har ikke vært rolig lenge nok':'The night area has not been quiet long enough',
  'Tilstedeværelse eller sovestatus er ukjent, ingen er hjemme eller gjestemodus er på':'Presence or sleep status is unknown, nobody is home or guest mode is on',
  'Rutinen er erstattet':'The routine has been replaced', 'Gjestemodus holder huset hjemme og alarmen frakoblet':'Guest mode keeps the house occupied and the alarm disarmed',
  'Gjestemodus er endret; ekstrahandlingen er ikke lenger aktuell':'Guest mode changed; the extra action no longer applies', 'Gjesteankomsten er ikke lenger gyldig':'The guest arrival is no longer valid',
  'Gjestevarselet er ikke lenger aktuelt':'The guest notification no longer applies', 'Oppvåkningen er ikke lenger bekreftet':'Waking up is no longer confirmed',
  'Lås, alarm og port må styres gjennom sikkerhetsoppsettet':'Control locks, alarms and garage doors through the security settings', 'Ingen bekreftet tom bolig':'The house is not confirmed empty',
  'Nattankomsten er ikke lenger gyldig':'The night arrival is no longer valid', 'Morgen krever at noen er hjemme':'Morning requires someone at home',
  'Tilkoblingskontroll hoppes over ved gjester':'Arming checks are skipped while guests are home', 'Alarmen er avstilt':'The alarm has been dismissed',
  'Alarmpanelet bekrefter avstilt alarm':'The alarm panel confirms the alarm is dismissed', 'Automatisk portstyring er av':'Automatic garage control is off',
  'Handlingens vilkår er ikke oppfylt':'The action conditions are not met', 'Målingen i vilkåret er ukjent eller foreldet':'The condition measurement is unknown or stale',
  'Sensorvilkåret er ikke oppfylt':'The sensor condition is not met', 'Personen er ikke bekreftet hjemme':'The resident is not confirmed home',
  'Personen er ikke bekreftet borte':'The resident is not confirmed away', 'Sovestatus er ukjent':'Sleep status is unknown', 'Sovestatus er allerede bekreftet':'Sleep status is already confirmed',
  'Enheten er utilgjengelig':'The device is unavailable', 'Målenheten mangler':'The target device is missing', 'Enheten eller funksjonen er utilgjengelig':'The device or capability is unavailable',
  'Enhetens funksjon kan ikke styres':'The device capability cannot be controlled', 'Porten er allerede i ønsket tilstand':'The garage door is already in the requested state',
  'Avhengig handling kan ikke bekreftes':'The required action cannot be confirmed', 'Egne handlinger er slått av':'Extra actions are off',
  'En tidligere handling ville stoppet rutinen':'An earlier action would stop the routine', 'Ønsket tilstand er allerede bekreftet':'The requested state is already confirmed',
  'Ønsket tilstand er allerede bekreftet – ingen kommando sendt':'The requested state is already confirmed – no command sent',
  'Krever at tidligere handling bekreftes ved kjøring':'Requires confirmation of an earlier action during execution',
  'Vilkårene tillater handlingen nå; tidligere steg må lykkes':'The conditions allow this action now; earlier steps must succeed',
  'Forhåndsvisning av valgt oppsett med nåværende tilstand. Ingen rutine er startet. Vilkårene kontrolleres på nytt ved faktisk kjøring.':'Preview of the selected settings using current status. No routine has started. Conditions will be checked again during execution.',
  'Gjestemodus bruker nå vanlig hjemkomst og borterutine. Tidligere gjestehandlinger kjøres ikke.':'Guest mode now uses the normal arrival and away routines. Old guest actions do not run.',
  'Portens polaritet og kommando må valideres':'Verify the garage door polarity and command', 'Garasjeport har ukjent status – lukking hoppet over':'Garage door status is unknown – closing skipped',
  'Garasjeport er allerede lukket':'The garage door is already closed', 'Noen sover, eller sovestatus er ukjent':'Someone is asleep or sleep status is unknown',
  'Det er lysere enn valgt luxgrense':'It is brighter than the selected lux threshold', 'Lysmålingen mangler eller er for gammel':'The light measurement is missing or too old',
  'Det er mellom soloppgang og solnedgang':'It is between sunrise and sunset', 'Solstatus er ukjent. Kontroller API-nøkkelen og Homeys plassering.':'Sun status is unknown. Check the API key and Homey’s location.',
  'Solstatus er ukjent. Kontroller Homeys plassering og API-nøkkel.':'Sun status is unknown. Check Homey’s location and the API key.',
  'Nattalarm krever at noen er hjemme og bekreftet sovende.':'Night alarm requires someone confirmed home and asleep.',
  'Nattalarm avsluttet: alle beboere er borte.':'Night alarm ended: all residents are away.', 'Nattalarm avsluttet: ingen hjemmeværende er bekreftet sovende.':'Night alarm ended: nobody at home is confirmed asleep.',
  'Nattmodus hoppes over fordi gjester er hjemme.':'Night mode is skipped because guests are home.', 'Gjestemodus holder alarmen frakoblet.':'Guest mode keeps the alarm disarmed.',
  'Slå av gjestemodus før du starter nattmodus. Gjester holder huset hjemme og alarmen frakoblet.':'Turn guest mode off before starting night mode. Guests keep the house occupied and the alarm disarmed.',
  'Slå av gjestemodus før du kobler til alarmen. Gjester holder alarmen frakoblet.':'Turn guest mode off before arming. Guests keep the alarm disarmed.',
  'Nattmodus krever at noen er hjemme':'Night mode requires someone at home', 'Bortemodus krever at alle valgte er bekreftet borte':'Away mode requires all selected residents confirmed away',
  'Tilstedeværelse oppdateres. Vent til kommandoen er ferdig.':'Presence is updating. Wait for the command to finish.',
  'Tilstedeværelse oppdateres allerede. Vent til kommandoen er ferdig.':'Presence is already updating. Wait for the command to finish.',
  'Bortreiste brukere kan bare settes våkne.':'Residents who are away can only be set awake.', 'Gjestemodus må være av/på':'Guest mode must be on or off',
  'Nattmodus må være av/på.':'Night mode must be on or off.', 'Sovestatus må være av/på.':'Sleep status must be on or off.',
  'Tilstedeværelse må være hjemme eller borte.':'Presence must be home or away.', 'Velg hjemme eller borte.':'Select home or away.',
  'Velg brukere under Personer først.':'Select residents under People first.', 'Alle valgte brukere må være tilgjengelige i Homey før tilstedeværelsen kan endres.':'All selected residents must be available in Homey before presence can change.',
  'Ikke alle endringer ble bekreftet. Kontroller personstatus og logg; ingen automatisk gjentakelse er sendt.':'Not all changes were confirmed. Check resident status and the log; no automatic retry was sent.',
  'Homey-forbindelsen starter. Prøv igjen om litt.':'The Homey connection is starting. Try again shortly.', 'House Guard starter.':'House Guard is starting.',
  'House Guard starter. Prøv igjen om litt.':'House Guard is starting. Try again shortly.', 'House Guard startet':'House Guard started',
  'Homey er ikke tilkoblet. Gjestemodus ble ikke endret.':'Homey is not connected. Guest mode was not changed.',
  'Homey er ikke tilkoblet. Nattmodus ble ikke endret.':'Homey is not connected. Night mode was not changed.',
  'Fullfør grunnoppsettet i House Guard før du bruker nattbryteren.':'Complete House Guard setup before using the night switch.',
  'Venter på fersk nattstatus fra Homey.':'Waiting for fresh night status from Homey.', 'Venter på kjent hjemme- og sovestatus for beboerne.':'Waiting for known presence and sleep status for residents.',
  'Nattmodus ble endret underveis. Kontroller husets status.':'Night mode changed during the command. Check the house status.',
  'Velg House Guard innebygd alarm under Sikkerhet først.':'Select the House Guard built-in alarm under Alarm first.',
  'House Guard bruker bare sin egen alarm. Slå på «Bruk House Guard-alarm» under Alarm.':'House Guard uses its own alarm. Enable “Use House Guard alarm” under Alarm.',
  'Slå på House Guard-alarm først.':'Enable House Guard alarm first.', 'Slå på «Bruk House Guard-alarm» under Alarm.':'Enable “Use House Guard alarm” under Alarm.',
  'Frakoble den innebygde alarmen før du endrer sensorer, forsinkelser, alarmvalg eller observasjonsmodus.':'Disarm the built-in alarm before changing sensors, delays, alarm settings or observation mode.',
  'Tilkobling ble avbrutt ved omstart. Koble til på nytt.':'Arming was cancelled on restart. Arm again.', 'Avstill alarmen før du kobler til igjen.':'Dismiss the alarm before arming again.',
  'Velg minst én sensor for denne alarmmodusen.':'Select at least one sensor for this alarm mode.', 'Alarmen kunne ikke kobles til.':'The alarm could not be armed.',
  'Alarmpanel – detaljer mangler':'Alarm panel – details missing', 'Ukjent årsak':'Unknown reason', 'ukjent/utilgjengelig':'unknown/unavailable', 'aktiv':'active',
  'Bruk den innebygde alarmstyringen.':'Use the built-in alarm controls.', 'Automatisk frakobling krever at en beboer er hjemme.':'Automatic disarming requires a resident at home.',
  'Frakoble alarmen før du låser opp eller åpner porten.':'Disarm the alarm before unlocking or opening the garage door.', 'Låsen har ukjent status.':'Lock status is unknown.',
  'Fullfør og kontroller portoppsettet under Alarm.':'Complete and verify the garage setup under Alarm.', 'Portkommandoen er ikke støttet.':'The garage command is not supported.',
  'Garasjeporten har ukjent status.':'Garage door status is unknown.', 'Portoppsettet har bare en lukk-kommando.':'The garage setup only has a close command.',
  'Velg lås eller port og en gyldig kommando.':'Select a lock or garage door and a valid command.', 'En kommando pågår. Vent på bekreftet status.':'A command is in progress. Wait for confirmed status.',
  'Kommandoen kunne ikke utføres. Se hendelsesloggen.':'The command could not be performed. Check the event log.',
  'En portkommando pågår eller er nylig sendt. Ingen ny puls sendt.':'A garage command is in progress or was sent recently. No new pulse sent.',
  'Ønsket tilstand er allerede oppnådd. Ingen ny kommando sendt.':'The requested state is already reached. No new command sent.',
  'Enheten eller den skrivbare funksjonen mangler':'The device or writable capability is missing', 'Verdien har feil type':'The value has the wrong type',
  'Verdien er utenfor enhetens område':'The value is outside the device’s range', 'Verdien er ikke støttet av enheten':'The value is not supported by the device',
  'Observasjonsmodus blokkerer sideeffekter':'Observation mode blocks actions', 'Handlingen ble avbrutt før sending':'The action was cancelled before sending',
  'API-nøkkel':'API key', 'En nøkkelkontroll pågår. Vent til den er ferdig.':'A key check is in progress. Wait for it to finish.', 'API-nøkkel må være tekst.':'The API key must be text.',
  'Lim inn hele API-nøkkelen uten mellomrom.':'Paste the complete API key without spaces.', 'Ingen API-nøkkel er lagt inn.':'No API key has been entered.',
  'API-nøkkelen kunne ikke kontrolleres. Kontroller nøkkelen og forbindelsen til Homey.':'The API key could not be checked. Check the key and connection to Homey.',
  'Nøkkelen trenger Flows-tilgang, inkludert kjøring av Flow-kort. Bare «Start Flows» er ikke nok.':'The key needs full Flows permission, including Flow card execution. “Start Flows” alone is insufficient.',
  'Direkte API-forbindelse er ikke klar. Kontroller nøkkelen under Mer.':'The direct API connection is not ready. Check the key under Settings.',
  'API-forbindelsen ble endret.':'The API connection changed.', 'API-tilgangen ble avvist. Kontroller nøkkelen under Mer.':'API access was denied. Check the key under Settings.',
  'Direkte Homey-kall feilet eller fikk ukjent utfall. Ingen ny sending er forsøkt. Kontroller API-nøkkelen og hendelsesloggen.':'The direct Homey call failed or has an unknown outcome. No retry was attempted. Check the API key and event log.',
  'Direkte API-forbindelse må være klar for å endre tilstedeværelse.':'The direct API connection must be ready to change presence.',
  'Valgt mottaker mangler en tilgjengelig Homey-konto.':'The selected recipient has no available Homey account.', 'Personen er ikke bekreftet hjemme.':'The resident is not confirmed home.',
  'Personen er ikke bekreftet borte.':'The resident is not confirmed away.', 'Personen er ikke med i dette brukerutvalget.':'The resident is not in this selection.',
  'Brukeren er ikke tilgjengelig i Homey.':'The resident is unavailable in Homey.', 'Nattspørsmålet er utløpt.':'The night question has expired.', 'Ugyldig nattsvar.':'Invalid night answer.',
  'Kamerabilde er utilgjengelig.':'The camera image is unavailable.', 'Den valgte Sonos-lyden er utilgjengelig.':'The selected Sonos sound is unavailable.',
  'Ingen varslingsmottakere er valgt':'No notification recipients are selected', 'Ingen varslingsmottakere er valgt.':'No notification recipients are selected.',
  'Homey-kortet er utført. Mottak på telefon eller hørbar lyd er ikke bekreftet.':'The Homey card executed. Phone receipt or audible playback is not confirmed.',
  'Direkte levering feilet eller har ukjent utfall.':'Direct delivery failed or has an unknown outcome.',
  'Én eller flere direkte leveringer feilet eller har ukjent utfall. Ingen automatisk gjentakelse er forsøkt.':'One or more direct deliveries failed or have an unknown outcome. No automatic retry was attempted.',
  'Flow er deaktivert, har feil eller kan ikke startes direkte':'The Flow is disabled, broken or cannot be started directly',
  'Flow mangler, er deaktivert, har feil eller kan ikke startes direkte':'The Flow is missing, disabled, broken or cannot be started directly',
  'Flere startkoblinger for samme Flow. Behold én under Mer → Koblinger.':'There are multiple start bridges for the same Flow. Keep one under Settings → Connections.',
  'Startkobling mangler for valgt Flow. Se Mer → Koblinger.':'The selected Flow has no start bridge. See Settings → Connections.',
  'Startkobling mangler eller finnes flere ganger. Legg inn API-nøkkel under Innstillinger → API-nøkkel.':'The start bridge is missing or duplicated. Enter an API key under Settings → API key.',
  'Sovestatuskobling mangler. Legg inn API-nøkkel under Innstillinger → API-nøkkel.':'The sleep status bridge is missing. Enter an API key under Settings → API key.',
  'Sovestatus trenger én kobling for denne personen. Se Mer → Koblinger.':'Sleep status needs one bridge for this resident. See Settings → Connections.',
  'Leveringsflow er ikke konfigurert':'The delivery Flow is not configured', 'Handling er ikke støttet':'The action is not supported',
  'Spørsmålet er utløpt, eller mottakeren er feil':'The question expired or the recipient is incorrect', 'Ugyldig svar':'Invalid answer',
  'Ukjent integrasjonshendelse':'Unknown integration event', 'Ukjent modus':'Unknown mode', 'Ukjent rutine':'Unknown routine', 'Ukjent alarmmodus':'Unknown alarm mode',
  'Ukjent kommando':'Unknown command', 'Ukjent manuell kommando.':'Unknown manual command.', 'Ukjent Flow-type':'Unknown Flow type',
  'Ukjent meldingstype':'Unknown message type', 'Ukjent leveringstype.':'Unknown delivery type.', 'Ukjent varseltype':'Unknown notification type', 'Ukjent varseltype.':'Unknown notification type.',
  'Ukjent brann- eller vannoppsett.':'Unknown fire or water settings.', 'Ukjent forbindelsestest.':'Unknown connection test.',
  'Direkte forbindelse er ikke klar.':'The direct connection is not ready.', 'En forbindelsestest pågår allerede.':'A connection test is already running.',
  'Vent ett minutt før et nytt testvarsel.':'Wait one minute before sending another test notification.', 'Velg pushmottakere under Personer.':'Select push recipients under People.',
  'Velg et kamera som allerede brukes til bildevarsler i oppsettet.':'Select a camera already configured for image notifications.',
  'Velg ett til tre kameraer under Brann og vann → Varsler og handlinger.':'Select one to three cameras under Fire and water → Notifications and actions.',
  'Velg ett til tre kameraer under Alarm → Varsler.':'Select one to three cameras under Alarm → Notifications.', 'Testkortet ble ikke kjørt.':'The test card did not run.',
  'Test-Flow kunne ikke opprettes.':'The test Flow could not be created.', 'Test-Flow ble ikke bekreftet kjørt.':'The test Flow execution was not confirmed.',
  'House Guard: Test av direkte push via API-nøkkel. Ingen alarm er utløst.':'House Guard: Direct push test using the API key. No alarm was triggered.',
  'House Guard: Test av kritisk push via API-nøkkel. Ingen alarm er utløst.':'House Guard: Critical push test using the API key. No alarm was triggered.',
  'House Guard: Test av bildepush via API-nøkkel. Ingen alarm er utløst.':'House Guard: Image push test using the API key. No alarm was triggered.',
  'Oppsett eller forbindelse ble endret.':'Settings or connection changed.', 'Oppsettet ble endret.':'The settings changed.', 'Oppsettet ble endret. Prøv igjen.':'The settings changed. Try again.',
  'Oppsettet er endret i en annen visning. Last inn på nytt før lagring.':'Settings changed in another view. Reload before saving.', 'Mangler kommando':'Missing command', 'Mangler API-nøkkel.':'Missing API key.',
  'Velg en Sonos-høyttaler.':'Select a Sonos speaker.', 'Kontroller tilgang i observasjonsmodus.':'Check access in observation mode.',
  'API-nøkkel må være klar for direkte varsler, Sonos og Flows.':'The API key must be ready for direct notifications, Sonos and Flows.',
  'Appen startet på nytt. Fysiske handlinger gjentas ikke.':'The app restarted. Physical actions will not be repeated.', 'Varseloppsettet ble endret før sending.':'Notification settings changed before sending.',
  'Hendelsen eller oppsettet ble endret før sending.':'The incident or settings changed before sending.', 'Ønsket enhetsstatus er allerede oppnådd.':'The requested device state is already reached.',
  'AV-kommando akseptert. Ventilposisjon er ikke bekreftet av Homey.':'The OFF command was accepted. Valve position is not confirmed by Homey.',
  'Kommando akseptert. Venter på enhetsstatus.':'Command accepted. Waiting for device status.', 'Akseptert av Homey.':'Accepted by Homey.',
  'Akseptert av Homey. Mottak på telefon er ikke bekreftet.':'Accepted by Homey. Phone receipt is not confirmed.',
  'Homey bekrefter AV på enheten. Ventilposisjon er ikke tilgjengelig.':'Homey confirms the device is OFF. Valve position is unavailable.',
  'Enhetsstatus bekreftet av Homey.':'Device status confirmed by Homey.', 'Enhetsstatus ble ikke bekreftet. Kommandoen gjentas ikke automatisk.':'Device status was not confirmed. The command will not be repeated automatically.',
  'Denne alarmhendelsen er ikke lenger aktiv. Oppdater oversikten.':'This alarm incident is no longer active. Refresh the overview.',
  'Dette kontrollvarselet er ikke lenger aktivt.':'This health warning is no longer active.',
  'En gammel måleverdi alene bekrefter ikke at sensoren er offline.':'An old measurement alone does not confirm that the sensor is offline.',
  'Brann og vann':'Fire and water', 'Kontroll av vannsensorer':'Water sensor health', 'Kontrollvarsel til telefon':'Health notification to phone',
  'Direkte brann- og vannvarsler':'Direct fire and water notifications', 'Alarmsensorer':'Alarm sensors', 'Bortealarm':'Away alarm', 'Nattalarm':'Night alarm',
  'Sensorer deaktivert fra Flow':'Sensors disabled by Flow', 'Velkomstsensor':'Welcome sensor', 'Velkomstlys etter solnedgang':'Welcome lights after sunset',
  'Mobilspørsmål om nattmodus':'Night questions to phones', 'Mobilvarsler':'Phone notifications', 'Tale og lyd':'Speech and sound', 'Alarmhendelser':'Alarm events', 'Alarmvalg':'Alarm options', 'Eksisterende hovedflows':'Existing main Flows',
  'Valgte personer har fersk tilstedeværelse.':'Selected residents have fresh presence status.', 'Velg hvem som bor her og kontroller tilstedeværelsen i Homey.':'Select the residents and check their presence in Homey.',
  'Alarm er ikke valgt. Grunnfunksjonene kan brukes uten alarm.':'No alarm is selected. Basic features work without an alarm.', 'House Guard overvåker valgte alarmsensorer.':'House Guard monitors the selected alarm sensors.',
  'Alarmmodus og alarmstatus leses direkte. Fysisk virkning må testes.':'Alarm mode and status are read directly. Physical effects must be tested.',
  'Velg sensorer for borte og natt under Alarm.':'Select away and night sensors under Alarm.', 'Velg minst én sensor for borte.':'Select at least one away sensor.',
  'Ingen sensor er valgt for natt; nattalarm kan ikke kobles til.':'No night sensor is selected; night alarm cannot arm.', 'Automatisk låsing er ikke valgt.':'Automatic locking is not selected.',
  'Låsen styres direkte av House Guard.':'House Guard controls the lock directly.', 'Velg en tilgjengelig lås under Alarm.':'Select an available lock under Alarm.',
  'Bruker API-nøkkelen direkte. Ingen hjelpeflows.':'Uses the API key directly. No helper Flows.',
  'Kontroller API-nøkkelen under Innstillinger for push, kamera, Sonos og start av Flows.':'Check the API key under Settings for push, cameras, Sonos and Flow starts.',
  'Kontroller API-nøkkelen under Innstillinger og velg mottakere under Personer.':'Check the API key under Settings and select recipients under People.',
  'Valgt sensor er tilgjengelig. Velkomstlys gjelder ti minutter etter første hjemkomst.':'The selected sensor is available. Welcome lights apply for ten minutes after the first arrival.',
  'Velg en tilgjengelig dørkontakt eller bevegelsessensor under Rutiner → Velkomstlys.':'Select an available door contact or motion sensor under Routines → Welcome lights.',
  'Kontroller API-nøkkelen under Innstillinger.':'Check the API key under Settings.', 'Bruker Homeys solnedgang og soloppgang. Ingen lysmåler nødvendig.':'Uses Homey’s sunset and sunrise. No light sensor needed.',
  'Forbindelsen er klar for Flow-start, varsler, lyd og sovestatus.':'The connection is ready for Flow starts, notifications, audio and sleep status.',
  'Ikke valgt. Nattmodus kan startes fra Hjem.':'Not selected. Night mode can be started from Home.', 'Velg en sone med tilgjengelig aktivitet under Rutiner.':'Select a zone with available activity under Routines.',
  'Velg hvem som skal få nattspørsmål under Personer.':'Select night question recipients under People.',
  'Nattspørsmål krever API-nøkkel. Legg inn API-nøkkel under Innstillinger → API-nøkkel.':'Night questions require an API key. Enter it under Settings → API key.',
  'Nattspørsmål sendes direkte. Faktisk mottak og svar må testes.':'Night questions are sent directly. Actual receipt and replies must be tested.',
  'Spørsmålskoblingen er konfigurert. Faktisk mottak og svar må testes.':'The question bridge is configured. Actual receipt and replies must be tested.',
  'Ikke valgt. Du kan legge til dette senere.':'Not selected. You can add this later.', 'Koblingen er kontrollert. Mottak eller hørbar lyd er ikke bekreftet.':'The connection is checked. Receipt or audible playback is not confirmed.',
  'Velg mottakere under Personer.':'Select recipients under People.', 'Kontroller API-nøkkelen og valgte mottakere under Innstillinger og Personer.':'Check the API key and selected recipients under Settings and People.',
  'Direkte levering krever API-nøkkel. Legg inn API-nøkkel under Innstillinger → API-nøkkel.':'Direct delivery requires an API key. Enter it under Settings → API key.',
  'Sensor, sone, årsak og forsinkelser håndteres direkte av House Guard. Ingen hjelpeflows.':'House Guard handles sensors, rooms, causes and delays directly. No helper Flows.',
  'Et valgt kamera, lys eller en høyttaler er utilgjengelig. Se Alarm.':'A selected camera, light or speaker is unavailable. See Alarm.',
  'Automatisk portstyring er ikke valgt.':'Automatic garage control is not selected.', 'Status og portkommando er tilgjengelige. Porten krever kontroll av faktisk virkning.':'Status and garage commands are available. Actual garage operation must be checked.',
  'Fullfør portoppsettet under Alarm: status og kommando.':'Complete the garage setup under Alarm: status and command.',
  'Ingen alarmreaksjon er valgt i House Guard. Velg push, kamera, lyd eller lys under Alarm.':'No alarm response is selected in House Guard. Choose push, cameras, audio or lights under Alarm.',
  'En valgt enhet mangler eller er utilgjengelig. Åpne rutinen og velg enhet på nytt.':'A selected device is missing or unavailable. Open the routine and select it again.',
  'Valgt Flow krever direkte forbindelse. Legg inn API-nøkkel under Innstillinger → API-nøkkel.':'The selected Flow requires a direct connection. Enter an API key under Settings → API key.',
  'En valgt Flow mangler, er deaktivert, har feil eller kan ikke startes direkte.':'A selected Flow is missing, disabled, broken or cannot be started directly.',
  'Velg full alarm eller nattalarm og en gyldig sensorhandling.':'Select full or night alarm and a valid sensor action.', 'Sensoren er ikke valgt for denne modusen under Alarm → Sensorer.':'The sensor is not selected for this mode under Alarm → Sensors.',
  'Velg en alarmsensor fra listen i Flow-kortet.':'Select an alarm sensor from the Flow card list.', 'Velg en alarmsensor først.':'Select an alarm sensor first.',
  'Sensorprøve krever innebygd alarm i observasjonsmodus.':'Sensor testing requires the built-in alarm in observation mode.', 'Sensoren er utilgjengelig.':'The sensor is unavailable.',
  'Konfigurasjonen må være et objekt':'Configuration must be an object', 'Ukjent konfigurasjonsversjon':'Unknown configuration version', 'Ukjent gjestemodus':'Unknown guest mode',
  'Ukjent svarregel':'Unknown answer rule', 'Ukjent alarmvilkår':'Unknown alarm condition', 'Ukjent portkommando':'Unknown garage command', 'Ugyldig portverdi':'Invalid garage value',
  'Ukjent vilkår':'Unknown condition', 'Ukjent sammenligning':'Unknown comparison', 'Ugyldig sammenligningsverdi':'Invalid comparison value', 'Ukjent leveringsmetode':'Unknown delivery method',
  'Personer i nattutvalget må også telle med i tilstedeværelse':'Night group residents must also be included in presence',
  'Velg bevegelsesfunksjon for morgensensoren':'Select a motion capability for the morning sensor', 'Morgenbevegelse må ha et tidsrom innen samme dag, med fra før til':'The morning motion window must be within one day, with start before end',
  'Velg en morgensensor før du slår på morgen ved bevegelse':'Select a morning sensor before enabling wake-up by motion', 'Velg maksimalt tre kameraer per alarmhendelse':'Select at most three cameras per alarm event',
  'Et kamera kan bare velges én gang':'A camera can only be selected once', 'Velg kamera':'Select a camera', 'Maks 30 lyd- eller lysvalg per alarmhendelse':'At most 30 audio or light selections per alarm event',
  'Velg alarmenhet':'Select an alarm device', 'Velg tale eller alarmlyd':'Select speech or alarm sound', 'Maks 100 alarmsensorer':'At most 100 alarm sensors',
  'Velg en fysisk alarmsensor':'Select a physical alarm sensor', 'Alarmsensor er valgt flere ganger':'The alarm sensor is selected more than once', 'Portstyring krever validerte enhetsvalg, polaritet og kommando':'Garage control requires verified devices, polarity and commands',
  'Velg dør/vindu eller bevegelse':'Select door/window or motion', 'Velg dør/vindu, bevegelse eller portstatus':'Select door/window, motion or garage status', 'Vanlige alarmsensorer må bruke aktiv/på som alarmverdi':'Standard alarm sensors must use active/on as the alarm value', 'Portsensorens åpen-verdi må være av/på':'The garage sensor open value must be on/off', 'Velg dørkontakt eller bevegelsessensor for velkomstlys':'Select a door contact or motion sensor for welcome lights',
  'Velg døråpning eller bevegelse for velkomstlys':'Select door opening or motion for welcome lights', 'Velkomstsensorens funksjon må stemme med valgt sensortype':'The welcome sensor capability must match the selected sensor type',
  'Velg lysmåler eller etter solnedgang for velkomstlys':'Select a light sensor or after sunset for welcome lights', 'Maks 50 egne rutiner':'At most 50 custom routines', 'Maks 50 egne rutiner i tillegg til de faste':'At most 50 custom routines in addition to built-ins',
  'Rutine-ID må være unik':'Routine IDs must be unique', 'Velg sekvens eller parallell utførelse':'Select sequential or parallel execution', 'Maks 100 handlinger per rutine':'At most 100 actions per routine',
  'Handlings-ID må være unik':'Action IDs must be unique', 'Velg handlingskategori':'Select an action category', 'Velg feilregel':'Select error handling',
  'Avhengighet må peke på en tidligere handling':'A dependency must point to an earlier action', 'Bekreftelseskrav må ha en avhengighet':'A confirmation requirement must have a dependency',
  'Bruk sikkerhetsoppsettet for lås, alarm og port':'Use security settings for locks, alarms and garage doors', 'Velg lydenhet':'Select an audio device', 'Velg ønsket verdi':'Select the requested value',
  'Velg en fysisk brann- eller vannsensor':'Select a physical fire or water sensor', 'Velg en røyk-, brann-, varme- eller vannalarmfunksjon':'Select a smoke, fire, heat or water alarm capability',
  'En sensorfunksjon kan bare velges én gang':'A sensor capability can only be selected once', 'Velg minst én sensor før du slår på Brann og vann':'Select at least one sensor before enabling Fire and water',
  'Skriv en alarmmelding':'Enter an alarm message', 'Alarmgjentakelse må være mellom 60 og 3600 sekunder':'Alarm repeats must be between 60 and 3600 seconds',
  'Velg høyttaler':'Select a speaker', 'Velg tale eller lyd':'Select speech or sound', 'Volum må være mellom 1 og 100':'Volume must be between 1 and 100',
  'Velg lys':'Select lights', 'Et lys kan bare velges én gang':'A light can only be selected once', 'Velg en vanlig eller Advanced Flow':'Select a normal or Advanced Flow', 'En Flow kan bare velges én gang':'A Flow can only be selected once',
  'Velg vannstyring og bekreft at AV stenger vannet':'Select water control and verify that OFF closes the water valve', 'Velg ytterdørlås under Alarm før opplåsing ved brann':'Select the front door lock under Alarm before enabling fire unlock',
  'Kontroll av vannsensorer: velg 1 til 720 timer':'Water sensor health: select 1 to 720 hours', 'Sensoren tilbyr ikke valgt brann- eller vannalarmfunksjon.':'The sensor does not offer the selected fire or water alarm capability.',
  'Velg et lys med skrivbar av/på-funksjon under Brann og vann.':'Select a light with a writable on/off capability under Fire and water.',
  'Vannstyring må være en egen av/på-enhet som er bekreftet å stenge vannet ved AV.':'Water control must be a separate on/off device verified to close the water valve when OFF.',
  'Ytterdøren tilbyr ikke skrivbar låsestatus.':'The front door does not offer writable lock status.',
  'Egne gjesterutiner er erstattet av vanlig hjemkomst og bortemodus.':'Custom guest routines have been replaced by normal arrival and away mode.',
  'Bortemodus avbrutt fordi noen kom hjem eller tilstedeværelsen er ukjent':'Away mode cancelled because someone arrived or presence is unknown',
  'Rutinen avbrutt: ingen er bekreftet hjemme':'Routine cancelled: nobody is confirmed home', 'Automatisk nattspørsmål avbrutt ved ny tilkobling':'Automatic night question cancelled on reconnect',
  'Ventende rutine avbrutt ved ny tilkobling':'Pending routine cancelled on reconnect', 'Fersk tilstand lest. Gamle ankomster og opplåsinger er ikke spilt av':'Fresh status read. Old arrivals and unlocks were not replayed',
  'Nattaktivering avbrutt ved hjemkomst':'Night activation cancelled on arrival', 'Våknevarsel avbrutt fordi huset er i nattmodus igjen':'Wake notification cancelled because the house is in night mode again',
  'Aktiv alarm bekreftet etter restart':'Active alarm confirmed after restart', 'Alarmgjentakelse venter på fersk bekreftelse':'Alarm repeats wait for fresh confirmation',
  'Nattbeslutning avbrutt fordi oppsettet eller spørsmålet er endret':'Night decision cancelled because settings or the question changed', 'Nattbeslutning avbrutt fordi vilkårene endret seg':'Night decision cancelled because conditions changed',
  'Nattmodus starter: ja-svar mottatt':'Night mode starts: yes answer received', 'Nattmodus starter: ingen svarte innen fristen':'Night mode starts: nobody replied before the deadline',
  'Morgen hoppet over: ingen beboere er hjemme':'Morning skipped: no residents are home', 'Nattaktivering avbrutt fordi morgen ble startet':'Night activation cancelled because morning started',
  'Automatisk nattmodus hoppes over til neste konfigurerte morgen':'Automatic night mode skipped until the next configured morning',
  'Observasjon: ville spurt om nattmodus. Ingen spørsmål sendt':'Observation: would ask about night mode. No question sent', 'Nattspørsmål ikke sendt: spørsmålsbro er ikke konfigurert':'Night question not sent: question bridge is not configured',
  'Alarm avstilt – gjentakelse stoppet':'Alarm dismissed – repeats stopped', 'Ventende handling avbrutt fordi innstillingene ble endret':'Pending action cancelled because settings changed',
  'Ventende handling avbrutt fordi gjestetilstedeværelsen endret seg':'Pending action cancelled because guest presence changed',
  'Gjestemodus er på. Hjemkomst og opplåsing hoppes over fordi beboernes tilstedeværelse ikke er bekreftet.':'Guest mode is on. Arrival and unlocking are skipped because resident presence is not confirmed.',
  'Manuell låsing':'Manual locking', 'Manuell opplåsing':'Manual unlocking', 'Manuell åpning av port':'Manual garage opening', 'Manuell lukking av port':'Manual garage closing',
  'Låsekommando sendt – venter på bekreftelse':'Lock command sent – waiting for confirmation', 'Handling sendt':'Action sent', 'Kommando akseptert – tilstand er ennå ikke bekreftet':'Command accepted – status is not yet confirmed',
  'Handling akseptert; ekstern levering er ikke bekreftet':'Action accepted; external delivery is not confirmed', 'Ønsket tilstand bekreftet':'Requested state confirmed',
  'Tilstanden ble ikke bekreftet innen fristen. Ingen automatisk gjentakelse':'State was not confirmed before the deadline. No automatic retry',
  'Ingen kvittering fra leveringsflow innen fem minutter':'No delivery Flow receipt within five minutes',
  'Morgen ved bevegelse hoppet over: direkte API-forbindelse er ikke klar':'Wake-up by motion skipped: direct API connection is not ready',
  'Observasjon: bevegelse ville startet morgen, frakoblet nattalarm og satt hjemmeværende våkne':'Observation: motion would start morning, disarm night alarm and set residents at home awake',
  'Tilkobling avbrutt ved frakobling.':'Arming cancelled by disarming.', 'Tilkobling avbrutt – ventende handlinger stoppet':'Arming cancelled – pending actions stopped',
  'Ventende alarmrutine avbrutt ved frakobling':'Pending alarm routine cancelled by disarming', 'Ventende alarmrutine avbrutt ved manuell alarmstyring':'Pending alarm routine cancelled by manual alarm control',
  'Ventende handlinger avbrutt fordi API-forbindelsen ble endret':'Pending actions cancelled because the API connection changed',
  'Direkte API-forbindelse kontrollert. Ingen prøvemeldinger sendt.':'Direct API connection checked. No test messages sent.', 'API-nøkkel fjernet. Eksisterende Flow-koblinger brukes igjen.':'API key removed. Existing Flow bridges are used again.',
  'Sanntid utilgjengelig; 30-sekunders avstemming brukes':'Realtime unavailable; using 30-second polling', 'Ugyldig lagret oppsett – starter i observasjon':'Invalid saved settings – starting in observation mode',
  'Nattstatus kunne ikke oppdateres':'Night status could not be updated', 'Gjestestatus kunne ikke oppdateres':'Guest status could not be updated',
  'Ingen sensorer overvåkes':'No sensors are monitored', 'Sensor utilgjengelig':'Sensor unavailable',
  'ukjent antall':'unknown value', 'ukjent vær':'unknown weather',
  'Kamera':'Camera', 'Enhet':'Device', 'Melding':'Message', 'Sovestatus':'Sleep status', 'Svarfrist':'Reply deadline', 'Volum':'Volume', 'Nattsone':'Night zone',
  'Ferskhet':'Freshness', 'Borteforsinkelse':'Away delay', 'Hjemkomstforsinkelse':'Arrival delay', 'Inaktivitet':'Inactivity', 'Nattstart':'Night start', 'Nattslutt':'Night end',
  'Morgenplan':'Morning schedule', 'Morgentid':'Morning time', 'Morgensensor':'Morning sensor', 'Alarmgjentakelse':'Alarm repeats', 'Observasjonsmodus':'Observation mode',
  'Brann- og vannsensorer':'Fire and water sensors', 'Alarmmelding':'Alarm message', 'Høyttaler':'Speaker', 'Tale eller lyd':'Speech or sound', 'Vannstenging':'Water shutoff', 'Vannstyring':'Water control',
  'Bekreftet vannstenging':'Verified water shutoff', 'Alarmenhet':'Alarm device', 'Enhet i vilkår':'Condition device', 'Funksjon i vilkår':'Condition capability',
  'Målingens maksimale alder':'Maximum measurement age', 'Bekreftelsesfrist':'Confirmation timeout', 'Lydenhet':'Audio device', 'Morgen ved bevegelse':'Wake-up by motion',
  'Morgenbevegelse fra':'Morning motion starts', 'Morgenbevegelse til':'Morning motion ends', 'Veiviser fullført':'Setup complete', 'Rutine aktiv':'Routine enabled', 'Rutine skjult':'Routine hidden',
  'Vis også i tidslinjen':'Also show in timeline', 'Gjenta kamerabilder':'Repeat camera images', 'Aktiv sensor ved tilkobling':'Active sensor when arming',
  'Automatisk natt med gjester':'Automatic night mode with guests', 'Frakobling ved gjester':'Disarm for guests', 'Opplåsing ved gjester':'Unlock for guests',
  'Enhetens verdi oppfyller ikke handlingens vilkår':'The device value does not meet the action condition', 'Personen er ikke lenger bekreftet borte':'The resident is no longer confirmed away',
  'Gjestemodus holder alarmen frakoblet':'Guest mode keeps the alarm disarmed', 'Full tilkobling krever at alle er bekreftet borte':'Full arming requires everyone confirmed away',
  'Nattalarm krever at noen er hjemme og bekreftet sovende':'Night alarm requires someone confirmed home and asleep', 'Den manuelle kommandoen er utløpt.':'The manual command expired.',
  'Opplåsing krever bekreftet frakoblet alarm':'Unlocking requires a confirmed disarmed alarm', 'Ankomsten er ikke lenger gyldig':'The arrival is no longer valid', 'Opplåsing er ikke aktivt valgt':'Unlocking is not enabled',
  'Ingen aktiv brann- eller vannalarm av denne typen.':'No active fire or water alarm of this type.', 'Inngangsforsinkelse avsluttet':'Entry delay ended',
  'Integrasjonsoppsett pågår allerede.':'Integration setup is already in progress.', 'Installer ny House Guard-versjon før koblingene opprettes':'Install the new House Guard version before creating bridges',
  'Sett appen i observasjon før integrasjonsflows endres.':'Set the app to observation mode before changing integration Flows.',
  'Oppsettet eller observasjonsmodus ble endret. Integrasjonsoppsettet er avbrutt.':'Settings or observation mode changed. Integration setup was cancelled.',
  'Mottaker mangler Homey-konto-ID; velg mottaker på nytt':'The recipient has no Homey account ID; select them again', 'Fant ikke neste morgen i valgt tidssone':'Could not find the next morning in the selected time zone',
  'Både opprinnelig og vanlig push feilet':'Both the original and normal push failed', 'Vanlig push feilet':'Normal push failed', 'Sonos-kortet feilet':'The Sonos card failed',
  'Sonos-kort utført. Hørbar avspilling er ikke bekreftet.':'Sonos card executed. Audible playback is not confirmed.', 'Spørsmålet feilet eller fikk tidsavbrudd':'The question failed or timed out',
  'sensorene melder ikke lenger alarm.':'sensors no longer report an alarm.', 'bekreftet utførelse':'execution confirmed', 'rapporterte feil':'reported failure',
  ' Fullfør oppsettet før huset styres.':' Complete setup before controlling the house.', 'på':'on', 'av':'off',
  'aktivert':'enabled', 'deaktivert':'disabled', 'full alarm':'full alarm', 'nattalarm':'night alarm', ' (observasjon)':' (observation)', ' – allerede valgt':' – already selected',
  'hjemme':'home', 'borte':'away', 'bevegelse':'motion', 'døråpning':'door opening', 'valgt morgensensor':'selected morning sensor',
  'Utgangsforsinkelse':'Exit delay', 'Portkamera':'Garage camera', 'Luxgrense':'Lux threshold', 'Luxferskhet':'Lux freshness', 'Velkomstforsinkelse':'Welcome delay',
  'Rutinenavn':'Routine name', 'Handlingsforsinkelse':'Action delay', 'Alarmsensor':'Alarm sensor', 'Kamera-ID':'Camera ID', 'Lys-ID':'Light ID',
};

// Named placeholders let us translate fixed text before inserting user values.
const TEMPLATES = {
  'Ukjent sensor: {name}':'Unknown sensor: {name}',
  '{name}: ukjent/utilgjengelig':'{name}: unknown/unavailable',
  '{name}: dør/vindu åpnet':'{name}: door/window opened',
  '{name}: garasjeport åpnet':'{name}: garage door opened',
  '{name}: bevegelse registrert':'{name}: motion detected',
  'Morgen startet ({source})':'Morning started ({source})',
  'Rutinen «{name}» har ingen valgte handlinger':'Routine “{name}” has no selected actions', 'Planlagt: {name}':'Planned: {name}',
  'Nattspørsmål avbrutt: {reason}':'Night question cancelled: {reason}', 'Automatisk natt venter: {reason}':'Automatic night mode waits: {reason}',
  'Oppsett lagret (revisjon {revision}).{suffix}':'Settings saved (revision {revision}).{suffix}',
  'House Guard: {from} → {to}. {reason}':'House Guard: {from} → {to}. {reason}',
  'Tilstanden for {name} ble ikke bekreftet':'The state of {name} was not confirmed',
  'Tidslinjekopi feilet: {error}. Push-koblingen er allerede utløst.':'Timeline copy failed: {error}. The push bridge was already triggered.',
  'Kommandoens utfall er ukjent: {error}. Leser tilbake uten å gjenta':'Command outcome unknown: {error}. Reading back without repeating',
  'Handling feilet: {error}':'Action failed: {error}', 'Varsel feilet: {error}':'Notification failed: {error}', 'Motorfeil: {error}':'Engine error: {error}',
  'Integrasjonshendelse: {type}{suffix}':'Integration event: {type}{suffix}', 'Observasjon: {kind} – {target}':'Observation: {kind} – {target}',
  'Observasjon: ville varslet «{text}»':'Observation: would notify “{text}”',
  'Levering {result}: {kind}. {detail}':'Delivery {result}: {kind}. {detail}',
  'Bro for {bridge} er ikke konfigurert':'The {bridge} bridge is not configured', 'Gjestemodus {state}':'Guest mode {state}',
  '{count} sensorer er ukjente eller utilgjengelige.':'{count} sensors are unknown or unavailable.',
  '{count} sensorer leses direkte. Kontroller sensorvalg og prøv varsling under Alarm.':'{count} sensors are read directly. Check sensor selections and test notifications under Alarm.',
  '{count} sensor-/modusvalg er deaktivert. Se Alarm → Sensorer; bruk Aktiver alarmsensor for å gjenoppta overvåkningen.':'{count} sensor/mode selections are disabled. See Alarm → Sensors; use Enable alarm sensor to resume monitoring.',
  '{count} valgte sensorer er utilgjengelige. Se Brann og vann → Sensorer.':'{count} selected sensors are unavailable. See Fire and water → Sensors.',
  '{count} sensorfunksjoner overvåkes hele døgnet.{suffix}':'{count} sensor capabilities are monitored around the clock.{suffix}',
  ' {count} har ingen alarmverdi rapportert ennå.':' {count} have no alarm value reported yet.',
  'Kontroller rapportering fra {names}. Se Brann og vann → Sensorer.':'Check reporting from {names}. See Fire and water → Sensors.',
  'Kontrollerer måleoppdateringer med {hours} timer som grense. Gammel verdi alene er ikke bevis på offline sensor.':'Checking measurement updates with a {hours}-hour threshold. An old value alone is not proof of an offline sensor.',
  'Sovestatus for {name} krever API-nøkkel under Innstillinger → API-nøkkel.':'Sleep status for {name} requires an API key under Settings → API key.',
  '{names} er fortsatt aktive. Se over dem for å unngå doble handlinger.':'{names} are still enabled. Review them to avoid duplicate actions.',
  'House Guard: {type} – sensorene melder ikke lenger alarm. {zone}':'House Guard: {type} – sensors no longer report an alarm. {zone}',
  '{type}: sensorene melder ikke lenger alarm.':'{type}: sensors no longer report an alarm.',
  '{type}: {reason} fra {name} · {zone}':'{type}: {reason} from {name} · {zone}',
  '{type}: varselet er kvittert. Sensoralarm og fysiske røykvarslere avstilles ikke.':'{type}: notification acknowledged. Sensor alarms and physical smoke alarms are not silenced.',
  '{type}: {kind} feilet eller har ukjent utfall. {detail}':'{type}: {kind} failed or has an unknown outcome. {detail}',
  'Brann og vann: Flow-hendelse feilet. {error}':'Fire and water: Flow event failed. {error}',
  'House Guard: Vannsensorene rapporterer igjen. {names}':'House Guard: Water sensors are reporting again. {names}',
  '{name} · {zone}: ingen egnet rapportert måleoppdatering.':'{name} · {zone}: no suitable measurement update reported.',
  '{name} · {zone}: {label} sist oppdatert for {hours} timer siden ({value}).':'{name} · {zone}: {label} last updated {hours} hours ago ({value}).',
  'House Guard: Kontroller vannsensorene.\n{lines}\nEn gammel måleverdi alene bekrefter ikke at sensoren er offline.':'House Guard: Check the water sensors.\n{lines}\nAn old measurement alone does not confirm that the sensor is offline.',
  'Venter på: {names}':'Waiting for: {names}', '{count} sensor(er) deaktivert fra Flow':'{count} sensor(s) disabled by Flow',
  '{field} må være av/på':'{field} must be on or off', '{field} må være tekst (maks 500 tegn)':'{field} must be text (at most 500 characters)',
  '{field} må være mellom {min} og {max}':'{field} must be between {min} and {max}', '{field} må være HH:MM':'{field} must be HH:MM',
  'Ugyldig personutvalg: {field}':'Invalid resident selection: {field}', 'Ukjent handlingstype: {kind}':'Unknown action type: {kind}',
  'Mangler varseloppsett for {type}':'Missing notification settings for {type}', '{field}: maks {count}':'{field}: at most {count}',
  'Manglende eller ugyldig felt: {error}':'Missing or invalid field: {error}',
  'Den faste rutinen «{name}» kan ikke slettes. Bruk avkrysningen for å deaktivere ekstrahandlingene.':'The built-in routine “{name}” cannot be deleted. Use the checkbox to disable extra actions.',
  'Ukjent Sonos-lyd: {name}':'Unknown Sonos sound: {name}', 'Sonos tilbyr ikke lyden «{name}»':'Sonos does not offer the sound “{name}”',
  'Kamerabilde mangler for {name}':'Camera image is missing for {name}', 'Mangler mobilkort: {card}':'Missing mobile card: {card}',
  'Homey kunne ikke bekrefte «{name}»':'Homey could not confirm “{name}”',
  'Det finnes allerede en Flow med navnet «{name}». Gi den et annet navn før automatisk oppsett.':'A Flow named “{name}” already exists. Rename it before automatic setup.',
  '{name}: {status} for {mode} fra Flow{observation}{suffix}':'{name}: {status} for {mode} by Flow{observation}{suffix}',
  'Personer: {error}':'People: {error}', 'Enheter: {error}':'Devices: {error}', 'Soner: {error}':'Zones: {error}',
  'Morgen startet ved bevegelse: {name}':'Morning started by motion: {name}',
  'Velkomstlys hoppet over: {reason}':'Welcome lights skipped: {reason}',
  'Velkomstlys: {signal} registrert. Ventetid {delay} s; første handling har {extra} s ekstra.':'Welcome lights: {signal} detected. Wait {delay} s; first action has {extra} s extra delay.',
  'Observasjon: ville satt alle {count} valgte brukere {state}':'Observation: would set all {count} selected residents {state}',
  'Alle valgte brukere er allerede {state}':'All selected residents are already {state}',
  'Tilstedeværelse ikke bekreftet for {name}':'Presence not confirmed for {name}',
  'Alle {count} valgte brukere er bekreftet {state} i Homey':'All {count} selected residents are confirmed {state} in Homey',
  'Automatisk alarm {field}':'Automatic alarm {field}', 'Gjestevalg {field}':'Guest setting {field}', 'Alarm {field}':'Alarm {field}', 'Port {field}':'Garage {field}',
  'Bro {field}':'Bridge {field}', 'Kontroll av vannsensorer {field}':'Water sensor health {field}', 'Brann {field}':'Fire {field}', 'Vann {field}':'Water {field}',
};

function language(homey) {
  let value;
  try { value = typeof homey === 'string' ? homey : homey?.i18n?.getLanguage?.(); } catch { value = ''; }
  return /^(no|nb|nn)(?:[-_]|$)/i.test(String(value || '')) ? 'no' : 'en';
}
function t(source, values = {}, homey) {
  const template = language(homey) === 'no' ? source : (EN[source] ?? TEMPLATES[source] ?? source);
  return String(template ?? '').replace(/\{([A-Za-z]\w*)\}/g, (match, key) => Object.hasOwn(values, key) ? String(values[key] ?? '') : match);
}
const COMPILED = Object.entries(TEMPLATES).map(([no, en])=>{
  const keys=[],escaped=no.split(/(\{[A-Za-z]\w*\})/).map(part=>{
    if(/^\{\w+\}$/.test(part)){keys.push(part.slice(1,-1));return '(.*?)';}
    return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  }).join('');
  return {en,keys,pattern:new RegExp('^'+escaped+'$','s')};
});
// Only use on known application-generated status/error/reason fields. Never on
// custom config strings, names or arbitrary action.text values.
function text(source, homey) {
  if (typeof source !== 'string' || language(homey) === 'no') return source;
  if (Object.hasOwn(EN, source)) return EN[source];
  for (const {en,keys,pattern} of COMPILED) {
    const match = pattern.exec(source);
    if (match) return en.replace(/\{(\w+)\}/g, (_, key) => {
      const value = match[keys.indexOf(key)+1];
      return ['reason','error','detail','label','from','to','type','suffix','field','result','state','status','mode','signal','observation'].includes(key) ? text(value, homey) : value;
    });
  }
  return source;
}
function error(value, homey) {
  const fixed=value?.code==='BUILTIN_ROUTINE_REQUIRED' && require('./config').ROUTINES[value.routineId];
  const message = value?.message ?? String(value), translated = fixed ? t('Den faste rutinen «{name}» kan ikke slettes. Bruk avkrysningen for å deaktivere ekstrahandlingene.', {name:t(fixed,{},homey)}, homey) : String(message).split('\n').map(line => text(line, homey)).join('\n');
  if (value instanceof Error && translated === value.message) return value;
  const result = new Error(translated);
  for (const key of ['code','status','statusCode','routineId']) if (value?.[key] !== undefined) result[key] = value[key];
  return result;
}
function runtimeLocale(adapter) { return adapter?.homey || 'no'; }
function actionText(action, config, routineId, homey) {
  if (!action?.builtin || action.kind === 'sound') return action?.text;
  const fixed = ['house-awake-timeline','guest-enabled','guest-disabled','guest-alone','bypassed-sensor-notice'];
  if (fixed.includes(action.id)) return t(action.text, {}, homey);
  const defaults = require('./alarm-responses').defaults()[routineId];
  if (defaults && (action.id === `response-${routineId}-push` || action.id.startsWith(`response-${routineId}-image-`)) && action.text === defaults.text) return t(action.text, {}, homey);
  if (defaults && action.id === `response-${routineId}-timeline` && action.text === defaults.timelineText) return t(action.text, {}, homey);
  return action.text;
}
function context(value, homey) {
  if (!value) return value;
  const result = {...value};
  if (typeof result.reason === 'string') result.reason = text(result.reason, homey);
  return result;
}
function actions(list, homey) {
  for (const action of list || []) for (const key of ['error','detail','reason']) if (action[key]) action[key] = text(action[key], homey);
}
function intrusion(value, homey) {
  if (!value) return value;
  const result = structuredClone(value);
  result.context = context(result.context, homey); result.faults = (result.faults || []).map(source => text(source, homey));
  return result;
}
function devicePresentation(devices, homey) {
  for (const device of Object.values(devices || {})) {
    if (device.id === 'house-guard-internal-alarm' || device.id === 'homey-weather') {
      for (const key of ['name','zone']) device[key] = text(device[key], homey);
      for (const cap of Object.values(device.capabilities || {})) cap.title = text(cap.title, homey);
    }
    if (device.id === 'house-guard-internal-alarm') device.alarmContext = context(device.alarmContext, homey);
  }
}
function projectState(value, homey) {
  const result = structuredClone(value);
  if (language(homey) === 'no') return result;
  result.language = language(homey);
  if (result.direct?.problem) result.direct.problem = text(result.direct.problem, homey);
  if (result.catalog?.direct?.problem) result.catalog.direct.problem = text(result.catalog.direct.problem, homey);
  if (result.catalog?.errors) result.catalog.errors = result.catalog.errors.map(source=>text(source,homey));
  devicePresentation(result.catalog?.devices, homey); devicePresentation(result.status?.devices, homey);
  const status = result.status;
  if (status) {
    status.reason = text(status.reason, homey); status.alarm = context(status.alarm, homey);
    for (const entry of status.history || []) {
      const builtin=require('./config').ROUTINES[entry.routineId];
      if(builtin && entry.message.startsWith('Planlagt: '))entry.message=t('Planlagt: {name}',{name:t(builtin,{},homey)},homey);
      else if(builtin && /^Rutinen «.*» har ingen valgte handlinger$/.test(entry.message))entry.message=t('Rutinen «{name}» har ingen valgte handlinger',{name:t(builtin,{},homey)},homey);
      else entry.message=text(entry.message,homey);
    }
    for (const run of status.pending || []) { run.context = context(run.context, homey); actions(run.actions, homey); }
    for (const delivery of status.deliveries || []) delivery.detail = text(delivery.detail, homey);
  }
  result.intrusion = intrusion(result.intrusion, homey);
  for (const control of Object.values(result.controls || {})) for (const option of Object.values(control.options || {})) option.reason = text(option.reason, homey);
  for (const check of result.readiness?.checks || []) {
    // Stable routine metadata distinguishes fixed labels from user supplied
    // names, even when a custom name equals a Norwegian built-in label.
    const builtin=require('./config').ROUTINES[check.routineId];
    if(builtin)check.title=t(builtin,{},homey);
    else if(!check.routineId && !check.id.startsWith('action-') && !check.id.startsWith('scene-'))check.title=text(check.title,homey);
    check.detail = text(check.detail, homey);
  }
  if (result.readiness?.integrations?.intrusion) result.readiness.integrations.intrusion = intrusion(result.readiness.integrations.intrusion, homey);
  for (const delivery of result.readiness?.deliveries || []) delivery.detail = text(delivery.detail, homey);
  const environment = result.environment;
  if (environment) {
    for (const sensor of environment.waterHealth?.sensors || []) sensor.label = text(sensor.label, homey);
    for (const batch of environment.batches || []) { batch.context = context(batch.context, homey); actions(batch.actions, homey); }
  }
  for (const [id, list] of Object.entries(result.builtins || {})) for (const action of list) action.text = actionText(action, result.config, id, homey);
  return result;
}
function projectPreview(value, homey) {
  const result = structuredClone(value);
  if (require('./config').ROUTINES[result.id]) result.name = t(require('./config').ROUTINES[result.id], {}, homey);
  result.note = text(result.note, homey); actions(result.actions, homey);
  for (const action of result.actions || []) action.text = actionText(action, null, result.id, homey);
  return result;
}
module.exports = { language, t, text, error, runtimeLocale, actionText, context, intrusion, projectState, projectPreview, EN, TEMPLATES };
