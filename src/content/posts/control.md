---

title: 'Building a TUI in Go: From Command-Line Flags to Interactive Interfaces'
bigTitle: 'Interfaces'
emphasis: 'Building'
headline: 'Building {emphasis} Interfaces In Go'
excerpt: 'A practical look at building terminal user interfaces in Go, parsing command-line flags with the standard library, and turning a simple command into an interactive tool.'
author: 'Scarlett Witch'
readTime: '8 Min Read'
date: 2026-08-18
cover: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1600&q=70'
featured: true
tags: ['golang', 'tui', 'cli', 'terminal', 'flags']
---------------------------------------------------

The terminal has never really been just a place to run commands.

For a long time, the typical command-line program followed a simple pattern: accept some arguments, do some work, print the result, and exit. But as terminal applications became more capable, that model started to feel restrictive.

A TUI — a Terminal User Interface — sits somewhere between a traditional CLI and a graphical application. It still lives inside the terminal, but instead of simply printing text and disappearing, it can react to keyboard input, redraw the screen, maintain state, and give the user something that feels surprisingly close to a desktop application.

Go is particularly well suited for this kind of tooling. Its standard library gives us excellent foundations for command-line programs, while libraries such as Bubble Tea can provide the event-driven machinery required for a full TUI.

Before building the interface, however, it is worth getting the command itself right.

## Start with the command

A useful terminal application usually needs some way to configure its behavior.

For example, imagine a small application called `gopherboard` that displays a terminal dashboard.

We might want commands such as:

```bash
gopherboard --name "server"
gopherboard --refresh 5
gopherboard --debug
```

Go already provides a flag parser for this.

The `flag` package is part of the standard library, which means there is no dependency to install and no external framework to understand.

A minimal program looks like this:

```go
package main

import (
	"flag"
	"fmt"
)

func main() {
	name := flag.String("name", "dashboard", "name of the dashboard")

	flag.Parse()

	fmt.Println("Starting:", *name)
}
```

Running:

```bash
go run . --name "server"
```

produces:

```text
Starting: server
```

The important detail is that `flag.String` returns a pointer.

That means we access the actual value with:

```go
*name
```

The same pattern works for other types.

```go
port := flag.Int("port", 8080, "server port")
debug := flag.Bool("debug", false, "enable debug mode")

flag.Parse()

fmt.Println(*port)
fmt.Println(*debug)
```

Now the program can understand:

```bash
gopherboard --port 9000 --debug
```

The standard library is doing considerably more work than the tiny amount of code suggests.

It handles parsing, defaults, type conversion, and invalid input for us.

## Flags before the interface

This separation becomes especially useful when building a TUI.

The command-line flags describe **how the application should start**.

The TUI describes **what happens after it starts**.

For example:

```bash
gopherboard --refresh 2 --debug
```

could mean:

```text
Configuration
-------------
Refresh: 2 seconds
Debug:   enabled

        ┌───────────────────────────────┐
        │       GOPHERBOARD              │
        │                                │
        │  CPU       31%                 │
        │  Memory    4.2 GB              │
        │  Network   12 MB/s             │
        │                                │
        │  q: quit   r: refresh          │
        └───────────────────────────────┘
```

The flags establish the initial configuration.

Once the TUI starts, keyboard events take over.

## A cleaner configuration structure

Instead of scattering flag variables throughout the application, we can collect them into a configuration structure.

```go
type Config struct {
	Name    string
	Refresh int
	Debug   bool
}
```

Then:

```go
func parseFlags() Config {
	name := flag.String(
		"name",
		"dashboard",
		"dashboard name",
	)

	refresh := flag.Int(
		"refresh",
		5,
		"refresh interval in seconds",
	)

	debug := flag.Bool(
		"debug",
		false,
		"enable debug logging",
	)

	flag.Parse()

	return Config{
		Name:    *name,
		Refresh: *refresh,
		Debug:   *debug,
	}
}
```

Now `main` becomes much easier to understand:

```go
func main() {
	config := parseFlags()

	if config.Debug {
		fmt.Println("Debug mode enabled")
	}

	startTUI(config)
}
```

This distinction is important.

