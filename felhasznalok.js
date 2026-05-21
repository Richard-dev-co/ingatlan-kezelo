const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) {
        window.location.href = 'login.html'
        return
    }

    // Csak admin férhet hozzá
    const { data: felhasznalo } = await client
        .from('felhasznalok')
        .select('szerep')
        .eq('email', session.user.email)
        .single()

    if (!felhasznalo || felhasznalo.szerep !== 'admin') {
        alert('Csak admin férhet hozzá ehhez az oldalhoz!')
        window.location.href = 'index.html'
    }
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

function urlapMegjelenites() {
    document.getElementById('urlap-cim').textContent = 'Új felhasználó hozzáadása'
    document.getElementById('nev').value = ''
    document.getElementById('email').value = ''
    document.getElementById('jelszo').value = ''
    document.getElementById('szerep').value = 'kolléga'
    document.getElementById('urlap').classList.remove('rejtett')
}

function urlapElrejtes() {
    document.getElementById('urlap').classList.add('rejtett')
}

async function mentese() {
    const nev = document.getElementById('nev').value
    const email = document.getElementById('email').value
    const jelszo = document.getElementById('jelszo').value
    const szerep = document.getElementById('szerep').value

    if (!nev || !email || !jelszo) {
        alert('A név, email és jelszó kötelező!')
        return
    }

    // Létrehozzuk a felhasználót a Supabase Auth-ban
    const { data: authData, error: authError } = await client.auth.signUp({
        email: email,
        password: jelszo
    })

    if (authError) {
        alert('Hiba történt a felhasználó létrehozásakor!')
        console.error(authError)
        return
    }

    // Felvesszük a felhasznalok táblába
    const { error: dbError } = await client
        .from('felhasznalok')
        .insert([{ email, nev, szerep }])

    if (dbError) {
        alert('Hiba történt az adatok mentésekor!')
        console.error(dbError)
        return
    }

    urlapElrejtes()
    felhasznalokBetoltese()
}

async function szerepkorModositas(email, ujSzerep) {
    const { error } = await client
        .from('felhasznalok')
        .update({ szerep: ujSzerep })
        .eq('email', email)

    if (error) {
        alert('Hiba történt a módosítás során!')
        console.error(error)
        return
    }

    felhasznalokBetoltese()
}

async function torles(email) {
    if (!confirm('Biztosan törölni szeretnéd ezt a felhasználót?')) return

    const { error } = await client
        .from('felhasznalok')
        .delete()
        .eq('email', email)

    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }

    felhasznalokBetoltese()
}

async function felhasznalokBetoltese() {
    const lista = document.getElementById('felhasznalok-lista')

    const { data, error } = await client
        .from('felhasznalok')
        .select('*')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek felhasználók.</p>'
        return
    }

    lista.innerHTML = data.map(f => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${f.nev}</h3>
                <p>📧 ${f.email}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                <select onchange="szerepkorModositas('${f.email}', this.value)" class="szerepkor-select">
                    <option value="admin" ${f.szerep === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="kolléga" ${f.szerep === 'kolléga' ? 'selected' : ''}>Kolléga</option>
                    <option value="bérlő" ${f.szerep === 'bérlő' ? 'selected' : ''}>Bérlő</option>
                </select>
                <button onclick="torles('${f.email}')" class="torles-gomb">Törlés</button>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
felhasznalokBetoltese()