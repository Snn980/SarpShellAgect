/**
 * @file models.js — Desteklenen Claude modelleri
 */

/**
 * @typedef {Object} ModelOption
 * @property {string} id
 * @property {string} label
 * @property {boolean} free
 */

/** @type {readonly ModelOption[]} */
export const MODELS = Object.freeze([
  { id: 'claude-haiku-4-5-20251001',  label: 'Haiku 4.5  (Hızlı / Ücretsiz)', free: true  },
  { id: 'claude-sonnet-4-20250514',   label: 'Sonnet 4   (Dengeli)',           free: false },
]);

export const DEFAULT_MODEL_ID = MODELS[0].id;
