(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HouseGuardEnvironmentModel = factory();
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const t = (source, values = []) => typeof HouseGuardI18n === 'undefined' ? String(source).replace(/\{(\d+)\}/g, (_, index) => String(values[index] ?? '')) : HouseGuardI18n.t(source, values);
  const locale = () => typeof HouseGuardI18n === 'undefined' ? 'nb-NO' : HouseGuardI18n.locale;

  function kind(capability) {
    if (/^alarm_water(?:\.[\w-]+)?$/.test(capability)) return 'water';
    if (/^alarm_(?:smoke|fire|heat)(?:\.[\w-]+)?$/.test(capability)) return 'fire';
    return null;
  }
  const key = sensor => JSON.stringify([sensor.deviceId, sensor.capability]);
  function reason(capability) {
    return capability?.startsWith('alarm_water') ? t("Vannalarm") : capability?.startsWith('alarm_heat') ? t("Varmealarm") : capability?.startsWith('alarm_fire') ? t("Brannalarm") : t("Røykalarm");
  }
  function discover(catalog, selected = [], readings = []) {
    const choices = new Map(), live = new Map(readings.map(sensor => [key(sensor), sensor]));
    for (const device of Object.values(catalog.devices || {})) {
      for (const [capability, cap] of Object.entries(device.capabilities || {})) {
        if (!kind(capability) || cap.getable === false || (cap.type && cap.type !== 'boolean')) continue;
        const sensor = { deviceId: device.id, capability }, reading = live.get(key(sensor));
        choices.set(key(sensor), { ...sensor, kind: kind(capability), name: device.name, zone: device.zone || t("Uten rom"),
          available: reading?.available ?? device.available !== false, value: reading ? reading.value : cap.value,
          temperature: reading ? reading.temperature : device.capabilities.measure_temperature?.value ?? null,
          battery: reading ? reading.battery : device.capabilities.measure_battery?.value ?? null,
        });
      }
    }
    for (const sensor of selected) if (!choices.has(key(sensor))) choices.set(key(sensor), {
      ...sensor, kind: kind(sensor.capability), name: catalog.devices?.[sensor.deviceId]?.name || t("Sensor mangler"),
      zone: catalog.devices?.[sensor.deviceId]?.zone || t("Uten rom"), available: false, value: null, temperature: null, battery: null,
    });
    return [...choices.values()].map(sensor => ({ ...sensor, selected: selected.some(item => key(item) === key(sensor)) }))
      .sort((a, b) => (a.zone + a.name).localeCompare(b.zone + b.name, locale()));
  }
  function label(sensor) {
    if (sensor.available === false) return t("Utilgjengelig");
    if (sensor.value === true) return reason(sensor.capability);
    if (sensor.value === false) return t("Ingen alarm");
    return sensor.kind === 'water' ? t("Ingen vannalarm rapportert ennå") : t("Ingen alarmverdi rapportert ennå");
  }
  return { kind, key, reason, discover, label };
});
