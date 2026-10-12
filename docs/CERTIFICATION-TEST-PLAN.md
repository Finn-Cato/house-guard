# Certification test plan

This is a test protocol, not passing physical test evidence. Candidate 0.4.42 is installed and running, preserving the configuration, adding Shelly intrusion-sensor compatibility and always monitoring selected fire/water sensors after setup is complete. The previous 0.4.40 installation included a read-only API-scope check on Homey Pro firmware 13.5.1. No dispatch probe or physical end-to-end test was part of these checks. The current gap includes actual English/Norwegian Homey webview rendering and physical fire/water behavior, especially door unlocking and water shutoff.

The SDK app-client diagnostic read on installed 0.4.40 reports actual `intersectedScopes` including `homey.device.readonly`, `homey.device.control` and `homey.flow.readonly`, without `homey.flow` or `homey.flow.start`. Version 0.4.42 retains that permission and those integration paths. Derived flags show device read/control coverage, with Flow-card and Flow-start coverage absent. This is scope metadata, not a successful device-control or delivery test; no card or Flow was executed. Existing API-key integration remains in place.

## Prepare one controlled test session

1. Obtain explicit agreement for the installation, participants, selected recipients and each physical action. Have an operator on site with access to normal manual lock and water controls. Agree when to stop and how to restore the installation.
2. Record the candidate version/commit, Homey firmware, sensor/actuator models, phone OS/Homey app versions and selected alarm options. Use anonymized labels in shared reports. Keep credentials, camera URLs, personal names and house identifiers out of evidence shared publicly.
3. Back up House Guard settings and the complete existing normal/Advanced Flows, including their enabled states. Record the starting alarm, presence, door and valve states. Do not overwrite existing routines or use a clean installation.
4. Identify independent smoke/water Flows that could also notify, unlock, switch lights or close water. Isolate them **only after explicit agreement and a verified backup**, for a time-limited test. Keep the smoke detectors' own audible protection working. Restore every Flow's original enabled state after the test, including if it fails. If attribution cannot be isolated safely, postpone the physical test rather than claiming House Guard caused the effect.
5. Test the candidate in English and Norwegian. Check setup, routine/Flow names, errors and notification text in Homey's actual webview; this visual check is pending. The installed app-session scope diagnostic has already been read from the SDK app client as described above. It reads scopes only, never starts a card or Flow; a result from an owner's CLI session would not establish the app's permission. Do not replace the API key based on scope metadata alone.
6. Verify phone delivery with the app's explicit normal, critical and camera test buttons. Confirm receipt on **each selected phone**, actual image content and critical-alert behavior with the intended phone settings. These buttons do not test a sensor or actuator.

## Test each selected sensor and response

For each sensor, record the physical stimulus, Homey capability/value and timestamp, House Guard incident ID, notification/action timestamps and actual outcomes. Begin with optional physical actions off; enable only the agreed actions for the corresponding test. No real sensor event should be introduced while an unintended action remains selected.

| Test | Required passing evidence |
| --- | --- |
| Water detection | Use the sensor manufacturer's supported contact/water test. Capture the actual `alarm_water=true` event and matching House Guard water incident. Confirm correct sensor/room and receipt on every selected phone. Dry/reset using the manufacturer's instructions and capture the reported recovery. |
| Smoke/fire/heat detection | Use only a manufacturer-approved test procedure for the exact sensor model, with qualified assistance if required. Do not improvise smoke, flames or heat. Capture the actual supported alarm capability becoming true and the matching incident, phones and selected actions. |
| Detector test-button behavior | Record whether the test button produces `test_mode`, a real smoke/fire/heat alarm value, or both. `test_mode` alone must not unlock doors or trigger fire actions. A test that only produces `test_mode` does **not** complete the real fire-event test. If the manufacturer provides no suitable supported test, record the limitation and leave the physical release gate unresolved. |
| Critical and image alerts | Trigger a real approved sensor test with the agreed profile. Confirm every selected phone receives the critical text when configured, then the expected images from each selected camera. Capture time to text/image separately; API acceptance alone is insufficient. |
| Water shutoff | Verify the selected device's OFF command is the approved close operation. During a water event, record one accepted OFF command, Homey's device readback, **actual closed valve** and the agreed mechanical check that the water supply is closed. Electrical OFF alone does not prove closure. |
| Fire door unlocking | Start with the agreed door locked and physical access available. An approved actual fire-capability event must cause the selected lock command, Homey's unlocked readback and **physical confirmation the intended lock is unlocked**. Test-button-only mode must not unlock it. |
| Lights, Sonos and selected Flow | Confirm the agreed light state physically, hear the configured announcement/sound, and verify the intended Flow's own outcome. Attribute each action to one incident; no physical action should repeat on additional same-incident sensor reports. |
| Recovery and acknowledgement | Confirm acknowledgement stops optional repeated House Guard alerts without silencing a physical detector or clearing a still-active sensor incident. Recovery requires all triggering sensors to report false. Water must **not** reopen automatically. |

A software-injected event or stub can test application logic separately. Label it **simulated**; it is not proof of a physical sensor path or mechanical outcome. If an independent Flow caused the action, it does not prove House Guard's direct action worked.

## Failure and recovery checks

Run these only in the agreed controlled setup; use a test device/environment for disruptive cases when practical.

| Scenario | Expected result and evidence |
| --- | --- |
| Unavailable sensor or unknown value | No false “clear” for an active incident. A new water sensor with no first alarm report is not labelled a proven leak or a proven dry state. |
| One recipient or camera fails | Other recipients/cameras are attempted; failed/unknown delivery is visible. Slow images do not delay the next text alert or water action. Record actual delivery separately from accepted calls. |
| Lock/relay readback missing | Outcome becomes unknown without automatic command repetition. Do not treat command acceptance or elapsed time as mechanical success. |
| API access denied/disconnected | Show a useful delivery failure and preserve incident state. No automatic helper-Flow fallback or duplicate dispatch. Never publish the key while collecting diagnostics. |
| Restart during an incident | Preserve the incident until fresh status arrives; do not repeat completed unlock, valve, light, audio or Flow commands. Observe the documented resume-notice behavior separately from physical actions. |
| Home/away/night/guest changes | Fire and water monitoring remains independent of household and intrusion modes. Perform mode changes only with explicit agreement; do not accidentally arm an occupied test area. |
| Selected-sensor monitoring | No master off switch is available. Selected sensors are monitored automatically after setup; old off settings cannot disable them. Confirm this without introducing an unintended live sensor event or actuator action. Removing all selections must not auto-select other sensors. |

## Record and release gate

Use one row per sensor/profile/recipient combination. Keep detailed evidence private; share a redacted summary with the reviewer.

| Candidate | Test/model label | Physical stimulus and sensor event | Incident/call evidence | Phone receipt | Mechanical outcome | Result / limitation |
| --- | --- | --- | --- | --- | --- | --- |
| To be recorded | To be recorded | Pending | Pending | Pending | Pending where applicable | Not yet verified |

Restore backed-up settings and all independent Flow enabled states, check that no test incident or pending action remains, and verify normal protection. After a water test, clear the cause and **reopen water manually only when the operator confirms it is appropriate**; House Guard does not reopen it. Restore the agreed door state manually and confirm it physically.

Before resubmission, verify and record that automatic release is disabled in Homey's developer dashboard. This has not yet been checked. Hold manual release until required sensor-to-phone and physical-action tests pass on the actual candidate, with failures resolved and a fresh regression run. Individual old phone tests, local unit tests and an accepted API call are not substitutes for this evidence.
