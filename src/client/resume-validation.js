const record = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.length <= 100000;
const strings = (value) => record(value) && Object.values(value).every(text);
const image = (value) => typeof value === 'string' && value.length <= 8000000 && /^data:image\/(?:jpeg|png|webp);base64,[\da-z+/=]+$/i.test(value);
const optionalText = (value, keys) => keys.every((key) => value[key] === undefined || text(value[key]));

export function validDocument(document) {
  if (!optionalText(document, ['id', 'name', 'tpl']) || !Array.isArray(document.modules) || document.modules.length > 100) return false;
  if (document.style !== undefined) {
    const style = document.style;
    if (!record(style)) return false;
    if (style.color != null && (typeof style.color !== 'string' || !/^#[\da-f]{6}$/i.test(style.color))) return false;
    if (style.font != null && (typeof style.font !== 'string' || !/^[a-z\d-]{1,40}$/i.test(style.font))) return false;
    for (const key of ['fs', 'lh', 'mg', 'gap', 'egap']) if (style[key] !== undefined && (!Number.isFinite(style[key]) || style[key] < 0 || style[key] > 200)) return false;
    for (const key of ['fit', 'photoOn']) if (style[key] !== undefined && typeof style[key] !== 'boolean') return false;
  }
  if (document.photo != null && (!record(document.photo) || !image(document.photo.src) || (document.photo.orig !== undefined && !image(document.photo.orig)) || !['circle', 'square', 'portrait'].includes(document.photo.shape))) return false;
  return document.modules.every((module) => {
    if (!record(module) || !optionalText(module, ['id', 'type', 'kind', 'title', 'text'])) return false;
    if (module.hidden !== undefined && typeof module.hidden !== 'boolean') return false;
    if (module.d !== undefined && !strings(module.d)) return false;
    if (module.entries !== undefined && (!Array.isArray(module.entries) || module.entries.length > 100 || !module.entries.every(strings))) return false;
    if (module.items !== undefined && (!Array.isArray(module.items) || module.items.length > 100 || !module.items.every((item) => record(item) && optionalText(item, ['id', 't', 'd']) && (item.lv === undefined || (Number.isFinite(item.lv) && item.lv >= 0 && item.lv <= 100))))) return false;
    return true;
  });
}
