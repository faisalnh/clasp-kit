function routeRequest(e) {
  var params = e && e.parameter ? e.parameter : {};
  var view = safeString_(params.view || 'home') || 'home';
  var model = safeString_(params.model || '');
  var id = safeString_(params.id || '');
  var template = HtmlService.createTemplateFromFile('Index');
  template.view = view;
  template.model = model;
  template.assessmentId = id;
  template.appBaseUrl = CONFIG.WEB_APP_BASE_URL;
  template.pageTitle = pageTitle_(view, model);
  return template.evaluate()
    .setTitle(template.pageTitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function pageTitle_(view, model) {
  if (view === 'form') return (MODEL_LABELS[model] || 'Assessment Form') + ' | Sustainability Rating';
  if (view === 'result') return 'Assessment Result | Sustainability Rating';
  if (view === 'insert') return 'Insert Rating | Sustainability Rating';
  if (view === 'latest') return 'Latest Assessments | Sustainability Rating';
  return 'MWS Sustainability Rating';
}
