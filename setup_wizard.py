#!/usr/bin/env python3
import os
import sys
import time
from pathlib import Path

from rich.console import Console
from rich.text import Text
from rich.align import Align
from rich.rule import Rule
import questionary
from questionary import Style

ENV_FILE = Path(os.environ.get("ENV_FILE_PATH", "/app/backend/.env"))

WIZARD_STYLE = Style(
    [
        ("qmark", "fg:#00d7af bold"),
        ("question", "fg:#ffffff bold"),
        ("answer", "fg:#00d7af bold"),
        ("pointer", "fg:#00d7af bold"),
        ("highlighted", "fg:#00d7af bold"),
        ("selected", "fg:#00d7af"),
        ("separator", "fg:#444444"),
        ("instruction", "fg:#888888"),
        ("text", "fg:#cccccc"),
        ("disabled", "fg:#555555 italic"),
    ]
)

ASCII_LOGO = r"""
 █████   █████                    ████   █████    █████         ███████                     
░░███   ░░███                    ░░███  ░░███    ░░███        ███░░░░░███                   
 ░███    ░███   ██████   ██████   ░███  ███████   ░███████   ███     ░░███ ████████   █████ 
 ░███████████  ███░░███ ░░░░░███  ░███ ░░░███░    ░███░░███ ░███      ░███░░███░░███ ███░░  
 ░███░░░░░███ ░███████   ███████  ░███   ░███     ░███ ░███ ░███      ░███ ░███ ░███░░█████ 
 ░███    ░███ ░███░░░   ███░░███  ░███   ░███ ███ ░███ ░███ ░░███     ███  ░███ ░███ ░░░░███
 █████   █████░░██████ ░░████████ █████  ░░█████  ████ █████ ░░░███████░   ░███████  ██████ 
░░░░░   ░░░░░  ░░░░░░   ░░░░░░░░ ░░░░░    ░░░░░  ░░░░ ░░░░░    ░░░░░░░     ░███░░░  ░░░░░░  
                                                                           ░███             
                                                                           █████            
                                                                          ░░░░░             
"""


def clear():
    os.system("clear")


def write_env(key: str, value: str):
    ENV_FILE.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    if ENV_FILE.exists():
        lines = ENV_FILE.read_text().splitlines()
    updated = False
    new_lines = []
    for line in lines:
        if line.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            updated = True
        else:
            new_lines.append(line)
    if not updated:
        new_lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(new_lines) + "\n")


def animated_spinner(console, message, duration=1.2):
    frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    end = time.time() + duration
    i = 0
    while time.time() < end:
        console.print(f"  [bold cyan]{frames[i % len(frames)]}[/] {message}", end="\r")
        time.sleep(0.08)
        i += 1
    console.print(f"  [bold green]✓[/] {message}            ")


def main():
    clear()
    console = Console()

    console.print()
    console.print(Align.center(Text(ASCII_LOGO, style="bold green")))
    console.print(
        Align.center(
            Text(
                "Gemma-powered health insights for the whole family.",
                style="dim italic cyan",
            )
        )
    )
    console.print()
    console.print(Rule(style="green dim"))
    console.print()
    time.sleep(0.4)

    private = questionary.confirm(
        "Run fully privately? (Uses local Ollama model 'gemma4:e2b')",
        default=True,
        style=WIZARD_STYLE,
        qmark="◆",
    ).ask()

    if private is None:
        console.print("\n[dim]Setup cancelled. Exiting.[/]")
        sys.exit(1)

    console.print()

    if private:
        console.print(
            "  [bold green]✓[/] Running in [bold]fully private mode[/]. No keys needed."
        )
        write_env("AI_MODE", "private")
        console.print()
        animated_spinner(console, "Preparing environment…")
    else:
        api_key = questionary.password(
            "Paste your Gemini API key:",
            style=WIZARD_STYLE,
            qmark="◆",
        ).ask()

        if not api_key or not api_key.strip():
            console.print("\n[bold red]  ✗  No key provided. Exiting.[/]")
            sys.exit(1)

        console.print()
        animated_spinner(console, "Saving GEMINI_API_KEY to environment…")
        write_env("GEMINI_API_KEY", api_key.strip())
        write_env("AI_MODE", "gemini")
        console.print("  [bold green]✓[/] GEMINI_API_KEY saved.")
        console.print()

    console.print(Rule(style="green dim"))
    console.print()
    console.print(Align.center(Text("Starting HealthOps…", style="bold green")))
    console.print()
    time.sleep(0.8)
    clear()


if __name__ == "__main__":
    main()
