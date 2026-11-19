// Local source of truth on the phone (IndexedDB). Same tables/fields as Backend/schema.sql.
let opened: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
	return (opened ??= new Promise((res, rej) => {
		const r = indexedDB.open('hdt', 1);
		r.onupgradeneeded = () => {
			const d = r.result;
			d.createObjectStore('kv');
			d.createObjectStore('plot', { keyPath: 'id' });
			d.createObjectStore('observation', { keyPath: 'id' });
		};
		r.onsuccess = () => res(r.result);
		r.onerror = () => rej(r.error);
	}));
}
async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const d = await open();
	return new Promise((res, rej) => {
		const t = d.transaction(store, mode);
		const req = fn(t.objectStore(store));
		t.oncomplete = () => res(req.result);
		t.onerror = () => rej(t.error);
	});
}
export const db = {
	get: <T>(s: string, k: IDBValidKey) => run<T | undefined>(s, 'readonly', (o) => o.get(k)),
	all: <T>(s: string) => run<T[]>(s, 'readonly', (o) => o.getAll()),
	put: (s: string, v: unknown, k?: IDBValidKey) => run(s, 'readwrite', (o) => o.put(v, k))
};
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}${Math.random().toString(16).slice(2)}`);
