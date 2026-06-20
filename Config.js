/**
 * Global configuration for the Sustainability Rating web app.
 * Replace DB_SPREADSHEET_ID and WEB_APP_BASE_URL after deployment.
 */
var CONFIG = {
  DB_SPREADSHEET_ID: '14NfLqoIPxU1QxnTOvJPZyvVFEvuo6KcJ86a2E2i68Xw',
  WEB_APP_BASE_URL: 'https://script.google.com/a/macros/millennia21.id/s/AKfycbyB0UAqw1cBE-IumvNayG0EBpjCm655VlQKEhgCZRpC/dev',
  RUBRIC_VERSION: '2025-01-MWS-MADLABS-SUSTAINABILITY-RATING',
  PLACEHOLDER: '<<rating>>',
  SHEET_NAMES: {
    ASSESSMENTS: 'Assessments',
    RESPONSES: 'AssessmentResponses',
    CAP_FLAGS: 'CapFlags',
    PROPOSAL_INSERTIONS: 'ProposalInsertions'
  },
  HEADERS: {
    Assessments: [
      'assessment_id', 'created_at', 'created_by', 'proposal_model', 'proposal_title',
      'proposal_doc_url', 'proposal_doc_id', 'rubric_version', 'raw_score', 'initial_rating',
      'final_rating', 'final_rating_label', 'short_description', 'cap_applied', 'cap_reason',
      'status', 'result_url', 'updated_at'
    ],
    AssessmentResponses: [
      'assessment_id', 'indicator_id', 'pillar', 'indicator_title', 'weight', 'score_0_to_3',
      'awarded_points', 'evidence_type', 'evidence_note', 'evidence_url'
    ],
    CapFlags: [
      'assessment_id', 'cap_rule_id', 'cap_rule_label', 'max_rating', 'triggered', 'review_note'
    ],
    ProposalInsertions: [
      'insert_id', 'assessment_id', 'proposal_doc_id', 'proposal_doc_url', 'inserted_by',
      'inserted_at', 'inserted_text', 'result_url', 'insert_status', 'error_message'
    ]
  },
  EVIDENCE_TYPES: [
    'Quotation detail',
    'Product page/specification',
    'Vendor chat/email',
    'Photo',
    'Proposer note',
    'Internal record',
    'Activity/operation plan',
    'Other'
  ]
};
