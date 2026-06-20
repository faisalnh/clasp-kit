function doGet(e) {
  return routeRequest(e || { parameter: {} });
}

function submitAssessment(payload) {
  try {
    payload = validateSubmissionPayload(payload);
    var calculation = calculateAssessment(payload);
    var saved = saveAssessment(payload, calculation);
        saved.insertUrl = buildRouteUrl_('insert', { id: saved.assessmentId });
        return saved;
  } catch (err) {
    return toUserError_(err);
  }
}

function apiGetAssessmentResult(assessmentId) {
  try {
    return getAssessmentResult(assessmentId);
  } catch (err) {
    return toUserError_(err);
  }
}

function apiInsertAssessmentToProposal(assessmentId, proposalDocUrl) {
  try {
    return insertAssessmentToProposal(assessmentId, proposalDocUrl);
  } catch (err) {
    return toUserError_(err);
  }
}

function apiGetLatestAssessments(limit) {
  try {
    return getLatestAssessments(limit || 5);
  } catch (err) {
    return toUserError_(err);
  }
}
