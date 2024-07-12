const i = {
	pluginStoreLoaded: false
};

// Change password

i['changePassword'] = () => {
	const r = k.changePassword(document.querySelector('#old-password').value, document.querySelector('#new-password').value);
	const e = document.querySelector('#password-change-error');
	e.style.display = 'block';

	if (r[0] == true) {
		e.classList.remove('danger');
		e.classList.add('primary');
		e.innerText = 'New password set!';
	} else {
		e.innerText = r[1];
	}
};

// Create password

i['setPassword'] = () => {
	const r = k.setPassword(s.modal.createInput.value);
	if (r[0] == true) {
		document.querySelector('.subtab.config').classList.add('loggedIn');

		s.modal.create.remove();
		k.generateSheet();
	} else {
		try {
			s.modal.createDiv.querySelector('.note.danger').remove();
		} catch (e) {}

		s.modal.createDiv.innerHTML += `<div class="note danger" style="margin-top:1rem;">${r[1]}</div>`;
		s.modal.createInput.value = v;
	}
};

// Notes

let notesTimeout;

s.notes.addEventListener('input', function () {
	document.querySelector('#notes-notifier').innerText = '•';

	try {
		clearTimeout(notesTimeout);
	} catch (e) {}

	notesTimeout = setTimeout(function () {
		k.saveNotes();
	}, k.notesDelay);
});

// Generate

i['generatePassword'] = () => {
	return (document.querySelector('.subtab.password .output').value = k.generatePassword());
};

i['copyGeneratedPassword'] = (e) => {
	const x = document.querySelector('#password-input').value;
	if (k.clearSpaces(x) == '') {
		e.innerText = '❌ Nothing to copy!';
		setTimeout(() => {
			e.innerText = 'Copy';
		}, 2000);
		return;
	} else {
		k.copy(x);
		e.innerText = '✅ Copied!';
		setTimeout(() => {
			e.innerText = 'Copy';
		}, 2000);
	}
};

i['uninstallPlugin'] = (n, e) => {
	k.uninstallPlugin(n);
	e.classList.remove('danger');
	e.classList.add('primary');
	e.innerText = 'Install';
	e.onclick = null;
	e.onclick = () => {
		i.installPlugin(n, e);
	};
};

i['installPlugin'] = (n, e) => {
	k.installPlugin(n);
	e.classList.remove('primary');
	e.classList.add('danger');
	e.innerText = 'Uninstall';
	e.onclick = null;
	e.onclick = () => {
		i.uninstallPlugin(n, e);
	};
};

i['loadPluginStore'] = async () => {
	if (i.pluginStoreLoaded) {
		return;
	}

	try {
		i.pluginStoreLoaded = true;
		const plugins = await k.getFromURL(k.pluginStoreURL);
		plugins.forEach((e) => {
			document.querySelector('.card-wrapper').innerHTML += `
			<div class="card">
				<h2>${e[0]}</h2>
				<p>${e[1]}</p>
				${k.installedPlugins.includes(e[0].toLowerCase().replaceAll(' ', '-')) ? `<button class="danger" onclick="i.uninstallPlugin('${e[0]}', this);">Uninstall</button>` : `<button class="primary" onclick="i.installPlugin('${e[0]}', this);">Install</button>`}
			</div>
			`;
		});
	} catch (_) {}
};

// Main process

(async () => {
	k.basePath = await path.resolve('.');
	k.filePath = await path.join(k.basePath, k.file);
	k.pluginsPath = await path.join(k.basePath, k.pluginsFolder);
	k.makeAdvancedEditor(s.notes);

	if (await fs.exists(k.pluginsPath)) {
		for (const file of await fs.readDir(k.pluginsPath)) {
			const content = await fs.readTextFile(await path.join(k.pluginsPath, file.name));
			eval(content);
			k.installedPlugins.push(file.name.toLowerCase().replace(/\.[^/.]+$/, ''));
		}
	}

	if (await fs.exists(k.filePath)) {
		const data = JSON.parse(await fs.readTextFile(k.filePath));

		if ('verification' in data) {
			s.modal.login.style.display = 'flex';
			s.modal.login.classList.add('active');
			s.modal.login.querySelector('button.primary').onclick = () => {
				login(data);
			};
			s.modal.login.querySelector('input').focus();
			s.modal.login.querySelector('input').onkeydown = (event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
					login(data);
				}
			};
		}
	} else {
		s.modal.create.style.display = 'flex';
		s.modal.create.classList.add('active');
		s.modal.createInput.focus();
	}
})();

