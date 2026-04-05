/**
 * AI Indexing Module for Medico-Legal Reports
 * Uses NLP to analyze medical reports and extract:
 * - Keywords
 * - Injury type
 * - Case type classification
 * - Severity assessment
 */

const nlp = require('compromise');

/**
 * Extract keywords from text using NLP
 * @param {string} text - Input text to analyze
 * @returns {Array} Array of keywords (nouns and verbs)
 */
function extractKeywords(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const doc = nlp(text);
  
  // Get nouns and verbs
  const nouns = doc.nouns().out('array');
  const verbs = doc.verbs().out('array');
  const adjectives = doc.adjectives().out('array');
  
  // Combine and deduplicate, limit to 10 keywords
  const allWords = [...new Set([...nouns, ...verbs, ...adjectives])];
  
  // Filter out common stop words
  const stopWords = ['patient', 'case', 'report', 'suffered', 'found', 'observed', 'noted', 'showed', 'appeared', 'was', 'were', 'had', 'has', 'been'];
  const filteredKeywords = allWords.filter(word => 
    word.length > 2 && !stopWords.includes(word.toLowerCase())
  );
  
  return filteredKeywords.slice(0, 10);
}

/**
 * Identify injury type from text
 * @param {string} text - Input text to analyze
 * @returns {string} Injury type
 */
function identifyInjuryType(text) {
  if (!text || typeof text !== 'string') {
    return 'Unknown';
  }

  const lowerText = text.toLowerCase();

  // Physical injuries
  if (lowerText.includes('fracture') || lowerText.includes('broken') || lowerText.includes('bone')) {
    return 'Fracture';
  }
  if (lowerText.includes('burn') || lowerText.includes('scald')) {
    return 'Burn Injury';
  }
  if (lowerText.includes('cut') || lowerText.includes('laceration') || lowerText.includes('wound')) {
    return 'Laceration';
  }
  if (lowerText.includes('bruise') || lowerText.includes('contusion')) {
    return 'Bruise/Contusion';
  }
  if (lowerText.includes('dislocation') || lowerText.includes('sprain') || lowerText.includes('strain')) {
    return 'Sprain/Dislocation';
  }
  if (lowerText.includes('head injury') || lowerText.includes('trauma') || lowerText.includes('concussion')) {
    return 'Head Trauma';
  }
  if (lowerText.includes('internal') || lowerText.includes('bleeding') || lowerText.includes('hemorrhage')) {
    return 'Internal Injury';
  }
  if (lowerText.includes('poison') || lowerText.includes('toxic')) {
    return 'Poisoning';
  }
  if (lowerText.includes('electric') || lowerText.includes('shock')) {
    return 'Electric Shock';
  }
  if (lowerText.includes('drown')) {
    return 'Drowning';
  }
  if (lowerText.includes('asphyxia') || lowerText.includes('suffocate') || lowerText.includes('strangulation')) {
    return 'Asphyxia';
  }

  return 'General Injury';
}

/**
 * Classify case type based on text analysis
 * @param {string} text - Input text to analyze
 * @returns {string} Case type classification
 */
