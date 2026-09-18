/**
 * core/hyphenator.js - Módulo de Hifenização Silábica para Português
 * Baseado nas regras fonéticas da ABL e padrões Liang do TeX
 */

const Hyphenator = {
  VOWELS: 'aeiouáéíóúâêîôûãõàèìòùäëïöü',

  isVowel(c) {
    return c && this.VOWELS.includes(c.toLowerCase());
  },

  isConsonant(c) {
    return c && /[a-z]/i.test(c) && !this.isVowel(c);
  },

  syllabify(word) {
    const match = word.match(/^([^\wáéíóúâêîôûãõàèìòùç]*)([\wáéíóúâêîôûãõàèìòùç]+)([^\wáéíóúâêîôûãõàèìòùç]*)$/i);
    if (!match) return [word];

    const prefix = match[1];
    const core = match[2];
    const suffix = match[3];

    if (core.length <= 3) return [word];

    const letters = core.split('');
    const syllables = [];
    let cur = '';

    for (let i = 0; i < letters.length; i++) {
      cur += letters[i];
      const c = letters[i];
      const next = letters[i + 1];
      const next2 = letters[i + 2];
      const next3 = letters[i + 3];

      if (!next) break;

      // Dígrafos inseparáveis: ch, lh, nh, qu, gu
      const digraph = (c + next).toLowerCase();
      if (['ch', 'lh', 'nh', 'qu', 'gu'].includes(digraph)) {
        continue;
      }

      // Dígrafos separáveis: rr, ss, sc, sç, xc
      if (['rr', 'ss', 'sc', 'sç', 'xc'].includes(digraph)) {
        syllables.push(cur);
        cur = '';
        continue;
      }

      // Coda consonantal (ex: com-po, es-tag, im-pres, trans-bor)
      // Se c é consoante de fechamento (m, n, r, s, l, x, z) precedida de vogal, e next é outra consoante
      if (cur.length >= 2 && this.isConsonant(c) && ['m', 'n', 'r', 's', 'l', 'x', 'z'].includes(c.toLowerCase()) && this.isConsonant(next)) {
        // Exceto se next for encontro consonantal líquido como tr, pr, etc.
        const blend = (next + (next2 || '')).toLowerCase();
        if (!/[bcdfgptv][rl]/.test(blend)) {
          syllables.push(cur);
          cur = '';
          continue;
        }
      }

      // Regra V-CV: Vogal seguida de consoante única + vogal
      if (this.isVowel(c) && this.isConsonant(next) && next2 && this.isVowel(next2)) {
        syllables.push(cur);
        cur = '';
        continue;
      }

      // Regra VC-CV: Consoante + Consoante entre vogais (exceto encontros líquidos)
      if (this.isConsonant(c) && this.isConsonant(next)) {
        const blend = (c + next).toLowerCase();
        const isLiquidBlend = /[bcdfgptv][rl]/.test(blend);
        if (!isLiquidBlend) {
          syllables.push(cur);
          cur = '';
          continue;
        }
      }
    }

    if (cur.length > 0) {
      if (syllables.length === 0) {
        syllables.push(cur);
      } else {
        syllables[syllables.length - 1] += cur;
      }
    }

    syllables[0] = prefix + syllables[0];
    syllables[syllables.length - 1] = syllables[syllables.length - 1] + suffix;

    return syllables;
  },

  getHyphenationPoints(word, config = {}) {
    const { minWordLength = 5, minBefore = 2, minAfter = 2 } = config;
    const cleanLetters = word.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');
    if (cleanLetters.length < minWordLength) return [];

    const syllables = this.syllabify(word);
    if (syllables.length <= 1) return [];

    const cuts = [];
    let accumulated = '';

    for (let i = 0; i < syllables.length - 1; i++) {
      accumulated += syllables[i];
      const remainder = syllables.slice(i + 1).join('');
      const cleanBefore = accumulated.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');
      const cleanAfter = remainder.replace(/[^\wáéíóúâêîôûãõàèìòùç]/gi, '');

      if (cleanBefore.length >= minBefore && cleanAfter.length >= minAfter) {
        cuts.push({
          head: accumulated + '-',
          tail: remainder
        });
      }
    }

    // Retorna ordenado do maior corte (mais sílabas) para o menor
    return cuts.reverse();
  }
};

module.exports = { Hyphenator };

