import { LISTENER } from '../../../containers/Toast';
import EventEmitter from './events';

export const showToast = (message: string, time?: number): void => EventEmitter.emit(LISTENER, { message, time });
