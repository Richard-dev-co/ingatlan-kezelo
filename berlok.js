const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

let szerkesztesId = null

function urlapMegjelenites(berlo = null) {
    szerkesztesId = berlo ? berlo.id : null
    document.getElementById('urlap-cim').textContent = berlo ? 'Bérlő szerkesztése' : 'Új bérlő hozzáadása'
    document.getElementById('nev').value = berlo?.nev ?? ''
    document.getElementById('email').value = berlo?.email ?? ''
    document.getElementById('telefon').value = berlo?.telefon ?? ''
    document.getElementById('cim').value = berlo?.cim ?? ''
    document.getElementById('adoszam').value = berlo?.adoszam ?? ''
    document.getElementById('megjegyzes').value = berlo?.megjegyzes ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
}

async function mentese() {
    const nev = document.getElementById('nev').value
    const email = document.getElementById('email').value
    const telefon = document.getElementById('telefon').value
    const cim = document.getElementById('cim').value
    const adoszam = document.getElementById('adoszam').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!nev || !email) {
        alert('A név és email cím kötelező!')
        return
    }

    let error

    if (szerkesztesId) {
        const result = await client
            .from('berlok')
            .update({ nev, email, telefon, cim, adoszam, megjegyzes })
            .eq('id', szerkesztesId)
        error = result.error
    } else {
        const result = await client
            .from('berlok')
            .insert([{ nev, email, telefon, cim, adoszam, megjegyzes }])
        error = result.error
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    berlokBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a bérlőt?')) return
    const { error } = await client.from('berlok').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    berlokBetoltese()
}

async function berlokBetoltese() {
    const lista = document.getElementById('berlok-lista')

    const { data, error } = await client
        .from('berlok')
        .select('*')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek bérlők.</p>'
        return
    }

    lista.innerHTML = data.map(b => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${b.nev}</h3>
                <p>📧 ${b.email}</p>
                <p>📞 ${b.telefon ?? 'Nincs megadva'}</p>
                <p>📍 ${b.cim ?? 'Nincs megadva'}</p>
                <p>Adószám: ${b.adoszam ?? 'Nincs megadva'}</p>
                <p>${b.megjegyzes ?? ''}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                <div style="display:flex;gap:8px">
                    <button onclick='urlapMegjelenites(${JSON.stringify(b)})' class="szerkeszt-gomb">Szerkesztés</button>
                    <button onclick="torles(${b.id})" class="torles-gomb">Törlés</button>
                </div>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
berlokBetoltese()