<template>
  <div class="fdc-etapa">

    <!-- SEÇÃO 7.1 -->
    <div class="fdc-sec">
      <div class="fdc-sec__badge">7.1</div>
      <div>
        <h2 class="fdc-sec__title">Regulamentação Ambiental</h2>
        <p class="fdc-sec__desc">Tipo de atividade e documentos de regularização do E.M.</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="tipoAtividadeListada">Tipo de Atividade (Listada)</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="tipoAtividadeListada" class="fdc-input"
          :value="v.tipoAtividadeListada" @change="u('tipoAtividadeListada', $event.target.value)">
          <option value="">Selecione o tipo de atividade...</option>
          <option v-for="t in TIPOS_ATIVIDADE" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div v-if="v.tipoAtividadeListada === 'Outro(a)(s)'" class="fdc-field">
      <label class="fdc-lbl req" for="tipoAtividadeNaoListada">Tipo de Atividade (Não Listada)</label>
      <div class="fdc-hint">Informe o tipo quando "Outro(a)(s)" for selecionado acima.</div>
      <div class="fdc-wrap">
        <input id="tipoAtividadeNaoListada" class="fdc-input" type="text"
          :value="v.tipoAtividadeNaoListada"
          placeholder="Descreva a atividade não listada"
          @input="u('tipoAtividadeNaoListada', $event.target.value)" />
        <button v-if="v.tipoAtividadeNaoListada" class="fdc-clear" type="button"
          @click="u('tipoAtividadeNaoListada', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="tipoDRAListado">Tipo de DRA (Listado)</label>
      <div class="fdc-hint">DRA = Documento de Regularidade Ambiental</div>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="tipoDRAListado" class="fdc-input"
          :value="v.tipoDRAListado" @change="u('tipoDRAListado', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="t in TIPOS_DRA" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div v-if="v.tipoDRAListado === 'Outro(a)(s)'" class="fdc-field">
      <label class="fdc-lbl" for="tipoDRANaoListado">Tipo de DRA (Não Listado)</label>
      <div class="fdc-wrap">
        <input id="tipoDRANaoListado" class="fdc-input" type="text"
          :value="v.tipoDRANaoListado"
          placeholder="Descreva o tipo de DRA não listado"
          @input="u('tipoDRANaoListado', $event.target.value)" />
        <button v-if="v.tipoDRANaoListado" class="fdc-clear" type="button"
          @click="u('tipoDRANaoListado', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="codigoDRA">Código Identificador do DRA</label>
      <div class="fdc-hint">Ex: "Nº 1.285.456" ou "DFR nº 456.123"</div>
      <div class="fdc-wrap">
        <input id="codigoDRA" class="fdc-input" type="text"
          :value="v.codigoDRA"
          placeholder="Ex: DRF nº 123.456 (ou deixe em branco)"
          @input="u('codigoDRA', $event.target.value)" />
        <button v-if="v.codigoDRA" class="fdc-clear" type="button"
          @click="u('codigoDRA', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="dataValidadeDRA">Data de Validade do DRA</label>
      <div class="fdc-wrap">
        <input id="dataValidadeDRA" class="fdc-input" type="date"
          :value="v.dataValidadeDRA"
          @input="u('dataValidadeDRA', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="analiseCptmAprovacao">Análise CPTM para Aprovação</label>
      <div class="fdc-wrap">
        <input id="analiseCptmAprovacao" class="fdc-input" type="text"
          :value="v.analiseCptmAprovacao"
          placeholder="Ex: Aprovado com condicionantes"
          @input="u('analiseCptmAprovacao', $event.target.value)" />
        <button v-if="v.analiseCptmAprovacao" class="fdc-clear" type="button"
          @click="u('analiseCptmAprovacao', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <!-- SEÇÃO 7.2 -->
    <div class="fdc-sec">
      <div class="fdc-sec__badge">7.2</div>
      <div>
        <h2 class="fdc-sec__title">Detalhamento do Efluente</h2>
        <p class="fdc-sec__desc">Caracterização da atividade, origem e destinação do efluente.</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="tipoAtividadeCPTM">Tipo de Atividade na CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="tipoAtividadeCPTM" class="fdc-input"
          :value="v.tipoAtividadeCPTM" @change="u('tipoAtividadeCPTM', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="t in TIPOS_ATIVIDADE_CPTM" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeLocal">Nome Edificação/Local da CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="nomeLocal" class="fdc-input"
          :value="v.nomeLocal" @change="u('nomeLocal', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="l in NOMES_LOCAL" :key="l" :value="l">{{ l }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="complementoLocal">Complemento do Nome Edificação/Local</label>
      <div class="fdc-wrap">
        <input id="complementoLocal" class="fdc-input" type="text"
          :value="v.complementoLocal"
          placeholder="Ex: Brás (ou deixe em branco)"
          @input="u('complementoLocal', $event.target.value)" />
        <button v-if="v.complementoLocal" class="fdc-clear" type="button"
          @click="u('complementoLocal', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="origemEfluente">Origem do Efluente</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="origemEfluente" class="fdc-input"
          :value="v.origemEfluente" @change="u('origemEfluente', $event.target.value)">
          <option value="">Selecione a origem...</option>
          <option v-for="o in ORIGENS_EFLUENTE" :key="o" :value="o">{{ o }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="fonteGeradora">Fonte Geradora do Efluente</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="fonteGeradora" class="fdc-input"
          :value="v.fonteGeradora" @change="u('fonteGeradora', $event.target.value)">
          <option value="">Selecione a fonte geradora...</option>
          <option v-for="f in FONTES_GERADORAS" :key="f" :value="f">{{ f }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="quantidadeLitros">Quantidade (Litros)</label>
      <div class="fdc-hint">Número com até 8 casas decimais. Ex: "9,25"</div>
      <div class="fdc-wrap">
        <input id="quantidadeLitros" class="fdc-input" type="number"
          step="0.00000001" min="0"
          :value="v.quantidadeLitros"
          placeholder="Ex: 9.25 (ou deixe em branco)"
          @input="u('quantidadeLitros', $event.target.value)" />
        <button v-if="v.quantidadeLitros" class="fdc-clear" type="button"
          @click="u('quantidadeLitros', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="tipoDestinacao">Tipo de Destinação do Efluente</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="tipoDestinacao" class="fdc-input"
          :value="v.tipoDestinacao" @change="u('tipoDestinacao', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="t in TIPOS_DESTINACAO" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="tipoVeiculo">Tipo de Veículo</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="tipoVeiculo" class="fdc-input"
          :value="v.tipoVeiculo" @change="u('tipoVeiculo', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="t in TIPOS_VEICULO" :key="t" :value="t">{{ t }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="placaVeiculo">Identificador / Placa do Veículo</label>
      <div class="fdc-wrap">
        <input id="placaVeiculo" class="fdc-input" type="text"
          :value="v.placaVeiculo"
          placeholder="Ex: WAD 105D (ou deixe em branco)"
          @input="u('placaVeiculo', $event.target.value)" />
        <button v-if="v.placaVeiculo" class="fdc-clear" type="button"
          @click="u('placaVeiculo', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="codigoGuiaRemessa">Código Identificador da Guia de Remessa</label>
      <div class="fdc-wrap">
        <input id="codigoGuiaRemessa" class="fdc-input" type="text"
          :value="v.codigoGuiaRemessa"
          placeholder="Ex: ID nº 10.456 (ou deixe em branco)"
          @input="u('codigoGuiaRemessa', $event.target.value)" />
        <button v-if="v.codigoGuiaRemessa" class="fdc-clear" type="button"
          @click="u('codigoGuiaRemessa', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="distanciaVia">Distância da Via CPTM (Metros)</label>
      <div class="fdc-hint">Distância da via mais próxima em metros. Ex: "7,58"</div>
      <div class="fdc-wrap">
        <input id="distanciaVia" class="fdc-input" type="number"
          step="0.01" min="0"
          :value="v.distanciaVia"
          placeholder="Ex: 7.58 (ou deixe em branco)"
          @input="u('distanciaVia', $event.target.value)" />
        <button v-if="v.distanciaVia" class="fdc-clear" type="button"
          @click="u('distanciaVia', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl" for="ofereceRiscoSistemaCptm">Oferece risco aos Sistemas da CPTM?</label>
        <div class="fdc-wrap fdc-wrap--sel">
          <select id="ofereceRiscoSistemaCptm" class="fdc-input"
            :value="v.ofereceRiscoSistemaCptm" @change="u('ofereceRiscoSistemaCptm', $event.target.value)">
            <option value="">— Deixar em branco</option>
            <option v-for="s in GEA_SIM_NAO" :key="s" :value="s">{{ s }}</option>
          </select>
          <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
        </div>
      </div>
      <div class="fdc-field">
        <label class="fdc-lbl" for="dominioTerritorial">Domínio Territorial</label>
        <div class="fdc-wrap fdc-wrap--sel">
          <select id="dominioTerritorial" class="fdc-input"
            :value="v.dominioTerritorial" @change="u('dominioTerritorial', $event.target.value)">
            <option value="">— Deixar em branco</option>
            <option v-for="d in DOMINIO_TERRITORIAL" :key="d" :value="d">{{ d }}</option>
          </select>
          <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
        </div>
      </div>
    </div>

    <div class="fdc-sec">
      <div class="fdc-sec__badge">8</div>
      <div>
        <h2 class="fdc-sec__title">Arquivos Relacionados e Rastreabilidade</h2>
        <p class="fdc-sec__desc">Vínculos com RVT, DAC, CNC, RRA e CEDOC (quando aplicável).</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeArquivoRvtRelacionado">Nome do arquivo RVT relacionado</label>
      <div class="fdc-wrap">
        <input id="nomeArquivoRvtRelacionado" class="fdc-input" type="text"
          :value="v.nomeArquivoRvtRelacionado"
          placeholder="Ex: DeaeCt123123123123A2024Rvt002L07.xlsx"
          @input="u('nomeArquivoRvtRelacionado', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="codigoElementoMonitorRvt">Código do E.M. no RVT relacionado</label>
      <div class="fdc-wrap">
        <input id="codigoElementoMonitorRvt" class="fdc-input" type="text"
          :value="v.codigoElementoMonitorRvt"
          placeholder="Ex: GEA.DEAE-EM.0001-RVT.002/2024-L.07-CT.123..."
          @input="u('codigoElementoMonitorRvt', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeArquivoDacRelacionado">Nome do arquivo DAC relacionado</label>
      <div class="fdc-wrap">
        <input id="nomeArquivoDacRelacionado" class="fdc-input" type="text"
          :value="v.nomeArquivoDacRelacionado"
          placeholder="Ex: DeaeCt123123123123A2024Dac002L07.xlsx"
          @input="u('nomeArquivoDacRelacionado', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="codigoElementoMonitorDac">Código do E.M. na DAC relacionada</label>
      <div class="fdc-wrap">
        <input id="codigoElementoMonitorDac" class="fdc-input" type="text"
          :value="v.codigoElementoMonitorDac"
          placeholder="Ex: GEA.DEAE-EM.0001-DAC.002/2024-L.07-CT.123..."
          @input="u('codigoElementoMonitorDac', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeArquivoCncRelacionado">Nome do arquivo CNC relacionado</label>
      <div class="fdc-wrap">
        <input id="nomeArquivoCncRelacionado" class="fdc-input" type="text"
          :value="v.nomeArquivoCncRelacionado"
          placeholder="Ex: DeaeCt123123123123A2024Cnc002L07.xlsx"
          @input="u('nomeArquivoCncRelacionado', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="codigoElementoMonitorCnc">Código do E.M. na CNC relacionada</label>
      <div class="fdc-wrap">
        <input id="codigoElementoMonitorCnc" class="fdc-input" type="text"
          :value="v.codigoElementoMonitorCnc"
          placeholder="Ex: GEA.DEAE-EM.0001-CNC.002/2024-L.07-CT.123..."
          @input="u('codigoElementoMonitorCnc', $event.target.value)" />
      </div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl" for="codigoUltimoRra">Chave Primária no último RRA</label>
        <div class="fdc-wrap">
          <input id="codigoUltimoRra" class="fdc-input" type="text"
            :value="v.codigoUltimoRra"
            placeholder="Ex: EEA.EF-A.2024-L.07-CPTM-N.123456"
            @input="u('codigoUltimoRra', $event.target.value)" />
        </div>
      </div>
      <div class="fdc-field">
        <label class="fdc-lbl" for="codigoCedoc">Chave Primária - CEDOC</label>
        <div class="fdc-wrap">
          <input id="codigoCedoc" class="fdc-input" type="text"
            :value="v.codigoCedoc"
            placeholder="Ex: FDC-FA.FA.OC-A.2024-CPTM-L.07-N.123456"
            @input="u('codigoCedoc', $event.target.value)" />
        </div>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="observacoesGerais">Observações Gerais do Cadastramento</label>
      <div class="fdc-hint">Observações relevantes ao cadastramento. Máximo 2000 caracteres.</div>
      <textarea id="observacoesGerais" class="fdc-textarea"
        rows="4" maxlength="2000"
        :value="v.observacoesGerais"
        placeholder="Ex: Coleta realizada em área operacional sem interferência na via. DRA vigente e comprovação anexada."
        @input="u('observacoesGerais', $event.target.value)"></textarea>
      <div class="fdc-textarea-foot">
        <button v-if="v.observacoesGerais" class="fdc-txt-clear" type="button"
          @click="u('observacoesGerais', '')">Limpar texto</button>
        <span v-else></span>
        <span class="fdc-chars">{{ (v.observacoesGerais || '').length }}/2000</span>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit  = defineEmits(['update:modelValue'])

const v = props.modelValue

const TIPOS_ATIVIDADE = [
  'Estação de Tratamento de Efluente','Transporte','Outro(a)(s)','Indefinido(a)(s)',
  'Não se aplica(m)','Inexistente(s)','Não avaliado(a)(s)',
]
const TIPOS_DRA = [
  'Cadastro Técnico Federal (IBAMA) - CTF/IBAMA',
  'Certificado de Dispensa de Licença - CDL',
  'Certificado de Movimentação de Resíduos de Interesse Ambiental - CADRI',
  'Declaração de Movimentação de Resíduos - DMR',
  'Ficha de Informações de Segurança de Produtos Químicos - FISPQ',
  'Licença de Operação - LO',
  'Manifesto de Transporte de Resíduos - MTR',
  'Outro(a)(s)',
  'Não se aplica(m)','Indefinido(a)(s)','Inexistente(s)','Não avaliado(a)(s)',
]
const TIPOS_ATIVIDADE_CPTM = [
  'Empreendimento/Obra','Manutenção','Operação','Outro(a)(s)','Não se aplica(m)','Indefinido(a)(s)','Inexistente(s)',
]
const NOMES_LOCAL = [
  'Abrigo','Base de manutenção','Cabine Primária','Cabine Seccionadora','Estação',
  'Lavador de TUE','Oficina','Pátio','Prédio administrativo','Prédio de apoio','Sala técnica','Subestação','Trecho - Km/poste','Vários',
]
const ORIGENS_EFLUENTE = [
  'Doméstico/Sanitário','Fundação','Industrial','Outro(a)(s)','Indefinido(a)(s)','Inexistente(s)','Não se aplica(m)','Não avaliado(a)(s)',
]
const FONTES_GERADORAS = [
  'Atividade de obra','Banheiros/vestiários/refeitórios','Lavagem de trens/peças','Manutenção ETE','Outro(a)(s)','Indefinido(a)(s)','Inexistente(s)','Não se aplica(m)','Não avaliado(a)(s)',
]
const TIPOS_DESTINACAO = [
  'Esgotamento e transporte','Interligação em rede coletora','Lançamento em galeria de águas pluviais','Reinfiltração','Tratamento em ETE','Outro(a)(s)','Indefinido(a)(s)','Não se aplica(m)',
]
const TIPOS_VEICULO = [
  'Caminhão','Outro(a)(s)','Indefinido(a)(s)','Não se aplica(m)','Inexistente(s)',
]
const GEA_SIM_NAO = ['Sim', 'Não', 'Não Informado', 'Não se aplica(m)', 'Inexistente(s)', 'Indefinido(a)(s)', 'Não avaliado(a)(s)']
const DOMINIO_TERRITORIAL = [
  'CPTM - Titularidade', 'CPTM - Posse', 'Metrô', 'Alienado', 'MRS', 'RFSA', 'RFSA/SPU',
  'CBTU', 'Pessoa Jurídica', 'Pessoa Física', 'Indefinido', 'FEPASA', 'Permuta',
  'Prefeitura de Guarulhos', 'DAEE', 'USP Leste', 'GRU - Aeroporto', 'CCR - Rodovia Dutra',
  'Ecopistas', 'CDHU', 'Não se aplica(m)', 'Inexistente(s)', 'Indefinido(a)(s)', 'Não avaliado(a)(s)'
]

function u(field, val) {
  emit('update:modelValue', { ...props.modelValue, [field]: val })
}
</script>

<style scoped>
.fdc-etapa { padding: var(--s-lg) var(--s-md); animation: fadeInUp 0.3s ease both; }
</style>
