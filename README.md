@artifact-project/session
-------------------------


```sh
npm i --save-dev @artifact-project/session
```

1. sessionStorage — для текущей вкладки в рамках домена, но он может быть недоступен из-за политики безопасности
2. SharedWorker — поддердка браузерами, проблема как передать URL на него
3. cookie — проблема доступа с другого домена


### Usage

```ts
import { getSessionStorage, getSessionSnapshots } from '@artifact-project/session';

getSessionStorage().then((session) => {
	console.log(getSessionSnapshots());
	// [
	// 	{
	// 		url: 'http://artifact-project.github.io/session/',
	// 		values: {
	// 			experiments: '',
	// 		},
	// 	},
	// 	{
	// 		url: 'http://artifact-project.github.io/session/login.html',
	// 		values: {
	// 			experiments: 'new-login',
	// 		},
	// 	},
	// ];

	session.setItem(
		'experiments',
		['recaptcha'].concat(session.getItem('experiments')).join(','),
	);
	// 'new-login,experiments'
});
```