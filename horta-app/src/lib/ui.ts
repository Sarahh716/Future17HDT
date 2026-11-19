import type { Species } from './types';
import { i18n } from './i18n.svelte';
export const LAYER_ICON: Record<string, string> = { ground: '🌱', lower_mid: '🥬', mid: '🌿', canopy: '🌳' };
const SP_ICON: Record<string, string> = { Banana: '🍌', 'Açaí': '🌴', Cacau: '🍫', Mandioca: '🥔', Jaca: '🍈', Graviola: '🍈', 'Castanha-do-Brasil': '🌰', Jambu: '🌼', 'Ingá': '🫘', 'Feijão-guandu': '🫘' };
export const icon = (s: Species) => SP_ICON[s.common_name_pt] ?? LAYER_ICON[s.layer_id] ?? '🌱';
// [id, emoji]; labels come from i18n (kind.<id>, role.<id>)
export const KINDS: [string, string][] = [['harvest', '🧺'], ['survival', '🌱'], ['pest_disease', '🐛'], ['weather_event', '⛈️'], ['soil', '🟤'], ['note', '📝']];
export const ROLES: [string, string][] = [['farmer', '🧑‍🌾'], ['technician', '🧑‍🔬'], ['manager', '📊'], ['educator', '🎓']];
export const evClass = (e: string) => (e === 'hypothesis' ? 'hyp' : e === 'data_gap' ? '' : 'ok');
export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
export function speak(t: string) {
	if (!canSpeak()) return;
	speechSynthesis.cancel();
	const u = new SpeechSynthesisUtterance(t);
	u.lang = i18n.lang === 'pt' ? 'pt-BR' : 'en-US';
	speechSynthesis.speak(u);
}
