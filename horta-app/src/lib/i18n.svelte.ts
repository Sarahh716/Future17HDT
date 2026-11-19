// PT-BR (default) / EN. UI strings live in D as [pt, en]; data fields use L() (reads *_pt / *_en columns from seed.json).
export type Lang = 'pt' | 'en';
export const i18n = $state({ lang: 'pt' as Lang });

export function setLang(l: Lang) {
	i18n.lang = l;
	try { localStorage.setItem('lang', l); } catch { /* private mode: keep in memory only */ }
	document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
}
export function initLang() {
	let s: string | null = null;
	try { s = localStorage.getItem('lang'); } catch { /* ignore */ }
	setLang(s === 'en' ? 'en' : 'pt');
}

type V = string | ((...a: any[]) => string);
const D: Record<string, [V, V]> = {
	back: ['Voltar', 'Back'],
	'net.on': ['📶 online', '📶 online'], 'net.off': ['📴 offline', '📴 offline'],
	'nav.home': ['Início', 'Home'], 'nav.plants': ['Plantas', 'Plants'], 'nav.plan': ['Planejar', 'Plan'], 'nav.log': ['Registrar', 'Record'], 'nav.panel': ['Painel', 'Dashboard'],
	'title.app': ['Horta da Terra', 'Horta da Terra'], 'title.sync': ['Sincronizar', 'Sync'], 'title.explore': ['Explorar espécies', 'Explore species'], 'title.plant': ['Planta', 'Plant'],
	'role.farmer': ['Agricultor', 'Farmer'], 'role.technician': ['Técnico', 'Technician'], 'role.manager': ['Gestão', 'Manager'], 'role.educator': ['Escola', 'School'],
	'home.species': [(n: number) => `${n} espécies`, (n: number) => `${n} species`],
	'home.planSub': ['o que plantar', 'what to plant'], 'home.logSub': ['funciona sem internet', 'works without internet'],
	'home.toSend': [(n: number) => `${n} para enviar`, (n: number) => `${n} to send`], 'home.allSent': ['tudo enviado', 'all sent'],
	'home.exploreSub': ['o que outros quintais da região cultivam', 'what other homegardens in the region grow'],
	'home.note': ['Tudo é salvo neste aparelho. Quando houver internet, toque em <b>Sincronizar</b>.', 'Everything is saved on this device. When you have internet, tap <b>Sync</b>.'],
	'tag.grows': ['HdT cultiva', 'HdT grows'],
	'ev.company_reported': ['Relatado pela empresa', 'Company-reported'], 'ev.published_research': ['Pesquisa publicada', 'Published research'],
	'ev.field_validated': ['Validado no campo', 'Field-validated'], 'ev.hypothesis': ['Hipótese – validar', 'Hypothesis – to validate'], 'ev.data_gap': ['Sem dados', 'No data'],
	'f.layer': ['Camada', 'Layer'], 'f.light': ['Luz', 'Light'], 'f.water': ['Água', 'Water'], 'f.soil': ['Solo', 'Soil'], 'f.harvest': ['Colheita', 'Harvest'],
	'f.yield': ['Produção', 'Yield'], 'f.disease': ['Doenças', 'Diseases'], 'f.layout': ['Como plantar', 'How to plant'], 'f.note': ['Nota', 'Note'],
	'water.high': ['💧💧💧 muita', '💧💧💧 a lot'], 'water.medium': ['💧💧 média', '💧💧 medium'], 'water.low': ['💧 pouca', '💧 little'],
	'plant.nodata': ['Ainda não há dados desta planta. Registre o que observar no campo.', 'There is no data for this plant yet. Record what you observe in the field.'],
	'plant.notfound': ['Planta não encontrada.', 'Plant not found.'], 'plant.listen': ['🔊 Ouvir', '🔊 Listen'],
	'survey.title': ['Em quintais da região', 'In regional homegardens'],
	'survey.line': [(n: number, m: number, o: string, u: string) => `${n} registros em ${m} município(s) · ${o} · ${u}`, (n: number, m: number, o: string, u: string) => `${n} records in ${m} municipality(ies) · ${o} · ${u}`],
	'survey.note': ['Levantamento de quintais de Santarém, Belterra e Mojuí dos Campos. Mostra o que as pessoas cultivam, não produtividade, e é outra região (não Santo Antônio do Tauá).', 'Survey of homegardens in Santarém, Belterra and Mojuí dos Campos. It shows what people grow, not productivity, and it is a different region (not Santo Antônio do Tauá).'],
	'rel.title': ['Combina com', 'Pairs with'], 'rel.note': ['Origem: planilha da equipe – não validado.', 'Source: team spreadsheet – not validated.'],
	'rel.intercrop': ['Consórcio', 'Intercrop'], 'rel.companion': ['Plantas companheiras', 'Companion plants'], 'rel.plant_under': ['Plantar sob', 'Plant under'],
	'alerts.title': ['Alertas por clima', 'Climate alerts'], 'sc.el_nino': ['☀️ El Niño', '☀️ El Niño'], 'sc.la_nina': ['🌧️ La Niña', '🌧️ La Niña'], 'sc.any': ['•', '•'],
	'origin.Native': ['Nativa', 'Native'], 'origin.Cultivated': ['Cultivada', 'Cultivated'], 'origin.Naturalized': ['Naturalizada', 'Naturalized'],
	'use.Food': ['Alimento', 'Food'], 'use.Food/Medicinal': ['Alimento/Medicinal', 'Food/Medicinal'], 'use.Shading': ['Sombra', 'Shade'], 'use.Medicinal': ['Medicinal', 'Medicinal'], 'use.Ornamental': ['Ornamental', 'Ornamental'],
	'habit.Tree': ['Árvore', 'Tree'], 'habit.Herb': ['Erva', 'Herb'], 'habit.Palm': ['Palmeira', 'Palm'], 'habit.Bush': ['Arbusto', 'Bush'], 'habit.Tree - Bush': ['Árvore/Arbusto', 'Tree/Bush'], 'habit.Liana': ['Cipó', 'Liana'],
	'plan.climate': ['Clima esperado', 'Expected climate'], 'plan.water': ['Água na área', 'Water on the farm'], 'plan.shade': ['Sombra de árvores', 'Tree shade'],
	'plan.normal': ['Normal', 'Normal'], 'plan.el_nino': ['Seca (El Niño)', 'Drought (El Niño)'], 'plan.la_nina': ['Chuva forte (La Niña)', 'Heavy rain (La Niña)'],
	'plan.rain_only': ['Só chuva', 'Rain only'], 'plan.spring_or_stream': ['Nascente/rio', 'Spring/river'], 'plan.irrigation': ['Irrigação', 'Irrigation'], 'plan.unknown': ['Não sei', "I don't know"],
	'plan.low': ['Pouca', 'Little'], 'plan.medium': ['Média', 'Medium'], 'plan.high': ['Muita', 'A lot'],
	'plan.result': ['Resultado', 'Result'],
	'plan.note': ['Regras simples e abertas, escritas a partir das pesquisas da equipe. Ainda são <b>hipóteses</b>: devem ser validadas com os técnicos e agricultores antes de virar recomendação.', 'Simple, open rules written from the team\'s research. They are still <b>hypotheses</b>: they must be validated with technicians and farmers before becoming a recommendation.'],
	'plan.avoid': ['Evitar', 'Avoid'], 'plan.conditional': ['Com cuidado', 'With care'], 'plan.prefer': ['Boa escolha', 'Good choice'],
	'plan.none': ['Nenhum alerta de espécie para essa combinação. Isso <b>não</b> quer dizer que está tudo certo – só que ainda não há regra.', 'No species alerts for this combination. This does <b>not</b> mean everything is fine – only that there is no rule yet.'],
	'plan.practices': ['Práticas', 'Practices'],
	'log.plot': ['Parcela', 'Plot'], 'log.newPlot': ['+ nova', '+ new'], 'log.plotPrompt': ['Nome da parcela?', 'Plot name?'], 'log.pickPlot': ['Escolha ou crie uma parcela.', 'Choose or create a plot.'],
	'log.what': ['O que aconteceu?', 'What happened?'], 'log.species': ['Planta', 'Plant'], 'log.none': ['— nenhuma / geral —', '— none / general —'],
	'log.qty': ['Quantidade', 'Quantity'], 'log.sev': ['Quão grave?', 'How serious?'], 'log.photo': ['Foto (opcional)', 'Photo (optional)'], 'log.note': ['Anotação', 'Note'],
	'log.save': ['💾 Salvar neste aparelho', '💾 Save on this device'],
	'unit.kg': ['kg', 'kg'], 'unit.g': ['g', 'g'], 'unit.unid.': ['unid.', 'units'], 'unit.maços': ['maços', 'bunches'],
	'kind.harvest': ['Colheita', 'Harvest'], 'kind.survival': ['Mudas vivas', 'Seedlings alive'], 'kind.pest_disease': ['Praga/doença', 'Pest/disease'],
	'kind.weather_event': ['Clima', 'Weather'], 'kind.soil': ['Solo', 'Soil'], 'kind.note': ['Anotação', 'Note'],
	'sync.online': ['📶 Com internet', '📶 Online'], 'sync.offline': ['📴 Sem internet', '📴 No internet'],
	'sync.pending': [(n: number) => `<b>${n}</b> registro(s) esperando envio.`, (n: number) => `<b>${n}</b> record(s) waiting to be sent.`],
	'sync.done': ['✅ Tudo enviado.', '✅ Everything sent.'], 'sync.send': ['🔄 Enviar agora', '🔄 Send now'],
	'sync.fail': ['⚠️ Não foi possível falar com o servidor agora. Seus dados continuam salvos neste aparelho.', '⚠️ Could not reach the server right now. Your data is still saved on this device.'],
	'sync.longTitle': ['Sem sinal por muito tempo?', 'No signal for a long time?'],
	'sync.longText': ['Exporte um arquivo e envie por WhatsApp ou pen-drive ao técnico.', 'Export a file and send it to the technician by WhatsApp or USB drive.'],
	'sync.export': ['⬇️ Exportar registros (JSON)', '⬇️ Export records (JSON)'],
	'panel.summary': ['Resumo (neste aparelho)', 'Summary (on this device)'], 'panel.records': ['Registros', 'Records'], 'panel.unsent': ['Não enviados', 'Not sent'],
	'panel.harvest': ['Colheita registrada', 'Harvest recorded'], 'panel.recent': ['Últimos registros', 'Latest records'], 'panel.empty': ['Nenhum registro ainda.', 'No records yet.'],
	'panel.lock': ['🔒 <b>Conhecimento tradicional:</b> bloqueado. Nada é coletado nem publicado sem consulta à comunidade, consentimento informado e acordo sobre propriedade e acesso. Por padrão, todo conhecimento fica <i>privado</i>.', '🔒 <b>Traditional knowledge:</b> locked. Nothing is collected or published without consulting the community, informed consent, and an agreement on ownership and access. By default, all knowledge stays <i>private</i>.'],
	'panel.sources': ['Fontes dos dados', 'Data sources'],
	'explore.intro': ['Espécies comuns em quintais de Santarém, Belterra e Mojuí dos Campos (5.323 registros, 178 espécies) que <b>ainda não estão</b> no portfólio. Ponto de partida para pensar em biodiversidade e novos produtos. Isso mostra o que as pessoas cultivam, <b>não</b> se a espécie dá certo ou vale a pena em Santo Antônio do Tauá. Qualquer uso de saberes locais exige consulta e consentimento da comunidade.', 'Species common in homegardens in Santarém, Belterra and Mojuí dos Campos (5,323 records, 178 species) that are <b>not yet</b> in the portfolio. A starting point for thinking about biodiversity and new products. This shows what people grow, <b>not</b> whether a species works or pays off in Santo Antônio do Tauá. Any use of local knowledge requires consultation and consent from the community.'],
	'explore.all': ['Todas', 'All'], 'explore.native': ['🌎 Só nativas', '🌎 Native only'],
	'explore.counts': [(n: number, m: number) => `${n} registros · ${m} município(s)`, (n: number, m: number) => `${n} records · ${m} municipality(ies)`]
};

/** Translate a UI key. Reads i18n.lang, so it is reactive inside templates and $derived. Unknown key -> the key itself. */
export function t(key: string, ...args: unknown[]): string {
	const e = D[key];
	if (!e) return key;
	const v = e[i18n.lang === 'pt' ? 0 : 1];
	return typeof v === 'function' ? v(...args) : v;
}
/** Translate by prefix + raw value (e.g. tr('origin', 'Native')); falls back to the raw value. */
export function tr(prefix: string, value: string): string {
	return D[`${prefix}.${value}`] ? t(`${prefix}.${value}`) : value;
}
/** Localized data field: pt -> f_pt ?? f ; en -> f_en ?? f_pt ?? f. */
export function L(o: any, f: string): string | null {
	const pt = o[`${f}_pt`] ?? o[f] ?? null;
	return i18n.lang === 'en' ? (o[`${f}_en`] ?? pt) : pt;
}
