/* app/i18n.js — Greek / English strings */
(function () {
  var STR = {
    // shell
    role_employee: ['Υπάλληλος', 'Employee'],
    role_manager:  ['Διαχειριστής', 'Manager'],
    role_owner:    ['Ιδιοκτήτης', 'Owner'],
    role_viewer:   ['Προβολή', 'Viewer'],
    role_admin:    ['Διαχειριστής', 'Admin'],
    role_inspector:     ['Επιθεωρητής Προγράμματος', 'Program Inspector'],
    role_coordinator:   ['Συντονιστής Σταθμού', 'Station Coordinator'],
    role_cs_supervisor: ['Επόπτης Εξυπ. Πελατών', 'Customer Service Supervisor'],
    role_fleet_supervisor: ['Επόπτης Στόλου', 'Fleet Supervisor'],
    appname:       ['Πρόγραμμα', 'Schedule'],
    month_june:    ['Ιούνιος 2026', 'June 2026'],

    // employee tabs
    tab_home:    ['Αρχική', 'Home'],
    tab_month:   ['Μήνας', 'Month'],
    tab_team:    ['Ομάδα', 'Team'],
    tab_requests:['Αιτήματα', 'Requests'],
    tab_me:      ['Προφίλ', 'Me'],

    // employee home
    next_shift:    ['Επόμενη βάρδια', 'Next shift'],
    today:         ['Σήμερα', 'Today'],
    this_week:     ['Αυτή η εβδομάδα', 'This week'],
    hours_month:   ['Ώρες μήνα', 'Hours this month'],
    nights:        ['Νύχτες', 'Nights'],
    days_off:      ['Ρεπό', 'Days off'],
    workdays:      ['Ημέρες εργασίας', 'Workdays'],
    view_month:    ['Όλος ο μήνας', 'View full month'],
    starts_in:     ['σε', 'in'],
    hours_short:   ['ω', 'h'],

    // month / team
    my_month:      ['Ο μήνας μου', 'My month'],
    team_week:     ['Εβδομάδα ομάδας', 'Team week'],
    legend:        ['Υπόμνημα', 'Legend'],

    // requests
    new_request:   ['Νέο αίτημα', 'New request'],
    req_swap:      ['Αλλαγή βάρδιας', 'Shift swap'],
    req_leave:     ['Αίτηση άδειας', 'Request leave'],
    req_avail:     ['Διαθεσιμότητα', 'Availability'],
    pending:       ['Σε εκκρεμότητα', 'Pending'],
    approved:      ['Εγκρίθηκε', 'Approved'],
    declined:      ['Απορρίφθηκε', 'Declined'],
    submit:        ['Υποβολή', 'Submit'],
    cancel:        ['Άκυρο', 'Cancel'],
    pick_day:      ['Επίλεξε ημέρα', 'Pick a day'],
    pick_colleague:['Επίλεξε συνάδελφο', 'Pick a colleague'],
    reason:        ['Αιτιολογία (προαιρετικό)', 'Reason (optional)'],
    request_sent:  ['Το αίτημα στάλθηκε', 'Request sent'],

    // me / availability
    notifications: ['Ειδοποιήσεις', 'Notifications'],
    preferences:   ['Προτιμήσεις', 'Preferences'],
    pref_morning:  ['Προτιμώ πρωινά', 'Prefer mornings'],
    pref_no_nights:['Όχι νύχτες', 'Avoid nights'],
    language:      ['Γλώσσα', 'Language'],
    mark_avail:    ['Δήλωση διαθεσιμότητας', 'Mark availability'],
    available:     ['Διαθέσιμος', 'Available'],
    unavailable:   ['Μη διαθέσιμος', 'Unavailable'],
    preferred:     ['Προτιμώμενο', 'Preferred'],

    // manager nav
    nav_grid:      ['Πρόγραμμα', 'Schedule'],
    nav_coverage:  ['Κάλυψη', 'Coverage'],
    nav_warnings:  ['Προειδοποιήσεις', 'Warnings'],
    nav_requests:  ['Αιτήματα', 'Requests'],
    nav_fairness:  ['Ισορροπία', 'Fairness'],
    nav_settings:  ['Ρυθμίσεις', 'Settings'],

    // manager grid
    employees_l:   ['Υπάλληλοι', 'Employees'],
    publish:       ['Δημοσίευση', 'Publish'],
    published:     ['Δημοσιεύτηκε', 'Published'],
    validate:      ['Έλεγχος', 'Validate'],
    export_pdf:    ['Εξαγωγή PDF', 'Export PDF'],
    search:        ['Αναζήτηση…', 'Search…'],
    change_shift:  ['Αλλαγή βάρδιας', 'Change shift'],
    on_day:        ['στις', 'on'],

    // coverage
    working_now:   ['Σε εργασία', 'Working'],
    indicator:     ['Ένδειξη', 'Status'],
    low:           ['Λίγοι', 'Understaffed'],
    high:          ['Πολλοί', 'Overstaffed'],
    ok:            ['Επαρκές', 'OK'],
    per_day:       ['ανά ημέρα', 'per day'],

    // warnings
    all_warnings:  ['Όλες', 'All'],
    hard:          ['Σοβαρά', 'Critical'],
    soft:          ['Ήπια', 'Soft'],
    no_warnings:   ['Καμία προειδοποίηση', 'No warnings'],
    last_checked:  ['Τελευταίος έλεγχος', 'Last checked'],
    just_now:      ['μόλις τώρα', 'just now'],

    // fairness
    fair_days:     ['Ημέρες', 'Days'],
    fair_hours:    ['Ώρες', 'Hours'],
    fair_nights:   ['Νύχτες', 'Nights'],
    fair_wknd:     ['Σ/Κ', 'Wknd'],
    fair_repo:     ['Ρεπό', 'Off'],
    team_avg:      ['Μέσος όρος', 'Team avg'],
    high_nights:   ['Υψηλές νύχτες', 'High nights'],

    // requests (manager)
    approve:       ['Έγκριση', 'Approve'],
    decline:       ['Απόρριψη', 'Decline'],
    swaps:         ['Αλλαγές', 'Swaps'],
    leaves:        ['Άδειες', 'Leaves'],
    requested_by:  ['Από', 'By'],

    // settings
    set_thresholds:['Όρια ελέγχου', 'Validation thresholds'],
    set_rest:      ['Ελάχιστη ανάπαυση (ώρες)', 'Min rest (hours)'],
    set_nights:    ['Μέγιστες συνεχόμενες νύχτες', 'Max consecutive nights'],
    set_work:      ['Μέγιστες ημέρες εργασίας', 'Max workdays in a row'],
    set_staff:     ['Στελέχωση ανά ημέρα', 'Staffing per day'],
    set_min:       ['Ελάχιστο', 'Minimum'],
    set_max:       ['Μέγιστο', 'Maximum'],
    set_members:   ['Μέλη & ρόλοι', 'Members & roles'],
    set_sharing:   ['Κοινή χρήση', 'Sharing'],
    set_automation:['Αυτοματισμοί', 'Automation'],
    set_new_month: ['Νέος μήνας', 'New month'],
    set_backup:    ['Ημερήσιο αντίγραφο', 'Daily backup'],
    set_link:      ['Σύνδεσμος = Προβολή', 'Link = Viewer'],
    invite:        ['Πρόσκληση', 'Invite'],
    on_:           ['Ενεργό', 'On'],
    off_:          ['Ανενεργό', 'Off'],
    save:          ['Αποθήκευση', 'Save'],
    duplicate_mo:  ['Δημιουργία αντιγράφου επόμενου μήνα', 'Duplicate for next month'],

    months_l:      ['Μήνες', 'Months'],
    new_month_cta: ['Νέος μήνας', 'New month'],
    assistant:     ['Βοηθός', 'Assistant'],
    assistant_sub: ['Βοηθός προγραμματισμού', 'Scheduling assistant'],
    assistant_intro: ['Ρώτησε για κάλυψη, ισορροπία βαρδιών, ή φτιάξε ένα πρόχειρο πρόγραμμα — με τη βοήθεια του Gemini.',
                      'Ask about coverage, shift balance, or draft a rota — powered by Gemini.'],
    open_assistant: ['Άνοιγμα στο Gemini', 'Open in Gemini'],
    ask_placeholder: ['Γράψε μια ερώτηση…', 'Type a question…'],

    // import
    imp_btn:      ['Εισαγωγή', 'Import'],
    imp_title:    ['Εισαγωγή προγράμματος', 'Import schedule'],
    imp_sub:      ['Από αρχείο Excel ή CSV — το σύστημα δημιουργεί τον μήνα αυτόματα', 'From an Excel or CSV file — the system builds the month automatically'],
    imp_drop:     ['Σύρε το αρχείο εδώ ή πάτησε για επιλογή', 'Drop the file here, or click to browse'],
    imp_formats:  ['.xlsx · .xls · .csv  —  ΑΜΕ, Επώνυμο, Όνομα + στήλες ημερών', '.xlsx · .xls · .csv  —  ID, Surname, First name + day columns'],
    imp_detected: ['Εντοπίστηκαν', 'Detected'],
    imp_emps:     ['υπάλληλοι', 'employees'],
    imp_days:     ['ημέρες', 'days'],
    imp_preview:  ['Προεπισκόπηση', 'Preview'],
    imp_create:   ['Δημιουργία μήνα', 'Create the month'],
    imp_another:  ['Άλλο αρχείο', 'Choose another'],
    imp_note:     ['Στην παραγωγή, τα .xlsx διαβάζονται στον server και γράφονται στο Google Sheet.', 'In production, .xlsx is parsed on the server and written to the Google Sheet.'],

    // members & roles
    mem_search:   ['Αναζήτηση μέλους…', 'Search member…'],
    mem_remove:   ['Αφαίρεση', 'Remove'],
    mem_remove_q: ['Αφαίρεση του μέλους από το πρόγραμμα;', 'Remove this member from the program?'],
    mem_removed:  ['Το μέλος αφαιρέθηκε', 'Member removed'],
    mem_role_done:['Ο ρόλος ενημερώθηκε & συγχρονίστηκε', 'Role updated & synced'],
    mem_count:    ['μέλη', 'members'],
    mem_you:      ['εσύ', 'you'],
    mem_invite_name: ['Όνομα νέου μέλους', 'New member name'],
    mem_synced:   ['Συγχρονισμένο', 'Synced'],
    mem_active:   ['ενεργά', 'active'],

    // publish / visibility
    pub_title:    ['Δημοσίευση & ορατότητα', 'Publish & visibility'],
    pub_sub:      ['Έλεγξε τι βλέπουν οι υπάλληλοι', 'Control what employees can see'],
    pub_state:    ['Κατάσταση', 'State'],
    pub_draft:    ['Πρόχειρο (κρυφό)', 'Draft (hidden)'],
    pub_published:['Δημοσιευμένο', 'Published'],
    pub_scope:    ['Εύρος ορατότητας', 'Visible scope'],
    pub_all:      ['Όλος ο μήνας', 'Whole month'],
    pub_window:   ['Εύρος ημερών', 'Day range'],
    pub_days:     ['Επιλεγμένες ημέρες', 'Picked days'],
    pub_week:     ['Εβδ.', 'Wk'],
    pub_from:     ['Από', 'From'],
    pub_to:       ['Έως', 'To'],
    pub_save:     ['Αποθήκευση & ειδοποίηση', 'Save & notify'],
    pub_summary:  ['Οι υπάλληλοι βλέπουν', 'Employees see'],
    pub_nothing:  ['τίποτα (πρόχειρο)', 'nothing (draft)'],
    pub_btn:      ['Δημοσίευση', 'Publish'],
    not_released: ['Το πρόγραμμα δεν έχει δημοσιευτεί', 'Schedule not published yet'],
    not_released_sub: ['Ο διαχειριστής δεν το έχει ανοίξει ακόμη. Θα ειδοποιηθείς.', 'Your manager hasn’t released it yet. You’ll be notified.'],
    locked_day:   ['Κλειδωμένο', 'Locked']
  };

  window.t = function (key, lang) {
    var v = STR[key];
    if (!v) return key;
    return v[lang === 'en' ? 1 : 0];
  };
  window.I18N = STR;
})();
