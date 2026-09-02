---
name: managing-python-dependencies
description: >
  Garante o gerenciamento correto de dependências Python usando uv como padrão,
  evitando pip install global e respeitando o ferramental do projeto. Use ao
  instalar pacotes, criar novos projetos Python, notebooks ou executar scripts.
tags: [python, uv, dependencies, pip]
globs: ["*.py", "pyproject.toml", "requirements.txt", "uv.lock"]
compatible_with: [claude, gemini, cursor, windsurf, copilot]
status: stable
version: "1.0.0"
---

# Python Dependency Management Rule

> [!CAUTION]
> **BEFORE any dependency operation**: Always use **uv** as the primary Python package and environment manager.

## Dependency Manager Detection & Priority

1. **Signal:** `uv.lock` or `pyproject.toml`
   * **Tool:** **uv**
   * **Install:** `uv add <package>`
   * **Setup:** `uv sync`
2. **Signal:** `requirements.txt`
   * **Tool:** **uv (pip interface)**
   * **Install:** `uv pip install <package>`
   * **Setup:** `uv venv` && `uv pip install -r requirements.txt`
3. **Signal:** `pyproject.toml` with `[tool.poetry]`
   * **Tool:** **Poetry** (or `uv` if requested)
   * **Install:** `poetry add <package>`
   * **Setup:** `poetry install`
4. **Signal:** `Pipfile`
   * **Tool:** **Pipenv**
   * **Install:** `pipenv install <package>`
   * **Setup:** `pipenv install`
5. **Signal:** `environment.yml`
   * **Tool:** **Conda**
   * **Install:** `conda install <package>`
   * **Setup:** `conda env create -f environment.yml`
6. **Signal:** None of the above
   * **Tool:** **uv** (default)
   * **Install:** `uv add <package>` or `uv pip install <package>`
   * **Setup:** `uv venv` && `uv pip install -r requirements.txt`

## Default Tooling: uv

Always use **uv** as the default for Python dependency and virtual environment management:

```bash
# Initialize environment with uv
uv venv

# Add dependencies with uv
uv pip install <package>   # or uv add <package>

# Freeze/preserve state
uv pip freeze > requirements.txt
```

**Rules for uv workflow:**
- Always use `uv` commands (`uv venv`, `uv pip`, `uv add`, `uv sync`).
- When installing packages, use `uv pip install <package>` or `uv add <package>`.
- When setting up an existing project, use `uv venv` and `uv pip install -r requirements.txt` or `uv sync`.

## Prohibited

- **NEVER** run `pip install` globally without `uv` or explicit virtual environment.
- **NEVER** bypass `uv` unless the project strictly requires a legacy dependency manager.
