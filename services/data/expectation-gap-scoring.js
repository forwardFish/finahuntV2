const SCORE_FIELDS = [
  'changeReality',
  'changeDirection',
  'sustainability',
  'transmissionPath',
  'recognitionGap',
  'catalystTimeline',
];

function weightedAverage(rows) {
  const totalWeight = rows.reduce((sum, row) => sum + Number(row.weight || 1), 0);
  if (!totalWeight) return 0;
  const raw = rows.reduce((sum, row) => sum + Number(row.score || 0) * Number(row.weight || 1), 0) / totalWeight;
  const penalty = rows.reduce((sum, row) => sum + Number(row.missingDataPenalty || 0), 0) / rows.length;
  return Math.max(0, Math.min(100, Math.round(raw - penalty)));
}

function confidenceFromEvidence(scoreRows, evidenceRows) {
  const levels = new Set((evidenceRows || []).map((row) => row.evidenceLevel));
  const hasHardGap = (scoreRows || []).some((row) => Number(row.missingDataPenalty || 0) >= 15);
  if (hasHardGap || levels.has('weak')) return 'medium_low';
  if (levels.has('strong') && levels.has('medium')) return 'medium';
  return 'low';
}

function applyExpectationGapScores(db) {
  const scoreRows = db.scoreEvidence || [];
  const evidenceRows = db.evidenceMatrix || [];
  const cards = (db.expectationGapCards || []).map((card) => {
    const rows = scoreRows.filter((row) => row.cardId === card.id);
    if (!rows.length) return card;
    const scoreBreakdown = {};
    for (const field of SCORE_FIELDS) {
      const fieldRows = rows.filter((row) => row.dimension === field);
      scoreBreakdown[field] = fieldRows.length ? weightedAverage(fieldRows) : 0;
    }
    const expectationGapScore = weightedAverage(SCORE_FIELDS.map((dimension) => ({
      score: scoreBreakdown[dimension],
      weight: dimension === 'transmissionPath' || dimension === 'recognitionGap' ? 1.2 : 1,
    })));
    return {
      ...card,
      scoreBreakdown,
      expectationGapScore,
      confidence: confidenceFromEvidence(rows, evidenceRows.filter((row) => row.cardId === card.id)),
      scoreMethod: 'evidence_weighted_v1',
    };
  });
  return { ...db, expectationGapCards: cards };
}

module.exports = { SCORE_FIELDS, applyExpectationGapScores };
