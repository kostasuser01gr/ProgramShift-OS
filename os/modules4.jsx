/* ============================================================================
 *  os/modules4.jsx — Files manager + Form Builder. Real front-end implementations
 *  backed by OS.Files / OS.Forms / OS.FormSubs (localStorage). No "coming soon".
 * ========================================================================== */

/* ---------- helpers ---------- */
function humanSize(n) { if (n == null) return ''; if (n < 1024) return n + ' B'; if (n < 1048576) return (n / 1024).toFixed(1) + ' KB'; return (n / 1048576).toFixed(1) + ' MB'; }
function fileKind(type, name) {
  var t = (type || '') + ' ' + (name || '');
  if (/image|png|jpe?g|gif|webp|svg/i.test(t)) return 'image';
  if (/pdf/i.test(t)) return 'pdf';
  if (/sheet|excel|csv|xlsx?/i.test(t)) return 'sheet';
  if (/word|doc/i.test(t)) return 'doc';
  return 'file';
}

/* ============================================================================
 *  FILES MANAGER
 * ========================================================================== */
function FilesModule() {
  const ctx = useOS(); const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  if (!OS.Perms.can(role, 'files.manage')) return <DeniedModule perm="files.manage" />;
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [q, setQ] = React.useState('');
  const [preview, setPreview] = React.useState(null);
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);
  const MAX = 4 * 1024 * 1024; // 4MB localStorage-safe cap

  const all = OS.Files.all();
  const list = all.filter(function (f) { return !q || OS.norm(f.name).indexOf(OS.norm(q)) >= 0 || (f.tags || '').toLowerCase().indexOf(q.toLowerCase()) >= 0; });

  function addFiles(fileList) {
    const arr = Array.from(fileList || []);
    let pending = arr.length;
    if (!pending) return;
    arr.forEach(function (file) {
      if (file.size > MAX) { OS.Notify.add({ type: 'warning', title: en ? 'File too large' : 'Πολύ μεγάλο αρχείο', desc: file.name + ' · ' + humanSize(file.size) + ' (max 4MB)', module: 'files', priority: 'normal' }); pending--; if (!pending) force(); return; }
      const reader = new FileReader();
      reader.onload = function () {
        OS.Files.add({ name: file.name, type: file.type, size: file.size, data: reader.result, tags: '', at: Date.now(), by: (OS.Auth.current() || {}).name || role });
        OS.Audit.add({ action: 'file.upload', target: file.name, role: role, module: 'files' });
        OS.Bus.emit('record.created', { type: 'file', name: file.name });
        pending--; if (!pending) force();
      };
      reader.onerror = function () { pending--; if (!pending) force(); };
      reader.readAsDataURL(file);
    });
  }
  function download(f) { const a = document.createElement('a'); a.href = f.data; a.download = f.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); OS.Audit.add({ action: 'file.download', target: f.name, role: role, module: 'files' }); }
  function remove(f) { if (!confirm(en ? 'Delete ' + f.name + '?' : 'Διαγραφή ' + f.name + ';')) return; OS.Files.remove(f.id); OS.Audit.add({ action: 'file.delete', target: f.name, role: role, module: 'files' }); force(); }
  function setTags(f, v) { OS.Files.update(f.id, { tags: v }); force(); }

  const kindIcon = { image: 'idcard', pdf: 'note', sheet: 'badge', doc: 'note', file: 'folder' };

  return (
    <div className="os-page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div><h2 className="pg">{en ? 'Files' : 'Αρχεία'}</h2><div className="pgsub" style={{ margin: 0 }}>{all.length} {en ? 'files · stored in this browser' : 'αρχεία · αποθηκευμένα σε αυτόν τον browser'}</div></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--card)', border: '1px solid var(--line2)', borderRadius: 10, padding: '7px 11px' }}>
            <Icon name="search" size={15} color="var(--faint)" /><input value={q} onChange={function (e) { setQ(e.target.value); }} placeholder={en ? 'Search files…' : 'Αναζήτηση…'} style={{ border: 0, outline: 0, background: 'transparent', fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--ink)', width: 130 }} />
          </div>
          <button className="os-btn solid" onClick={function () { inputRef.current && inputRef.current.click(); }}><Icon name="upload" size={14} />{en ? 'Upload' : 'Μεταφόρτωση'}</button>
          <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={function (e) { addFiles(e.target.files); e.target.value = ''; }} />
        </div>
      </div>

      <div onDragOver={function (e) { e.preventDefault(); setDrag(true); }} onDragLeave={function () { setDrag(false); }} onDrop={function (e) { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{ border: '2px dashed ' + (drag ? 'var(--accent)' : 'var(--line2)'), borderRadius: 14, padding: list.length ? '14px' : '40px 20px', background: drag ? 'var(--accent-soft)' : 'transparent', transition: '.15s', marginBottom: 16, textAlign: list.length ? 'left' : 'center' }}>
        {list.length === 0 ? <div style={{ color: 'var(--faint)', fontSize: 13.5 }}><Icon name="folder" size={26} style={{ marginBottom: 8 }} /><div>{en ? 'Drag files here or click Upload' : 'Σύρε αρχεία εδώ ή πάτησε Μεταφόρτωση'}</div></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 11 }}>
            {list.map(function (f) { const k = fileKind(f.type, f.name); return (
              <div key={f.id} className="os-panel" style={{ margin: 0, padding: 13 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {k === 'image' ? <img src={f.data} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name={kindIcon[k]} size={18} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={f.name}>{f.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--faint)' }}>{humanSize(f.size)} · {fmtAgo(f.at, lang)}</div>
                  </div>
                </div>
                <input className="os-input" style={{ marginTop: 9, fontSize: 12, padding: '6px 9px' }} placeholder={en ? '+ tags' : '+ ετικέτες'} defaultValue={f.tags} onBlur={function (e) { setTags(f, e.target.value); }} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {k === 'image' && <button className="os-btn sm" onClick={function () { setPreview(f); }}><Icon name="search" size={12} /></button>}
                  <button className="os-btn sm" onClick={function () { download(f); }}><Icon name="pdf" size={12} />{en ? 'Get' : 'Λήψη'}</button>
                  <button className="os-btn sm" style={{ marginLeft: 'auto', color: 'var(--red)' }} onClick={function () { remove(f); }}><Icon name="x" size={12} /></button>
                </div>
              </div>); })}
          </div>}
      </div>

      {preview && <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,17,12,.78)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 30 }} onClick={function () { setPreview(null); }}>
        <img src={preview.data} alt={preview.name} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 10, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }} />
      </div>}
    </div>
  );
}

