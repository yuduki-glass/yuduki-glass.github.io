/**
 * Staging candidate for CWL Slim Test. Reads one committed OBS104 checkpoint.
 * Returns a public projection for a separate publisher.
 */
function catWebReadCommittedPositionFeed_() {
  const props = PropertiesService.getScriptProperties();
  const key = CAT_OBS104_CFG.pointer;
  const pointer = props.getProperty(key);
  if (!pointer) return null;

  const ref = JSON.parse(pointer);
  if (!ref.fileId || !ref.observationKey || !ref.checkpointSha256) return null;
  const slot = catObs104Read_(DriveApp.getFileById(ref.fileId));
  if (slot.fileId !== ref.fileId ||
      slot.record.observationKey !== ref.observationKey ||
      slot.record.checkpointSha256 !== ref.checkpointSha256 ||
      props.getProperty(key) !== pointer) return null;

  return catWebProjectPositions_(slot, Date.now());
}

function catWebProjectPositions_(slot, now) {
  const observed = Date.parse(slot.record.observationKey);
  const expires = observed + 65 * 60 * 1000;
  const entries = slot.record.event?.entries;
  const world = slot.checkpoint.state?.world?.cats;
  if (!Array.isArray(entries) || !world || !Number.isFinite(observed) ||
      !Number.isFinite(now) || now < observed || now >= expires) return null;

  const appearanceIds = CAT_OBS4_CFG.ids;
  const counts = { ALLEY: 0, LOT: 0 };
  const cats = [];
  appearanceIds.forEach((sourceId, index) => {
    if (index >= 3) return;
    const entry = entries.find(item => item.id === sourceId);
    if (!entry?.selected || entry.simulatedVisible !== true) return;
    const zone = entry.observedZone;
    if ((zone !== 'ALLEY' && zone !== 'LOT') || world[sourceId]?.location !== zone) return;

    // Approximate ground positions, offset to keep cats in the same area distinct.
    const offset = counts[zone]++;
    const x = zone === 'ALLEY' ? 0.57 + offset * 0.055 : 0.45 + offset * 0.035;
    const y = zone === 'ALLEY' ? 0.76 - offset * 0.035 : 0.665 - offset * 0.008;
    cats.push({
      id: String(index + 1).padStart(2, '0'),
      visible: true, x, y, facing: -1, action: 'still', layer: 'street',
    });
  });

  return {
    version: 1,
    observedAt: new Date(observed).toISOString(),
    validUntil: new Date(expires).toISOString(),
    cats,
  };
}