function classifyCase(text) {
  if (!text || typeof text !== 'string') {
    return 'General Injury';
  }

  const lowerText = text.toLowerCase();

  // Road traffic accidents
  if (lowerText.includes('road accident') || lowerText.includes('rta') || 
      lowerText.includes('traffic accident') || lowerText.includes('vehicle') ||
      lowerText.includes('car accident') || lowerText.includes('bike accident')) {
    return 'Road Accident';
  }

  // Physical assault
  if (lowerText.includes('assault') || lowerText.includes('attack') || 
      lowerText.includes('hit') || lowerText.includes('beaten') ||
      lowerText.includes('struck') || lowerText.includes('violence')) {
    return 'Physical Assault';
  }

  // Burn cases
  if (lowerText.includes('burn') || lowerText.includes('fire') || 
      lowerText.includes('chemical') || lowerText.includes('hot water')) {
    return 'Burn Injury';
  }

  // Fall cases
  if (lowerText.includes('fall') || lowerText.includes('fell') || 
      lowerText.includes('slip')) {
    return 'Fall Injury';
  }

  // Industrial accidents
  if (lowerText.includes('industrial') || lowerText.includes('factory') || 
      lowerText.includes('machinery') || lowerText.includes('workplace')) {
    return 'Industrial Accident';
  }

  // Medical malpractice
  if (lowerText.includes('medical malpractice') || lowerText.includes('negligence') ||
      lowerText.includes('surgical error') || lowerText.includes('wrong treatment')) {
    return 'Medical Malpractice';
  }

  // Poisoning
  if (lowerText.includes('poison') || lowerText.includes('toxic') || 
      lowerText.includes('overdose') || lowerText.includes('drug overdose')) {
    return 'Poisoning';
  }

  // Fire arm injury
  if (lowerText.includes('firearm') || lowerText.includes('gunshot') || 
      lowerText.includes('bullet') || lowerText.includes('fire arm')) {
    return 'Firearm Injury';
  }

  // Sexual assault
  if (lowerText.includes('sexual') || lowerText.includes('rape')) {
    return 'Sexual Assault';
  }

  // Animal/Insect bite
  if (lowerText.includes('bite') || lowerText.includes('dog bite') || 
      lowerText.includes('snake')) {
    return 'Animal Bite';
  }

  // Drowning
  if (lowerText.includes('drown') || lowerText.includes('water')) {
    return 'Drowning';
  }

  // Suicide attempt
  if (lowerText.includes('suicide') || lowerText.includes('self harm') || 
      lowerText.includes('overdose') || lowerText.includes('hanging')) {
    return 'Suicide Attempt';
  }

  return 'General Injury';
}

/**
 * Assess severity based on text analysis
 * @param {string} text - Input text to analyze
 * @returns {string} Severity level
 */
function assessSeverity(text) {
  if (!text || typeof text !== 'string') {
    return 'Unknown';
  }

  const lowerText = text.toLowerCase();
  let severityScore = 0;

  // Critical indicators
  if (lowerText.includes('death') || lowerText.includes('dead') || 
      lowerText.includes('fatal') || lowerText.includes('critical')) {
    severityScore += 5;
  }
  if (lowerText.includes('major') || lowerText.includes('severe') || 
      lowerText.includes('serious')) {
    severityScore += 3;
  }
  if (lowerText.includes('multiple') || lowerText.includes('extensive')) {
    severityScore += 3;
  }
  if (lowerText.includes('fracture') || lowerText.includes('broken bone')) {
    severityScore += 2;
  }
  if (lowerText.includes('bleeding') || lowerText.includes('hemorrhage')) {
    severityScore += 3;
  }
  if (lowerText.includes('internal')) {
    severityScore += 3;
  }
  if (lowerText.includes('burn') && (lowerText.includes('major') || lowerText.includes('severe'))) {
    severityScore += 4;
  }

  // Moderate indicators
  if (lowerText.includes('moderate') || lowerText.includes('significant')) {
    severityScore += 2;
  }
  if (lowerText.includes('laceration') || lowerText.includes('cut')) {
    severityScore += 1;
  }
  if (lowerText.includes('minor') || lowerText.includes('superficial')) {
    severityScore -= 1;
  }

  if (severityScore >= 8) return 'Critical';
  if (severityScore >= 5) return 'High';
  if (severityScore >= 2) return 'Medium';
  if (severityScore >= 1) return 'Low';
  return 'Minor';
}

/**
 * Main AI indexing function
 * @param {string} text - Input text to analyze
 * @returns {Object} AI indexing result
 */
function aiIndexing(text) {
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return {
      caseType: 'General Injury',
      keywords: [],
      injuryType: 'Unknown',
      severity: 'Unknown',
      indexedAt: new Date()
    };
  }

  const result = {
    caseType: classifyCase(text),
    keywords: extractKeywords(text),
    injuryType: identifyInjuryType(text),
    severity: assessSeverity(text),
    indexedAt: new Date()
  };

  return result;
}

module.exports = {
  aiIndexing,
  extractKeywords,
  classifyCase,
  identifyInjuryType,
  assessSeverity
};