function login(data) {
	// Login failed
	try {
		if (k.decrypt(data['verification'], s.modal.loginInput.value) != k.verification) {
			return (document.querySelector('.modal.login .note').style.display = 'block');
		}
	} catch (e) {
		return (document.querySelector('.modal.login .note').style.display = 'block');
	}

	// Login success
	k['verificationEncrypted'] = data['verification'];
	k.password = s.modal.loginInput.value;
	s.modal.login.remove();

	if ('sheetsDelay' in data) {
		k.sheetsDelay = data['sheetsDelay'];
		document.querySelector('#save-sheets-time').value = data['sheetsDelay'];
	}

	if ('notesDelay' in data) {
		k.notesDelay = data['notesDelay'];
		document.querySelector('#save-notes-time').value = data['notesDelay'];
	}

	if ('notes' in data) {
		if ('encryptNotes' in data && !data['encryptNotes']) {
			document.querySelector('#encrypt-notes-toggle').checked = false;
			s.notes.innerText = data['notes'];
			k.encryptNotes = false;
		} else {
			k.encryptNotes = true;
			s.notes.innerText = k.decrypt(data['notes'], s.modal.loginInput.value);
		}
	}

	if ('passwords' in data && data['passwords'].replaceAll(' ', '') !== '') {
		k.generateSheetFromData(k.decrypt(data['passwords'], s.modal.loginInput.value));
	} else {
		k.generateSheet();
	}

	if ('passwordsUseMono' in data && !data['passwordsUseMono']) {
		document.querySelector('#passwords-use-mono').checked = false;
		s.tab.passwords.classList.add('no-mono');
	}

	if (Object.keys(k.onLogin).length != 0) {
		Object.values(k.onLogin).forEach((code) => {
			code();
		});
	}

	document.querySelector('.subtab.config').classList.add('loggedIn');

	// Check for unsaved passwords and save them
	let checkerTimeout;
	let saveTimeout;

	new MutationObserver((mutationsList, _) => {
		clearTimeout(checkerTimeout);
		checkerTimeout = setTimeout(() => {
			mutationsList.forEach((mutation) => {
				if ((mutation.type === 'childList' || mutation.type === 'characterData')) {
					document.querySelector('#passwords-notifier').innerText = '•';
					try {
						clearTimeout(saveTimeout);
					} catch (e) {}
					saveTimeout = setTimeout(() => {
						k.saveSheet();
					}, k.sheetsDelay);
				}
			});
		}, 500);
	}).observe(s.tab.passwords, {
		childList: true,
		subtree: true,
		characterData: true
	});
}

// Settings

k.addSetting({
	title: 'Encrypt notes',
	group: 'notes',
	id: 'encrypt-notes-toggle',
	inline: 'k.toggleNotesEncryption()',
	element: 'toggle'
});

k.addSetting({
	title: 'Auto-save delay',
	group: 'notes',
	id: 'save-notes-time',
	inline: 'k.setNotesDelayTime(this.value)',
	element: 'input',
	placeholder: 'In milliseconds',
	numberOnly: true,
	value: '2000'
});

k.addSetting({
	title: 'Use monospace font',
	group: 'passwords',
	id: 'passwords-use-mono',
	inline: 'k.togglePasswordsUseMono()',
	element: 'toggle'
});

k.addSetting({
	title: 'Auto-save delay',
	group: 'passwords',
	id: 'save-sheets-time',
	inline: 'k.setSheetsDelayTime(this.value)',
	element: 'input',
	placeholder: 'In milliseconds',
	numberOnly: true,
	value: '2000'
});

k.addSetting({
	title: 'Clear all passwords',
	group: 'passwords',
	element: 'button',
	type: 'danger',
	buttonText: 'Clear',
	inline: 'k.clearAllPasswords()'
});

