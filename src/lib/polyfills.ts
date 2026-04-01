import { Buffer } from 'buffer';
import EventEmitter from 'events';

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;

  if (!window.process) {
    window.process = { env: {} } as any;
  }

  if (!(window as any).global) {
    (window as any).global = window;
  }

  if (!(globalThis as any).EventEmitter) {
    (globalThis as any).EventEmitter = EventEmitter;
  }
}
