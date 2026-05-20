const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const supabaseUrl = 'IDE_A_TE_PROJECT_URL-ED'
const supabaseKey = 'IDE_A_TE_ANON_KEY-ED'

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

function urlapMegjelenites() {
    document.getElementById('urlap').classList.remove('rejtett')
    berlokBetolteseLegordulo()
    helyisegekBetolteseLegordulo()
}

function urlapElrejtes() {
    document.getElementById('urlap').classList.add('rejtett')
}

async function berlokBetolteseLegordulo() {
    const select = document.getElementById('berlo_id')
    const { data } = await client.from('berlok').select('id, nev')
    data.forEach(b => {
        const option = document.createElement('option')
        option.value = b.id
        option.textContent = b.nev
        select.appendChild(option)
    })
}

async function helyisegekBetolteseLegordulo() {
    const select = document.getElementById('helyiseg_id')
    const { data } = await client.from('helyisegek').select('id, nev')
    data.forEach(h => {
        const option = document.createElement('option')
        option.value = h.id
        option.textContent = h.nev
        select.appendChild(option)
    })
}

async function mentese() {
    const berlo_id = document.getElementById('berlo_id').value
    const helyiseg_id = document.getElementById('helyiseg_id').value
    const kezdet = document.getElementById('kezdet').value
    const vege = document.getElementById('vege').value
    const havi_dij = document.getElementById('havi_dij').value
    const statusz = document.getElementById('statusz').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!berlo_id || !helyiseg_id || !kezdet) {
        alert('A bérlő, helyiség és kezdet dátum kötelező!')
        return
    }

    const { error } = await client
        .from('szerzodesek')
        .insert([{ berlo_id, helyiseg_id, kezdet, vege: vege || null, havi_dij, statusz, megjegyzes }])

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    szerzodesekBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a szerződést?')) return

    const { error } = await client
        .from('szerzodesek')
        .delete()
        .eq('id', id)

    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }

    szerzodesekBetoltese()
}

async function szerzodesekBetoltese() {
    const lista = document.getElementById('szerzodesek-lista')

    const { data, error } = await client
        .from('szerzodesek')
        .select(`*, berlok (nev), helyisegek (nev)`)

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek szerződések.</p>'
        return
    }

    lista.innerHTML = data.map(sz => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${sz.berlok.nev}</h3>
                <p>🏢 ${sz.helyisegek.nev}</p>
                <p>📅 ${sz.kezdet} – ${sz.vege ?? 'Határozatlan'}</p>
                <p>💰 ${sz.havi_dij ?? 'Nincs megadva'} Ft/hó</p>
                <p>${sz.megjegyzes ?? ''}</p>
            </div>
            <div>
                <span class="statusz ${sz.statusz}">${sz.statusz}</span>
                <button onclick="torles(${sz.id})" class="torles-gomb">Törlés</button>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
szerzodesekBetoltese()