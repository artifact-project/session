const globalThis = Function('return this')() as Window;
const {
	location,
	document,
	setTimeout,
	sessionStorage,
} = globalThis;

const ID = uid(); // уникальный идетификатор сессии (tab id)
const SID = initSID(); // сквозной идентификатор сессии
const SYNC_REQ_TYPE = 'sync:req';
const SYNC_DATA_TYPE = 'sync:data';

let sessionData = {} as object;
let sessionSnapshots = [] as object[];

const storage:Storage = {
	get length() {
		return Object.keys(sessionData).length;
	},

	key(idx: number): string {
		return Object.keys(sessionData)[idx];
	},

	setItem(key: string, value: any) {
		sessionData[key] = value + '';
	},

	getItem(key: string): string {
		return sessionData[key];
	},

	clear() {
		sessionData = {};
	},

	removeItem(key: string) {
		delete sessionData[key];
	},
}

export function getSessionStorage() {
	return readyPromise;
}

// Initialization
const readyPromise = new Promise<Storage>((resolve, reject) => {
	const handleMessage = ({data, source}: MessageEvent) => {
		if (source && data) {
			if (data.sid === SID && data.type === SYNC_REQ_TYPE) {
				// Запрос на синхронизацию
				const ready = () => {
					source.postMessage({
						id: data.id,
						type: SYNC_DATA_TYPE,
						sessionData,
						sessionSnapshots,
					}, '*' as any);
				};

				readyPromise.then(ready, ready);
			} else if (data.id === ID && data.type === SYNC_DATA_TYPE) {
				// Результат запроса на синхронизацию
				resolveReady(data.sessionData, data.sessionSnapshots);
			}
		}
	};

	// Подписываемся на `message` для синхранизации
	globalThis.addEventListener('message', handleMessage);

	// На `beforeunload` сохраняем все `snapshots`
	globalThis.addEventListener('beforeunload', () => {
		try {
			sessionSnapshots.push
			sessionStorage.setItem(SID, JSON.stringify(sessionSnapshots));
		} catch (_) {}
	});

	// Если синхронизация затянулась, резолвимся
	setTimeout(resolveReady, 1000, null, null, new Error('timeout'));

	// Пытаемся синхронизировать данные
	try {
		// Пробуем отправить сигнал в `opener`
		globalThis.opener.postMessage({sid: SID, id: ID, type: SYNC_REQ_TYPE}, '*');
	} catch (_) {
		// Возможно мы открылись в текущей вкладке, так что попытаемся
		// прочесть `snapshots` из sessionStorage, которые были записаны по `beforeunload`
		try {
			const snapshots = JSON.parse(sessionStorage.getItem(SID)!);
			resolveReady(null, snapshots);
			sessionStorage.removeItem(SID);
		} catch (_) {
			resolveReady();
		}
	}

	function resolveReady(data?: object | null, snapshots?: object[] | null, err?: Error) {
		if (data) {
			delete data[SID];

			for (const key in data) {
				if (data.hasOwnProperty(key)) {
					sessionStorage.setItem(key, data[key]);
				}
			}
		}

		if (snapshots) {
			sessionSnapshots = snapshots;
		}

		err && reject(err);
		resolve(sessionStorage);
	}
});

function initSID(): string {
	let sid = uid();
	const parsedCookie = document.cookie.match(/(?:^|;|\s)__[0-9a-z]{6,}__=@\;/);

	if (parsedCookie) {
		sid = parsedCookie[1];
	} else {
		document.cookie = `${sid}=@; path=/; domain=${location.host.split('.').slice(1).join('.')};`;
	}

	return sid;
}

function uid() {
	return `__${Math.round(Math.random() * Date.now()).toString(36)}__`;
}