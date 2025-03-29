const translationRules = require('../rules/translationRules');

/**
 * テキストに翻訳ルールを適用する
 * @param {string} text - 翻訳対象のテキスト
 * @returns {string} - 翻訳ルールが適用されたテキスト
 */
function applyTranslationRules(text) {
  let translatedText = text;

  // 各ルールを順番に適用
  translationRules.rules.forEach((rule) => {
    translatedText = translatedText.replace(rule.pattern, rule.replacement);
  });

  return translatedText;
}

/**
 * テキストを翻訳する
 * @param {string} text - 翻訳対象のテキスト
 * @param {string} sourceLang - ソース言語（デフォルト: 'en'）
 * @param {string} targetLang - ターゲット言語（デフォルト: 'ja'）
 * @returns {Promise<string>} - 翻訳されたテキスト
 */
async function translate(text, sourceLang = 'en', targetLang = 'ja') {
  try {
    // 翻訳ルールを適用
    const translatedText = applyTranslationRules(text);

    // TODO: 実際の翻訳APIを呼び出す
    // 現在は翻訳ルールの適用結果を返す
    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

module.exports = {
  translate,
  applyTranslationRules,
};