`main()` should ideally describe the application's lifecycle rather than contain every implementation detail.

## Entering TUI territory

A TUI needs to continuously react to events.

A normal CLI might look like:

```text
input → process → output → exit
```

A TUI looks more like:

```text
             ┌─────────────┐
             │             │
keyboard ───►│ application │
             │             │
             └──────┬──────┘
                    │
                    ▼
                 redraw
                    │
                    └──────► wait for another event
```

One popular approach in Go is Bubble Tea.

Its programming model is based around three major ideas:

```text
Model
Update
View
```

The **model** contains application state.

The **update** function reacts to events and changes that state.

The **view** converts the current state into something that can be displayed.

A tiny model might look like this:

```go
type Model struct {
	counter int
}
```

The model could represent:

```text
counter = 0
```

When the user presses a key:

```text
counter = 1
```

The interface is then rendered again.

## Handling keyboard input

A simplified Bubble Tea model can look like:

```go
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:
		switch msg.String() {

		case "q", "ctrl+c":
			return m, tea.Quit

		case "up":
			m.counter++

		case "down":
			m.counter--
		}
	}

	return m, nil
}
```

The interesting part is that the function does not manually wait for keyboard input.

There is no:

```go
fmt.Scanln(...)
```

There is no giant loop like:

```go
for {
	// read keyboard
	// process keyboard
	// redraw
}
```

The TUI framework manages the event loop.

Your code focuses on describing what each event means.

## Rendering the interface

The `View` function can turn the model into text:

```go
func (m Model) View() string {
	return fmt.Sprintf(
		"Counter: %d\n\nPress ↑/↓ to change\nPress q to quit",
		m.counter,
	)
}
```

Conceptually:

```text
Model
  │
  │ counter = 4
  ▼
View()
  │
  ▼
"Counter: 4"
```

The terminal becomes a continuously changing projection of the application's state.

That is one of the most useful mental models for TUI development.

You are not really "drawing" the terminal.

You are maintaining **state** and rendering that state.

## Connecting flags to the model

Now the interesting part begins.

The command-line flags can become part of the initial model.

```go
type Model struct {
	name    string
	refresh int
	debug   bool
}
```

Then:

```go
func newModel(config Config) Model {
	return Model{
		name:    config.Name,
		refresh: config.Refresh,
		debug:   config.Debug,
	}
}
```

Our program now has a clean pipeline:

```text
command-line
     │
     ▼
 flag.Parse()
     │
     ▼
   Config
     │
     ▼
  newModel()
     │
     ▼
     TUI
```

This is much cleaner than letting the TUI package directly read command-line arguments.

## A complete small example

Putting the pieces together:

```go
package main

import (
	"flag"
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
)

type Config struct {
	Name    string
	Refresh int
	Debug   bool
}

type Model struct {
	config  Config
	counter int
}

func parseFlags() Config {
	name := flag.String(
		"name",
		"dashboard",
		"dashboard name",
	)

	refresh := flag.Int(
		"refresh",
		5,
		"refresh interval in seconds",
	)

	debug := flag.Bool(
		"debug",
		false,
		"enable debug mode",
	)

	flag.Parse()

	return Config{
		Name:    *name,
		Refresh: *refresh,
		Debug:   *debug,
	}
}

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {

	case tea.KeyMsg:
		switch msg.String() {

		case "q", "ctrl+c":
			return m, tea.Quit

		case "up":
			m.counter++

		case "down":
			m.counter--
		}
	}

	return m, nil
}

func (m Model) View() string {
	return fmt.Sprintf(
		"%s\n\nCounter: %d\n\n"+
			"↑/↓  change value\n"+
			"q    quit\n",
		m.config.Name,
		m.counter,
	)
}

func main() {
	config := parseFlags()

	model := Model{
		config: config,
	}

	p := tea.NewProgram(model)

	if _, err := p.Run(); err != nil {
		fmt.Println("Error:", err)
		os.Exit(1)
	}
}
```

Now we can launch it with:

```bash
go run . --name "Mission Control" --refresh 2 --debug
```

The flags are parsed once.

The configuration is passed into the model.

The model owns the application's state.

