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

function backupWithDiscord(storeWebhook = false) {
	webhook = document.querySelector('#backup-with-discord').value;

	if (storeWebhook) {
		k.add('backupWithDiscord', webhook, k.password);
	}

	k.onSave['backupWithDiscord'] = async () => {
		const data = await k.readAll();
		fetch(webhook, {
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
	const webhook_link = await k.readEncrypted('backupWithDiscord');
	if (webhook_link) {
		document.querySelector('#backup-with-discord').value = webhook_link;
		backupWithDiscord();
	}
};
