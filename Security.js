function validateModel(model) {
  if (model !== MODELS.SCHOOL_ACTIVITY && model !== MODELS.ASSET_PROCUREMENT) {
    throw new Error('Invalid proposal model.');
  }
  return model;
}

function validateAssessmentId(assessmentId) {
  assessmentId = safeString_(assessmentId);
  if (!/^ASM-\d{8}-\d{6}-[A-Z0-9]{8}$/.test(assessmentId)) {
    throw new Error('Invalid assessment ID.');
  }
  return assessmentId;
}

function validateScore(score) {
  var n = Number(score);
  if ([0, 1, 2, 3].indexOf(n) === -1) throw new Error('Indicator scores must be 0, 1, 2, or 3.');
  return n;
}

function validateGoogleDocUrl(url, optional) {
  url = safeString_(url);
  if (!url && optional) return '';
  if (!extractGoogleDocId(url)) {
    throw new Error('Please enter a valid Google Docs URL.');
  }
  return url;
}

function extractGoogleDocId(url) {
  url = safeString_(url);
  var match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return '';
}

function validateSubmissionPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Missing assessment payload.');
  payload.model = validateModel(payload.model);
  payload.proposalTitle = safeString_(payload.proposalTitle);
  if (!payload.proposalTitle) throw new Error('Proposal title is required.');
  payload.proposalDocUrl = validateGoogleDocUrl(payload.proposalDocUrl, true);
  payload.assessmentAttached = boolValue_(payload.assessmentAttached);
  payload.waterNA = payload.model === MODELS.ASSET_PROCUREMENT && boolValue_(payload.waterNA);
  if (!Array.isArray(payload.responses)) throw new Error('Assessment responses are required.');
  payload.responses.forEach(function (response) {
    response.indicatorId = safeString_(response.indicatorId || response.indicator_id);
    response.score = validateScore(response.score);
    response.evidenceType = safeString_(response.evidenceType || response.evidence_type);
    response.evidenceNote = safeString_(response.evidenceNote || response.evidence_note);
    response.evidenceUrl = safeString_(response.evidenceUrl || response.evidence_url);
  });
  return payload;
}

function toUserError_(err) {
  var message = err && err.message ? err.message : String(err);
  return { success: false, error: message };
}
