var MODELS = {
  SCHOOL_ACTIVITY: 'SCHOOL_ACTIVITY',
  ASSET_PROCUREMENT: 'ASSET_PROCUREMENT'
};

var MODEL_LABELS = {
  SCHOOL_ACTIVITY: 'School Activities Proposal',
  ASSET_PROCUREMENT: 'Asset Procuring Proposal'
};

var SCORE_DESCRIPTIONS = {
  0: 'Not checked, unknown, no evidence, or clearly poor. Unknown must be scored as 0.',
  1: 'Standard practice. Short explanation is enough.',
  2: 'Better choice. At least one simple evidence note should be provided.',
  3: 'Strong choice. Evidence should be clear enough for approver verification.'
};

var RATING_DESCRIPTIONS = {
  S: 'Excellent — strong sustainability case. Should be preferred when cost, quality, and operational fit are acceptable.',
  A: 'Good — meets most sustainability expectations. Suitable for approval.',
  B: 'Acceptable — some sustainability consideration, but improvement or justification may be needed.',
  C: 'Weak — limited sustainability consideration. Approver should ask for explanation or improvement.',
  D: 'Poor / Not Evidenced — high concern or insufficient evidence. Should not be preferred unless operationally unavoidable.'
};

var RATING_ORDER = ['D', 'C', 'B', 'A', 'S'];

