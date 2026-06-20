function getDb_() {
  if (!CONFIG.DB_SPREADSHEET_ID || CONFIG.DB_SPREADSHEET_ID === 'PASTE_SPREADSHEET_ID_HERE') {
    throw new Error('DB_SPREADSHEET_ID is not configured in Config.gs.');
  }
  return SpreadsheetApp.openById(CONFIG.DB_SPREADSHEET_ID);
}

function initializeDatabase() {
  var ss = getDb_();
  var actions = [];
  Logger.log('Initializing sustainability rating database: ' + ss.getName() + ' (' + CONFIG.DB_SPREADSHEET_ID + ')');
  Object.keys(CONFIG.SHEET_NAMES).forEach(function (key) {
    var name = CONFIG.SHEET_NAMES[key];
    var sheet = ss.getSheetByName(name);
    var created = false;
    if (!sheet) {
      sheet = ss.insertSheet(name);
      created = true;
    }
    var headers = CONFIG.HEADERS[name];
    var wroteHeaders = false;
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      wroteHeaders = true;
    } else {
      var existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
      if (!existing[0]) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.setFrozenRows(1);
        wroteHeaders = true;
      }
    }
    var action = name + ': ' + (created ? 'created' : 'exists') + ', headers ' + (wroteHeaders ? 'written' : 'already present');
    actions.push(action);
    Logger.log(action);
  });
  Logger.log('Database initialized successfully. Sheets checked: ' + actions.length);
  return { success: true, message: 'Database initialized.', actions: actions };
}

function getSheet_(name) {
  return getDb_().getSheetByName(name) || getDb_().insertSheet(name);
}

function appendByHeaders_(sheetName, obj) {
  var headers = CONFIG.HEADERS[sheetName];
  var sheet = getSheet_(sheetName);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  var row = headers.map(function (header) { return obj[header] !== undefined ? obj[header] : ''; });
  sheet.appendRow(row);
}

function saveAssessment(payload, calculation) {
  initializeDatabase();
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var assessmentId = generateAssessmentId_();
    var now = nowIso_();
    var docId = payload.proposalDocUrl ? extractGoogleDocId(payload.proposalDocUrl) : '';
    var resultUrl = buildResultUrl_(assessmentId);
    appendByHeaders_(CONFIG.SHEET_NAMES.ASSESSMENTS, {
      assessment_id: assessmentId,
      created_at: now,
      created_by: getActiveUserEmail_(),
      proposal_model: payload.model,
      proposal_title: payload.proposalTitle,
      proposal_doc_url: payload.proposalDocUrl,
      proposal_doc_id: docId,
      rubric_version: CONFIG.RUBRIC_VERSION,
      raw_score: calculation.rawScore,
      initial_rating: calculation.initialRating,
      final_rating: calculation.finalRating,
      final_rating_label: calculation.finalRatingLabel,
      short_description: calculation.shortDescription,
      cap_applied: calculation.capApplied,
      cap_reason: calculation.capReason,
      status: calculation.status,
      result_url: resultUrl,
      updated_at: now
    });
    calculation.responses.forEach(function (response) {
      response.assessment_id = assessmentId;
      appendByHeaders_(CONFIG.SHEET_NAMES.RESPONSES, response);
    });
    calculation.capFlags.forEach(function (flag) {
      flag.assessment_id = assessmentId;
      appendByHeaders_(CONFIG.SHEET_NAMES.CAP_FLAGS, flag);
    });
    return {
      success: true,
      assessmentId: assessmentId,
      resultUrl: resultUrl,
      rawScore: calculation.rawScore,
      initialRating: calculation.initialRating,
      finalRating: calculation.finalRating,
      finalRatingLabel: calculation.finalRatingLabel,
      shortDescription: calculation.shortDescription,
      status: calculation.status
    };
  } finally {
    lock.releaseLock();
  }
}

function findRowsByColumn_(sheetName, columnName, value) {
  var sheet = getSheet_(sheetName);
  if (sheet.getLastRow() < 2) return [];
  var headers = CONFIG.HEADERS[sheetName];
  var colIndex = headers.indexOf(columnName);
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return data.filter(function (row) { return String(row[colIndex]) === String(value); })
    .map(function (row) { return asMapByHeader_(headers, row); });
}

function getAssessmentResult(assessmentId) {
  assessmentId = validateAssessmentId(assessmentId);
  var assessmentRows = findRowsByColumn_(CONFIG.SHEET_NAMES.ASSESSMENTS, 'assessment_id', assessmentId);
  if (!assessmentRows.length) throw new Error('Assessment was not found.');
  var assessment = assessmentRows[0];
  var responses = findRowsByColumn_(CONFIG.SHEET_NAMES.RESPONSES, 'assessment_id', assessmentId);
  var caps = findRowsByColumn_(CONFIG.SHEET_NAMES.CAP_FLAGS, 'assessment_id', assessmentId);
  var grouped = {};
  responses.forEach(function (row) {
    var pillar = row.pillar || 'Other';
    if (!grouped[pillar]) grouped[pillar] = [];
    grouped[pillar].push(row);
  });
  return {
    success: true,
    assessment: assessment,
    responses: responses,
    groupedResponses: grouped,
    capFlags: caps,
    insertUrl: buildRouteUrl_('insert', { id: assessmentId })
  };
}

function getLatestAssessments(limit) {
  limit = Math.max(1, Math.min(50, Number(limit) || 5));
  var sheet = getSheet_(CONFIG.SHEET_NAMES.ASSESSMENTS);
  if (sheet.getLastRow() < 2) return { success: true, assessments: [] };
  var headers = CONFIG.HEADERS[CONFIG.SHEET_NAMES.ASSESSMENTS];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  var rows = data.map(function (row) { return asMapByHeader_(headers, row); });
  rows.sort(function (a, b) {
    var ta = new Date(a.created_at).getTime() || 0;
    var tb = new Date(b.created_at).getTime() || 0;
    return tb - ta;
  });
  var latest = rows.slice(0, limit).map(function (r) {
    return {
      assessment_id: r.assessment_id,
      created_at: r.created_at,
      created_by: r.created_by,
      proposal_model: r.proposal_model,
      proposal_title: r.proposal_title,
      raw_score: r.raw_score,
      final_rating: r.final_rating,
      final_rating_label: r.final_rating_label,
      status: r.status,
      result_url: r.result_url,
      insert_url: buildRouteUrl_('insert', { id: r.assessment_id })
    };
  });
  return { success: true, assessments: latest };
}

function updateAssessmentProposalDoc_(assessmentId, docUrl, docId) {
  var sheet = getSheet_(CONFIG.SHEET_NAMES.ASSESSMENTS);
  var headers = CONFIG.HEADERS[CONFIG.SHEET_NAMES.ASSESSMENTS];
  var idCol = headers.indexOf('assessment_id') + 1;
  if (sheet.getLastRow() < 2) return;
  var values = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(assessmentId)) {
      var row = i + 2;
      sheet.getRange(row, headers.indexOf('proposal_doc_url') + 1).setValue(docUrl);
      sheet.getRange(row, headers.indexOf('proposal_doc_id') + 1).setValue(docId);
      sheet.getRange(row, headers.indexOf('updated_at') + 1).setValue(nowIso_());
      return;
    }
  }
}

function logProposalInsertion(row) {
  initializeDatabase();
  appendByHeaders_(CONFIG.SHEET_NAMES.PROPOSAL_INSERTIONS, row);
}