The TUI owns the interaction.

And `main()` simply connects everything together.

## Why use the built-in `flag` package?

It is tempting to immediately reach for a large CLI framework.

Sometimes that is exactly the right decision.

But the standard library should not be underestimated.

For a small application:

```go
flag.String(...)
flag.Int(...)
flag.Bool(...)
flag.Parse()
```

may be everything you need.

It gives you:

* typed flags
* default values
* automatic help output
* basic validation
* no external dependency
* simple integration with `main()`

For example:

```bash
./gopherboard -h
```

automatically produces usage information based on the flags you registered.

You can also customize the usage message:

```go
flag.Usage = func() {
	fmt.Println("Gopherboard - terminal dashboard")
	flag.PrintDefaults()
}
```

Now your application can explain itself without requiring a separate help system.

## Short flags and long flags

The standard `flag` package is deliberately simple.

You can define:

```go
verbose := flag.Bool(
	"verbose",
	false,
	"enable verbose output",
)
```

and:

```bash
./app -verbose
```

or:

```bash
./app --verbose
```

The Go standard library accepts both forms for its flags.

For values:

```bash
./app --port 8080
```

and:

```bash
./app -port=8080
```

are also useful forms.

The important thing is to keep the command-line interface predictable.

## Flags versus positional arguments

Flags are not the same thing as arguments.

For example:

```bash
./app --debug file.txt
```

contains:

```text
flag:
    --debug

argument:
    file.txt
```

After:

```go
flag.Parse()
```

you can access positional arguments with:

```go
args := flag.Args()
```

For example:

```go
if len(args) > 0 {
	fmt.Println("Opening:", args[0])
}
```

This makes it possible to build commands such as:

```bash
./viewer --line-numbers source.go
```

where:

```text
--line-numbers
```

is configuration and:

```text
source.go
```

is the input.

## The TUI as a state machine

Once the interface becomes larger, thinking in terms of screens is useful.

Imagine:

```text
             ┌─────────────┐
             │ Main Screen │
             └──────┬──────┘
                    │
                  Enter
                    │
                    ▼
             ┌─────────────┐
             │ Detail View │
             └──────┬──────┘
                    │
                   Esc
                    │
                    ▼
             ┌─────────────┐
             │ Main Screen │
             └─────────────┘
```

The application state might contain:

```go
type Screen int

const (
	ScreenMain Screen = iota
	ScreenDetails
	ScreenSettings
)

type Model struct {
	screen Screen
}
```

Then:

```go
switch msg.String() {
case "enter":
	m.screen = ScreenDetails

case "esc":
	m.screen = ScreenMain
}
```

Suddenly the terminal is no longer just printing strings.

You have a real application with state transitions.

## The satisfying part

This is where Go starts becoming particularly fun for terminal applications.

You can begin with something almost stupidly small:

```bash
./app
```

Then add flags:

```bash
./app --debug
```

Then state:

```text
MAIN
  │
  ├── tasks
  ├── logs
  └── system
```

Then keyboard navigation:

```text
↑ ↓       navigate
enter     select
esc       back
q         quit
```

Then asynchronous operations:

```text
        ┌─────────────┐
        │     TUI     │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │ application │
        │    state    │
        └──────┬──────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
     files   network   system
```

And suddenly you have something that feels much larger than the amount of code involved.

That is the appeal of TUIs.

They occupy an unusual middle ground: the simplicity and composability of command-line tools with the interaction model of a graphical application.

## Control moves from the shell to the application

The command line should configure the application.

The TUI should let the user operate it.

That distinction keeps the architecture clean.

A useful mental model is:

```text
             CLI
              │
              │ configuration
              ▼
           Config
              │
              ▼
            Model
              │
        ┌─────┴─────┐
        │           │
        ▼           ▼
      Update       View
        │           │
        │           ▼
        │        Terminal
        │
        ▼
     new state
        │
        └───────────────► View again
```

The shell starts the program.

The flags establish its initial behavior.

The model stores what is happening.

Events modify the model.

The view exposes the current state.

And the terminal becomes the interface rather than merely the output.

That is the point where a Go command stops feeling like a script and starts feeling like a real application.
