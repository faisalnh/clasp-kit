function calculateAssessment(payload) {
  payload = validateSubmissionPayload(payload);
  var rubric = getRubric(payload.model);
  var adjustedIndicators = getAdjustedIndicators(payload.model, payload.waterNA);
  var responsesById = {};
  payload.responses.forEach(function (response) { responsesById[response.indicatorId] = response; });

  var responseRows = [];
  var rawScore = 0;
  adjustedIndicators.forEach(function (indicator) {
    var response = responsesById[indicator.id] || {};
    var score = indicator.weight === 0 ? 0 : validateScore(response.score || 0);
    var awarded = round2_((score / 3) * indicator.weight);
    rawScore += awarded;
    responseRows.push({
      indicator_id: indicator.id,
      pillar: indicator.pillar,
      indicator_title: indicator.title,
      weight: indicator.weight,
      score_0_to_3: score,
      awarded_points: awarded,
      evidence_type: safeString_(response.evidenceType),
      evidence_note: safeString_(response.evidenceNote),
      evidence_url: safeString_(response.evidenceUrl)
    });
  });
  rawScore = round2_(rawScore);
  var initial = ratingForScore(rawScore);
  var capResult = applyCapRules_(rubric, payload, responseRows, initial.rating);
  var finalRating = capResult.status === 'RETURN_FOR_REVISION' ? 'REVISION REQUIRED' : capResult.finalRating;
  var label = capResult.status === 'RETURN_FOR_REVISION' ? 'Revision Required' : ratingLabel(finalRating);
  return {
    rawScore: rawScore,
    initialRating: initial.rating,
    finalRating: finalRating,
    finalRatingLabel: label,
    shortDescription: capResult.status === 'RETURN_FOR_REVISION' ? 'Return for revision before a rating is inserted into the proposal.' : RATING_DESCRIPTIONS[finalRating],
    capApplied: capResult.capApplied,
    capReason: capResult.capReason,
    status: capResult.status,
    responses: responseRows,
    capFlags: capResult.capFlags
  };
}

function ratingForScore(score) {
  score = Number(score);
  if (score >= 85) return { rating: 'S', label: 'Excellent' };
  if (score >= 70) return { rating: 'A', label: 'Good' };
  if (score >= 55) return { rating: 'B', label: 'Acceptable' };
  if (score >= 40) return { rating: 'C', label: 'Weak' };
  return { rating: 'D', label: 'Poor / Not Evidenced' };
}

function ratingLabel(rating) {
  var labels = { S: 'Excellent', A: 'Good', B: 'Acceptable', C: 'Weak', D: 'Poor / Not Evidenced' };
  return labels[rating] || '';
}

function lowerRating_(rating, maxRating) {
  if (!rating) return maxRating;
  return RATING_ORDER.indexOf(rating) > RATING_ORDER.indexOf(maxRating) ? maxRating : rating;
}

function applyCapRules_(rubric, payload, responseRows, initialRating) {
  var submitted = normalizeCapFlags_(payload.capFlags);
  var noEvidenceForScoresAbove1 = responseRows.some(function (row) {
    return Number(row.score_0_to_3) > 1;
  }) && responseRows.filter(function (row) {
    return Number(row.score_0_to_3) > 1;
  }).every(function (row) {
    return !safeString_(row.evidence_note) && !safeString_(row.evidence_url);
  });

  var finalRating = initialRating;
  var capApplied = false;
  var reasons = [];
  var status = 'SUBMITTED';
  var capFlags = rubric.capRules.map(function (rule) {
    var triggered = !!submitted[rule.id];
    if (rule.label === 'Assessment form not attached' && !payload.assessmentAttached) triggered = true;
    if (rule.auto && rule.label === 'No evidence for any score above 1' && noEvidenceForScoresAbove1) triggered = true;
    var reviewNote = safeString_(submitted[rule.id + '_note']);
    if (triggered) {
      capApplied = true;
      reasons.push(rule.label);
      if (rule.maxRating === 'REVISION') status = 'RETURN_FOR_REVISION';
      else finalRating = lowerRating_(finalRating, rule.maxRating);
    }
    return {
      cap_rule_id: rule.id,
      cap_rule_label: rule.label,
      max_rating: rule.maxRating,
      triggered: triggered,
      review_note: reviewNote
    };
  });
  return { finalRating: finalRating, capApplied: capApplied, capReason: reasons.join('; '), status: status, capFlags: capFlags };
}

function normalizeCapFlags_(capFlags) {
  var map = {};
  if (Array.isArray(capFlags)) {
    capFlags.forEach(function (flag) {
      if (typeof flag === 'string') map[flag] = true;
      else if (flag && flag.id) {
        map[flag.id] = boolValue_(flag.triggered);
        if (flag.reviewNote) map[flag.id + '_note'] = flag.reviewNote;
      }
    });
  } else if (capFlags && typeof capFlags === 'object') {
    Object.keys(capFlags).forEach(function (key) {
      if (typeof capFlags[key] === 'object') {
        map[key] = boolValue_(capFlags[key].triggered);
        map[key + '_note'] = capFlags[key].reviewNote || '';
      } else {
        map[key] = boolValue_(capFlags[key]);
      }
    });
  }
  return map;
}