var RUBRICS = {
  SCHOOL_ACTIVITY: {
    model: MODELS.SCHOOL_ACTIVITY,
        label: MODEL_LABELS.SCHOOL_ACTIVITY,
        version: '2025-01-MWS-MADLABS-SUSTAINABILITY-RATING',
        waterNAAllowed: false,
    pillars: [
      { name: 'Energy & Transport', weight: 20 },
      { name: 'Water', weight: 20 },
      { name: 'Materials, Waste & Lifecycle', weight: 60 }
    ],
    indicators: [
      indicator_('SA-E1', 'Energy & Transport', 5, 'Reduce unnecessary electricity/fuel use', ['Energy/fuel use not checked, or avoidable high use is likely.', 'Standard energy use.', 'Some reduction, such as fewer powered items, shorter operating hours, daylight use, or right-sized setup.', 'Strong reduction, such as avoiding powered equipment, using daylight/natural ventilation, or clearly reducing fuel/electricity demand.']),
      indicator_('SA-E2', 'Energy & Transport', 5, 'Use rented, shared, existing, or efficient equipment', ['New or inefficient equipment is used without checking alternatives.', 'Standard equipment or standard rental.', 'Some use of existing, rented, shared, or efficient equipment.', 'High-impact equipment is mainly reused, rented, shared, or selected for clear efficiency.']),
      indicator_('SA-E3', 'Energy & Transport', 6, 'Reduce transport, delivery, and logistics energy', ['Many separate trips/deliveries with no consideration.', 'Standard transport or delivery arrangement.', 'Some consolidation, local sourcing, shared transport, or reduced trips.', 'Clear logistics plan: consolidated delivery, local supplier where reasonable, shared vehicles, route planning, or avoided shipping.']),
      indicator_('SA-E4', 'Energy & Transport', 4, 'Assign responsibility for energy-use behavior', ['No instruction, monitoring, or control for lights, AC, sound system, charging, or powered equipment.', 'Basic verbal instruction only.', 'Assigned person or simple checklist to turn off AC, lights, equipment, or chargers.', 'Clear before-during-after control plan for energy use.']),
      indicator_('SA-W1', 'Water', 6, 'Avoid single-use bottled water where practical', ['Heavy use of single-use bottled water with no mitigation.', 'Standard bottled water or individually packaged drinks.', 'Partial reduction through bulk water, dispensers, fewer bottled drinks, or reusable cups.', 'Refill station, reusable bottles/cups, or no avoidable single-use bottled water.']),
      indicator_('SA-W2', 'Water', 5, 'Reduce cleaning/washing water', ['Cleaning or washing water use is not considered.', 'Standard cleaning arrangement.', 'Some reduction through controlled cleaning, reusable containers, fewer washable items, or lower-water cleaning method.', 'Clear low-water cleaning method or avoided unnecessary washing.']),
      indicator_('SA-W3', 'Water', 5, 'Manage wastewater, food residue, paint, ink, or chemical risk', ['Wastewater, food residue, paint, ink, oily waste, or chemical discharge risk is ignored.', 'Normal disposal only.', 'Some safe handling or controlled disposal.', 'Clear plan preventing unsafe discharge into drains, soil, or water.']),
      indicator_('SA-W4', 'Water', 4, 'Provide water-use instruction to participants/vendors', ['No water-use instruction.', 'Basic verbal/common practice.', 'Some instruction to vendors, facilitators, participants, or cleaning team.', 'Clear assigned responsibility for drinking water, cleaning water, and wastewater handling.']),
      indicator_('SA-M1', 'Materials, Waste & Lifecycle', 10, 'Remove unnecessary items and reduce quantity', ['Quantity is excessive or not justified.', 'Standard quantity; no reduction effort.', 'Quantity is controlled, right-sized, or reduced compared with usual practice.', 'Clearly avoids unnecessary procurement, removes low-value items, or uses digital/non-material alternatives.']),
      indicator_('SA-M2', 'Materials, Waste & Lifecycle', 10, 'Prioritize existing inventory, reuse, rental, or borrowing', ['New purchase is selected even when reuse, rental, borrowing, or existing stock seems possible.', 'Mostly new purchase; no reuse/rental check shown.', 'Some items are reused, rented, borrowed, shared, or taken from existing inventory.', 'High-impact items are mainly reused, rented, borrowed, shared, or sourced from existing stock.']),
      indicator_('SA-M3', 'Materials, Waste & Lifecycle', 10, 'Reduce single-use items and excess packaging', ['Heavy single-use items or excessive packaging with no mitigation.', 'Standard packaging or single-use items.', 'Some reduction: bulk packaging, less plastic, reusable containers, reduced wrapping, or supplier packaging reduction.', 'Avoids most unnecessary single-use items and packaging; reuse/refill system used where practical.']),
      indicator_('SA-M4', 'Materials, Waste & Lifecycle', 8, 'Reduce printing and paper use', ['Large printing volume with no justification.', 'Standard printing.', 'Reduced printing, double-sided printing, shared copies, digital materials, or smaller print format.', 'Printing is mostly avoided or strictly limited to necessary items.']),
      indicator_('SA-M5', 'Materials, Waste & Lifecycle', 8, 'Manage catering, food, and material waste', ['No plan for leftover food or material waste.', 'Normal disposal only.', 'Some plan for portion control, leftover handling, sorting, or reduced waste.', 'Clear waste prevention plan: right-sized catering, leftover handling, composting/reuse/recycling where practical.']),
      indicator_('SA-M6', 'Materials, Waste & Lifecycle', 8, 'Plan post-activity reuse, storage, donation, recycling, or disposal', ['No post-activity plan.', 'Items disposed normally.', 'Some items stored, reused, donated, recycled, or responsibly disposed.', 'Clear owner and plan for reuse, storage, donation, recycling, take-back, or responsible disposal.']),
      indicator_('SA-M7', 'Materials, Waste & Lifecycle', 6, 'Select lower-impact materials where practical', ['Material choice not checked.', 'Standard materials.', 'Some better materials selected, such as reusable, recycled, refillable, paper-based, durable, non-toxic, or local materials.', 'Lower-impact materials used for most high-impact items.'])
    ],
    capRules: [
      cap_('SA-CAP-01', 'Assessment form not attached', 'C'),
      cap_('SA-CAP-02', 'No evidence for any score above 1', 'C', true),
      cap_('SA-CAP-03', 'High-impact procurement basket not assessed', 'B'),
      cap_('SA-CAP-04', 'Large single-use plastic use with no mitigation', 'C'),
      cap_('SA-CAP-05', 'Large printing or merchandise quantity with no justification', 'C'),
      cap_('SA-CAP-06', 'No post-activity waste plan for a high-waste activity', 'B'),
      cap_('SA-CAP-07', 'Bottled water used heavily where refill option is practical', 'B'),
      cap_('SA-CAP-08', 'Wastewater, paint, chemical, food residue, or cleaning discharge risk ignored', 'C'),
      cap_('SA-CAP-09', 'Clearly inflated self-assessment', 'REVISION')
    ]
  },
  ASSET_PROCUREMENT: {
    model: MODELS.ASSET_PROCUREMENT,
        label: MODEL_LABELS.ASSET_PROCUREMENT,
        version: '2025-01-MWS-MADLABS-SUSTAINABILITY-RATING',
        waterNAAllowed: true,
    waterNAText: 'Water may be marked N/A only if the asset has no realistic water interaction during use, cleaning, maintenance, installation, cooling, landscaping, sanitation, food service, chemicals, outdoor exposure, drainage, or runoff.',
    pillars: [
      { name: 'Energy', weight: 30, adjustedWeightWaterNA: 37.5 },
      { name: 'Water', weight: 20, adjustedWeightWaterNA: 0 },
      { name: 'Materials, Waste & Lifecycle', weight: 40, adjustedWeightWaterNA: 50 },
      { name: 'Transport, Delivery, Asset Origin & Installation Logistics', weight: 10, adjustedWeightWaterNA: 12.5 }
    ],
    indicators: [
      indicator_('AP-E1', 'Energy', 10, 'Operating energy efficiency', ['Energy use not checked for an energy-using asset.', 'Standard asset; no efficiency comparison.', 'More efficient option selected based on specification, product information, or reasonable comparison.', 'High-efficiency option with clear specification, rating, expected savings, performance data, or measurable efficiency benefit.']),
      indicator_('AP-E2', 'Energy', 6, 'Right-sized capacity/specification', ['Asset appears oversized, excessive, duplicated, or not justified.', 'Standard size/capacity; no need analysis.', 'Size/capacity reasonably matched to actual school use.', 'Clear need validation prevents over-specification, duplication, unnecessary capacity, or unnecessary accessories.']),
      indicator_('AP-E3', 'Energy', 7, 'Controls, monitoring, automation, or user guidance', ['No control, monitoring, automation, or user guidance.', 'Basic manual use only.', 'Some control, timer, monitoring, dashboard, training, or user guidance to reduce energy use.', 'Strong control system, monitoring, automation, dashboard, EMS, or clear user training.']),
      indicator_('AP-E4', 'Energy', 7, 'Long-term energy reduction or renewable-energy benefit', ['No long-term energy benefit; asset may increase energy demand.', 'Neutral or unclear energy benefit.', 'Some long-term energy reduction expected.', 'Clear long-term benefit: renewable generation, reduced grid use, efficient replacement, or measurable energy savings.']),
      indicator_('AP-W1', 'Water', 7, 'Operational water efficiency', ['Water use not checked for a water-using asset.', 'Standard water use.', 'Lower-water option selected.', 'Strong water efficiency, water reuse, leakage reduction, or avoided water demand.']),
      indicator_('AP-W2', 'Water', 5, 'Maintenance water use', ['Maintenance water requirement not checked.', 'Standard maintenance.', 'Some reduction in cleaning or maintenance water.', 'Clear low-water maintenance method, maintenance schedule, or cleaning system.']),
      indicator_('AP-W3', 'Water', 5, 'Leakage, discharge, contamination, or runoff risk', ['Leakage, discharge, contamination, or runoff risk not checked.', 'Standard handling only.', 'Some risk control, such as drainage, safer materials, controlled discharge, or basic spill prevention.', 'Clear prevention plan for leakage, discharge, contamination, chemical handling, or runoff.']),
      indicator_('AP-W4', 'Water', 3, 'Water monitoring, reuse, conservation, or resilience benefit', ['No water-related benefit or risk check.', 'Minimal or indirect benefit.', 'Some conservation, monitoring, reuse, filtration, leakage control, or resilience benefit.', 'Clear water-saving, monitoring, reuse, filtration, leakage control, or resilience benefit.']),
      indicator_('AP-M1', 'Materials, Waste & Lifecycle', 8, 'Durability and design life', ['Asset appears fragile, disposable, short-life, or unsuitable for school use.', 'Standard quality; no durability check.', 'Durable option selected for expected school use.', 'Strong durability or design-life evidence suitable for institutional/school use.']),
      indicator_('AP-M2', 'Materials, Waste & Lifecycle', 8, 'Warranty, maintenance, spare parts, or O&M support', ['No warranty, maintenance, spare-part, or support information for a long-term asset.', 'Basic warranty only.', 'Warranty plus basic maintenance or spare-part support identified.', 'Clear lifecycle support: warranty, preventive maintenance, spare parts, training, O&M, or service agreement.']),
      indicator_('AP-M3', 'Materials, Waste & Lifecycle', 6, 'Controlled quantity/specification', ['Quantity/specification appears excessive, duplicated, or unjustified.', 'Standard quantity/specification.', 'Quantity/specification reasonably justified.', 'Strong justification prevents overbuying, oversizing, duplication, or unnecessary accessories.']),
      indicator_('AP-M4', 'Materials, Waste & Lifecycle', 6, 'Lower-impact material/component choice', ['Material/component choice not checked.', 'Standard materials/components.', 'Some lower-impact or safer materials/components selected.', 'Clear lower-impact approach across important components.']),
      indicator_('AP-M5', 'Materials, Waste & Lifecycle', 4, 'Packaging waste reduction', ['Excessive packaging or delivery waste not considered.', 'Standard packaging.', 'Some reduced packaging, bulk delivery, reusable protection, or supplier collection.', 'Clear packaging reduction, return, reuse, supplier collection, or recycling plan.']),
      indicator_('AP-M6', 'Materials, Waste & Lifecycle', 4, 'Installation/construction waste handling', ['No plan for installation or construction waste.', 'Standard disposal.', 'Some sorting, reuse, controlled disposal, or reduced rework.', 'Clear plan for material efficiency, waste sorting, reuse/recycling, and responsible disposal.']),
      indicator_('AP-M7', 'Materials, Waste & Lifecycle', 4, 'End-of-life, take-back, recycling, e-waste, or hazardous disposal', ['End-of-life, e-waste, battery, chemical, or hazardous material risk ignored.', 'Normal disposal only.', 'Some disposal, recycling, take-back, repair, redeployment, or replacement plan identified.', 'Clear end-of-life pathway: take-back, recycling, safe disposal, e-waste handling, hazardous waste handling, donation, or redeployment.']),
      indicator_('AP-T1', 'Transport, Delivery, Asset Origin & Installation Logistics', 4, 'Product origin, local availability, and sourcing rationale', ['Product origin is unknown or not checked.', 'Product is imported or likely imported, and no local alternative, stock status, or sourcing reason is explained.', 'Product is imported but already available from local stock/distributor, or imported origin is justified.', 'Product is locally made/assembled, locally available with clear sourcing rationale, or practical local vs imported options were compared.']),
      indicator_('AP-T2', 'Transport, Delivery, Asset Origin & Installation Logistics', 3, 'Delivery distance, trip consolidation, and shipping method', ['Transport not considered, or multiple avoidable deliveries/trips are likely.', 'Standard delivery arrangement.', 'Some effort to consolidate delivery, use local stock, reduce trips, or combine shipments.', 'Clear logistics plan reducing delivery distance, number of trips, re-delivery risk, or unnecessary shipping.']),
      indicator_('AP-T3', 'Transport, Delivery, Asset Origin & Installation Logistics', 2, 'Installation and contractor mobilization efficiency', ['Installation trips, contractor visits, site readiness, or rework risk not considered.', 'Standard installation process.', 'Some planning to reduce repeat visits, rework, unnecessary mobilization, or idle contractor time.', 'Clear installation plan: site readiness, coordinated schedule, fewer visits, reduced rework, and efficient contractor mobilization.']),
      indicator_('AP-T4', 'Transport, Delivery, Asset Origin & Installation Logistics', 1, 'Transport packaging and damage prevention', ['No consideration of transport packaging, protection, or damage risk.', 'Standard packaging/protection.', 'Some reduced packaging, reusable protection, supplier collection, or damage-prevention planning.', 'Clear plan for safe delivery with minimal packaging waste, reusable/returnable protection, or supplier collection of transport packaging.'])
    ],
    capRules: [
      cap_('AP-CAP-01', 'Assessment form not attached', 'C'),
      cap_('AP-CAP-02', 'No evidence for any score above 1', 'C', true),
      cap_('AP-CAP-03', 'High-impact asset/component not assessed', 'B'),
      cap_('AP-CAP-04', 'Long-term asset has no warranty or maintenance information', 'B'),
      cap_('AP-CAP-05', 'Energy-using asset has no efficiency/specification check', 'C'),
      cap_('AP-CAP-06', 'Water-using asset has no water-use, leakage, or discharge check', 'C'),
      cap_('AP-CAP-07', 'Infrastructure/construction asset has no installation waste plan', 'B'),
      cap_('AP-CAP-08', 'Electronics, batteries, equipment, chemicals, or fire-safety items have no end-of-life/hazardous-disposal consideration', 'C'),
      cap_('AP-CAP-09', 'Heavy, bulky, fragile, imported, or installation-heavy asset has no delivery/logistics plan', 'B'),
      cap_('AP-CAP-10', 'Asset requires multiple contractor visits but no site-readiness or installation coordination plan', 'B'),
      cap_('AP-CAP-11', 'Asset is oversized, duplicated, or unnecessary with no justification', 'C'),
      cap_('AP-CAP-12', 'Product origin is unknown for a high-value or high-impact imported item', 'B'),
      cap_('AP-CAP-13', 'Clearly inflated self-assessment', 'REVISION')
    ]
  }
};

