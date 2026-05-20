const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

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
    helyisegekBetolteseLegordulo()
    berlokBetolteseLegordulo()
}

function urlapElrejtes() {
    document.getElementById('urlap').classList.add('rejtett')
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

async function mentese() {
    const cim = document.getElementById('cim').value
    const helyiseg_id = document.getElementById('helyiseg_id').value
    const berlo_id = document.getElementById('berlo_id').value
    const kezdet = document.getElementById('kezdet').value
    const vege = document.getElementById('vege').value
    const letszam = document.getElementById('letszam').value
    const statusz = document.getElementById('statusz').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!cim || !helyiseg_id || !kezdet || !vege) {
        alert('A rendezvény neve, helyiség és időpontok kötelezők!')
        return
    }

    const { error } = await client
        .from('foglalasok')
        .insert([{ cim, helyiseg_id, berlo_id: berlo_id || null, kezdet, vege, letszam, statusz, megjegyzes }])

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    foglalasokBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a foglalást?')) return

    const { error } = await client
        .from('foglalasok')
        .delete()
        .eq('id', id)

    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }

    foglalasokBetoltese()
}

async function foglalasokBetoltese() {
    const lista = document.getElementById('foglalasok-lista')

    const { data, error } = await client
        .from('foglalasok')
        .select(`*, helyisegek (nev), berlok (nev)`)
        .order('kezdet', { ascending: true })

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek foglalások.</p>'
        return
    }

    lista.innerHTML = data.map(f => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${f.cim}</h3>
                <p>🏢 ${f.helyisegek.nev}</p>
                <p>👤 ${f.berlok ? f.berlok.nev : 'Ismeretlen vendég'}</p>
                <p>📅 ${new Date(f.kezdet).toLocaleString('hu-HU')} – ${new Date(f.vege).toLocaleString('hu-HU')}</p>
                <p>👥 ${f.letszam ?? 'Nincs megadva'} fő</p>
                <p>${f.megjegyzes ?? ''}</p>
            </div>
            <div>
                <span class="statusz ${f.statusz}">${f.statusz}</span>
                <button onclick="torles(${f.id})" class="torles-gomb">Törlés</button>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
foglalasokBetoltese()