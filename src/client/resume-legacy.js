// Only local raster photos and known text fields belong in an imported draft.
const fields = ['name', 'headline', 'email', 'phone', 'location', 'website', 'summary', 'skills', 'extra'];
const lists = { exp: ['company', 'role', 'start', 'end', 'bullets'], edu: ['school', 'degree', 'start', 'end'], proj: ['name', 'desc'] };
export function validateResume(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid resume');
  const out = {};
  for (const key of fields) {
    if (raw[key] !== undefined && (typeof raw[key] !== 'string' || raw[key].length > 100000)) throw new Error('Invalid text');
    if (raw[key] !== undefined) out[key] = raw[key];
  }
  if (raw.template !== undefined && !['classic', 'modern', 'compact'].includes(raw.template)) throw new Error('Invalid template');
  if (raw.accent !== undefined && !/^#[\da-f]{6}$/i.test(raw.accent)) throw new Error('Invalid colour');
  if (raw.photo != null && (typeof raw.photo !== 'string' || raw.photo.length > 2000000 || !/^data:image\/(?:jpeg|png|webp);base64,[\da-z+/=]+$/i.test(raw.photo))) throw new Error('Invalid photo');
  for (const key of ['template', 'accent', 'photo']) if (raw[key] !== undefined) out[key] = raw[key];
  for (const [key, names] of Object.entries(lists)) {
    if (raw[key] === undefined) continue;
    if (!Array.isArray(raw[key]) || raw[key].length > 100) throw new Error('Invalid list');
    out[key] = raw[key].map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Invalid item');
      const clean = {};
      for (const name of names) {
        if (item[name] === undefined) continue;
        if (typeof item[name] !== 'string' || item[name].length > 100000) throw new Error('Invalid item text');
        clean[name] = item[name];
      }
      return clean;
    });
  }
  return out;
}
