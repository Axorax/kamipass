k.addSetting(
	{
		title: 'Discord webhook URL',
		group: 'backup-with-discord',
		id: 'backup-with-discord',
		element: 'input',
		placeholder: 'Discord webhook URL'
	},
	() => {
		backupWithDiscord(true);
	}
);

function backupWithDiscord(x = false) {
	v = document.querySelector('#backup-with-discord').value;

	if (x) {
		k.add('backupWithDiscord', v, k.password);
	}

	k.onSave['backupWithDiscord'] = async () => {
		const data = await k.readAll();
		fetch(v, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				embeds: [
					{
						title: 'kamipass',
						description: '```json\n' + JSON.stringify(data, null, 4) + '\n```',
						footer: {
							text: 'Plugin • Backup with Discord'
						},
						color: 5814783
					}
				]
			})
		});
	};
}

k.onLogin['backupWithDiscord'] = async () => {
	const v = await k.readEncrypted('backupWithDiscord');
	if (v) {
		document.querySelector('#backup-with-discord').value = v;
		backupWithDiscord();
	}
};
