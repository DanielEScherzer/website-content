---
extensions:
  pygments: true
  toc: true
tags: ["php", "rust"]
title: "RSPHP Part 1: Bindings"
---

# RSPHP Part 1: Bindings

Last month I led a workshop at Longhorn PHP about how to build PHP extensions in
Rust. The extension that was built during that workshop made use of
[RSPHP][rsphp], a set of Rust crates that I wrote to make it easier to develop
PHP extensions in Rust.

In this post, I'll talk about the first of these crates,
[`rsphp-sys`][crate-sys], that provides FFI bindings for the C code used to
implement PHP. Future posts will dive into other parts of the RSPHP code.

References to PHP use the latest stable release as of writing (PHP 8.5.12),
likewise with Rust (Rust 1.99.1).

## Motivation

When trying to write code in Rust to integrate with an existing C codebase
(PHP is written in C), one question that emerges relatively early in the process
is how to tell Rust about the types and functions in C that are relevant. For
PHP extensions written in C, they can just import the relevant C header files,
but that isn't an option in Rust.

Types in Rust can [use the `#[repr(C)]` attribute][ref-repr-c], which tells the
Rust compiler to represent the type in a manner interoperable with C code.
External C functions that will be called from Rust are indicated using an
["extern" block][ref-extern] with function declarations that don't have bodies.

For example, the PHP function [`highlight_file()`][docs-highlight_file] internally
uses a C function to do the highlighting. The relevant parts
[of zend_highlight.h][gh-zend_highlight] are:

```c
typedef struct _zend_syntax_highlighter_ini {
	char *highlight_html;
	char *highlight_comment;
	char *highlight_default;
	char *highlight_string;
	char *highlight_keyword;
} zend_syntax_highlighter_ini;

// ...

zend_result highlight_file(const char *filename, zend_syntax_highlighter_ini *syntax_highlighter_ini);
```

To tell Rust about that type and function (`zend_result` is defined elsewhere),
one could write:

```rust
#[repr(C)]
pub struct _zend_syntax_highlighter_ini {
    pub highlight_html: *mut c_char,
    pub highlight_comment: *mut c_char,
    pub highlight_default: *mut c_char,
    pub highlight_string: *mut c_char,
    pub highlight_keyword: *mut c_char,
}
pub type zend_syntax_highlighter_ini = _zend_syntax_highlighter_ini;

unsafe extern "C" {
	pub fn highlight_file(
		filename: *const c_char,
		syntax_highlighter_ini: *mut zend_syntax_highlighter_ini,
	) -> zend_result;
}
```

This Rust code declares

1. the `_zend_syntax_highlighter_ini` type, with its five character pointer
fields;
2. the `zend_syntax_highlighter_ini` alias, corresponding to the C `typedef`;
and
3. the `highlight_file` function.

Seems simple enough, right?

## Manual Bindings

PHP supports loading extensions dynamically, via configuration using the
[`extension_dir`][ini-extension_dir] and [`extension`][ini-extension] INI
directives, or even at runtime with [the `dl()` function][docs-dl] depending on
configuration. To implement this functionality, PHP uses dynamic linking, via
[`dlsym()`][man-dlsym] when that function is present, or using
[`GetProcAddress()`][man-GetProcAddress] on Windows, to look for the
`get_module` symbol in the compiled extension file. The bare minimum needed to
implement a dynamically loadable PHP extension is to define an exported
function `get_module` that, when called, returns a pointer to a
`zend_module_entry` object.

But, what does that module entry type look like? From
[zend_modules.h][gh-zend_modules]:

