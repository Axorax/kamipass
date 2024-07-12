const { fs, path } = window.__TAURI__;
const { invoke } = window.__TAURI__.tauri;

const db = {
	settings: {}
};

// Selectors

const s = {
	modal: {
		create: document.querySelector('.modal.create'),
		login: document.querySelector('.modal.login'),
		createInput: document.querySelector('.modal.create input'),
		loginInput: document.querySelector('.modal.login input'),
		createDiv: document.querySelector('.modal.create > div'),
		loginDiv: document.querySelector('.modal.login > div')
	},
	search: {
		main: document.querySelector('.search'),
		back: document.querySelector('.search .back'),
		next: document.querySelector('.search .next'),
		results: document.querySelector('.search p'),
		input: document.querySelector('.search > input')
	},
	qr: {
		box: document.querySelector('#qr-box')
	},
	tab: {
		passwords: document.querySelector('.tab.passwords'),
		slider: document.querySelector('.tab-group .slider')
	},
	subtab: {
		shortcuts: document.querySelector('.subtab.shortcuts')
	},
	notes: document.querySelector('.notes-editor'),
	tabGroup: document.querySelector('.tab-group')
};

// Main API

let k = {
	tab: 'passwords',
	subtab: '',
	file: 'kamipass.json',
	pluginsFolder: 'kamipass-plugins',
	pluginStoreURL: 'https://raw.githubusercontent.com/Axorax/kamipass/main/plugins/index.json',
	encryptNotes: true,
	password: null,
	notesDelay: 2000,
	sheetsDelay: 2000,
	verification: 'KAMIPASS_VALID',
	filePath: null,
	pluginsPath: null,
	basePath: null,
	installedPlugins: [],
	rows: 0,
	cols: 0,
	colCount: 0,
	onSave: {},
	onLogin: {}
};

// Utility

k['getFromURL'] = async (url) => {
	try {
		const response = await invoke('get_data', { url });
		return response;
	} catch (error) {
		console.log(error);
		return false;
	}
};

k['encrypt'] = (data, key = k.password) => {
	return CryptoJS.AES.encrypt(data, key).toString();
};

k['decrypt'] = (data, key = k.password) => {
	const decrypted = CryptoJS.AES.decrypt(data, key);
	return decrypted.toString(CryptoJS.enc.Utf8);
};

k['clearSpaces'] = (str) => {
	return str.replaceAll(' ', '');
};

// Plugins

k['installPlugin'] = async (name) => {
	name = name.toLowerCase().replaceAll(' ', '-');
	~(k.installedPlugins.indexOf(name) + 1 || k.installedPlugins.push(name)) - 1 && k.installedPlugins;
	const content = await k.getFromURL('https://raw.githubusercontent.com/Axorax/kamipass/main/plugins/' + name + '.js');

	if (!(await fs.exists(k.pluginsPath))) {
		await fs.createDir(k.pluginsFolder);
	}

	await fs.writeFile({
		path: await path.join(k.pluginsPath, name + '.js'),
		contents: content
	});
};

k['uninstallPlugin'] = async (name) => {
	name = name.toLowerCase().replaceAll(' ', '-');
	k.installedPlugins.push(name);

	if (!(await fs.exists(k.pluginsPath))) {
		return;
	}

	const file = await path.join(k.pluginsPath, name + '.js');

	if (await fs.exists(file)) {
		await fs.removeFile(file);
	}
};

// Erase data

k['erase'] = async () => {
	if (await fs.exists(k.filePath)) {
		fs.removeFile(k.file);
		window.location.reload();
	}
};

// Add data

k['add'] = async (key, value, password = false) => {
	try {
		const filePath = await path.join(k.basePath, k.file);
		let data = {};

		if (await fs.exists(filePath)) {
			const rawData = await fs.readTextFile(filePath);
			data = JSON.parse(rawData);
		}

		if (false != password) {
			data[key] = k.encrypt(value, password);
		} else {
			data[key] = value;
		}

		await fs.writeFile({
			path: filePath,
			contents: JSON.stringify(data, null, 2)
		});
	} catch (e) {
		console.error('Error: ', e);
	}
};

