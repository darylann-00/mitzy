export function resolveStepVars(text, context) {
  if (!text) return text;
  let result = text.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
    const val = context?.[key];
    if (!val || (Array.isArray(val) && val.length === 0)) return '';
    return content;
  });
  result = result.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, content) => {
    const val = context?.[key];
    if (!val || (Array.isArray(val) && val.length === 0)) return content;
    return '';
  });
  result = result.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, path) => {
    const val = path.split('.').reduce((o, k) => o?.[k], context);
    return val != null ? String(val) : '';
  });
  return result;
}
