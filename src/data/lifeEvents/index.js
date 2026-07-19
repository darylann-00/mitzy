// Registry of life event types. Each def carries its bundle, phase order,
// intake config, and intake → tasks generator, so the rest of the app can
// stay generic. New events: add a def file and register it here (plus an
// icon in CategoryIcons' LIFE_EVENT_ICON_CONFIG).
import { NEW_BABY } from './newBaby';
import { DIVORCE } from './divorce';
import { LOSS_OF_LOVED_ONE } from './lossOfLovedOne';

export const LIFE_EVENT_DEFS = {
  'new-baby':          NEW_BABY,
  'divorce':           DIVORCE,
  'loss-of-loved-one': LOSS_OF_LOVED_ONE,
};

export const LIFE_EVENT_TYPES = Object.keys(LIFE_EVENT_DEFS);

export function getEventDef(type) {
  return LIFE_EVENT_DEFS[type] || null;
}
