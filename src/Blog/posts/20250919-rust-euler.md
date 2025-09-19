---
extensions:
  footnotes: true
  pygments: true
extra-classes:
  - blog-page--unhighlighted-block
title: Project Euler in Rust
---

# Project Euler in Rust

Having done the obligatory hello world, I set out to actually code something
useful in Rust. When I learn a new programming language, my go-to source of
coding problems to try and solve in the new language is
[Project Euler][proj-euler], which features hundreds of coding challenges of
various difficulty levels.

With Rust, I didn't try to solve any new problems, but rather focused on
problems that I had already solved in other languages. That way, I could be
focused on the specifics of working in Rust rather than generally figuring out
how to solve the problem.

## Starter Problems

I kicked things off with [Problem #1][proj-euler-prob-1], which asks for the
sum of all natural numbers below 1000 that are multiples of 3 or 5 (or both).
That problem is simple enough that I didn't need to refer back to any previous
code of mine - my program[^1] was as simple as:

```rust
fn main() {
	let mut sum = 0;
	for iii in 1..1000 {
		if (iii % 3 == 0) || (iii % 5 == 0) {
			sum += iii;
		}
	}
	println!("Sum: {}", sum);
}
```

Working on this problem brought me to my first three major observations about
how Rust differs from other languages that I have used in the past:

1. Rust variables are immutable by default.

In other languages, immutability for local variables needs to be declared
explicitly (C, JavaScript) or is not possible (PHP). This will likely take some
getting used to, but I like it!

2. The Rust compiler has helpful error messages.

Without the `mut` keyword, trying to compile the program would lead to:

<details>

<summary>Expand for errors</summary>

```
error[E0384]: cannot assign twice to immutable variable `sum`
 --> problem1.rs:5:4
  |
2 |     let sum = 0;
  |         --- first assignment to `sum`
...
5 |             sum += iii;
  |             ^^^^^^^^^^ cannot assign twice to immutable variable
  |
help: consider making this binding mutable
  |
2 |     let mut sum = 0;
  |         +++

error: aborting due to 1 previous error

For more information about this error, try `rustc --explain E0384`.
```
</details>

Not only is there an explanation of what went wrong (assigning twice to an
immutable variable) but there is also

* identification of exactly where the assignments are made
* a suggestion of how to fix things
* a built-in help tool for information about the error code

That built-in tool explains that by default, variables in Rust are immutable.
Compared to the compiler errors that I am used to from C and C++, Rust is a
refreshing change of pace.

3. The Rust compiler warns about style issues too.

I'm used to the conditions for `if` statements needing to be surrounded with
`()`, i.e. `if ((iii % 3 == 0) || (iii % 5 == 0)) {`, but with Rust, those are
unnecessary. Not only that, but the compiler will warn that they are unused, and
suggest removing them. I appreciate the compiler letting me know these are
unneeded, but I'm not sure how I feel about the compiler having a style
preference for removing unneeded parentheses.

[Problem #2][proj-euler-prob-2], which asks for the sum of all even terms in
the Fibonacci sequence that are less than four million, was also pretty simple.
However, one of the compiler warnings that I got introduced me to a new Rust
feature: [`loop`][rust-loop], which is used for infinite loops. Other languages
that I have used lack a dedicated mechanism for infinite loops, and so I was
used to something like `while (true)`, but the compiler gave me a helpful
nudge via a warning.

## Sudoku Solver

Having gotten a hang of the basics, I figured it wouldn't hurt to just dive in,
and so I jumped to [Problem #96][proj-euler-prob-96]. Briefly, that problem
entails reading in 50 different sudoku grids, solving them, and then for each
grid, consider the first three digits of the top row as a three digit number,
and sum those three digit numbers across the 50 sudoku grids.

So that I could focus on learning Rust rather than figuring out how to solve
the problem, I started off by basically copying my C++ implementation of the
problem and then working to adapt it to Rust. I'm not going to discuss every
difference between the languages, but there were a few places where Rust was
remarkably different from other languages that I have used in the past that I
think are worth mentioning for anyone considering taking up Rust.

The first major difference was a big pain point in my conversion of the C++
code to Rust that required re-engineering my approach:

4. Rust prohibits having multiple mutable references to the same value.

Sudoku digits cannot repeat within the same row, column, or box of the grid.
To help with managing the nine rows, nine columns, and nine boxes, in C++ I had
a `DigitCollection` class that would hold pointers to the nine different
`Digit`s of the grid in a row/column/box. The `DigitCollection` could also
modify the values of the grid `Digit`s - if there was only one `Digit` that
could hold the value `1`, for example, then that `Digit` would be updated to be
a `1`. Then, the other two collections that the `Digit` was in would propagate
the change and remove the `1` option from the other `Digit`s.

In Rust, such an approach was not going to work. I tried various work-arounds
using Rust's standard library, like the [`std::cell::RefCell`][rust-refcell]
struct, but wasn't able to get anything to work. As a result, I instead
refactored the way `DigitCollection` worked: instead of holding a reference to
the various `Digit` instances, they would hold the details of the *locations*
(row and column) of each `Digit` in the collection. Then, any time that the
`DigitCollection` wanted to do anything, it would fetch a reference to the
needed `Digit`. That reference would only remain around while it was in use,
and so there would not be multiple references to the same `Digit` at once as
long as only one `DigitCollection` was doing work at a time.

At that point, I realized that the setup of the `DigitCollection` struct meant
that it was no longer tied to a specific grid. The `DigitCollection` only held
details of the *locations* of `Digit`s in the grid, not the `Digit`s themselves.
Thus, I should be able to allocate the 27 `DigitCollection` instances once at
the start (nine rows, nine columns, nine boxes) and just reuse those rather than
allocating 27 instances for each of the 50 grids. However, I quickly ran into
another limitation of Rust:

5. Rust global variables have restrictions on their initialization.

I was initializing the nine `DigitCollection` instances corresponding to the
rows of the grid with

```rust
let row_sets: [DigitCollection; 9] = core::array::from_fn(
	|row|
	DigitCollection {
		locations: core::array::from_fn(|col| DigitLoc{ row: row, col: col } ),
	}
);
```

Each of the nine rows was a `DigitCollection`, where the locations were
initialized with a callback mapping the column index to a new `DigitLoc`
struct, which just holds the row and column information together.[^2]

Unfortunately, while the snippet above worked fine within a function, doing it
for a global variable (which needs to be declared with either `const` or
`static` rather than `let`) did not work. Using either `static` or `const`
results in error E0015 complaining that the `std::array::from_fn` function is
non-const.

The final big difference that I encountered was not an issue for the first few
grids, so I did not realize the impact right away:

6. Rust does not have exceptions that can be thrown and caught.

At various points in the solving process, the solver might conclude that the
grid is impossible to solve - for example, a `Digit` might not have any possible
values, or a value might not be an option in any `Digit` in a collection. At
that point, the C++ code would throw an exception; when converting to Rust, I
started by replacing those exceptions with Rust's [`panic!` macro][rust-panic].

However, sometimes the exceptions needed to be caught. Specifically, after
implementing a few basic solution stategies (e.g. checking if a `Digit` could
only hold a single value, or if a value could only go in one `Digit` in a
`DigitCollection`) my approach was rather inelegant: bifurcation. I would
pick one `Digit` with multiple options, set it to be one of those options, and
then try to solve the new grid. If solving succeeded, then the "guess" was
correct and the solution from the new grid was used. If solving failed, then
the "guess" was incorrect and that option could be removed from the `Digit` in
question.

To handle the "if solving failed" case, the C++ code would just catch an
exception; in Rust, I needed to convert this to use the [`Result`][rust-result]
type, which holds either a success value, or an error message. Once I replaced
some of the `panic!()` calls with `Result`s, the program was able to compile,
run, and produce the right answer!

While I've spent a while on ways that Rust's differences were frustrating or
unexpected, there was also one Rust feature that the other languages I use most
often (C, PHP,[^3] and JavaScript) lack:

7. Rust has pattern matching!!!

I've used pattern matching in some other languages ([ML][ml-lang] comes to mind)
and it makes things very nice and compact. For example, part of the switch from
exceptions to a `Result` resulted in the code:

```rust
match self.check_only_options() {
	Err(_) => return false,
	Ok(v) => made_change = v,
};
```

If the `check_only_options()` method (which checks each `DigitCollection` to see
if there is a value that can only go into one `Digit`) returns an error,
indicating that the solving is impossible (due to bifurcation), the solving
just returns false.

## Final Thoughts

Rust is definitely a language I want to keep using. I plan to continuing
playing around with Rust for Project Euler problems, and I might try to
contribute [more patches to mago][blog-mago]. While Rust will take some
adjusting to, especially the limits on mutable references, I look forward to
adding a new language to my repertoire.

[^1]: Normally, publishing solutions to the Project Euler problems is
discouraged, but for the first 100 problems sharing solutions is allowed.

[^2]: In Sudoku, the cells are labeled as row one (top) through row nine
(bottom) and column one (left) through column nine (right). However, in Rust and
most other programming languages that I have used, arrays are indexed starting
from `0`. Thus, the "location" of a `Digit`, indicating where it is in the
two-dimensional array of `Digits` in the grid, has a row and a column that are
in the range 0-8 rather than 1-9.

[^3]: PHP might be getting pattern matching at some point, there is
[an RFC][php-pattern-rfc] currently in draft to add that feature, but the RFC
has been in draft since 2020 so it could still be a while before it gets
discussed, accepted, and implemented, if it ever does.

[proj-euler]: https://projecteuler.net/
[proj-euler-prob-1]: https://projecteuler.net/problem=1
[proj-euler-prob-2]: https://projecteuler.net/problem=2
[rust-loop]: https://doc.rust-lang.org/rust-by-example/flow_control/loop.html
[proj-euler-prob-96]: https://projecteuler.net/problem=96
[rust-refcell]: https://doc.rust-lang.org/std/cell/struct.RefCell.html
[rust-panic]: https://doc.rust-lang.org/std/macro.panic.html
[rust-result]: https://doc.rust-lang.org/std/result/
[php-pattern-rfc]: https://wiki.php.net/rfc/pattern-matching
[ml-lang]: https://en.wikipedia.org/wiki/ML_(programming_language)
[blog-mago]: ./20250906-mago-rust
