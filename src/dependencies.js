var CryptoJS =
	CryptoJS ||
	(function (u, p) {
		var d = {},
			l = (d.lib = {}),
			s = function () {},
			t = (l.Base = {
				extend: function (a) {
					s.prototype = this;
					var c = new s();
					a && c.mixIn(a);
					c.hasOwnProperty('init') ||
						(c.init = function () {
							c.$super.init.apply(this, arguments);
						});
					c.init.prototype = c;
					c.$super = this;
					return c;
				},
				create: function () {
					var a = this.extend();
					a.init.apply(a, arguments);
					return a;
				},
				init: function () {},
				mixIn: function (a) {
					for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
					a.hasOwnProperty('toString') && (this.toString = a.toString);
				},
				clone: function () {
					return this.init.prototype.extend(this);
				}
			}),
			r = (l.WordArray = t.extend({
				init: function (a, c) {
					a = this.words = a || [];
					this.sigBytes = c != p ? c : 4 * a.length;
				},
				toString: function (a) {
					return (a || v).stringify(this);
				},
				concat: function (a) {
					var c = this.words,
						e = a.words,
						j = this.sigBytes;
					a = a.sigBytes;
					this.clamp();
					if (j % 4) for (var k = 0; k < a; k++) c[(j + k) >>> 2] |= ((e[k >>> 2] >>> (24 - 8 * (k % 4))) & 255) << (24 - 8 * ((j + k) % 4));
					else if (65535 < e.length) for (k = 0; k < a; k += 4) c[(j + k) >>> 2] = e[k >>> 2];
					else c.push.apply(c, e);
					this.sigBytes += a;
					return this;
				},
				clamp: function () {
					var a = this.words,
						c = this.sigBytes;
					a[c >>> 2] &= 4294967295 << (32 - 8 * (c % 4));
					a.length = u.ceil(c / 4);
				},
				clone: function () {
					var a = t.clone.call(this);
					a.words = this.words.slice(0);
					return a;
				},
				random: function (a) {
					for (var c = [], e = 0; e < a; e += 4) c.push((4294967296 * u.random()) | 0);
					return new r.init(c, a);
				}
			})),
			w = (d.enc = {}),
			v = (w.Hex = {
				stringify: function (a) {
					var c = a.words;
					a = a.sigBytes;
					for (var e = [], j = 0; j < a; j++) {
						var k = (c[j >>> 2] >>> (24 - 8 * (j % 4))) & 255;
						e.push((k >>> 4).toString(16));
						e.push((k & 15).toString(16));
					}
					return e.join('');
				},
				parse: function (a) {
					for (var c = a.length, e = [], j = 0; j < c; j += 2) e[j >>> 3] |= parseInt(a.substr(j, 2), 16) << (24 - 4 * (j % 8));
					return new r.init(e, c / 2);
				}
			}),
			b = (w.Latin1 = {
				stringify: function (a) {
					var c = a.words;
					a = a.sigBytes;
					for (var e = [], j = 0; j < a; j++) e.push(String.fromCharCode((c[j >>> 2] >>> (24 - 8 * (j % 4))) & 255));
					return e.join('');
				},
				parse: function (a) {
					for (var c = a.length, e = [], j = 0; j < c; j++) e[j >>> 2] |= (a.charCodeAt(j) & 255) << (24 - 8 * (j % 4));
					return new r.init(e, c);
				}
			}),
			x = (w.Utf8 = {
				stringify: function (a) {
					try {
						return decodeURIComponent(escape(b.stringify(a)));
					} catch (c) {
						throw Error('Malformed UTF-8 data');
					}
				},
				parse: function (a) {
					return b.parse(unescape(encodeURIComponent(a)));
				}
			}),
			q = (l.BufferedBlockAlgorithm = t.extend({
				reset: function () {
					this._data = new r.init();
					this._nDataBytes = 0;
				},
				_append: function (a) {
					'string' == typeof a && (a = x.parse(a));
					this._data.concat(a);
					this._nDataBytes += a.sigBytes;
				},
				_process: function (a) {
					var c = this._data,
						e = c.words,
						j = c.sigBytes,
						k = this.blockSize,
						b = j / (4 * k),
						b = a ? u.ceil(b) : u.max((b | 0) - this._minBufferSize, 0);
					a = b * k;
					j = u.min(4 * a, j);
					if (a) {
						for (var q = 0; q < a; q += k) this._doProcessBlock(e, q);
						q = e.splice(0, a);
						c.sigBytes -= j;
					}
					return new r.init(q, j);
				},
				clone: function () {
					var a = t.clone.call(this);
					a._data = this._data.clone();
					return a;
				},
				_minBufferSize: 0
			}));
		l.Hasher = q.extend({
			cfg: t.extend(),
			init: function (a) {
				this.cfg = this.cfg.extend(a);
				this.reset();
			},
			reset: function () {
				q.reset.call(this);
				this._doReset();
			},
			update: function (a) {
				this._append(a);
				this._process();
				return this;
			},
			finalize: function (a) {
				a && this._append(a);
				return this._doFinalize();
			},
			blockSize: 16,
			_createHelper: function (a) {
				return function (b, e) {
					return new a.init(e).finalize(b);
				};
			},
			_createHmacHelper: function (a) {
				return function (b, e) {
					return new n.HMAC.init(a, e).finalize(b);
				};
			}
		});
		var n = (d.algo = {});
		return d;
	})(Math);
