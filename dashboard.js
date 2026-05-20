const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

// Dátum megjelenítése
const datum = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })
document.getElementById('datum').textContent = datum

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

async function statisztikakBetoltese() {
    // Szabad helyiségek
    const { data: szabad } = await client
        .from('helyisegek')
        .select('id')
        .eq('statusz', 'szabad')
    document.getElementById('szabad-helyisegek').textContent = szabad?.length ?? 0

    // Foglalt helyiségek
    const { data: foglalt } = await client
        .from('helyisegek')
        .select('id')
        .eq('statusz', 'foglalt')
    document.getElementById('foglalt-helyisegek').textContent = foglalt?.length ?? 0

    // Aktív szerződések
    const { data: szerzodesek } = await client
        .from('szerzodesek')
        .select('id')
        .eq('statusz', 'aktív')
    document.getElementById('aktiv-szerzodesek').textContent = szerzodesek?.length ?? 0

    // Bérlők száma
    const { data: berlok } = await client
        .from('berlok')
        .select('id')
    document.getElementById('berlok-szama').textContent = berlok?.length ?? 0
}

async function kozelgoFoglalasokBetoltese() {
    const most = new Date().toISOString()
    const { data, error } = await client
        .from('foglalasok')
        .select(`*, helyisegek (nev)`)
        .gte('kezdet', most)
        .order('kezdet', { ascending: true })
        .limit(5)

    const div = document.getElementById('kozelgo-foglalasok')

    if (error || !data || data.length === 0) {
        div.innerHTML = '<p style="color:#9ca3af;font-size:14px;">Nincs közelgő foglalás.</p>'
        return
    }

    div.innerHTML = data.map(f => `
        <div class="foglalas-sor">
            <div>
                <div class="cim">${f.cim}</div>
                <div class="reszletek">🏢 ${f.helyisegek.nev} · 📅 ${new Date(f.kezdet).toLocaleString('hu-HU')}</div>
            </div>
            <span class="statusz ${f.statusz}">${f.statusz}</span>
        </div>
    `).join('')
}

// Naptár
let aktivisHonap = new Date().getMonth()
let aktivisEv = new Date().getFullYear()

async function naptarRajzolas() {
    const { data: foglalasok } = await client
        .from('foglalasok')
        .select('kezdet, vege')

    const foglaltNapok = new Set()
    if (foglalasok) {
        foglalasok.forEach(f => {
            const kezdet = new Date(f.kezdet)
            const vege = new Date(f.vege)
            const nap = new Date(kezdet)
            while (nap <= vege) {
                if (nap.getMonth() === aktivisHonap && nap.getFullYear() === aktivisEv) {
                    foglaltNapok.add(nap.getDate())
                }
                nap.setDate(nap.getDate() + 1)
            }
        })
    }

    const ma = new Date()
    const elsoNap = new Date(aktivisEv, aktivisHonap, 1).getDay()
    const napokSzama = new Date(aktivisEv, aktivisHonap + 1, 0).getDate()
    const honapNev = new Date(aktivisEv, aktivisHonap).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })

    const napNevek = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V']
    const kezdoNap = elsoNap === 0 ? 6 : elsoNap - 1

    let html = `
        <div class="naptar-honap">
            <button onclick="honapValt(-1)">◀</button>
            <span>${honapNev}</span>
            <button onclick="honapValt(1)">▶</button>
        </div>
        <div class="naptar-grid">
            ${napNevek.map(n => `<div class="naptar-nap-nev">${n}</div>`).join('')}
            ${Array(kezdoNap).fill('<div class="naptar-nap ures"></div>').join('')}
    `

    for (let i = 1; i <= napokSzama; i++) {
        const isMa = i === ma.getDate() && aktivisHonap === ma.getMonth() && aktivisEv === ma.getFullYear()
        const isFoglalt = foglaltNapok.has(i)
        const osztaly = isMa ? 'mai' : isFoglalt ? 'foglalt' : ''
        html += `<div class="naptar-nap ${osztaly}">${i}</div>`
    }

    html += '</div>'
    document.getElementById('naptar').innerHTML = html
}

function honapValt(irany) {
    aktivisHonap += irany
    if (aktivisHonap > 11) { aktivisHonap = 0; aktivisEv++ }
    if (aktivisHonap < 0) { aktivisHonap = 11; aktivisEv-- }
    naptarRajzolas()
}

// Inicializálás
bejelentkezesEllenorzese()
statisztikakBetoltese()
kozelgoFoglalasokBetoltese()
naptarRajzolas()