/* ============================================================================
 *  FORM BUILDER  (build → fill → review submissions)
 * ========================================================================== */
const FIELD_TYPES = [
  { v: 'text', el: 'Κείμενο', en: 'Text' }, { v: 'textarea', el: 'Παράγραφος', en: 'Paragraph' },
  { v: 'number', el: 'Αριθμός', en: 'Number' }, { v: 'date', el: 'Ημερομηνία', en: 'Date' },
  { v: 'select', el: 'Επιλογή', en: 'Dropdown' }, { v: 'checkbox', el: 'Ναι/Όχι', en: 'Checkbox' }
];

function FormBuilderModule() {
  const ctx = useOS(); const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  const [, force] = React.useReducer(function (x) { return x + 1; }, 0);
  const [tab, setTab] = React.useState('forms');      // forms | build | fill | subs
  const [active, setActive] = React.useState(null);    // form being built/filled/reviewed
  const canManage = OS.Perms.can(role, 'forms.manage');

  const forms = OS.Forms.all();

  function newForm() { const f = OS.Forms.add({ title: en ? 'Untitled form' : 'Νέα φόρμα', desc: '', at: Date.now(), fields: [] }); setActive(f.id); setTab('build'); force(); }
  function delForm(id) { if (!confirm(en ? 'Delete form?' : 'Διαγραφή φόρμας;')) return; OS.Forms.remove(id); force(); }

  // ----- list -----
  if (tab === 'forms') {
    return (
      <div className="os-page" style={{ maxWidth: 860 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
          <div><h2 className="pg">{en ? 'Form Builder' : 'Φόρμες'}</h2><div className="pgsub" style={{ margin: 0 }}>{forms.length} {en ? 'forms' : 'φόρμες'}</div></div>
          {canManage && <button className="os-btn solid" onClick={newForm}><Icon name="plus" size={15} />{en ? 'New form' : 'Νέα φόρμα'}</button>}
        </div>
        {forms.length === 0 && <div className="os-empty">{en ? 'No forms yet.' : 'Καμία φόρμα ακόμη.'}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 13 }}>
          {forms.map(function (f) { const subs = OS.FormSubs.all().filter(function (s) { return s.formId === f.id; }).length; return (
            <div key={f.id} className="os-panel" style={{ margin: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--amber-soft)', color: 'var(--amber)', display: 'grid', placeItems: 'center', marginBottom: 10 }}><Icon name="clipboard" size={19} /></div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--soft)', marginTop: 3, minHeight: 17 }}>{f.desc}</div>
              <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 8 }}>{(f.fields || []).length} {en ? 'fields' : 'πεδία'} · {subs} {en ? 'submissions' : 'καταχωρήσεις'}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 11, flexWrap: 'wrap' }}>
                <button className="os-btn sm solid" onClick={function () { setActive(f.id); setTab('fill'); }}><Icon name="check" size={12} />{en ? 'Fill' : 'Συμπλήρωση'}</button>
                {canManage && <button className="os-btn sm" onClick={function () { setActive(f.id); setTab('build'); }}><Icon name="settings" size={12} />{en ? 'Edit' : 'Επεξεργασία'}</button>}
                <button className="os-btn sm" onClick={function () { setActive(f.id); setTab('subs'); }}><Icon name="badge" size={12} />{subs}</button>
                {canManage && <button className="os-btn sm" style={{ color: 'var(--red)' }} onClick={function () { delForm(f.id); }}><Icon name="x" size={12} /></button>}
              </div>
            </div>); })}
        </div>
      </div>
    );
  }

  const form = OS.Forms.get(active);
  if (!form) { setTab('forms'); return null; }
  const back = <button className="os-btn sm" style={{ marginBottom: 14 }} onClick={function () { setTab('forms'); }}><Icon name="chevron" size={13} style={{ transform: 'rotate(180deg)' }} />{en ? 'All forms' : 'Όλες οι φόρμες'}</button>;

  // ----- build -----
  if (tab === 'build') {
    function addField() { const fs = (form.fields || []).concat([{ id: 'fld_' + Date.now(), type: 'text', label: en ? 'New field' : 'Νέο πεδίο', required: false, options: [] }]); OS.Forms.update(form.id, { fields: fs }); force(); }
    function updField(fid, patch) { OS.Forms.update(form.id, { fields: form.fields.map(function (x) { return x.id === fid ? Object.assign({}, x, patch) : x; }) }); force(); }
    function delField(fid) { OS.Forms.update(form.id, { fields: form.fields.filter(function (x) { return x.id !== fid; }) }); force(); }
    return (
      <div className="os-page" style={{ maxWidth: 720 }}>
        {back}
        <input className="os-input" style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }} defaultValue={form.title} onBlur={function (e) { OS.Forms.update(form.id, { title: e.target.value }); force(); }} />
        <input className="os-input" style={{ marginBottom: 16 }} placeholder={en ? 'Description' : 'Περιγραφή'} defaultValue={form.desc} onBlur={function (e) { OS.Forms.update(form.id, { desc: e.target.value }); }} />
        {(form.fields || []).map(function (fl) { return (
          <div key={fl.id} className="os-panel" style={{ marginBottom: 10, padding: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="os-input" style={{ flex: 1 }} defaultValue={fl.label} onBlur={function (e) { updField(fl.id, { label: e.target.value }); }} />
              <select className="os-select" style={{ width: 130 }} value={fl.type} onChange={function (e) { updField(fl.id, { type: e.target.value }); }}>
                {FIELD_TYPES.map(function (t) { return <option key={t.v} value={t.v}>{en ? t.en : t.el}</option>; })}
              </select>
              <button className="os-btn sm" style={{ color: 'var(--red)' }} onClick={function () { delField(fl.id); }}><Icon name="x" size={13} /></button>
            </div>
            {fl.type === 'select' && <input className="os-input" style={{ marginTop: 8, fontSize: 12.5 }} placeholder={en ? 'Options, comma-separated' : 'Επιλογές, χωρισμένες με κόμμα'} defaultValue={(fl.options || []).join(', ')} onBlur={function (e) { updField(fl.id, { options: e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) }); }} />}
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, fontSize: 12.5, color: 'var(--soft)', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!fl.required} onChange={function (e) { updField(fl.id, { required: e.target.checked }); }} />{en ? 'Required' : 'Υποχρεωτικό'}
            </label>
          </div>); })}
        <button className="os-btn" onClick={addField}><Icon name="plus" size={14} />{en ? 'Add field' : 'Προσθήκη πεδίου'}</button>
        <div style={{ marginTop: 16 }}><button className="os-btn solid" onClick={function () { setTab('fill'); }}><Icon name="check" size={14} />{en ? 'Preview & fill' : 'Προεπισκόπηση'}</button></div>
      </div>
    );
  }

  // ----- fill -----
  if (tab === 'fill') {
    return <FormFill form={form} ctx={ctx} onDone={function () { setTab('subs'); force(); }} back={back} />;
  }

  // ----- submissions -----
  if (tab === 'subs') {
    const subs = OS.FormSubs.all().filter(function (s) { return s.formId === form.id; });
    return (
      <div className="os-page" style={{ maxWidth: 820 }}>
        {back}
        <h2 className="pg" style={{ fontSize: 21 }}>{form.title} · {en ? 'Submissions' : 'Καταχωρήσεις'}</h2>
        <div className="pgsub">{subs.length} {en ? 'total' : 'σύνολο'}</div>
        {subs.length === 0 && <div className="os-empty">{en ? 'No submissions yet.' : 'Καμία καταχώρηση.'}</div>}
        {subs.map(function (s) { return (
          <div key={s.id} className="os-panel" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 8 }}>{s.by} · {fmtAgo(s.at, lang)}</div>
            {(form.fields || []).map(function (fl) { return (
              <div key={fl.id} className="os-row" style={{ padding: '7px 0' }}>
                <span style={{ fontSize: 12.5, color: 'var(--soft)', minWidth: 160 }}>{fl.label}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500 }}>{String(s.values[fl.id] != null && s.values[fl.id] !== '' ? s.values[fl.id] : '—')}</span>
              </div>); })}
          </div>); })}
      </div>
    );
  }
  return null;
}

