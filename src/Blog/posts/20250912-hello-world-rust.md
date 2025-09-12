---
title: "\"Hello, World!\" in Rust"
extensions:
  pygments: true
---

# "Hello, World!" in Rust

Yesterday, I started to teach myself how to program in Rust. As always, the first
step was a "Hello, World!" program.

Despite writing code for over a decade by now, my first step when coding in a
new language or environment is still to recreate the canonical test program
that outputs the string `"Hello, World!"`. The point of this program is not
demonstrate mastery (or even understanding) of a programming language. Instead,
it is used to confirm that the program can be run at all.

Before diving in to even a slightly complicated test program as I learn to
program in Rust, I wanted to make sure that I have a working environment. When
writing more complicated programs, a compilation or runtime failure will
generally signal that something is wrong in the code. On the other hand, with a
simple `"Hello, World!"` program, a failure generally indicates that something
is wrong with the development environment. Accordingly, I created the `hello.rs`
file as follows:

```rust
fn main() {
    println!("Hello, World!");
}
```

I then compiled the program with the command `rustc hello.rs`, and executed it
with `./hello`. The result: printing out the string `"Hello, World!"`. Success!

Now that I know that my environment is capable of compiling and running Rust
programs without issue, I can be relatively confident moving forward that if
there are issues, they come from my code being broken.

I guess I need to start writing more complicated programs now.
