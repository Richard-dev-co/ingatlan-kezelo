const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)
const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

// Bejelentkezés ellenőrzése
async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) {
        window.location.href = 'login.html'
    }
}

// Kijelentkezés
async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

// Űrlap megjelenítése/elrejtése
function urlapMegjelenites() {
    document.getElementById('urlap').classList.remove('rejtett')
}

function urlapElrejtes() {
    document.getElementById('urlap').classList.add('rejtett')
}

// Új helyiség mentése
async function mentese() {
    const nev = document.getElementById('nev').value
    const tipus = document.getElementById('tipus').value
    const terulet_m2 = document.getElementById('terulet_m2').value
    const ferohely = document.getElementById('ferohely').value
    const leiras = document.getElementById('leiras').value
    const statusz = document.getElementById('statusz').value
    const ar_havi = document.getElementById('ar_havi').value

    if (!nev) {
        alert('A helyiség neve kötelező!')
        return
    }

    const { error } = await client
        .from('helyisegek')
        .insert([{ nev, tipus, terulet_m2, ferohely, leiras, statusz, ar_havi }])

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    helyisegekBetoltese()
}

// Helyiségek betöltése
async function helyisegekBetoltese() {
    const lista = document.getElementById('helyisegek-lista')

    const { data, error } = await client
        .from('helyisegek')
        .select('*')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek helyiségek.</p>'
        return
    }

    lista.innerHTML = data.map(h => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${h.nev}</h3>
                <p>${h.tipus} | ${h.terulet_m2} m² | ${h.ferohely} fő | ${h.ar_havi} Ft/hó</p>
                <p>${h.leiras ?? ''}</p>
            </div>
            <span class="statusz ${h.statusz}">${h.statusz}</span>
        </div>
    `).join('')
}

// Oldal inicializálása
bejelentkezesEllenorzese()
helyisegekBetoltese()