function FormFill({ form, ctx, onDone, back }) {
  const { lang, role } = ctx; const OS = window.OS; const en = lang === 'en';
  const [vals, setVals] = React.useState({});
  const [err, setErr] = React.useState('');
  function set(id, v) { setVals(function (p) { return Object.assign({}, p, { [id]: v }); }); }
  function submit() {
    const missing = (form.fields || []).filter(function (f) { return f.required && (vals[f.id] == null || vals[f.id] === '' || vals[f.id] === false); });
    if (missing.length) { setErr((en ? 'Required: ' : 'Υποχρεωτικά: ') + missing.map(function (f) { return f.label; }).join(', ')); return; }
    OS.FormSubs.add({ formId: form.id, values: vals, at: Date.now(), by: (OS.Auth.current() || {}).name || role });
    OS.Audit.add({ action: 'form.submit', target: form.title, role: role, module: 'forms' });
    OS.Notify.add({ type: 'task', title: en ? 'Form submitted' : 'Υποβλήθηκε φόρμα', desc: form.title, module: 'forms' });
    OS.Bus.emit('record.created', { type: 'form_submission', form: form.title });
    onDone();
  }
  return (
    <div className="os-page" style={{ maxWidth: 600 }}>
      {back}
      <h2 className="pg" style={{ fontSize: 22 }}>{form.title}</h2>
      {form.desc && <div className="pgsub">{form.desc}</div>}
      {(form.fields || []).length === 0 && <div className="os-empty">{en ? 'This form has no fields yet.' : 'Η φόρμα δεν έχει πεδία ακόμη.'}</div>}
      {(form.fields || []).map(function (fl) { return (
        <div key={fl.id} style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{fl.label}{fl.required && <span style={{ color: 'var(--red)' }}> *</span>}</label>
          {fl.type === 'textarea' ? <textarea className="os-textarea" onChange={function (e) { set(fl.id, e.target.value); }} />
            : fl.type === 'select' ? <select className="os-select" defaultValue="" onChange={function (e) { set(fl.id, e.target.value); }}><option value="" disabled>{en ? 'Choose…' : 'Επίλεξε…'}</option>{(fl.options || []).map(function (o) { return <option key={o} value={o}>{o}</option>; })}</select>
            : fl.type === 'checkbox' ? <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}><input type="checkbox" onChange={function (e) { set(fl.id, e.target.checked); }} />{en ? 'Yes' : 'Ναι'}</label>
            : <input className="os-input" type={fl.type === 'number' ? 'number' : fl.type === 'date' ? 'date' : 'text'} onChange={function (e) { set(fl.id, e.target.value); }} />}
        </div>); })}
      {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
      {(form.fields || []).length > 0 && <button className="os-btn solid" onClick={submit}><Icon name="check" size={14} />{en ? 'Submit' : 'Υποβολή'}</button>}
    </div>
  );
}

Object.assign(window, { FilesModule, FormBuilderModule });