k['read'] = async (item) => {
	if (await fs.exists(k.filePath)) {
		const data = JSON.parse(await fs.readTextFile(k.filePath));
		return data[item];
	} else {
		return false;
	}
};

k['readEncrypted'] = async (item) => {
	if (await fs.exists(k.filePath)) {
		const data = JSON.parse(await fs.readTextFile(k.filePath));
		return k.decrypt(data[item], k.password);
	} else {
		return false;
	}
};

k['readAll'] = async () => {
	if (await fs.exists(k.filePath)) {
		return JSON.parse(await fs.readTextFile(k.filePath));
	} else {
		return false;
	}
};

// Change and set password

k['changePassword'] = (o, n) => {
	if ('' == o.replaceAll(' ', '') || '' == n.replaceAll(' ', '')) {
		return [false, 'Enter old and new password!'];
	}

	try {
		if (k.decrypt(k.verificationEncrypted, o) != k.verification) {
			return [false, 'Old password is incorrect!'];
		}
	} catch (e) {
		return [false, 'Old password is incorrect!'];
	}

	k.password = n;
	k.verificationEncrypted = k.encrypt(k.verification, n);
	k.add('verification', k.verification, n);
	return [true];
};

k['setPassword'] = (password) => {
	if ('' == password.replaceAll(' ')) {
		return [false, 'Password cannot be empty!'];
	} else if (4 >= password.length) {
		return [false, 'Length of password must be greater than 4'];
	}

	k.password = password;
	k.verificationEncrypted = k.encrypt(k.verification, password);
	k.add('verification', k.verification, password);
	return [true];
};

// Copy

k['copy'] = (text) => {
	return navigator.clipboard.writeText(text);
};

// Tab and subtab

k['setTab'] = (name) => {
	k.tab = name;
	const e = document.querySelector('.tab.' + name);

	try {
		if (Boolean(e.hasAttribute('k-loginOnly'))) {
			document.querySelector('.modal.active').style.display = 'flex';
		} else {
			document.querySelector('.modal.active').style.display = 'none';
		}
	} catch (e) {}

	document.querySelectorAll('.tab-group button.active').forEach((button) => {
		button.classList.remove('active');
	});

	document.querySelector('.tab-group .' + name).classList.add('active');

	document.querySelectorAll('.tab.active').forEach((tab) => {
		tab.classList.remove('active');
	});

	document.querySelector('.tab.' + name).classList.add('active');

	s.tab.slider.style.transform = `translateX(${Array.from(document.querySelectorAll('.tab-group button')).indexOf(document.querySelector('.tab-group .' + name)) * 100}%)`;

	try {
		k.subtab = document.querySelector('.tab.' + name + ' .subtab.active').classList[1];
	} catch (e) {}
};

k['setSubtab'] = (name) => {
	k.subtab = name;
	const e = document.querySelector('.subtab.' + name);

	document.querySelectorAll('.subtab-group button.active').forEach((button) => {
		button.classList.remove('active');
	});

	document.querySelector('.subtab-group .' + name).classList.add('active');

	e.parentNode.querySelectorAll('.subtab.active').forEach((tab) => {
		tab.classList.remove('active');
	});

	e.classList.add('active');
};

// Shortcut

k['checkKey'] = (event, key) => {
	const k = key
			.toLowerCase()
			.split('+')
			.map((k) => k.trim()),
		sk = { spacebar: ' ', enter: 'enter', escape: 'escape' };
	return k.every((m) => (m === 'ctrl' && event.ctrlKey) || (m === 'shift' && event.shiftKey) || (m === 'alt' && event.altKey) || (m === 'meta' && event.metaKey) || event.key.toLowerCase() === (sk[m] || m));
};

