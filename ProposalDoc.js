function insertAssessmentToProposal(assessmentId, proposalDocUrl) {
  var result;
  var insertId = generateInsertId_();
  var docId = '';
  try {
    assessmentId = validateAssessmentId(assessmentId);
    proposalDocUrl = validateGoogleDocUrl(proposalDocUrl, false);
    docId = extractGoogleDocId(proposalDocUrl);
    result = getAssessmentResult(assessmentId);
    var assessment = result.assessment;
    if (assessment.status !== 'SUBMITTED' && assessment.status !== 'APPROVED') {
      throw new Error('Proposal rating can only be inserted when the assessment status is SUBMITTED or APPROVED. Current status: ' + assessment.status);
    }
    if (!assessment.final_rating || assessment.final_rating === 'REVISION REQUIRED') {
      throw new Error('This assessment does not have an insertable final rating.');
    }
    var insertedText = assessment.final_rating + ' (' + Number(assessment.raw_score).toFixed(2) + '/100), Assessment Result';
    var replacement = replaceFirstRatingPlaceholder_(docId, insertedText, assessment.result_url);
    updateAssessmentProposalDoc_(assessmentId, proposalDocUrl, docId);
    logProposalInsertion({
      insert_id: insertId,
      assessment_id: assessmentId,
      proposal_doc_id: docId,
      proposal_doc_url: proposalDocUrl,
      inserted_by: getActiveUserEmail_(),
      inserted_at: nowIso_(),
      inserted_text: insertedText,
      result_url: assessment.result_url,
      insert_status: 'SUCCESS',
      error_message: ''
    });
    return { success: true, insertedText: insertedText, proposalDocUrl: proposalDocUrl, resultUrl: assessment.result_url, replacements: replacement.replacements };
  } catch (err) {
    try {
      logProposalInsertion({
        insert_id: insertId,
        assessment_id: assessmentId || '',
        proposal_doc_id: docId,
        proposal_doc_url: proposalDocUrl || '',
        inserted_by: getActiveUserEmail_(),
        inserted_at: nowIso_(),
        inserted_text: '',
        result_url: result && result.assessment ? result.assessment.result_url : '',
        insert_status: 'FAILED',
        error_message: err.message
      });
    } catch (logErr) {}
    throw err;
  }
}

function replaceFirstRatingPlaceholder_(docId, insertedText, resultUrl) {
  var doc = DocumentApp.openById(docId);
  var body = doc.getBody();
  var found = body.findText(CONFIG.PLACEHOLDER);
  if (!found) {
    throw new Error('Placeholder <<rating>> was not found in the proposal document.');
  }
  var text = found.getElement().asText();
  var start = found.getStartOffset();
  var end = found.getEndOffsetInclusive();
  text.deleteText(start, end);
  text.insertText(start, insertedText);

  // Identify the rating letter (the leading token before the space, e.g. "S", "A", "B", "C", "D").
  var spaceIdx = insertedText.indexOf(' ');
  var ratingLetter = spaceIdx > 0 ? insertedText.substring(0, spaceIdx) : insertedText.charAt(0);
  var ratingColor = ratingColorHex_(ratingLetter);

  // Bold + color only the rating letter; keep the score number in normal content style.
  var letterStart = start;
  var letterEnd = start + ratingLetter.length - 1;
  if (letterEnd >= letterStart) {
    text.setBold(letterStart, letterEnd, true);
    if (ratingColor) text.setForegroundColor(letterStart, letterEnd, ratingColor);
  }

  // Ensure the score portion (everything after the letter, up to the link label) stays normal weight & default color.
  var linkLabel = 'Assessment Result';
  var linkStart = start + insertedText.indexOf(linkLabel);
  var linkEnd = linkStart + linkLabel.length - 1;
  var afterLetter = letterEnd + 1;
  if (linkStart - 1 >= afterLetter) {
    text.setBold(afterLetter, linkStart - 1, false);
    text.setForegroundColor(afterLetter, linkStart - 1, '#2d2d2d');
  }

  // Link the "Assessment Result" label using the document's default link style.
  text.setLinkUrl(linkStart, linkEnd, resultUrl);
  text.setBold(linkStart, linkEnd, false);
  doc.saveAndClose();
  return { replacements: 1 };
}

function ratingColorHex_(rating) {
  switch (String(rating || '').toUpperCase()) {
    case 'S': return '#096b3a';
    case 'A': return '#145a8a';
    case 'B': return '#805600';
    case 'C': return '#934b00';
    case 'D': return '#6b0f0a';
    default:  return '#2d2d2d';
  }
}