(function () {
	var u = CryptoJS,
		p = u.lib.WordArray;
	u.enc.Base64 = {
		stringify: function (d) {
			var l = d.words,
				p = d.sigBytes,
				t = this._map;
			d.clamp();
			d = [];
			for (var r = 0; r < p; r += 3) for (var w = (((l[r >>> 2] >>> (24 - 8 * (r % 4))) & 255) << 16) | (((l[(r + 1) >>> 2] >>> (24 - 8 * ((r + 1) % 4))) & 255) << 8) | ((l[(r + 2) >>> 2] >>> (24 - 8 * ((r + 2) % 4))) & 255), v = 0; 4 > v && r + 0.75 * v < p; v++) d.push(t.charAt((w >>> (6 * (3 - v))) & 63));
			if ((l = t.charAt(64))) for (; d.length % 4; ) d.push(l);
			return d.join('');
		},
		parse: function (d) {
			var l = d.length,
				s = this._map,
				t = s.charAt(64);
			t && ((t = d.indexOf(t)), -1 != t && (l = t));
			for (var t = [], r = 0, w = 0; w < l; w++)
				if (w % 4) {
					var v = s.indexOf(d.charAt(w - 1)) << (2 * (w % 4)),
						b = s.indexOf(d.charAt(w)) >>> (6 - 2 * (w % 4));
					t[r >>> 2] |= (v | b) << (24 - 8 * (r % 4));
					r++;
				}
			return p.create(t, r);
		},
		_map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	};
})();
(function (u) {
	function p(b, n, a, c, e, j, k) {
		b = b + ((n & a) | (~n & c)) + e + k;
		return ((b << j) | (b >>> (32 - j))) + n;
	}
	function d(b, n, a, c, e, j, k) {
		b = b + ((n & c) | (a & ~c)) + e + k;
		return ((b << j) | (b >>> (32 - j))) + n;
	}
	function l(b, n, a, c, e, j, k) {
		b = b + (n ^ a ^ c) + e + k;
		return ((b << j) | (b >>> (32 - j))) + n;
	}
	function s(b, n, a, c, e, j, k) {
		b = b + (a ^ (n | ~c)) + e + k;
		return ((b << j) | (b >>> (32 - j))) + n;
	}
	for (var t = CryptoJS, r = t.lib, w = r.WordArray, v = r.Hasher, r = t.algo, b = [], x = 0; 64 > x; x++) b[x] = (4294967296 * u.abs(u.sin(x + 1))) | 0;
	r = r.MD5 = v.extend({
		_doReset: function () {
			this._hash = new w.init([1732584193, 4023233417, 2562383102, 271733878]);
		},
		_doProcessBlock: function (q, n) {
			for (var a = 0; 16 > a; a++) {
				var c = n + a,
					e = q[c];
				q[c] = (((e << 8) | (e >>> 24)) & 16711935) | (((e << 24) | (e >>> 8)) & 4278255360);
			}
			var a = this._hash.words,
				c = q[n + 0],
				e = q[n + 1],
				j = q[n + 2],
				k = q[n + 3],
				z = q[n + 4],
				r = q[n + 5],
				t = q[n + 6],
				w = q[n + 7],
				v = q[n + 8],
				A = q[n + 9],
				B = q[n + 10],
				C = q[n + 11],
				u = q[n + 12],
				D = q[n + 13],
				E = q[n + 14],
				x = q[n + 15],
				f = a[0],
				m = a[1],
				g = a[2],
				h = a[3],
				f = p(f, m, g, h, c, 7, b[0]),
				h = p(h, f, m, g, e, 12, b[1]),
				g = p(g, h, f, m, j, 17, b[2]),
				m = p(m, g, h, f, k, 22, b[3]),
				f = p(f, m, g, h, z, 7, b[4]),
				h = p(h, f, m, g, r, 12, b[5]),
				g = p(g, h, f, m, t, 17, b[6]),
				m = p(m, g, h, f, w, 22, b[7]),
				f = p(f, m, g, h, v, 7, b[8]),
				h = p(h, f, m, g, A, 12, b[9]),
				g = p(g, h, f, m, B, 17, b[10]),
				m = p(m, g, h, f, C, 22, b[11]),
				f = p(f, m, g, h, u, 7, b[12]),
				h = p(h, f, m, g, D, 12, b[13]),
				g = p(g, h, f, m, E, 17, b[14]),
				m = p(m, g, h, f, x, 22, b[15]),
				f = d(f, m, g, h, e, 5, b[16]),
				h = d(h, f, m, g, t, 9, b[17]),
				g = d(g, h, f, m, C, 14, b[18]),
				m = d(m, g, h, f, c, 20, b[19]),
				f = d(f, m, g, h, r, 5, b[20]),
				h = d(h, f, m, g, B, 9, b[21]),
				g = d(g, h, f, m, x, 14, b[22]),
				m = d(m, g, h, f, z, 20, b[23]),
				f = d(f, m, g, h, A, 5, b[24]),
				h = d(h, f, m, g, E, 9, b[25]),
				g = d(g, h, f, m, k, 14, b[26]),
				m = d(m, g, h, f, v, 20, b[27]),
				f = d(f, m, g, h, D, 5, b[28]),
				h = d(h, f, m, g, j, 9, b[29]),
				g = d(g, h, f, m, w, 14, b[30]),
				m = d(m, g, h, f, u, 20, b[31]),
				f = l(f, m, g, h, r, 4, b[32]),
				h = l(h, f, m, g, v, 11, b[33]),
				g = l(g, h, f, m, C, 16, b[34]),
				m = l(m, g, h, f, E, 23, b[35]),
				f = l(f, m, g, h, e, 4, b[36]),
				h = l(h, f, m, g, z, 11, b[37]),
				g = l(g, h, f, m, w, 16, b[38]),
				m = l(m, g, h, f, B, 23, b[39]),
				f = l(f, m, g, h, D, 4, b[40]),
				h = l(h, f, m, g, c, 11, b[41]),
				g = l(g, h, f, m, k, 16, b[42]),
				m = l(m, g, h, f, t, 23, b[43]),
				f = l(f, m, g, h, A, 4, b[44]),
				h = l(h, f, m, g, u, 11, b[45]),
				g = l(g, h, f, m, x, 16, b[46]),
				m = l(m, g, h, f, j, 23, b[47]),
				f = s(f, m, g, h, c, 6, b[48]),
				h = s(h, f, m, g, w, 10, b[49]),
				g = s(g, h, f, m, E, 15, b[50]),
				m = s(m, g, h, f, r, 21, b[51]),
				f = s(f, m, g, h, u, 6, b[52]),
				h = s(h, f, m, g, k, 10, b[53]),
				g = s(g, h, f, m, B, 15, b[54]),
				m = s(m, g, h, f, e, 21, b[55]),
				f = s(f, m, g, h, v, 6, b[56]),
				h = s(h, f, m, g, x, 10, b[57]),
				g = s(g, h, f, m, t, 15, b[58]),
				m = s(m, g, h, f, D, 21, b[59]),
				f = s(f, m, g, h, z, 6, b[60]),
				h = s(h, f, m, g, C, 10, b[61]),
				g = s(g, h, f, m, j, 15, b[62]),
				m = s(m, g, h, f, A, 21, b[63]);
			a[0] = (a[0] + f) | 0;
			a[1] = (a[1] + m) | 0;
			a[2] = (a[2] + g) | 0;
			a[3] = (a[3] + h) | 0;
		},
		_doFinalize: function () {
			var b = this._data,
				n = b.words,
				a = 8 * this._nDataBytes,
				c = 8 * b.sigBytes;
			n[c >>> 5] |= 128 << (24 - (c % 32));
			var e = u.floor(a / 4294967296);
			n[(((c + 64) >>> 9) << 4) + 15] = (((e << 8) | (e >>> 24)) & 16711935) | (((e << 24) | (e >>> 8)) & 4278255360);
			n[(((c + 64) >>> 9) << 4) + 14] = (((a << 8) | (a >>> 24)) & 16711935) | (((a << 24) | (a >>> 8)) & 4278255360);
			b.sigBytes = 4 * (n.length + 1);
			this._process();
			b = this._hash;
			n = b.words;
			for (a = 0; 4 > a; a++) (c = n[a]), (n[a] = (((c << 8) | (c >>> 24)) & 16711935) | (((c << 24) | (c >>> 8)) & 4278255360));
			return b;
		},
		clone: function () {
			var b = v.clone.call(this);
			b._hash = this._hash.clone();
			return b;
		}
	});
	t.MD5 = v._createHelper(r);
	t.HmacMD5 = v._createHmacHelper(r);
})(Math);
(function () {
	var u = CryptoJS,
		p = u.lib,
		d = p.Base,
		l = p.WordArray,
		p = u.algo,
		s = (p.EvpKDF = d.extend({
			cfg: d.extend({ keySize: 4, hasher: p.MD5, iterations: 1 }),
			init: function (d) {
				this.cfg = this.cfg.extend(d);
			},
			compute: function (d, r) {
				for (var p = this.cfg, s = p.hasher.create(), b = l.create(), u = b.words, q = p.keySize, p = p.iterations; u.length < q; ) {
					n && s.update(n);
					var n = s.update(d).finalize(r);
					s.reset();
					for (var a = 1; a < p; a++) (n = s.finalize(n)), s.reset();
					b.concat(n);
				}
				b.sigBytes = 4 * q;
				return b;
			}
		}));
	u.EvpKDF = function (d, l, p) {
		return s.create(p).compute(d, l);
	};
})();
CryptoJS.lib.Cipher ||
	(function (u) {
		var p = CryptoJS,
			d = p.lib,
			l = d.Base,
			s = d.WordArray,
			t = d.BufferedBlockAlgorithm,
			r = p.enc.Base64,
			w = p.algo.EvpKDF,
			v = (d.Cipher = t.extend({
				cfg: l.extend(),
				createEncryptor: function (e, a) {
					return this.create(this._ENC_XFORM_MODE, e, a);
				},
				createDecryptor: function (e, a) {
					return this.create(this._DEC_XFORM_MODE, e, a);
				},
				init: function (e, a, b) {
					this.cfg = this.cfg.extend(b);
					this._xformMode = e;
					this._key = a;
					this.reset();
				},
				reset: function () {
					t.reset.call(this);
					this._doReset();
				},
				process: function (e) {
					this._append(e);
					return this._process();
				},
				finalize: function (e) {
					e && this._append(e);
					return this._doFinalize();
				},
				keySize: 4,
				ivSize: 4,
				_ENC_XFORM_MODE: 1,
				_DEC_XFORM_MODE: 2,
				_createHelper: function (e) {
					return {
						encrypt: function (b, k, d) {
							return ('string' == typeof k ? c : a).encrypt(e, b, k, d);
						},
						decrypt: function (b, k, d) {
							return ('string' == typeof k ? c : a).decrypt(e, b, k, d);
						}
					};
				}
			}));
		d.StreamCipher = v.extend({
			_doFinalize: function () {
				return this._process(!0);
			},
			blockSize: 1
		});
		var b = (p.mode = {}),
			x = function (e, a, b) {
				var c = this._iv;
				c ? (this._iv = u) : (c = this._prevBlock);
				for (var d = 0; d < b; d++) e[a + d] ^= c[d];
			},
			q = (d.BlockCipherMode = l.extend({
				createEncryptor: function (e, a) {
					return this.Encryptor.create(e, a);
				},
				createDecryptor: function (e, a) {
					return this.Decryptor.create(e, a);
				},
				init: function (e, a) {
					this._cipher = e;
					this._iv = a;
				}
			})).extend();
		q.Encryptor = q.extend({
			processBlock: function (e, a) {
				var b = this._cipher,
					c = b.blockSize;
				x.call(this, e, a, c);
				b.encryptBlock(e, a);
				this._prevBlock = e.slice(a, a + c);
			}
		});
		q.Decryptor = q.extend({
			processBlock: function (e, a) {
				var b = this._cipher,
					c = b.blockSize,
					d = e.slice(a, a + c);
				b.decryptBlock(e, a);
				x.call(this, e, a, c);
				this._prevBlock = d;
			}
		});
		b = b.CBC = q;
		q = (p.pad = {}).Pkcs7 = {
			pad: function (a, b) {
				for (var c = 4 * b, c = c - (a.sigBytes % c), d = (c << 24) | (c << 16) | (c << 8) | c, l = [], n = 0; n < c; n += 4) l.push(d);
				c = s.create(l, c);
				a.concat(c);
			},
			unpad: function (a) {
				a.sigBytes -= a.words[(a.sigBytes - 1) >>> 2] & 255;
			}
		};
		d.BlockCipher = v.extend({
			cfg: v.cfg.extend({ mode: b, padding: q }),
			reset: function () {
				v.reset.call(this);
				var a = this.cfg,
					b = a.iv,
					a = a.mode;
				if (this._xformMode == this._ENC_XFORM_MODE) var c = a.createEncryptor;
				else (c = a.createDecryptor), (this._minBufferSize = 1);
				this._mode = c.call(a, this, b && b.words);
			},
			_doProcessBlock: function (a, b) {
				this._mode.processBlock(a, b);
			},
			_doFinalize: function () {
				var a = this.cfg.padding;
				if (this._xformMode == this._ENC_XFORM_MODE) {
					a.pad(this._data, this.blockSize);
					var b = this._process(!0);
				} else (b = this._process(!0)), a.unpad(b);
				return b;
			},
			blockSize: 4
		});
		var n = (d.CipherParams = l.extend({
				init: function (a) {
					this.mixIn(a);
				},
				toString: function (a) {
					return (a || this.formatter).stringify(this);
				}
			})),
			b = ((p.format = {}).OpenSSL = {
				stringify: function (a) {
					var b = a.ciphertext;
					a = a.salt;
					return (a ? s.create([1398893684, 1701076831]).concat(a).concat(b) : b).toString(r);
				},
				parse: function (a) {
					a = r.parse(a);
					var b = a.words;
					if (1398893684 == b[0] && 1701076831 == b[1]) {
						var c = s.create(b.slice(2, 4));
						b.splice(0, 4);
						a.sigBytes -= 16;
					}
					return n.create({ ciphertext: a, salt: c });
				}
			}),
			a = (d.SerializableCipher = l.extend({
				cfg: l.extend({ format: b }),
				encrypt: function (a, b, c, d) {
					d = this.cfg.extend(d);
					var l = a.createEncryptor(c, d);
					b = l.finalize(b);
					l = l.cfg;
					return n.create({ ciphertext: b, key: c, iv: l.iv, algorithm: a, mode: l.mode, padding: l.padding, blockSize: a.blockSize, formatter: d.format });
				},
				decrypt: function (a, b, c, d) {
					d = this.cfg.extend(d);
					b = this._parse(b, d.format);
					return a.createDecryptor(c, d).finalize(b.ciphertext);
				},
				_parse: function (a, b) {
					return 'string' == typeof a ? b.parse(a, this) : a;
				}
			})),
			p = ((p.kdf = {}).OpenSSL = {
				execute: function (a, b, c, d) {
					d || (d = s.random(8));
					a = w.create({ keySize: b + c }).compute(a, d);
					c = s.create(a.words.slice(b), 4 * c);
					a.sigBytes = 4 * b;
					return n.create({ key: a, iv: c, salt: d });
				}
			}),
			c = (d.PasswordBasedCipher = a.extend({
				cfg: a.cfg.extend({ kdf: p }),
				encrypt: function (b, c, d, l) {
					l = this.cfg.extend(l);
					d = l.kdf.execute(d, b.keySize, b.ivSize);
					l.iv = d.iv;
					b = a.encrypt.call(this, b, c, d.key, l);
					b.mixIn(d);
					return b;
				},
				decrypt: function (b, c, d, l) {
					l = this.cfg.extend(l);
					c = this._parse(c, l.format);
					d = l.kdf.execute(d, b.keySize, b.ivSize, c.salt);
					l.iv = d.iv;
					return a.decrypt.call(this, b, c, d.key, l);
				}
			}));
	})();