k['addShortcut'] = ({ keys, title = 'Unknown', group = 'misc', preventDefault = true }, code = () => {}) => {
	const x = keys
		.replaceAll('+', 'KAMI+KAMI')
		.split('KAMI')
		.map((item) => item.trim())
		.filter((item) => item !== '');
	const titles = Array.isArray(title) ? title : [title];
	const groups = Array.isArray(group) ? group : [group];

	const generateHTML = (t) => `
        <div>
            <p>${t}</p>
            <div>${x.map((item) => (item.replaceAll(' ', '') === '+' ? '<span>+</span>' : `<kbd>${item.toUpperCase()}</kbd>`)).join('')}</div>
        </div>`;

	if (titles.length === groups.length) {
		titles.forEach((t, i) => {
			const g = groups[i];
			const gSelector = s.subtab.shortcuts.querySelector('.' + g);
			const groupHTML = generateHTML(t);

			if (!gSelector) {
				const e = document.createElement('div');
				e.classList.add(g);
				e.innerHTML += `<h2>${g.replaceAll('-', ' ')}</h2>
                <div class="options">${groupHTML}</div>`;
				s.subtab.shortcuts.append(e);
			} else {
				gSelector.querySelector('.options').innerHTML += groupHTML;
			}
		});
	} else if (titles.length > 1 && groups.length === 1) {
		const g = groups[0];
		const gSelector = s.subtab.shortcuts.querySelector('.' + g);
		const groupHTML = titles.map((t) => generateHTML(t)).join('');

		if (!gSelector) {
			const e = document.createElement('div');
			e.classList.add(g);
			e.innerHTML += `<h2>${g.replaceAll('-', ' ')}</h2>
            <div class="options">${groupHTML}</div>`;
			s.subtab.shortcuts.append(e);
		} else {
			gSelector.querySelector('.options').innerHTML += groupHTML;
		}
	} else {
		titles.forEach((t) => {
			groups.forEach((g) => {
				const gSelector = s.subtab.shortcuts.querySelector('.' + g);
				const groupHTML = generateHTML(t);

				if (!gSelector) {
					const e = document.createElement('div');
					e.classList.add(g);
					e.innerHTML += `<h2>${g.replaceAll('-', ' ')}</h2>
                    <div class="options">${groupHTML}</div>`;
					s.subtab.shortcuts.append(e);
				} else {
					gSelector.querySelector('.options').innerHTML += groupHTML;
				}
			});
		});
	}

	document.addEventListener('keydown', async function (event) {
		if (k.checkKey(event, keys)) {
			if (preventDefault) {
				event.preventDefault();
			}
			code(event);
		}
	});
};

// Settings

k['toggleNotesEncryption'] = () => {
	if (k.encryptNotes) {
		k.encryptNotes = false;
		k.add('encryptNotes', false);
	} else {
		k.encryptNotes = true;
		k.add('encryptNotes', true);
	}
	setTimeout(() => {
		if (k.encryptNotes) {
			k.add('notes', s.notes.innerText, k.password);
		} else {
			k.add('notes', s.notes.innerText);
		}
	}, 1000);
};

k['togglePasswordsUseMono'] = () => {
	if (s.tab.passwords.classList.contains('no-mono')) {
		k.add('passwordsUseMono', true);
		s.tab.passwords.classList.remove('no-mono');
	} else {
		k.add('passwordsUseMono', false);
		s.tab.passwords.classList.add('no-mono');
	}
};

k['setNotesDelayTime'] = (time) => {
	k.notesDelay = Number(time);
	k.add('notesDelay', Number(time));
};

k['setSheetsDelayTime'] = (time) => {
	k.sheetsDelay = Number(time);
	k.add('sheetsDelay', Number(time));
};

