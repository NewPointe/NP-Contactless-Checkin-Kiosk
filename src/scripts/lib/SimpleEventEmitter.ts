type StringKey<T> = keyof T & string;

/**
 * A simple event.
 */
export interface SimpleEvent<T extends string = string, U = unknown> {
    /**
     * The name of the event.
     */
    name: T;

    /**
     * The data of the event.
     */
    data: U;
}

/**
 * A simple event handler.
 */
export type SimpleEventHandler<T extends string = string, U = unknown> = (event: SimpleEvent<T, U>) => void;

/**
 * An simple event emitter.
 */
export class SimpleEventEmitter<EventDataMap = { [key: string]: unknown }> {
    /**
     * The event handlers.
     */
    public readonly handlers = new Map<string, Set<SimpleEventHandler<any, any>>>();

    /**
     * Registers an event handler.
     * @param event The name of the event.
     * @param handler The event handler.
     */
    public on<TKey extends StringKey<EventDataMap>>(event: TKey, handler: SimpleEventHandler<TKey, EventDataMap[TKey]>): void {
        const handlers = this.handlers.get(event);
        if (handlers) handlers.add(handler);
        else this.handlers.set(event, new Set([handler]));
    }

    /**
     * Unregisters an event handler.
     * @param event The name of the event.
     * @param handler A reference to the event handler.
     */
    public off<TKey extends StringKey<EventDataMap>>(event: TKey, handler: SimpleEventHandler<TKey, EventDataMap[TKey]>): void {
        const handlers = this.handlers.get(event);
        if (handlers) handlers.delete(handler);
    }

    /**
     * Emits an event to all registered handlers
     * @param event The name of the event.
     * @param data The data to send to each handler.
     */
    public emit<TKey extends StringKey<EventDataMap>>(name: TKey, data: EventDataMap[TKey]): void {
        const handlers = this.handlers.get(name);
        if (handlers) handlers.forEach(h => h({ name, data }));
    }
}
