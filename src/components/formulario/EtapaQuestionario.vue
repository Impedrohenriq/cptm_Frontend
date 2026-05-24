<template>
  <div class="fdc-etapa">

    <div class="fdc-sec">
      <div class="fdc-sec__badge">5</div>
      <div>
        <h2 class="fdc-sec__title">Identificação do E.M.</h2>
        <p class="fdc-sec__desc">Dados do Elemento de Monitoramento cadastrado.</p>
      </div>
    </div>

    <div class="fdc-auto fdc-auto--locked">
      <div class="fdc-auto__lbl">Chave Primária MA</div>
      <div class="fdc-auto__val">{{ v.chavePrimariaMa || 'Gerada automaticamente pelo backend no envio.' }}</div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl req" for="emNumero">E.M. – Número</label>
        <div class="fdc-hint">Sequencial 1–999.999</div>
        <div class="fdc-wrap">
          <input id="emNumero" class="fdc-input" type="number"
            min="1" max="999999"
            :value="v.emNumero"
            placeholder="Ex: 1"
            @input="u('emNumero', $event.target.value)" />
          <button v-if="v.emNumero" class="fdc-clear" type="button"
            @click="u('emNumero', '')" aria-label="Limpar">×</button>
        </div>
      </div>
      <div class="fdc-field">
        <label class="fdc-lbl req" for="emNome">E.M. – Nome</label>
        <div class="fdc-hint">Pseudônimo. Ex: "Caçamba A"</div>
        <div class="fdc-wrap">
          <input id="emNome" class="fdc-input" type="text"
            :value="v.emNome"
            placeholder="Ex: Plataforma 1"
            @input="u('emNome', $event.target.value)" />
          <button v-if="v.emNome" class="fdc-clear" type="button"
            @click="u('emNome', '')" aria-label="Limpar">×</button>
        </div>
      </div>
    </div>

    <!-- SEÇÃO 6 -->
    <div class="fdc-sec">
      <div class="fdc-sec__badge">6</div>
      <div>
        <h2 class="fdc-sec__title">Localização do E.M.</h2>
        <p class="fdc-sec__desc">Indique onde o elemento de monitoramento está localizado.</p>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="municipio">Nome do Município</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="municipio" class="fdc-input"
          :value="v.municipio" @change="u('municipio', $event.target.value)">
          <option value="">Selecione o município...</option>
          <option v-for="m in MUNICIPIOS" :key="m" :value="m">{{ m }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl req" for="linha">Linha CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="linha" class="fdc-input"
          :value="v.linha" @change="u('linha', $event.target.value)">
          <option value="">Selecione a linha...</option>
          <option v-for="l in LINHAS" :key="l" :value="l">{{ l }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="estacao">Estação CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="estacao" class="fdc-input"
          :value="v.estacao" @change="u('estacao', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="e in ESTACOES" :key="e" :value="e">{{ e }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="via">Nº da Via da Linha CPTM</label>
      <div class="fdc-wrap fdc-wrap--sel">
        <select id="via" class="fdc-input"
          :value="v.via" @change="u('via', $event.target.value)">
          <option value="">— Deixar em branco</option>
          <option v-for="va in VIAS" :key="va" :value="va">{{ va }}</option>
        </select>
        <svg class="fdc-chevron" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 10l5 5 5-5z"/></svg>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="trechoSentido">Trecho e Sentido da Linha</label>
      <div class="fdc-wrap">
        <input id="trechoSentido" class="fdc-input" type="text"
          :value="v.trechoSentido"
          placeholder="Ex: Estação Brás – Ferraz de Vasconcelos (ou deixe em branco)"
          @input="u('trechoSentido', $event.target.value)" />
        <button v-if="v.trechoSentido" class="fdc-clear" type="button"
          @click="u('trechoSentido', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-field">
      <label class="fdc-lbl" for="kmPoste">Nº do Quilômetro e Poste</label>
      <div class="fdc-hint">Padrão "00/00". Ex: "51/02" (ou deixe em branco)</div>
      <div class="fdc-wrap">
        <input id="kmPoste" class="fdc-input" type="text"
          :value="v.kmPoste"
          placeholder="Ex: 51/02"
          @input="u('kmPoste', $event.target.value)" />
        <button v-if="v.kmPoste" class="fdc-clear" type="button"
          @click="u('kmPoste', '')" aria-label="Limpar">×</button>
      </div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl" for="latitude">Latitude (WGS84)</label>
        <div class="fdc-wrap">
          <input id="latitude" class="fdc-input" type="number" step="any"
            :value="v.latitude"
            placeholder="Ex: -23.020506"
            @input="u('latitude', $event.target.value)" />
          <button v-if="v.latitude" class="fdc-clear" type="button"
            @click="u('latitude', null)" aria-label="Limpar">×</button>
        </div>
      </div>
      <div class="fdc-field">
        <label class="fdc-lbl" for="longitude">Longitude (WGS84)</label>
        <div class="fdc-wrap">
          <input id="longitude" class="fdc-input" type="number" step="any"
            :value="v.longitude"
            placeholder="Ex: -46.010203"
            @input="u('longitude', $event.target.value)" />
          <button v-if="v.longitude" class="fdc-clear" type="button"
            @click="u('longitude', null)" aria-label="Limpar">×</button>
        </div>
      </div>
    </div>

    <div class="fdc-row">
      <div class="fdc-field">
        <label class="fdc-lbl" for="latitudeSirgas2000">Latitude (m) - SIRGAS2000</label>
        <div class="fdc-wrap">
          <input id="latitudeSirgas2000" class="fdc-input" type="number" step="0.001"
            :value="v.latitudeSirgas2000"
            placeholder="Ex: 325.421"
            @input="u('latitudeSirgas2000', $event.target.value)" />
          <button v-if="v.latitudeSirgas2000" class="fdc-clear" type="button"
            @click="u('latitudeSirgas2000', null)" aria-label="Limpar">×</button>
        </div>
      </div>
      <div class="fdc-field">
        <label class="fdc-lbl" for="longitudeSirgas2000">Longitude (m) - SIRGAS2000</label>
        <div class="fdc-wrap">
          <input id="longitudeSirgas2000" class="fdc-input" type="number" step="0.001"
            :value="v.longitudeSirgas2000"
            placeholder="Ex: 7456589.000"
            @input="u('longitudeSirgas2000', $event.target.value)" />
          <button v-if="v.longitudeSirgas2000" class="fdc-clear" type="button"
            @click="u('longitudeSirgas2000', null)" aria-label="Limpar">×</button>
        </div>
      </div>
    </div>

    <button class="fdc-gps" type="button" @click="obterGPS" :disabled="gpsLoading">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
      {{ gpsLoading ? 'Obtendo GPS…' : 'Preencher Latitude / Longitude via GPS' }}
    </button>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ modelValue: { type: Object, required: true } })