k['togglePasswordCharset'] = (type) => {
	const e = document.querySelector('#password-charset');
	const val = e.value;
	let newVal = '';

	if (type === 'number') {
		const hasNumbers = /[0-9]/.test(val);
		if (hasNumbers) {
			newVal = val.replace(/[0-9]/g, '');
		} else {
			newVal = val + '0123456789';
		}
	} else if (type === 'symbol') {
		const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(val);
		if (hasSymbols) {
			newVal = val.replace(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
		} else {
			newVal = val + '!@#$%^&*()_+-=[]{}|;:,.<>?';
		}
	} else if (type === 'upper') {
		const hasUpper = /[A-Z]/.test(val);
		if (hasUpper) {
			newVal = val.replace(/[A-Z]/g, '');
		} else {
			newVal = val + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		}
	} else if (type === 'lower') {
		const hasLower = /[a-z]/.test(val);
		if (hasLower) {
			newVal = val.replace(/[a-z]/g, '');
		} else {
			newVal = val + 'abcdefghijklmnopqrstuvwxyz';
		}
	}

	e.value = newVal;
};

k['addSetting'] = ({ title = 'Unknown', loginOnly = true, numberOnly = false, group = 'misc', value = null, style = null, id = null, inline = null, element = 'input', placeholder, buttonText = 'No text provided!', type = 'primary', checked = true }, code = null) => {
	let child;
	const uuid = k.generatePassword('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');

	if (code != null) {
		db.settings[uuid] = code;
	}
	if (!Boolean(document.querySelector('.subtab.config .' + group))) {
		const div = document.createElement('div');
		div.classList.add(group);
		if (!loginOnly) {
			div.classList.add('notLoginOnly');
		}
		div.innerHTML = `<h2>${group.replaceAll('-', ' ')}</h2><div class="options"></div>`;
		document.querySelector('.subtab.config').append(div);
	}

	if (element == 'button') {
		child = `<div><button ${id == null ? '' : `id="${id}"`} class="${type}" ${style == null ? '' : `style="${style}"`} onclick="${inline != null ? inline : code != null ? `db.settings['${uuid}'](event)` : ''}">${buttonText}</button></div>`;
	} else if (element == 'toggle') {
		child = `<div class="toggle"><input ${id == null ? '' : `id="${id}"`}  ${style == null ? '' : `style="${style}"`} onchange="${inline != null ? inline : code != null ? `db.settings['${uuid}'](event)` : ''}" type="checkbox" ${checked == true ? 'checked' : ''} /><label></label></div`;
	} else {
		child = `<input type="text" ${numberOnly ? `oninput="this.value = this.value.replace(/[^0-9]/g, '');"` : ''} ${id == null ? '' : `id="${id}"`} ${value == null ? '' : `value="${value}"`} ${style == null ? '' : `style="${style}"`} onchange="${inline != null ? inline : code != null ? `db.settings['${uuid}'](event)` : ''}" placeholder="${placeholder ? placeholder : 'Type here...'}" />`;
	}

	if (element != 'note') {
		document.querySelector('.subtab.config .' + group + ' .options').innerHTML += `
				<div>
					<p>${title}</p>
					<div>
					${child}
					</div>
				</div>
	`;
	} else {
		document.querySelector('.subtab.config .' + group).innerHTML += `<div class="note danger" class="${type}" ${id == null ? '' : `id="${id}"`}  ${style == null ? '' : `style="${style}"`}>${title}</div>`;
	}
};

// Focus and search

k['focusOn'] = (element) => {
	return document.querySelector(element).focus();
};

k['focusOnCell'] = (col = 0, row = 0) => {
	return k.focusOn(`.col-${col} .row-${row}`);
};

k['search'] = () => {
	if (k.password == null) {
		return;
	}

	s.search.main.classList.add('active');
	s.search.back.onclick = null;
	s.search.next.onclick = null;
	text = s.search.input.value.toLowerCase();

	if (tab == 'passwords') {
		try {
			const results = [];
			let focus = 0;

			document.querySelectorAll('.tab.passwords .col').forEach((col, colIndex) => {
				col.querySelectorAll('.row').forEach((row, rowIndex) => {
					if (row.textContent.toLowerCase().includes(text)) {
						results.push([colIndex, rowIndex]);
					}
				});
			});

			k.focusOnCell(results[0][0], results[0][1]);
			s.search.results.innerText = focus + 1 + '/' + results.length;
			s.search.input.focus = false;

			s.search.back.onclick = () => {
				focus--;
				if (focus < 0) {
					focus = results.length - 1;
				}
				s.search.results.innerText = focus + 1 + '/' + results.length;
				k.focusOnCell(results[focus][0], results[focus][1]);
			};

			s.search.next.onclick = () => {
				focus++;
				if (focus > results.length - 1) {
					focus = 0;
				}
				s.search.results.innerText = focus + 1 + '/' + results.length;
				k.focusOnCell(results[focus][0], results[focus][1]);
			};
		} catch (e) {
			s.search.results.innerText = 'none';
		}
	}
};

// Generate

k['generatePassword'] = (chars) => {
	const charset = chars || document.querySelector('#password-charset').value || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
	let password = '';
	const length = Number(document.querySelector('#password-length').value);
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * charset.length);
		password += charset[randomIndex];
	}
	return password;
};

