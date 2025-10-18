# Seerr Custom - Release Notes

Esta build personalizada do Seerr introduz várias melhorias centradas na experiência de descoberta de conteúdos, robustez do backend e simplificação do deploy. Abaixo encontras um resumo do que mudou nesta versão.

## Novidades principais

- **Filtros de disponibilidade na Discover**: podes limitar os resultados por disponibilidade total, parcial ou inexistente tanto em filmes como em séries, diretamente da interface. A API cruza cada resultado com o estado do teu servidor antes de aplicar o filtro, garantindo listas consistentes.【F:server/routes/discover.ts†L41-L122】【F:src/components/Discover/DiscoverMovies/index.tsx†L1-L118】【F:src/components/Discover/DiscoverTv/index.tsx†L1-L111】
- **Paginação infinita mais fiável**: o hook de Discover agora pára corretamente quando a última página é atingida e mantém os resultados sem duplicados mesmo com filtros aplicados, resolvendo problemas de carregamento ao navegar com a nova filtragem.【F:src/hooks/useDiscover.ts†L7-L106】
- **Gestão automática do diretório de logs**: quando a pasta configurada não existe ou não é gravável, o servidor cria-a e recorre a um fallback no sistema temporário, evitando falhas ao iniciar e mostrando um aviso explícito no console.【F:server/utils/logDirectory.ts†L1-L52】【F:server/logger.ts†L1-L45】
- **Indicador de versão personalizado**: o banner de versão passa a identificar builds locais com a mensagem "mitr4-custom 👍" e a ler `custom-version.json`/variáveis de ambiente para construir a versão exibida e controlar a verificação de updates.【F:src/components/Layout/VersionStatus/index.tsx†L1-L69】【F:server/utils/appVersion.ts†L1-L86】
- **Deploy container-friendly**: o Dockerfile garante que a diretoria `config` existe (evitando erros em runtime) e o `docker-compose` nomeia os containers como `*-custom`, adicionando um proxy pré-configurado para Umbrel e definindo timezone português por omissão.【F:Dockerfile†L1-L47】【F:compose.postgres.yaml†L1-L43】

## Outras melhorias

- Renomeação e normalização de assets de logo para manter consistência visual (ver pasta `public/`).
- Atualizações menores em ficheiros de configuração (`compose.postgres2.yaml`, `charts/`, etc.) para alinhar com o novo fluxo de deploy.

## Instalação via Umbrel (Mitr4 Store)

Esta versão também pode ser instalada diretamente numa Umbrel através da nossa Community App Store. Adiciona o repositório [Mitr4 Store](https://github.com/mitrajunior/Mitr4-Store) na tua Umbrel, procura pela app **Seerr Custom** e segue o fluxo de instalação habitual da store.

## Como testar

1. Sobe os serviços com `docker compose -f compose.postgres.yaml up -d`.
2. Acede a `http://localhost:5057` (via proxy Umbrel) e experimenta os filtros de disponibilidade em *Descobrir*.
3. Verifica os logs gerados em `config/logs` (ou no diretório de fallback indicado na consola) para confirmar a nova gestão automática.

Bom proveito! 😊
