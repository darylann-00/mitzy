export function resolveStepVars(text, context) {
  if (!text) return text;
  return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (match, path) => {
    const val = path.split('.').reduce((o, k) => o?.[k], context);
    return val != null ? String(val) : '';
  });
}
