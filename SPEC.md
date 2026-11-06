§G|export professional searchable pdf schedule (pwa/client-side)
§S|@react-pdf/renderer, file-saver, pako
§V
1|font-unicode: Roboto (embedded via URL)
2|layout: A4, vector-based, pixel-perfect
3|features: Week & Semester export, Header/Footer, Branding
4|searchable: Text must be selectable in PDF viewer
5|naming: lich-giang-{type}-{date}.pdf

§AC
1|click -> generate -> download <5s (Semester < 10s)
2|data: matches current sessionsIndex + notesStore
3|font: no unicode glitches (Roboto handles Vietnamese)
4|pwa: works on mobile chrome/safari (file-saver)

§T
1|x|migration: move from html2canvas to @react-pdf/renderer|V2,V4
2|x|impl: <ScheduleReport /> shared component|V3
3|x|impl: semester multi-page logic with grand total|V3
4|x|ui: add Export PDF button to Week and Semester views|V3
5|x|fix: oklch color fallback for PDF compatibility|V2
6|x|fix: chrome uuid filename bug via file-saver|V5

§OUT-OF-SCOPE
- email/share direct integration
- custom user templates
- interactive form fields in PDF
