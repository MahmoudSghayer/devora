export {submitLead, isSameOrigin} from './service';
export {envelopeSchema, type Envelope} from './schema';
export {
  createMemoryRepository,
  createSupabaseRepository,
  isMemoryRepositoryEnabled,
  resolveRepository,
  type MemoryRepository,
} from './repository';
export {generateLeadRef} from './ref';
export * from './types';