```c
#define INIT_FUNC_ARGS		int type, int module_number
#define SHUTDOWN_FUNC_ARGS	int type, int module_number
#define ZEND_MODULE_INFO_FUNC_ARGS zend_module_entry *zend_module

struct _zend_ini_entry;
typedef struct _zend_module_entry zend_module_entry;
typedef struct _zend_module_dep zend_module_dep;

struct _zend_module_entry {
	unsigned short size;
	unsigned int zend_api;
	unsigned char zend_debug;
	unsigned char zts;
	const struct _zend_ini_entry *ini_entry;
	const struct _zend_module_dep *deps;
	const char *name;
	const struct _zend_function_entry *functions;
	zend_result (*module_startup_func)(INIT_FUNC_ARGS);
	zend_result (*module_shutdown_func)(SHUTDOWN_FUNC_ARGS);
	zend_result (*request_startup_func)(INIT_FUNC_ARGS);
	zend_result (*request_shutdown_func)(SHUTDOWN_FUNC_ARGS);
	void (*info_func)(ZEND_MODULE_INFO_FUNC_ARGS);
	const char *version;
	size_t globals_size;
#ifdef ZTS
	ts_rsrc_id* globals_id_ptr;
#else
	void* globals_ptr;
#endif
	void (*globals_ctor)(void *global);
	void (*globals_dtor)(void *global);
	zend_result (*post_deactivate_func)(void);
	int module_started;
	unsigned char type;
	void *handle;
	int module_number;
	const char *build_id;
};
```

At first glance, that isn't too complicated. There are integer fields of
various flavors, some null-terminated C strings, and a handful of callback
functions for various lifecycle events. Even the pointer to a `_zend_module_dep`
array isn't too challenging to write out bindings for if you
[examine that type][bind-zend-mod-dep]. The `_zend_ini_entry` pointer
[is a bit more complicated][bind-zend-ini-entry] as it brings in a few other
types that need to be declared in Rust, but still manageable.

The real pain point is the pointer to a `_zend_function_entry` - check out
that type in the [generated binding documentation][bind-zend-fe].
Once you dive into what is needed to represent a PHP function entry, you
quickly run into more and more types that need to be declared to fully represent
a function entry, including

<!-- Via _zend_function_entry.handler -> zif_handler -->
* the model of PHP's execution data ([`_zend_execute_data`][bind-zend-exec-data])
<!-- _zend_function_entry.handler -> zif_handler -->
* the [`zval`][bind-zval] "god object" that represents PHP values and so much
more
<!-- zval: _zend_value.arr -->
* the [`zend_array`][bind-zend_array] type that is used for arrays, lists,
dictionaries, stacks, and more (PHP arrays [can do a lot][docs-array])
<!-- zval: _zend_value.ce-->
* the [`zend_class_entry`][bind-zend-ce] type that represents PHP classes,
interfaces, enums, and traits

and so much more.

I actually did try to write out the bindings for these by hand to start with,
using void pointers as a temporary measure to be able to get *something* to
compile, but that wasn't sustainable, especially since these are just the
requirements to *declare* a PHP extension - we haven't even gotten to trying
to add any functionality!

## Bindgen and build.rs

Enter [bindgen][bindgen], a tool that generates Rust FFI bindings for C code
*automatically*. The links to the different types above have been to the
bindings generated with bindgen and [documented on docs.rs][docs-rs-sys].

Bindgen was definitely the tool that made it possible for me to write a PHP
extension in Rust independently in a reasonable amount of time, and is one of
the most widely used tools for creating Rust bindings for existing C projects.
But just creating those bindings once isn't enough. Different developers have
different machines with different architectures, and PHP itself supports a host
of configuration options that control *how it will be built*. Depending on some
of those options, functions may have different parameters and types can even
have different fields - recall the `#ifdef ZTS` in the definition of
`_zend_module_entry` above. The fields of a module entry are different depending
on whether PHP was compiled with thread safety enabled.

Bindgen is thus frequently paired with [build scripts][cargo-build-script], mini
Rust programs that are run before the actual crate is compiled. That is exactly
how the `rsphp-sys` crate is built - the bindings are generated at build time
based on the currently installed version of PHP. The default build script
for the `rsphp-sys` crate can be found [on docs.rs][docs-rs-build-script].