const emit  = defineEmits(['update:modelValue'])

const v = props.modelValue
const gpsLoading = ref(false)

const MUNICIPIOS = [
  'São Paulo','Guarulhos','Mogi das Cruzes','Suzano','Poá','Ferraz de Vasconcelos',
  'Ribeirão Pires','Rio Grande da Serra','Santo André','Osasco','Carapicuíba','Barueri',
  'Jandira','Itapevi','Campo Limpo Paulista','Várzea Paulista','Jundiaí',
  'Franco da Rocha','Francisco Morato','Caieiras','Itaquaquecetuba',
]
const LINHAS = [
  'Linha 07 - Rubi','Linha 08 - Diamante','Linha 09 - Esmeralda',
  'Linha 10 - Turquesa','Linha 11 - Coral','Linha 12 - Safira','Linha 13 - Jade','Sem linha associada','Linha não informada',
]
const ESTACOES = [
  'Estação Luz','Estação Brás','Estação Tatuapé','Estação Palmeiras-Barra Funda',
  'Estação Júlio Prestes','Estação Osasco','Estação Jundiaí','Estação Campo Limpo Paulista',
  'Estação Franco da Rocha','Estação Francisco Morato','Estação Várzea Paulista',
  'Estação Mogi das Cruzes','Estação Suzano','Estação Poá','Estação Ferraz de Vasconcelos',
  'Estação Ribeirão Pires','Estação Rio Grande da Serra','Estação Grajaú','Estação Água Branca',
  'Estação Santo André','Estação Jardim Helena - Vila Mara',
]
const VIAS = [
  'Via 01','Via 02','Via 03','Via 04','Via 05','Via 06','Via 08','Via 09','Via 10',
  'Via 01S - Trecho 1','Via 01S - Trecho 2','Via 02S - Trecho 1','Via 02S - Trecho 2',
  'Via 03E - Trecho 2','Via 04E - Trecho 2','Via Auxiliar','Via Variante','Travessão - AMV',
  'Não se aplica(m)','Inexistente(s)','Indefinido(a)(s)','Não avaliado(a)(s)',
]

function u(field, val) {
  emit('update:modelValue', { ...props.modelValue, [field]: val })
}

function obterGPS() {
  if (!navigator.geolocation) return
  gpsLoading.value = true
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsLoading.value = false
      emit('update:modelValue', {
        ...props.modelValue,
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
    },
    () => { gpsLoading.value = false },
    { timeout: 10000, enableHighAccuracy: true }
  )
}
</script>

<style scoped>
.fdc-etapa { padding: var(--s-lg) var(--s-md); animation: fadeInUp 0.3s ease both; }

.fdc-auto--locked {
  opacity: 0.72;
}
</style>
