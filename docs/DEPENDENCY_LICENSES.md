# Guide 依赖许可清单

更新：2026-10-07。清单对应当前 Cargo.lock、两份 package-lock.json 和锁定版本包的原始许可声明。依赖变更时应同步更新清单和许可正文。

这是锁定依赖元数据清单，包含开发依赖和非 Linux 平台可选包，不表示它们全部进入发布制品。实际制品所含授权文本见 [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md)。许可证表达式按包原始声明记录，未将 OR 替换为 AND；缺失或特殊声明必须在发布前复核。

| 生态 | 包 | 版本 | 原始许可证声明 | 使用范围 | 本地许可文本 |
| --- | --- | --- | --- | --- | --- |
| Rust | adler2 | 2.0.1 | 0BSD OR MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | aho-corasick | 1.1.5 | Unlicense OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | android_system_properties | 0.1.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | anyhow | 1.0.104 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | argon2 | 0.5.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | async-compression | 0.4.43 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | atomic-waker | 1.1.2 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | autocfg | 1.5.1 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | axum | 0.8.9 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | axum-core | 0.5.6 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | axum-macros | 0.5.1 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | base64 | 0.22.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | base64ct | 1.8.3 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | bitflags | 2.13.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | blake2 | 0.10.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | block-buffer | 0.10.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | block-buffer | 0.12.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | bstr | 1.13.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | bumpalo | 3.20.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | bytes | 1.12.1 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | cc | 1.4.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | cfg-if | 1.0.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | cfg_aliases | 0.2.2 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | chacha20 | 0.10.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | chrono | 0.4.45 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | compression-codecs | 0.4.38 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | compression-core | 0.4.32 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | const-oid | 0.10.2 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | core-foundation-sys | 0.8.7 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | cpufeatures | 0.2.17 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | cpufeatures | 0.3.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | crc32fast | 1.5.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | crypto-common | 0.1.7 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | crypto-common | 0.2.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | data-encoding | 2.11.1 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | digest | 0.10.7 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | digest | 0.11.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | displaydoc | 0.2.7 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | errno | 0.3.14 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | fallible-iterator | 0.3.0 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | fallible-streaming-iterator | 0.1.9 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | filetime | 0.2.29 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | find-msvc-tools | 0.1.11 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | flate2 | 1.1.10 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | foldhash | 0.1.5 | Zlib | Cargo.lock (all targets) | 已收集 |
| Rust | form_urlencoded | 1.2.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-channel | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-core | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-io | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-macro | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-sink | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-task | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | futures-util | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | generic-array | 0.14.7 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | getrandom | 0.2.17 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | getrandom | 0.3.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | getrandom | 0.4.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | globset | 0.4.20 | Unlicense OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | hashbrown | 0.15.5 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | hashlink | 0.10.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | hex | 0.4.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | http | 1.5.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | http-body | 1.1.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | http-body-util | 0.1.5 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | httparse | 1.10.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | httpdate | 1.0.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | hybrid-array | 0.4.14 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | hyper | 1.11.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | hyper-rustls | 0.27.9 | Apache-2.0 OR ISC OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | hyper-util | 0.1.20 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | iana-time-zone | 0.1.65 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | iana-time-zone-haiku | 0.1.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_collections | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_locale_core | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_normalizer | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_normalizer_data | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_properties | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_properties_data | 2.3.0 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | icu_provider | 2.3.1 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | idna | 1.1.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | idna_adapter | 1.2.2 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | ipnet | 2.12.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | itoa | 1.0.18 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | js-sys | 0.3.104 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | lazy_static | 1.5.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | libc | 0.2.189 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | libsqlite3-sys | 0.35.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | litemap | 0.8.3 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | log | 0.4.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | lru-slab | 0.1.2 | MIT OR Apache-2.0 OR Zlib | Cargo.lock (all targets) | 已收集 |
| Rust | matchers | 0.2.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | matchit | 0.8.4 | MIT AND BSD-3-Clause | Cargo.lock (all targets) | 已收集 |
| Rust | memchr | 2.8.3 | Unlicense OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | mime | 0.3.17 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | mime_guess | 2.0.5 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | miniz_oxide | 0.9.1 | MIT OR Zlib OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | mio | 1.2.2 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | nu-ansi-term | 0.50.3 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | num-traits | 0.2.19 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | once_cell | 1.21.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | password-hash | 0.5.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | percent-encoding | 2.3.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | pin-project-lite | 0.2.17 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | pkg-config | 0.3.34 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | potential_utf | 0.1.6 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | ppv-lite86 | 0.2.21 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | proc-macro2 | 1.0.107 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | quinn | 0.11.11 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | quinn-proto | 0.11.17 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | quinn-udp | 0.5.15 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | quote | 1.0.47 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | r-efi | 5.3.0 | MIT OR Apache-2.0 OR LGPL-2.1-or-later | Cargo.lock (all targets) | 待复核/本平台未安装 |
| Rust | r-efi | 6.0.0 | MIT OR Apache-2.0 OR LGPL-2.1-or-later | Cargo.lock (all targets) | 待复核/本平台未安装 |
| Rust | rand | 0.9.5 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand | 0.10.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand_chacha | 0.9.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand_core | 0.6.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand_core | 0.9.5 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand_core | 0.10.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rand_pcg | 0.10.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | regex-automata | 0.4.18 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | regex-syntax | 0.8.11 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | reqwest | 0.12.28 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | ring | 0.17.14 | Apache-2.0 AND ISC | Cargo.lock (all targets) | 已收集 |
| Rust | rusqlite | 0.37.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rust-embed | 8.12.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rust-embed-impl | 8.12.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rust-embed-utils | 8.12.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rustc-hash | 2.1.3 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rustls | 0.23.43 | Apache-2.0 OR ISC OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | rustls-pki-types | 1.15.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | rustls-webpki | 0.103.15 | ISC | Cargo.lock (all targets) | 已收集 |
| Rust | rustversion | 1.0.23 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | ryu | 1.0.23 | Apache-2.0 OR BSL-1.0 | Cargo.lock (all targets) | 已收集 |
| Rust | same-file | 1.0.6 | Unlicense/MIT | Cargo.lock (all targets) | 已收集 |
| Rust | serde | 1.0.229 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | serde_core | 1.0.229 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | serde_derive | 1.0.229 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | serde_json | 1.0.151 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | serde_path_to_error | 0.1.20 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | serde_urlencoded | 0.7.1 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | sha1 | 0.10.7 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | sha2 | 0.10.9 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | sha2 | 0.11.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | sharded-slab | 0.1.7 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | shlex | 2.0.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | signal-hook-registry | 1.4.8 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | simd-adler32 | 0.3.10 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | slab | 0.4.12 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | smallvec | 1.15.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | socket2 | 0.6.5 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | stable_deref_trait | 1.2.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | subtle | 2.6.1 | BSD-3-Clause | Cargo.lock (all targets) | 已收集 |
| Rust | syn | 2.0.119 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | syn | 3.0.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | sync_wrapper | 1.0.2 | Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | synstructure | 0.13.2 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tar | 0.4.46 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | thiserror | 2.0.20 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | thiserror-impl | 2.0.20 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | thread_local | 1.1.10 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | tinystr | 0.8.4 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | tinyvec | 1.12.0 | Zlib OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tinyvec_macros | 0.1.1 | MIT OR Apache-2.0 OR Zlib | Cargo.lock (all targets) | 已收集 |
| Rust | tokio | 1.53.1 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tokio-macros | 2.7.2 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tokio-rustls | 0.26.4 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | tokio-tungstenite | 0.29.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tokio-util | 0.7.19 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tower | 0.5.3 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tower-http | 0.6.11 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tower-layer | 0.3.3 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tower-service | 0.3.3 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tracing | 0.1.44 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tracing-attributes | 0.1.31 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tracing-core | 0.1.36 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tracing-log | 0.2.0 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tracing-subscriber | 0.3.23 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | try-lock | 0.2.5 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | tungstenite | 0.29.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | typenum | 1.20.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | unicase | 2.9.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | unicode-ident | 1.0.24 | (MIT OR Apache-2.0) AND Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | untrusted | 0.9.0 | ISC | Cargo.lock (all targets) | 已收集 |
| Rust | url | 2.5.8 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | utf8_iter | 1.0.4 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | valuable | 0.1.1 | MIT | Cargo.lock (all targets) | 待复核/本平台未安装 |
| Rust | vcpkg | 0.2.15 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | version_check | 0.9.5 | MIT/Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | walkdir | 2.5.0 | Unlicense/MIT | Cargo.lock (all targets) | 已收集 |
| Rust | want | 0.3.1 | MIT | Cargo.lock (all targets) | 已收集 |
| Rust | wasi | 0.11.1+wasi-snapshot-preview1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | wasip2 | 1.0.4+wasi-0.2.12 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-bindgen | 0.2.127 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-bindgen-futures | 0.4.77 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-bindgen-macro | 0.2.127 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-bindgen-macro-support | 0.2.127 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-bindgen-shared | 0.2.127 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wasm-streams | 0.4.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | web-sys | 0.3.104 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | web-time | 1.1.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | webpki-roots | 1.0.9 | CDLA-Permissive-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | winapi-util | 0.1.11 | Unlicense OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | windows-core | 0.62.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-implement | 0.60.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-interface | 0.59.3 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-link | 0.2.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-result | 0.4.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-strings | 0.5.1 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-sys | 0.52.0 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-sys | 0.61.2 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows-targets | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_aarch64_gnullvm | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_aarch64_msvc | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_i686_gnu | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_i686_gnullvm | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_i686_msvc | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_x86_64_gnu | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_x86_64_gnullvm | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | windows_x86_64_msvc | 0.52.6 | MIT OR Apache-2.0 | Cargo.lock (all targets) | 已收集 |
| Rust | wit-bindgen | 0.57.1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | writeable | 0.6.4 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | yoke | 0.8.3 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | yoke-derive | 0.8.2 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zerocopy | 0.8.56 | BSD-2-Clause OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | zerocopy-derive | 0.8.56 | BSD-2-Clause OR Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | zerofrom | 0.1.8 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zerofrom-derive | 0.1.7 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zeroize | 1.9.0 | Apache-2.0 OR MIT | Cargo.lock (all targets) | 已收集 |
| Rust | zerotrie | 0.2.5 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zerovec | 0.11.8 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zerovec-derive | 0.11.6 | Unicode-3.0 | Cargo.lock (all targets) | 已收集 |
| Rust | zlib-rs | 0.6.7 | Zlib | Cargo.lock (all targets) | 已收集 |
| Rust | zmij | 1.0.23 | MIT | Cargo.lock (all targets) | 已收集 |
| npm | @floating-ui/core | 1.8.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @floating-ui/dom | 1.8.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @floating-ui/react-dom | 2.1.9 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @floating-ui/utils | 0.2.12 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/gen-mapping | 0.3.13 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/remapping | 2.3.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/resolve-uri | 3.1.2 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/sourcemap-codec | 1.5.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/trace-mapping | 0.3.31 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @oxc-project/types | 0.147.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @oxlint/binding-android-arm-eabi | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-android-arm64 | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-darwin-arm64 | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-darwin-x64 | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-freebsd-x64 | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm-gnueabihf | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm-musleabihf | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm64-gnu | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm64-musl | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-ppc64-gnu | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-riscv64-gnu | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-riscv64-musl | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-s390x-gnu | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-x64-gnu | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-x64-musl | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-openharmony-arm64 | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-arm64-msvc | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-ia32-msvc | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-x64-msvc | 1.80.0 | MIT | guide/web-admin (devDependencies) | 待复核/本平台未安装 |
| npm | @radix-ui/number | 1.1.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/primitive | 1.1.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-accessible-icon | 1.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-accordion | 1.2.20 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-alert-dialog | 1.1.23 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-arrow | 1.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-aspect-ratio | 1.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-avatar | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-checkbox | 1.3.11 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-collapsible | 1.1.20 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-collection | 1.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-compose-refs | 1.1.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-context | 1.2.2 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-context-menu | 2.3.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-dialog | 1.1.23 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-direction | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-dismissable-layer | 1.1.19 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-dropdown-menu | 2.1.24 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-focus-guards | 1.1.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-focus-scope | 1.1.16 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-form | 0.1.16 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-hover-card | 1.1.23 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-id | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-label | 2.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-menu | 2.1.24 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-menubar | 1.1.24 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-navigation-menu | 1.2.22 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-one-time-password-field | 0.1.16 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-password-toggle-field | 0.1.11 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-popover | 1.1.23 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-popper | 1.3.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-portal | 1.1.17 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-presence | 1.1.10 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-primitive | 2.1.10 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-progress | 1.1.16 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-radio-group | 1.4.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-roving-focus | 1.1.19 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-scroll-area | 1.2.18 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-select | 2.3.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-separator | 1.1.15 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-slider | 1.4.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-slot | 1.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-switch | 1.3.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-tabs | 1.1.21 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-toast | 1.2.23 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-toggle | 1.1.18 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-toggle-group | 1.1.19 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-toolbar | 1.1.19 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-tooltip | 1.2.16 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-callback-ref | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-controllable-state | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-effect-event | 0.0.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-escape-keydown | 1.1.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-is-hydrated | 0.1.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-layout-effect | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-previous | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-rect | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-use-size | 1.1.4 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-visually-hidden | 1.2.11 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/rect | 1.1.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @rolldown/binding-android-arm-eabi | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-android-arm64 | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-darwin-arm64 | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-darwin-x64 | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-freebsd-x64 | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm-gnueabihf | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm64-gnu | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm64-musl | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-ppc64-gnu | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-s390x-gnu | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-x64-gnu | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-x64-musl | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-openharmony-arm64 | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-win32-arm64-msvc | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-win32-x64-msvc | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/pluginutils | 1.0.1 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/node | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss-android-arm64 | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-arm64 | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-x64 | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-freebsd-x64 | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm-gnueabihf | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-gnu | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-musl | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-gnu | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-musl | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-arm64-msvc | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-x64-msvc | 1.32.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/oxide | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/oxide-android-arm64 | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-darwin-arm64 | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-darwin-x64 | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-freebsd-x64 | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm-gnueabihf | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm64-gnu | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm64-musl | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-x64-gnu | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-x64-musl | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-wasm32-wasi | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-win32-arm64-msvc | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-win32-x64-msvc | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/vite | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/node | 24.13.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/react | 19.2.18 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/react-dom | 19.2.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @vitejs/plugin-react | 6.1.0 | MIT | guide/web-admin (devDependencies) | 已收集 |
| npm | aria-hidden | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | class-variance-authority | 0.7.1 | Apache-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | clsx | 2.1.1 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | csstype | 3.2.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | detect-libc | 2.1.2 | Apache-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | detect-node-es | 1.1.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | enhanced-resolve | 5.24.5 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | fdir | 6.5.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | fsevents | 2.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | get-nonce | 1.0.1 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | graceful-fs | 4.2.11 | ISC | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | jiti | 2.7.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss-android-arm64 | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-arm64 | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-x64 | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-freebsd-x64 | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm-gnueabihf | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-gnu | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-musl | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-gnu | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-musl | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-arm64-msvc | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-x64-msvc | 1.33.0 | MPL-2.0 | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lucide-react | 1.34.0 | ISC | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | magic-string | 0.30.21 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | nanoid | 3.3.20 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | oxlint | 1.80.0 | MIT | guide/web-admin (devDependencies) | 已收集 |
| npm | picocolors | 1.1.1 | ISC | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | picomatch | 4.0.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | postcss | 8.5.29 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | radix-ui | 1.6.7 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react | 19.2.8 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-dom | 19.2.8 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-remove-scroll | 2.7.2 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-remove-scroll-bar | 2.3.8 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | react-style-singleton | 2.2.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | rolldown | 1.2.6 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | scheduler | 0.27.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | sonner | 2.0.8 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | source-map-js | 1.2.2 | BSD-3-Clause | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tailwind-merge | 3.6.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tailwindcss | 4.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tapable | 2.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tinyglobby | 0.2.17 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tslib | 2.8.1 | 0BSD | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tw-animate-css | 1.4.0 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | typescript | 6.0.3 | Apache-2.0 | guide/web-admin (devDependencies) | 已收集 |
| npm | undici-types | 7.18.2 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | use-callback-ref | 1.3.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | use-sidecar | 1.1.3 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | vite | 8.2.2 | MIT | guide/web-admin (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/gen-mapping | 0.3.13 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/remapping | 2.3.5 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/resolve-uri | 3.1.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/sourcemap-codec | 1.5.5 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @jridgewell/trace-mapping | 0.3.31 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @oxc-project/types | 0.147.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @oxlint/binding-android-arm-eabi | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-android-arm64 | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-darwin-arm64 | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-darwin-x64 | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-freebsd-x64 | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm-gnueabihf | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm-musleabihf | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm64-gnu | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-arm64-musl | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-ppc64-gnu | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-riscv64-gnu | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-riscv64-musl | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-s390x-gnu | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-x64-gnu | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-linux-x64-musl | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-openharmony-arm64 | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-arm64-msvc | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-ia32-msvc | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @oxlint/binding-win32-x64-msvc | 1.80.0 | MIT | navigation-theme (devDependencies) | 待复核/本平台未安装 |
| npm | @radix-ui/react-compose-refs | 1.1.5 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @radix-ui/react-slot | 1.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @reduxjs/toolkit | 2.12.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @rolldown/binding-android-arm-eabi | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-android-arm64 | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-darwin-arm64 | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-darwin-x64 | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-freebsd-x64 | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm-gnueabihf | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm64-gnu | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-arm64-musl | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-ppc64-gnu | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-s390x-gnu | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-x64-gnu | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-linux-x64-musl | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-openharmony-arm64 | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-win32-arm64-msvc | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/binding-win32-x64-msvc | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @rolldown/pluginutils | 1.0.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @standard-schema/spec | 1.1.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @standard-schema/utils | 0.3.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/node | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss-android-arm64 | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-arm64 | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-x64 | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-freebsd-x64 | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm-gnueabihf | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-gnu | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-musl | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-gnu | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-musl | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-arm64-msvc | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-x64-msvc | 1.32.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/oxide | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/oxide-android-arm64 | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-darwin-arm64 | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-darwin-x64 | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-freebsd-x64 | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm-gnueabihf | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm64-gnu | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-arm64-musl | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-x64-gnu | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-linux-x64-musl | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-wasm32-wasi | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-win32-arm64-msvc | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | @tailwindcss/oxide-win32-x64-msvc | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @tailwindcss/vite | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-array | 3.2.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-color | 3.1.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-ease | 3.0.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-interpolate | 3.0.4 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-path | 3.1.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-scale | 4.0.9 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-shape | 3.2.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-time | 3.0.4 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/d3-timer | 3.0.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/node | 24.13.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/react | 19.2.18 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @types/react-dom | 19.2.5 | MIT | navigation-theme (devDependencies) | 已收集 |
| npm | @types/use-sync-external-store | 0.0.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | @vitejs/plugin-react | 6.1.0 | MIT | navigation-theme (devDependencies) | 已收集 |
| npm | class-variance-authority | 0.7.1 | Apache-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | clsx | 2.1.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | country-flag-icons | 1.6.20 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | csstype | 3.2.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-array | 3.2.4 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-color | 3.1.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-ease | 3.0.1 | BSD-3-Clause | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-format | 3.1.2 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-interpolate | 3.0.1 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-path | 3.1.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-scale | 4.0.2 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-shape | 3.2.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-time | 3.1.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-time-format | 4.1.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | d3-timer | 3.0.1 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | decimal.js-light | 2.5.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | detect-libc | 2.1.2 | Apache-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | enhanced-resolve | 5.24.5 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | es-toolkit | 1.51.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | eventemitter3 | 5.0.4 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | fdir | 6.5.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | fsevents | 2.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | graceful-fs | 4.2.11 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | immer | 11.1.18 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | internmap | 2.0.3 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | jiti | 2.7.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lightningcss-android-arm64 | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-arm64 | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-darwin-x64 | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-freebsd-x64 | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm-gnueabihf | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-gnu | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-arm64-musl | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-gnu | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-linux-x64-musl | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-arm64-msvc | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | lightningcss-win32-x64-msvc | 1.33.0 | MPL-2.0 | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | lucide-react | 1.34.0 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | magic-string | 0.30.21 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | nanoid | 3.3.20 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | oxlint | 1.80.0 | MIT | navigation-theme (devDependencies) | 已收集 |
| npm | picocolors | 1.1.1 | ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | picomatch | 4.0.7 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | postcss | 8.5.29 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react | 19.2.8 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-dom | 19.2.8 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-is | 19.2.8 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | react-redux | 9.3.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | recharts | 3.10.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | redux | 5.0.1 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | redux-thunk | 3.1.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | reselect | 5.2.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | rolldown | 1.2.6 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | scheduler | 0.27.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | source-map-js | 1.2.2 | BSD-3-Clause | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tailwind-merge | 3.6.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tailwindcss | 4.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tapable | 2.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tiny-invariant | 1.3.3 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tinyglobby | 0.2.17 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | tslib | 2.8.1 | 0BSD | navigation-theme (dependencies/transitive；包含构建工具) | 待复核/本平台未安装 |
| npm | tw-animate-css | 1.4.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | typescript | 6.0.3 | Apache-2.0 | navigation-theme (devDependencies) | 已收集 |
| npm | undici-types | 7.18.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | use-sync-external-store | 1.6.0 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | victory-vendor | 37.3.6 | MIT AND ISC | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |
| npm | vite | 8.2.2 | MIT | navigation-theme (dependencies/transitive；包含构建工具) | 已收集 |

所有锁定包均取得许可证表达式；特殊表达式与本地未提供许可文本的包仍需按下表/制品平台复核。

## 未收集本地许可文本

仅表示当前本地缺少文本，不能推断无版权。非 Linux 平台可选包和开发包不等于发行时必需；发布前按 Linux 实际依赖/打包内容复核。

- Rust r-efi 5.3.0 — MIT OR Apache-2.0 OR LGPL-2.1-or-later；Cargo.lock (all targets)
- Rust r-efi 6.0.0 — MIT OR Apache-2.0 OR LGPL-2.1-or-later；Cargo.lock (all targets)
- Rust valuable 0.1.1 — MIT；Cargo.lock (all targets)
- npm @oxlint/binding-android-arm-eabi 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-android-arm64 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-darwin-arm64 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-darwin-x64 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-freebsd-x64 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-arm-gnueabihf 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-arm-musleabihf 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-arm64-gnu 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-arm64-musl 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-ppc64-gnu 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-riscv64-gnu 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-riscv64-musl 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-s390x-gnu 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-x64-gnu 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-linux-x64-musl 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-openharmony-arm64 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-win32-arm64-msvc 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-win32-ia32-msvc 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @oxlint/binding-win32-x64-msvc 1.80.0 — MIT；guide/web-admin (devDependencies)
- npm @rolldown/binding-android-arm-eabi 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-android-arm64 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-darwin-arm64 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-darwin-x64 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-freebsd-x64 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm-gnueabihf 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm64-gnu 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm64-musl 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-ppc64-gnu 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-s390x-gnu 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-x64-gnu 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-x64-musl 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-openharmony-arm64 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-win32-arm64-msvc 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-win32-x64-msvc 1.2.6 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-android-arm64 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-arm64 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-x64 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-freebsd-x64 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm-gnueabihf 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-gnu 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-musl 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-gnu 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-musl 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-win32-arm64-msvc 1.32.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-android-arm64 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-darwin-arm64 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-darwin-x64 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-freebsd-x64 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm-gnueabihf 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm64-gnu 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm64-musl 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-x64-gnu 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-x64-musl 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-wasm32-wasi 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-win32-arm64-msvc 4.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm fsevents 2.3.3 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-android-arm64 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-arm64 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-x64 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-freebsd-x64 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm-gnueabihf 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-gnu 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-musl 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-gnu 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-musl 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm lightningcss-win32-arm64-msvc 1.33.0 — MPL-2.0；guide/web-admin (dependencies/transitive；包含构建工具)
- npm react-remove-scroll-bar 2.3.8 — MIT；guide/web-admin (dependencies/transitive；包含构建工具)
- npm @oxlint/binding-android-arm-eabi 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-android-arm64 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-darwin-arm64 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-darwin-x64 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-freebsd-x64 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-arm-gnueabihf 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-arm-musleabihf 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-arm64-gnu 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-arm64-musl 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-ppc64-gnu 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-riscv64-gnu 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-riscv64-musl 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-s390x-gnu 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-x64-gnu 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-linux-x64-musl 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-openharmony-arm64 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-win32-arm64-msvc 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-win32-ia32-msvc 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @oxlint/binding-win32-x64-msvc 1.80.0 — MIT；navigation-theme (devDependencies)
- npm @rolldown/binding-android-arm-eabi 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-android-arm64 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-darwin-arm64 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-darwin-x64 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-freebsd-x64 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm-gnueabihf 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm64-gnu 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-arm64-musl 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-ppc64-gnu 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-s390x-gnu 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-x64-gnu 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-linux-x64-musl 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-openharmony-arm64 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-win32-arm64-msvc 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @rolldown/binding-win32-x64-msvc 1.2.6 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-android-arm64 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-arm64 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-x64 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-freebsd-x64 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm-gnueabihf 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-gnu 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-musl 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-gnu 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-musl 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-win32-arm64-msvc 1.32.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-android-arm64 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-darwin-arm64 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-darwin-x64 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-freebsd-x64 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm-gnueabihf 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm64-gnu 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-arm64-musl 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-x64-gnu 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-linux-x64-musl 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-wasm32-wasi 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm @tailwindcss/oxide-win32-arm64-msvc 4.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm fsevents 2.3.3 — MIT；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-android-arm64 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-arm64 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-darwin-x64 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-freebsd-x64 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm-gnueabihf 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-gnu 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-arm64-musl 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-gnu 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-linux-x64-musl 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm lightningcss-win32-arm64-msvc 1.33.0 — MPL-2.0；navigation-theme (dependencies/transitive；包含构建工具)
- npm tslib 2.8.1 — 0BSD；navigation-theme (dependencies/transitive；包含构建工具)

外部图标、复制的 UI 组件和 Logo 授权检查见根 THIRD_PARTY_NOTICES.md。


## 使用分类与许可边界

锁定清单：234 Rust + 343 npm 条目，共 577；242 份收集文本、662 个来源关联，逐源比较仅忽略行尾空白，版权/许可文字未改。此数为保守源码许可清单，不是二进制 SBOM。

| 类别 | 实际范围 |
| --- | --- |
| A Rust/runtime | 锁定的 Rust 依赖；非目标平台/条件 r-efi、valuable 等不等于发行必需，实际二进制所含依赖取决于目标平台与启用的特性 |
| B 前端实际嵌入 | React/ReactDOM、Radix 实际使用模块、lucide ISC/Feather MIT、shadcn 派生组件、后台 Dialog/Select 的 react-remove-scroll；主题仅直接 Slot，不含 simple-icons 或滚动依赖 |
| C build/dev only | Vite、TypeScript、oxlint、Tailwind/PostCSS/source-map-js/nanoid 与平台构建工具；npm dependencies 字段不等于运行时。Windows native 工具的缺文本不作为 GNU 制品 blocker |
| D 用户远程可选 | 自有图库、网站 favicon、手动 HTTPS 图片；空默认列表，lige_icon 非默认，未捆绑第三方网站 Logo/JSON 图片集合 |

保留的 NodeCard/NodeDetail country flags、Recharts/Victory/D3 源码和许可为保守范围；当前 App 未引用，当前 bundle 无国旗/图表资产。simple-icons 的网站和发行版 Logo 全部移除，不包含该依赖及其许可来源。

PostCSS8.5.29、nanoid3.3.20 为 MIT；source-map-js1.2.2 为 BSD-3-Clause，均从 npm ci 的锁定官方包收集完整原文。主题直接使用已有 @radix-ui/react-slot1.3.3 的完整 MIT/2022 WorkOS 原文，官方 tarball SHA512 已独立匹配。

来源：[PostCSS8.5.29](https://registry.npmjs.org/postcss/8.5.29)、[source-map-js1.2.2](https://registry.npmjs.org/source-map-js/1.2.2)、[nanoid3.3.20](https://registry.npmjs.org/nanoid/3.3.20)、[Slot1.3.3](https://registry.npmjs.org/@radix-ui/react-slot/1.3.3)。

**维护者已接受的精确许可证据风险：后台 react-remove-scroll-bar2.3.8。** npm metadata 声明 MIT；官方精确包的 LICENSE/copyright 正文未取得完整核验。当前维护者于2026-10-07明确知晓并接受该公开风险，不作为Guide 1.0.0发布blocker。不声称已完成精确许可核验，不伪造或冒用其他版本版权正文。
