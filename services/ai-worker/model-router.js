const { scanObject, DISCLAIMER } = require('../shared/compliance');
function analyze(normalizedNews, db){
  const theme = db.themes[0];
  const card = {
    version:'mvp.domestic.display.v1',
    source:{ title:normalizedNews.title, source_name:normalizedNews.sourceName, source_url:normalizedNews.sourceUrl, publish_time:normalizedNews.publishTime, crawled_at:new Date().toISOString() },
    event:{ title:normalizedNews.title, summary:normalizedNews.summary, is_valid_catalyst:true, catalyst_sentence:normalizedNews.summary, confidence_score:82 },
    catalyst:{ type:'\u653f\u7b56/\u4ea7\u4e1a\u50ac\u5316', level:'L2', timeliness_score:80, reason:'\u516c\u5f00\u4fe1\u606f\u51fa\u73b0\u653f\u7b56\u3001\u8ba2\u5355\u6216\u4ea7\u4e1a\u94fe\u534f\u540c\u4fe1\u53f7' },
    theme:{ theme_id:theme.id, name:theme.name, core_logic:theme.logic, heat_score:theme.heatScore, heat_change_percent:5.2, tags:theme.tags },
    theme_chain:{ chain_summary:'\u4e0a\u6e38\u4f9b\u7ed9\u3001\u4e2d\u6e38\u5236\u9020\u3001\u4e0b\u6e38\u5e94\u7528\u4e0e\u670d\u52a1\u95ed\u73af\u8ddf\u8e2a', nodes:db.themeChainNodes.filter(n=>n.themeId===theme.id), edges:db.themeChainEdges.filter(e=>e.themeId===theme.id) },
    companies:db.themeCompanyMatches.filter(m=>m.themeId===theme.id),
    evidences:db.evidences.filter(e=>e.themeId===theme.id),
    risks:db.riskNotes.filter(r=>r.themeId===theme.id),
    observation_points:db.observations.filter(o=>o.themeId===theme.id),
    expectation_gap:{ cards:db.expectationGapCards||[], leading_signals:db.leadingSignals||[], company_transmissions:db.companyTransmissions||[], evidence_matrix:db.evidenceMatrix||[], score_evidence:db.scoreEvidence||[] },
    publish:{ review_status:'pending_review', publish_status:'draft', published_at:'' },
    compliance:{ status:'passed', blocked_terms:[], disclaimer:DISCLAIMER },
    trace:{ trace_id:'trace-mock-001', run_id:'ai-run-001', generated_at:new Date().toISOString() }
  };
  const blocked = scanObject(card); card.compliance.blocked_terms = blocked; card.compliance.status = blocked.length ? 'blocked' : 'passed';
  return card;
}
module.exports = { analyze };
