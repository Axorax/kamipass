k.addSetting(
	{
		title: 'Create file',
		group: 'decrypt-passwords',
		id: 'decrypt-passwords',
		element: 'button',
        buttonText: "Decrypt",
        type: "danger"
	},
	() => {
		decryptPasswords();
	}
);

async function decryptPasswords() {
	const filePath = await path.join(k.basePath, "decrypted.txt");
	const passwords = await k.readEncrypted('passwords');

	await fs.writeFile({
		path: filePath,
		contents: passwords
	});
}
