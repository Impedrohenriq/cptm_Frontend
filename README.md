# CPTM Frontend

Aplicacao web mobile-first do formulario ambiental de efluentes da CPTM.

Este README e focado na camada frontend: interface, experiencia offline, sincronizacao e integracao com a API.

## 1. Objetivo da Aplicacao

- permitir preenchimento completo do formulario FDC-EEA.EF em campo;
- operar com conectividade instavel sem perda de dados;
- sincronizar automaticamente com o backend quando API e rede estiverem disponiveis;
- exibir status de sincronizacao de forma clara para o usuario.

## 2. Stack e Ferramentas

- Vue 3
- Pinia
- Vue Router
- Vite 5
- vite-plugin-pwa (injectManifest)
- TailwindCSS
- Vitest

Versoes e dependencias em [CPTM_Frontend/package.json](CPTM_Frontend/package.json).

## 3. Estrutura Tecnica

Arquivos-chave:

- [CPTM_Frontend/src/views/FormularioView.vue](CPTM_Frontend/src/views/FormularioView.vue): fluxo principal em etapas.
- [CPTM_Frontend/src/stores/inspecoes.js](CPTM_Frontend/src/stores/inspecoes.js): estado global, fila e reconciliacao.
- [CPTM_Frontend/src/services/offlineDb.js](CPTM_Frontend/src/services/offlineDb.js): persistencia IndexedDB.
- [CPTM_Frontend/src/services/offlineMedia.js](CPTM_Frontend/src/services/offlineMedia.js): tratamento de fotos offline.
- [CPTM_Frontend/src/services/syncEngine.js](CPTM_Frontend/src/services/syncEngine.js): sincronizacao e retry.
- [CPTM_Frontend/src/services/api.js](CPTM_Frontend/src/services/api.js): client HTTP + mapeamento DTO.
- [CPTM_Frontend/src/sw.js](CPTM_Frontend/src/sw.js): service worker da PWA.

## 4. Ideias e Decisoes de Projeto

1. Offline-first real

- rascunho, fila e anexos ficam no IndexedDB;
- o sistema nao depende de memoria de pagina;
- app reabre com dados preservados.

2. Sincronizacao confiavel

- status explicito por registro: rascunho, pendente_sync, sincronizando, sincronizado, erro_sync;
- sincronizacao somente apos sucesso de API;
- tratamento de conflito e retry em erros transitórios.

3. Midia otimizada para uso em campo

- fotos em Blob local;
- conversao para Base64 apenas no momento de envio;
- menor custo de memoria durante edicao.

4. UX orientada a operacao

- formulario por etapas;
- autosave;
- feedback visual de progresso e sincronizacao;
- placeholders com exemplos de preenchimento.

## 5. Fluxo Offline-First

1. Usuario preenche o formulario.
2. Autosave grava no IndexedDB.
3. Se API/rede estiver indisponivel, envio entra em pendente_sync.
4. App observa eventos de rede e disponibilidade do backend.
5. Sync engine reenvia fila automaticamente.
6. Registro muda para sincronizado apenas com confirmacao da API.

## 6. Health Check e Conectividade

O frontend consulta GET /health antes de sincronizar.

Ponto importante:

- navigator.onLine sozinho nao e criterio suficiente;
- internet ativa com API fora do ar mantem item na fila.

## 7. Configuracao

Arquivo de ambiente:

- [CPTM_Frontend/.env](CPTM_Frontend/.env)

Variavel principal:

    VITE_API_BASE_URL=http://localhost:5000

Para homolog/producao:

- apontar VITE_API_BASE_URL para a API real;
- alinhar CORS no backend.

## 8. Como Executar

Na raiz do frontend:

    npm install
    npm run dev

Build de producao:

    npm run build

Preview local do build:

    npm run preview

## 9. Testes

    npm test

Cenarios recomendados:

1. preencher formulario offline e recarregar pagina;
2. anexar fotos offline e validar persistencia;
3. enviar com API indisponivel e validar fila pendente;
4. reativar API e validar sincronizacao automatica;
5. simular falha temporaria e validar retry.

## 10. PWA

- service worker com injectManifest;
- suporte a background sync quando disponivel no navegador;
- fallback em foreground para navegadores sem suporte.

## 11. Integracao com Backend

Contratos principais consumidos:

- /api/auth/register
- /api/auth/login
- /api/formularios-efluente
- /health

Mapeamento de payload e DTO em [CPTM_Frontend/src/services/api.js](CPTM_Frontend/src/services/api.js).

## 12. Troubleshooting Rapido

Nao sincroniza:

1. validar VITE_API_BASE_URL;
2. validar endpoint /health;
3. validar CORS da API;
4. inspecionar status do item na store.

Fotos nao aparecem apos recarregar:

1. validar permissao de armazenamento no navegador;
2. limpar cache antigo apenas para teste;
3. conferir serializacao das fotos na camada offlineMedia.