However, just the build script on its own does not solve everything - not only
do different PHP installations have different configuration, but extensions
might want to have bindings for different parts of PHP's C ABI. In the workshop
I led, by the end the extension we were building needed to depend on PHP's
built-in Date extension, in addition to the core Zend engine. I thus designed
the `rsphp-sys` crate with the intention that even the build script might be
overwritten, making use of Cargo's
[support for patching dependencies][cargo-patch].

## Customizing bindings

The bindings for PHP's ABI need extensive customization. For example, by default
bindgen will try to convert C integer `#define` preprocessor constants into
`i32` or `u32` types - in C, the constant doesn't need to specify a type.
However, PHP uses a *lot* of C preprocessor constants, and many of those are
intended to be used as other types, e.g. as a single byte (`u8`). While bindgen
can be configured to use the smallest type that a constant will fit in, for a
set of bitmask flags, all of the constants should be of a consistent type, even
if some of the flags *could* fit into smaller integer types.

When an extension developer overrides the default `build.rs` script with their
own, in order to customize what bindings are generated, they would presumably
want to keep the existing customizations that the `rsphp-sys` crate comes with
by default. To avoid needing to copy and paste a huge build script, I refactored
as many of the customizations as possible into a separate crate,
[`rsphp-build-tools`][crate-build-tools].

The `rsphp-sys` crate lays the groundwork for PHP extensions written in Rust
to interact with PHP's C ABI. The accompanying `rsphp-build-tools` crate makes
it possible to customize those bindings without duplicating too much of the
build-script logic. In the next post, I'll explore `rsphp-build-tools` in more
detail.

[bindgen]: https://rust-lang.github.io/rust-bindgen/
[bind-zend_array]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/type.zend_array.html
[bind-zend-ce]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/type.zend_class_entry.html
[bind-zend-exec-data]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/struct._zend_execute_data.html
[bind-zend-fe]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/struct._zend_function_entry.html
[bind-zend-ini-entry]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/struct._zend_ini_entry.html
[bind-zend-mod-dep]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/struct._zend_module_dep.html
[bind-zval]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/type.zval.html
[cargo-build-script]: https://doc.rust-lang.org/1.99.1/cargo/reference/build-scripts.html
[cargo-patch]: https://doc.rust-lang.org/1.99.1/cargo/reference/overriding-dependencies.html
[crate-build-tools]: https://crates.io/crates/rsphp-build-tools
[crate-sys]: https://crates.io/crates/rsphp-sys
[docs-array]: https://www.php.net/manual/en/language.types.array.php
[docs-highlight_file]: https://www.php.net/manual/en/function.highlight-file.php
[docs-dl]: https://www.php.net/manual/en/function.dl.php
[docs-rs-build-script]: https://docs.rs/crate/rsphp-sys/0.1.2/source/build.rs
[docs-rs-sys]: https://docs.rs/rsphp-sys/0.1.2/rsphp_sys/
[gh-zend_highlight]: https://github.com/php/php-src/blob/PHP-8.5.12/Zend/zend_highlight.h
[gh-zend_modules]: https://github.com/php/php-src/blob/PHP-8.5.12/Zend/zend_modules.h
[ini-extension]: https://www.php.net/manual/en/ini.core.php#ini.extension
[ini-extension_dir]: https://www.php.net/manual/en/ini.core.php#ini.extension-dir
[man-dlsym]: https://linux.die.net/man/3/dlsym
[man-GetProcAddress]: https://learn.microsoft.com/en-us/windows/win32/api/libloaderapi/nf-libloaderapi-getprocaddress
[ref-extern]: https://doc.rust-lang.org/1.99.1/reference/items/external-blocks.html#r-items.extern.fn
[ref-repr-c]: https://doc.rust-lang.org/1.99.1/reference/type-layout.html#the-c-representation
[rsphp]: https://github.com/DanielEScherzer/rsphp
