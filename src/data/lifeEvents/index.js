// Registry of life event types. v1 ships only new-baby; future events register
// themselves here so the rest of the app can stay generic.
import { NEW_BABY } from './newBaby';

export const LIFE_EVENT_DEFS = {
  'new-baby': NEW_BABY,
};

export const LIFE_EVENT_TYPES = Object.keys(LIFE_EVENT_DEFS);

export function getEventDef(type) {
  return LIFE_EVENT_DEFS[type] || null;
}