k.addSetting({
	title: 'New password',
	group: 'change-password',
	element: 'input',
	id: 'new-password',
	placeholder: 'New password'
});

k.addSetting({
	title: 'Old password',
	group: 'change-password',
	element: 'input',
	id: 'old-password',
	placeholder: 'Old password'
});

k.addSetting({
	title: 'Confirm change',
	group: 'change-password',
	element: 'button',
	id: 'old-password',
	buttonText: 'Confirm',
	inline: 'i.changePassword()'
});

k.addSetting({
	title: '',
	group: 'change-password',
	id: 'password-change-error',
	type: '',
	element: 'note',
	style: 'display: none; margin-top: 1rem;'
});

k.addSetting({
	title: 'Data will be gone forever',
	group: 'erase-all-data',
	element: 'button',
	type: 'danger',
	buttonText: 'Clear',
	inline: 'k.erase()',
	loginOnly: false
});

// Keyboard shortcuts

setTimeout(() => {
	k.addShortcut(
		{
			keys: 'ctrl + s',
			title: ['Manual save', 'Change subtab'],
			group: ['passwords-and-notes', 'global']
		},
		() => {
			if (k.password != null) {
				if (k.tab == 'passwords') {
					return k.saveSheet();
				} else if (k.tab == 'notes') {
					k.saveNotes();
				}
			}

			const btns = document.querySelectorAll('.tab.' + k.tab + ' .subtab-group button');
			const active = document.querySelector('.tab.' + k.tab + ' .subtab-group .active');

			if (active) {
				let next;
				for (let i = 0; i < btns.length; i++) {
					if (btns[i] === active) {
						next = btns[(i + 1) % btns.length];
						break;
					}
				}

				if (next) {
					next.click();
				}
			}
		}
	);
}, 1000);

k.addShortcut(
	{
		keys: 'ctrl + t',
		title: 'Change tab',
		group: 'global'
	},
	() => {
		const btns = s.tabGroup.querySelectorAll('button');
		let next;

		for (let i = 0; i < btns.length; i++) {
			if (btns[i] === s.tabGroup.querySelector('.active')) {
				next = btns[(i + 1) % btns.length];
				break;
			}
		}

		if (next) {
			next.click();
		}
	}
);

k.addShortcut(
	{
		keys: 'ctrl + f',
		title: 'Search',
		group: 'passwords-and-notes'
	},
	() => {
		if (s.search.main.classList.contains('active')) {
			s.search.main.classList.remove('active');
		} else {
			s.search.main.classList.add('active');
			s.search.input.focus();
		}
	}
);

k.addShortcut(
	{
		keys: 'ctrl + u',
		title: 'Unfocus',
		group: 'global'
	},
	() => {
		document.activeElement.blur();
	}
);

k.addShortcut(
	{
		keys: 'ctrl + g',
		title: 'Generate & paste password',
		group: 'global'
	},
	(e) => {
		if (!e.shiftKey) {
			k.generateAndPastePassword();
		}
	}
);

k.addShortcut(
	{
		keys: 'ctrl + shift + g',
		title: 'Generate, paste & copy password',
		group: 'global'
	},
	() => {
		const pass = k.generateAndPastePassword();

		if (pass != false) {
			k.copy(pass);
		}
	}
);

k.addShortcut(
	{
		keys: 'ctrl + r',
		title: 'Reload',
		group: 'global'
	},
	() => {
		window.location.reload();
	}
);

k.addShortcut(
	{
		keys: 'spacebar',
		title: ['New password (rapidly)', 'New QR code'],
		group: 'generate',
		preventDefault: false
	},
	() => {
		if (k.tab == 'generate' && k.subtab == 'password') {
			i.generatePassword();
		} else if (k.tab == 'generate' && k.subtab == 'qr') {
			k.generateQR();
		}
	}
);

k.addShortcut(
	{
		keys: 'delete',
		title: 'Delete QR code image',
		group: 'generate',
		preventDefault: false
	},
	() => {
		if (k.tab == 'generate' && k.subtab == 'qr') {
			document.querySelector('#qr-box').innerHTML = '<div id="img"></div>';
		}
	}
);
