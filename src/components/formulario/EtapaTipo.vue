<template>
  <div class="fdc-etapa">

    <div class="fdc-sec">
      <div class="fdc-sec__badge">1</div>
      <div>
        <h2 class="fdc-sec__title">Premíssas Institucionais</h2>
        <p class="fdc-sec__desc">Dados da contratada, área gestora e supervisão ambiental.</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="nomeContratada">Nome (PJ) da Contratada</label>
      <div class="fdc-hint">Nome e sigla separados por " – ". Ex: "Empresa Ltda – EMP"</div>
      <div class="fdc-wrap">
        <input id="nomeContratada" class="fdc-input" type="text"
          :value="v.nomeContratada"
          placeholder="Ex: Companhia Paulista de Trens – CPTM"
          @input="u('nomeContratada', $event.target.value)" />
        <button v-if="v.nomeContratada" class="fdc-clear" type="button"
          @click="u('nomeContratada', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="numContrato">Nº do Contrato da Contratada</label>
      <div class="fdc-wrap">
        <input id="numContrato" class="fdc-input" type="text"
          :value="v.numContrato"
          placeholder="Ex: AR01234-56 (ou deixe em branco)"
          @input="u('numContrato', $event.target.value)" />
        <button v-if="v.numContrato" class="fdc-clear" type="button"
          @click="u('numContrato', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="localEscopo">Local do Escopo Contratual (Pseudônimo)</label>
      <div class="fdc-hint">Nome genérico para o local ou trecho. Ex: "Pátio Capuava"</div>
      <div class="fdc-wrap">
        <input id="localEscopo" class="fdc-input" type="text"
          :value="v.localEscopo"
          placeholder="Ex: Pátio Capuava"
          @input="u('localEscopo', $event.target.value)" />
        <button v-if="v.localEscopo" class="fdc-clear" type="button"
          @click="u('localEscopo', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="representante">Representante da Contratada / Área Gestora CPTM</label>
      <div class="fdc-wrap">
        <input id="representante" class="fdc-input" type="text"
          :value="v.representante"
          placeholder="Nome do responsável interlocutor (ou deixe em branco)"
          @input="u('representante', $event.target.value)" />
        <button v-if="v.representante" class="fdc-clear" type="button"
          @click="u('representante', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="siglaArea">Sigla da Área de Meio Ambiente</label>
      <div class="fdc-hint">Departamento interlocutor da GEA. Ex: GEA.DEAE</div>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="siglaArea" class="fdc-input"
          :value="v.siglaArea" @change="u('siglaArea', $event.target.value)">
          <option value="">Selecione a sigla...</option>
          <option v-for="s in SIGLAS_AREA" :key="s" :value="s">{{ s }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl" for="statusDesvioAmbiental">Status do Desvio Ambiental</label>
        <div class="fdc-wrap fdc-wrap--sel">
          <select id="statusDesvioAmbiental" class="fdc-input"
            :value="v.statusDesvioAmbiental" @change="u('statusDesvioAmbiental', $event.target.value)">
            <option value="">— Deixar em branco</option>
            <option v-for="s in STATUS_DESVIO" :key="s" :value="s">{{ s }}</option>
          </select>
          <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
        </div>
      </div>

      <div class="fdc-field">
        <label class="fdc-lbl" for="statusRegistroBd">Status do Registro no BD</label>
        <div class="fdc-wrap fdc-wrap--sel">
          <select id="statusRegistroBd" class="fdc-input"
            :value="v.statusRegistroBd" @change="u('statusRegistroBd', $event.target.value)">
            <option value="">— Deixar em branco</option>
            <option v-for="s in STATUS_REGISTRO" :key="s" :value="s">{{ s }}</option>
          </select>
          <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
        </div>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeAreaGestora">Nome da Área Gestora CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="nomeAreaGestora" class="fdc-input"
          :value="v.nomeAreaGestora" @change="u('nomeAreaGestora', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="a in AREAS_GESTORAS" :key="a" :value="a">{{ a }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="idAreaGestora">Identificador da Área Gestora CPTM</label>
      <div class="fdc-hint">Ex: ID.10-15-5-3-0000</div>
      <div class="fdc-wrap">
        <input id="idAreaGestora" class="fdc-input" type="text"
          :value="v.idAreaGestora"
          placeholder="Ex: ID.10-15-5-3-0000 (ou deixe em branco)"
          @input="u('idAreaGestora', $event.target.value)" />
        <button v-if="v.idAreaGestora" class="fdc-clear" type="button"
          @click="u('idAreaGestora', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="siglaAreaGestora">Sigla da Área Gestora CPTM</label>
      <div class="fdc-hint">Ex: DO.GOF.DOFS.0000</div>
      <div class="fdc-wrap">
        <input id="siglaAreaGestora" class="fdc-input" type="text"
          :value="v.siglaAreaGestora"
          placeholder="Ex: DO.GOF.DOFS.0000 (ou deixe em branco)"
          @input="u('siglaAreaGestora', $event.target.value)" />
        <button v-if="v.siglaAreaGestora" class="fdc-clear" type="button"
          @click="u('siglaAreaGestora', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeSupervisora">Nome (PJ) da Supervisora Ambiental</label>
      <div class="fdc-hint">Nome e sigla. Se a CPTM for supervisora, repetir gerência e depto ambiental.</div>
      <div class="fdc-wrap">
        <input id="nomeSupervisora" class="fdc-input" type="text"
          :value="v.nomeSupervisora"
          placeholder="Ex: ESA Ambiental Ltda – ESA (ou deixe em branco)"
          @input="u('nomeSupervisora', $event.target.value)" />
        <button v-if="v.nomeSupervisora" class="fdc-clear" type="button"
          @click="u('nomeSupervisora', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nrContratoSupervisora">Nº do Contrato da Supervisora</label>
      <div class="fdc-wrap">
        <input id="nrContratoSupervisora" class="fdc-input" type="text"
          :value="v.nrContratoSupervisora"
          placeholder="Ex: 123123123123 (ou deixe em branco)"
          @input="u('nrContratoSupervisora', $event.target.value)" />
        <button v-if="v.nrContratoSupervisora" class="fdc-clear" type="button"
          @click="u('nrContratoSupervisora', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="nomeEmpresaExecutora">Nome da Empresa Executora</label>
      <div class="fdc-hint">Exemplo: Companhia Paulista de Trens Metropolitanos - CPTM</div>
      <div class="fdc-wrap">
        <input id="nomeEmpresaExecutora" class="fdc-input" type="text"
          :value="v.nomeEmpresaExecutora"
          placeholder="Ex: Companhia Paulista de Trens Metropolitanos - CPTM"
          @input="u('nomeEmpresaExecutora', $event.target.value)" />
        <button v-if="v.nomeEmpresaExecutora" class="fdc-clear" type="button"
          @click="u('nomeEmpresaExecutora', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <!-- SEÇÃO 2 -->
    <div class="fdc-sec">
      <div class="fdc-sec__badge">2</div>
      <div>
        <h2 class="fdc-sec__title">Cadastrador e Responsável Técnico</h2>
        <p class="fdc-sec__desc">Identifique quem realizou e assina o cadastramento.</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="autorCadastro">Autor(a) do Cadastramento</label>
      <div class="fdc-wrap" :class="{ 'fdc-wrap--locked': isLocked(v.autorCadastro) }">
        <input id="autorCadastro" class="fdc-input" :class="{ 'fdc-input--locked': isLocked(v.autorCadastro) }" type="text"
          :value="v.autorCadastro"
          placeholder="Nome completo de quem preencheu o formulário"
          :readonly="isLocked(v.autorCadastro)"
          @input="u('autorCadastro', $event.target.value)" />
      </div>
      <div class="fdc-hint">Preenchido automaticamente com o nome da conta logada.</div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="autorPjCadastro">Autor(a) (PJ) do Cadastramento</label>
      <div class="fdc-wrap">
        <input id="autorPjCadastro" class="fdc-input" type="text"
          :value="v.autorPjCadastro"
          placeholder="Ex: Companhia Paulista de Trens Metropolitanos - CPTM"
          @input="u('autorPjCadastro', $event.target.value)" />
        <button v-if="v.autorPjCadastro" class="fdc-clear" type="button"
          @click="u('autorPjCadastro', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="responsavelTecnico">Responsável Técnico (RT) pelo Cadastramento</label>
      <div class="fdc-wrap" :class="{ 'fdc-wrap--locked': isLocked(v.responsavelTecnico) }">
        <input id="responsavelTecnico" class="fdc-input" :class="{ 'fdc-input--locked': isLocked(v.responsavelTecnico) }" type="text"
          :value="v.responsavelTecnico"
          placeholder="Nome completo do(a) RT"
          :readonly="isLocked(v.responsavelTecnico)"
          @input="u('responsavelTecnico', $event.target.value)" />
      </div>
      <div class="fdc-hint">Preenchido automaticamente com o nome da conta logada.</div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="registroProfissional">Registro Profissional do RT</label>
      <div class="fdc-wrap">
        <input id="registroProfissional" class="fdc-input" type="text"
          :value="v.registroProfissional"
          placeholder="Ex: CREA – 123456 (ou deixe em branco)"
          @input="u('registroProfissional', $event.target.value)" />
        <button v-if="v.registroProfissional" class="fdc-clear" type="button"
          @click="u('registroProfissional', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="docRT">Documento de Responsabilidade Técnica (RT)</label>
      <div class="fdc-hint">Ex: Anotação de Responsabilidade Técnica – ART</div>
      <div class="fdc-wrap">
        <input id="docRT" class="fdc-input" type="text"
          :value="v.docRT"
          placeholder="Ex: ART nº 123456 (ou deixe em branco)"
          @input="u('docRT', $event.target.value)" />
        <button v-if="v.docRT" class="fdc-clear" type="button"
          @click="u('docRT', '')" aria-label="Limpar">×</button>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({ modelValue: { type: Object, required: true } })
const emit  = defineEmits(['update:modelValue'])

const v = props.modelValue

const SIGLAS_AREA = ['GEA.DEAE', 'GEA.DEAO', 'GEA.DEAI', 'GEA.DEAS', 'GEA.GEAS']
const STATUS_DESVIO = ['Não Regularizado', 'Regularizado', 'Não se aplica(m)', 'Inexistente(s)', 'Indefinido(a)(s)', 'Não avaliado(a)(s)']
const STATUS_REGISTRO = ['Ativo', 'Inativo', 'Não se aplica(m)', 'Inexistente(s)', 'Indefinido(a)(s)', 'Não avaliado(a)(s)']
const AREAS_GESTORAS = [
  'DEPTO. DE MANUT. DE SISTEMAS ELETR. E RESTAB. DE SERVICOS',
  'DEPTO. DE OPERAÇÕES FERROVIÁRIAS',
  'DEPTO. DE MANUTENÇÃO DE VIA E OBRAS',
  'DEPTO. DE ENGENHARIA E PROJETOS',
  'GERÊNCIA DE MEIO AMBIENTE - GEA',
  'DEPTO. DE PATRIMÔNIO E SERVIÇOS',
  'DEPTO. DE GESTÃO AMBIENTAL',
]

function u(field, val) {
  emit('update:modelValue', { ...props.modelValue, [field]: val })
}

function isLocked(value) {
  return String(value ?? '').trim().length > 0
}
</script>

<style scoped>
.fdc-etapa { padding: var(--s-lg) var(--s-md); animation: fadeInUp 0.3s ease both; }

.fdc-wrap--locked {
  opacity: 0.72;
}

.fdc-input--locked {
  cursor: not-allowed;
}
</style>