(function () {
	for (var u = CryptoJS, p = u.lib.BlockCipher, d = u.algo, l = [], s = [], t = [], r = [], w = [], v = [], b = [], x = [], q = [], n = [], a = [], c = 0; 256 > c; c++) a[c] = 128 > c ? c << 1 : (c << 1) ^ 283;
	for (var e = 0, j = 0, c = 0; 256 > c; c++) {
		var k = j ^ (j << 1) ^ (j << 2) ^ (j << 3) ^ (j << 4),
			k = (k >>> 8) ^ (k & 255) ^ 99;
		l[e] = k;
		s[k] = e;
		var z = a[e],
			F = a[z],
			G = a[F],
			y = (257 * a[k]) ^ (16843008 * k);
		t[e] = (y << 24) | (y >>> 8);
		r[e] = (y << 16) | (y >>> 16);
		w[e] = (y << 8) | (y >>> 24);
		v[e] = y;
		y = (16843009 * G) ^ (65537 * F) ^ (257 * z) ^ (16843008 * e);
		b[k] = (y << 24) | (y >>> 8);
		x[k] = (y << 16) | (y >>> 16);
		q[k] = (y << 8) | (y >>> 24);
		n[k] = y;
		e ? ((e = z ^ a[a[a[G ^ z]]]), (j ^= a[a[j]])) : (e = j = 1);
	}
	var H = [0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54],
		d = (d.AES = p.extend({
			_doReset: function () {
				for (var a = this._key, c = a.words, d = a.sigBytes / 4, a = 4 * ((this._nRounds = d + 6) + 1), e = (this._keySchedule = []), j = 0; j < a; j++)
					if (j < d) e[j] = c[j];
					else {
						var k = e[j - 1];
						j % d ? 6 < d && 4 == j % d && (k = (l[k >>> 24] << 24) | (l[(k >>> 16) & 255] << 16) | (l[(k >>> 8) & 255] << 8) | l[k & 255]) : ((k = (k << 8) | (k >>> 24)), (k = (l[k >>> 24] << 24) | (l[(k >>> 16) & 255] << 16) | (l[(k >>> 8) & 255] << 8) | l[k & 255]), (k ^= H[(j / d) | 0] << 24));
						e[j] = e[j - d] ^ k;
					}
				c = this._invKeySchedule = [];
				for (d = 0; d < a; d++) (j = a - d), (k = d % 4 ? e[j] : e[j - 4]), (c[d] = 4 > d || 4 >= j ? k : b[l[k >>> 24]] ^ x[l[(k >>> 16) & 255]] ^ q[l[(k >>> 8) & 255]] ^ n[l[k & 255]]);
			},
			encryptBlock: function (a, b) {
				this._doCryptBlock(a, b, this._keySchedule, t, r, w, v, l);
			},
			decryptBlock: function (a, c) {
				var d = a[c + 1];
				a[c + 1] = a[c + 3];
				a[c + 3] = d;
				this._doCryptBlock(a, c, this._invKeySchedule, b, x, q, n, s);
				d = a[c + 1];
				a[c + 1] = a[c + 3];
				a[c + 3] = d;
			},
			_doCryptBlock: function (a, b, c, d, e, j, l, f) {
				for (var m = this._nRounds, g = a[b] ^ c[0], h = a[b + 1] ^ c[1], k = a[b + 2] ^ c[2], n = a[b + 3] ^ c[3], p = 4, r = 1; r < m; r++) var q = d[g >>> 24] ^ e[(h >>> 16) & 255] ^ j[(k >>> 8) & 255] ^ l[n & 255] ^ c[p++], s = d[h >>> 24] ^ e[(k >>> 16) & 255] ^ j[(n >>> 8) & 255] ^ l[g & 255] ^ c[p++], t = d[k >>> 24] ^ e[(n >>> 16) & 255] ^ j[(g >>> 8) & 255] ^ l[h & 255] ^ c[p++], n = d[n >>> 24] ^ e[(g >>> 16) & 255] ^ j[(h >>> 8) & 255] ^ l[k & 255] ^ c[p++], g = q, h = s, k = t;
				q = ((f[g >>> 24] << 24) | (f[(h >>> 16) & 255] << 16) | (f[(k >>> 8) & 255] << 8) | f[n & 255]) ^ c[p++];
				s = ((f[h >>> 24] << 24) | (f[(k >>> 16) & 255] << 16) | (f[(n >>> 8) & 255] << 8) | f[g & 255]) ^ c[p++];
				t = ((f[k >>> 24] << 24) | (f[(n >>> 16) & 255] << 16) | (f[(g >>> 8) & 255] << 8) | f[h & 255]) ^ c[p++];
				n = ((f[n >>> 24] << 24) | (f[(g >>> 16) & 255] << 16) | (f[(h >>> 8) & 255] << 8) | f[k & 255]) ^ c[p++];
				a[b] = q;
				a[b + 1] = s;
				a[b + 2] = t;
				a[b + 3] = n;
			},
			keySize: 8
		}));
	u.AES = p._createHelper(d);
})();
var QRCode;
!(function () {
	function a(a) {
		(this.mode = c.MODE_8BIT_BYTE), (this.data = a), (this.parsedData = []);
		for (var b = [], d = 0, e = this.data.length; e > d; d++) {
			var f = this.data.charCodeAt(d);
			f > 65536 ? ((b[0] = 240 | ((1835008 & f) >>> 18)), (b[1] = 128 | ((258048 & f) >>> 12)), (b[2] = 128 | ((4032 & f) >>> 6)), (b[3] = 128 | (63 & f))) : f > 2048 ? ((b[0] = 224 | ((61440 & f) >>> 12)), (b[1] = 128 | ((4032 & f) >>> 6)), (b[2] = 128 | (63 & f))) : f > 128 ? ((b[0] = 192 | ((1984 & f) >>> 6)), (b[1] = 128 | (63 & f))) : (b[0] = f), (this.parsedData = this.parsedData.concat(b));
		}
		this.parsedData.length != this.data.length && (this.parsedData.unshift(191), this.parsedData.unshift(187), this.parsedData.unshift(239));
	}
	function b(a, b) {
		(this.typeNumber = a), (this.errorCorrectLevel = b), (this.modules = null), (this.moduleCount = 0), (this.dataCache = null), (this.dataList = []);
	}
	function i(a, b) {
		if (void 0 == a.length) throw new Error(a.length + '/' + b);
		for (var c = 0; c < a.length && 0 == a[c]; ) c++;
		this.num = new Array(a.length - c + b);
		for (var d = 0; d < a.length - c; d++) this.num[d] = a[d + c];
	}
	function j(a, b) {
		(this.totalCount = a), (this.dataCount = b);
	}
	function k() {
		(this.buffer = []), (this.length = 0);
	}
	function m() {
		return 'undefined' != typeof CanvasRenderingContext2D;
	}
	function n() {
		var a = !1,
			b = navigator.userAgent;
		return /android/i.test(b) && ((a = !0), (aMat = b.toString().match(/android ([0-9]\.[0-9])/i)), aMat && aMat[1] && (a = parseFloat(aMat[1]))), a;
	}
	function r(a, b) {
		for (var c = 1, e = s(a), f = 0, g = l.length; g >= f; f++) {
			var h = 0;
			switch (b) {
				case d.L:
					h = l[f][0];
					break;
				case d.M:
					h = l[f][1];
					break;
				case d.Q:
					h = l[f][2];
					break;
				case d.H:
					h = l[f][3];
			}
			if (h >= e) break;
			c++;
		}
		if (c > l.length) throw new Error('Too long data');
		return c;
	}
	function s(a) {
		var b = encodeURI(a)
			.toString()
			.replace(/\%[0-9a-fA-F]{2}/g, 'a');
		return b.length + (b.length != a ? 3 : 0);
	}
	(a.prototype = {
		getLength: function () {
			return this.parsedData.length;
		},
		write: function (a) {
			for (var b = 0, c = this.parsedData.length; c > b; b++) a.put(this.parsedData[b], 8);
		}
	}),
		(b.prototype = {
			addData: function (b) {
				var c = new a(b);
				this.dataList.push(c), (this.dataCache = null);
			},
			isDark: function (a, b) {
				if (0 > a || this.moduleCount <= a || 0 > b || this.moduleCount <= b) throw new Error(a + ',' + b);
				return this.modules[a][b];
			},
			getModuleCount: function () {
				return this.moduleCount;
			},
			make: function () {
				this.makeImpl(!1, this.getBestMaskPattern());
			},
			makeImpl: function (a, c) {
				(this.moduleCount = 4 * this.typeNumber + 17), (this.modules = new Array(this.moduleCount));
				for (var d = 0; d < this.moduleCount; d++) {
					this.modules[d] = new Array(this.moduleCount);
					for (var e = 0; e < this.moduleCount; e++) this.modules[d][e] = null;
				}
				this.setupPositionProbePattern(0, 0), this.setupPositionProbePattern(this.moduleCount - 7, 0), this.setupPositionProbePattern(0, this.moduleCount - 7), this.setupPositionAdjustPattern(), this.setupTimingPattern(), this.setupTypeInfo(a, c), this.typeNumber >= 7 && this.setupTypeNumber(a), null == this.dataCache && (this.dataCache = b.createData(this.typeNumber, this.errorCorrectLevel, this.dataList)), this.mapData(this.dataCache, c);
			},
			setupPositionProbePattern: function (a, b) {
				for (var c = -1; 7 >= c; c++) if (!(-1 >= a + c || this.moduleCount <= a + c)) for (var d = -1; 7 >= d; d++) -1 >= b + d || this.moduleCount <= b + d || (this.modules[a + c][b + d] = (c >= 0 && 6 >= c && (0 == d || 6 == d)) || (d >= 0 && 6 >= d && (0 == c || 6 == c)) || (c >= 2 && 4 >= c && d >= 2 && 4 >= d) ? !0 : !1);
			},
			getBestMaskPattern: function () {
				for (var a = 0, b = 0, c = 0; 8 > c; c++) {
					this.makeImpl(!0, c);
					var d = f.getLostPoint(this);
					(0 == c || a > d) && ((a = d), (b = c));
				}
				return b;
			},
			createMovieClip: function (a, b, c) {
				var d = a.createEmptyMovieClip(b, c),
					e = 1;
				this.make();
				for (var f = 0; f < this.modules.length; f++)
					for (var g = f * e, h = 0; h < this.modules[f].length; h++) {
						var i = h * e,
							j = this.modules[f][h];
						j && (d.beginFill(0, 100), d.moveTo(i, g), d.lineTo(i + e, g), d.lineTo(i + e, g + e), d.lineTo(i, g + e), d.endFill());
					}
				return d;
			},
			setupTimingPattern: function () {
				for (var a = 8; a < this.moduleCount - 8; a++) null == this.modules[a][6] && (this.modules[a][6] = 0 == a % 2);
				for (var b = 8; b < this.moduleCount - 8; b++) null == this.modules[6][b] && (this.modules[6][b] = 0 == b % 2);
			},
			setupPositionAdjustPattern: function () {
				for (var a = f.getPatternPosition(this.typeNumber), b = 0; b < a.length; b++)
					for (var c = 0; c < a.length; c++) {
						var d = a[b],
							e = a[c];
						if (null == this.modules[d][e]) for (var g = -2; 2 >= g; g++) for (var h = -2; 2 >= h; h++) this.modules[d + g][e + h] = -2 == g || 2 == g || -2 == h || 2 == h || (0 == g && 0 == h) ? !0 : !1;
					}
			},
			setupTypeNumber: function (a) {
				for (var b = f.getBCHTypeNumber(this.typeNumber), c = 0; 18 > c; c++) {
					var d = !a && 1 == (1 & (b >> c));
					this.modules[Math.floor(c / 3)][(c % 3) + this.moduleCount - 8 - 3] = d;
				}
				for (var c = 0; 18 > c; c++) {
					var d = !a && 1 == (1 & (b >> c));
					this.modules[(c % 3) + this.moduleCount - 8 - 3][Math.floor(c / 3)] = d;
				}
			},
			setupTypeInfo: function (a, b) {
				for (var c = (this.errorCorrectLevel << 3) | b, d = f.getBCHTypeInfo(c), e = 0; 15 > e; e++) {
					var g = !a && 1 == (1 & (d >> e));
					6 > e ? (this.modules[e][8] = g) : 8 > e ? (this.modules[e + 1][8] = g) : (this.modules[this.moduleCount - 15 + e][8] = g);
				}
				for (var e = 0; 15 > e; e++) {
					var g = !a && 1 == (1 & (d >> e));
					8 > e ? (this.modules[8][this.moduleCount - e - 1] = g) : 9 > e ? (this.modules[8][15 - e - 1 + 1] = g) : (this.modules[8][15 - e - 1] = g);
				}
				this.modules[this.moduleCount - 8][8] = !a;
			},
			mapData: function (a, b) {
				for (var c = -1, d = this.moduleCount - 1, e = 7, g = 0, h = this.moduleCount - 1; h > 0; h -= 2)
					for (6 == h && h--; ; ) {
						for (var i = 0; 2 > i; i++)
							if (null == this.modules[d][h - i]) {
								var j = !1;
								g < a.length && (j = 1 == (1 & (a[g] >>> e)));
								var k = f.getMask(b, d, h - i);
								k && (j = !j), (this.modules[d][h - i] = j), e--, -1 == e && (g++, (e = 7));
							}
						if (((d += c), 0 > d || this.moduleCount <= d)) {
							(d -= c), (c = -c);
							break;
						}
					}
			}
		}),
		(b.PAD0 = 236),
		(b.PAD1 = 17),
		(b.createData = function (a, c, d) {
			for (var e = j.getRSBlocks(a, c), g = new k(), h = 0; h < d.length; h++) {
				var i = d[h];
				g.put(i.mode, 4), g.put(i.getLength(), f.getLengthInBits(i.mode, a)), i.write(g);
			}
			for (var l = 0, h = 0; h < e.length; h++) l += e[h].dataCount;
			if (g.getLengthInBits() > 8 * l) throw new Error('code length overflow. (' + g.getLengthInBits() + '>' + 8 * l + ')');
			for (g.getLengthInBits() + 4 <= 8 * l && g.put(0, 4); 0 != g.getLengthInBits() % 8; ) g.putBit(!1);
			for (;;) {
				if (g.getLengthInBits() >= 8 * l) break;
				if ((g.put(b.PAD0, 8), g.getLengthInBits() >= 8 * l)) break;
				g.put(b.PAD1, 8);
			}
			return b.createBytes(g, e);
		}),
		(b.createBytes = function (a, b) {
			for (var c = 0, d = 0, e = 0, g = new Array(b.length), h = new Array(b.length), j = 0; j < b.length; j++) {
				var k = b[j].dataCount,
					l = b[j].totalCount - k;
				(d = Math.max(d, k)), (e = Math.max(e, l)), (g[j] = new Array(k));
				for (var m = 0; m < g[j].length; m++) g[j][m] = 255 & a.buffer[m + c];
				c += k;
				var n = f.getErrorCorrectPolynomial(l),
					o = new i(g[j], n.getLength() - 1),
					p = o.mod(n);
				h[j] = new Array(n.getLength() - 1);
				for (var m = 0; m < h[j].length; m++) {
					var q = m + p.getLength() - h[j].length;
					h[j][m] = q >= 0 ? p.get(q) : 0;
				}
			}
			for (var r = 0, m = 0; m < b.length; m++) r += b[m].totalCount;
			for (var s = new Array(r), t = 0, m = 0; d > m; m++) for (var j = 0; j < b.length; j++) m < g[j].length && (s[t++] = g[j][m]);
			for (var m = 0; e > m; m++) for (var j = 0; j < b.length; j++) m < h[j].length && (s[t++] = h[j][m]);
			return s;
		});
	for (
		var c = { MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4, MODE_KANJI: 8 },
			d = { L: 1, M: 0, Q: 3, H: 2 },
			e = { PATTERN000: 0, PATTERN001: 1, PATTERN010: 2, PATTERN011: 3, PATTERN100: 4, PATTERN101: 5, PATTERN110: 6, PATTERN111: 7 },
			f = {
				PATTERN_POSITION_TABLE: [
					[],
					[6, 18],
					[6, 22],
					[6, 26],
					[6, 30],
					[6, 34],
					[6, 22, 38],
					[6, 24, 42],
					[6, 26, 46],
					[6, 28, 50],
					[6, 30, 54],
					[6, 32, 58],
					[6, 34, 62],
					[6, 26, 46, 66],
					[6, 26, 48, 70],
					[6, 26, 50, 74],
					[6, 30, 54, 78],
					[6, 30, 56, 82],
					[6, 30, 58, 86],
					[6, 34, 62, 90],
					[6, 28, 50, 72, 94],
					[6, 26, 50, 74, 98],
					[6, 30, 54, 78, 102],
					[6, 28, 54, 80, 106],
					[6, 32, 58, 84, 110],
					[6, 30, 58, 86, 114],
					[6, 34, 62, 90, 118],
					[6, 26, 50, 74, 98, 122],
					[6, 30, 54, 78, 102, 126],
					[6, 26, 52, 78, 104, 130],
					[6, 30, 56, 82, 108, 134],
					[6, 34, 60, 86, 112, 138],
					[6, 30, 58, 86, 114, 142],
					[6, 34, 62, 90, 118, 146],
					[6, 30, 54, 78, 102, 126, 150],
					[6, 24, 50, 76, 102, 128, 154],
					[6, 28, 54, 80, 106, 132, 158],
					[6, 32, 58, 84, 110, 136, 162],
					[6, 26, 54, 82, 110, 138, 166],
					[6, 30, 58, 86, 114, 142, 170]
				],
				G15: 1335,
				G18: 7973,
				G15_MASK: 21522,
				getBCHTypeInfo: function (a) {
					for (var b = a << 10; f.getBCHDigit(b) - f.getBCHDigit(f.G15) >= 0; ) b ^= f.G15 << (f.getBCHDigit(b) - f.getBCHDigit(f.G15));
					return ((a << 10) | b) ^ f.G15_MASK;
				},
				getBCHTypeNumber: function (a) {
					for (var b = a << 12; f.getBCHDigit(b) - f.getBCHDigit(f.G18) >= 0; ) b ^= f.G18 << (f.getBCHDigit(b) - f.getBCHDigit(f.G18));
					return (a << 12) | b;
				},
				getBCHDigit: function (a) {
					for (var b = 0; 0 != a; ) b++, (a >>>= 1);
					return b;
				},
				getPatternPosition: function (a) {
					return f.PATTERN_POSITION_TABLE[a - 1];
				},
				getMask: function (a, b, c) {
					switch (a) {
						case e.PATTERN000:
							return 0 == (b + c) % 2;
						case e.PATTERN001:
							return 0 == b % 2;
						case e.PATTERN010:
							return 0 == c % 3;
						case e.PATTERN011:
							return 0 == (b + c) % 3;
						case e.PATTERN100:
							return 0 == (Math.floor(b / 2) + Math.floor(c / 3)) % 2;
						case e.PATTERN101:
							return 0 == ((b * c) % 2) + ((b * c) % 3);
						case e.PATTERN110:
							return 0 == (((b * c) % 2) + ((b * c) % 3)) % 2;
						case e.PATTERN111:
							return 0 == (((b * c) % 3) + ((b + c) % 2)) % 2;
						default:
							throw new Error('bad maskPattern:' + a);
					}
				},
				getErrorCorrectPolynomial: function (a) {
					for (var b = new i([1], 0), c = 0; a > c; c++) b = b.multiply(new i([1, g.gexp(c)], 0));
					return b;
				},
				getLengthInBits: function (a, b) {
					if (b >= 1 && 10 > b)
						switch (a) {
							case c.MODE_NUMBER:
								return 10;
							case c.MODE_ALPHA_NUM:
								return 9;
							case c.MODE_8BIT_BYTE:
								return 8;
							case c.MODE_KANJI:
								return 8;
							default:
								throw new Error('mode:' + a);
						}
					else if (27 > b)
						switch (a) {
							case c.MODE_NUMBER:
								return 12;
							case c.MODE_ALPHA_NUM:
								return 11;
							case c.MODE_8BIT_BYTE:
								return 16;
							case c.MODE_KANJI:
								return 10;
							default:
								throw new Error('mode:' + a);
						}
					else {
						if (!(41 > b)) throw new Error('type:' + b);
						switch (a) {
							case c.MODE_NUMBER:
								return 14;
							case c.MODE_ALPHA_NUM:
								return 13;
							case c.MODE_8BIT_BYTE:
								return 16;
							case c.MODE_KANJI:
								return 12;
							default:
								throw new Error('mode:' + a);
						}
					}
				},
				getLostPoint: function (a) {
					for (var b = a.getModuleCount(), c = 0, d = 0; b > d; d++)
						for (var e = 0; b > e; e++) {
							for (var f = 0, g = a.isDark(d, e), h = -1; 1 >= h; h++) if (!(0 > d + h || d + h >= b)) for (var i = -1; 1 >= i; i++) 0 > e + i || e + i >= b || ((0 != h || 0 != i) && g == a.isDark(d + h, e + i) && f++);
							f > 5 && (c += 3 + f - 5);
						}
					for (var d = 0; b - 1 > d; d++)
						for (var e = 0; b - 1 > e; e++) {
							var j = 0;
							a.isDark(d, e) && j++, a.isDark(d + 1, e) && j++, a.isDark(d, e + 1) && j++, a.isDark(d + 1, e + 1) && j++, (0 == j || 4 == j) && (c += 3);
						}
					for (var d = 0; b > d; d++) for (var e = 0; b - 6 > e; e++) a.isDark(d, e) && !a.isDark(d, e + 1) && a.isDark(d, e + 2) && a.isDark(d, e + 3) && a.isDark(d, e + 4) && !a.isDark(d, e + 5) && a.isDark(d, e + 6) && (c += 40);
					for (var e = 0; b > e; e++) for (var d = 0; b - 6 > d; d++) a.isDark(d, e) && !a.isDark(d + 1, e) && a.isDark(d + 2, e) && a.isDark(d + 3, e) && a.isDark(d + 4, e) && !a.isDark(d + 5, e) && a.isDark(d + 6, e) && (c += 40);
					for (var k = 0, e = 0; b > e; e++) for (var d = 0; b > d; d++) a.isDark(d, e) && k++;
					var l = Math.abs((100 * k) / b / b - 50) / 5;
					return (c += 10 * l);
				}
			},
			g = {
				glog: function (a) {
					if (1 > a) throw new Error('glog(' + a + ')');
					return g.LOG_TABLE[a];
				},
				gexp: function (a) {
					for (; 0 > a; ) a += 255;
					for (; a >= 256; ) a -= 255;
					return g.EXP_TABLE[a];
				},
				EXP_TABLE: new Array(256),
				LOG_TABLE: new Array(256)
			},
			h = 0;
		8 > h;
		h++
	)
		g.EXP_TABLE[h] = 1 << h;
	for (var h = 8; 256 > h; h++) g.EXP_TABLE[h] = g.EXP_TABLE[h - 4] ^ g.EXP_TABLE[h - 5] ^ g.EXP_TABLE[h - 6] ^ g.EXP_TABLE[h - 8];
	for (var h = 0; 255 > h; h++) g.LOG_TABLE[g.EXP_TABLE[h]] = h;
	(i.prototype = {
		get: function (a) {
			return this.num[a];
		},
		getLength: function () {
			return this.num.length;
		},
		multiply: function (a) {
			for (var b = new Array(this.getLength() + a.getLength() - 1), c = 0; c < this.getLength(); c++) for (var d = 0; d < a.getLength(); d++) b[c + d] ^= g.gexp(g.glog(this.get(c)) + g.glog(a.get(d)));
			return new i(b, 0);
		},
		mod: function (a) {
			if (this.getLength() - a.getLength() < 0) return this;
			for (var b = g.glog(this.get(0)) - g.glog(a.get(0)), c = new Array(this.getLength()), d = 0; d < this.getLength(); d++) c[d] = this.get(d);
			for (var d = 0; d < a.getLength(); d++) c[d] ^= g.gexp(g.glog(a.get(d)) + b);
			return new i(c, 0).mod(a);
		}
	}),
		(j.RS_BLOCK_TABLE = [
			[1, 26, 19],
			[1, 26, 16],
			[1, 26, 13],
			[1, 26, 9],
			[1, 44, 34],
			[1, 44, 28],
			[1, 44, 22],
			[1, 44, 16],
			[1, 70, 55],
			[1, 70, 44],
			[2, 35, 17],
			[2, 35, 13],
			[1, 100, 80],
			[2, 50, 32],
			[2, 50, 24],
			[4, 25, 9],
			[1, 134, 108],
			[2, 67, 43],
			[2, 33, 15, 2, 34, 16],
			[2, 33, 11, 2, 34, 12],
			[2, 86, 68],
			[4, 43, 27],
			[4, 43, 19],
			[4, 43, 15],
			[2, 98, 78],
			[4, 49, 31],
			[2, 32, 14, 4, 33, 15],
			[4, 39, 13, 1, 40, 14],
			[2, 121, 97],
			[2, 60, 38, 2, 61, 39],
			[4, 40, 18, 2, 41, 19],
			[4, 40, 14, 2, 41, 15],
			[2, 146, 116],
			[3, 58, 36, 2, 59, 37],
			[4, 36, 16, 4, 37, 17],
			[4, 36, 12, 4, 37, 13],
			[2, 86, 68, 2, 87, 69],
			[4, 69, 43, 1, 70, 44],
			[6, 43, 19, 2, 44, 20],
			[6, 43, 15, 2, 44, 16],
			[4, 101, 81],
			[1, 80, 50, 4, 81, 51],
			[4, 50, 22, 4, 51, 23],
			[3, 36, 12, 8, 37, 13],
			[2, 116, 92, 2, 117, 93],
			[6, 58, 36, 2, 59, 37],
			[4, 46, 20, 6, 47, 21],
			[7, 42, 14, 4, 43, 15],
			[4, 133, 107],
			[8, 59, 37, 1, 60, 38],
			[8, 44, 20, 4, 45, 21],
			[12, 33, 11, 4, 34, 12],
			[3, 145, 115, 1, 146, 116],
			[4, 64, 40, 5, 65, 41],
			[11, 36, 16, 5, 37, 17],
			[11, 36, 12, 5, 37, 13],
			[5, 109, 87, 1, 110, 88],
			[5, 65, 41, 5, 66, 42],
			[5, 54, 24, 7, 55, 25],
			[11, 36, 12],
			[5, 122, 98, 1, 123, 99],
			[7, 73, 45, 3, 74, 46],
			[15, 43, 19, 2, 44, 20],
			[3, 45, 15, 13, 46, 16],
			[1, 135, 107, 5, 136, 108],
			[10, 74, 46, 1, 75, 47],
			[1, 50, 22, 15, 51, 23],
			[2, 42, 14, 17, 43, 15],
			[5, 150, 120, 1, 151, 121],
			[9, 69, 43, 4, 70, 44],
			[17, 50, 22, 1, 51, 23],
			[2, 42, 14, 19, 43, 15],
			[3, 141, 113, 4, 142, 114],
			[3, 70, 44, 11, 71, 45],
			[17, 47, 21, 4, 48, 22],
			[9, 39, 13, 16, 40, 14],
			[3, 135, 107, 5, 136, 108],
			[3, 67, 41, 13, 68, 42],
			[15, 54, 24, 5, 55, 25],
			[15, 43, 15, 10, 44, 16],
			[4, 144, 116, 4, 145, 117],
			[17, 68, 42],
			[17, 50, 22, 6, 51, 23],
			[19, 46, 16, 6, 47, 17],
			[2, 139, 111, 7, 140, 112],
			[17, 74, 46],
			[7, 54, 24, 16, 55, 25],
			[34, 37, 13],
			[4, 151, 121, 5, 152, 122],
			[4, 75, 47, 14, 76, 48],
			[11, 54, 24, 14, 55, 25],
			[16, 45, 15, 14, 46, 16],
			[6, 147, 117, 4, 148, 118],
			[6, 73, 45, 14, 74, 46],
			[11, 54, 24, 16, 55, 25],
			[30, 46, 16, 2, 47, 17],
			[8, 132, 106, 4, 133, 107],
			[8, 75, 47, 13, 76, 48],
			[7, 54, 24, 22, 55, 25],
			[22, 45, 15, 13, 46, 16],
			[10, 142, 114, 2, 143, 115],
			[19, 74, 46, 4, 75, 47],
			[28, 50, 22, 6, 51, 23],
			[33, 46, 16, 4, 47, 17],
			[8, 152, 122, 4, 153, 123],
			[22, 73, 45, 3, 74, 46],
			[8, 53, 23, 26, 54, 24],
			[12, 45, 15, 28, 46, 16],
			[3, 147, 117, 10, 148, 118],
			[3, 73, 45, 23, 74, 46],
			[4, 54, 24, 31, 55, 25],
			[11, 45, 15, 31, 46, 16],
			[7, 146, 116, 7, 147, 117],
			[21, 73, 45, 7, 74, 46],
			[1, 53, 23, 37, 54, 24],
			[19, 45, 15, 26, 46, 16],
			[5, 145, 115, 10, 146, 116],
			[19, 75, 47, 10, 76, 48],
			[15, 54, 24, 25, 55, 25],
			[23, 45, 15, 25, 46, 16],
			[13, 145, 115, 3, 146, 116],
			[2, 74, 46, 29, 75, 47],
			[42, 54, 24, 1, 55, 25],
			[23, 45, 15, 28, 46, 16],
			[17, 145, 115],
			[10, 74, 46, 23, 75, 47],
			[10, 54, 24, 35, 55, 25],
			[19, 45, 15, 35, 46, 16],
			[17, 145, 115, 1, 146, 116],
			[14, 74, 46, 21, 75, 47],
			[29, 54, 24, 19, 55, 25],
			[11, 45, 15, 46, 46, 16],
			[13, 145, 115, 6, 146, 116],
			[14, 74, 46, 23, 75, 47],
			[44, 54, 24, 7, 55, 25],
			[59, 46, 16, 1, 47, 17],
			[12, 151, 121, 7, 152, 122],
			[12, 75, 47, 26, 76, 48],
			[39, 54, 24, 14, 55, 25],
			[22, 45, 15, 41, 46, 16],
			[6, 151, 121, 14, 152, 122],
			[6, 75, 47, 34, 76, 48],
			[46, 54, 24, 10, 55, 25],
			[2, 45, 15, 64, 46, 16],
			[17, 152, 122, 4, 153, 123],
			[29, 74, 46, 14, 75, 47],
			[49, 54, 24, 10, 55, 25],
			[24, 45, 15, 46, 46, 16],
			[4, 152, 122, 18, 153, 123],
			[13, 74, 46, 32, 75, 47],
			[48, 54, 24, 14, 55, 25],
			[42, 45, 15, 32, 46, 16],
			[20, 147, 117, 4, 148, 118],
			[40, 75, 47, 7, 76, 48],
			[43, 54, 24, 22, 55, 25],
			[10, 45, 15, 67, 46, 16],
			[19, 148, 118, 6, 149, 119],
			[18, 75, 47, 31, 76, 48],
			[34, 54, 24, 34, 55, 25],
			[20, 45, 15, 61, 46, 16]
		]),
		(j.getRSBlocks = function (a, b) {
			var c = j.getRsBlockTable(a, b);
			if (void 0 == c) throw new Error('bad rs block @ typeNumber:' + a + '/errorCorrectLevel:' + b);
			for (var d = c.length / 3, e = [], f = 0; d > f; f++) for (var g = c[3 * f + 0], h = c[3 * f + 1], i = c[3 * f + 2], k = 0; g > k; k++) e.push(new j(h, i));
			return e;
		}),
		(j.getRsBlockTable = function (a, b) {
			switch (b) {
				case d.L:
					return j.RS_BLOCK_TABLE[4 * (a - 1) + 0];
				case d.M:
					return j.RS_BLOCK_TABLE[4 * (a - 1) + 1];
				case d.Q:
					return j.RS_BLOCK_TABLE[4 * (a - 1) + 2];
				case d.H:
					return j.RS_BLOCK_TABLE[4 * (a - 1) + 3];
				default:
					return void 0;
			}
		}),
		(k.prototype = {
			get: function (a) {
				var b = Math.floor(a / 8);
				return 1 == (1 & (this.buffer[b] >>> (7 - (a % 8))));
			},
			put: function (a, b) {
				for (var c = 0; b > c; c++) this.putBit(1 == (1 & (a >>> (b - c - 1))));
			},
			getLengthInBits: function () {
				return this.length;
			},
			putBit: function (a) {
				var b = Math.floor(this.length / 8);
				this.buffer.length <= b && this.buffer.push(0), a && (this.buffer[b] |= 128 >>> this.length % 8), this.length++;
			}
		});
	var l = [
			[17, 14, 11, 7],
			[32, 26, 20, 14],
			[53, 42, 32, 24],
			[78, 62, 46, 34],
			[106, 84, 60, 44],
			[134, 106, 74, 58],
			[154, 122, 86, 64],
			[192, 152, 108, 84],
			[230, 180, 130, 98],
			[271, 213, 151, 119],
			[321, 251, 177, 137],
			[367, 287, 203, 155],
			[425, 331, 241, 177],
			[458, 362, 258, 194],
			[520, 412, 292, 220],
			[586, 450, 322, 250],
			[644, 504, 364, 280],
			[718, 560, 394, 310],
			[792, 624, 442, 338],
			[858, 666, 482, 382],
			[929, 711, 509, 403],
			[1003, 779, 565, 439],
			[1091, 857, 611, 461],
			[1171, 911, 661, 511],
			[1273, 997, 715, 535],
			[1367, 1059, 751, 593],
			[1465, 1125, 805, 625],
			[1528, 1190, 868, 658],
			[1628, 1264, 908, 698],
			[1732, 1370, 982, 742],
			[1840, 1452, 1030, 790],
			[1952, 1538, 1112, 842],
			[2068, 1628, 1168, 898],
			[2188, 1722, 1228, 958],
			[2303, 1809, 1283, 983],
			[2431, 1911, 1351, 1051],
			[2563, 1989, 1423, 1093],
			[2699, 2099, 1499, 1139],
			[2809, 2213, 1579, 1219],
			[2953, 2331, 1663, 1273]
		],
		o = (function () {
			var a = function (a, b) {
				(this._el = a), (this._htOption = b);
			};
			return (
				(a.prototype.draw = function (a) {
					function g(a, b) {
						var c = document.createElementNS('http://www.w3.org/2000/svg', a);
						for (var d in b) b.hasOwnProperty(d) && c.setAttribute(d, b[d]);
						return c;
					}
					var b = this._htOption,
						c = this._el,
						d = a.getModuleCount();
					Math.floor(b.width / d), Math.floor(b.height / d), this.clear();
					var h = g('svg', { viewBox: '0 0 ' + String(d) + ' ' + String(d), width: '100%', height: '100%', fill: b.colorLight });
					h.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', 'http://www.w3.org/1999/xlink'), c.appendChild(h), h.appendChild(g('rect', { fill: b.colorDark, width: '1', height: '1', id: 'template' }));
					for (var i = 0; d > i; i++)
						for (var j = 0; d > j; j++)
							if (a.isDark(i, j)) {
								var k = g('use', { x: String(i), y: String(j) });
								k.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#template'), h.appendChild(k);
							}
				}),
				(a.prototype.clear = function () {
					for (; this._el.hasChildNodes(); ) this._el.removeChild(this._el.lastChild);
				}),
				a
			);
		})(),
		p = 'svg' === document.documentElement.tagName.toLowerCase(),
		q = p
			? o
			: m()
			? (function () {
					function a() {
						(this._elImage.src = this._elCanvas.toDataURL('image/png')), (this._elImage.style.display = 'block'), (this._elCanvas.style.display = 'none');
					}
					function d(a, b) {
						var c = this;
						if (((c._fFail = b), (c._fSuccess = a), null === c._bSupportDataURI)) {
							var d = document.createElement('img'),
								e = function () {
									(c._bSupportDataURI = !1), c._fFail && _fFail.call(c);
								},
								f = function () {
									(c._bSupportDataURI = !0), c._fSuccess && c._fSuccess.call(c);
								};
							return (d.onabort = e), (d.onerror = e), (d.onload = f), (d.src = 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='), void 0;
						}
						c._bSupportDataURI === !0 && c._fSuccess ? c._fSuccess.call(c) : c._bSupportDataURI === !1 && c._fFail && c._fFail.call(c);
					}
					if (this._android && this._android <= 2.1) {
						var b = 1 / window.devicePixelRatio,
							c = CanvasRenderingContext2D.prototype.drawImage;
						CanvasRenderingContext2D.prototype.drawImage = function (a, d, e, f, g, h, i, j) {
							if ('nodeName' in a && /img/i.test(a.nodeName)) for (var l = arguments.length - 1; l >= 1; l--) arguments[l] = arguments[l] * b;
							else 'undefined' == typeof j && ((arguments[1] *= b), (arguments[2] *= b), (arguments[3] *= b), (arguments[4] *= b));
							c.apply(this, arguments);
						};
					}
					var e = function (a, b) {
						(this._bIsPainted = !1), (this._android = n()), (this._htOption = b), (this._elCanvas = document.createElement('canvas')), (this._elCanvas.width = b.width), (this._elCanvas.height = b.height), a.appendChild(this._elCanvas), (this._el = a), (this._oContext = this._elCanvas.getContext('2d')), (this._bIsPainted = !1), (this._elImage = document.createElement('img')), (this._elImage.style.display = 'none'), this._el.appendChild(this._elImage), (this._bSupportDataURI = null);
					};
					return (
						(e.prototype.draw = function (a) {
							var b = this._elImage,
								c = this._oContext,
								d = this._htOption,
								e = a.getModuleCount(),
								f = d.width / e,
								g = d.height / e,
								h = Math.round(f),
								i = Math.round(g);
							(b.style.display = 'none'), this.clear();
							for (var j = 0; e > j; j++)
								for (var k = 0; e > k; k++) {
									var l = a.isDark(j, k),
										m = k * f,
										n = j * g;
									(c.strokeStyle = l ? d.colorDark : d.colorLight), (c.lineWidth = 1), (c.fillStyle = l ? d.colorDark : d.colorLight), c.fillRect(m, n, f, g), c.strokeRect(Math.floor(m) + 0.5, Math.floor(n) + 0.5, h, i), c.strokeRect(Math.ceil(m) - 0.5, Math.ceil(n) - 0.5, h, i);
								}
							this._bIsPainted = !0;
						}),
						(e.prototype.makeImage = function () {
							this._bIsPainted && d.call(this, a);
						}),
						(e.prototype.isPainted = function () {
							return this._bIsPainted;
						}),
						(e.prototype.clear = function () {
							this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height), (this._bIsPainted = !1);
						}),
						(e.prototype.round = function (a) {
							return a ? Math.floor(1e3 * a) / 1e3 : a;
						}),
						e
					);
			  })()
			: (function () {
					var a = function (a, b) {
						(this._el = a), (this._htOption = b);
					};
					return (
						(a.prototype.draw = function (a) {
							for (var b = this._htOption, c = this._el, d = a.getModuleCount(), e = Math.floor(b.width / d), f = Math.floor(b.height / d), g = ['<table style="border:0;border-collapse:collapse;">'], h = 0; d > h; h++) {
								g.push('<tr>');
								for (var i = 0; d > i; i++) g.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + e + 'px;height:' + f + 'px;background-color:' + (a.isDark(h, i) ? b.colorDark : b.colorLight) + ';"></td>');
								g.push('</tr>');
							}
							g.push('</table>'), (c.innerHTML = g.join(''));
							var j = c.childNodes[0],
								k = (b.width - j.offsetWidth) / 2,
								l = (b.height - j.offsetHeight) / 2;
							k > 0 && l > 0 && (j.style.margin = l + 'px ' + k + 'px');
						}),
						(a.prototype.clear = function () {
							this._el.innerHTML = '';
						}),
						a
					);
			  })();
	(QRCode = function (a, b) {
		if (((this._htOption = { width: 256, height: 256, typeNumber: 4, colorDark: '#000000', colorLight: '#ffffff', correctLevel: d.H }), 'string' == typeof b && (b = { text: b }), b)) for (var c in b) this._htOption[c] = b[c];
		'string' == typeof a && (a = document.getElementById(a)), (this._android = n()), (this._el = a), (this._oQRCode = null), (this._oDrawing = new q(this._el, this._htOption)), this._htOption.text && this.makeCode(this._htOption.text);
	}),
		(QRCode.prototype.makeCode = function (a) {
			(this._oQRCode = new b(r(a, this._htOption.correctLevel), this._htOption.correctLevel)), this._oQRCode.addData(a), this._oQRCode.make(), (this._el.title = a), this._oDrawing.draw(this._oQRCode), this.makeImage();
		}),
		(QRCode.prototype.makeImage = function () {
			'function' == typeof this._oDrawing.makeImage && (!this._android || this._android >= 3) && this._oDrawing.makeImage();
		}),
		(QRCode.prototype.clear = function () {
			this._oDrawing.clear();
		}),
		(QRCode.CorrectLevel = d);
})();