function indicator_(id, pillar, weight, title, scoreDescriptions) {
  return { id: id, pillar: pillar, weight: weight, title: title, scoreDescriptions: scoreDescriptions };
}

function cap_(id, label, maxRating, auto) {
  return { id: id, label: label, maxRating: maxRating, auto: !!auto };
}

function getRubric(model) {
  validateModel(model);
  return RUBRICS[model];
}

function getRubricForClient(model) {
  var rubric = cloneForClient_(getRubric(model));
  rubric.scoreDescriptions = SCORE_DESCRIPTIONS;
  rubric.evidenceTypes = CONFIG.EVIDENCE_TYPES;
  return rubric;
}

function getAdjustedIndicators(model, waterNA) {
  var rubric = getRubric(model);
  var indicators = cloneForClient_(rubric.indicators);
  if (model !== MODELS.ASSET_PROCUREMENT || !waterNA) return indicators;
  var multipliers = { Energy: 37.5 / 30, 'Materials, Waste & Lifecycle': 50 / 40, 'Transport, Delivery, Asset Origin & Installation Logistics': 12.5 / 10 };
  return indicators.map(function (indicator) {
    if (indicator.pillar === 'Water') indicator.weight = 0;
    else indicator.weight = round2_(indicator.weight * multipliers[indicator.pillar]);
    return indicator;
  });
}