k['generateAndPastePassword'] = () => {
	const e = document.activeElement;

	if (e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.isContentEditable)) {
		e.focus();
		const pass = k.generatePassword();

		if (document.execCommand) {
			document.execCommand('insertText', false, pass);
		} else {
			const start = e.selectionStart;
			const end = e.selectionEnd;
			const value = e.value;
			e.value = value.slice(0, start) + pass + value.slice(end);
			e.selectionStart = e.selectionEnd = start + pass.length;
		}
		return pass;
	} else {
		return false;
	}
};

k['generateQR'] = () => {
	const btn = document.querySelector('#qr-btn');
	const box = document.querySelector('#qr-box');
	btn.style.display = 'block';
	box.style.display = 'flex';
	box.innerHTML = '<div id="img"></div>';
	box.style.background = document.querySelector('#qr-preview').value;
	new QRCode(document.querySelector('#qr-box > div#img'), {
		text: document.querySelector('#qr-input').value,
		width: Number(document.querySelector('#qr-width').value),
		height: Number(document.querySelector('#qr-height').value),
		colorDark: document.querySelector('#qr-bg').value,
		colorLight: document.querySelector('#qr-fg').value,
		correctLevel: QRCode.CorrectLevel.H
	});
	document.querySelector('#qr-box > div#img').removeAttribute('title');
	btn.onclick = () => {
		const link = document.createElement('a');
		link.href = document.querySelector('#qr-box img').src;
		link.download = 'kamipass-qr.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
};

k['expandRow'] = () => {
	document.querySelectorAll('.row.last').forEach((el) => {
		el.onclick = null;
		el.classList.remove('last');
	});
	document.querySelectorAll('.col').forEach((e) => {
		const r = document.createElement('div');
		r.innerHTML = `<div class="row row-${k.rows} last" onclick="k.expandRow()" spellcheck="false" contenteditable></div>`;
		e.appendChild(r.firstChild);
		r.remove();
	});
	k.rows++;
};

k['expandCol'] = () => {
	document.querySelectorAll('.col.last').forEach((el) => {
		el.onclick = null;
		el.classList.remove('last');
	});
	let rowCount = 0;
	let rowTemplate = '';
	for (let i = 0; i < k.rows; i++) {
		rowTemplate += `<div class="row row-${rowCount}${rowCount == k.rows - 1 ? ' last' : ''}" ${rowCount == k.rows - 1 ? 'onclick="k.expandRow()"' : ''} spellcheck="false" contenteditable></div>`;
		rowCount++;
	}

	const c = k.cols;
	const r = document.createElement('div');
	r.innerHTML = `<div class="col col-${c} last" onclick="k.expandCol()" >${rowTemplate}</div>`;
	s.tab.passwords.appendChild(r.firstChild);
	r.remove();
	k.cols++;
};

k['generateSheet'] = (countC = 30, countR = 30) => {
	return new Promise((resolve, _) => {
		countC = countC + 1;
		countR = countR + 1;
		let rowTemplate = '';
		let rowCount = 0;
		k.rows = countR;
		k.cols = countC;
		for (let i = 0; i < countR; i++) {
			rowTemplate += `<div class="row row-${rowCount}${rowCount == countR - 1 ? ' last' : ''}" ${rowCount == countR - 1 ? 'onclick="k.expandRow()"' : ''} spellcheck="false" contenteditable></div>`;
			rowCount++;
		}
		for (let i = 0; i < countC; i++) {
			s.tab.passwords.innerHTML += `<div class="col col-${k.colCount}${k.colCount == countC - 1 ? ' last' : ''}" ${k.colCount == countC - 1 ? 'onclick="k.expandCol()"' : ''} >${rowTemplate}</div>`;
			k.colCount++;
			if (k.colCount == countC) {
				resolve();
			}
		}
	});
};

k['generateSheetFromData'] = (data) => {
	const highest = data.split('\n')[0].split(',');
	k.generateSheet(Number(highest[0]) + 1 < 30 ? 30 : Number(highest[0]) + 1, Number(highest[1]) + 1 < 30 ? 30 : Number(highest[1]) + 1)
		.then(() => {
			data = data.split('\n').slice(1);
			data.pop();
			for (let i = 0; i < data.length; i++) {
				const result = data[i]
					.match(/\[(.*?)\]\s*(.*)/)
					.slice(1)
					.map((item, index) => (index === 0 ? JSON.parse('[' + item + ']') : item));
				document.querySelector(`.col-${result[0][0]} .row-${result[0][1]}`).innerText = result[1];
			}
		})
		.catch((error) => {
			console.error('Error in generateDefault:', error);
		});
};

// Save sheet and notes

k['saveSheet'] = () => {
	if (document.querySelector('#passwords-notifier').innerText == '') {
		return;
	}

	const columns = document.querySelectorAll('.col');
	let result = '';
	let lo = [];

	columns.forEach((col) => {
		const colClassName = Array.from(col.classList).find((cn) => cn.startsWith('col-'));
		const colNumber = parseInt(colClassName.split('-')[1]);
		const rows = col.querySelectorAll('.row');
		rows.forEach((row) => {
			if (row.textContent.trim() !== '') {
				const rowClassName = Array.from(row.classList).find((cn) => cn.startsWith('row-'));
				const rowNumber = parseInt(rowClassName.split('-')[1]);
				const content = row.textContent;

				lo.push([colNumber, rowNumber]);
				result += `[${colNumber},${rowNumber}] ${content}\n`;
			}
		});
	});

	let maxColNumber = 0;
	let maxRowNumber = 0;

	lo.forEach((item) => {
		if (item[0] > maxColNumber) {
			maxColNumber = item[0];
		}
		if (item[1] > maxRowNumber) {
			maxRowNumber = item[1];
		}
	});

	lo.unshift([maxColNumber, maxRowNumber]);
	result = `${lo[0][0]},${lo[0][1]}\n` + result;

		document.querySelector('#passwords-notifier').innerText = '';
		k.add('passwords', result, k.password);
		if (Object.keys(k.onSave).length != 0) {
			Object.values(k.onSave).forEach((code) => {
				code(result);
			});
		}
};

k['savePasswords'] = () => {
	k.saveSheet();
};

k['saveNotes'] = () => {
	if (document.querySelector('#notes-notifier').innerText != '') {
		document.querySelector('#notes-notifier').innerText = '';

		if (k.encryptNotes) {
			k.add('notes', s.notes.innerText, k.password);
		} else {
			k.add('notes', s.notes.innerText);
		}

		if (Object.keys(k.onSave).length != 0) {
			Object.values(k.onSave).forEach((code) => {
				code(s.notes.innerText);
			});
		}
	}
};

// Clear passwords

k['clearAllPasswords'] = () => {
	k.add('passwords', '');
	s.tab.passwords.innerHTML = '';
	k.colCount = 0;
	k.cols = 0;
	k.rows = 0;
	k.generateSheet();
};

// Make advanced editor

k['makeAdvancedEditor'] = (div) => {
	div.onpaste = (e) => {
		e.preventDefault();
		const clipboardData = e.clipboardData || window.clipboardData;
		const pastedText = clipboardData?.getData('text/plain') || '';
		document.execCommand('inserttext', false, pastedText);
	};
	div.addEventListener('keydown', function (e) {
		const keyEvent = e;
		if (keyEvent.key === 'Tab' && keyEvent.shiftKey) {
			keyEvent.preventDefault();
			const selection = window.getSelection();
			if (!selection.rangeCount) return;

			const range = selection.getRangeAt(0);
			const node = range.startContainer;
			const offset = range.startOffset;

			if (node.nodeType === Node.TEXT_NODE && offset >= 4 && node.textContent.slice(offset - 4, offset) === '    ') {
				range.setStart(node, offset - 4);
				range.setEnd(node, offset);
				range.deleteContents();
			}
		} else if (keyEvent.key === 'Tab') {
			keyEvent.preventDefault();
			document.execCommand('insertText', false, '    ');
		} else if (['"', "'", '(', '{', '[', '<'].includes(keyEvent.key)) {
			keyEvent.preventDefault();
			const pairMap = {
				'"': '"',
				"'": "'",
				'(': ')',
				'{': '}',
				'[': ']',
				'<': '>'
			};
			const pair = pairMap[keyEvent.key];
			const selection = window.getSelection();
			const range = selection.getRangeAt(0);
			range.deleteContents();
			const startNode = document.createTextNode(keyEvent.key);
			const endNode = document.createTextNode(pair);
			range.insertNode(endNode);
			range.insertNode(startNode);
			range.setStart(startNode, 1);
			range.setEnd(startNode, 1);
			selection.removeAllRanges();
			selection.addRange(range);
		} else if (keyEvent.key === 'x' && keyEvent.ctrlKey) {
			keyEvent.preventDefault();
			const selection = window.getSelection();
			if (!selection.rangeCount) return;
			const range = selection.getRangeAt(0);
			let start = range.startContainer;
			while (start && start.nodeType !== Node.ELEMENT_NODE) {
				start = start.parentNode;
			}
			let end = range.endContainer;
			while (end && end.nodeType !== Node.ELEMENT_NODE) {
				end = end.parentNode;
			}
			if (start && end && start === end && start.nodeType === Node.ELEMENT_NODE) {
				const lineText = start.textContent;
				navigator.clipboard
					.writeText(lineText)
					.then(() => {
						start.textContent = '';
					})
					.catch((err) => {
						console.error('Failed to copy text: ', err);
					});
			}
		} else if (keyEvent.key === 'Home') {
			keyEvent.preventDefault();
			const selection = window.getSelection();
			if (!selection.rangeCount) return;
			const range = selection.getRangeAt(0);
			const node = range.startContainer;
			const offset = range.startOffset;
			const lineText = node.textContent;
			let newOffset = 0;
			for (let i = 0; i < lineText.length; i++) {
				if (lineText[i] !== ' ' && lineText[i] !== '\t') {
					newOffset = i;
					break;
				}
			}
			if (offset === newOffset || offset === 0) {
				newOffset = 0;
			}
			range.setStart(node, newOffset);
			range.setEnd(node, newOffset);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	});
};
