---
name: nome-da-skill
description: >
  Descreva O QUE a skill faz e QUANDO ela deve ser usada, com gatilhos
  explícitos (frases, contextos, tipos de arquivo). Esta é a principal forma
  de acionamento automático — seja específico e um pouco "insistente" nos
  gatilhos, para reduzir o risco da LLM não perceber que a skill se aplica.
tags: [tag1, tag2]
globs: ["*.py", "src/**/*.py"]   # Opcional: ativação contextual por arquivo (Cursor/IDEs)
always_apply: false              # Opcional: se true, carrega sempre em todo prompt
compatible_with: [claude, gemini, cursor, windsurf, copilot]
status: draft                    # draft | stable | deprecated
version: "0.1.0"
---

# Nome da Skill

Uma frase resumindo o propósito.

## Quando usar

- Gatilho 1 (frase típica do usuário)
- Gatilho 2
- Contexto específico onde isso se aplica

## Como fazer

Passo a passo ou regras claras. Prefira:
- Exemplos de código/saída em vez de descrições vagas
- Regras objetivas ("máx. 20 linhas por função") em vez de "escreva código limpo"
- Uma estrutura consistente, igual em todas as skills da library

## Recursos adicionais (opcional)

Se a skill precisar de mais de ~500 linhas, quebre em:
- `references/algum-detalhe.md` — carregado só quando necessário
- `scripts/algum_script.py` — código determinístico executável
- `assets/algum-template.xlsx` — arquivos usados na saída final

## Notas de portabilidade

Se algo aqui só funciona numa ferramenta específica (ex: um comando que só
existe no Claude Code), isole numa seção separada no fim, marcada com o nome
da ferramenta, para o `sync_skills.py` saber o que incluir/excluir por
destino.
